import { useState, useRef, useEffect } from 'react';
import { importAPI, skuAPI, productAPI } from '../services/api';
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

const DataImport = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
  const [unmappedSkus, setUnmappedSkus] = useState([]);
  const [products, setProducts] = useState([]);
  const [skuMappings, setSkuMappings] = useState({});
  const [showMapping, setShowMapping] = useState(false);
  const fileInputRef = useRef(null);
  
  // Load products for mapping
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAll();
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    // Filter for CSV files only
    const csvFiles = newFiles.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    // Add new files to the list
    setFiles(prevFiles => [...prevFiles, ...csvFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const detectMarketplace = (fileName) => {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('amazon')) return 'Amazon';
    if (lowerFileName.includes('fk') || lowerFileName.includes('flipkart')) return 'Flipkart';
    if (lowerFileName.includes('meesho')) return 'Meesho';
    return 'Unknown';
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    
    setImportStatus('processing');
    
    // Initialize processing status for each file
    const initialStatus = {};
    files.forEach((file, index) => {
      initialStatus[index] = { status: 'processing', message: 'Uploading file...' };
    });
    setProcessingStatus(initialStatus);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Step 1: Upload the file
        setProcessingStatus(prev => ({
          ...prev,
          [i]: { status: 'processing', message: 'Uploading file...' }
        }));
        
        const uploadResponse = await importAPI.upload(formData);
        
        // Step 2: Detect marketplace
        setProcessingStatus(prev => ({
          ...prev,
          [i]: { status: 'processing', message: 'Detecting marketplace...' }
        }));
        
        const detectResponse = await importAPI.detect({ fileId: uploadResponse.data.fileId });
        
        // Step 3: Process the file
        setProcessingStatus(prev => ({
          ...prev,
          [i]: { status: 'processing', message: 'Processing data...' }
        }));
        
        const processResponse = await importAPI.process({
          fileId: uploadResponse.data.fileId,
          marketplace: detectResponse.data.marketplace,
          importType: 'auto', // Add default import type
          mappings: skuMappings // Include any existing SKU mappings
        });
        
        // Check for unmapped SKUs
        if (processResponse.data.unmappedSkus && processResponse.data.unmappedSkus.length > 0) {
          setUnmappedSkus(prev => [...prev, ...processResponse.data.unmappedSkus]);
          setShowMapping(true);
        }
        
        // Update status to success
        setProcessingStatus(prev => ({
          ...prev,
          [i]: {
            status: 'success',
            message: `File processed successfully. ${processResponse.data.summary || ''}`
          }
        }));
      } catch (error) {
        console.error('Error processing file:', error);
        let errorMessage = 'Error processing file. Please check format.';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setProcessingStatus(prev => ({
          ...prev,
          [i]: {
            status: 'error',
            message: errorMessage
          }
        }));
        
        // Add a small delay before processing the next file
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Set overall status
    const hasErrors = Object.values(processingStatus).some(status => status.status === 'error');
    setImportStatus(hasErrors ? 'error' : 'success');
  };

  const clearAll = () => {
    setFiles([]);
    setImportStatus(null);
    setProcessingStatus({});
    // Don't clear unmapped SKUs to allow mapping
  };
  
  const handleSkuMapping = (sku, msku) => {
    setSkuMappings(prev => ({
      ...prev,
      [sku]: msku
    }));
  };
  
  const saveSkuMappings = async () => {
    try {
      console.log('Starting SKU mapping process...');
      console.log('Available products:', products);
      console.log('Current SKU mappings:', skuMappings);
      
      // Convert mappings to array format expected by API
      const mappingsArray = Object.entries(skuMappings).map(([sku, msku]) => {
        const product = products.find(p => p.msku === msku);
        console.log(`Mapping SKU ${sku} to MSKU ${msku}, Product:`, product);
        
        if (!product) {
          console.warn(`No product found for MSKU: ${msku}`);
        }
        
        return {
          sku,
          msku,
          marketplace: detectMarketplace(files[0]?.name || 'Unknown'),
          productId: product?._id
        };
      }).filter(mapping => mapping.productId); // Only include mappings with valid products
      
      console.log('Prepared mappings array:', mappingsArray);
      
      if (mappingsArray.length === 0) {
        alert('No valid mappings to save. Please make sure you have selected valid products for your SKUs.');
        return;
      }
      
      // Save mappings using bulk API
      console.log('Sending bulk create request with data:', { skus: mappingsArray });
      const response = await skuAPI.bulkCreate({ skus: mappingsArray });
      console.log('Bulk create response:', response);
      
      alert(`Mappings saved successfully! Created: ${response.data.created.length}, Updated: ${response.data.updated.length}`);
      setUnmappedSkus([]); // Clear unmapped SKUs
      setShowMapping(false);
      
      // Redirect to SKU Mapping page after successful mapping
      window.location.href = '/sku-mapping';
    } catch (error) {
      console.error('Error saving SKU mappings:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error data:', error.response.data);
      }
      
      alert('Error saving mappings: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Data Import</h1>
      
      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Import Instructions</h2>
        <div className="flex items-start mb-4">
          <FiInfo className="text-primary-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <p className="text-gray-600">
              Upload CSV files from different marketplaces to import sales and inventory data. The system will automatically detect the marketplace based on the file name and structure.
            </p>
          </div>
        </div>
        <div className="flex items-start mb-4">
          <FiInfo className="text-primary-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <p className="text-gray-600">
              Supported marketplaces: Amazon, Flipkart, Meesho
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <FiInfo className="text-primary-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <p className="text-gray-600">
              The system will automatically map SKUs to MSKUs based on existing mappings. Any unmapped SKUs will be flagged for manual mapping.
            </p>
          </div>
        </div>
      </div>
      
      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            Drag and drop CSV files here
          </p>
          <p className="mt-1 text-xs text-gray-500">
            or
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Browse Files
          </button>
        </div>
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Files to Import</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiFile className="h-6 w-6 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB • 
                        Marketplace: <span className="font-medium">{detectMarketplace(file.name)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {processingStatus[index] && (
                      <div className={`mr-4 flex items-center ${
                        processingStatus[index].status === 'success' ? 'text-green-500' :
                        processingStatus[index].status === 'error' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>
                        {processingStatus[index].status === 'success' ? (
                          <FiCheckCircle className="h-5 w-5 mr-1" />
                        ) : processingStatus[index].status === 'error' ? (
                          <FiAlertCircle className="h-5 w-5 mr-1" />
                        ) : (
                          <svg className="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span className="text-xs">{processingStatus[index].message}</span>
                      </div>
                    )}
                    {!importStatus && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            {importStatus ? (
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Clear All
              </button>
            ) : (
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Import Files
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Import Results */}
      {importStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <FiCheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <div>
              <h3 className="text-green-800 font-medium">Import Successful</h3>
              <p className="text-green-700 text-sm mt-1">
                All files have been processed successfully. Data has been imported into the system.
              </p>
              <div className="mt-3">
                {unmappedSkus.length > 0 ? (
                  <button
                    className="text-sm text-green-800 font-medium underline"
                    onClick={() => setShowMapping(true)}
                  >
                    Map {unmappedSkus.length} unmapped SKUs now
                  </button>
                ) : (
                  <button
                    className="text-sm text-green-800 font-medium underline"
                    onClick={() => window.location.href = '/sku-mapping'}
                  >
                    Go to SKU Mapping page
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {importStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <FiAlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Import Completed with Errors</h3>
              <p className="text-red-700 text-sm mt-1">
                Some files could not be processed. Please check the error messages and try again.
              </p>
              {unmappedSkus.length > 0 && (
                <div className="mt-3">
                  <button
                    className="text-sm text-red-800 font-medium underline"
                    onClick={() => setShowMapping(true)}
                  >
                    Map {unmappedSkus.length} unmapped SKUs now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* SKU Mapping Interface */}
      {showMapping && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">SKU Mapping</h2>
            <p className="text-sm text-gray-600 mt-1">
              Map marketplace SKUs to your master SKUs (MSKUs)
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {unmappedSkus.length} unmapped SKUs found. Please map them to your products.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marketplace SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Map to Product (MSKU)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unmappedSkus.map((sku, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          value={skuMappings[sku] || ''}
                          onChange={(e) => handleSkuMapping(sku, e.target.value)}
                        >
                          <option value="">Select a product</option>
                          {products.map((product) => (
                            <option key={product._id} value={product.msku}>
                              {product.name} ({product.msku})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowMapping(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSkuMappings}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Save Mappings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImport;
