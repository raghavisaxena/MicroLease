// rscore calculation helper
function calculateRScore(stats) {
  // stats: object with fields described in requirements
  let score = 80; // base

  // Add for on-time returns
  score += (stats.onTimeReturns || 0) * 5;
  // good condition
  score += (stats.goodConditionReturns || 0) * 3;
  // rating impact sum already aggregated (sum of (rating-3)*2.5)
  score += (stats.ratingImpactSum || 0);
  // penalties
  score -= (stats.lateReturns || 0) * 10;
  score -= (stats.damageReports || 0) * 15;
  score -= (stats.lostItems || 0) * 40;
  // disputes
  score += (stats.disputesWon || 0) * 10;
  score -= (stats.disputesLost || 0) * 20;

  // Every 5 successful leases -> +10
  const completed = stats.completedLeases || 0;
  const bonusGroups = Math.floor(completed / 5);
  score += bonusGroups * 10;

  // Cap
  if (score > 100) score = 100;
  if (score < 0) score = 0;
  return Math.round(score * 100) / 100;
}

function levelFromScore(score) {
  if (score >= 90) return 'A - Excellent';
  if (score >= 75) return 'B - Good';
  if (score >= 50) return 'C - Fair';
  return 'D - Poor';
}

module.exports = { calculateRScore, levelFromScore };
