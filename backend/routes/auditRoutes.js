const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLog, getAuditStats, getSettings, updateSetting, createSetting } = require('../controllers/auditController');
const auth = require('../middleware/auth');
const { roleCheck, roleCheckMinimum } = require('../middleware/roleCheck');

// Audit logs — admin & manager read only
router.get('/logs', auth, roleCheckMinimum('Manager'), getAuditLogs);
router.get('/logs/stats', auth, roleCheckMinimum('Manager'), getAuditStats);
router.get('/logs/:id', auth, roleCheckMinimum('Manager'), getAuditLog);

// System settings
router.get('/settings', auth, roleCheckMinimum('Manager'), getSettings);
router.post('/settings', auth, roleCheck('Operations Admin'), createSetting);
router.put('/settings/:id', auth, roleCheckMinimum('Manager'), updateSetting);

module.exports = router;
