const ForecastSeries = require('../models/ForecastSeries');
const AnomalyEvent = require('../models/AnomalyEvent');

// GET /api/forecasts
const getForecasts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status = 'active' } = req.query;
    const filter = { organisationId: req.user.organisationId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const total = await ForecastSeries.countDocuments(filter);
    const forecasts = await ForecastSeries.find(filter)
      .sort({ generatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { forecasts, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch forecasts.', error: error.message });
  }
};

// GET /api/forecasts/:id
const getForecast = async (req, res) => {
  try {
    const forecast = await ForecastSeries.findOne({ forecastId: req.params.id, organisationId: req.user.organisationId });
    if (!forecast) return res.status(404).json({ success: false, message: 'Forecast not found.' });
    res.json({ success: true, data: { forecast } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch forecast.', error: error.message });
  }
};

// GET /api/forecasts/capacity/heatmap
const getCapacityHeatmap = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    // Generate capacity heatmap data (simulated with realistic patterns)
    const heatmapData = [];
    const departments = ['Trend Planning', 'Design', 'Sourcing', 'Sampling', 'Production'];
    const now = new Date();

    for (let week = 0; week < parseInt(weeks); week++) {
      for (const dept of departments) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() + week * 7);
        heatmapData.push({
          week: week + 1,
          weekStart: weekStart.toISOString().split('T')[0],
          department: dept,
          capacity: Math.floor(Math.random() * 40) + 60,
          utilisation: Math.floor(Math.random() * 50) + 40
        });
      }
    }

    res.json({ success: true, data: { heatmap: heatmapData } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch capacity heatmap.', error: error.message });
  }
};

// GET /api/anomalies
const getAnomalies = async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, status, type } = req.query;
    const filter = { organisationId: req.user.organisationId };
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await AnomalyEvent.countDocuments(filter);
    const anomalies = await AnomalyEvent.find(filter)
      .sort({ detectedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { anomalies, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch anomalies.', error: error.message });
  }
};

// GET /api/anomalies/:id
const getAnomaly = async (req, res) => {
  try {
    const anomaly = await AnomalyEvent.findOne({ anomalyId: req.params.id, organisationId: req.user.organisationId });
    if (!anomaly) return res.status(404).json({ success: false, message: 'Anomaly not found.' });
    res.json({ success: true, data: { anomaly } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch anomaly.', error: error.message });
  }
};

// PUT /api/anomalies/:id/status
const updateAnomalyStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const anomaly = await AnomalyEvent.findOne({ anomalyId: req.params.id, organisationId: req.user.organisationId });
    if (!anomaly) return res.status(404).json({ success: false, message: 'Anomaly not found.' });

    anomaly.status = status;
    if (status === 'acknowledged') {
      anomaly.acknowledgedBy = req.user.userId;
      anomaly.acknowledgedAt = new Date();
    }
    if (['resolved', 'dismissed'].includes(status)) {
      anomaly.resolution = { action: notes, resolvedBy: req.user.userId, resolvedAt: new Date(), notes };
    }
    await anomaly.save();

    res.json({ success: true, message: `Anomaly ${status}.`, data: { anomaly } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update anomaly status.', error: error.message });
  }
};

module.exports = { getForecasts, getForecast, getCapacityHeatmap, getAnomalies, getAnomaly, updateAnomalyStatus };
