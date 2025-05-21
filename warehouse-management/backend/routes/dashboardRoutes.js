const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getSalesData,
  getTopProducts,
  getInventoryStatus
} = require('../controllers/dashboardController.new');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary data
// @access  Private
router.get('/summary', getDashboardSummary);

// @route   GET /api/dashboard/sales
// @desc    Get sales data for charts
// @access  Private
router.get('/sales', getSalesData);

// @route   GET /api/dashboard/top-products
// @desc    Get top selling products
// @access  Private
router.get('/top-products', getTopProducts);

// @route   GET /api/dashboard/inventory-status
// @desc    Get inventory status
// @access  Private
router.get('/inventory-status', getInventoryStatus);

module.exports = router;
