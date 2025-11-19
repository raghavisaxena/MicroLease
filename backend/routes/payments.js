const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Payment, Lease, Wallet, Transaction } = require('../models');

// List payments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process security deposit payment
router.post('/security-deposit', auth, async (req, res) => {
  try {
    const { leaseId, transactionId, amount } = req.body;

    const lease = await Lease.findByPk(leaseId, { 
      include: [{ model: require('../models').Item, as: 'item' }] 
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Verify the user is the lessee
    if (lease.LesseeId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create payment record
    const payment = await Payment.create({
      LeaseId: leaseId,
      amount: amount,
      mode: 'mock_gateway',
      status: 'paid',
      transactionId: transactionId,
      paymentType: 'security_deposit'
    });

    // Deduct from renter's wallet (if they have one)
    let wallet = await Wallet.findOne({ where: { UserId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ UserId: req.user.id, balance: 0 });
    }

    // Record transaction
    await Transaction.create({
      UserId: req.user.id,
      amount: amount,
      type: 'debit',
      description: `Security deposit payment for lease #${leaseId}`
    });

    res.json({ 
      success: true, 
      payment,
      message: 'Security deposit payment processed successfully'
    });

  } catch (error) {
    console.error('Error processing security deposit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process final payment to owner on lease completion
router.post('/final-payment', auth, async (req, res) => {
  try {
    const { leaseId, transactionId } = req.body;

    const lease = await Lease.findByPk(leaseId, { 
      include: [{ model: require('../models').Item, as: 'item' }] 
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Only lessee can make final payment
    if (lease.LesseeId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (lease.status !== 'completed') {
      return res.status(400).json({ message: 'Lease must be completed first' });
    }

    const ownerId = lease.item.OwnerId;
    const rentalAmount = lease.amount;
    const securityDeposit = lease.securityDepositAmount || 0;

    // Check if final payment already made
    const existingPayment = await Payment.findOne({
      where: { 
        LeaseId: leaseId, 
        paymentType: 'full_payment'
      }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Final payment already processed' });
    }

    // Create payment record for full amount
    const payment = await Payment.create({
      LeaseId: leaseId,
      amount: rentalAmount + securityDeposit,
      mode: 'mock_gateway',
      status: 'paid',
      transactionId: transactionId,
      paymentType: 'full_payment'
    });

    // Credit to owner's wallet
    let ownerWallet = await Wallet.findOne({ where: { UserId: ownerId } });
    if (!ownerWallet) {
      ownerWallet = await Wallet.create({ UserId: ownerId, balance: 0 });
    }

    ownerWallet.balance = (ownerWallet.balance || 0) + rentalAmount + securityDeposit;
    ownerWallet.totalClaimed = (ownerWallet.totalClaimed || 0) + rentalAmount + securityDeposit;
    await ownerWallet.save();

    // Record transaction for owner
    await Transaction.create({
      UserId: ownerId,
      amount: rentalAmount + securityDeposit,
      type: 'credit',
      description: `Payment received for lease #${leaseId} (Rental: ₹${rentalAmount} + Security Deposit: ₹${securityDeposit})`
    });

    res.json({ 
      success: true, 
      payment,
      ownerWallet,
      message: 'Final payment processed and credited to owner successfully'
    });

  } catch (error) {
    console.error('Error processing final payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
