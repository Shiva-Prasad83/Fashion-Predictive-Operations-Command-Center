const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../middleware/auditLogger');

const buildFilter = (query, organisationId) => {
  const filter = { organisationId, deletedAt: null };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.type) filter.type = query.type;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.aiGenerated !== undefined) filter.aiGenerated = query.aiGenerated === 'true';
  if (query.search) filter.title = { $regex: query.search, $options: 'i' };
  return filter;
};

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;
    const filter = buildFilter(req.query, req.user.organisationId);

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { tasks, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.', error: error.message });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task.', error: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const task = new Task({
      taskId: uuidv4(),
      ...req.body,
      createdBy: req.user.userId,
      organisationId: req.user.organisationId,
      activityLog: [{ action: 'created', performedBy: req.user.userId, timestamp: new Date() }]
    });
    await task.save();

    // Notify assignee
    if (task.assignedTo) {
      await Notification.create({
        notificationId: uuidv4(),
        title: 'New Task Assigned',
        message: `You have been assigned a task: ${task.title}`,
        type: 'assignment',
        severity: task.priority === 'critical' ? 'critical' : 'info',
        recipientId: task.assignedTo,
        senderId: req.user.userId,
        linkedRecord: { type: 'Task', id: task.taskId },
        organisationId: req.user.organisationId
      });
    }

    await createAuditLog({ action: 'create', entityType: 'Task', entityId: task.taskId, performedBy: req.user.userId, performedByRole: req.user.role, outcome: 'success', organisationId: req.user.organisationId });

    res.status(201).json({ success: true, message: 'Task created.', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create task.', error: error.message });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const prev = task.toObject();
    const allowedFields = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'expectedImpact', 'actualOutcome'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) task[field] = req.body[field]; });

    task.activityLog.push({
      action: 'updated',
      performedBy: req.user.userId,
      timestamp: new Date(),
      previousValue: JSON.stringify(prev.status),
      newValue: JSON.stringify(task.status),
      reason: req.body.reason
    });

    await task.save();
    await createAuditLog({ action: 'update', entityType: 'Task', entityId: task.taskId, performedBy: req.user.userId, performedByRole: req.user.role, previousValue: prev, newValue: req.body, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: 'Task updated.', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task.', error: error.message });
  }
};

// POST /api/tasks/:id/approve
const approveTask = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (!task.requiresApproval) return res.status(400).json({ success: false, message: 'Task does not require approval.' });

    const { decision, notes } = req.body; // decision: 'approved' | 'rejected' | 'override'

    task.approvalStatus = decision;
    task.approvedBy = req.user.userId;
    task.approvalNotes = notes;
    task.activityLog.push({ action: decision, performedBy: req.user.userId, timestamp: new Date(), reason: notes });
    if (decision === 'approved') task.status = 'in_progress';
    if (decision === 'rejected') task.status = 'cancelled';

    await task.save();
    await createAuditLog({ action: decision === 'approved' ? 'approval' : 'rejection', entityType: 'Task', entityId: task.taskId, performedBy: req.user.userId, performedByRole: req.user.role, newValue: { decision, notes }, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: `Task ${decision}.`, data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approval action failed.', error: error.message });
  }
};

// POST /api/tasks/:id/escalate
const escalateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const { escalateTo, reason } = req.body;
    task.assignedTo = escalateTo;
    task.priority = 'critical';
    task.status = 'assigned';
    task.activityLog.push({ action: 'escalated', performedBy: req.user.userId, timestamp: new Date(), reason });

    await task.save();

    // Notify new assignee
    if (escalateTo) {
      await Notification.create({
        notificationId: uuidv4(),
        title: 'Task Escalated to You',
        message: `Task "${task.title}" has been escalated to you. Reason: ${reason}`,
        type: 'escalation',
        severity: 'critical',
        urgent: true,
        recipientId: escalateTo,
        senderId: req.user.userId,
        linkedRecord: { type: 'Task', id: task.taskId },
        organisationId: req.user.organisationId
      });
    }

    await createAuditLog({ action: 'escalation', entityType: 'Task', entityId: task.taskId, performedBy: req.user.userId, performedByRole: req.user.role, newValue: { escalateTo, reason }, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: 'Task escalated.', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Escalation failed.', error: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    task.deletedAt = new Date();
    await task.save();
    await createAuditLog({ action: 'delete', entityType: 'Task', entityId: task.taskId, performedBy: req.user.userId, performedByRole: req.user.role, outcome: 'success', organisationId: req.user.organisationId });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task.', error: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, approveTask, escalateTask, deleteTask };
