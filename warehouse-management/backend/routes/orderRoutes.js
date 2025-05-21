const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderShipping,
  updateOrder,
  deleteOrder,
  importOrders
} = require('../controllers/orderController');

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', getOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', getOrderById);

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', createOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', updateOrderStatus);

// @route   PUT /api/orders/:id/shipping
// @desc    Update order shipping info
// @access  Private
router.put('/:id/shipping', updateOrderShipping);

// @route   PUT /api/orders/:id
// @desc    Update entire order
// @access  Private
router.put('/:id', updateOrder);

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Private
router.delete('/:id', deleteOrder);

// @route   POST /api/orders/import
// @desc    Import orders from CSV data
// @access  Private
router.post('/import', importOrders);

module.exports = router;
