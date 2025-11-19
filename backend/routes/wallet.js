const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Wallet, User, SecurityDeposit, Lease, Item } = require('../models');

// Get user's wallet
router.get('/', auth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ where: { UserId: req.user.id } });
    
    if (!wallet) {
      wallet = await Wallet.create({ UserId: req.user.id });
    }

    // Get all security deposits for this user
    const deposits = await SecurityDeposit.findAll({
      where: { UserId: req.user.id },
      include: [{ model: Lease, as: 'lease', include: [{ model: Item, as: 'item' }] }]
    });

    res.json({ wallet, deposits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add money to wallet
router.post('/add-money', auth, async (req, res) => {
  try {
    const { amount, transactionId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Get or create wallet
    let wallet = await Wallet.findOne({ where: { UserId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ UserId: req.user.id, balance: 0 });
    }

    // Add money to wallet
    wallet.balance = (wallet.balance || 0) + amount;
    await wallet.save();

    // Create transaction record
    const { Transaction } = require('../models');
    await Transaction.create({
      UserId: req.user.id,
      amount: amount,
      type: 'credit',
      description: `Added money to wallet${transactionId ? ` (Transaction ID: ${transactionId})` : ''}`
    });

    res.json({ 
      message: 'Money added successfully',
      wallet,
      amountAdded: amount
    });
  } catch (err) {
    console.error('Error adding money:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get wallet details by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ where: { UserId: req.params.userId } });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.json(wallet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process security deposit (when lease is approved)
router.post('/deposit', auth, async (req, res) => {
  try {
    const { leaseId, amount } = req.body;

    if (!leaseId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid lease ID or amount' });
    }

    const lease = await Lease.findByPk(leaseId);
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Only lessee can deposit
    if (lease.LesseeId !== req.user.id) {
      return res.status(403).json({ message: 'Only lessee can deposit for this lease' });
    }

    let wallet = await Wallet.findOne({ where: { UserId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ UserId: req.user.id });
    }

    // Check if security deposit already exists
    const existingDeposit = await SecurityDeposit.findOne({ where: { LeaseId: leaseId } });
    if (existingDeposit) {
      return res.status(400).json({ message: 'Security deposit already exists for this lease' });
    }

    // Create security deposit
    const securityDeposit = await SecurityDeposit.create({
      LeaseId: leaseId,
      UserId: req.user.id,
      amount: amount,
      status: 'held'
    });

    // Update wallet balance (deduct from user's balance for holding)
    wallet.balance -= amount;
    wallet.totalDeposited += amount;
    await wallet.save();

    res.json({ message: 'Security deposit created', securityDeposit, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark item as returned (start 24-hour refund countdown)
router.post('/return-item', auth, async (req, res) => {
  try {
    const { leaseId } = req.body;

    const securityDeposit = await SecurityDeposit.findOne({ where: { LeaseId: leaseId } });
    if (!securityDeposit) {
      return res.status(404).json({ message: 'Security deposit not found' });
    }

    // Only the lessee can mark item as returned
    if (securityDeposit.UserId !== req.user.id) {
      return res.status(403).json({ message: 'Only lessee can mark item as returned' });
    }

    securityDeposit.returnedAt = new Date();
    securityDeposit.refundDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
    await securityDeposit.save();

    res.json({ message: 'Item marked as returned. Refund will be processed in 24 hours.', securityDeposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Claim damage (owner claims from security deposit)
router.post('/claim-damage', auth, async (req, res) => {
  try {
    const { securityDepositId, damageDescription, damageAmount } = req.body;

    if (!securityDepositId || !damageAmount || damageAmount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit ID or damage amount' });
    }

    const securityDeposit = await SecurityDeposit.findByPk(securityDepositId, {
      include: [{ model: Lease, as: 'lease', include: [{ model: Item, as: 'item' }] }]
    });

    if (!securityDeposit) {
      return res.status(404).json({ message: 'Security deposit not found' });
    }

    // Only the item owner can claim damage
    const lease = securityDeposit.lease;
    const item = lease.item;
    
    if (item.OwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Only item owner can claim damage' });
    }

    if (securityDeposit.status !== 'held') {
      return res.status(400).json({ message: 'Can only claim damage on held deposits' });
    }

    // Claim the damage amount (max the deposit amount)
    const claimedAmount = Math.min(damageAmount, securityDeposit.amount);

    securityDeposit.status = 'claimed';
    securityDeposit.damageClaimed = true;
    securityDeposit.damageDescription = damageDescription;
    securityDeposit.damageAmount = claimedAmount;
    await securityDeposit.save();

    // Transfer amount to owner's wallet
    let ownerWallet = await Wallet.findOne({ where: { UserId: item.OwnerId } });
    if (!ownerWallet) {
      ownerWallet = await Wallet.create({ UserId: item.OwnerId });
    }

    ownerWallet.balance += claimedAmount;
    ownerWallet.totalClaimed += claimedAmount;
    await ownerWallet.save();

    res.json({ 
      message: 'Damage claim processed', 
      securityDeposit, 
      claimedAmount,
      ownerWallet 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process refund (automatically after 24 hours or manually if no damage claimed)
router.post('/refund', auth, async (req, res) => {
  try {
    const { securityDepositId } = req.body;

    const securityDeposit = await SecurityDeposit.findByPk(securityDepositId);
    if (!securityDeposit) {
      return res.status(404).json({ message: 'Security deposit not found' });
    }

    // Only the lessee can request refund
    if (securityDeposit.UserId !== req.user.id) {
      return res.status(403).json({ message: 'Only lessee can request refund' });
    }

    if (securityDeposit.status === 'refunded') {
      return res.status(400).json({ message: 'Already refunded' });
    }

    if (securityDeposit.status === 'claimed') {
      return res.status(400).json({ message: 'Cannot refund claimed deposits' });
    }

    // Check if 24 hours have passed since item was returned
    if (securityDeposit.returnedAt) {
      const hoursSinceReturn = (Date.now() - new Date(securityDeposit.returnedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceReturn < 24) {
        return res.status(400).json({ message: `Refund available in ${Math.ceil(24 - hoursSinceReturn)} hours` });
      }
    }

    securityDeposit.status = 'refunded';
    securityDeposit.refundedAt = new Date();
    await securityDeposit.save();

    // Return amount to user's wallet
    let wallet = await Wallet.findOne({ where: { UserId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ UserId: req.user.id });
    }

    wallet.balance += securityDeposit.amount;
    wallet.totalRefunded += securityDeposit.amount;
    await wallet.save();

    res.json({ message: 'Security deposit refunded', securityDeposit, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all security deposits (for admin/dashboard)
router.get('/deposits/all', auth, async (req, res) => {
  try {
    const deposits = await SecurityDeposit.findAll({
      include: [
        { model: Lease, as: 'lease' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(deposits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process lease payment (rental cost + security deposit)
router.post('/process-lease-payment', auth, async (req, res) => {
  try {
    const { leaseId, rentalCost, securityDeposit, ownerId } = req.body;

    if (!leaseId || !rentalCost || rentalCost <= 0) {
      return res.status(400).json({ message: 'Invalid lease ID or rental cost' });
    }

    const lease = await Lease.findByPk(leaseId, {
      include: [{ model: require('../models').Item, as: 'item' }]
    });
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Only lessee can pay for this lease
    if (lease.LesseeId !== req.user.id) {
      return res.status(403).json({ message: 'Only lessee can pay for this lease' });
    }

    // Get lessee's wallet
    let lesseeWallet = await Wallet.findOne({ where: { UserId: req.user.id } });
    if (!lesseeWallet) {
      lesseeWallet = await Wallet.create({ UserId: req.user.id, balance: 0 });
    }

    const totalAmount = rentalCost + (securityDeposit || 0);

    // Check if lessee has sufficient balance
    if (lesseeWallet.balance < totalAmount) {
      return res.status(400).json({ 
        message: 'Insufficient wallet balance',
        required: totalAmount,
        current: lesseeWallet.balance,
        shortfall: totalAmount - lesseeWallet.balance
      });
    }

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
    let securityDepositRecord = null;
    if (securityDeposit && securityDeposit > 0) {
      // Deduct security deposit from lessee's wallet (hold it, don't transfer)
      lesseeWallet.balance -= securityDeposit;
      lesseeWallet.totalDeposited = (lesseeWallet.totalDeposited || 0) + securityDeposit;
      await lesseeWallet.save();

      // Create security deposit record (kept in user's wallet but locked)
      securityDepositRecord = await SecurityDeposit.create({
        LeaseId: leaseId,
        UserId: req.user.id,
        amount: securityDeposit,
        status: 'held'
      });
    }

    // Activate the lease and mark item as unavailable
    lease.status = 'active';
    await lease.save();

    if (lease.item) {
      lease.item.availability = false;
      await lease.item.save();
    }

    // Create payment record
    const { Payment } = require('../models');
    await Payment.create({
      LeaseId: leaseId,
      amount: rentalCost,
      mode: 'wallet',
      status: 'paid',
      paymentType: 'rental'
    });

    res.json({ 
      message: 'Payment processed successfully',
      lesseeWallet,
      ownerWallet,
      securityDeposit: securityDepositRecord,
      amountPaidToOwner: rentalCost,
      securityDepositHeld: securityDeposit || 0,
      lease
    });
  } catch (err) {
    console.error('Error processing lease payment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
