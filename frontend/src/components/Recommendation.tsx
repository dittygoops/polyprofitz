import React from 'react';
import { Recommendation as RecommendationType, Scores } from '../types';

interface RecommendationProps {
  recommendation: RecommendationType;
  scores: Scores;
}

export const Recommendation: React.FC<RecommendationProps> = ({ recommendation, scores }) => {
  const getSignalColor = (signal: string) => {
    if (signal.includes('STRONG')) return 'bg-red-100 text-red-800 border-red-300';
    if (signal.includes('MODERATE')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (signal.includes('WEAK')) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Trade Signal</h2>
        <div className={`px-4 py-2 rounded-full border-2 font-bold ${getSignalColor(scores.signal)}`}>
          {scores.signal}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Entry Signal</p>
          <p className="text-xl font-bold text-gray-900">{recommendation.action}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Target Exit</p>
            <p className="font-semibold text-gray-900">{recommendation.targetExit}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Expected Return</p>
            <p className="font-semibold text-green-600">{recommendation.expectedReturn}</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
          <p className="text-xs text-yellow-800 font-medium">
            ⚠️ <strong>Philosophy:</strong> We're not predicting outcomes. We're arbitraging emotional overreactions by trading volatility caused by viral hype spikes.
          </p>
        </div>
      </div>
    </div>
  );
};
