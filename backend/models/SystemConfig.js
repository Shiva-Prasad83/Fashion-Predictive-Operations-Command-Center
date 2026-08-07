const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  configId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'workflow',
      'threshold',
      'sla',
      'ai',
      'integration',
      'notification',
      'security',
      'retention'
    ],
    index: true
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: {
    type: String
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  },
  lastModifiedBy: {
    type: String,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

systemConfigSchema.index({ category: 1, key: 1, organisationId: 1 }, { unique: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
