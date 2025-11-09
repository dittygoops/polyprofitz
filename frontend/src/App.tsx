import { useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AnalysisResults } from './components/AnalysisResults';
import { analyzeMarket } from './services/api';
import { AnalysisData } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const response = await analyzeMarket(query);

      if (response.success && response.data) {
        setAnalysisData(response.data);
      } else {
        setError(response.error || 'An error occurred during analysis');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze market');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            PolyProfitz
          </h1>
          <p className="text-gray-600 mt-1">Sentiment Fade Trading Strategy Analyzer</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="mb-8">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {/* Results */}
        {analysisData && !isLoading && <AnalysisResults data={analysisData} />}

        {/* Empty State */}
        {!isLoading && !analysisData && !error && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to PolyProfitz
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Analyze Polymarket prediction markets to identify mispriced opportunities driven by viral hype spikes.
              Our algorithm detects when public sentiment creates temporary price distortions, providing fade trading signals
              for mean reversion strategies.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-1">Search Markets</h3>
                <p className="text-sm text-gray-600">Enter a topic to find matching Polymarket events</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900 mb-1">Analyze Sentiment</h3>
                <p className="text-sm text-gray-600">Compare Google Trends with price movements</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-semibold text-gray-900 mb-1">Get Signals</h3>
                <p className="text-sm text-gray-600">Receive trade recommendations and expected returns</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            PolyProfitz - Not financial advice. Trade at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
