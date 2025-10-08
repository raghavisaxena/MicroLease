const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Lease, Item, Payment, User } = require('../models');

// Request lease (lessee)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lessee') return res.status(403).json({ message: 'Only lessees can request leases' });
    const { ItemId, startDate, endDate } = req.body;
    const item = await Item.findByPk(ItemId);
    if (!item || !item.availability) return res.status(400).json({ message: 'Item not available' });

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e) || e < s) return res.status(400).json({ message: 'Invalid dates' });

    const days = Math.ceil((e - s) / (1000*60*60*24)) + 1;
    const amount = days * item.pricePerDay;

    const lease = await Lease.create({ ItemId, LesseeId: req.user.id, startDate, endDate, amount, status: 'pending' });
    res.json(lease);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Owner approves/rejects
router.post('/:id/decision', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const lease = await Lease.findByPk(req.params.id, { include: [{ model: Item, as: 'item' }] });
    if (!lease) return res.status(404).json({ message: 'Lease not found' });
    const ownerId = lease.item.OwnerId;
    if (req.user.id !== ownerId) return res.status(403).json({ message: 'Only owner can decide' });

    if (action === 'approve') {
      lease.status = 'approved';
      await lease.save();
      const payment = await Payment.create({ LeaseId: lease.id, amount: lease.amount, mode: 'mock', status: 'paid' });
      const item = lease.item;
      item.availability = false;
      await item.save();
      res.json({ lease, payment });
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

// Get leases for current user
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'lessor') {
      // owner: find leases for their items
      const items = await Item.findAll({ where: { OwnerId: req.user.id } });
      const itemIds = items.map(i => i.id);
      const leases = await Lease.findAll({ where: { ItemId: itemIds }, include: ['item','lessee','payment'] });
      return res.json(leases);
    } else {
      // lessee: their leases
      const leases = await Lease.findAll({ where: { LesseeId: req.user.id }, include: ['item','payment'] });
      return res.json(leases);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
