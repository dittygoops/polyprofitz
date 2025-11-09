import React from 'react';

interface MetricsCardProps {
  label: string;
  value: number | string;
  description: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ label, value, description, icon, trend }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${getTrendColor()}`}>
              {typeof value === 'number' ? value.toFixed(2) : value}
            </p>
            {trend && (
              <span className={`text-lg ${getTrendColor()}`}>
                {getTrendIcon()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        {icon && (
          <span className="text-2xl ml-2">{icon}</span>
        )}
      </div>
    </div>
  );
};
