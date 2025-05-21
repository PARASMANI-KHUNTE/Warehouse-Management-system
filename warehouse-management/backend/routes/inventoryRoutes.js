const express = require('express');
const router = express.Router();
const {
  getInventory,
  getInventoryById,
  updateInventory,
  bulkUpdateInventory,
  getInventorySummary,
  getInventoryByProduct,
  getInventoryByMsku,
  adjustInventory
} = require('../controllers/inventoryController');

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private
router.get('/', getInventory);

// @route   GET /api/inventory/summary
// @desc    Get inventory summary by MSKU
// @access  Private
router.get('/summary', getInventorySummary);

// @route   GET /api/inventory/product/:productId
// @desc    Get inventory for a specific product
// @access  Private
router.get('/product/:productId', getInventoryByProduct);

// @route   GET /api/inventory/msku/:msku
// @desc    Get inventory for a specific MSKU
// @access  Private
router.get('/msku/:msku', getInventoryByMsku);

// @route   GET /api/inventory/:id
// @desc    Get inventory item by ID
// @access  Private
router.get('/:id', getInventoryById);

// @route   PUT /api/inventory/adjust/:id
// @desc    Adjust inventory quantity (add or subtract)
// @access  Private
router.put('/adjust/:id', adjustInventory);

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', updateInventory);

// @route   POST /api/inventory/bulk
// @desc    Update multiple inventory items
// @access  Private
router.post('/bulk', bulkUpdateInventory);

module.exports = router;
