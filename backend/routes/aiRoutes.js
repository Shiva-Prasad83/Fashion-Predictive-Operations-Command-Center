const express = require('express');
const router = express.Router();
const { generateForecast, detectAnomalies, generateRecommendations, getAIRuns, reviewAIRun } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const { roleCheckMinimum } = require('../middleware/roleCheck');

router.post('/forecast', auth, roleCheckMinimum('Analyst'), generateForecast);
router.post('/detect-anomalies', auth, roleCheckMinimum('Analyst'), detectAnomalies);
router.post('/generate-recommendations', auth, roleCheckMinimum('Analyst'), generateRecommendations);
router.get('/runs', auth, getAIRuns);
router.post('/runs/:id/review', auth, roleCheckMinimum('Manager'), reviewAIRun);

module.exports = router;

module.exports = router;
