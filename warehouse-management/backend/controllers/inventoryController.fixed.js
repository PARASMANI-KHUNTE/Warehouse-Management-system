const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Sku = require('../models/Sku');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate('product', 'name category lowStockThreshold');
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory summary by MSKU
// @route   GET /api/inventory/summary
// @access  Private
const getInventorySummary = async (req, res) => {
  try {
    // Get all products
    const products = await Product.find();
    
    const summaryPromises = products.map(async (product) => {
      // Get all inventory items for this product
      const inventoryItems = await Inventory.find({ msku: product.msku });
      
      // Calculate total quantity across all marketplaces
      const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Check if any marketplace is low on stock
      const lowStock = inventoryItems.some(item => 
        item.quantity < (product.lowStockThreshold || 10)
      );
      
      // Get marketplace breakdown
      const marketplaceBreakdown = inventoryItems.map(item => ({
        marketplace: item.marketplace,
        quantity: item.quantity,
        lowStock: item.quantity < (product.lowStockThreshold || 10)
      }));
      
      return {
        productId: product._id,
        msku: product.msku,
        name: product.name,
        category: product.category,
        totalQuantity,
        lowStock,
        threshold: product.lowStockThreshold || 10,
        marketplaces: marketplaceBreakdown
      };
    });
    
    const inventorySummary = await Promise.all(summaryPromises);
    
    // Calculate overall stats
    const stats = {
      totalProducts: inventorySummary.length,
      totalItems: inventorySummary.reduce((sum, item) => sum + item.totalQuantity, 0),
      lowStockProducts: inventorySummary.filter(item => item.lowStock).length,
      outOfStockProducts: inventorySummary.filter(item => item.totalQuantity === 0).length
    };
    
    res.status(200).json({
      stats,
      inventory: inventorySummary
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory for a specific product
// @route   GET /api/inventory/product/:productId
// @access  Private
const getInventoryByProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const inventory = await Inventory.find({ msku: product.msku });
    
    res.status(200).json({
      product,
      inventory
    });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory for a specific MSKU
// @route   GET /api/inventory/msku/:msku
// @access  Private
const getInventoryByMsku = async (req, res) => {
  try {
    const { msku } = req.params;
    
    // Get product info
    const product = await Product.findOne({ msku });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get all SKUs for this MSKU
    const skus = await Sku.find({ msku });
    
    // Get inventory for all SKUs
    const inventory = await Inventory.find({ msku });
    
    // Create a map of marketplace to inventory
    const inventoryMap = {};
    inventory.forEach(item => {
      inventoryMap[item.marketplace] = item;
    });
    
    // Create a complete inventory view including SKUs with no inventory
    const completeInventory = skus.map(sku => {
      const inventoryItem = inventoryMap[sku.marketplace] || {
        sku: sku.sku,
        msku,
        marketplace: sku.marketplace,
        quantity: 0,
        lastUpdated: null
      };
      
      return {
        sku: sku.sku,
        msku,
        marketplace: sku.marketplace,
        quantity: inventoryItem.quantity,
        lastUpdated: inventoryItem.lastUpdated
      };
    });
    
    res.status(200).json({
      product,
      inventory: completeInventory
    });
  } catch (error) {
    console.error('Error fetching MSKU inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update inventory quantity
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    inventory.quantity = quantity;
    inventory.lastUpdated = new Date();
    
    await inventory.save();
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Adjust inventory quantity (add or subtract)
// @route   PUT /api/inventory/adjust/:id
// @access  Private
const adjustInventory = async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    
    if (adjustment === undefined) {
      return res.status(400).json({ message: 'Adjustment value is required' });
    }
    
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Get product to check for low stock threshold
    const product = await Product.findOne({ msku: inventory.msku });
    const lowStockThreshold = product ? product.lowStockThreshold || 10 : 10;
    
    // Calculate new quantity
    const newQuantity = inventory.quantity + adjustment;
    
    // Don't allow negative inventory
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Adjustment would result in negative inventory' });
    }
    
    // Update inventory
    inventory.quantity = newQuantity;
    inventory.lastUpdated = new Date();
    
    // Add to history
    inventory.history.push({
      date: new Date(),
      adjustment,
      reason: reason || 'Manual adjustment',
      newQuantity
    });
    
    await inventory.save();
    
    res.status(200).json({
      inventory,
      lowStock: newQuantity < lowStockThreshold
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk update inventory
// @route   POST /api/inventory/bulk
// @access  Private
const updateInventoryBulk = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Inventory items are required' });
    }
    
    const results = {
      total: items.length,
      updated: 0,
      created: 0,
      failed: 0,
      errors: []
    };
    
    for (const item of items) {
      try {
        const { sku, marketplace, quantity, msku } = item;
        
        if (!sku || !marketplace || quantity === undefined) {
          results.failed++;
          results.errors.push({
            sku: sku || 'Unknown',
            error: 'SKU, marketplace, and quantity are required'
          });
          continue;
        }
        
        // Check if inventory item exists
        let inventoryItem = await Inventory.findOne({ sku, marketplace });
        
        if (inventoryItem) {
          // Update existing inventory
          inventoryItem.quantity = quantity;
          inventoryItem.lastUpdated = new Date();
          
          // Add to history
          inventoryItem.history.push({
            date: new Date(),
            adjustment: quantity - inventoryItem.quantity,
            reason: 'Bulk update',
            newQuantity: quantity
          });
          
          await inventoryItem.save();
          results.updated++;
        } else {
          // Create new inventory item
          // First check if SKU exists
          const skuDoc = await Sku.findOne({ sku, marketplace });
          
          if (!skuDoc) {
            results.failed++;
            results.errors.push({
              sku,
              error: `SKU ${sku} not found for ${marketplace}`
            });
            continue;
          }
          
          // Create inventory item
          await Inventory.create({
            sku,
            msku: msku || skuDoc.msku,
            marketplace,
            quantity,
            lastUpdated: new Date(),
            history: [{
              date: new Date(),
              adjustment: quantity,
              reason: 'Initial inventory',
              newQuantity: quantity
            }]
          });
          
          results.created++;
        }
      } catch (error) {
        console.error('Error processing inventory item:', error);
        results.failed++;
        results.errors.push({
          sku: item.sku || 'Unknown',
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Processed ${results.total} inventory items: ${results.updated} updated, ${results.created} created, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getInventory,
  getInventorySummary,
  getInventoryByProduct,
  getInventoryByMsku,
  getInventoryById,
  updateInventory,
  adjustInventory,
  updateInventoryBulk
};
