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
    svc: number;
    pm: number;
    vs: number;
    oes: number;
    rw: number;
    mri: number;
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
    action: string;
    targetExit: string;
    expectedReturn: string;
  };
  volume: number;
}

