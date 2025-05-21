import { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiDownload, FiAlertCircle, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { inventoryAPI } from '../services/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get unique categories for filters
  const categories = [...new Set(inventory.map(item => item.category || 'Uncategorized'))];

  // Chart data for stock distribution
  const stockDistributionData = inventory.map(item => ({
    name: item.name && item.name.length > 20 ? item.name.substring(0, 20) + '...' : (item.name || item.msku || 'Unknown'),
    Amazon: item.stockByMarketplace?.Amazon || 0,
    Flipkart: item.stockByMarketplace?.Flipkart || 0,
    Meesho: item.stockByMarketplace?.Meesho || 0
  }));

  // Fetch inventory data from API
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get inventory summary
      const response = await inventoryAPI.getAll();
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid inventory data format:', response.data);
        setInventory([]);
        setFilteredInventory([]);
        setError('Failed to load inventory data. Invalid data format.');
        return;
      }
      
      // Process inventory data to match the expected format
      const processedInventory = response.data.map(item => {
        // Group by marketplace if skus exist
        const stockByMarketplace = {};
        const skus = [];
        
        if (item.marketplace && item.sku) {
          // If it's a single inventory item with marketplace and sku
          if (!stockByMarketplace[item.marketplace]) {
            stockByMarketplace[item.marketplace] = 0;
          }
          stockByMarketplace[item.marketplace] += item.quantity || 0;
          
          skus.push({
            marketplace: item.marketplace,
            sku: item.sku,
            stock: item.quantity || 0
          });
        }
        
        // Calculate total stock
        const totalStock = Object.values(stockByMarketplace).reduce((sum, qty) => sum + qty, 0) || item.quantity || 0;
        
        return {
          id: item._id,
          msku: item.msku,
          name: item.product?.name || 'Unknown Product',
          category: item.product?.category || 'Uncategorized',
          totalStock,
          stockByMarketplace,
          lowStockThreshold: item.product?.lowStockThreshold || 10,
          skus
        };
      });
      
      setInventory(processedInventory);
      setFilteredInventory(processedInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data. Please try again.');
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    // Apply filters when any filter changes
    let result = inventory;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.msku?.toLowerCase().includes(term) ||
        item.name?.toLowerCase().includes(term) ||
        item.skus?.some(sku => sku.sku?.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // Apply stock filter
    if (stockFilter === 'low') {
      result = result.filter(item => item.totalStock <= item.lowStockThreshold);
    } else if (stockFilter === 'out') {
      result = result.filter(item => item.totalStock === 0);
    }
    
    setFilteredInventory(result);
  }, [inventory, searchTerm, categoryFilter, stockFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const handleStockFilterChange = (e) => {
    setStockFilter(e.target.value);
  };
  
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleAdjustStock = async (item, sku, type, amount) => {
    try {
      // Find the inventory item
      const inventoryItem = await inventoryAPI.getById(item.id);
      
      // Prepare update data
      const updateData = {
        quantity: type === 'add' 
          ? inventoryItem.data.quantity + amount 
          : Math.max(0, inventoryItem.data.quantity - amount)
      };
      
      // Update inventory
      await inventoryAPI.update(item.id, updateData);
      
      // Refresh inventory data
      fetchInventory();
      
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock. Please try again.');
    }
  };
  
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['MSKU', 'Name', 'Category', 'Total Stock', 'Amazon Stock', 'Flipkart Stock', 'Meesho Stock', 'Low Stock Threshold'];
    const rows = inventory.map(item => [
      item.msku,
      item.name,
      item.category,
      item.totalStock,
      item.stockByMarketplace?.Amazon || 0,
      item.stockByMarketplace?.Flipkart || 0,
      item.stockByMarketplace?.Meesho || 0,
      item.lowStockThreshold
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Inventory Management</h1>
      
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
              placeholder="Search by MSKU, name, or SKU"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-500" />
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Stock Filter */}
          <div className="flex items-center">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
              value={stockFilter}
              onChange={handleStockFilterChange}
            >
              <option value="">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded"
          >
            <FiDownload className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600 mb-2"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && filteredInventory.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-600">No inventory items found.</p>
          {searchTerm || categoryFilter || stockFilter ? (
            <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
          ) : null}
        </div>
      )}
      
      {/* Inventory Table */}
      {!loading && !error && filteredInventory.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amazon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flipkart
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meesho
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.msku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.totalStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.stockByMarketplace?.Amazon || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.stockByMarketplace?.Flipkart || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.stockByMarketplace?.Meesho || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.totalStock === 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : item.totalStock <= item.lowStockThreshold ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Stock Distribution Chart */}
      {!loading && !error && filteredInventory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Stock Distribution by Marketplace</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockDistributionData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Amazon" stackId="a" fill="#FF9900" />
                <Bar dataKey="Flipkart" stackId="a" fill="#2874F0" />
                <Bar dataKey="Meesho" stackId="a" fill="#F43397" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Inventory Details</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Product Name</h4>
                  <p className="text-base font-medium text-gray-900">{selectedItem.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">MSKU</h4>
                  <p className="text-base font-medium text-gray-900">{selectedItem.msku}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                  <p className="text-base font-medium text-gray-900">{selectedItem.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Total Stock</h4>
                  <p className="text-base font-medium text-gray-900">{selectedItem.totalStock}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Low Stock Threshold</h4>
                  <p className="text-base font-medium text-gray-900">{selectedItem.lowStockThreshold}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Stock Status</h4>
                  {selectedItem.totalStock === 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  ) : selectedItem.totalStock <= selectedItem.lowStockThreshold ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Low Stock
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      In Stock
                    </span>
                  )}
                </div>
              </div>
              
              <h4 className="text-base font-medium text-gray-900 mb-3">SKU Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marketplace
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedItem.skus && selectedItem.skus.map((sku, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sku.marketplace}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sku.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sku.stock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handleAdjustStock(selectedItem, sku, 'add', 1)}
                          >
                            <FiPlusCircle />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleAdjustStock(selectedItem, sku, 'remove', 1)}
                          >
                            <FiMinusCircle />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
