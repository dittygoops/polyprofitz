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
  SVC: number;
  PM: number;
  VS: number;
  OES: number;
  RW: number;
  MRI: number;
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

export interface AnalysisData {
  market: MarketData;
  trends: TrendsData;
  outcomes: OutcomeAnalysis[];
  volume: number;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisData;
  error?: string;
  details?: any;
}
