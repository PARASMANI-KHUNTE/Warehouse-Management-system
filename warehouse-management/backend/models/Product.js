const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  msku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  hsnCode: {
    type: String,
    trim: true
  },
  dimensions: {
    length: {
      type: Number,
      default: 0
    },
    breadth: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    weight: {
      type: Number,
      default: 0
    }
  },
  lowStockThreshold: {
    type: Number,
    default: 10
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

module.exports = mongoose.model('Product', ProductSchema);
