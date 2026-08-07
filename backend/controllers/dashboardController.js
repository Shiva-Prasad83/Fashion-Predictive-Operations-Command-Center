const KPISnapshot = require('../models/KPISnapshot');
const Sale = require('../models/Sale');
const Return = require('../models/Return');
const Inventory = require('../models/Inventory');
const WorkflowQueue = require('../models/WorkflowQueue');
const AnomalyEvent = require('../models/AnomalyEvent');
const Task = require('../models/Task');

// GET /api/dashboard/kpis
const getKPIs = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate, location, category, collectionId } = req.query;
    const organisationId = req.user.organisationId;

    const filter = { organisationId, period };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (location) filter['filters.location'] = location;
    if (category) filter['filters.category'] = category;
    if (collectionId) filter['filters.collectionId'] = collectionId;

    const snapshots = await KPISnapshot.find(filter).sort({ date: -1 }).limit(30);

    const latestSnapshot = snapshots[0] || {
      sellThrough: { value: 0, change: 0 },
      stockCover: { value: 0, change: 0 },
      sizeAvailability: { value: 0, change: 0 },
      leadTime: { value: 0, change: 0 },
      margin: { value: 0, change: 0 },
      markdownRate: { value: 0, change: 0 },
      returnRate: { value: 0, change: 0 },
      collectionPerformance: { value: 0, change: 0 },
      totalSales: { value: 0, change: 0 },
      totalOrders: { value: 0, change: 0 }
    };

    res.json({
      success: true,
      data: {
        current: latestSnapshot,
        history: snapshots
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch KPIs.', error: error.message });
  }
};

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  try {
    const organisationId = req.user.organisationId;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalSalesToday,
      totalReturnsToday,
      lowStockItems,
      criticalTasks,
      criticalAnomalies,
      overdueWorkflows
    ] = await Promise.all([
      Sale.countDocuments({ organisationId, saleDate: { $gte: startOfDay }, deletedAt: null }),
      Return.countDocuments({ organisationId, returnDate: { $gte: startOfDay }, deletedAt: null }),
      Inventory.countDocuments({ organisationId, quantityAvailable: { $lt: 10 } }),
      Task.countDocuments({ organisationId, priority: 'critical', status: { $in: ['pending', 'assigned'] }, deletedAt: null }),
      AnomalyEvent.countDocuments({ organisationId, severity: 'critical', status: 'new' }),
      WorkflowQueue.countDocuments({ organisationId, dueDate: { $lt: now }, status: { $nin: ['completed', 'cancelled'] }, deletedAt: null })
    ]);

    res.json({
      success: true,
      data: {
        totalSalesToday,
        totalReturnsToday,
        lowStockItems,
        criticalTasks,
        criticalAnomalies,
        overdueWorkflows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary.', error: error.message });
  }
};

// GET /api/dashboard/trends
const getTrends = async (req, res) => {
  try {
    const { metric = 'sellThrough', days = 30 } = req.query;
    const organisationId = req.user.organisationId;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const snapshots = await KPISnapshot.find({
      organisationId,
      date: { $gte: startDate },
      period: 'daily'
    }).sort({ date: 1 });

    const trendData = snapshots.map(s => ({
      date: s.date,
      value: s[metric]?.value || 0
    }));

    res.json({ success: true, data: { metric, trendData } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trends.', error: error.message });
  }
};

module.exports = { getKPIs, getSummary, getTrends };
