const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  skuId: { type: String, ref: 'SKU', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'production', 'transfer', 'return'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'in_production', 'shipped', 'received', 'cancelled'],
    default: 'draft'
  },
  supplierId: {
    type: String,
    ref: 'Supplier',
    index: true
  },
  collectionId: {
    type: String,
    ref: 'Collection',
    index: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  orderDate: {
    type: Date,
    required: true
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  leadTimeDays: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  approvedBy: {
    type: String,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String
  },
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

orderSchema.index({ status: 1, organisationId: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ type: 1, status: 1 });
orderSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
