const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  skuId: { type: String, ref: 'SKU', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  saleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: String,
    index: true
  },
  channel: {
    type: String,
    enum: ['online', 'store', 'wholesale', 'marketplace'],
    required: true
  },
  storeId: {
    type: String,
    index: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  saleDate: {
    type: Date,
    required: true,
    index: true
  },
  staffId: {
    type: String,
    ref: 'User'
  },
  margin: {
    type: Number,
    default: 0
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

saleSchema.index({ saleDate: -1, organisationId: 1 });
saleSchema.index({ channel: 1, saleDate: -1 });
saleSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Sale', saleSchema);
