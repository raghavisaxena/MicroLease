const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRScore } = require('../controllers/rscoreController');

router.get('/:userId', auth, getRScore);

module.exports = router;
