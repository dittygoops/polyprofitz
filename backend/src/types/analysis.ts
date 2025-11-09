export interface AnalysisRequest {
  query: string;
}

export interface MarketData {
  id: string;
  question: string;
  slug: string;
  category: string;
  currentPrice: number;
  volume: number;
  title: string;
}

export interface PriceData {
  current: number;
  sevenDaysAgo: number;
  twentyFourHoursAgo: number;
}

export interface TrendsData {
  current: number;
  sevenDaysAgo: number;
  searchQuery: string;
}

export interface Metrics {
  SVC: number;  // Search Volume Change
  PM: number;   // Price Movement
  VS: number;   // Velocity Score
  OES: number;  // Odds Extremity Score
  RW: number;   // Recency Weight
  MRI: number;  // Mean Reversion Indicator
}

export interface Scores {
  tradeScore: number;
  hyeRatio: number;
  confidence: number;
  signal: string;
}

export interface Recommendation {
  action: string;
  targetExit: string;
  expectedReturn: string;
}

export interface PricePoint {
  t: number;
  p: number;
}

export interface TrendsPoint {
  t: number;
  v: number;
}

export interface OutcomeAnalysis {
  outcome: string;
  scores: Scores;
  metrics: Metrics;
  prices: PriceData;
  recommendation: Recommendation;
  priceHistory: PricePoint[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    market: MarketData;
    trends: TrendsData;
    outcomes: OutcomeAnalysis[];  // Array of analyses, one per outcome
    volume: number;
  };
  error?: string;
  details?: any;
}
