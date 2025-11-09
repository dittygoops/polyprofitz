import React from 'react';
import { AnalysisData } from '../types';
import { OutcomeCard } from './OutcomeCard';
import { TrendsChart } from './TrendsChart';

interface AnalysisResultsProps {
  data: AnalysisData;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data }) => {
  const { market, trends, outcomes } = data;

  // Find the outcome with the highest trade score
  const bestOutcome = outcomes.reduce((best, current) =>
    current.scores.tradeScore > best.scores.tradeScore ? current : best
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Market Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{market.question}</h1>
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
            {market.category}
          </span>
          <span className="text-gray-600">
            Volume: <strong>${(data.volume / 1000000).toFixed(2)}M</strong>
          </span>
          <span className="text-gray-600">
            Found <strong>{outcomes.length}</strong> outcome{outcomes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Best Outcome Highlight */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-lg p-6 border-2 border-yellow-300">
        <h2 className="text-xl font-bold text-gray-900 mb-2">🏆 Best Trading Opportunity</h2>
        <p className="text-lg">
          <strong>{bestOutcome.outcome}</strong> - {bestOutcome.scores.signal}
        </p>
        <p className="text-sm text-gray-700 mt-1">
          Trade Score: {bestOutcome.scores.tradeScore.toFixed(2)} | {bestOutcome.recommendation.action}
        </p>
      </div>

      {/* Google Trends Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Market Sentiment (Google Trends)</h2>
        <TrendsChart data={[]} searchQuery={trends.searchQuery} />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Interest</p>
            <p className="text-2xl font-bold text-gray-900">{trends.current}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">7 Days Ago</p>
            <p className="text-2xl font-bold text-gray-900">{trends.sevenDaysAgo}</p>
          </div>
        </div>
      </div>

      {/* All Outcomes */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Outcomes Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {outcomes.map((outcome, index) => (
            <OutcomeCard key={index} outcome={outcome} trendsSearchQuery={trends.searchQuery} />
          ))}
        </div>
      </div>

      {/* Philosophy */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h3 className="font-bold text-yellow-900 mb-2">Trading Philosophy</h3>
        <p className="text-sm text-yellow-800">
          We're not predicting outcomes. We're arbitraging emotional overreactions by trading volatility
          caused by viral hype spikes. Buy when public panics in, sell when they calm down.
        </p>
      </div>
    </div>
  );
};
