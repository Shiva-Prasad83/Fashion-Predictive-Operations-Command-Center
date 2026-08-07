const mongoose = require('mongoose');

const forecastDataPointSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  value: { type: Number, required: true },
  lowerBound: { type: Number },
  upperBound: { type: Number },
  confidence: { type: Number, min: 0, max: 1 }
}, { _id: false });

const forecastSeriesSchema = new mongoose.Schema({
  forecastId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['demand', 'workload', 'resource_requirement', 'service_risk'],
    index: true
  },
  targetMetric: {
    type: String,
    required: true
  },
  forecastHorizon: {
    type: Number,
    required: true
  },
  dataPoints: [forecastDataPointSchema],
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  modelVersion: {
    type: String,
    required: true
  },
  modelType: {
    type: String,
    required: true
  },
  inputDataSnapshot: {
    startDate: Date,
    endDate: Date,
    recordCount: Number,
    features: [String]
  },
  evaluationMetrics: {
    mape: Number,
    rmse: Number,
    mae: Number,
    r2Score: Number
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  explanation: {
    type: String
  },
  contributingFactors: [{
    factor: { type: String },
    impact: { type: Number },
    description: { type: String }
  }],
  filters: {
    location: String,
    category: String,
    collectionId: String,
    skuId: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'superseded'],
    default: 'active'
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

forecastSeriesSchema.index({ type: 1, generatedAt: -1, organisationId: 1 });
forecastSeriesSchema.index({ validUntil: 1, status: 1 });
forecastSeriesSchema.index({ targetMetric: 1, type: 1 });

module.exports = mongoose.model('ForecastSeries', forecastSeriesSchema);
