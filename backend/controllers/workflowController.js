const { v4: uuidv4 } = require('uuid');
const WorkflowQueue = require('../models/WorkflowQueue');
const { createAuditLog } = require('../middleware/auditLogger');

const buildFilter = (query, organisationId) => {
  const filter = { organisationId, deletedAt: null };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.ownerId) filter.ownerId = query.ownerId;
  if (query.slaStatus) filter.slaStatus = query.slaStatus;
  if (query.search) filter.title = { $regex: query.search, $options: 'i' };
  return filter;
};

// GET /api/workflows
const getWorkflows = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;
    const filter = buildFilter(req.query, req.user.organisationId);

    const total = await WorkflowQueue.countDocuments(filter);
    const workflows = await WorkflowQueue.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { workflows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch workflows.', error: error.message });
  }
};

// GET /api/workflows/:id
const getWorkflow = async (req, res) => {
  try {
    const workflow = await WorkflowQueue.findOne({ queueId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });
    res.json({ success: true, data: { workflow } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch workflow.', error: error.message });
  }
};

// POST /api/workflows
const createWorkflow = async (req, res) => {
  try {
    const workflow = new WorkflowQueue({
      queueId: uuidv4(),
      ...req.body,
      organisationId: req.user.organisationId,
      activityHistory: [{ action: 'created', performedBy: req.user.userId, timestamp: new Date() }]
    });
    await workflow.save();

    await createAuditLog({ action: 'create', entityType: 'WorkflowQueue', entityId: workflow.queueId, performedBy: req.user.userId, performedByRole: req.user.role, outcome: 'success', organisationId: req.user.organisationId });

    res.status(201).json({ success: true, message: 'Workflow created.', data: { workflow } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create workflow.', error: error.message });
  }
};

// PUT /api/workflows/:id
const updateWorkflow = async (req, res) => {
  try {
    const workflow = await WorkflowQueue.findOne({ queueId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });

    const prev = workflow.toObject();
    Object.assign(workflow, req.body);
    workflow.version += 1;
    workflow.activityHistory.push({ action: 'updated', performedBy: req.user.userId, timestamp: new Date(), notes: req.body.notes });
    await workflow.save();

    await createAuditLog({ action: 'update', entityType: 'WorkflowQueue', entityId: workflow.queueId, performedBy: req.user.userId, performedByRole: req.user.role, previousValue: prev, newValue: req.body, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: 'Workflow updated.', data: { workflow } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update workflow.', error: error.message });
  }
};

// DELETE /api/workflows/:id
const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await WorkflowQueue.findOne({ queueId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });

    workflow.deletedAt = new Date();
    await workflow.save();

    await createAuditLog({ action: 'delete', entityType: 'WorkflowQueue', entityId: workflow.queueId, performedBy: req.user.userId, performedByRole: req.user.role, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: 'Workflow deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete workflow.', error: error.message });
  }
};

// GET /api/workflows/stats/sla
const getSLAStats = async (req, res) => {
  try {
    const org = req.user.organisationId;
    const [onTrack, atRisk, breached] = await Promise.all([
      WorkflowQueue.countDocuments({ organisationId: org, slaStatus: 'on_track', deletedAt: null }),
      WorkflowQueue.countDocuments({ organisationId: org, slaStatus: 'at_risk', deletedAt: null }),
      WorkflowQueue.countDocuments({ organisationId: org, slaStatus: 'breached', deletedAt: null })
    ]);
    res.json({ success: true, data: { onTrack, atRisk, breached } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch SLA stats.', error: error.message });
  }
};

module.exports = { getWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow, getSLAStats };
