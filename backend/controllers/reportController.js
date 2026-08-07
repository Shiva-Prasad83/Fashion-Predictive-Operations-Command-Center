const Sale = require('../models/Sale');
const Return = require('../models/Return');
const KPISnapshot = require('../models/KPISnapshot');
const Inventory = require('../models/Inventory');
const WorkflowQueue = require('../models/WorkflowQueue');
const Task = require('../models/Task');
const AIRun = require('../models/AIRun');

// GET /api/reports/operations
const getOperationsReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    const organisationId = req.user.organisationId;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const [kpis, workflows, tasks, lowStock] = await Promise.all([
      KPISnapshot.find({ organisationId, ...(Object.keys(dateFilter).length && { date: dateFilter }) }).sort({ date: -1 }).limit(30),
      WorkflowQueue.find({ organisationId, deletedAt: null }).sort({ dueDate: 1 }),
      Task.find({ organisationId, status: { $in: ['pending', 'assigned', 'in_progress'] }, deletedAt: null }).sort({ priority: -1, dueDate: 1 }),
      Inventory.find({ organisationId, quantityAvailable: { $lt: 10 } }).limit(20)
    ]);

    const reportData = {
      generatedAt: new Date(),
      period: { startDate, endDate },
      kpis: kpis.map(k => ({
        date: k.date,
        sellThrough: k.sellThrough?.value,
        stockCover: k.stockCover?.value,
        margin: k.margin?.value,
        returnRate: k.returnRate?.value
      })),
      workflows: workflows.map(w => ({ title: w.title, type: w.type, status: w.status, dueDate: w.dueDate, slaStatus: w.slaStatus })),
      tasks: tasks.map(t => ({ title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate, assignedTo: t.assignedTo })),
      lowStockAlerts: lowStock.map(i => ({ skuId: i.skuId, location: i.location, quantityAvailable: i.quantityAvailable }))
    };

    if (format === 'csv') {
      // Simple CSV export for KPIs
      const csv = ['Date,Sell-Through,Stock Cover,Margin,Return Rate'];
      kpis.forEach(k => {
        csv.push(`${k.date.toISOString().split('T')[0]},${k.sellThrough?.value || 0},${k.stockCover?.value || 0},${k.margin?.value || 0},${k.returnRate?.value || 0}`);
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="operations-report.csv"');
      return res.send(csv.join('\n'));
    }

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate operations report.', error: error.message });
  }
};

// GET /api/reports/forecasts
const getForecastsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const organisationId = req.user.organisationId;

    const dateFilter = { organisationId };
    if (startDate) dateFilter.generatedAt = { $gte: new Date(startDate) };
    if (endDate) dateFilter.generatedAt = { ...dateFilter.generatedAt, $lte: new Date(endDate) };

    const ForecastSeries = require('../models/ForecastSeries');
    const forecasts = await ForecastSeries.find(dateFilter).sort({ generatedAt: -1 }).limit(50);

    const reportData = {
      generatedAt: new Date(),
      period: { startDate, endDate },
      forecasts: forecasts.map(f => ({
        type: f.type,
        targetMetric: f.targetMetric,
        confidence: f.confidence,
        generatedAt: f.generatedAt,
        validUntil: f.validUntil,
        modelVersion: f.modelVersion,
        status: f.status
      }))
    };

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate forecasts report.', error: error.message });
  }
};

// GET /api/reports/anomalies
const getAnomaliesReport = async (req, res) => {
  try {
    const { startDate, endDate, severity } = req.query;
    const organisationId = req.user.organisationId;

    const filter = { organisationId };
    if (startDate || endDate) {
      filter.detectedAt = {};
      if (startDate) filter.detectedAt.$gte = new Date(startDate);
      if (endDate) filter.detectedAt.$lte = new Date(endDate);
    }
    if (severity) filter.severity = severity;

    const AnomalyEvent = require('../models/AnomalyEvent');
    const anomalies = await AnomalyEvent.find(filter).sort({ detectedAt: -1 });

    const reportData = {
      generatedAt: new Date(),
      period: { startDate, endDate },
      totalAnomalies: anomalies.length,
      bySeverity: {
        critical: anomalies.filter(a => a.severity === 'critical').length,
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length
      },
      anomalies: anomalies.map(a => ({
        type: a.type,
        severity: a.severity,
        confidence: a.confidence,
        detectedAt: a.detectedAt,
        affectedMetric: a.affectedMetric,
        actualValue: a.actualValue,
        status: a.status,
        explanation: a.explanation
      }))
    };

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate anomalies report.', error: error.message });
  }
};

// GET /api/reports/ai-performance
const getAIPerformanceReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const organisationId = req.user.organisationId;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const runs = await AIRun.find({ organisationId, startedAt: { $gte: startDate } });

    const reportData = {
      generatedAt: new Date(),
      period: `${days} days`,
      totalRuns: runs.length,
      byType: {},
      byStatus: {},
      averageConfidence: 0,
      averageDuration: 0
    };

    runs.forEach(run => {
      reportData.byType[run.type] = (reportData.byType[run.type] || 0) + 1;
      reportData.byStatus[run.status] = (reportData.byStatus[run.status] || 0) + 1;
    });

    const completed = runs.filter(r => r.status === 'completed');
    if (completed.length > 0) {
      reportData.averageConfidence = completed.reduce((sum, r) => sum + (r.confidence || 0), 0) / completed.length;
      reportData.averageDuration = completed.reduce((sum, r) => sum + (r.durationMs || 0), 0) / completed.length;
    }

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate AI performance report.', error: error.message });
  }
};

module.exports = { getOperationsReport, getForecastsReport, getAnomaliesReport, getAIPerformanceReport };
