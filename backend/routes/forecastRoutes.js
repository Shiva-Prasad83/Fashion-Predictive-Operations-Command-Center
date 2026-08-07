const express = require('express');
const router = express.Router();
const { getForecasts, getForecast, getCapacityHeatmap, getAnomalies, getAnomaly, updateAnomalyStatus } = require('../controllers/forecastController');
const auth = require('../middleware/auth');
const { roleCheckMinimum } = require('../middleware/roleCheck');

router.get('/forecasts', auth, getForecasts);
router.get('/forecasts/:id', auth, getForecast);
router.get('/capacity/heatmap', auth, getCapacityHeatmap);
router.get('/anomalies', auth, getAnomalies);
router.get('/anomalies/:id', auth, getAnomaly);
router.put('/anomalies/:id/status', auth, roleCheckMinimum('Analyst'), updateAnomalyStatus);

module.exports = router;
