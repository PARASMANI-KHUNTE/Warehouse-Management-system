const { Readable } = require('stream');
const multer = require('multer');
const Product = require('../models/Product');
const Sku = require('../models/Sku');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept only CSV files
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  }
});

// @desc    Upload CSV file
// @route   POST /api/import/upload
// @access  Private
const uploadFile = (req, res) => {
  const uploadSingle = upload.single('file');
  
  uploadSingle(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Store the file buffer in the session or return it directly
    // We'll use a fileId to reference this data later
    const fileId = Date.now().toString();
    
    // Store file data in req.app.locals (application memory)
    if (!req.app.locals.uploadedFiles) {
      req.app.locals.uploadedFiles = {};
    }
    
    req.app.locals.uploadedFiles[fileId] = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding,
      createdAt: new Date() // For cleanup purposes
    };
    
    // Set up a cleanup timer (remove file after 30 minutes)
    setTimeout(() => {
      if (req.app.locals.uploadedFiles && req.app.locals.uploadedFiles[fileId]) {
        delete req.app.locals.uploadedFiles[fileId];
      }
    }, 30 * 60 * 1000);
    
    res.status(200).json({
      fileId: fileId,
      originalname: req.file.originalname,
      size: req.file.size
    });
  });
};

// @desc    Detect marketplace from CSV file
// @route   POST /api/import/detect
// @access  Private
const detectMarketplace = async (req, res) => {
  try {
    const { fileId } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }
    
    // Check if file exists in memory
    if (!req.app.locals.uploadedFiles || !req.app.locals.uploadedFiles[fileId]) {
      return res.status(404).json({ message: 'File not found or expired' });
    }
    
    // Get file buffer from memory
    const fileData = req.app.locals.uploadedFiles[fileId];
    const fileContent = fileData.buffer.toString('utf8');
    
    try {
      // Split by newline and get the first few lines
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0).slice(0, 6);
      
      if (lines.length === 0) {
        return res.status(400).json({ message: 'Empty or invalid CSV file' });
      }
      
      // Parse headers (first line)
      const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
      
      // Parse a few sample rows
      const results = [];
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        const values = lines[i].split(',').map(val => val.trim().replace(/"/g, ''));
        const row = {};
        
        headers.forEach((header, index) => {
          if (index < values.length) {
            row[header] = values[index];
          } else {
            row[header] = '';
          }
        });
        
        results.push(row);
      }
      
      // Detect marketplace based on headers
      let marketplace = 'Unknown';
      let confidence = 0;
      
      // Amazon detection
      const amazonHeaders = ['ASIN', 'FNSKU', 'MSKU', 'Fulfillment Center', 'Event Type'];
      const amazonMatches = amazonHeaders.filter(header => 
        headers.some(h => h.includes(header))
      ).length;
      const amazonConfidence = amazonMatches / amazonHeaders.length;
      
      // Flipkart detection
      const flipkartHeaders = ['Order Id', 'FSN', 'SKU', 'Ordered On', 'Order State', 'Shipment ID'];
      const flipkartMatches = flipkartHeaders.filter(header => 
        headers.some(h => h.includes(header))
      ).length;
      const flipkartConfidence = flipkartMatches / flipkartHeaders.length;
      
      // Meesho detection
      const meeshoHeaders = ['Sub Order No', 'Order Date', 'Customer State', 'Product Name', 'Reason for Credit Entry'];
      const meeshoMatches = meeshoHeaders.filter(header => 
        headers.some(h => h.includes(header))
      ).length;
      const meeshoConfidence = meeshoMatches / meeshoHeaders.length;
      
      // Determine marketplace with highest confidence
      if (amazonConfidence > confidence) {
        marketplace = 'Amazon';
        confidence = amazonConfidence;
      }
      
      if (flipkartConfidence > confidence) {
        marketplace = 'Flipkart';
        confidence = flipkartConfidence;
      }
      
      if (meeshoConfidence > confidence) {
        marketplace = 'Meesho';
        confidence = meeshoConfidence;
      }
      
      // Also check filename for marketplace hints
      const filename = fileData.originalname.toLowerCase();
      if (filename.includes('amazon') && confidence < 0.8) {
        marketplace = 'Amazon';
        confidence = Math.max(confidence, 0.7);
      } else if ((filename.includes('flipkart') || filename.includes('fk')) && confidence < 0.8) {
        marketplace = 'Flipkart';
        confidence = Math.max(confidence, 0.7);
      } else if (filename.includes('meesho') && confidence < 0.8) {
        marketplace = 'Meesho';
        confidence = Math.max(confidence, 0.7);
      }
      
      return res.status(200).json({
        marketplace,
        confidence,
        headers,
        sampleData: results
      });
      
    } catch (err) {
      console.error('Error parsing CSV file:', err);
      // If CSV parsing fails, try to determine marketplace from filename
      const filename = fileData.originalname.toLowerCase();
      let marketplace = 'Unknown';
      
      if (filename.includes('amazon')) {
        marketplace = 'Amazon';
      } else if (filename.includes('flipkart') || filename.includes('fk')) {
        marketplace = 'Flipkart';
      } else if (filename.includes('meesho')) {
        marketplace = 'Meesho';
      }
      
      return res.status(200).json({
        marketplace,
        confidence: 0.7,
        headers: [],
        sampleData: [],
        note: 'Determined from filename due to CSV parsing error'
      });
    }
    
    if (results.length === 0) {
      return res.status(400).json({ message: 'Empty or invalid CSV file' });
    }
    
    // Get headers (column names)
    const headers = Object.keys(results[0]);
    
    // Detect marketplace based on headers
    let marketplace = 'Unknown';
    let confidence = 0;
    
    // Amazon detection
    const amazonHeaders = ['ASIN', 'FNSKU', 'MSKU', 'Fulfillment Center', 'Event Type'];
    const amazonMatches = amazonHeaders.filter(header => 
      headers.some(h => h.includes(header))
    ).length;
    const amazonConfidence = amazonMatches / amazonHeaders.length;
    
    // Flipkart detection
    const flipkartHeaders = ['Order Id', 'FSN', 'SKU', 'Ordered On', 'Order State', 'Shipment ID'];
    const flipkartMatches = flipkartHeaders.filter(header => 
      headers.some(h => h.includes(header))
    ).length;
    const flipkartConfidence = flipkartMatches / flipkartHeaders.length;
    
    // Meesho detection
    const meeshoHeaders = ['Sub Order No', 'Order Date', 'Customer State', 'Product Name', 'Reason for Credit Entry'];
    const meeshoMatches = meeshoHeaders.filter(header => 
      headers.some(h => h.includes(header))
    ).length;
    const meeshoConfidence = meeshoMatches / meeshoHeaders.length;
    
    // Determine marketplace with highest confidence
    if (amazonConfidence > confidence) {
      marketplace = 'Amazon';
      confidence = amazonConfidence;
    }
    
    if (flipkartConfidence > confidence) {
      marketplace = 'Flipkart';
      confidence = flipkartConfidence;
    }
    
    if (meeshoConfidence > confidence) {
      marketplace = 'Meesho';
      confidence = meeshoConfidence;
    }
    
    // Also check filename for marketplace hints
    const filename = path.basename(filepath).toLowerCase();
    if (filename.includes('amazon') && confidence < 0.8) {
      marketplace = 'Amazon';
      confidence = Math.max(confidence, 0.7);
    } else if ((filename.includes('flipkart') || filename.includes('fk')) && confidence < 0.8) {
      marketplace = 'Flipkart';
      confidence = Math.max(confidence, 0.7);
    } else if (filename.includes('meesho') && confidence < 0.8) {
      marketplace = 'Meesho';
      confidence = Math.max(confidence, 0.7);
    }
    
    res.status(200).json({
      marketplace,
      confidence,
      headers,
      sampleData: results.slice(0, 2)
    });
  } catch (error) {
    console.error('Error detecting marketplace:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process CSV file and import data
// @route   POST /api/import/process
// @access  Private
const processImport = async (req, res) => {
  try {
    const { fileId, marketplace, importType = 'auto', mappings } = req.body;
    
    if (!fileId || !marketplace) {
      return res.status(400).json({ message: 'File ID and marketplace are required' });
    }
    
    // Check if file exists in memory
    if (!req.app.locals.uploadedFiles || !req.app.locals.uploadedFiles[fileId]) {
      return res.status(404).json({ message: 'File not found or expired' });
    }
    
    // Get file buffer from memory
    const fileData = req.app.locals.uploadedFiles[fileId];
    const fileContent = fileData.buffer.toString('utf8');
    
    // Initialize results
    const results = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: [],
      newSkus: [],
      unmappedSkus: []
    };
    
    try {
      // Split by newline and filter out empty lines
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length <= 1) { // Only header or empty
        return res.status(400).json({ message: 'Empty or invalid CSV file' });
      }
      
      // Parse headers (first line)
      const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
      
      // Parse data rows
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.trim().replace(/"/g, ''));
        const row = {};
        
        headers.forEach((header, index) => {
          if (index < values.length) {
            row[header] = values[index];
          } else {
            row[header] = '';
          }
        });
        
        data.push(row);
        results.total++;
      }
      
      // Process data based on import type and marketplace
      if (importType === 'orders' || importType === 'auto') {
        await processOrders(data, marketplace, mappings, results);
      } else if (importType === 'inventory') {
        await processInventory(data, marketplace, mappings, results);
      } else if (importType === 'products') {
        await processProducts(data, marketplace, mappings, results);
      } else {
        return res.status(400).json({ message: 'Invalid import type' });
      }
      
      // Clean up the file from memory
      delete req.app.locals.uploadedFiles[fileId];
      
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error processing CSV data:', error);
      return res.status(500).json({ 
        message: 'Error processing CSV data', 
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Error in import process:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Process orders from CSV data
const processOrders = async (data, marketplace, mappings, results) => {
  for (const row of data) {
    try {
      let orderId, orderDate, status, customer, items, shipping;
      
      // Extract data based on marketplace
      if (marketplace === 'Amazon') {
        // Amazon-specific processing
        orderId = row.AmazonOrderId || row.orderId || '';
        orderDate = new Date(row.PurchaseDate || row.orderDate || Date.now());
        status = mapAmazonStatus(row.OrderStatus || row.status || '');
        customer = {
          name: row.BuyerName || 'Amazon Customer',
          // Other customer fields
        };
        items = [{
          sku: row.SellerSKU || row.sku || row.MSKU || '',
          name: row.ProductName || row.Title || '',
          quantity: parseInt(row.QuantityOrdered || row.quantity || 1, 10),
          price: parseFloat(row.ItemPrice || row.price || 0)
        }];
        shipping = {
          fulfillmentCenter: row['Fulfillment Center'] || ''
        };
      } else if (marketplace === 'Flipkart') {
        // Flipkart-specific processing
        orderId = row['Order Id'] || row.orderId || '';
        orderDate = parseFlipkartDate(row['Ordered On'] || row.orderedOn || '');
        status = mapFlipkartStatus(row['Order State'] || row.orderState || '');
        customer = {
          name: row['Buyer name'] || row['Ship to name'] || '',
          address: row['Address Line 1'] || '',
          city: row['City'] || '',
          state: row['State'] || '',
          pincode: row['PIN Code'] || ''
        };
        items = [{
          sku: row['SKU'] || '',
          name: row['Product'] || '',
          quantity: parseInt(row['Quantity'] || 1, 10),
          price: parseFloat(row['Selling Price Per Item'] || row.sellingPrice || 0)
        }];
        shipping = {
          shipmentId: row['Shipment ID'] || '',
          trackingId: row['Tracking ID'] || '',
          dispatchAfter: parseFlipkartDate(row['Dispatch After date'] || ''),
          dispatchBy: parseFlipkartDate(row['Dispatch by date'] || '')
        };
      } else if (marketplace === 'Meesho') {
        // Meesho-specific processing
        orderId = row['Sub Order No'] || '';
        orderDate = new Date(row['Order Date'] || Date.now());
        status = mapMeeshoStatus(row['Reason for Credit Entry'] || '');
        customer = {
          state: row['Customer State'] || ''
        };
        items = [{
          sku: row['SKU'] || '',
          name: row['Product Name'] || '',
          quantity: parseInt(row['Quantity'] || 1, 10),
          price: parseFloat(row['Supplier Listed Price (Incl. GST + Commission)'] || 0)
        }];
      }
      
      // Skip if no order ID
      if (!orderId) {
        results.skipped++;
        continue;
      }
      
      // Check if order already exists
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder) {
        results.skipped++;
        continue;
      }
      
      // Process items and map SKUs to MSKUs
      const processedItems = [];
      for (const item of items) {
        if (!item.sku) {
          continue;
        }
        
        // Try to find SKU in database
        let skuDoc = await Sku.findOne({ sku: item.sku }).populate('product');
        
        // If not found, check mappings
        if (!skuDoc && mappings && mappings[item.sku]) {
          const msku = mappings[item.sku];
          const product = await Product.findOne({ msku });
          
          if (product) {
            // Create new SKU mapping
            skuDoc = await Sku.create({
              sku: item.sku,
              msku,
              product: product._id,
              marketplace
            });
            
            // Create inventory entry
            await Inventory.create({
              product: product._id,
              msku,
              sku: item.sku,
              marketplace,
              quantity: 0
            });
            
            results.newSkus.push(item.sku);
          }
        }
        
        if (skuDoc) {
          processedItems.push({
            sku: item.sku,
            msku: skuDoc.msku,
            product: skuDoc.product._id,
            name: item.name || skuDoc.product.name,
            quantity: item.quantity,
            price: item.price
          });
        } else {
          // Add to unmapped SKUs
          results.unmappedSkus.push(item.sku);
          
          processedItems.push({
            sku: item.sku,
            msku: 'UNMAPPED',
            name: item.name,
            quantity: item.quantity,
            price: item.price
          });
        }
      }
      
      // Create order
      await Order.create({
        orderId,
        orderItemId: row['ORDER ITEM ID'] || row.orderItemId || '',
        marketplace,
        orderDate,
        status,
        customer,
        items: processedItems,
        shipping,
        payment: {
          amount: processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        },
        rawData: row
      });
      
      results.processed++;
    } catch (error) {
      results.errors.push(`Error processing order: ${error.message}`);
    }
  }
  
  return results;
};

// Process inventory from CSV data
const processInventory = async (data, marketplace, mappings, results) => {
  for (const row of data) {
    try {
      let sku, quantity;
      
      // Extract data based on marketplace
      if (marketplace === 'Amazon') {
        sku = row.SellerSKU || row.MSKU || row.sku || '';
        quantity = parseInt(row.Quantity || row.quantity || 0, 10);
      } else if (marketplace === 'Flipkart') {
        sku = row.SKU || '';
        quantity = parseInt(row.Quantity || row['Available Quantity'] || 0, 10);
      } else if (marketplace === 'Meesho') {
        sku = row.SKU || '';
        quantity = parseInt(row.Quantity || row['Available Quantity'] || 0, 10);
      }
      
      // Skip if no SKU
      if (!sku) {
        results.skipped++;
        continue;
      }
      
      // Try to find SKU in database
      let skuDoc = await Sku.findOne({ sku }).populate('product');
      
      // If not found, check mappings
      if (!skuDoc && mappings && mappings[sku]) {
        const msku = mappings[sku];
        const product = await Product.findOne({ msku });
        
        if (product) {
          // Create new SKU mapping
          skuDoc = await Sku.create({
            sku,
            msku,
            product: product._id,
            marketplace
          });
          
          results.newSkus.push(sku);
        }
      }
      
      if (skuDoc) {
        // Update or create inventory
        let inventory = await Inventory.findOne({ 
          sku, 
          marketplace 
        });
        
        if (inventory) {
          inventory.quantity = quantity;
          inventory.lastUpdated = Date.now();
          await inventory.save();
        } else {
          await Inventory.create({
            product: skuDoc.product._id,
            msku: skuDoc.msku,
            sku,
            marketplace,
            quantity
          });
        }
        
        results.processed++;
      } else {
        // Add to unmapped SKUs
        results.unmappedSkus.push(sku);
        results.skipped++;
      }
    } catch (error) {
      results.errors.push(`Error processing inventory: ${error.message}`);
    }
  }
  
  return results;
};

// Process products from CSV data
const processProducts = async (data, marketplace, mappings, results) => {
  for (const row of data) {
    try {
      const msku = row.MSKU || row.msku || '';
      const name = row.ProductName || row.Name || row.name || row.Title || '';
      const category = row.Category || row.category || '';
      
      // Skip if no MSKU or name
      if (!msku || !name) {
        results.skipped++;
        continue;
      }
      
      // Check if product already exists
      let product = await Product.findOne({ msku });
      
      if (product) {
        // Update existing product
        product.name = name;
        if (category) product.category = category;
        if (row.Description) product.description = row.Description;
        if (row.HSN_CODE) product.hsnCode = row.HSN_CODE;
        
        // Update dimensions if available
        if (row.Length || row.Width || row.Height || row.Weight) {
          product.dimensions = {
            length: parseFloat(row.Length || 0),
            breadth: parseFloat(row.Width || 0),
            height: parseFloat(row.Height || 0),
            weight: parseFloat(row.Weight || 0)
          };
        }
        
        await product.save();
      } else {
        // Create new product
        product = await Product.create({
          msku,
          name,
          category: category || 'Uncategorized',
          description: row.Description || '',
          hsnCode: row.HSN_CODE || '',
          dimensions: {
            length: parseFloat(row.Length || 0),
            breadth: parseFloat(row.Width || 0),
            height: parseFloat(row.Height || 0),
            weight: parseFloat(row.Weight || 0)
          }
        });
      }
      
      // Process SKU if available
      const sku = row.SKU || row.sku || '';
      if (sku) {
        // Check if SKU already exists
        const existingSku = await Sku.findOne({ sku, marketplace });
        
        if (!existingSku) {
          // Create new SKU
          await Sku.create({
            sku,
            msku,
            product: product._id,
            marketplace
          });
          
          // Create inventory entry
          await Inventory.create({
            product: product._id,
            msku,
            sku,
            marketplace,
            quantity: parseInt(row.Quantity || 0, 10)
          });
          
          results.newSkus.push(sku);
        }
      }
      
      results.processed++;
    } catch (error) {
      results.errors.push(`Error processing product: ${error.message}`);
    }
  }
  
  return results;
};

// Helper functions for status mapping
const mapAmazonStatus = (status) => {
  const statusMap = {
    'Shipped': 'Shipped',
    'Delivered': 'Delivered',
    'Canceled': 'Cancelled',
    'Returned': 'Returned',
    'Pending': 'Processing',
    // Add more mappings as needed
  };
  
  return statusMap[status] || status;
};

const mapFlipkartStatus = (status) => {
  const statusMap = {
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'RETURN_REQUESTED': 'Return Requested',
    'RETURNED': 'Returned',
    // Add more mappings as needed
  };
  
  return statusMap[status] || status;
};

const mapMeeshoStatus = (status) => {
  const statusMap = {
    'DELIVERED': 'Delivered',
    'SHIPPED': 'Shipped',
    'CANCELLED': 'Cancelled',
    'RTO_INITIATED': 'RTO Initiated',
    'RTO_DELIVERED': 'RTO Delivered',
    // Add more mappings as needed
  };
  
  return statusMap[status] || status;
};

// Helper function to parse Flipkart date format (DD-MMM-YY)
const parseFlipkartDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Handle different date formats
    if (dateString.includes('-')) {
      // Format: DD-MMM-YY
      const parts = dateString.split('-');
      const day = parseInt(parts[0], 10);
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[1]);
      const year = 2000 + parseInt(parts[2], 10); // Assuming 20xx
      
      return new Date(year, month, day);
    } else if (dateString.includes('/')) {
      // Format: MM/DD/YY
      return new Date(dateString);
    } else {
      // Try direct parsing
      return new Date(dateString);
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

module.exports = {
  uploadFile,
  detectMarketplace,
  processImport
};
