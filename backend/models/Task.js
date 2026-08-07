const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'escalation', 'approval', 'review', 'manual'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'review', 'completed', 'deferred', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  assignedTo: {
    type: String,
    ref: 'User',
    index: true
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  completedDate: {
    type: Date
  },
  expectedImpact: {
    type: String
  },
  actualOutcome: {
    type: String
  },
  aiRecommendationId: {
    type: String
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'override'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    ref: 'User'
  },
  approvalNotes: {
    type: String
  },
  linkedRecords: [{
    type: { type: String },
    id: { type: String }
  }],
  tags: [{
    type: String
  }],
  activityLog: [{
    action: { type: String },
    performedBy: { type: String, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    previousValue: { type: String },
    newValue: { type: String },
    reason: { type: String }
  }],
  organisationId: {
    type: String,
    required: true,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

taskSchema.index({ assignedTo: 1, status: 1, organisationId: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ type: 1, priority: 1 });
taskSchema.index({ aiGenerated: 1, status: 1 });
taskSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Task', taskSchema);
