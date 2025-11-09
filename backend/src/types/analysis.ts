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

export interface VolumeData {
  current_24h: number;
  total_7d: number;
  avg_per_day: number;
}

export interface Metrics {
  vc: number;      // Volume Change (replaces SVC)
  vc_24h: number;  // 24h volume change component
  vc_7d: number;   // 7d volume change component
  pm: number;      // Price Movement
  vs: number;      // Velocity Score
  oes: number;     // Odds Extremity Score
  rw: number;      // Recency Weight
  mri: number;     // Mean Reversion Indicator
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
  volume: VolumeData;        // NEW: Volume statistics
  recommendation: Recommendation;
  priceHistory: PricePoint[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    market: MarketData;
    outcomes: OutcomeAnalysis[];  // Array of analyses, one per outcome
    volume: number;
  };
  error?: string;
  details?: any;
}
