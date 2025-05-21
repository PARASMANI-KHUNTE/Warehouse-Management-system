import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  productAPI, 
  skuAPI, 
  inventoryAPI, 
  orderAPI, 
  dashboardAPI 
} from '../services/api';

// Create context
const AppContext = createContext();

// Custom hook to use the app context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider = ({ children }) => {
  // State for loading indicators
  const [loading, setLoading] = useState({
    products: false,
    skus: false,
    inventory: false,
    orders: false,
    dashboard: false
  });
  
  // State for error messages
  const [errors, setErrors] = useState({
    products: null,
    skus: null,
    inventory: null,
    orders: null,
    dashboard: null
  });
  
  // State for data
  const [products, setProducts] = useState([]);
  const [skus, setSkus] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Function to fetch products
  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setErrors(prev => ({ ...prev, products: null }));
      
      const response = await productAPI.getAll();
      setProducts(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      setErrors(prev => ({ 
        ...prev, 
        products: error.response?.data?.message || 'Failed to fetch products' 
      }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };
  
  // Function to fetch SKUs
  const fetchSkus = async () => {
    try {
      setLoading(prev => ({ ...prev, skus: true }));
      setErrors(prev => ({ ...prev, skus: null }));
      
      const response = await skuAPI.getAll();
      setSkus(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching SKUs:', error);
      setErrors(prev => ({ 
        ...prev, 
        skus: error.response?.data?.message || 'Failed to fetch SKUs' 
      }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, skus: false }));
    }
  };
  
  // Function to fetch inventory
  const fetchInventory = async () => {
    try {
      setLoading(prev => ({ ...prev, inventory: true }));
      setErrors(prev => ({ ...prev, inventory: null }));
      
      const response = await inventoryAPI.getAll();
      setInventory(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setErrors(prev => ({ 
        ...prev, 
        inventory: error.response?.data?.message || 'Failed to fetch inventory' 
      }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  };
  
  // Function to fetch orders with optional filters
  const fetchOrders = async (filters = {}) => {
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      setErrors(prev => ({ ...prev, orders: null }));
      
      const response = await orderAPI.getAll(filters);
      setOrders(response.data.orders);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrors(prev => ({ 
        ...prev, 
        orders: error.response?.data?.message || 'Failed to fetch orders' 
      }));
      return { orders: [], pagination: { total: 0, page: 1, pages: 1 } };
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };
  
  // Debounce function to prevent multiple rapid API calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Function to fetch dashboard data with retry capability and debounce
  const fetchDashboardDataImpl = async (dateRange = {}, retryCount = 0) => {
    // Prevent multiple calls with same parameters
    const cacheKey = JSON.stringify(dateRange);
    
    // If we're already loading this data, don't make another request
    if (loading.dashboard) {
      console.log('Dashboard data already loading, skipping request');
      return null;
    }
    
    try {
      setLoading(prev => ({ ...prev, dashboard: true }));
      setErrors(prev => ({ ...prev, dashboard: null }));
      
      // Create a structured object to hold our data
      const dashboardData = {
        summary: null,
        salesData: null,
        topProducts: null,
        inventoryStatus: null
      };
      
      // Add a small delay between API calls to prevent overwhelming the server
      const delayBetweenCalls = 500; // 500ms
      
      // Sequential API calls with individual try/catch blocks and delays
      try {
        const summary = await dashboardAPI.getSummary(dateRange);
        dashboardData.summary = summary.data;
        // Set immediately to show some data to the user
        setDashboardData(prev => ({ ...prev, summary: summary.data }));
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
      } catch (error) {
        console.warn('Error fetching dashboard summary:', error);
        // Continue with other requests even if this one fails
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
      }
      
      try {
        const salesData = await dashboardAPI.getSalesData(dateRange);
        dashboardData.salesData = salesData.data;
        // Update immediately
        setDashboardData(prev => ({ ...prev, salesData: salesData.data }));
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
      } catch (error) {
        console.warn('Error fetching sales data:', error);
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
      }
      
      try {
        const topProducts = await dashboardAPI.getTopProducts(dateRange);
        dashboardData.topProducts = topProducts.data;
        // Update immediately
        setDashboardData(prev => ({ ...prev, topProducts: topProducts.data }));
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
      } catch (error) {
        console.warn('Error fetching top products:', error);
        await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
      }
      
      try {
        const inventoryStatus = await dashboardAPI.getInventoryStatus();
        dashboardData.inventoryStatus = inventoryStatus.data;
        // Update immediately
        setDashboardData(prev => ({ ...prev, inventoryStatus: inventoryStatus.data }));
      } catch (error) {
        console.warn('Error fetching inventory status:', error);
      }
      
      // Check if we got at least some data
      const hasAnyData = Object.values(dashboardData).some(value => value !== null);
      
      if (hasAnyData) {
        // Final update with all data
        setDashboardData(dashboardData);
        return dashboardData;
      } else {
        throw new Error('Failed to fetch any dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Implement retry logic (max 2 retries with increasing delay)
      if (retryCount < 2) {
        console.log(`Retrying dashboard data fetch (attempt ${retryCount + 1})...`);
        // Wait with exponential backoff before retrying
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchDashboardDataImpl(dateRange, retryCount + 1);
      }
      
      setErrors(prev => ({ 
        ...prev, 
        dashboard: error.response?.data?.message || 'Failed to fetch dashboard data' 
      }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };
  
  // Create a debounced version of the fetch function
  const fetchDashboardData = debounce((dateRange) => {
    fetchDashboardDataImpl(dateRange, 0);
  }, 300);
  
  // Function to create a product
  const createProduct = async (productData) => {
    try {
      console.log('Creating product with data:', productData);
      const response = await productAPI.create(productData);
      console.log('Product creation response:', response);
      await fetchProducts(); // Refresh products list
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };
  
  // Function to update a product
  const updateProduct = async (id, productData) => {
    try {
      console.log(`Updating product ${id} with data:`, productData);
      const response = await productAPI.update(id, productData);
      console.log('Product update response:', response);
      await fetchProducts(); // Refresh products list
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };
  
  // Function to delete a product
  const deleteProduct = async (id) => {
    try {
      await productAPI.delete(id);
      await fetchProducts(); // Refresh products list
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };
  
  // Function to create a SKU
  const createSku = async (skuData) => {
    try {
      const response = await skuAPI.create(skuData);
      await fetchSkus(); // Refresh SKUs list
      return response.data;
    } catch (error) {
      console.error('Error creating SKU:', error);
      throw error;
    }
  };
  
  // These functions are already defined above
  
  // Function to update a SKU
  const updateSku = async (id, skuData) => {
    try {
      const response = await skuAPI.update(id, skuData);
      await fetchSkus(); // Refresh SKUs list
      return response.data;
    } catch (error) {
      console.error('Error updating SKU:', error);
      throw error;
    }
  };
  
  // Function to delete a SKU
  const deleteSku = async (id) => {
    try {
      await skuAPI.delete(id);
      await fetchSkus(); // Refresh SKUs list
      return true;
    } catch (error) {
      console.error('Error deleting SKU:', error);
      throw error;
    }
  };
  
  // Function to update inventory
  const updateInventoryItem = async (id, inventoryData) => {
    try {
      const response = await inventoryAPI.update(id, inventoryData);
      await fetchInventory(); // Refresh inventory list
      return response.data;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  };
  
  // Function to update multiple inventory items
  const updateInventoryBulk = async (inventoryItems) => {
    try {
      const response = await inventoryAPI.updateBulk(inventoryItems);
      await fetchInventory(); // Refresh inventory list
      return response.data;
    } catch (error) {
      console.error('Error updating inventory in bulk:', error);
      throw error;
    }
  };
  
  // Function to create an order
  const createOrder = async (orderData) => {
    try {
      const response = await orderAPI.create(orderData);
      await fetchOrders(); // Refresh orders list
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };
  
  // Function to update order status
  const updateOrderStatus = async (id, status) => {
    try {
      const response = await orderAPI.updateStatus(id, status);
      await fetchOrders(); // Refresh orders list
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };
  
  // Function to update order shipping info
  const updateOrderShipping = async (id, shipping) => {
    try {
      const response = await orderAPI.updateShipping(id, shipping);
      await fetchOrders(); // Refresh orders list
      return response.data;
    } catch (error) {
      console.error('Error updating order shipping:', error);
      throw error;
    }
  };
  
  // Function to update an entire order
  const updateOrder = async (id, orderData) => {
    try {
      const response = await orderAPI.update(id, orderData);
      await fetchOrders(); // Refresh orders list
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };
  
  // Function to delete an order
  const deleteOrder = async (id) => {
    try {
      await orderAPI.delete(id);
      await fetchOrders(); // Refresh orders list
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };
  
  // Function to import orders
  const importOrders = async (ordersData) => {
    try {
      const response = await orderAPI.import(ordersData);
      await fetchOrders(); // Refresh orders list
      return response.data;
    } catch (error) {
      console.error('Error importing orders:', error);
      throw error;
    }
  };
  
  // Context value
  const contextValue = {
    // State
    loading,
    errors,
    products,
    skus,
    inventory,
    orders,
    dashboardData,
    
    // Fetch functions
    fetchProducts,
    fetchSkus,
    fetchInventory,
    fetchOrders,
    fetchDashboardData,
    
    // Product functions
    createProduct,
    updateProduct,
    deleteProduct,
    
    // SKU functions
    createSku,
    updateSku,
    deleteSku,
    
    // Inventory functions
    updateInventoryItem,
    updateInventoryBulk,
    
    // Order functions
    createOrder,
    updateOrderStatus,
    updateOrderShipping,
    updateOrder,
    deleteOrder,
    importOrders
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
