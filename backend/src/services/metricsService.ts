import { Metrics, Scores, Recommendation } from '../types/analysis';

export interface PriceInput {
  current: number;
  sevenDaysAgo: number;
  twentyFourHoursAgo: number;
}

export interface TrendsInput {
  current: number;
  sevenDaysAgo: number;
}

export class MetricsService {
  calculateMetrics(
    prices: PriceInput,
    trends: TrendsInput,
    marketVolume: number,
    mri: number
  ): Metrics {
    // SVC (Search Volume Change)
    const SVC = trends.sevenDaysAgo === 0
      ? 0
      : (trends.current - trends.sevenDaysAgo) / trends.sevenDaysAgo;

    // PM (Price Movement)
    const PM = prices.sevenDaysAgo === 0
      ? 0
      : Math.abs(prices.current - prices.sevenDaysAgo) / prices.sevenDaysAgo;

    // VS (Velocity Score)
    const priceDelta = Math.abs(prices.current - prices.sevenDaysAgo);
    const VS = priceDelta === 0
      ? 0
      : Math.abs(prices.twentyFourHoursAgo - prices.sevenDaysAgo) / priceDelta;

    // OES (Odds Extremity Score)
    const OES = Math.abs(prices.current - 0.5) * 2;

    // RW (Recency Weight)
    // If trend peaked in last 24h (current >= 90% of max)
    const maxTrend = Math.max(trends.current, trends.sevenDaysAgo);
    const RW = trends.current >= maxTrend * 0.9 ? 1.0 : 0.5;

    // MRI (Mean Reversion Indicator) - passed in from category

    return {
      SVC: this.roundToTwo(SVC),
      PM: this.roundToTwo(PM),
      VS: this.roundToTwo(VS),
      OES: this.roundToTwo(OES),
      RW: this.roundToTwo(RW),
      MRI: this.roundToTwo(mri),
    };
  }

  calculateScores(metrics: Metrics, marketVolume: number): Scores {
    const { SVC, PM, VS, OES, RW, MRI } = metrics;

    // Hype Ratio
    const Hype_Ratio =
      (SVC * PM * VS) / Math.log(marketVolume + 1) * (1 + OES) * RW;

    // Confidence
    const Confidence = Math.min(SVC, PM, marketVolume / 10000) * RW;

    // Trade Score
    const Trade_Score = Hype_Ratio * MRI * Confidence;

    // Determine signal
    const signal = this.getSignal(Trade_Score);

    return {
      tradeScore: this.roundToTwo(Trade_Score),
      hyeRatio: this.roundToTwo(Hype_Ratio),
      confidence: this.roundToTwo(Confidence),
      signal,
    };
  }

  generateRecommendation(
    tradeScore: number,
    currentPrice: number
  ): Recommendation {
    const pricePercent = (currentPrice * 100).toFixed(0);

    // Calculate expected return (simplified)
    const targetPrice = currentPrice > 0.5
      ? currentPrice * 0.5  // Expect 50% reversion if overvalued
      : currentPrice * 1.5; // Expect 50% increase if undervalued

    const expectedReturn = Math.abs((targetPrice - currentPrice) / currentPrice * 100).toFixed(0);

    let action: string;
    let targetExit: string;

    if (tradeScore >= 0.5) {
      // Strong fade signal
      action = currentPrice > 0.5
        ? `BUY NO at ${pricePercent}%`
        : `BUY YES at ${pricePercent}%`;
      targetExit = 'Price reverts 50% in 2-5 days';
    } else if (tradeScore >= 0.15) {
      action = currentPrice > 0.5
        ? `CONSIDER NO at ${pricePercent}%`
        : `CONSIDER YES at ${pricePercent}%`;
      targetExit = 'Price reverts 30% in 3-7 days';
    } else {
      action = 'SKIP - Insufficient signal';
      targetExit = 'Wait for stronger setup';
    }

    return {
      action,
      targetExit,
      expectedReturn: `${expectedReturn}% return`,
    };
  }

  private getSignal(tradeScore: number): string {
    if (tradeScore >= 0.50) return 'STRONG BUY 🔥';
    if (tradeScore >= 0.15) return 'MODERATE ⚠️';
    if (tradeScore >= 0.05) return 'WEAK 💤';
    return 'SKIP 🚫';
  }

  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }
}
