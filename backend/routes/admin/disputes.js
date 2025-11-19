const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/adminMiddleware');
const { Dispute, Lease, Item, User, Wallet, Transaction } = require('../../models');
const { calculateRScore } = require('../../lib/rscore');

// All routes protected by auth + admin middleware
router.use(auth);
router.use(adminMiddleware);

// GET /admin/disputes - Get all disputes
router.get('/', async (req, res) => {
  try {
    const disputes = await Dispute.findAll({
      include: [
        { model: Lease, as: 'lease' },
        { model: Item, as: 'item' }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Fetch renter, owner, and reporter details separately
    const disputesWithUsers = await Promise.all(disputes.map(async (dispute) => {
      const renter = dispute.RenterId ? await User.findByPk(dispute.RenterId, { attributes: ['id', 'name', 'email'] }) : null;
      const owner = dispute.OwnerId ? await User.findByPk(dispute.OwnerId, { attributes: ['id', 'name', 'email'] }) : null;
      const reporter = dispute.reportedBy ? await User.findByPk(dispute.reportedBy, { attributes: ['id', 'name', 'email'] }) : null;
      
      return {
        ...dispute.toJSON(),
        renter,
        owner,
        reporter
      };
    }));

    res.json(disputesWithUsers);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/disputes/:id - Get dispute details
router.get('/:id', async (req, res) => {
  try {
    const dispute = await Dispute.findByPk(req.params.id, {
      include: [
        { model: Lease, as: 'lease' },
        { model: Item, as: 'item' }
      ]
    });

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const renter = dispute.RenterId ? await User.findByPk(dispute.RenterId, { attributes: ['id', 'name', 'email'] }) : null;
    const owner = dispute.OwnerId ? await User.findByPk(dispute.OwnerId, { attributes: ['id', 'name', 'email'] }) : null;
    const reporter = dispute.reportedBy ? await User.findByPk(dispute.reportedBy, { attributes: ['id', 'name', 'email'] }) : null;

    res.json({
      ...dispute.toJSON(),
      renter,
      owner,
      reporter
    });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/disputes/:id/resolve - Resolve dispute
router.post('/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body; // 'refund_to_owner' or 'refund_to_renter'
    
    if (!['refund_to_owner', 'refund_to_renter'].includes(resolution)) {
      return res.status(400).json({ message: 'Invalid resolution type' });
    }

    const dispute = await Dispute.findByPk(req.params.id);
    
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status === 'resolved') {
      return res.status(400).json({ message: 'Dispute already resolved' });
    }

    // Get renter and owner
    const renter = await User.findByPk(dispute.RenterId);
    const owner = await User.findByPk(dispute.OwnerId);

    if (!renter || !owner) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get or create wallets
    let renterWallet = await Wallet.findOne({ where: { UserId: renter.id } });
    if (!renterWallet) {
      renterWallet = await Wallet.create({ UserId: renter.id, balance: 0 });
    }

    let ownerWallet = await Wallet.findOne({ where: { UserId: owner.id } });
    if (!ownerWallet) {
      ownerWallet = await Wallet.create({ UserId: owner.id, balance: 0 });
    }

    const depositAmount = dispute.depositAmount || 0;

    // Process refund
    if (resolution === 'refund_to_owner') {
      // Owner wins - refund deposit to owner
      ownerWallet.balance = (ownerWallet.balance || 0) + depositAmount;
      await ownerWallet.save();

      // Create transaction for owner (credit)
      await Transaction.create({
        UserId: owner.id,
        amount: depositAmount,
        type: 'credit',
        description: `Dispute resolution refund for dispute #${dispute.id}`
      });

      // Update R-Scores - penalize renter, reward owner
      renter.disputesLost = (renter.disputesLost || 0) + 1;
      owner.disputesWon = (owner.disputesWon || 0) + 1;

    } else {
      // Renter wins - refund deposit to renter
      renterWallet.balance = (renterWallet.balance || 0) + depositAmount;
      await renterWallet.save();

      // Create transaction for renter (credit)
      await Transaction.create({
        UserId: renter.id,
        amount: depositAmount,
        type: 'credit',
        description: `Dispute resolution refund for dispute #${dispute.id}`
      });

      // Update R-Scores - penalize owner, reward renter
      owner.disputesLost = (owner.disputesLost || 0) + 1;
      renter.disputesWon = (renter.disputesWon || 0) + 1;
    }

    // Recalculate R-Scores for both users
    renter.rscore = calculateRScore({
      onTimeReturns: renter.onTimeReturns,
      lateReturns: renter.lateReturns,
      goodConditionReturns: renter.goodConditionReturns,
      damageReports: renter.damageReports,
      lostItems: renter.lostItems,
      disputesWon: renter.disputesWon,
      disputesLost: renter.disputesLost,
      ratingImpactSum: renter.ratingImpactSum,
      completedLeases: renter.completedLeases
    });

    owner.rscore = calculateRScore({
      onTimeReturns: owner.onTimeReturns,
      lateReturns: owner.lateReturns,
      goodConditionReturns: owner.goodConditionReturns,
      damageReports: owner.damageReports,
      lostItems: owner.lostItems,
      disputesWon: owner.disputesWon,
      disputesLost: owner.disputesLost,
      ratingImpactSum: owner.ratingImpactSum,
      completedLeases: owner.completedLeases
    });

    await renter.save();
    await owner.save();

    // Update dispute
    dispute.status = 'resolved';
    dispute.resolution = resolution;
    await dispute.save();

    res.json({
      message: 'Dispute resolved successfully',
      dispute,
      winner: resolution === 'refund_to_owner' ? 'owner' : 'renter',
      refundAmount: depositAmount
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/disputes/:id/close - Close dispute without refund (for complaints/feedback)
router.post('/:id/close', async (req, res) => {
  try {
    const dispute = await Dispute.findByPk(req.params.id);
    
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      return res.status(400).json({ message: 'Dispute already closed' });
    }

    // Update dispute status
    dispute.status = 'closed';
    dispute.resolution = 'no_action';
    await dispute.save();

    res.json({
      message: 'Dispute closed successfully',
      dispute
    });

  } catch (error) {
    console.error('Error closing dispute:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
