const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/adminMiddleware');
const { User, Lease, Item } = require('../../models');

// All routes protected by auth + admin middleware
router.use(auth);
router.use(adminMiddleware);

// GET /admin/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Lease, as: 'leases', attributes: ['id', 'status'] },
        { model: Item, as: 'items', attributes: ['id', 'title', 'approved'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /admin/users/:id/ban - Ban/unban user
router.put('/:id/ban', async (req, res) => {
  try {
    const { banned } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban admin users' });
    }

    user.banned = banned;
    await user.save();

    res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/users/:id - Get single user details
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Lease, as: 'leases' },
        { model: Item, as: 'items' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
