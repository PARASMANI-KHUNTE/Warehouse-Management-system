import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Product API calls
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

// SKU API calls
export const skuAPI = {
  getAll: () => api.get('/skus'),
  getById: (id) => api.get(`/skus/${id}`),
  getByCode: (sku) => api.get(`/skus/code/${sku}`),
  create: (data) => api.post('/skus', data),
  update: (id, data) => api.put(`/skus/${id}`, data),
  delete: (id) => api.delete(`/skus/${id}`),
  bulkCreate: (data) => api.post('/skus/bulk', data)
};

// Inventory API calls
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  updateBulk: (data) => api.post('/inventory/bulk', data)
};

// Order API calls
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updateShipping: (id, shipping) => api.put(`/orders/${id}/shipping`, { shipping }),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  import: (data) => api.post('/orders/import', data)
};

// Import API calls
export const importAPI = {
  upload: (formData) => api.post('/import/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  detect: (data) => api.post('/import/detect', data),
  process: (data) => api.post('/import/process', data)
};

// Dashboard API calls
export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getSalesData: (params) => api.get('/dashboard/sales', { params }),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getInventoryStatus: (params) => api.get('/dashboard/inventory-status', { params })
};

export default api;
