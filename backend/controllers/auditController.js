const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../middleware/auditLogger');

// GET /api/audit/logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType, performedBy, startDate, endDate, outcome, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;
    const filter = { organisationId: req.user.organisationId };

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (performedBy) filter.performedBy = performedBy;
    if (outcome) filter.outcome = outcome;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.', error: error.message });
  }
};

// GET /api/audit/logs/:id
const getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findOne({ auditId: req.params.id, organisationId: req.user.organisationId });
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found.' });

    res.json({ success: true, data: { log } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit log.', error: error.message });
  }
};

// GET /api/audit/stats
const getAuditStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await AuditLog.aggregate([
      { $match: { organisationId: req.user.organisationId, timestamp: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const totalActions = await AuditLog.countDocuments({ organisationId: req.user.organisationId, timestamp: { $gte: startDate } });

    res.json({ success: true, data: { stats, totalActions, period: `${days} days` } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit stats.', error: error.message });
  }
};

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { organisationId: req.user.organisationId };
    if (category) filter.category = category;

    const settings = await SystemConfig.find(filter).sort({ category: 1, key: 1 });

    res.json({ success: true, data: { settings } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: error.message });
  }
};

// PUT /api/settings/:id
const updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await SystemConfig.findOne({ configId: req.params.id, organisationId: req.user.organisationId });

    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found.' });
    if (!setting.isEditable) return res.status(403).json({ success: false, message: 'This setting is not editable.' });

    const prev = setting.toObject();
    setting.value = value;
    setting.lastModifiedBy = req.user.userId;
    setting.version += 1;
    await setting.save();

    await createAuditLog({ action: 'config_change', entityType: 'SystemConfig', entityId: setting.configId, performedBy: req.user.userId, performedByRole: req.user.role, previousValue: prev.value, newValue: value, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: 'Setting updated.', data: { setting } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update setting.', error: error.message });
  }
};

// POST /api/settings (Admin only - create new config)
const createSetting = async (req, res) => {
  try {
    const { category, key, value, dataType, description, isEditable = true } = req.body;

    const existing = await SystemConfig.findOne({ category, key, organisationId: req.user.organisationId });
    if (existing) return res.status(409).json({ success: false, message: 'Setting already exists.' });

    const setting = new SystemConfig({
      configId: uuidv4(),
      category,
      key,
      value,
      dataType,
      description,
      isEditable,
      lastModifiedBy: req.user.userId,
      organisationId: req.user.organisationId
    });

    await setting.save();

    await createAuditLog({ action: 'create', entityType: 'SystemConfig', entityId: setting.configId, performedBy: req.user.userId, performedByRole: req.user.role, newValue: req.body, outcome: 'success', organisationId: req.user.organisationId });

    res.status(201).json({ success: true, message: 'Setting created.', data: { setting } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create setting.', error: error.message });
  }
};

module.exports = { getAuditLogs, getAuditLog, getAuditStats, getSettings, updateSetting, createSetting };
