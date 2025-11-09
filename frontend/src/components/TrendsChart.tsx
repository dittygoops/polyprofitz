import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { TrendsPoint } from '../types';

interface TrendsChartProps {
  data: TrendsPoint[];
  searchQuery: string;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ data, searchQuery }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Google Trends: "{searchQuery}"
        </h2>
        <p className="text-gray-500 text-center py-8">No trends data available</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    time: point.t,
    interest: point.v,
    formattedTime: format(new Date(point.t), 'MMM dd'),
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Google Trends: "{searchQuery}"
      </h2>
      <p className="text-sm text-gray-600 mb-4">Search interest over time (0-100)</p>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Interest (0-100)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="text-sm font-semibold">{payload[0].payload.formattedTime}</p>
                    <p className="text-sm text-purple-600">
                      Interest: {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="interest"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorInterest)"
            name="Search Interest"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
