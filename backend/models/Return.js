const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  skuId: { type: String, ref: 'SKU', required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  condition: { type: String, enum: ['new', 'used', 'damaged'], required: true },
  refundAmount: { type: Number, required: true }
}, { _id: false });

const returnSchema = new mongoose.Schema({
  returnId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  saleId: {
    type: String,
    ref: 'Sale',
    required: true,
    index: true
  },
  customerId: {
    type: String,
    index: true
  },
  items: [returnItemSchema],
  totalRefundAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  returnDate: {
    type: Date,
    required: true,
    index: true
  },
  processedDate: {
    type: Date
  },
  processedBy: {
    type: String,
    ref: 'User'
  },
  restockable: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
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

returnSchema.index({ returnDate: -1, organisationId: 1 });
returnSchema.index({ status: 1, returnDate: -1 });
returnSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Return', returnSchema);
