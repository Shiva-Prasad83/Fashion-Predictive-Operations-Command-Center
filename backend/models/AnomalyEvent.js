const mongoose = require('mongoose');

const anomalyEventSchema = new mongoose.Schema({
  anomalyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'demand_spike',
      'demand_drop',
      'quality_issue',
      'delay',
      'stockout',
      'overstock',
      'return_spike',
      'margin_drop',
      'capacity_issue',
      'other'
    ],
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  detectedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  affectedMetric: {
    type: String,
    required: true
  },
  expectedValue: {
    type: Number
  },
  actualValue: {
    type: Number,
    required: true
  },
  deviation: {
    type: Number
  },
  contributingVariables: [{
    variable: { type: String },
    impact: { type: Number },
    description: { type: String }
  }],
  explanation: {
    type: String,
    required: true
  },
  affectedRecords: [{
    type: { type: String },
    id: { type: String }
  }],
  filters: {
    location: String,
    category: String,
    collectionId: String,
    skuId: String,
    supplierId: String
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'investigating', 'resolved', 'dismissed'],
    default: 'new',
    index: true
  },
  acknowledgedBy: {
    type: String,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  resolution: {
    action: String,
    resolvedBy: { type: String, ref: 'User' },
    resolvedAt: Date,
    notes: String
  },
  modelVersion: {
    type: String,
    required: true
  },
  inputDataSnapshot: {
    startDate: Date,
    endDate: Date,
    recordCount: Number
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

anomalyEventSchema.index({ detectedAt: -1, organisationId: 1 });
anomalyEventSchema.index({ type: 1, severity: 1, status: 1 });
anomalyEventSchema.index({ status: 1, detectedAt: -1 });

module.exports = mongoose.model('AnomalyEvent', anomalyEventSchema);
