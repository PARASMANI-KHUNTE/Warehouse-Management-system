const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  msku: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  marketplace: {
    type: String,
    required: true,
    enum: ['Amazon', 'Flipkart', 'Meesho', 'Other'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  location: {
    type: String,
    trim: true
  },
  fulfillmentCenter: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index for msku, sku, and marketplace
InventorySchema.index({ msku: 1, sku: 1, marketplace: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', InventorySchema);
