const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/adminMiddleware');
const { Transaction, User } = require('../../models');
const { Op } = require('sequelize');

// All routes protected by auth + admin middleware
router.use(auth);
router.use(adminMiddleware);

// GET /admin/transactions - Get all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { userId, type, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    const where = {};
    
    if (userId) {
      where.UserId = userId;
    }
    
    if (type && ['credit', 'debit'].includes(type)) {
      where.type = type;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Transaction.count({ where });

    res.json({
      transactions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/transactions/stats - Get transaction statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const totalTransactions = await Transaction.count({ where });
    const creditTransactions = await Transaction.count({ where: { ...where, type: 'credit' } });
    const debitTransactions = await Transaction.count({ where: { ...where, type: 'debit' } });

    const creditSum = await Transaction.sum('amount', { where: { ...where, type: 'credit' } }) || 0;
    const debitSum = await Transaction.sum('amount', { where: { ...where, type: 'debit' } }) || 0;

    res.json({
      totalTransactions,
      creditTransactions,
      debitTransactions,
      totalCredit: creditSum,
      totalDebit: debitSum,
      netFlow: creditSum - debitSum
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
