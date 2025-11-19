const { Review, Lease, User, Item } = require('../models');
const { calculateRScore } = require('../lib/rscore');

async function postReview(req, res) {
  try {
    const leaseId = req.params.leaseId;
    const { rating, comment, reviewedUserId } = req.body;
    const reviewerId = req.user.id;

    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Invalid rating' });

    const lease = await Lease.findByPk(leaseId, { include: [{ model: Item, as: 'item' }] });
    if (!lease) return res.status(404).json({ message: 'Lease not found' });

    // Only parties involved in lease can review
    const isLessee = lease.LesseeId === reviewerId;
    const isOwner = lease.item && lease.item.OwnerId === reviewerId;
    if (!isLessee && !isOwner) return res.status(403).json({ message: 'You are not part of this lease' });

    // Save review
    const review = await Review.create({ LeaseId: leaseId, reviewerId, reviewedUserId, rating, comment });

    // Update ratingImpactSum on reviewed user: (rating - 3) * 2.5
    const impact = (rating - 3) * 2.5;
    const reviewed = await User.findByPk(reviewedUserId);
    if (reviewed) {
      reviewed.ratingImpactSum = (reviewed.ratingImpactSum || 0) + impact;
      // Recalculate rscore using available stats
      const newScore = calculateRScore({
        onTimeReturns: reviewed.onTimeReturns,
        lateReturns: reviewed.lateReturns,
        goodConditionReturns: reviewed.goodConditionReturns,
        damageReports: reviewed.damageReports,
        lostItems: reviewed.lostItems,
        disputesWon: reviewed.disputesWon,
        disputesLost: reviewed.disputesLost,
        ratingImpactSum: reviewed.ratingImpactSum,
        completedLeases: reviewed.completedLeases
      });
      reviewed.rscore = newScore;
      await reviewed.save();
    }

    res.json({ review });
  } catch (err) {
    console.error('Error posting review', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { postReview };
