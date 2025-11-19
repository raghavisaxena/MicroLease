const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/adminMiddleware');
const { User, Item, Dispute, Transaction, Lease } = require('../../models');

// All routes protected by auth + admin middleware
router.use(auth);
router.use(adminMiddleware);

// GET /admin/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Count totals
    const totalUsers = await User.count({ where: { role: ['lessee', 'lessor'] } });
    const bannedUsers = await User.count({ where: { banned: true } });
    const totalItems = await Item.count();
    const approvedItems = await Item.count({ where: { approved: true } });
    const pendingItems = await Item.count({ where: { approved: false } });
    const totalDisputes = await Dispute.count();
    const pendingDisputes = await Dispute.count({ where: { status: 'pending' } });
    const resolvedDisputes = await Dispute.count({ where: { status: 'resolved' } });
    const totalTransactions = await Transaction.count();
    const totalLeases = await Lease.count();
    const activeLeases = await Lease.count({ where: { status: ['active', 'approved'] } });
    const completedLeases = await Lease.count({ where: { status: 'completed' } });

    // Calculate total transaction volume
    const creditSum = await Transaction.sum('amount', { where: { type: 'credit' } }) || 0;
    const debitSum = await Transaction.sum('amount', { where: { type: 'debit' } }) || 0;

    res.json({
      users: {
        total: totalUsers,
        banned: bannedUsers,
        active: totalUsers - bannedUsers
      },
      items: {
        total: totalItems,
        approved: approvedItems,
        pending: pendingItems
      },
      disputes: {
        total: totalDisputes,
        pending: pendingDisputes,
        resolved: resolvedDisputes
      },
      transactions: {
        total: totalTransactions,
        totalCredit: creditSum,
        totalDebit: debitSum,
        netFlow: creditSum - debitSum
      },
      leases: {
        total: totalLeases,
        active: activeLeases,
        completed: completedLeases
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
