const express = require('express');
const router = express.Router();
const { getOperationsReport, getForecastsReport, getAnomaliesReport, getAIPerformanceReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { roleCheckMinimum } = require('../middleware/roleCheck');

router.get('/operations', auth, roleCheckMinimum('Analyst'), getOperationsReport);
router.get('/forecasts', auth, roleCheckMinimum('Analyst'), getForecastsReport);
router.get('/anomalies', auth, roleCheckMinimum('Analyst'), getAnomaliesReport);
router.get('/ai-performance', auth, roleCheckMinimum('Analyst'), getAIPerformanceReport);

module.exports = router;
