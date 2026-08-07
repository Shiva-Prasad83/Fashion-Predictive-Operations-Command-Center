const mongoose = require('mongoose');

const kpiSnapshotSchema = new mongoose.Schema({
  snapshotId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true
  },
  sellThrough: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  stockCover: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  sizeAvailability: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  leadTime: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  margin: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  markdownRate: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  returnRate: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  collectionPerformance: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  totalSales: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  totalOrders: {
    value: { type: Number, default: 0 },
    change: { type: Number, default: 0 }
  },
  filters: {
    location: String,
    category: String,
    collectionId: String
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

kpiSnapshotSchema.index({ date: -1, organisationId: 1 });
kpiSnapshotSchema.index({ period: 1, date: -1 });

module.exports = mongoose.model('KPISnapshot', kpiSnapshotSchema);
