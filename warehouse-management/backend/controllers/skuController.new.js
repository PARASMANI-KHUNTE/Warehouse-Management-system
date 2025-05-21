const Sku = require('../models/Sku');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// @desc    Get all SKUs
// @route   GET /api/skus
// @access  Private
const getSkus = async (req, res) => {
  try {
    const skus = await Sku.find().populate('product', 'name category');
    return res.status(200).json(skus);
  } catch (error) {
    console.error('Error fetching SKUs:', error);
    return res.status(200).json([]);
  }
};

// @desc    Get SKUs by MSKU
// @route   GET /api/skus/msku/:msku
// @access  Private
const getSkusByMsku = async (req, res) => {
  try {
    const { msku } = req.params;
    
    const skus = await Sku.find({ msku }).populate('product', 'name category');
    
    if (!skus || skus.length === 0) {
      return res.status(404).json({ message: 'No SKUs found for this MSKU' });
    }
    
    return res.status(200).json(skus);
  } catch (error) {
    console.error('Error fetching SKUs by MSKU:', error);
    return res.status(200).json([]);
  }
};

// @desc    Get a single SKU
// @route   GET /api/skus/:id
// @access  Private
const getSkuById = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id).populate('product', 'name category msku');
    
    if (!sku) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // Get inventory for this SKU
    const inventory = await Inventory.findOne({ 
      sku: sku.sku, 
      marketplace: sku.marketplace 
    });
    
    return res.status(200).json({
      sku,
      inventory: inventory || { quantity: 0 }
    });
  } catch (error) {
    console.error('Error fetching SKU:', error);
    return res.status(404).json({ message: 'SKU not found' });
  }
};

// @desc    Create a new SKU
// @route   POST /api/skus
// @access  Private
const createSku = async (req, res) => {
  try {
    const { sku, msku, marketplace, productId } = req.body;

    // Check if SKU already exists for this marketplace
    const existingSku = await Sku.findOne({ sku, marketplace });
    if (existingSku) {
      return res.status(400).json({ message: 'SKU already exists for this marketplace' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create new SKU
    const newSku = new Sku({
      sku,
      msku: msku || product.msku,
      marketplace,
      product: productId
    });

    const savedSku = await newSku.save();
    
    // Create initial inventory record
    const inventory = new Inventory({
      sku,
      msku: msku || product.msku,
      marketplace,
      quantity: 0
    });
    
    await inventory.save();

    return res.status(201).json(savedSku);
  } catch (error) {
    console.error('Error creating SKU:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a SKU
// @route   PUT /api/skus/:id
// @access  Private
const updateSku = async (req, res) => {
  try {
    const { sku, msku, marketplace, productId } = req.body;
    
    // Check if SKU exists
    const existingSku = await Sku.findById(req.params.id);
    if (!existingSku) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // Check if the new SKU code is already used by another SKU in the same marketplace
    if (sku !== existingSku.sku || marketplace !== existingSku.marketplace) {
      const duplicateSku = await Sku.findOne({ 
        sku, 
        marketplace,
        _id: { $ne: req.params.id }
      });
      
      if (duplicateSku) {
        return res.status(400).json({ 
          message: 'SKU already exists for this marketplace' 
        });
      }
    }
    
    // Check if product exists if productId is provided
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }
    
    // Update SKU
    const updatedSku = await Sku.findByIdAndUpdate(
      req.params.id,
      { 
        sku: sku || existingSku.sku,
        msku: msku || existingSku.msku,
        marketplace: marketplace || existingSku.marketplace,
        product: productId || existingSku.product
      },
      { new: true }
    ).populate('product', 'name category');
    
    // Update inventory record if SKU code or marketplace changed
    if (sku !== existingSku.sku || marketplace !== existingSku.marketplace) {
      await Inventory.updateOne(
        { sku: existingSku.sku, marketplace: existingSku.marketplace },
        { sku, marketplace }
      );
    }
    
    return res.status(200).json(updatedSku);
  } catch (error) {
    console.error('Error updating SKU:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a SKU
// @route   DELETE /api/skus/:id
// @access  Private
const deleteSku = async (req, res) => {
  try {
    // Check if SKU exists
    const sku = await Sku.findById(req.params.id);
    if (!sku) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // Delete SKU
    await Sku.findByIdAndDelete(req.params.id);
    
    // Delete associated inventory
    await Inventory.deleteOne({ sku: sku.sku, marketplace: sku.marketplace });
    
    return res.status(200).json({ message: 'SKU deleted successfully' });
  } catch (error) {
    console.error('Error deleting SKU:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk create or update SKUs
// @route   POST /api/skus/bulk
// @access  Private
const bulkCreateUpdateSkus = async (req, res) => {
  try {
    const { skus } = req.body;
    
    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({ message: 'No SKUs provided' });
    }
    
    const results = {
      created: [],
      updated: [],
      failed: []
    };
    
    // Process each SKU
    for (const skuData of skus) {
      try {
        const { sku, msku, marketplace, productId } = skuData;
        
        if (!sku || !marketplace || !productId) {
          results.failed.push({
            sku,
            error: 'Missing required fields (sku, marketplace, or productId)'
          });
          continue;
        }
        
        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
          results.failed.push({
            sku,
            error: 'Product not found'
          });
          continue;
        }
        
        // Check if SKU already exists
        const existingSku = await Sku.findOne({ sku, marketplace });
        
        if (existingSku) {
          // Update existing SKU
          const updatedSku = await Sku.findByIdAndUpdate(
            existingSku._id,
            { 
              msku: msku || product.msku,
              product: productId
            },
            { new: true }
          );
          
          results.updated.push(updatedSku);
        } else {
          // Create new SKU
          const newSku = new Sku({
            sku,
            msku: msku || product.msku,
            marketplace,
            product: productId
          });
          
          const savedSku = await newSku.save();
          
          // Create initial inventory record
          const inventory = new Inventory({
            sku,
            msku: msku || product.msku,
            marketplace,
            quantity: 0
          });
          
          await inventory.save();
          
          results.created.push(savedSku);
        }
      } catch (error) {
        console.error('Error processing SKU:', error);
        results.failed.push({
          sku: skuData.sku,
          error: error.message
        });
      }
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in bulk SKU operation:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSkus,
  getSkusByMsku,
  getSkuById,
  createSku,
  updateSku,
  deleteSku,
  bulkCreateUpdateSkus
};
