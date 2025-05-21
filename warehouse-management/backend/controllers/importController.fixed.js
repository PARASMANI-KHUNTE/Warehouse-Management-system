const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const multer = require('multer');
const Product = require('../models/Product');
const Sku = require('../models/Sku');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

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
    res.status(200).json({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    });
  });
};

// @desc    Detect marketplace from CSV file
// @route   POST /api/import/detect
// @access  Private
const detectMarketplace = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required' });
    }
    
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const results = [];
    
    // Read the first few rows of the CSV to detect marketplace
    fs.createReadStream(fullPath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
        if (results.length >= 5) {
          // Stop reading after 5 rows
          this.destroy();
        }
      })
      .on('end', () => {
        if (results.length === 0) {
          return res.status(400).json({ message: 'CSV file is empty' });
        }
        
        // Get column headers
        const headers = Object.keys(results[0]);
        
        // Detect marketplace based on headers
        let marketplace = null;
        let importType = null;
        
        // Check for Amazon headers
        if (headers.includes('order-id') || headers.includes('amazon-order-id')) {
          marketplace = 'Amazon';
          importType = 'orders';
        } else if (headers.includes('seller-sku') && headers.includes('asin')) {
          marketplace = 'Amazon';
          importType = 'products';
        } else if (headers.includes('sku') && headers.includes('fulfillment-channel') && headers.includes('quantity')) {
          marketplace = 'Amazon';
          importType = 'inventory';
        }
        
        // Check for Flipkart headers
        else if (headers.includes('Order ID') || headers.includes('Order Date')) {
          marketplace = 'Flipkart';
          importType = 'orders';
        } else if (headers.includes('Product ID') && headers.includes('Product Title')) {
          marketplace = 'Flipkart';
          importType = 'products';
        } else if (headers.includes('FSN') && headers.includes('Available Quantity')) {
          marketplace = 'Flipkart';
          importType = 'inventory';
        }
        
        // Check for Meesho headers
        else if (headers.includes('Order Number') || headers.includes('Order Date & Time')) {
          marketplace = 'Meesho';
          importType = 'orders';
        } else if (headers.includes('Product Name') && headers.includes('SKU ID')) {
          marketplace = 'Meesho';
          importType = 'products';
        } else if (headers.includes('SKU ID') && headers.includes('Stock')) {
          marketplace = 'Meesho';
          importType = 'inventory';
        }
        
        if (!marketplace || !importType) {
          return res.status(400).json({ 
            message: 'Could not detect marketplace or import type from CSV headers',
            headers
          });
        }
        
        res.status(200).json({
          marketplace,
          importType,
          headers,
          sampleData: results.slice(0, 3)
        });
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        res.status(500).json({ message: 'Error reading CSV file' });
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
    const { filePath, marketplace, importType, mappings } = req.body;
    
    if (!filePath || !marketplace || !importType) {
      return res.status(400).json({ message: 'File path, marketplace, and import type are required' });
    }
    
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const results = [];
    
    // Read the CSV data
    fs.createReadStream(fullPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        if (results.length === 0) {
          return res.status(400).json({ message: 'CSV file is empty' });
        }
        
        const processResults = {
          success: 0,
          errors: 0,
          errorDetails: []
        };
        
        // Process data based on import type
        if (importType === 'orders') {
          await processOrders(results, marketplace, mappings, processResults);
        } else if (importType === 'products') {
          await processProducts(results, marketplace, mappings, processResults);
        } else if (importType === 'inventory') {
          await processInventory(results, marketplace, mappings, processResults);
        }
        
        res.status(200).json({
          message: `Processed ${results.length} records with ${processResults.success} successes and ${processResults.errors} errors`,
          results: processResults
        });
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        res.status(500).json({ message: 'Error reading CSV file' });
      });
  } catch (error) {
    console.error('Error processing import:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process orders from CSV data
const processOrders = async (data, marketplace, mappings, results) => {
  try {
    for (const row of data) {
      try {
        let orderData = {};
        
        if (marketplace === 'Amazon') {
          const orderId = row['order-id'] || row['amazon-order-id'];
          const sku = row['sku'] || row['seller-sku'];
          
          // Check if order already exists
          const existingOrder = await Order.findOne({ orderId, marketplace });
          if (existingOrder) {
            results.errorDetails.push({
              row,
              error: 'Order already exists'
            });
            results.errors++;
            continue;
          }
          
          // Find product by SKU
          const skuDoc = await Sku.findOne({ sku, marketplace }).populate('product');
          if (!skuDoc) {
            results.errorDetails.push({
              row,
              error: 'SKU not found in the system'
            });
            results.errors++;
            continue;
          }
          
          orderData = {
            orderId,
            orderDate: new Date(row['purchase-date'] || row['order-date']),
            marketplace,
            status: mapAmazonStatus(row['order-status']),
            customer: {
              name: `${row['buyer-name'] || 'Unknown'}`,
              email: row['buyer-email'] || '',
              phone: row['buyer-phone-number'] || ''
            },
            shippingAddress: {
              name: row['recipient-name'] || row['buyer-name'] || '',
              address1: row['ship-address-1'] || '',
              address2: row['ship-address-2'] || '',
              city: row['ship-city'] || '',
              state: row['ship-state'] || '',
              postalCode: row['ship-postal-code'] || '',
              country: row['ship-country'] || 'India'
            },
            items: [{
              sku: sku,
              msku: skuDoc.msku,
              productName: skuDoc.product ? skuDoc.product.name : 'Unknown Product',
              quantity: parseInt(row['quantity'] || '1', 10),
              price: parseFloat(row['item-price'] || '0'),
              tax: parseFloat(row['item-tax'] || '0')
            }],
            totalAmount: parseFloat(row['item-price'] || '0') * parseInt(row['quantity'] || '1', 10),
            shippingAmount: parseFloat(row['shipping-price'] || '0'),
            taxAmount: parseFloat(row['item-tax'] || '0'),
            paymentMethod: row['payment-method'] || 'Unknown'
          };
        } else if (marketplace === 'Flipkart') {
          const orderId = row['Order ID'];
          const sku = row['SKU'] || row['Seller SKU'];
          
          // Check if order already exists
          const existingOrder = await Order.findOne({ orderId, marketplace });
          if (existingOrder) {
            results.errorDetails.push({
              row,
              error: 'Order already exists'
            });
            results.errors++;
            continue;
          }
          
          // Find product by SKU
          const skuDoc = await Sku.findOne({ sku, marketplace }).populate('product');
          if (!skuDoc) {
            results.errorDetails.push({
              row,
              error: 'SKU not found in the system'
            });
            results.errors++;
            continue;
          }
          
          orderData = {
            orderId,
            orderDate: parseFlipkartDate(row['Order Date']),
            marketplace,
            status: mapFlipkartStatus(row['Order Status']),
            customer: {
              name: row['Customer Name'] || 'Unknown',
              email: '',
              phone: row['Customer Contact'] || ''
            },
            shippingAddress: {
              name: row['Shipping Address Name'] || row['Customer Name'] || '',
              address1: row['Shipping Address Street 1'] || '',
              address2: row['Shipping Address Street 2'] || '',
              city: row['Shipping Address City'] || '',
              state: row['Shipping Address State'] || '',
              postalCode: row['Shipping Address Pincode'] || '',
              country: 'India'
            },
            items: [{
              sku: sku,
              msku: skuDoc.msku,
              productName: skuDoc.product ? skuDoc.product.name : 'Unknown Product',
              quantity: parseInt(row['Quantity'] || '1', 10),
              price: parseFloat(row['Unit Price'] || '0'),
              tax: parseFloat(row['Tax Amount'] || '0')
            }],
            totalAmount: parseFloat(row['Total Amount'] || '0'),
            shippingAmount: parseFloat(row['Shipping Fee'] || '0'),
            taxAmount: parseFloat(row['Tax Amount'] || '0'),
            paymentMethod: row['Payment Method'] || 'Unknown'
          };
        } else if (marketplace === 'Meesho') {
          const orderId = row['Order Number'];
          const sku = row['SKU ID'];
          
          // Check if order already exists
          const existingOrder = await Order.findOne({ orderId, marketplace });
          if (existingOrder) {
            results.errorDetails.push({
              row,
              error: 'Order already exists'
            });
            results.errors++;
            continue;
          }
          
          // Find product by SKU
          const skuDoc = await Sku.findOne({ sku, marketplace }).populate('product');
          if (!skuDoc) {
            results.errorDetails.push({
              row,
              error: 'SKU not found in the system'
            });
            results.errors++;
            continue;
          }
          
          orderData = {
            orderId,
            orderDate: new Date(row['Order Date & Time']),
            marketplace,
            status: mapMeeshoStatus(row['Order Status']),
            customer: {
              name: row['Customer Name'] || 'Unknown',
              email: '',
              phone: row['Customer Phone'] || ''
            },
            shippingAddress: {
              name: row['Shipping Name'] || row['Customer Name'] || '',
              address1: row['Shipping Address'] || '',
              address2: '',
              city: row['Shipping City'] || '',
              state: row['Shipping State'] || '',
              postalCode: row['Shipping Pincode'] || '',
              country: 'India'
            },
            items: [{
              sku: sku,
              msku: skuDoc.msku,
              productName: skuDoc.product ? skuDoc.product.name : 'Unknown Product',
              quantity: parseInt(row['Quantity'] || '1', 10),
              price: parseFloat(row['Product Price'] || '0'),
              tax: 0
            }],
            totalAmount: parseFloat(row['Order Amount'] || '0'),
            shippingAmount: 0,
            taxAmount: 0,
            paymentMethod: row['Payment Method'] || 'Unknown'
          };
        }
        
        // Create order
        await Order.create(orderData);
        results.success++;
      } catch (error) {
        console.error('Error processing order row:', error);
        results.errorDetails.push({
          row,
          error: error.message
        });
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error processing orders:', error);
    throw error;
  }
};

// Process inventory from CSV data
const processInventory = async (data, marketplace, mappings, results) => {
  try {
    for (const row of data) {
      try {
        let sku, quantity, msku;
        
        if (marketplace === 'Amazon') {
          sku = row['seller-sku'] || row['sku'];
          quantity = parseInt(row['quantity'] || '0', 10);
          
          // Find SKU in database
          const skuDoc = await Sku.findOne({ sku, marketplace });
          if (!skuDoc) {
            results.errorDetails.push({
              row,
              error: 'SKU not found in the system'
            });
            results.errors++;
            continue;
          }
          
          msku = skuDoc.msku;
        } else if (marketplace === 'Flipkart') {
          sku = row['SKU'] || row['Seller SKU'];
          quantity = parseInt(row['Available Quantity'] || '0', 10);
          
          // Find SKU in database
          const skuDoc = await Sku.findOne({ sku, marketplace });
          if (!skuDoc) {
            results.errorDetails.push({
              row,
              error: 'SKU not found in the system'
            });
            results.errors++;
            continue;
          }
          
          msku = skuDoc.msku;
        } else if (marketplace === 'Meesho') {
          sku = row['SKU ID'];
          quantity = parseInt(row['Stock'] || '0', 10);
          
          // Find SKU in database
          const skuDoc = await Sku.findOne({ sku, marketplace });
          if (!skuDoc) {
            results.errorDetails.push({
              row,
              error: 'SKU not found in the system'
            });
            results.errors++;
            continue;
          }
          
          msku = skuDoc.msku;
        }
        
        // Update or create inventory
        const existingInventory = await Inventory.findOne({ sku, marketplace });
        
        if (existingInventory) {
          existingInventory.quantity = quantity;
          existingInventory.lastUpdated = new Date();
          await existingInventory.save();
        } else {
          await Inventory.create({
            sku,
            msku,
            marketplace,
            quantity,
            lastUpdated: new Date()
          });
        }
        
        results.success++;
      } catch (error) {
        console.error('Error processing inventory row:', error);
        results.errorDetails.push({
          row,
          error: error.message
        });
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error processing inventory:', error);
    throw error;
  }
};

// Process products from CSV data
const processProducts = async (data, marketplace, mappings, results) => {
  try {
    for (const row of data) {
      try {
        let productData = {};
        let sku, msku, name, category;
        
        if (marketplace === 'Amazon') {
          sku = row['seller-sku'] || row['sku'];
          name = row['product-name'] || row['item-name'];
          category = row['product-group'] || row['category'];
          
          // Use mapping or generate MSKU
          msku = mappings && mappings[sku] ? mappings[sku] : sku.toUpperCase().replace(/[^A-Z0-9]/g, '-');
          
          productData = {
            msku,
            name,
            description: row['product-description'] || '',
            category,
            dimensions: {
              length: parseFloat(row['item-length'] || '0'),
              width: parseFloat(row['item-width'] || '0'),
              height: parseFloat(row['item-height'] || '0'),
              weight: parseFloat(row['item-weight'] || '0')
            },
            hsnCode: row['hsn-code'] || ''
          };
        } else if (marketplace === 'Flipkart') {
          sku = row['SKU'] || row['Seller SKU'];
          name = row['Product Title'] || row['Product Name'];
          category = row['Category'] || row['Vertical'];
          
          // Use mapping or generate MSKU
          msku = mappings && mappings[sku] ? mappings[sku] : sku.toUpperCase().replace(/[^A-Z0-9]/g, '-');
          
          productData = {
            msku,
            name,
            description: row['Product Description'] || '',
            category,
            dimensions: {
              length: parseFloat(row['Length'] || '0'),
              width: parseFloat(row['Width'] || '0'),
              height: parseFloat(row['Height'] || '0'),
              weight: parseFloat(row['Weight'] || '0')
            },
            hsnCode: row['HSN Code'] || ''
          };
        } else if (marketplace === 'Meesho') {
          sku = row['SKU ID'];
          name = row['Product Name'];
          category = row['Category'];
          
          // Use mapping or generate MSKU
          msku = mappings && mappings[sku] ? mappings[sku] : sku.toUpperCase().replace(/[^A-Z0-9]/g, '-');
          
          productData = {
            msku,
            name,
            description: row['Description'] || '',
            category,
            dimensions: {
              length: 0,
              width: 0,
              height: 0,
              weight: 0
            },
            hsnCode: ''
          };
        }
        
        // Check if product already exists
        let product = await Product.findOne({ msku });
        
        if (!product) {
          // Create new product
          product = await Product.create(productData);
        }
        
        // Check if SKU already exists
        const existingSku = await Sku.findOne({ sku, marketplace });
        
        if (!existingSku) {
          // Create new SKU
          await Sku.create({
            sku,
            msku,
            marketplace,
            product: product._id,
            active: true
          });
        }
        
        results.success++;
      } catch (error) {
        console.error('Error processing product row:', error);
        results.errorDetails.push({
          row,
          error: error.message
        });
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error processing products:', error);
    throw error;
  }
};

// Helper functions for status mapping
const mapAmazonStatus = (status) => {
  const statusMap = {
    'Pending': 'pending',
    'Unshipped': 'processing',
    'Shipped': 'shipped',
    'Cancelled': 'cancelled',
    'Delivered': 'delivered'
  };
  
  return statusMap[status] || 'processing';
};

const mapFlipkartStatus = (status) => {
  const statusMap = {
    'APPROVED': 'processing',
    'PACKING': 'processing',
    'PACKED': 'processing',
    'READY_TO_DISPATCH': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'RETURNED': 'returned'
  };
  
  return statusMap[status] || 'processing';
};

const mapMeeshoStatus = (status) => {
  const statusMap = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'RETURNED': 'returned'
  };
  
  return statusMap[status] || 'processing';
};

// Helper function to parse Flipkart date format (DD-MMM-YY)
const parseFlipkartDate = (dateString) => {
  if (!dateString) return new Date();
  
  try {
    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date();
    
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    let year = parseInt(parts[2], 10);
    
    // Convert 2-digit year to 4-digit
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    return new Date(year, month, day);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

module.exports = {
  uploadFile,
  detectMarketplace,
  processImport
};
