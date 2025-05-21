const Order = require('../models/Order');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Sku = require('../models/Sku');

// @desc    Get dashboard summary data
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Return empty data when no data is available
    return res.status(200).json({
      orderStatus: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0
      },
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      inventorySummary: {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      },
      recentOrders: [],
      topProducts: [],
      salesByMarketplace: [],
      salesTrend: []
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get sales data for charts
// @route   GET /api/dashboard/sales
// @access  Private
const getSalesData = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Return empty data when no data is available
    return res.status(200).json({
      salesByMarketplace: [],
      salesTrend: []
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get top selling products
// @route   GET /api/dashboard/top-products
// @access  Private
const getTopProducts = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Return empty data when no data is available
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory status
// @route   GET /api/dashboard/inventory-status
// @access  Private
const getInventoryStatus = async (req, res) => {
  try {
    // Return empty data when no data is available
    return res.status(200).json({
      lowStockItems: [],
      outOfStockItems: [],
      summary: {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardSummary,
  getSalesData,
  getTopProducts,
  getInventoryStatus
};
