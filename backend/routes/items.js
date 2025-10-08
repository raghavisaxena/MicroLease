const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Item, User } = require('../models');

// Create item (lessor)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lessor') return res.status(403).json({ message: 'Only lessors can add items' });
    const { title, description, category, pricePerDay, imageUrl } = req.body;
    const item = await Item.create({ title, description, category, pricePerDay, imageUrl, OwnerId: req.user.id });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all available items
router.get('/', async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { availability: true },
      include: [{ model: User, as: 'owner', attributes: ['id','name','email'] }]
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get item by id
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, { include: [{ model: User, as: 'owner', attributes: ['id','name','email'] }] });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
