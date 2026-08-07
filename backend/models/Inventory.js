const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  inventoryId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  skuId: {
    type: String,
    ref: 'SKU',
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true
  },
  locationType: {
    type: String,
    enum: ['warehouse', 'store', 'transit', 'supplier'],
    default: 'warehouse'
  },
  quantityOnHand: {
    type: Number,
    default: 0,
    min: 0
  },
  quantityReserved: {
    type: Number,
    default: 0,
    min: 0
  },
  quantityAvailable: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    default: 0
  },
  reorderQuantity: {
    type: Number,
    default: 0
  },
  stockCoverDays: {
    type: Number,
    default: 0
  },
  lastRestockedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

inventorySchema.index({ skuId: 1, location: 1 }, { unique: true });
inventorySchema.index({ organisationId: 1, location: 1 });
inventorySchema.index({ quantityOnHand: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
