const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
  skuId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  styleCode: {
    type: String,
    required: true,
    index: true
  },
  collectionId: {
    type: String,
    ref: 'Collection',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  color: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  material: {
    type: String
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  retailPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  margin: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'discontinued', 'out_of_stock', 'on_hold'],
    default: 'active'
  },
  supplierId: {
    type: String,
    ref: 'Supplier',
    index: true
  },
  leadTime: {
    type: Number,
    default: 0
  },
  imageUrls: [{
    type: String
  }],
  organisationId: {
    type: String,
    required: true,
    index: true
  },
  metadata: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    careInstructions: String
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

skuSchema.index({ collectionId: 1, status: 1 });
skuSchema.index({ styleCode: 1, color: 1, size: 1 });
skuSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('SKU', skuSchema);
