import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  FiX, 
  FiHome, 
  FiDatabase, 
  FiShoppingCart, 
  FiPackage, 
  FiUploadCloud, 
  FiSettings,
  FiBarChart2,
  FiUsers
} from 'react-icons/fi';

const navigation = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'SKU Mapping', href: '/sku-mapping', icon: FiDatabase },
  { name: 'Orders', href: '/orders', icon: FiShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: FiPackage },
  { name: 'Data Import', href: '/data-import', icon: FiUploadCloud },
  { name: 'Reports', href: '/reports', icon: FiBarChart2 },
  { name: 'Settings', href: '/settings', icon: FiSettings },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  
  // Helper function to determine if a nav item is active
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <>
      {/* Mobile sidebar - overlay style */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="fixed inset-0 flex z-20 md:hidden" 
          onClose={setSidebarOpen}
          static
        >
          {/* Overlay */}
          <Transition
            show={sidebarOpen}
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition>
          
          {/* Sidebar panel */}
          <Transition
            show={sidebarOpen}
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div id="mobile-sidebar" className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gradient-to-b from-primary-800 to-primary-600 shadow-xl">
              {/* Close button */}
              <Transition
                show={sidebarOpen}
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <FiX className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition>
              
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-md shadow-md">
                    <FiPackage className="h-6 w-6 text-primary-600" />
                  </div>
                  <h1 className="text-white text-xl font-bold ml-2">WMS</h1>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group flex items-center px-3 py-2 text-base font-medium rounded-md transition-all duration-200
                        ${isActive(item.href)
                          ? 'bg-primary-700 text-white shadow-md'
                          : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                        }
                      `}
                      onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-4 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-primary-300 group-hover:text-white'}`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* User profile */}
              <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div className="bg-primary-900 rounded-full p-1">
                      <FiUsers className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">Admin User</p>
                      <p className="text-xs font-medium text-blue-200">View profile</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
          
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition>

      {/* Desktop sidebar - fixed position */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-primary-800 to-primary-600 shadow-xl overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-primary-700">
            <div className="flex items-center">
              <div className="bg-white p-2 rounded-md shadow-md">
                <FiPackage className="h-6 w-6 text-primary-600" />
              </div>
              <h1 className="text-white text-lg font-bold ml-2">Warehouse Management</h1>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-3 pb-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-primary-700 text-white shadow-md'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                    }
                  `}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-primary-300 group-hover:text-white'}`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User profile */}
          <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="bg-primary-900 rounded-full p-1">
                  <FiUsers className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs font-medium text-primary-200">View profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
