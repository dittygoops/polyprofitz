import React from 'react';
import { OutcomeAnalysis } from '../types';
import { MetricsCard } from './MetricsCard';
import { PriceChart } from './PriceChart';

interface OutcomeCardProps {
  outcome: OutcomeAnalysis;
  trendsSearchQuery: string;
}

export const OutcomeCard: React.FC<OutcomeCardProps> = ({ outcome, trendsSearchQuery }) => {
  const getSignalColor = (signal: string) => {
    if (signal.includes('STRONG')) return 'bg-red-100 text-red-800 border-red-300';
    if (signal.includes('MODERATE')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (signal.includes('WEAK')) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getSVCTrend = () => {
    if (outcome.metrics.SVC > 0.5) return 'up';
    if (outcome.metrics.SVC < -0.5) return 'down';
    return 'neutral';
  };

  const getPMTrend = () => {
    return outcome.prices.current > outcome.prices.sevenDaysAgo ? 'up' : 'down';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      {/* Outcome Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{outcome.outcome}</h3>
        <div className={`px-4 py-2 rounded-full border-2 font-bold ${getSignalColor(outcome.scores.signal)}`}>
          {outcome.scores.signal}
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-1">Current Price</p>
        <p className="text-3xl font-bold text-gray-900">{(outcome.prices.current * 100).toFixed(1)}%</p>
      </div>

      {/* Trade Recommendation */}
      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
        <p className="text-lg font-bold text-blue-600 mb-2">{outcome.recommendation.action}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Target:</span>
            <p className="font-semibold">{outcome.recommendation.targetExit}</p>
          </div>
          <div>
            <span className="text-gray-600">Expected Return:</span>
            <p className="font-semibold text-green-600">{outcome.recommendation.expectedReturn}</p>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Scores</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">Trade Score</p>
            <p className="text-lg font-bold">{outcome.scores.tradeScore.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">Hype Ratio</p>
            <p className="text-lg font-bold">{outcome.scores.hyeRatio.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">Confidence</p>
            <p className="text-lg font-bold">{outcome.scores.confidence.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Key Metrics</h4>
        <div className="grid grid-cols-2 gap-2">
          <MetricsCard
            label="Search Volume Change"
            value={`${(outcome.metrics.SVC * 100).toFixed(0)}%`}
            description="Google Trends (7d)"
            trend={getSVCTrend()}
          />
          <MetricsCard
            label="Price Movement"
            value={`${(outcome.metrics.PM * 100).toFixed(0)}%`}
            description="Price change (7d)"
            trend={getPMTrend()}
          />
        </div>
      </div>

      {/* Price Chart */}
      <PriceChart data={outcome.priceHistory} title={`${outcome.outcome} - Price History`} />
    </div>
  );
};
