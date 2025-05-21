const mongoose = require('mongoose');

const SkuSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  msku: {
    type: String,
    required: true,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  marketplace: {
    type: String,
    required: true,
    enum: ['Amazon', 'Flipkart', 'Meesho', 'Other'],
    trim: true
  },
  marketplaceIdentifiers: {
    asin: { type: String, trim: true },
    fsn: { type: String, trim: true },
    ean: { type: String, trim: true },
    upc: { type: String, trim: true },
    isbn: { type: String, trim: true }
  },
  active: {
    type: Boolean,
    default: true
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

// Create a compound index for marketplace and sku
SkuSchema.index({ marketplace: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Sku', SkuSchema);
