import { Metrics, Scores, Recommendation } from '../types/analysis';

export interface PriceInput {
  current: number;
  sevenDaysAgo: number;
  twentyFourHoursAgo: number;
}

export interface TrendsInput {
  current: number;
  twentyFourHoursAgo: number;
  sevenDaysAgo: number;
  history: Array<{ t: number; v: number }>;
}

export class MetricsService {
  calculateMetrics(
    prices: PriceInput,
    trends: TrendsInput,
    marketVolume: number,
    mri: number
  ): Metrics {
    // SVC (Search Volume Change) - Dual Window
    // Short-term spike (24h) weighted 60%, long-term trend (7d) weighted 40%
    const SVC_24h = (trends.current - trends.twentyFourHoursAgo) / (trends.twentyFourHoursAgo || 1);
    const SVC_7d = (trends.current - trends.sevenDaysAgo) / (trends.sevenDaysAgo || 1);
    const SVC = (SVC_24h * 0.6) + (SVC_7d * 0.4);

    // PM (Price Movement)
    // Handle division by zero: if baseline was 0 but current > 0, use current as 100% move
    let PM: number;
    if (prices.sevenDaysAgo === 0) {
      PM = prices.current > 0 ? prices.current : 0;
    } else {
      PM = Math.abs(prices.current - prices.sevenDaysAgo) / prices.sevenDaysAgo;
    }

    // VS (Velocity Score)
    const priceDelta = Math.abs(prices.current - prices.sevenDaysAgo);
    const VS = priceDelta === 0
      ? 0
      : Math.abs(prices.twentyFourHoursAgo - prices.sevenDaysAgo) / priceDelta;

    // OES (Odds Extremity Score)
    const OES = Math.abs(prices.current - 0.5) * 2;

    // RW (Recency Weight)
    // If current trend is within 90% of max over entire 7-day period, RW = 1.0, else 0.5
    const allTrendValues = trends.history.map(p => p.v);
    const maxTrend = allTrendValues.length > 0 
      ? Math.max(...allTrendValues)
      : trends.current;
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
    currentPrice: number,
    metrics?: Metrics
  ): Recommendation {
    const pricePercent = (currentPrice * 100).toFixed(0);

    // Calculate expected return based on multiple factors
    const { expectedReturn, targetPrice, reversionPercent } = this.calculateExpectedReturn(
      tradeScore,
      currentPrice,
      metrics
    );

    let action: string;
    let targetExit: string;

    if (tradeScore >= 0.5) {
      // Strong fade signal
      action = currentPrice > 0.5
        ? `BUY NO at ${pricePercent}%`
        : `BUY YES at ${pricePercent}%`;
      targetExit = `Price reverts ${reversionPercent}% in 2-5 days`;
    } else if (tradeScore >= 0.15) {
      action = currentPrice > 0.5
        ? `CONSIDER NO at ${pricePercent}%`
        : `CONSIDER YES at ${pricePercent}%`;
      targetExit = `Price reverts ${reversionPercent}% in 3-7 days`;
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

  private calculateExpectedReturn(
    tradeScore: number,
    currentPrice: number,
    metrics?: Metrics
  ): { expectedReturn: number; targetPrice: number; reversionPercent: number } {
    // Calculate price extremity (0 to 1, where 1 is most extreme)
    const priceExtremity = Math.abs(currentPrice - 0.5) * 2;

    // Base reversion percentage: more extreme prices revert more
    // Prices near 0.5 revert less (20-30%), extreme prices revert more (60-80%)
    let baseReversionPercent = 20 + (priceExtremity * 60);

    // Trade score multiplier: stronger signals expect stronger reversion
    // tradeScore 0.5+ → 1.2x multiplier
    // tradeScore 0.15-0.5 → 0.8x multiplier
    // tradeScore < 0.15 → 0.5x multiplier
    let scoreMultiplier = 1.0;
    if (tradeScore >= 0.5) {
      scoreMultiplier = 1.0 + (tradeScore * 0.4); // 1.2 to 1.4x
    } else if (tradeScore >= 0.15) {
      scoreMultiplier = 0.8 + (tradeScore * 0.8); // 0.8 to 1.0x
    } else {
      scoreMultiplier = 0.5 + (tradeScore * 2); // 0.5 to 0.8x
    }

    // Factor in hype ratio if available
    if (metrics) {
      const { SVC, PM, OES } = metrics;
      
      // Higher search volume change = stronger reversion potential
      if (SVC > 0.5) {
        scoreMultiplier *= 1.1;
      }
      
      // Higher price movement = more volatile, expect more reversion
      if (PM > 0.3) {
        baseReversionPercent *= 1.1;
      }
      
      // More extreme odds = more room to revert
      baseReversionPercent *= (1 + OES * 0.2);
    }

    // Calculate final reversion percentage (cap between 15% and 85%)
    const reversionPercent = Math.min(85, Math.max(15, Math.round(baseReversionPercent * scoreMultiplier)));

    // Calculate target price based on reversion toward 0.5
    const distanceFrom50 = currentPrice - 0.5;
    const reversionAmount = distanceFrom50 * (reversionPercent / 100);
    const targetPrice = currentPrice - reversionAmount;

    // Calculate expected return
    const expectedReturn = Math.round(Math.abs((targetPrice - currentPrice) / currentPrice * 100));

    return {
      expectedReturn,
      targetPrice,
      reversionPercent,
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
