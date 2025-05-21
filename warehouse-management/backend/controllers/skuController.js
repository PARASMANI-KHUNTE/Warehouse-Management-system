const Sku = require('../models/Sku');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// No longer needed as we're not using mock data anymore

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
    const { sku, msku, marketplace, marketplaceIdentifiers, active } = req.body;
    
    // Check if SKU already exists for this marketplace
    const existingSku = await Sku.findOne({ sku, marketplace });
    if (existingSku) {
      return res.status(400).json({ message: 'SKU already exists for this marketplace' });
    }
    
    // Check if product with this MSKU exists
    const product = await Product.findOne({ msku });
    if (!product) {
      return res.status(404).json({ message: 'Product with this MSKU not found' });
    }
    
    const newSku = await Sku.create({
      sku,
      msku,
      product: product._id,
      marketplace,
      marketplaceIdentifiers: marketplaceIdentifiers || {},
      active: active !== undefined ? active : true
    });
    
    // Create initial inventory entry with 0 quantity
    await Inventory.create({
      product: product._id,
      msku,
      sku,
      marketplace,
      quantity: 0
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
    const { sku, msku, marketplace, marketplaceIdentifiers, active } = req.body;
    
    const existingSku = await Sku.findById(req.params.id);
    
    if (!existingSku) {
      return res.status(404).json({ message: 'SKU not found' });
    }
    
    // If MSKU is being changed, check if the new MSKU exists
    if (msku && msku !== existingSku.msku) {
      const product = await Product.findOne({ msku });
      if (!product) {
        return res.status(404).json({ message: 'Product with this MSKU not found' });
      }
      
      // Update the product reference
      existingSku.product = product._id;
      
      // Update related inventory
      await Inventory.updateOne(
        { sku: existingSku.sku, marketplace: existingSku.marketplace },
        { msku, product: product._id }
      );
    }
    
    // If SKU or marketplace is changing, check for duplicates
    if ((sku && sku !== existingSku.sku) || (marketplace && marketplace !== existingSku.marketplace)) {
      const duplicateSku = await Sku.findOne({
        sku: sku || existingSku.sku,
        marketplace: marketplace || existingSku.marketplace,
        _id: { $ne: req.params.id }
      });
      
      if (duplicateSku) {
        return res.status(400).json({ message: 'SKU already exists for this marketplace' });
      }
      
      // Update related inventory
      await Inventory.updateOne(
        { sku: existingSku.sku, marketplace: existingSku.marketplace },
        { 
          sku: sku || existingSku.sku,
          marketplace: marketplace || existingSku.marketplace
        }
      );
    }
    
    existingSku.sku = sku || existingSku.sku;
    existingSku.msku = msku || existingSku.msku;
    existingSku.marketplace = marketplace || existingSku.marketplace;
    
    if (marketplaceIdentifiers) {
      existingSku.marketplaceIdentifiers = {
        ...existingSku.marketplaceIdentifiers,
        ...marketplaceIdentifiers
      };
    }
    
    if (active !== undefined) {
      existingSku.active = active;
    }
    
    const updatedSku = await existingSku.save();
    
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
    
    // Delete related inventory
    await Inventory.deleteOne({ sku: sku.sku, marketplace: sku.marketplace });
    
    await sku.remove();
    
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
      return res.status(400).json({ message: 'Invalid SKU data' });
    }
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const skuData of skus) {
      try {
        const { sku, msku, marketplace } = skuData;
        
        if (!sku || !msku || !marketplace) {
          results.failed++;
          results.errors.push(`Missing required fields for SKU: ${sku}`);
          continue;
        }
        
        // Check if product exists
        const product = await Product.findOne({ msku });
        if (!product) {
          results.failed++;
          results.errors.push(`Product with MSKU ${msku} not found for SKU: ${sku}`);
          continue;
        }
        
        // Check if SKU exists
        const existingSku = await Sku.findOne({ sku, marketplace });
        
        if (existingSku) {
          // Update existing SKU
          existingSku.msku = msku;
          existingSku.product = product._id;
          
          if (skuData.marketplaceIdentifiers) {
            existingSku.marketplaceIdentifiers = {
              ...existingSku.marketplaceIdentifiers,
              ...skuData.marketplaceIdentifiers
            };
          }
          
          if (skuData.active !== undefined) {
            existingSku.active = skuData.active;
          }
          
          await existingSku.save();
          
          // Update inventory if it exists
          const inventory = await Inventory.findOne({ sku, marketplace });
          if (inventory) {
            inventory.msku = msku;
            inventory.product = product._id;
            await inventory.save();
          } else {
            // Create inventory if it doesn't exist
            await Inventory.create({
              product: product._id,
              msku,
              sku,
              marketplace,
              quantity: 0
            });
          }
          
          results.updated++;
        } else {
          // Create new SKU
          await Sku.create({
            sku,
            msku,
            product: product._id,
            marketplace,
            marketplaceIdentifiers: skuData.marketplaceIdentifiers || {},
            active: skuData.active !== undefined ? skuData.active : true
          });
          
          // Create inventory
          await Inventory.create({
            product: product._id,
            msku,
            sku,
            marketplace,
            quantity: 0
          });
          
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing SKU ${skuData.sku}: ${error.message}`);
      }
    }
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in bulk SKU operation:', error);
    res.status(500).json({ message: 'Server error' });
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
