import React, { useState, useEffect } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaFilter } from 'react-icons/fa';

const DataTable = ({
  data = [],
  columns = [],
  pagination = null,
  onPageChange = () => {},
  onRowClick = null,
  onSort = null,
  onFilter = null,
  onSearch = null,
  isLoading = false,
  emptyMessage = 'No data available',
  actionButtons = null,
  selectedRows = [],
  onRowSelect = null,
  bulkActions = null
}) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Handle sorting
  const handleSort = (field) => {
    let direction = 'asc';
    if (sortField === field) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(direction);
    
    if (onSort) {
      onSort(field, direction);
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };
  
  // Handle row selection
  const handleRowSelect = (id) => {
    if (onRowSelect) {
      onRowSelect(id);
    }
  };
  
  // Handle bulk action
  const handleBulkAction = (action) => {
    if (action.handler) {
      action.handler(selectedRows);
    }
  };
  
  // Render sort icon based on current sort state
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <FaSortUp className="ml-1 text-primary-600" /> 
      : <FaSortDown className="ml-1 text-primary-600" />;
  };
  
  // Render cell content based on column type
  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row);
    }
    
    if (column.field) {
      // Handle nested fields (e.g., 'customer.name')
      const fields = column.field.split('.');
      let value = row;
      
      for (const field of fields) {
        if (value === null || value === undefined) {
          return '';
        }
        value = value[field];
      }
      
      // Format value if formatter is provided
      if (column.formatter && typeof column.formatter === 'function') {
        return column.formatter(value, row);
      }
      
      return value || '';
    }
    
    return '';
  };
  
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md transition-all duration-300 hover:shadow-lg">
      {/* Table header with search and filters */}
      <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center mb-2 md:mb-0">
          {onSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="input pl-10 pr-4 py-2 w-full md:w-64 transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          )}
          
          {onFilter && (
            <button
              className="ml-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className={`${showFilters ? 'text-primary-600' : 'text-gray-500'}`} />
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {actionButtons}
          
          {bulkActions && selectedRows.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
              {bulkActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleBulkAction(action)}
                  className={`btn ${action.className || 'btn-secondary'}`}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Filters row */}
      {showFilters && onFilter && (
        <div className="p-4 bg-gray-50 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns
            .filter(column => column.filterable)
            .map((column, index) => (
              <div key={index} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {column.header}
                </label>
                {column.filterComponent ? (
                  column.filterComponent(filters[column.field], (value) => handleFilterChange(column.field, value))
                ) : (
                  <input
                    type="text"
                    value={filters[column.field] || ''}
                    onChange={(e) => handleFilterChange(column.field, e.target.value)}
                    className="input"
                    placeholder={`Filter by ${column.header.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {onRowSelect && (
                <th className="px-4 py-3 font-medium text-gray-900">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        onRowSelect(data.map(row => row.id || row._id));
                      } else {
                        onRowSelect([]);
                      }
                    }}
                    checked={selectedRows.length === data.length && data.length > 0}
                    className="rounded"
                  />
                </th>
              )}
              
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 font-medium text-gray-900 ${column.sortable ? 'cursor-pointer hover:bg-gray-200' : ''} ${column.className || ''} transition-colors duration-200`}
                  onClick={() => column.sortable && handleSort(column.field)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && renderSortIcon(column.field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (onRowSelect ? 1 : 0)}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-gray-600 font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onRowSelect ? 1 : 0)}
                  className="px-4 py-3 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || row._id || rowIndex}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                    selectedRows.includes(row.id || row._id) ? 'bg-blue-50' : ''
                  }`}
                  style={{
                    animation: 'fadeIn 0.5s ease-in-out forwards',
                    animationDelay: `${rowIndex * 0.05}s`,
                    opacity: 0
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {onRowSelect && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id || row._id)}
                        onChange={() => handleRowSelect(row.id || row._id)}
                        className="rounded"
                      />
                    </td>
                  )}
                  
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 ${column.className || ''}`}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    pagination.page <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = pagination.page <= 3
                    ? i + 1
                    : pagination.page >= pagination.pages - 2
                      ? pagination.pages - 4 + i
                      : pagination.page - 2 + i;
                  
                  if (pageNum <= 0 || pageNum > pagination.pages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      aria-current={pagination.page === pageNum ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pagination.page === pageNum
                          ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    pagination.page >= pagination.pages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
