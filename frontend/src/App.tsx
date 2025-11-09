import { useState } from 'react';
import axios from 'axios';
import { MarketAnalysis } from './types';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await axios.post<MarketAnalysis>('/api/analyze', { query });
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while analyzing the market');
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value: number) => (value * 100).toFixed(2) + '%';
  const formatNumber = (value: number) => value.toFixed(4);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Polymarket Sentiment Fade Strategy
          </h1>
          <p className="text-xl text-blue-200">
            Identify mispriced markets driven by viral hype spikes
          </p>
          <p className="text-sm text-blue-300 mt-2">
            Buy against public sentiment when hype peaks, sell when sentiment normalizes
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter market query (e.g., 'Trump election 2024')"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>

          {/* Example Queries */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              {['Trump election 2024', 'Bitcoin 100k', 'Fed rate December'].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing market data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Market Info & Signal */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {analysis.market.question}
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {analysis.market.category}
                </span>
                <a
                  href={`https://polymarket.com/event/${analysis.market.eventSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View on Polymarket →
                </a>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{analysis.scores.signal}</div>
                  <div className="text-2xl text-gray-700">
                    Trade Score: {formatNumber(analysis.scores.tradeScore)}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-lg mb-3">📈 Trading Recommendation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry:</span>
                    <span className="font-semibold">{analysis.recommendation.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Exit:</span>
                    <span className="font-semibold">{analysis.recommendation.targetExit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Return:</span>
                    <span className="font-semibold text-green-600">
                      {analysis.recommendation.expectedReturn}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="font-semibold text-lg mb-4">📊 Key Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Google Trends ({analysis.trends.searchQuery})
                  </span>
                  <span className="font-semibold">
                    {analysis.trends.current > analysis.trends.sevenDaysAgo ? '↑' : '↓'}
                    {' '}
                    {(((analysis.trends.current - analysis.trends.sevenDaysAgo) / 
                      (analysis.trends.sevenDaysAgo || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price Movement (7d)</span>
                  <span className="font-semibold">
                    {analysis.prices.current > analysis.prices.sevenDaysAgo ? '↑' : '↓'}
                    {' '}
                    {formatPercent(analysis.metrics.pm)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Velocity Score</span>
                  <span className="font-semibold">{formatNumber(analysis.metrics.vs)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Odds Extremity</span>
                  <span className="font-semibold">{formatNumber(analysis.metrics.oes)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mean Reversion Index</span>
                  <span className="font-semibold">{formatNumber(analysis.metrics.mri)}</span>
                </div>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="font-semibold text-lg mb-4">🔢 Detailed Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Hype Ratio</p>
                  <p className="text-xl font-bold">{formatNumber(analysis.scores.hypeRatio)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-xl font-bold">{formatNumber(analysis.scores.confidence)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="text-xl font-bold">{formatPercent(analysis.prices.current)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">7d Ago Price</p>
                  <p className="text-xl font-bold">{formatPercent(analysis.prices.sevenDaysAgo)}</p>
                </div>
              </div>
            </div>

            {/* Philosophy */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
              <p className="text-sm text-gray-700 italic">
                💡 <strong>Strategy Philosophy:</strong> We're not predicting outcomes. 
                We're arbitraging emotional overreactions by trading volatility caused by 
                viral hype spikes. Buy when public panics in, sell when they calm down.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

