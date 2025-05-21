const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderItemId: {
    type: String,
    trim: true
  },
  marketplace: {
    type: String,
    required: true,
    enum: ['Amazon', 'Flipkart', 'Meesho', 'Other'],
    trim: true
  },
  orderDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'Pending', 
      'Processing', 
      'Shipped', 
      'Delivered', 
      'Cancelled', 
      'Returned', 
      'Return Requested',
      'RTO Initiated',
      'RTO Delivered'
    ],
    default: 'Pending'
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  items: [{
    sku: {
      type: String,
      required: true,
      trim: true
    },
    msku: {
      type: String,
      required: true,
      trim: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    }
  }],
  shipping: {
    shipmentId: {
      type: String,
      trim: true
    },
    trackingId: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true
    },
    dispatchAfter: {
      type: Date
    },
    dispatchBy: {
      type: Date
    },
    fulfillmentCenter: {
      type: String,
      trim: true
    }
  },
  payment: {
    method: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Completed'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  rawData: {
    type: Object
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

// Create indexes for common queries
OrderSchema.index({ marketplace: 1, orderDate: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'customer.name': 1 });
OrderSchema.index({ 'items.sku': 1 });
OrderSchema.index({ 'items.msku': 1 });

module.exports = mongoose.model('Order', OrderSchema);
