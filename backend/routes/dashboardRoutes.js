const express = require('express');
const router = express.Router();
const { getKPIs, getSummary, getTrends } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/kpis', auth, getKPIs);
router.get('/summary', auth, getSummary);
router.get('/trends', auth, getTrends);

module.exports = router;
