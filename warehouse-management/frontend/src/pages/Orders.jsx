import { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiDownload, FiEye, FiPackage } from 'react-icons/fi';

// Sample data for orders - will be replaced with API data
const initialOrders = [
  {
    id: 'OD433463547904715100',
    orderDate: '2025-01-25',
    customer: 'Maitreyee Korde',
    product: 'Fusked Flufies Angry Lucifer Cat Toys for Kids',
    sku: 'CSTE_0546_ST_Animal_Lucifer_Cat_Black',
    msku: 'ANIMAL-LUCIFER-CAT-BLACK',
    status: 'Delivered',
    amount: 999,
    marketplace: 'Flipkart',
    shippingInfo: {
      address: 'Room number 214, Charaka Block, near Basketball court, Madhav Nagar, Eshwar Nagar',
      city: 'Udupi',
      state: 'Karnataka',
      pincode: '576104',
      trackingId: 'FMPP2831876140'
    }
  },
  {
    id: 'OD333467619716667100',
    orderDate: '2025-01-25',
    customer: 'Varun Singh Jadaun',
    product: 'Wooden music box happy birthday',
    sku: 'Map_Musicbox_Black_HBD',
    msku: 'MUSIC-BOX-BLACK-HBD',
    status: 'Delivered',
    amount: 379,
    marketplace: 'Flipkart',
    shippingInfo: {
      address: 'Arun Varun Kutir, Indira Colony',
      city: 'Karauli',
      state: 'Rajasthan',
      pincode: '322241',
      trackingId: 'FMPP2833086554'
    }
  },
  {
    id: 'OD433475128594395100',
    orderDate: '2025-01-26',
    customer: 'Aakriti',
    product: 'Classic Vintage Black Edition Wooden',
    sku: 'Music Box/11',
    msku: 'MUSIC-BOX-VINTAGE-BLACK',
    status: 'Return Requested',
    amount: 379,
    marketplace: 'Flipkart',
    shippingInfo: {
      address: 'National institute of fashion technology, Near gulmohar park',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      trackingId: 'FMPC4477691630'
    }
  },
  {
    id: '114914439601482626_1',
    orderDate: '2025-01-26',
    customer: 'Customer from Maharashtra',
    product: 'Rudrav Harry Potter Music Box',
    sku: '32546987',
    msku: 'HARRY-POTTER-MUSIC-BOX',
    status: 'Delivered',
    amount: 299,
    marketplace: 'Meesho',
    shippingInfo: {
      state: 'Maharashtra',
      trackingId: ''
    }
  },
  {
    id: '114950041852214340_1',
    orderDate: '2025-01-26',
    customer: 'Customer from Arunachal Pradesh',
    product: 'Goku dragonBall Z Anime Action Figure',
    sku: 'goku action figure01',
    msku: 'GOKU-ACTION-FIGURE',
    status: 'RTO Initiated',
    amount: 699,
    marketplace: 'Meesho',
    shippingInfo: {
      state: 'Arunachal Pradesh',
      trackingId: ''
    }
  },
  {
    id: 'B0DTK31PPH',
    orderDate: '2025-02-01',
    customer: 'Amazon Customer',
    product: 'Fusked Flufies Breathing Koala Soft Toys for Baby Girl and Boy',
    sku: 'CSTE_0545_ST_Animal_Breathing_Dog_B_2',
    msku: 'BREATHING-DOG-B',
    status: 'Shipped',
    amount: 1299,
    marketplace: 'Amazon',
    shippingInfo: {
      fulfillmentCenter: 'TLCQ',
      trackingId: ''
    }
  },
  {
    id: 'B0DK52Z4FT',
    orderDate: '2025-02-01',
    customer: 'Amazon Customer',
    product: 'Fusked Flufies Breathing Teddy Soft Toys for Baby Girl and Boy',
    sku: 'Breathing_Lilo_Stich_Blue',
    msku: 'BREATHING-STITCH-BLUE',
    status: 'Shipped',
    amount: 1299,
    marketplace: 'Amazon',
    shippingInfo: {
      fulfillmentCenter: 'TLCQ',
      trackingId: ''
    }
  }
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get unique statuses and marketplaces for filters
  const statuses = [...new Set(initialOrders.map(order => order.status))];
  const marketplaces = [...new Set(initialOrders.map(order => order.marketplace))];

  useEffect(() => {
    // Simulate API call to fetch orders
    setTimeout(() => {
      setOrders(initialOrders);
      setFilteredOrders(initialOrders);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Apply filters when any filter changes
    let result = orders;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.customer.toLowerCase().includes(term) ||
        order.product.toLowerCase().includes(term) ||
        order.sku.toLowerCase().includes(term) ||
        order.msku.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply marketplace filter
    if (marketplaceFilter) {
      result = result.filter(order => order.marketplace === marketplaceFilter);
    }
    
    // Apply date range filter
    if (dateRangeFilter.start) {
      result = result.filter(order => new Date(order.orderDate) >= new Date(dateRangeFilter.start));
    }
    
    if (dateRangeFilter.end) {
      result = result.filter(order => new Date(order.orderDate) <= new Date(dateRangeFilter.end));
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, marketplaceFilter, dateRangeFilter]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'return requested':
      case 'rto initiated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportOrders = () => {
    // In a real application, this would generate a CSV file
    alert('Exporting orders to CSV...');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
        <button 
          onClick={exportOrders}
          className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          <FiDownload className="mr-2" /> Export Orders
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          {/* Marketplace Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={marketplaceFilter}
              onChange={(e) => setMarketplaceFilter(e.target.value)}
            >
              <option value="">All Marketplaces</option>
              {marketplaces.map(marketplace => (
                <option key={marketplace} value={marketplace}>{marketplace}</option>
              ))}
            </select>
          </div>
          
          {/* Date Range - Start */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={dateRangeFilter.start}
              onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
            />
          </div>
          
          {/* Date Range - End */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={dateRangeFilter.end}
              onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketplace</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="max-w-xs truncate" title={order.product}>
                            {order.product}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.marketplace}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <FiPackage className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{filteredOrders.length}</span> orders
              </div>
              <div className="flex-1 flex justify-end">
                {/* Pagination would go here in a real application */}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Order Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order ID</p>
                      <p className="text-sm text-gray-900">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order Date</p>
                      <p className="text-sm text-gray-900">{selectedOrder.orderDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Marketplace</p>
                      <p className="text-sm text-gray-900">{selectedOrder.marketplace}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-sm text-gray-900">₹{selectedOrder.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tracking ID</p>
                      <p className="text-sm text-gray-900">{selectedOrder.shippingInfo.trackingId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Customer Name</p>
                    <p className="text-sm text-gray-900">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.shippingInfo.address || 'N/A'}<br />
                      {selectedOrder.shippingInfo.city && `${selectedOrder.shippingInfo.city}, `}
                      {selectedOrder.shippingInfo.state}<br />
                      {selectedOrder.shippingInfo.pincode && `PIN: ${selectedOrder.shippingInfo.pincode}`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Product Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Product Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Product Name</p>
                      <p className="text-sm text-gray-900">{selectedOrder.product}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quantity</p>
                      <p className="text-sm text-gray-900">1</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">SKU</p>
                      <p className="text-sm text-gray-900">{selectedOrder.sku}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Master SKU (MSKU)</p>
                      <p className="text-sm text-gray-900">{selectedOrder.msku}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
