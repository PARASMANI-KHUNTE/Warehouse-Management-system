const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', getProducts);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', getProductById);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private
router.post('/', createProduct);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', deleteProduct);

module.exports = router;
