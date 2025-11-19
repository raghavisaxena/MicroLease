const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/adminMiddleware');
const { Item, User, Lease } = require('../../models');

// All routes protected by auth + admin middleware
router.use(auth);
router.use(adminMiddleware);

// GET /admin/items - Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Lease, as: 'leases', attributes: ['id', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /admin/items/:id/approve - Approve/reject item
router.put('/:id/approve', async (req, res) => {
  try {
    const { approved } = req.body;
    const item = await Item.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.approved = approved;
    await item.save();

    res.json({ message: `Item ${approved ? 'approved' : 'rejected'} successfully`, item });
  } catch (error) {
    console.error('Error approving item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /admin/items/:id - Update item
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { title, description, category, pricePerDay, location, condition, availability, approved } = req.body;
    
    if (title) item.title = title;
    if (description !== undefined) item.description = description;
    if (category) item.category = category;
    if (pricePerDay) item.pricePerDay = pricePerDay;
    if (location) item.location = location;
    if (condition) item.condition = condition;
    if (availability !== undefined) item.availability = availability;
    if (approved !== undefined) item.approved = approved;

    await item.save();

    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /admin/items/:id - Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.destroy();

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/items/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Lease, as: 'leases' }
      ]
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
