import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ChartCard = ({
  title,
  subtitle,
  data = [],
  type = 'line',
  height = 300,
  series = [],
  colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  dateKey = 'date',
  showLegend = true,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  options = {}
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Format date for tooltip
  const formatDate = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      // Check if it's a date string like YYYY-MM-DD
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(date).toLocaleDateString();
      }
      
      // Check if it's a date string like YYYY-MM
      if (date.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = date.split('-');
        return new Date(year, month - 1).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      }
      
      // Check if it's a date string like YYYY-WW (year-week)
      if (date.match(/^\d{4}-\d{2}$/)) {
        const [year, week] = date.split('-');
        return `Week ${week}, ${year}`;
      }
    }
    
    return date;
  };
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900 mb-1">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="font-medium">{entry.name}: </span>
              <span className="ml-1">
                {typeof entry.value === 'number' 
                  ? entry.dataKey.toLowerCase().includes('revenue') 
                    ? `₹${entry.value.toLocaleString()}`
                    : entry.value.toLocaleString()
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Render appropriate chart based on type
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }
    
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={dateKey} 
                tickFormatter={formatDate}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {series.map((item, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.name}
                  stroke={item.color || colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={dateKey} 
                tickFormatter={formatDate}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {series.map((item, index) => (
                <Bar
                  key={index}
                  dataKey={item.dataKey}
                  name={item.name}
                  fill={item.color || colors[index % colors.length]}
                  barSize={20}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey={series[0]?.dataKey || 'value'}
                nameKey={options.nameKey || 'name'}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </Pie>
              {showLegend && <Legend />}
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading chart data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};

export default ChartCard;
