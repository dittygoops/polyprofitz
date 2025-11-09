import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Analyzing market...</p>
      <p className="mt-2 text-sm text-gray-500">Fetching price data, trends, and calculating metrics</p>
    </div>
  );
};
