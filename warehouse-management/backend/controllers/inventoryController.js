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
      
      // Calculate total stock
      const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Group by marketplace
      const stockByMarketplace = inventoryItems.reduce((acc, item) => {
        if (!acc[item.marketplace]) {
          acc[item.marketplace] = 0;
        }
        acc[item.marketplace] += item.quantity;
        return acc;
      }, {});
      
      // Get all SKUs for this product
      const skus = await Sku.find({ msku: product.msku });
      
      // Determine stock status
      let stockStatus = 'In Stock';
      if (totalStock === 0) {
        stockStatus = 'Out of Stock';
      } else if (totalStock <= product.lowStockThreshold) {
        stockStatus = 'Low Stock';
      }
      
      return {
        id: product._id,
        msku: product.msku,
        name: product.name,
        category: product.category,
        totalStock,
        stockByMarketplace,
        lowStockThreshold: product.lowStockThreshold,
        stockStatus,
        skus: skus.map(sku => ({
          id: sku._id,
          sku: sku.sku,
          marketplace: sku.marketplace,
          stock: inventoryItems.find(
            item => item.sku === sku.sku && item.marketplace === sku.marketplace
          )?.quantity || 0
        }))
      };
    });
    
    const inventorySummary = await Promise.all(summaryPromises);
    
    res.status(200).json(inventorySummary);
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
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const inventory = await Inventory.find({ product: productId });
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('product', 'name category lowStockThreshold');
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory for a specific MSKU
// @route   GET /api/inventory/msku/:msku
// @access  Private
const getInventoryByMsku = async (req, res) => {
  try {
    const { msku } = req.params;
    
    const product = await Product.findOne({ msku });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const inventory = await Inventory.find({ msku });
    
    // Calculate total stock
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    // Group by marketplace
    const stockByMarketplace = inventory.reduce((acc, item) => {
      if (!acc[item.marketplace]) {
        acc[item.marketplace] = 0;
      }
      acc[item.marketplace] += item.quantity;
      return acc;
    }, {});
    
    res.status(200).json({
      product,
      inventory,
      totalStock,
      stockByMarketplace,
      lowStockThreshold: product.lowStockThreshold,
      stockStatus: totalStock === 0 
        ? 'Out of Stock' 
        : totalStock <= product.lowStockThreshold 
          ? 'Low Stock' 
          : 'In Stock'
    });
  } catch (error) {
    console.error('Error fetching MSKU inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update inventory quantity
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    inventory.quantity = quantity;
    inventory.lastUpdated = Date.now();
    
    const updatedInventory = await inventory.save();
    
    res.status(200).json(updatedInventory);
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
    const { adjustment, type } = req.body;
    
    if (adjustment === undefined || isNaN(adjustment) || adjustment < 0) {
      return res.status(400).json({ message: 'Valid adjustment amount is required' });
    }
    
    if (type !== 'add' && type !== 'remove') {
      return res.status(400).json({ message: 'Type must be either "add" or "remove"' });
    }
    
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    if (type === 'add') {
      inventory.quantity += adjustment;
    } else {
      inventory.quantity = Math.max(0, inventory.quantity - adjustment);
    }
    
    inventory.lastUpdated = Date.now();
    
    const updatedInventory = await inventory.save();
    
    res.status(200).json(updatedInventory);
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk update inventory
// @route   POST /api/inventory/bulk
// @access  Private
const bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Invalid update data' });
    }
    
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const update of updates) {
      try {
        const { sku, marketplace, quantity, adjustment, type } = update;
        
        if (!sku || !marketplace) {
          results.failed++;
          results.errors.push(`Missing SKU or marketplace for update`);
          continue;
        }
        
        const inventory = await Inventory.findOne({ sku, marketplace });
        
        if (!inventory) {
          results.failed++;
          results.errors.push(`Inventory item not found for SKU: ${sku}, Marketplace: ${marketplace}`);
          continue;
        }
        
        if (quantity !== undefined) {
          // Set to specific quantity
          if (isNaN(quantity) || quantity < 0) {
            results.failed++;
            results.errors.push(`Invalid quantity for SKU: ${sku}`);
            continue;
          }
          
          inventory.quantity = quantity;
        } else if (adjustment !== undefined && type) {
          // Adjust by amount
          if (isNaN(adjustment) || adjustment < 0) {
            results.failed++;
            results.errors.push(`Invalid adjustment for SKU: ${sku}`);
            continue;
          }
          
          if (type !== 'add' && type !== 'remove') {
            results.failed++;
            results.errors.push(`Invalid adjustment type for SKU: ${sku}`);
            continue;
          }
          
          if (type === 'add') {
            inventory.quantity += adjustment;
          } else {
            inventory.quantity = Math.max(0, inventory.quantity - adjustment);
          }
        } else {
          results.failed++;
          results.errors.push(`Missing quantity or adjustment for SKU: ${sku}`);
          continue;
        }
        
        inventory.lastUpdated = Date.now();
        await inventory.save();
        
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing update: ${error.message}`);
      }
    }
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in bulk inventory update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  getInventorySummary,
  getInventoryByProduct,
  getInventoryByMsku,
  updateInventory,
  adjustInventory,
  bulkUpdateInventory
};
