const express = require('express');
const router = express.Router();
const { User, Item, Lease } = require('../models');
const { Op } = require('sequelize');

// Get user details including best-effort location and a simple RScore
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: ['id','name','email'] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Best-effort: find a recent item for this user to infer location
    const recentItem = await Item.findOne({ where: { OwnerId: user.id, location: { [Op.ne]: null } }, order: [['createdAt','DESC']] });
    const location = recentItem ? recentItem.location : null;

    // Compute a simple RScore: completed leases as lessee / total leases as lessee (0-100)
    const totalAsLessee = await Lease.count({ where: { LesseeId: user.id } });
    const completedAsLessee = await Lease.count({ where: { LesseeId: user.id, status: 'completed' } });
    const rscore = totalAsLessee > 0 ? Math.round((completedAsLessee / totalAsLessee) * 100) : null;

    res.json({ id: user.id, name: user.name, email: user.email, location, rscore, totalAsLessee, completedAsLessee });
  } catch (err) {
    console.error('GET /api/users/:id error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
