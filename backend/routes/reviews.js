const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { postReview } = require('../controllers/reviewController');
const { Review, User, Lease } = require('../models');

// POST /api/reviews/:leaseId
router.post('/:leaseId', auth, postReview);

// Get reviews for a user (received reviews)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const reviews = await Review.findAll({ where: { reviewedUserId: req.params.userId }, include: [{ model: User, as: 'reviewer', attributes: ['id','name'] }, { model: Lease, as: 'lease' }] });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a lease
router.get('/lease/:leaseId', auth, async (req, res) => {
  try {
    const reviews = await Review.findAll({ where: { LeaseId: req.params.leaseId }, include: [{ model: User, as: 'reviewer', attributes: ['id','name'] }] });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
