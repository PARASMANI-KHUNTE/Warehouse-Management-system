import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiBell, FiSearch, FiUser, FiPackage, FiSettings, FiHelpCircle, FiLogOut } from 'react-icons/fi';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section with mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open sidebar</span>
              <FiMenu className="block h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Logo for mobile */}
            <div className="flex items-center md:hidden ml-2">
              <div className="bg-primary-600 p-1 rounded-md shadow-sm">
                <FiPackage className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-800">WMS</span>
            </div>
          </div>

          {/* Search bar - responsive */}
          <div className="hidden sm:flex-1 sm:flex sm:justify-center max-w-2xl mx-auto px-2 lg:px-0 lg:ml-6">
            <div className="w-full max-w-lg">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                  placeholder="Search products, orders, or SKUs..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right section - notifications and profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search button for mobile */}
            <button
              type="button"
              className="sm:hidden p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => alert('Mobile search not implemented')}
            >
              <span className="sr-only">Search</span>
              <FiSearch className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Notifications dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <span className="sr-only">View notifications</span>
                <FiBell className="h-5 w-5" aria-hidden="true" />
                {/* Notification badge */}
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              
              {/* Notification dropdown panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-800 border-b">
                    <button className="text-xs text-blue-600 hover:text-blue-800">Mark all as read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex">
                        <div className="flex-shrink-0 bg-primary-100 rounded-full p-2">
                          <FiPackage className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">New order received</p>
                          <p className="text-xs text-gray-500">Order #12345 from Amazon</p>
                          <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2">
                          <FiSettings className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">System update completed</p>
                          <p className="text-xs text-gray-500">All services are now running normally</p>
                          <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 text-center">
                    <Link to="/notifications" className="text-xs font-medium text-primary-600 hover:text-primary-800">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center space-x-2 text-sm rounded-full bg-white text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center text-white shadow-sm">
                  <FiUser className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="hidden md:inline-block font-medium">Admin</span>
              </button>
              
              {/* User menu dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs font-medium text-gray-500 truncate">admin@warehouse.com</p>
                  </div>
                  <div className="py-1">
                    <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiUser className="mr-3 h-4 w-4 text-gray-500" />
                      Your Profile
                    </Link>
                    <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiSettings className="mr-3 h-4 w-4 text-gray-500" />
                      Settings
                    </Link>
                    <Link to="/help" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiHelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                      Help Center
                    </Link>
                  </div>
                  <div className="py-1">
                    <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FiLogOut className="mr-3 h-4 w-4 text-gray-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="sm:hidden border-t border-gray-200 pb-3 pt-2">
        <div className="px-4 sm:px-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
