const { User } = require('../models');
const { levelFromScore } = require('../lib/rscore');

async function getRScore(req, res) {
  try {
    const userId = req.params.userId;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const rscore = user.rscore || 0;
    const level = levelFromScore(rscore);
    res.json({ rscore, level });
  } catch (err) {
    console.error('Error fetching rscore', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getRScore };
