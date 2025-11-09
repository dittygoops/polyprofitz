/**
 * Type definitions for Market Analysis and Trading Strategy
 */

export interface MarketAnalysis {
  market: {
    title: string;
    question: string;
    slug: string;
    category: string;
    eventSlug: string;
  };
  scores: {
    tradeScore: number;
    hypeRatio: number;
    confidence: number;
    signal: string;
  };
  metrics: {
    svc: number;        // Search Volume Change
    pm: number;         // Price Movement
    vs: number;         // Velocity Score
    oes: number;        // Odds Extremity Score
    rw: number;         // Recency Weight
    mri: number;        // Mean Reversion Indicator
  };
  prices: {
    current: number;
    sevenDaysAgo: number;
    twentyFourHoursAgo: number;
  };
  trends: {
    current: number;
    sevenDaysAgo: number;
    searchQuery: string;
  };
  recommendation: {
    action: string;      // "BUY NO at 85%"
    targetExit: string;  // "Price reverts 50% in 3-5 days"
    expectedReturn: string; // "41% return"
  };
  volume: number;
}

export interface GoogleTrendsData {
  current: number;
  sevenDaysAgo: number;
  peakTime?: Date;
  allData?: Array<{ time: Date; value: number }>;
}

export interface PriceData {
  current: number;
  sevenDaysAgo: number;
  twentyFourHoursAgo: number;
  volume: number;
}

export type MarketCategory = 'politics' | 'sports' | 'crypto' | 'entertainment' | 'other';

export interface MetricsCalculation {
  svc: number;
  pm: number;
  vs: number;
  oes: number;
  rw: number;
  mri: number;
  hypeRatio: number;
  confidence: number;
  tradeScore: number;
}

export interface AnalysisRequest {
  query: string;
}

export interface AnalysisError {
  error: string;
  message: string;
}

