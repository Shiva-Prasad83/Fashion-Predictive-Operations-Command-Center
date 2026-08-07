const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  collectionId: {
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
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Men', 'Women', 'Kids', 'Accessories', 'Footwear', 'Unisex']
  },
  status: {
    type: String,
    enum: ['planning', 'design', 'sampling', 'production', 'active', 'archived'],
    default: 'planning'
  },
  launchDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  designerId: {
    type: String,
    ref: 'User',
    index: true
  },
  merchandiserId: {
    type: String,
    ref: 'User',
    index: true
  },
  targetMargin: {
    type: Number,
    default: 0
  },
  actualMargin: {
    type: Number,
    default: 0
  },
  totalStyles: {
    type: Number,
    default: 0
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  },
  metadata: {
    theme: String,
    targetAudience: String,
    priceRange: {
      min: Number,
      max: Number
    }
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

collectionSchema.index({ status: 1, organisationId: 1 });
collectionSchema.index({ season: 1, year: 1 });
collectionSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
