import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiDownload, FiUpload, FiAlertCircle, FiX } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import DataTable from '../components/ui/DataTable';
import { toast } from 'react-toastify';

const SkuMapping = () => {
  const { 
    loading, 
    errors, 
    products, 
    skus,
    fetchProducts,
    fetchSkus,
    createSku,
    updateSku,
    deleteSku,
    createProduct,
    updateProduct
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMapping, setCurrentMapping] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marketplaces, setMarketplaces] = useState(['Amazon', 'Flipkart', 'Meesho']);
  const [newCategory, setNewCategory] = useState('');
  const [newMarketplace, setNewMarketplace] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showNewMarketplaceInput, setShowNewMarketplaceInput] = useState(false);
  const [error, setError] = useState('');

  // Fetch products and SKUs on component mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchProducts();
      await fetchSkus();
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process products and SKUs into mappings
  useEffect(() => {
    if (products.length > 0 && skus.length > 0) {
      // Extract categories from products
      const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      setCategories(productCategories);
      
      // Create mappings from products and SKUs
      const productMappings = products.map(product => {
        // Find all SKUs for this product's MSKU
        const productSkus = skus.filter(sku => sku.msku === product.msku);
        
        return {
          id: product._id,
          msku: product.msku,
          productName: product.name,
          category: product.category || 'Uncategorized',
          skus: productSkus.map(sku => ({
            id: sku._id,
            sku: sku.sku,
            marketplace: sku.marketplace
          }))
        };
      });
      
      setMappings(productMappings);
    }
  }, [products, skus]);

  // Handle adding a new mapping
  const handleAddMapping = () => {
    setCurrentMapping({
      id: null,
      msku: '',
      skus: [{ id: null, sku: '', marketplace: marketplaces[0] }],
      productName: '',
      category: categories.length > 0 ? categories[0] : 'Uncategorized'
    });
    setError('');
    setIsModalOpen(true);
  };

  // Handle editing an existing mapping
  const handleEditMapping = (mapping) => {
    setCurrentMapping({
      ...mapping,
      skus: mapping.skus.length > 0 ? mapping.skus : [{ id: null, sku: '', marketplace: marketplaces[0] }]
    });
    setError('');
    setIsModalOpen(true);
  };

  // Handle deleting a mapping
  const handleDeleteMapping = async (id) => {
    if (window.confirm('Are you sure you want to delete this mapping? This will delete the product and all associated SKUs.')) {
      try {
        // Find all SKUs associated with this product
        const mapping = mappings.find(m => m.id === id);
        if (!mapping) return;
        
        // Delete all SKUs first
        for (const sku of mapping.skus) {
          if (sku.id) {
            await deleteSku(sku.id);
          }
        }
        
        // Then delete the product
        await updateProduct(id, { isDeleted: true });
        
        // Refresh data
        await fetchProducts();
        await fetchSkus();
        
        toast.success(`Successfully deleted ${mapping.productName}`);
      } catch (err) {
        console.error('Delete error:', err);
        setError(`Failed to delete mapping: ${err.message || 'Unknown error'}`);
        toast.error(`Failed to delete mapping: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Handle saving a mapping
  const handleSaveMapping = async (mapping) => {
    try {
      setError('');
      
      // Validate inputs
      if (!mapping.msku.trim()) {
        setError('MSKU is required');
        toast.error('MSKU is required');
        return;
      }
      
      if (!mapping.productName.trim()) {
        setError('Product name is required');
        toast.error('Product name is required');
        return;
      }
      
      if (mapping.skus.some(sku => !sku.sku.trim())) {
        setError('All SKUs must have a value');
        toast.error('All SKUs must have a value');
        return;
      }
      
      // Handle new category
      let category = mapping.category;
      if (category === 'new' && newCategory.trim()) {
        category = newCategory.trim();
        if (!categories.includes(category)) {
          setCategories([...categories, category]);
        }
      } else if (category === 'new' && !newCategory.trim()) {
        setError('Please enter a new category name');
        toast.error('Please enter a new category name');
        return;
      }
      
      // Check for new marketplace without a value
      const hasNewMarketplace = mapping.skus.some(sku => sku.marketplace === 'new');
      if (hasNewMarketplace && !newMarketplace.trim()) {
        setError('Please enter a new marketplace name');
        toast.error('Please enter a new marketplace name');
        return;
      }
      
      // First create or update the product
      let productId = mapping.id;
      let isNewProduct = !productId;
      
      if (!productId) {
        // Create new product
        const productData = {
          msku: mapping.msku.trim(),
          name: mapping.productName.trim(),
          category: category
        };
        
        const newProduct = await createProduct(productData);
        productId = newProduct._id;
      } else {
        // Update existing product
        const productData = {
          msku: mapping.msku.trim(),
          name: mapping.productName.trim(),
          category: category
        };
        
        await updateProduct(productId, productData);
      }
      
      // Then create or update SKUs
      for (const sku of mapping.skus) {
        // Handle new marketplace
        let marketplace = sku.marketplace;
        if (marketplace === 'new' && newMarketplace.trim()) {
          marketplace = newMarketplace.trim();
          if (!marketplaces.includes(marketplace)) {
            setMarketplaces([...marketplaces, marketplace]);
          }
        }
        
        if (sku.id) {
          // Update existing SKU
          await updateSku(sku.id, {
            sku: sku.sku.trim(),
            msku: mapping.msku.trim(),
            marketplace: marketplace,
            product: productId
          });
        } else {
          // Create new SKU
          await createSku({
            sku: sku.sku.trim(),
            msku: mapping.msku.trim(),
            marketplace: marketplace,
            product: productId
          });
        }
      }
      
      // Refresh data
      await fetchProducts();
      await fetchSkus();
      
      // Show success message
      if (isNewProduct) {
        toast.success(`Successfully created ${mapping.productName} with ${mapping.skus.length} SKUs`);
      } else {
        toast.success(`Successfully updated ${mapping.productName}`);
      }
      
      // Reset form state
      setIsModalOpen(false);
      setNewCategory('');
      setNewMarketplace('');
      setShowNewCategoryInput(false);
      setShowNewMarketplaceInput(false);
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Failed to save mapping: ${errorMessage}`);
      toast.error(`Failed to save mapping: ${errorMessage}`);
    }
  };
  
  // Add a new SKU field to the current mapping
  const handleAddSku = () => {
    if (!currentMapping) return;
    
    setCurrentMapping({
      ...currentMapping,
      skus: [
        ...currentMapping.skus,
        { id: null, sku: '', marketplace: marketplaces[0] }
      ]
    });
  };
  
  // Handle category selection change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewCategoryInput(true);
    } else {
      setShowNewCategoryInput(false);
    }
    
    setCurrentMapping({
      ...currentMapping,
      category: value
    });
  };
  
  // Handle marketplace selection change
  const handleMarketplaceChange = (index, value) => {
    if (value === 'new') {
      setShowNewMarketplaceInput(true);
    } else {
      setShowNewMarketplaceInput(false);
    }
    
    const updatedSkus = [...currentMapping.skus];
    updatedSkus[index].marketplace = value;
    setCurrentMapping({
      ...currentMapping,
      skus: updatedSkus
    });
  };
  
  // Table columns configuration
  const columns = [
    {
      header: 'MSKU',
      field: 'msku',
      sortable: true,
      className: 'font-medium text-primary-600'
    },
    {
      header: 'Product Name',
      field: 'productName',
      sortable: true
    },
    {
      header: 'Category',
      field: 'category',
      sortable: true
    },
    {
      header: 'SKUs',
      field: 'skus',
      render: (row) => (
        <div className="max-h-24 overflow-y-auto">
          {row.skus.map((sku, index) => (
            <div key={sku.id || index} className="mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                {sku.marketplace}
              </span>
              {sku.sku}
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div className="flex space-x-3">
          <button 
            onClick={() => handleEditMapping(row)}
            className="text-primary-600 hover:text-primary-900"
          >
            <FiEdit2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleDeleteMapping(row.id)}
            className="text-red-600 hover:text-red-900"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];
  
  // Filter function for the data table
  const filterData = (data) => {
    return data.filter(mapping => {
      const matchesSearch = searchTerm ? (
        mapping.msku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.skus.some(sku => sku.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : true;
      
      const matchesCategory = selectedCategory ? mapping.category === selectedCategory : true;
      
      const matchesMarketplace = selectedMarketplace 
        ? mapping.skus.some(sku => sku.marketplace === selectedMarketplace)
        : true;
      
      return matchesSearch && matchesCategory && matchesMarketplace;
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">SKU Mapping</h1>
        <button 
          onClick={handleAddMapping}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> Add New Mapping
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search SKUs or products..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              className="input pl-10"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              className="input pl-10"
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
            >
              <option value="">All Marketplaces</option>
              {marketplaces.map(marketplace => (
                <option key={marketplace} value={marketplace}>{marketplace}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            <FiUpload className="mr-1" /> Import
          </button>
          <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            <FiDownload className="mr-1" /> Export
          </button>
        </div>
      </div>

      {/* Mappings Table */}
      <DataTable
        data={mappings}
        columns={columns}
        isLoading={loading.products || loading.skus}
        emptyMessage="No SKU mappings found"
        onSearch={(term) => setSearchTerm(term)}
        onFilter={filterData}
        actionButtons={
          <button 
            onClick={handleAddMapping}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-1" /> Add New
          </button>
        }
      />

      {/* Modal for Add/Edit Mapping */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {currentMapping.id ? 'Edit Mapping' : 'Add New Mapping'}
            </h2>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Master SKU (MSKU)</label>
                <input
                  type="text"
                  className="input"
                  value={currentMapping.msku}
                  onChange={(e) => setCurrentMapping({...currentMapping, msku: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  className="input"
                  value={currentMapping.productName}
                  onChange={(e) => setCurrentMapping({...currentMapping, productName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input"
                  value={currentMapping.category}
                  onChange={handleCategoryChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="new">+ Add New Category</option>
                </select>
                
                {showNewCategoryInput && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter new category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKUs</label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {currentMapping.skus.map((sku, index) => (
                    <div key={sku.id || index} className="flex items-center space-x-2">
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={sku.marketplace}
                        onChange={(e) => handleMarketplaceChange(index, e.target.value)}
                      >
                        {marketplaces.map(marketplace => (
                          <option key={marketplace} value={marketplace}>{marketplace}</option>
                        ))}
                        <option value="new">+ Add New Marketplace</option>
                      </select>
                      <input
                        type="text"
                        placeholder="SKU"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={sku.sku}
                        onChange={(e) => {
                          const updatedSkus = [...currentMapping.skus];
                          updatedSkus[index].sku = e.target.value;
                          setCurrentMapping({...currentMapping, skus: updatedSkus});
                        }}
                      />
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          if (currentMapping.skus.length > 1) {
                            const updatedSkus = currentMapping.skus.filter((_, i) => i !== index);
                            setCurrentMapping({...currentMapping, skus: updatedSkus});
                          }
                        }}
                        disabled={currentMapping.skus.length <= 1}
                      >
                        <FiTrash2 className={`h-5 w-5 ${currentMapping.skus.length <= 1 ? 'opacity-50' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {showNewMarketplaceInput && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter new marketplace"
                      value={newMarketplace}
                      onChange={(e) => setNewMarketplace(e.target.value)}
                    />
                  </div>
                )}
                
                <button
                  className="mt-2 flex items-center text-primary-600 hover:text-primary-900"
                  onClick={handleAddSku}
                >
                  <FiPlus className="mr-1" /> Add SKU
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsModalOpen(false);
                  setError('');
                  setShowNewCategoryInput(false);
                  setShowNewMarketplaceInput(false);
                  setNewCategory('');
                  setNewMarketplace('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSaveMapping(currentMapping)}
                disabled={loading.products || loading.skus}
              >
                {loading.products || loading.skus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkuMapping;
