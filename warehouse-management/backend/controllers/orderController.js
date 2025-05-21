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
    
    // Search filter
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
        { 'items.sku': { $regex: search, $options: 'i' } },
        { 'items.msku': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get orders
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
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
      orderItemId,
      marketplace,
      orderDate,
      status,
      customer,
      items,
      shipping,
      payment,
      notes,
      rawData
    } = req.body;
    
    // Check if order already exists
    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order with this ID already exists' });
    }
    
    // Validate items and map SKUs to MSKUs
    const processedItems = [];
    
    for (const item of items) {
      const { sku, quantity, price } = item;
      
      // Find the SKU in the database
      const skuDoc = await Sku.findOne({ sku }).populate('product');
      
      if (!skuDoc) {
        return res.status(404).json({ message: `SKU not found: ${sku}` });
      }
      
      processedItems.push({
        sku,
        msku: skuDoc.msku,
        product: skuDoc.product._id,
        name: item.name || skuDoc.product.name,
        quantity,
        price,
        tax: item.tax || 0
      });
    }
    
    // Create the order
    const order = await Order.create({
      orderId,
      orderItemId,
      marketplace,
      orderDate: new Date(orderDate),
      status,
      customer,
      items: processedItems,
      shipping,
      payment,
      notes,
      rawData
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
    order.updatedAt = Date.now();
    
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
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
    const { shipping } = req.body;
    
    if (!shipping) {
      return res.status(400).json({ message: 'Shipping information is required' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.shipping = {
      ...order.shipping,
      ...shipping
    };
    
    order.updatedAt = Date.now();
    
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
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
      shipping,
      payment,
      notes
    } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update fields if provided
    if (status) order.status = status;
    if (customer) order.customer = { ...order.customer, ...customer };
    if (shipping) order.shipping = { ...order.shipping, ...shipping };
    if (payment) order.payment = { ...order.payment, ...payment };
    if (notes !== undefined) order.notes = notes;
    
    order.updatedAt = Date.now();
    
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
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
    
    await order.remove();
    
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
      return res.status(400).json({ message: 'Invalid order data' });
    }
    
    if (!marketplace) {
      return res.status(400).json({ message: 'Marketplace is required' });
    }
    
    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const orderData of orders) {
      try {
        // Extract order ID based on marketplace format
        let orderId;
        if (marketplace === 'Amazon') {
          orderId = orderData.AmazonOrderId || orderData.orderId;
        } else if (marketplace === 'Flipkart') {
          orderId = orderData.orderId || orderData['Order Id'];
        } else if (marketplace === 'Meesho') {
          orderId = orderData.subOrderNo || orderData['Sub Order No'];
        } else {
          orderId = orderData.orderId;
        }
        
        if (!orderId) {
          results.failed++;
          results.errors.push('Order ID not found in data');
          continue;
        }
        
        // Check if order already exists
        const existingOrder = await Order.findOne({ orderId });
        
        if (existingOrder) {
          // Update existing order
          // Logic for updating would go here
          results.updated++;
          continue;
        }
        
        // Process order data based on marketplace
        let processedOrder = {
          orderId,
          marketplace,
          rawData: orderData
        };
        
        // Marketplace-specific processing
        if (marketplace === 'Amazon') {
          // Amazon-specific processing
          processedOrder = {
            ...processedOrder,
            orderDate: new Date(orderData.PurchaseDate || orderData.orderDate),
            status: mapAmazonStatus(orderData.OrderStatus || orderData.status),
            customer: {
              name: orderData.BuyerName || 'Amazon Customer',
              // Other customer fields
            },
            items: [{
              sku: orderData.SellerSKU || orderData.sku,
              name: orderData.ProductName || orderData.Title,
              quantity: parseInt(orderData.QuantityOrdered || orderData.quantity, 10) || 1,
              price: parseFloat(orderData.ItemPrice || orderData.price) || 0,
              // Other item fields
            }],
            // Other order fields
          };
        } else if (marketplace === 'Flipkart') {
          // Flipkart-specific processing
          processedOrder = {
            ...processedOrder,
            orderItemId: orderData.orderItemId || orderData['ORDER ITEM ID'],
            orderDate: parseFlipkartDate(orderData.orderedOn || orderData['Ordered On']),
            status: mapFlipkartStatus(orderData.orderState || orderData['Order State']),
            customer: {
              name: orderData.buyerName || orderData['Buyer name'] || orderData['Ship to name'],
              address: orderData.address || orderData['Address Line 1'],
              city: orderData.city || orderData['City'],
              state: orderData.state || orderData['State'],
              pincode: orderData.pincode || orderData['PIN Code'],
            },
            items: [{
              sku: orderData.SKU || orderData['SKU'],
              name: orderData.Product || orderData['Product'],
              quantity: parseInt(orderData.Quantity || orderData['Quantity'], 10) || 1,
              price: parseFloat(orderData.sellingPrice || orderData['Selling Price Per Item']) || 0,
              // Other item fields
            }],
            shipping: {
              shipmentId: orderData.shipmentId || orderData['Shipment ID'],
              trackingId: orderData.trackingId || orderData['Tracking ID'],
              dispatchAfter: parseFlipkartDate(orderData.dispatchAfterDate || orderData['Dispatch After date']),
              dispatchBy: parseFlipkartDate(orderData.dispatchByDate || orderData['Dispatch by date']),
            },
            // Other order fields
          };
        } else if (marketplace === 'Meesho') {
          // Meesho-specific processing
          processedOrder = {
            ...processedOrder,
            orderDate: new Date(orderData.orderDate || orderData['Order Date']),
            status: mapMeeshoStatus(orderData.reason || orderData['Reason for Credit Entry']),
            customer: {
              state: orderData.customerState || orderData['Customer State'],
              // Other customer fields
            },
            items: [{
              sku: orderData.SKU || orderData['SKU'],
              name: orderData.productName || orderData['Product Name'],
              quantity: parseInt(orderData.quantity || orderData['Quantity'], 10) || 1,
              price: parseFloat(orderData.price || orderData['Supplier Listed Price (Incl. GST + Commission)']) || 0,
              // Other item fields
            }],
            // Other order fields
          };
        }
        
        // Try to find SKU and map to MSKU
        for (const item of processedOrder.items) {
          const skuDoc = await Sku.findOne({ sku: item.sku }).populate('product');
          
          if (skuDoc) {
            item.msku = skuDoc.msku;
            item.product = skuDoc.product._id;
          } else {
            // If SKU not found, mark it for later mapping
            item.msku = 'UNMAPPED';
          }
        }
        
        // Create the order
        await Order.create(processedOrder);
        
        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing order: ${error.message}`);
      }
    }
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error importing orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions for status mapping
const mapAmazonStatus = (status) => {
  const statusMap = {
    'Shipped': 'Shipped',
    'Delivered': 'Delivered',
    'Canceled': 'Cancelled',
    'Returned': 'Returned',
    'Pending': 'Processing',
    // Add more mappings as needed
  };
  
  return statusMap[status] || status;
};

const mapFlipkartStatus = (status) => {
  const statusMap = {
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'RETURN_REQUESTED': 'Return Requested',
    'RETURNED': 'Returned',
    // Add more mappings as needed
  };
  
  return statusMap[status] || status;
};

const mapMeeshoStatus = (status) => {
  const statusMap = {
    'DELIVERED': 'Delivered',
    'SHIPPED': 'Shipped',
    'CANCELLED': 'Cancelled',
    'RTO_INITIATED': 'RTO Initiated',
    'RTO_DELIVERED': 'RTO Delivered',
    // Add more mappings as needed
  };
  
  return statusMap[status] || status;
};

// Helper function to parse Flipkart date format (DD-MMM-YY)
const parseFlipkartDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Handle different date formats
    if (dateString.includes('-')) {
      // Format: DD-MMM-YY
      const parts = dateString.split('-');
      const day = parseInt(parts[0], 10);
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[1]);
      const year = 2000 + parseInt(parts[2], 10); // Assuming 20xx
      
      return new Date(year, month, day);
    } else if (dateString.includes('/')) {
      // Format: MM/DD/YY
      return new Date(dateString);
    } else {
      // Try direct parsing
      return new Date(dateString);
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
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
