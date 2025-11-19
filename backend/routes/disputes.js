const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Dispute, User, Item, Lease, sequelize } = require('../models');
const { Op } = require('sequelize');

// Create a new dispute/complaint
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, againstUser, LeaseId, ItemId } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    // Get user details
    const user = await User.findByPk(req.user.id);
    
    // Determine RenterId and OwnerId based on lease if provided
    let renterId = req.user.id;
    let ownerId = null;
    let itemId = ItemId || null;

    if (LeaseId) {
      const lease = await Lease.findByPk(LeaseId, { 
        include: [{ model: Item, as: 'item' }] 
      });
      if (lease) {
        renterId = lease.LesseeId;
        ownerId = lease.item?.OwnerId || null;
        itemId = lease.ItemId;
      }
    }

    const dispute = await Dispute.create({
      LeaseId: LeaseId || null,
      ItemId: itemId,
      RenterId: renterId,
      OwnerId: ownerId,
      description: description.trim(),
      status: 'open',
      type: type || 'complaint',
      againstUser: againstUser || null,
      reportedBy: req.user.id,
    });

    res.status(201).json({
      message: type === 'complaint' ? 'Complaint filed successfully' : 'Feedback submitted successfully',
      dispute
    });
  } catch (err) {
    console.error('Create dispute error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user's disputes
router.get('/my', auth, async (req, res) => {
  try {
    const disputes = await Dispute.findAll({
      where: {
        [Op.or]: [
          { RenterId: req.user.id },
          { OwnerId: req.user.id },
          { reportedBy: req.user.id }
        ]
      },
      include: [
        { model: Lease, as: 'lease' },
        { model: Item, as: 'item' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(disputes);
  } catch (err) {
    console.error('Get disputes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific dispute
router.get('/:id', auth, async (req, res) => {
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

    // Check if user is involved in the dispute
    if (
      dispute.RenterId !== req.user.id &&
      dispute.OwnerId !== req.user.id &&
      dispute.reportedBy !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(dispute);
  } catch (err) {
    console.error('Get dispute error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
