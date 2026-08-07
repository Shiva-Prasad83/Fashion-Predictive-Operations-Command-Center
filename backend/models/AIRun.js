const mongoose = require('mongoose');

const aiRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['forecast', 'anomaly_detection', 'risk_scoring', 'explanation', 'recommendation'],
    index: true
  },
  modelName: {
    type: String,
    required: true
  },
  modelVersion: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled'],
    default: 'running',
    index: true
  },
  triggeredBy: {
    type: String,
    enum: ['scheduled', 'manual', 'event'],
    required: true
  },
  requestedBy: {
    type: String,
    ref: 'User'
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  durationMs: {
    type: Number
  },
  input: {
    type: mongoose.Schema.Types.Mixed
  },
  output: {
    type: mongoose.Schema.Types.Mixed
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  explanation: {
    type: String
  },
  error: {
    message: String,
    stack: String
  },
  reviewStatus: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'override', 'auto_approved'],
    default: 'pending_review'
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  },
  overrideReason: {
    type: String
  },
  linkedOutputId: {
    type: String
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

aiRunSchema.index({ type: 1, startedAt: -1, organisationId: 1 });
aiRunSchema.index({ status: 1, reviewStatus: 1 });
aiRunSchema.index({ modelName: 1, modelVersion: 1 });

module.exports = mongoose.model('AIRun', aiRunSchema);
