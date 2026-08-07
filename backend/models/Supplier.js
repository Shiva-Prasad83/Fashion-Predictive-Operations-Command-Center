const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'pending_approval'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  capabilities: [{
    type: String
  }],
  leadTime: {
    type: Number,
    default: 0
  },
  minimumOrderQuantity: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String
  },
  certifications: [{
    name: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  performanceMetrics: {
    onTimeDelivery: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0 },
    defectRate: { type: Number, default: 0 }
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

supplierSchema.index({ status: 1, organisationId: 1 });
supplierSchema.index({ rating: -1 });
supplierSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
