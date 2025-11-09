import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { PricePoint } from '../types';

interface PriceChartProps {
  data: PricePoint[];
  title?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, title = 'Price History (7 Days)' }) => {
  const chartData = data.map((point) => ({
    time: point.t,
    price: point.p,
    formattedTime: format(new Date(point.t), 'MMM dd HH:mm'),
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Price (0-1)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="text-sm font-semibold">{payload[0].payload.formattedTime}</p>
                    <p className="text-sm text-blue-600">
                      Price: {(payload[0].value as number).toFixed(4)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Market Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
