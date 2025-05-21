import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import SkuMapping from './pages/SkuMapping'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import DataImport from './pages/DataImport'
import Settings from './pages/Settings'

// Placeholder for Reports page
const Reports = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-semibold text-gray-800 mb-4">Reports</h1>
    <p className="text-gray-600">This feature is coming soon.</p>
  </div>
);

// Placeholder for Help page
const Help = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-semibold text-gray-800 mb-4">Help Center</h1>
    <p className="text-gray-600">Need assistance? Contact support at support@warehouse.com</p>
  </div>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 768) {
        // Check if the click is outside the sidebar
        const sidebar = document.getElementById('mobile-sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64 w-0 overflow-hidden">
        {/* Header Component */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        <main className="relative flex-1 overflow-y-auto focus:outline-none pt-2">
          <div className="py-4">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              {/* Page content goes here */}
              <div className="py-4">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/sku-mapping" element={<SkuMapping />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/data-import" element={<DataImport />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/profile" element={<Settings />} />
                  <Route path="/notifications" element={<Dashboard />} />
                </Routes>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App
