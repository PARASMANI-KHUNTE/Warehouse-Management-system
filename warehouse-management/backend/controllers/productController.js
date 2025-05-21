const Product = require('../models/Product');
const Sku = require('../models/Sku');
const Inventory = require('../models/Inventory');

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return Product.db.readyState === 1; // 1 = connected
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (isMongoConnected()) {
      const products = await Product.find();
      return res.status(200).json(products);
    } else {
      // Return empty array if MongoDB is unavailable
      console.log('MongoDB unavailable, returning empty product array');
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array on error
    console.log('Error occurred, returning empty product array');
    return res.status(200).json([]);
  }
};

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (isMongoConnected()) {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Get all SKUs associated with this product's MSKU
      const skus = await Sku.find({ msku: product.msku });
      
      // Get inventory levels for this product
      const inventory = await Inventory.find({ msku: product.msku });
      
      // Calculate total stock across all marketplaces
      const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
      
      // Group inventory by marketplace
      const stockByMarketplace = inventory.reduce((acc, item) => {
        if (!acc[item.marketplace]) {
          acc[item.marketplace] = 0;
        }
        acc[item.marketplace] += item.quantity;
        return acc;
      }, {});
      
      return res.status(200).json({
        product,
        skus,
        inventory: {
          totalStock,
          stockByMarketplace
        }
      });
    } else {
      // Return empty data if MongoDB is unavailable
      console.log('MongoDB unavailable, returning empty data');
      return res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { msku, name, description, category, hsnCode, dimensions, lowStockThreshold } = req.body;
    
    // Check if product with this MSKU already exists
    const existingProduct = await Product.findOne({ msku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this MSKU already exists' });
    }
    
    const product = await Product.create({
      msku,
      name,
      description,
      category,
      hsnCode,
      dimensions,
      lowStockThreshold
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { msku, name, description, category, hsnCode, dimensions, lowStockThreshold } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // If MSKU is being changed, check if the new MSKU already exists
    if (msku && msku !== product.msku) {
      const existingProduct = await Product.findOne({ msku });
      if (existingProduct && existingProduct._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Product with this MSKU already exists' });
      }
      
      // Update MSKU in all related SKUs and inventory items
      await Sku.updateMany({ msku: product.msku }, { msku });
      await Inventory.updateMany({ msku: product.msku }, { msku });
    }
    
    product.msku = msku || product.msku;
    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.hsnCode = hsnCode || product.hsnCode;
    product.dimensions = dimensions || product.dimensions;
    product.lowStockThreshold = lowStockThreshold || product.lowStockThreshold;
    
    const updatedProduct = await product.save();
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete all SKUs and inventory items associated with this product
    await Sku.deleteMany({ msku: product.msku });
    await Inventory.deleteMany({ msku: product.msku });
    
    await product.remove();
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
