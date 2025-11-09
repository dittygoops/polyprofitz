import React from 'react';
import { Scores } from '../types';

interface ScoresPanelProps {
  scores: Scores;
}

export const ScoresPanel: React.FC<ScoresPanelProps> = ({ scores }) => {
  const ScoreBar: React.FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 1 }) => {
    const percentage = (value / max) * 100;
    const getColor = () => {
      if (percentage >= 70) return 'bg-red-500';
      if (percentage >= 40) return 'bg-yellow-500';
      return 'bg-blue-500';
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">{value.toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${getColor()} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Scores Overview</h2>

      <ScoreBar label="Trade Score" value={scores.tradeScore} max={1} />
      <ScoreBar label="Hype Ratio" value={scores.hyeRatio} max={1} />
      <ScoreBar label="Confidence" value={scores.confidence} max={1} />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Trade Score:</strong> Overall signal strength (0-1)<br />
          <strong>Hype Ratio:</strong> Sentiment-driven price movement<br />
          <strong>Confidence:</strong> Reliability of the signal
        </p>
      </div>
    </div>
  );
};
