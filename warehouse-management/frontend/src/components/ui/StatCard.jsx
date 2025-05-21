import React from 'react';

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'increase',
  changeText,
  className = '',
  onClick = null,
  footer = null,
  isLoading = false,
  color = 'blue',
  period = null
}) => {
  // Determine change color based on type or explicit color
  let changeColor;
  if (change && change.startsWith('+')) {
    changeColor = 'text-green-600';
    changeType = 'increase';
  } else if (change && change.startsWith('-')) {
    changeColor = 'text-red-600';
    changeType = 'decrease';
  } else {
    changeColor = 'text-gray-600';
  }
  
  // Determine change icon based on type
  const changeIcon = changeType === 'increase' 
    ? '↑' 
    : changeType === 'decrease' 
      ? '↓' 
      : '';
  
  // Determine background color based on color prop
  const bgColorMap = {
    blue: 'bg-blue-50 border-blue-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200'
  };
  
  const bgColor = bgColorMap[color] || 'bg-white border-gray-200';
  
  return (
    <div 
      className={`rounded-lg shadow-sm border p-5 ${bgColor} hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-32">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${color}-600`}></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-gray-700 text-sm font-medium">{title}</h3>
            {icon && <div className="text-xl">{icon}</div>}
          </div>
          
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            
            {(change || period) && (
              <div className="mt-2 flex items-baseline space-x-1">
                {change && (
                  <span className={`text-sm font-medium ${changeColor}`}>
                    {changeIcon} {change}
                  </span>
                )}
                {changeText && <span className="ml-1 text-gray-500">{changeText}</span>}
                {period && <span className="text-xs text-gray-500">{period}</span>}
              </div>
            )}
          </div>
          
          {footer && <div className="mt-4 border-t pt-3 text-sm text-gray-600">{footer}</div>}
        </>
      )}
    </div>
  );
};

export default StatCard;
