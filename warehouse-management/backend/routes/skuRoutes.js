const express = require('express');
const router = express.Router();
const {
  getSkus,
  getSkuById,
  createSku,
  updateSku,
  deleteSku,
  getSkusByMsku,
  bulkCreateUpdateSkus
} = require('../controllers/skuController.new');

// @route   GET /api/skus
// @desc    Get all SKUs
// @access  Private
router.get('/', getSkus);

// Route removed - functionality integrated into other endpoints

// @route   GET /api/skus/msku/:msku
// @desc    Get SKUs by MSKU
// @access  Private
router.get('/msku/:msku', getSkusByMsku);

// @route   GET /api/skus/:id
// @desc    Get SKU by ID
// @access  Private
router.get('/:id', getSkuById);

// @route   POST /api/skus
// @desc    Create a new SKU
// @access  Private
router.post('/', createSku);

// @route   POST /api/skus/bulk
// @desc    Bulk create or update SKUs
// @access  Private
router.post('/bulk', bulkCreateUpdateSkus);

// @route   PUT /api/skus/:id
// @desc    Update a SKU
// @access  Private
router.put('/:id', updateSku);

// @route   DELETE /api/skus/:id
// @desc    Delete a SKU
// @access  Private
router.delete('/:id', deleteSku);

module.exports = router;
