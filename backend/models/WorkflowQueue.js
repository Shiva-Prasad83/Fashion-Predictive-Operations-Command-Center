const mongoose = require('mongoose');

const workflowQueueSchema = new mongoose.Schema({
  queueId: {
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
  type: {
    type: String,
    required: true,
    enum: [
      'trend_planning',
      'design',
      'sourcing',
      'sampling',
      'production',
      'allocation',
      'selling',
      'markdown',
      'return',
      'replenishment'
    ],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'blocked', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  ownerId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  slaDeadline: {
    type: Date
  },
  slaStatus: {
    type: String,
    enum: ['on_track', 'at_risk', 'breached'],
    default: 'on_track',
    index: true
  },
  collectionId: {
    type: String,
    ref: 'Collection'
  },
  description: {
    type: String
  },
  linkedRecords: [{
    type: { type: String },
    id: { type: String }
  }],
  tags: [{
    type: String
  }],
  completedAt: {
    type: Date
  },
  activityHistory: [{
    action: { type: String },
    performedBy: { type: String, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  version: {
    type: Number,
    default: 1
  },
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

workflowQueueSchema.index({ type: 1, status: 1, organisationId: 1 });
workflowQueueSchema.index({ ownerId: 1, status: 1 });
workflowQueueSchema.index({ dueDate: 1, slaStatus: 1 });
workflowQueueSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('WorkflowQueue', workflowQueueSchema);
