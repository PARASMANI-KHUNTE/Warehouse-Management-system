import { useState, useEffect, useRef } from 'react';
import { 
  FiPackage, 
  FiShoppingCart, 
  FiAlertCircle, 
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiTruck,
  FiBarChart2
} from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/ui/StatCard';
import ChartCard from '../components/ui/ChartCard';
import DataTable from '../components/ui/DataTable';

const Dashboard = () => {
  const { 
    loading, 
    errors, 
    dashboardData,
    fetchDashboardData 
  } = useAppContext();
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Use a ref to prevent unnecessary API calls on initial render
  const initialRenderRef = useRef(true);
  
  useEffect(() => {
    // Only fetch data when component mounts
    fetchDashboardData(dateRange);
    
    // Cleanup function
    return () => {
      // Nothing to clean up with debounced function
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Separate effect for date range changes
  useEffect(() => {
    // Skip the first render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    
    // Only fetch when date range changes and it's not the initial render
    fetchDashboardData(dateRange);
  }, [dateRange.startDate, dateRange.endDate]);
  
  // Format order status data for pie chart
  const getOrderStatusData = () => {
    if (!dashboardData || !dashboardData.summary || !dashboardData.summary.orderStatus) {
      return [];
    }
    
    const { orderStatus } = dashboardData.summary;
    
    return Object.entries(orderStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };
  
  // Format sales data for charts
  const getSalesData = () => {
    if (!dashboardData || !dashboardData.salesData) {
      return [];
    }
    
    // Check if salesData is an array, if not return empty array
    if (!Array.isArray(dashboardData.salesData)) {
      console.log('Sales data is not an array:', dashboardData.salesData);
      return [];
    }
    
    // Transform the data to match the expected format for the charts
    return dashboardData.salesData.map(item => ({
      date: item.date,
      totalOrders: item.orders || 0,
      AmazonRevenue: item.marketplace?.Amazon || 0,
      FlipkartRevenue: item.marketplace?.Flipkart || 0,
      MeeshoRevenue: item.marketplace?.Meesho || 0,
      totalRevenue: item.sales || 0
    }));
  };
  
  // Format inventory status data for pie chart
  const getInventoryStatusData = () => {
    if (!dashboardData || !dashboardData.inventoryStatus || !dashboardData.inventoryStatus.counts) {
      return [];
    }
    
    const { counts } = dashboardData.inventoryStatus;
    
    return [
      { name: 'In Stock', value: counts.inStock || 0 },
      { name: 'Low Stock', value: counts.lowStock || 0 },
      { name: 'Out of Stock', value: counts.outOfStock || 0 }
    ];
  };
  
  // Get recent orders
  const getRecentOrders = () => {
    if (!dashboardData || !dashboardData.summary || !dashboardData.summary.recentOrders) {
      // Return empty array if no data
      return [];
    }
    
    // Check if recentOrders is an array
    if (!Array.isArray(dashboardData.summary.recentOrders)) {
      console.log('Recent orders is not an array:', dashboardData.summary.recentOrders);
      return [];
    }
    
    // If we have data, return it, otherwise return empty array
    return dashboardData.summary.recentOrders || [];
  };
  
  // Get total orders count
  const getTotalOrders = () => {
    if (!dashboardData || !dashboardData.summary) {
      return 0;
    }
    
    return dashboardData.summary.totalOrders || 0;
  };
  
  // Get pending orders count
  const getPendingOrders = () => {
    if (!dashboardData || !dashboardData.summary || !dashboardData.summary.orderStatus) {
      return 0;
    }
    
    const { orderStatus } = dashboardData.summary;
    return (orderStatus.processing || 0) + (orderStatus.pending || 0);
  };
  
  // Get total products count
  const getTotalProducts = () => {
    if (!dashboardData || !dashboardData.topProducts) {
      return 0;
    }
    
    // Check if topProducts is an array
    if (!Array.isArray(dashboardData.topProducts)) {
      console.log('Top products is not an array:', dashboardData.topProducts);
      return 0;
    }
    
    // Count the number of products in the topProducts array
    return dashboardData.topProducts.length || 0;
  };
  
  // Get total revenue
  const getTotalRevenue = () => {
    if (!dashboardData || !dashboardData.summary) {
      return 0;
    }
    
    return dashboardData.summary.totalRevenue || 0;
  };
  
  // Get low stock items count
  const getLowStockCount = () => {
    if (!dashboardData || !dashboardData.inventoryStatus || !dashboardData.inventoryStatus.lowStockItems) {
      return 0;
    }
    
    // Check if lowStockItems is an array
    if (!Array.isArray(dashboardData.inventoryStatus.lowStockItems)) {
      console.log('Low stock items is not an array:', dashboardData.inventoryStatus.lowStockItems);
      return 0;
    }
    
    return dashboardData.inventoryStatus.lowStockItems.length || 0;
  };
  
  // Order table columns configuration
  const orderColumns = [
    {
      header: 'Order ID',
      field: 'orderId',
      sortable: true
    },
    {
      header: 'Customer',
      field: 'customer.name',
      sortable: true,
      render: (row) => row.customer?.name || 'N/A'
    },
    {
      header: 'Product',
      field: 'items',
      render: (row) => {
        if (!row.items || row.items.length === 0) return 'N/A';
        return row.items[0].name || 'N/A';
      }
    },
    {
      header: 'Date',
      field: 'orderDate',
      sortable: true,
      formatter: (value) => new Date(value).toLocaleDateString()
    },
    {
      header: 'Status',
      field: 'status',
      sortable: true,
      render: (row) => {
        const statusColors = {
          'Delivered': 'bg-green-100 text-green-800',
          'Shipped': 'bg-blue-100 text-blue-800',
          'Processing': 'bg-yellow-100 text-yellow-800',
          'Pending': 'bg-orange-100 text-orange-800',
          'Cancelled': 'bg-red-100 text-red-800',
          'Returned': 'bg-purple-100 text-purple-800'
        };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Amount',
      field: 'payment.amount',
      sortable: true,
      formatter: (value) => `₹${parseFloat(value).toLocaleString()}`
    }
  ];
  
  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="w-full page-container mt-2">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-subtitle">Monitor your warehouse performance and inventory status</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="input"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="input"
              />
            </div>
            
            <button 
              onClick={() => fetchDashboardData(dateRange)}
              className="btn btn-primary"
            >
              <FiCalendar className="mr-2 h-4 w-4" />
              Apply Filter
            </button>
          </div>
        </div>
        
        {/* Loading or Error States */}
        {loading.dashboard && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading dashboard data...
          </div>
        )}
        
        {errors.dashboard && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Error loading dashboard data. Please try again later.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="stat-card">
          <StatCard
            title="Total Orders"
            value={getTotalOrders().toLocaleString()}
            icon={<FiShoppingCart className="h-6 w-6 text-primary-600" />}
            isLoading={loading.dashboard}
            color="primary"
            change="+12.5%"
            period="vs. last period"
          />
        </div>
        
        <div className="stat-card">
          <StatCard
            title="Total Products"
            value={getTotalProducts().toLocaleString()}
            icon={<FiPackage className="h-6 w-6 text-secondary-600" />}
            isLoading={loading.dashboard}
            color="secondary"
            change="+5.2%"
            period="vs. last period"
          />
        </div>
        
        <div className="stat-card">
          <StatCard
            title="Pending Orders"
            value={getPendingOrders().toLocaleString()}
            icon={<FiTruck className="h-6 w-6 text-warning-600" />}
            isLoading={loading.dashboard}
            color="warning"
            change="-3.1%"
            period="vs. last period"
          />
        </div>
        
        <div className="stat-card">
          <StatCard
            title="Total Revenue"
            value={`₹${getTotalRevenue().toLocaleString()}`}
            icon={<FiDollarSign className="h-6 w-6 text-success-600" />}
            isLoading={loading.dashboard}
            color="success"
            change="+18.3%"
            period="vs. last period"
          />
        </div>
      </div>
      
      {/* Low Stock Alert */}
      {getLowStockCount() > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8 shadow-sm animate-[fadeIn_0.5s_ease-in-out]">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-warning-100 rounded-full p-2">
              <FiAlertCircle className="h-5 w-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">Inventory Alert</h3>
              <div className="mt-1 text-sm text-warning-700">
                <p>You have <span className="font-bold">{getLowStockCount()}</span> items with low stock levels that need attention.</p>
              </div>
              <div className="mt-2">
                <a href="/inventory" className="text-sm font-medium text-warning-800 hover:text-warning-900 inline-flex items-center">
                  View inventory
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
          <FiBarChart2 className="mr-2 h-5 w-5 text-primary-600" />
          Performance Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Marketplace */}
          <div className="chart-card">
            <ChartCard
              title="Sales by Marketplace"
              subtitle={`${dateRange.startDate} to ${dateRange.endDate}`}
              type="bar"
              data={getSalesData()}
              dateKey="date"
              series={[
                { dataKey: 'AmazonRevenue', name: 'Amazon', color: '#FF9900' },
                { dataKey: 'FlipkartRevenue', name: 'Flipkart', color: '#2874F0' },
                { dataKey: 'MeeshoRevenue', name: 'Meesho', color: '#F43397' }
              ]}
              isLoading={loading.dashboard}
              height={300}
            />
          </div>
          
          {/* Order Status Distribution */}
          <div className="chart-card">
            <ChartCard
              title="Order Status Distribution"
              type="pie"
              data={getOrderStatusData()}
              series={[{ dataKey: 'value' }]}
              isLoading={loading.dashboard}
              colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
              height={300}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Orders Trend */}
        <div className="chart-card">
          <ChartCard
            title="Daily Orders Trend"
            subtitle={`${dateRange.startDate} to ${dateRange.endDate}`}
            type="line"
            data={getSalesData()}
            dateKey="date"
            series={[
              { dataKey: 'totalOrders', name: 'Orders', color: '#3B82F6' }
            ]}
            isLoading={loading.dashboard}
            height={300}
          />
        </div>
        
        {/* Inventory by Status */}
        <div className="chart-card">
          <ChartCard
            title="Inventory Status"
            type="pie"
            data={getInventoryStatusData()}
            series={[{ dataKey: 'value' }]}
            isLoading={loading.dashboard}
            colors={['#10B981', '#F59E0B', '#EF4444']}
            height={300}
          />
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="data-table bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiShoppingCart className="mr-2 h-5 w-5 text-primary-600" />
            Recent Orders
          </h2>
          <p className="mt-1 text-sm text-gray-500">A list of recent orders from all marketplaces</p>
        </div>
        
        <div className="overflow-x-auto">
          <DataTable
            data={getRecentOrders()}
            columns={orderColumns}
            isLoading={loading.dashboard}
            emptyMessage="No recent orders found"
            className="w-full"
          />
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <a href="/orders" className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center justify-center sm:justify-start">
            View all orders
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
