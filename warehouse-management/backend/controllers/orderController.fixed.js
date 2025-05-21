const Order = require('../models/Order');
const Product = require('../models/Product');
const Sku = require('../models/Sku');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { 
      status, 
      marketplace, 
      startDate, 
      endDate, 
      search,
      limit = 100,
      page = 1
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (marketplace) {
      query.marketplace = marketplace;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.orderDate = {};
      
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.orderDate.$lte = new Date(endDate);
      }
    }
    
    // Search by order ID or customer name
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Get orders
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { 
      orderId, 
      orderDate, 
      marketplace, 
      status, 
      customer, 
      shippingAddress, 
      items, 
      totalAmount, 
      shippingAmount, 
      taxAmount, 
      paymentMethod 
    } = req.body;
    
    // Check if order already exists
    const existingOrder = await Order.findOne({ orderId, marketplace });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order already exists' });
    }
    
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }
    
    // Verify SKUs exist
    for (const item of items) {
      const sku = await Sku.findOne({ sku: item.sku, marketplace });
      if (!sku) {
        return res.status(400).json({ message: `SKU ${item.sku} not found for ${marketplace}` });
      }
    }
    
    // Create order
    const order = await Order.create({
      orderId,
      orderDate: orderDate || new Date(),
      marketplace,
      status: status || 'pending',
      customer,
      shippingAddress,
      items,
      totalAmount,
      shippingAmount: shippingAmount || 0,
      taxAmount: taxAmount || 0,
      paymentMethod
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: req.body.note || ''
    });
    
    await order.save();
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order shipping info
// @route   PUT /api/orders/:id/shipping
// @access  Private
const updateOrderShipping = async (req, res) => {
  try {
    const { 
      trackingNumber, 
      carrier, 
      shippingMethod,
      shippingDate,
      shippingAddress
    } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update shipping info
    order.shipping = {
      ...order.shipping,
      trackingNumber: trackingNumber || order.shipping?.trackingNumber,
      carrier: carrier || order.shipping?.carrier,
      shippingMethod: shippingMethod || order.shipping?.shippingMethod,
      shippingDate: shippingDate ? new Date(shippingDate) : order.shipping?.shippingDate
    };
    
    // Update shipping address if provided
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }
    
    await order.save();
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order shipping:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update entire order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
  try {
    const { 
      status, 
      customer, 
      shippingAddress, 
      items, 
      totalAmount, 
      shippingAmount, 
      taxAmount, 
      paymentMethod,
      shipping
    } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update fields if provided
    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({
        status,
        date: new Date(),
        note: req.body.note || ''
      });
    }
    
    if (customer) order.customer = { ...order.customer, ...customer };
    if (shippingAddress) order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
    if (items) order.items = items;
    if (totalAmount) order.totalAmount = totalAmount;
    if (shippingAmount) order.shippingAmount = shippingAmount;
    if (taxAmount) order.taxAmount = taxAmount;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (shipping) order.shipping = { ...order.shipping, ...shipping };
    
    await order.save();
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Import orders from CSV data
// @route   POST /api/orders/import
// @access  Private
const importOrders = async (req, res) => {
  try {
    const { orders, marketplace } = req.body;
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'Orders data is required' });
    }
    
    if (!marketplace) {
      return res.status(400).json({ message: 'Marketplace is required' });
    }
    
    const results = {
      total: orders.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const orderData of orders) {
      try {
        // Check if order already exists
        const existingOrder = await Order.findOne({ 
          orderId: orderData.orderId, 
          marketplace 
        });
        
        if (existingOrder) {
          results.failed++;
          results.errors.push({
            orderId: orderData.orderId,
            error: 'Order already exists'
          });
          continue;
        }
        
        // Validate items
        if (!orderData.items || orderData.items.length === 0) {
          results.failed++;
          results.errors.push({
            orderId: orderData.orderId,
            error: 'Order must have at least one item'
          });
          continue;
        }
        
        // Verify SKUs exist and get product info
        for (let i = 0; i < orderData.items.length; i++) {
          const item = orderData.items[i];
          const sku = await Sku.findOne({ sku: item.sku, marketplace })
            .populate('product', 'name msku');
          
          if (!sku) {
            results.failed++;
            results.errors.push({
              orderId: orderData.orderId,
              error: `SKU ${item.sku} not found for ${marketplace}`
            });
            continue;
          }
          
          // Add product info to item
          orderData.items[i].productName = sku.product ? sku.product.name : 'Unknown Product';
          orderData.items[i].msku = sku.product ? sku.product.msku : sku.msku;
        }
        
        // Create order
        const order = await Order.create({
          ...orderData,
          marketplace,
          orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
          status: orderData.status || 'pending',
          shippingAmount: orderData.shippingAmount || 0,
          taxAmount: orderData.taxAmount || 0
        });
        
        results.success++;
      } catch (error) {
        console.error('Error importing order:', error);
        results.failed++;
        results.errors.push({
          orderId: orderData.orderId || 'Unknown',
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Imported ${results.success} of ${results.total} orders`,
      results
    });
  } catch (error) {
    console.error('Error importing orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions for status mapping
const mapAmazonStatus = (status) => {
  const statusMap = {
    'Pending': 'pending',
    'Unshipped': 'processing',
    'Shipped': 'shipped',
    'Cancelled': 'cancelled',
    'Delivered': 'delivered'
  };
  
  return statusMap[status] || 'processing';
};

const mapFlipkartStatus = (status) => {
  const statusMap = {
    'APPROVED': 'processing',
    'PACKING': 'processing',
    'PACKED': 'processing',
    'READY_TO_DISPATCH': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'RETURNED': 'returned'
  };
  
  return statusMap[status] || 'processing';
};

const mapMeeshoStatus = (status) => {
  const statusMap = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'RETURNED': 'returned'
  };
  
  return statusMap[status] || 'processing';
};

// Helper function to parse Flipkart date format (DD-MMM-YY)
const parseFlipkartDate = (dateString) => {
  if (!dateString) return new Date();
  
  try {
    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date();
    
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    let year = parseInt(parts[2], 10);
    
    // Convert 2-digit year to 4-digit
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    return new Date(year, month, day);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderShipping,
  updateOrder,
  deleteOrder,
  importOrders
};
