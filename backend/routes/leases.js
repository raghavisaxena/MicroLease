const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Lease, Item, Payment, User } = require('../models');
const { calculateRScore } = require('../lib/rscore');

// Request lease (any authenticated user can lease items)
router.post('/', auth, async (req, res) => {
  try {
    const { ItemId, startDate, endDate } = req.body;
    const item = await Item.findByPk(ItemId);
    if (!item || !item.availability) return res.status(400).json({ message: 'Item not available' });
    // Prevent owner from leasing their own item
    if (item.OwnerId === req.user.id) {
      return res.status(403).json({ message: "Owners cannot lease their own items" });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e) || e < s) return res.status(400).json({ message: 'Invalid dates' });

    const days = Math.ceil((e - s) / (1000*60*60*24)) + 1;
    const amount = days * item.pricePerDay;
    const securityDepositAmount = Math.round(amount * 0.15);

    // Create lease with pending status (will be activated after payment)
    const lease = await Lease.create({ 
      ItemId, 
      LesseeId: req.user.id, 
      startDate, 
      endDate, 
      amount, 
      securityDepositAmount,
      status: 'pending' 
    });
    
    res.json(lease);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Owner approves/rejects
router.post('/:id/decision', auth, async (req, res) => {
  try {
    const { action, securityDeposit } = req.body; // 'approve' or 'reject', optional securityDeposit
    const lease = await Lease.findByPk(req.params.id, { include: [{ model: Item, as: 'item' }] });
    if (!lease) return res.status(404).json({ message: 'Lease not found' });
    const ownerId = lease.item.OwnerId;
    if (req.user.id !== ownerId) return res.status(403).json({ message: 'Only owner can decide' });

    if (action === 'approve') {
      // Get lessee's wallet
      const { Wallet, SecurityDeposit } = require('../models');
      let lesseeWallet = await Wallet.findOne({ where: { UserId: lease.LesseeId } });
      if (!lesseeWallet) {
        lesseeWallet = await Wallet.create({ UserId: lease.LesseeId, balance: 0 });
      }

      const rentalCost = lease.amount;
      const securityDepositAmount = securityDeposit !== undefined && securityDeposit !== null ? securityDeposit : lease.securityDepositAmount || 0;
      const totalAmount = rentalCost + securityDepositAmount;

      // Check if lessee has sufficient balance
      if (lesseeWallet.balance < totalAmount) {
        return res.status(400).json({ 
          message: 'Lessee has insufficient wallet balance',
          required: totalAmount,
          current: lesseeWallet.balance,
          shortfall: totalAmount - lesseeWallet.balance
        });
      }

      // Update security deposit amount
      lease.securityDepositAmount = securityDepositAmount;

      // Deduct rental cost from lessee and add to owner
      lesseeWallet.balance -= rentalCost;
      await lesseeWallet.save();

      // Credit rental cost to owner's wallet
      let ownerWallet = await Wallet.findOne({ where: { UserId: ownerId } });
      if (!ownerWallet) {
        ownerWallet = await Wallet.create({ UserId: ownerId, balance: 0 });
      }
      ownerWallet.balance += rentalCost;
      ownerWallet.totalClaimed = (ownerWallet.totalClaimed || 0) + rentalCost;
      await ownerWallet.save();

      // Handle security deposit if provided
      if (securityDepositAmount > 0) {
        // Deduct security deposit from lessee's wallet (hold it, don't transfer)
        lesseeWallet.balance -= securityDepositAmount;
        lesseeWallet.totalDeposited = (lesseeWallet.totalDeposited || 0) + securityDepositAmount;
        await lesseeWallet.save();

        // Create security deposit record (kept in user's wallet but locked)
        await SecurityDeposit.create({
          LeaseId: lease.id,
          UserId: lease.LesseeId,
          amount: securityDepositAmount,
          status: 'held'
        });
      }

      // Activate the lease and mark item as unavailable
      lease.status = 'active';
      await lease.save();

      const item = lease.item;
      item.availability = false;
      await item.save();

      // Create payment record
      const payment = await Payment.create({ 
        LeaseId: lease.id, 
        amount: rentalCost, 
        mode: 'wallet', 
        status: 'paid',
        paymentType: 'rental'
      });

      res.json({ lease, payment, message: 'Lease approved and payment processed successfully' });
    } else if (action === 'reject') {
      lease.status = 'rejected';
      await lease.save();
      res.json(lease);
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leases for items owned by current user
router.get('/owned', auth, async (req, res) => {
  try {
    const items = await Item.findAll({ where: { OwnerId: req.user.id } });
    const itemIds = items.map(i => i.id);
    const leasesAsOwner = await Lease.findAll({ 
      where: { ItemId: itemIds }, 
      include: [{ model: Item, as: 'item' }, { model: User, as: 'lessee', attributes: ['id', 'name', 'email'] }, { model: Payment, as: 'payment' }] 
    });
    res.json(leasesAsOwner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leases borrowed by current user
router.get('/borrowed', auth, async (req, res) => {
  try {
    const leasesAsLessee = await Lease.findAll({ 
      where: { LesseeId: req.user.id }, 
      include: [{ model: Item, as: 'item', include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }] }, { model: Payment, as: 'payment' }] 
    });
    res.json(leasesAsLessee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leases for current user (any authenticated user can see both items they own and leases they've made)
router.get('/', auth, async (req, res) => {
  try {
    // Get leases for items they own
    const items = await Item.findAll({ where: { OwnerId: req.user.id } });
    const itemIds = items.map(i => i.id);
    const leasesAsOwner = await Lease.findAll({ 
      where: { ItemId: itemIds }, 
      include: [{ model: Item, as: 'item' }, { model: User, as: 'lessee' }, { model: Payment, as: 'payment' }] 
    });

    // Get leases they've made (as lessee)
    const leasesAsLessee = await Lease.findAll({ 
      where: { LesseeId: req.user.id }, 
      include: [{ model: Item, as: 'item' }, { model: Payment, as: 'payment' }] 
    });

    // Combine and return all leases
    res.json({ 
      asOwner: leasesAsOwner,
      asLessee: leasesAsLessee,
      all: [...leasesAsOwner, ...leasesAsLessee]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update lease (extend lease or return early)
router.put('/:id', auth, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, { include: [{ model: Item, as: 'item' }] });
    if (!lease) return res.status(404).json({ message: 'Lease not found' });
    
    // Check if user is the borrower (for extending/returning) or owner (for status updates)
    const isBorrower = lease.LesseeId === req.user.id;
    const isOwner = lease.item && lease.item.OwnerId === req.user.id;
    
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ message: 'Only borrower or owner can update this lease' });
    }

    const { endDate, status } = req.body;
    
    // Extend lease (borrower only)
    if (endDate && isBorrower) {
      const newEndDate = new Date(endDate);
      const currentEndDate = new Date(lease.endDate);
      
      if (newEndDate <= currentEndDate) {
        return res.status(400).json({ message: 'New end date must be after current end date' });
      }
      
      // Recalculate amount
      const days = Math.ceil((newEndDate - new Date(lease.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      const newAmount = days * lease.item.pricePerDay;
      
      lease.endDate = endDate;
      lease.amount = newAmount;
    }
    
    // Return early or update status (borrower or owner)
    if (status && (isBorrower || isOwner)) {
      if (['active', 'completed', 'cancelled'].includes(status)) {
        lease.status = status;
        
        // If returning/completing, make item available again
        if (status === 'completed' || status === 'cancelled') {
          lease.item.availability = true;
          await lease.item.save();
        }
      } else {
        return res.status(400).json({ message: 'Invalid status' });
      }
    }
    
    await lease.save();
    res.json(lease);
  } catch (err) {
    console.error('Error updating lease:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete lease and mark item returned with condition
// PUT /api/lease/complete/:leaseId
router.put('/complete/:leaseId', auth, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.leaseId, { include: [{ model: Item, as: 'item' }, { model: User, as: 'lessee' }] });
    if (!lease) return res.status(404).json({ message: 'Lease not found' });

    // Only owner or lessee can mark complete
    const isLessee = lease.LesseeId === req.user.id;
    const isOwner = lease.item && lease.item.OwnerId === req.user.id;
    if (!isLessee && !isOwner) return res.status(403).json({ message: 'Not authorized' });

    const { condition, returnedAt } = req.body; // condition: 'good'|'damaged'|'lost'

    lease.returned = true;
    lease.returnedAt = returnedAt ? new Date(returnedAt) : new Date();
    lease.returnCondition = condition || 'good';

    // Determine timeliness
    const plannedEnd = new Date(lease.endDate);
    const actualReturn = new Date(lease.returnedAt);
    lease.returnedOnTime = actualReturn <= plannedEnd;

    lease.status = 'completed';
    await lease.save();

    // Make item available again
    if (lease.item) {
      lease.item.availability = true;
      await lease.item.save();
    }

    // Update user stats for the lessee (borrower)
    const borrower = await User.findByPk(lease.LesseeId);
    if (borrower) {
      borrower.completedLeases = (borrower.completedLeases || 0) + 1;
      if (lease.returnedOnTime) borrower.onTimeReturns = (borrower.onTimeReturns || 0) + 1;
      else borrower.lateReturns = (borrower.lateReturns || 0) + 1;

      if (lease.returnCondition === 'good') borrower.goodConditionReturns = (borrower.goodConditionReturns || 0) + 1;
      if (lease.returnCondition === 'damaged') borrower.damageReports = (borrower.damageReports || 0) + 1;
      if (lease.returnCondition === 'lost') borrower.lostItems = (borrower.lostItems || 0) + 1;

      // Recalculate rscore
      borrower.rscore = calculateRScore({
        onTimeReturns: borrower.onTimeReturns,
        lateReturns: borrower.lateReturns,
        goodConditionReturns: borrower.goodConditionReturns,
        damageReports: borrower.damageReports,
        lostItems: borrower.lostItems,
        disputesWon: borrower.disputesWon,
        disputesLost: borrower.disputesLost,
        ratingImpactSum: borrower.ratingImpactSum,
        completedLeases: borrower.completedLeases
      });

      await borrower.save();
    }

    res.json({ lease, message: 'Lease completed and stats updated' });
  } catch (err) {
    console.error('Error completing lease', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
