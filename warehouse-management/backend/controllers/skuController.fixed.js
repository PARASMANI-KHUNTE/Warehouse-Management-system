const Sku = require('../models/Sku');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// @desc    Get all SKUs
// @route   GET /api/skus
// @access  Private
const getSkus = async (req, res) => {
  try {
    const skus = await Sku.find().populate('product', 'name category');
    res.status(200).json(skus);
  } catch (error) {
    console.error('Error fetching SKUs:', error);
    res.status(500).json({ message: 'Server error' });
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
    
    res.status(200).json(skus);
  } catch (error) {
    console.error('Error fetching SKUs by MSKU:', error);
    res.status(500).json({ message: 'Server error' });
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
    
    res.status(200).json({
      sku,
      inventory: inventory || { quantity: 0 }
    });
  } catch (error) {
    console.error('Error fetching SKU:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get SKU by code
// @route   GET /api/skus/code/:sku
// @access  Private
const getSkuByCode = async (req, res) => {
  try {
    const { sku } = req.params;
    const { marketplace } = req.query;
    
    const query = { sku };
    if (marketplace) {
      query.marketplace = marketplace;
    }
    
    const skuDoc = await Sku.findOne(query).populate('product', 'name category msku');
    
    if (!skuDoc) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // Get inventory for this SKU
    const inventory = await Inventory.findOne({ 
      sku: skuDoc.sku, 
      marketplace: skuDoc.marketplace 
    });
    
    res.status(200).json({
      sku: skuDoc,
      inventory: inventory || { quantity: 0 }
    });
  } catch (error) {
    console.error('Error fetching SKU by code:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new SKU
// @route   POST /api/skus
// @access  Private
const createSku = async (req, res) => {
  try {
    const { sku, msku, marketplace, marketplaceIdentifiers, active, product: productId } = req.body;
    
    // Check if SKU already exists for this marketplace
    const existingSku = await Sku.findOne({ sku, marketplace });
    if (existingSku) {
      return res.status(400).json({ message: 'SKU already exists for this marketplace' });
    }
    
    // Check if product exists
    let product;
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } else if (msku) {
      // Try to find product by MSKU
      product = await Product.findOne({ msku });
      if (!product) {
        return res.status(404).json({ message: 'Product with this MSKU not found' });
      }
    } else {
      return res.status(400).json({ message: 'Either product ID or MSKU is required' });
    }
    
    const newSku = await Sku.create({
      sku,
      msku: msku || product.msku,
      marketplace,
      marketplaceIdentifiers: marketplaceIdentifiers || {},
      product: product._id,
      active: active !== undefined ? active : true
    });
    
    // Create initial inventory record with zero quantity
    await Inventory.create({
      sku,
      msku: msku || product.msku,
      marketplace,
      quantity: 0,
      lastUpdated: new Date()
    });
    
    res.status(201).json(newSku);
  } catch (error) {
    console.error('Error creating SKU:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a SKU
// @route   PUT /api/skus/:id
// @access  Private
const updateSku = async (req, res) => {
  try {
    const { sku, msku, marketplace, marketplaceIdentifiers, active, product: productId } = req.body;
    
    // Find the SKU to update
    const skuToUpdate = await Sku.findById(req.params.id);
    if (!skuToUpdate) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // If changing SKU code or marketplace, check if it already exists
    if ((sku && sku !== skuToUpdate.sku) || (marketplace && marketplace !== skuToUpdate.marketplace)) {
      const existingSku = await Sku.findOne({ 
        sku: sku || skuToUpdate.sku, 
        marketplace: marketplace || skuToUpdate.marketplace,
        _id: { $ne: skuToUpdate._id }
      });
      
      if (existingSku) {
        return res.status(400).json({ message: 'SKU already exists for this marketplace' });
      }
    }
    
    // Check if product exists if changing product
    let product;
    if (productId && productId !== skuToUpdate.product.toString()) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }
    
    // If changing MSKU but not product, check if product with new MSKU exists
    if (msku && msku !== skuToUpdate.msku && !productId) {
      product = await Product.findOne({ msku });
      if (!product) {
        return res.status(404).json({ message: 'Product with this MSKU not found' });
      }
    }
    
    // Update SKU
    const updatedSku = await Sku.findByIdAndUpdate(
      req.params.id,
      {
        sku: sku || skuToUpdate.sku,
        msku: msku || skuToUpdate.msku,
        marketplace: marketplace || skuToUpdate.marketplace,
        marketplaceIdentifiers: marketplaceIdentifiers || skuToUpdate.marketplaceIdentifiers,
        product: productId || skuToUpdate.product,
        active: active !== undefined ? active : skuToUpdate.active
      },
      { new: true }
    );
    
    // Update inventory record if SKU code or marketplace changed
    if ((sku && sku !== skuToUpdate.sku) || (marketplace && marketplace !== skuToUpdate.marketplace)) {
      await Inventory.updateOne(
        { 
          sku: skuToUpdate.sku, 
          marketplace: skuToUpdate.marketplace 
        },
        {
          sku: sku || skuToUpdate.sku,
          msku: msku || skuToUpdate.msku,
          marketplace: marketplace || skuToUpdate.marketplace
        }
      );
    }
    
    res.status(200).json(updatedSku);
  } catch (error) {
    console.error('Error updating SKU:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a SKU
// @route   DELETE /api/skus/:id
// @access  Private
const deleteSku = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);
    
    if (!sku) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // Delete SKU
    await Sku.findByIdAndDelete(req.params.id);
    
    // Delete associated inventory
    await Inventory.deleteOne({ sku: sku.sku, marketplace: sku.marketplace });
    
    res.status(200).json({ message: 'SKU deleted successfully' });
  } catch (error) {
    console.error('Error deleting SKU:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk create or update SKUs
// @route   POST /api/skus/bulk
// @access  Private
const bulkCreateUpdateSkus = async (req, res) => {
  try {
    const { skus } = req.body;
    
    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({ message: 'SKUs data is required' });
    }
    
    const results = {
      total: skus.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const skuData of skus) {
      try {
        const { sku, msku, marketplace, marketplaceIdentifiers, active } = skuData;
        
        if (!sku || !msku || !marketplace) {
          results.failed++;
          results.errors.push({
            sku: sku || 'Unknown',
            error: 'SKU, MSKU, and marketplace are required'
          });
          continue;
        }
        
        // Check if product with this MSKU exists
        const product = await Product.findOne({ msku });
        if (!product) {
          results.failed++;
          results.errors.push({
            sku,
            error: `Product with MSKU ${msku} not found`
          });
          continue;
        }
        
        // Check if SKU already exists
        const existingSku = await Sku.findOne({ sku, marketplace });
        
        if (existingSku) {
          // Update existing SKU
          await Sku.updateOne(
            { _id: existingSku._id },
            {
              msku,
              marketplaceIdentifiers: marketplaceIdentifiers || existingSku.marketplaceIdentifiers,
              product: product._id,
              active: active !== undefined ? active : existingSku.active
            }
          );
          
          results.updated++;
        } else {
          // Create new SKU
          await Sku.create({
            sku,
            msku,
            marketplace,
            marketplaceIdentifiers: marketplaceIdentifiers || {},
            product: product._id,
            active: active !== undefined ? active : true
          });
          
          // Create initial inventory record with zero quantity
          await Inventory.create({
            sku,
            msku,
            marketplace,
            quantity: 0,
            lastUpdated: new Date()
          });
          
          results.created++;
        }
      } catch (error) {
        console.error('Error processing SKU:', error);
        results.failed++;
        results.errors.push({
          sku: skuData.sku || 'Unknown',
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Processed ${results.total} SKUs: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error bulk processing SKUs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSkus,
  getSkusByMsku,
  getSkuById,
  getSkuByCode,
  createSku,
  updateSku,
  deleteSku,
  bulkCreateUpdateSkus
};
