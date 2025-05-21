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
    
    // Query for orders in date range
    const dateQuery = {
      orderDate: {
        $gte: start,
        $lte: end
      }
    };
    
    // Get order counts by status
    const orderStatusCounts = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get order counts by marketplace
    const marketplaceCounts = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: '$marketplace',
          count: { $sum: 1 },
          revenue: { $sum: { $toDouble: '$payment.amount' } }
        }
      }
    ]);
    
    // Get total revenue
    const revenueData = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: null,
          total: { $sum: { $toDouble: '$payment.amount' } }
        }
      }
    ]);
    
    // Get daily revenue for chart
    const dailyRevenue = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          revenue: { $sum: { $toDouble: '$payment.amount' } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get inventory summary
    const inventorySummary = await Inventory.aggregate([
      { $group: {
          _id: '$marketplace',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    // Get low stock items
    const lowStockItems = await Inventory.aggregate([
      { $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $match: {
          $expr: {
            $lt: ['$quantity', { $ifNull: ['$productInfo.lowStockThreshold', 10] }]
          }
        }
      },
      { $limit: 10 }
    ]);
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ orderDate: -1 })
      .limit(5);
    
    // Get product counts
    const productCount = await Product.countDocuments();
    const skuCount = await Sku.countDocuments();
    
    // Format response
    const response = {
      orderSummary: {
        total: orderStatusCounts.reduce((sum, item) => sum + item.count, 0),
        byStatus: orderStatusCounts.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {})
      },
      marketplaceSummary: marketplaceCounts.reduce((obj, item) => {
        obj[item._id] = {
          orders: item.count,
          revenue: item.revenue
        };
        return obj;
      }, {}),
      revenue: {
        total: revenueData.length > 0 ? revenueData[0].total : 0,
        daily: dailyRevenue
      },
      inventory: {
        summary: inventorySummary.reduce((obj, item) => {
          obj[item._id] = {
            items: item.totalItems,
            quantity: item.totalQuantity
          };
          return obj;
        }, {}),
        lowStock: lowStockItems
      },
      products: {
        total: productCount,
        skus: skuCount
      },
      recentOrders
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get sales data for charts
// @route   GET /api/dashboard/sales
// @access  Private
const getSalesData = async (req, res) => {
  try {
    // Get date range and grouping (daily, weekly, monthly)
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Format string for date grouping
    let dateFormat;
    switch (groupBy) {
      case 'weekly':
        dateFormat = '%Y-%U'; // Year-Week
        break;
      case 'monthly':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }
    
    // Query for orders in date range
    const dateQuery = {
      orderDate: {
        $gte: start,
        $lte: end
      }
    };
    
    // Get sales data grouped by date
    const salesData = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: { 
            date: { $dateToString: { format: dateFormat, date: '$orderDate' } },
            marketplace: '$marketplace'
          },
          revenue: { $sum: { $toDouble: '$payment.amount' } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Restructure data for frontend charts
    const formattedData = salesData.reduce((result, item) => {
      const { date, marketplace } = item._id;
      
      if (!result[date]) {
        result[date] = {
          date,
          totalRevenue: 0,
          totalOrders: 0
        };
      }
      
      result[date][`${marketplace}Revenue`] = item.revenue;
      result[date][`${marketplace}Orders`] = item.orders;
      result[date].totalRevenue += item.revenue;
      result[date].totalOrders += item.orders;
      
      return result;
    }, {});
    
    res.status(200).json(Object.values(formattedData));
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
    // Get date range
    const { startDate, endDate, limit = 10 } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Query for orders in date range
    const dateQuery = {
      orderDate: {
        $gte: start,
        $lte: end
      }
    };
    
    // Get top products by quantity sold
    const topProducts = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.msku',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          marketplace: { $first: '$marketplace' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.status(200).json(topProducts);
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
    // Get inventory status summary
    const inventoryStatus = await Inventory.aggregate([
      { $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $project: {
          msku: 1,
          sku: 1,
          marketplace: 1,
          quantity: 1,
          productName: '$productInfo.name',
          lowStockThreshold: { $ifNull: ['$productInfo.lowStockThreshold', 10] },
          status: {
            $cond: {
              if: { $eq: ['$quantity', 0] },
              then: 'Out of Stock',
              else: {
                $cond: {
                  if: { $lt: ['$quantity', { $ifNull: ['$productInfo.lowStockThreshold', 10] }] },
                  then: 'Low Stock',
                  else: 'In Stock'
                }
              }
            }
          }
        }
      },
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get inventory by marketplace
    const inventoryByMarketplace = await Inventory.aggregate([
      { $group: {
          _id: '$marketplace',
          totalItems: { $sum: 1 },
          inStock: { 
            $sum: { 
              $cond: [{ $gt: ['$quantity', 0] }, 1, 0] 
            } 
          },
          outOfStock: { 
            $sum: { 
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0] 
            } 
          },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    res.status(200).json({
      statusSummary: inventoryStatus.reduce((obj, item) => {
        obj[item._id] = item.count;
        return obj;
      }, {}),
      byMarketplace: inventoryByMarketplace
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
