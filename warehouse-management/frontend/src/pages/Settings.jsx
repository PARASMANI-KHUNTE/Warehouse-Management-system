import { useState } from 'react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Your Company',
    email: 'contact@example.com',
    phone: '+91 1234567890',
    address: 'New Delhi, India',
    lowStockThreshold: 10
  });

  const [marketplaceSettings, setMarketplaceSettings] = useState({
    amazon: {
      enabled: true,
      apiKey: '************',
      secretKey: '************',
      marketplaceId: 'A21TJRUUN4KGV'
    },
    flipkart: {
      enabled: true,
      apiKey: '************',
      secretKey: '************'
    },
    meesho: {
      enabled: true,
      apiKey: '************',
      secretKey: '************'
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlert: true,
    newOrderAlert: true,
    orderStatusChangeAlert: true,
    emailNotifications: true,
    pushNotifications: false
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: value
    });
  };

  const handleMarketplaceSettingChange = (marketplace, field, value) => {
    setMarketplaceSettings({
      ...marketplaceSettings,
      [marketplace]: {
        ...marketplaceSettings[marketplace],
        [field]: value
      }
    });
  };

  const handleNotificationSettingChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };

  const handleSaveSettings = () => {
    // In a real application, this would save settings to the backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`${
              activeTab === 'marketplaces'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('marketplaces')}
          >
            Marketplaces
          </button>
          <button
            className={`${
              activeTab === 'notifications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('users')}
          >
            Users & Permissions
          </button>
          <button
            className={`${
              activeTab === 'backup'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('backup')}
          >
            Backup & Restore
          </button>
        </nav>
      </div>
      
      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">General Settings</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={generalSettings.companyName}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={generalSettings.email}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={generalSettings.phone}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={generalSettings.address}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={generalSettings.lowStockThreshold}
                  onChange={handleGeneralSettingsChange}
                />
                <p className="mt-1 text-sm text-gray-500">Products with stock below this threshold will be marked as "Low Stock"</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <FiSave className="mr-2" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Marketplace Settings */}
      {activeTab === 'marketplaces' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Marketplace Settings</h2>
          </div>
          <div className="p-6">
            {/* Amazon */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-800">Amazon</h3>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-500">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={marketplaceSettings.amazon.enabled}
                      onChange={(e) => handleMarketplaceSettingChange('amazon', 'enabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.amazon.apiKey}
                    onChange={(e) => handleMarketplaceSettingChange('amazon', 'apiKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.amazon.secretKey}
                    onChange={(e) => handleMarketplaceSettingChange('amazon', 'secretKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.amazon.marketplaceId}
                    onChange={(e) => handleMarketplaceSettingChange('amazon', 'marketplaceId', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Flipkart */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-800">Flipkart</h3>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-500">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={marketplaceSettings.flipkart.enabled}
                      onChange={(e) => handleMarketplaceSettingChange('flipkart', 'enabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.flipkart.apiKey}
                    onChange={(e) => handleMarketplaceSettingChange('flipkart', 'apiKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.flipkart.secretKey}
                    onChange={(e) => handleMarketplaceSettingChange('flipkart', 'secretKey', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Meesho */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-800">Meesho</h3>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-500">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={marketplaceSettings.meesho.enabled}
                      onChange={(e) => handleMarketplaceSettingChange('meesho', 'enabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.meesho.apiKey}
                    onChange={(e) => handleMarketplaceSettingChange('meesho', 'apiKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={marketplaceSettings.meesho.secretKey}
                    onChange={(e) => handleMarketplaceSettingChange('meesho', 'secretKey', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <FiSave className="mr-2" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Notification Settings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Low Stock Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified when product stock falls below threshold</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="lowStockAlert"
                    className="sr-only peer"
                    checked={notificationSettings.lowStockAlert}
                    onChange={handleNotificationSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">New Order Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified when a new order is placed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="newOrderAlert"
                    className="sr-only peer"
                    checked={notificationSettings.newOrderAlert}
                    onChange={handleNotificationSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Order Status Change Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified when an order status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="orderStatusChangeAlert"
                    className="sr-only peer"
                    checked={notificationSettings.orderStatusChangeAlert}
                    onChange={handleNotificationSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <hr className="my-6" />
              
              <h3 className="text-md font-medium text-gray-800 mb-4">Notification Channels</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="emailNotifications"
                    className="sr-only peer"
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="pushNotifications"
                    className="sr-only peer"
                    checked={notificationSettings.pushNotifications}
                    onChange={handleNotificationSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <FiSave className="mr-2" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Users & Permissions */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Users & Permissions</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">User management functionality will be implemented in a future update.</p>
          </div>
        </div>
      )}
      
      {/* Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Backup & Restore</h2>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-800 mb-4">Database Backup</h3>
              <p className="text-sm text-gray-500 mb-4">Create a backup of your entire database including all products, orders, and settings.</p>
              <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                <FiDownload className="mr-2" /> Create Backup
              </button>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-4">Restore Database</h3>
              <p className="text-sm text-gray-500 mb-4">Restore your database from a previous backup file.</p>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                  <FiRefreshCw className="mr-2" /> Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
