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
    console.log('\n📊 === METRICS CALCULATION START ===');
    
    // Input data logging
    console.log('\n📥 Input Data:');
    console.log(`  Prices:
    - Current: ${prices.current.toFixed(4)}
    - 24h ago: ${prices.twentyFourHoursAgo.toFixed(4)}
    - 7d ago:  ${prices.sevenDaysAgo.toFixed(4)}`);
    console.log(`  Trends:
    - Current: ${trends.current}
    - 24h ago: ${trends.twentyFourHoursAgo}
    - 7d ago:  ${trends.sevenDaysAgo}
    - History: ${trends.history.length} points`);
    console.log(`  Market Volume: $${(marketVolume / 1000000).toFixed(2)}M`);
    console.log(`  MRI (category): ${mri}`);

    // SVC (Search Volume Change) - Dual Window
    console.log('\n🔍 Calculating SVC (Search Volume Change):');
    const SVC_24h = (trends.current - trends.twentyFourHoursAgo) / (trends.twentyFourHoursAgo || 1);
    const SVC_7d = (trends.current - trends.sevenDaysAgo) / (trends.sevenDaysAgo || 1);
    const SVC = (SVC_24h * 0.6) + (SVC_7d * 0.4);
    console.log(`  SVC_24h = (${trends.current} - ${trends.twentyFourHoursAgo}) / ${trends.twentyFourHoursAgo || 1} = ${SVC_24h.toFixed(3)}`);
    console.log(`  SVC_7d  = (${trends.current} - ${trends.sevenDaysAgo}) / ${trends.sevenDaysAgo || 1} = ${SVC_7d.toFixed(3)}`);
    console.log(`  SVC     = (${SVC_24h.toFixed(3)} × 0.6) + (${SVC_7d.toFixed(3)} × 0.4) = ${SVC.toFixed(3)}`);

    // PM (Price Movement)
    console.log('\n💰 Calculating PM (Price Movement):');
    let PM: number;
    if (prices.sevenDaysAgo === 0) {
      PM = prices.current > 0 ? prices.current : 0;
      console.log(`  7d price was 0, using current price: ${PM.toFixed(4)}`);
    } else {
      PM = Math.abs(prices.current - prices.sevenDaysAgo) / prices.sevenDaysAgo;
      console.log(`  PM = |${prices.current.toFixed(4)} - ${prices.sevenDaysAgo.toFixed(4)}| / ${prices.sevenDaysAgo.toFixed(4)} = ${PM.toFixed(4)}`);
    }

    // VS (Velocity Score)
    console.log('\n⚡ Calculating VS (Velocity Score):');
    const priceDelta = Math.abs(prices.current - prices.sevenDaysAgo);
    console.log(`  Price delta (7d) = |${prices.current.toFixed(4)} - ${prices.sevenDaysAgo.toFixed(4)}| = ${priceDelta.toFixed(4)}`);
    const VS = priceDelta === 0
      ? 0
      : Math.abs(prices.twentyFourHoursAgo - prices.sevenDaysAgo) / priceDelta;
    if (priceDelta === 0) {
      console.log(`  VS = 0 (no price movement)`);
    } else {
      console.log(`  VS = |${prices.twentyFourHoursAgo.toFixed(4)} - ${prices.sevenDaysAgo.toFixed(4)}| / ${priceDelta.toFixed(4)} = ${VS.toFixed(4)}`);
    }

    // OES (Odds Extremity Score)
    console.log('\n🎯 Calculating OES (Odds Extremity Score):');
    const OES = Math.abs(prices.current - 0.5) * 2;
    console.log(`  OES = |${prices.current.toFixed(4)} - 0.5| × 2 = ${OES.toFixed(4)}`);

    // RW (Recency Weight)
    console.log('\n⏰ Calculating RW (Recency Weight):');
    const allTrendValues = trends.history.map(p => p.v);
    const maxTrend = allTrendValues.length > 0 
      ? Math.max(...allTrendValues)
      : trends.current;
    const threshold = maxTrend * 0.9;
    const RW = trends.current >= threshold ? 1.0 : 0.5;
    console.log(`  Max trend in history: ${maxTrend}`);
    console.log(`  90% threshold: ${threshold.toFixed(1)}`);
    console.log(`  Current (${trends.current}) >= threshold (${threshold.toFixed(1)})? ${trends.current >= threshold ? 'YES' : 'NO'}`);
    console.log(`  RW = ${RW}`);

    const metrics = {
      SVC: this.roundToTwo(SVC),
      PM: this.roundToTwo(PM),
      VS: this.roundToTwo(VS),
      OES: this.roundToTwo(OES),
      RW: this.roundToTwo(RW),
      MRI: this.roundToTwo(mri),
    };

    console.log('\n✅ Final Metrics:');
    console.log(`  SVC: ${metrics.SVC} (Search Volume Change)`);
    console.log(`  PM:  ${metrics.PM} (Price Movement)`);
    console.log(`  VS:  ${metrics.VS} (Velocity Score)`);
    console.log(`  OES: ${metrics.OES} (Odds Extremity Score)`);
    console.log(`  RW:  ${metrics.RW} (Recency Weight)`);
    console.log(`  MRI: ${metrics.MRI} (Mean Reversion Indicator)`);
    console.log('📊 === METRICS CALCULATION END ===\n');

    return metrics;
  }

  calculateScores(metrics: Metrics, marketVolume: number): Scores {
    const { SVC, PM, VS, OES, RW, MRI } = metrics;

    console.log('\n🎲 === SCORES CALCULATION START ===');
    console.log('\n📊 Input Metrics:');
    console.log(`  SVC: ${SVC}, PM: ${PM}, VS: ${VS}, OES: ${OES}, RW: ${RW}, MRI: ${MRI}`);
    console.log(`  Market Volume: $${(marketVolume / 1000000).toFixed(2)}M`);

    // Hype Ratio
    console.log('\n🔥 Calculating Hype Ratio:');
    const numerator = SVC * PM * VS;
    const logVolume = Math.log(marketVolume + 1);
    const oesMultiplier = 1 + OES;
    console.log(`  Step 1: SVC × PM × VS = ${SVC} × ${PM} × ${VS} = ${numerator.toFixed(4)}`);
    console.log(`  Step 2: log(MV + 1) = log(${marketVolume + 1}) = ${logVolume.toFixed(4)}`);
    console.log(`  Step 3: (1 + OES) = (1 + ${OES}) = ${oesMultiplier.toFixed(4)}`);
    console.log(`  Step 4: numerator / logVolume = ${numerator.toFixed(4)} / ${logVolume.toFixed(4)} = ${(numerator / logVolume).toFixed(4)}`);
    console.log(`  Step 5: × (1 + OES) = ${(numerator / logVolume).toFixed(4)} × ${oesMultiplier.toFixed(4)} = ${((numerator / logVolume) * oesMultiplier).toFixed(4)}`);
    const Hype_Ratio = (numerator / logVolume) * oesMultiplier * RW;
    console.log(`  Step 6: × RW = ${((numerator / logVolume) * oesMultiplier).toFixed(4)} × ${RW} = ${Hype_Ratio.toFixed(4)}`);
    console.log(`  Hype_Ratio = ${Hype_Ratio.toFixed(4)}`);

    // Confidence
    console.log('\n🎯 Calculating Confidence:');
    const volumeFactor = marketVolume / 10000;
    const minValue = Math.min(SVC, PM, volumeFactor);
    console.log(`  Volume factor: MV / 10000 = ${marketVolume} / 10000 = ${volumeFactor.toFixed(2)}`);
    console.log(`  min(SVC, PM, Vol) = min(${SVC}, ${PM}, ${volumeFactor.toFixed(2)}) = ${minValue.toFixed(4)}`);
    const Confidence = minValue * RW;
    console.log(`  Confidence = ${minValue.toFixed(4)} × ${RW} = ${Confidence.toFixed(4)}`);

    // Trade Score
    console.log('\n⭐ Calculating Trade Score:');
    const Trade_Score = Hype_Ratio * MRI * Confidence;
    console.log(`  Trade_Score = Hype_Ratio × MRI × Confidence`);
    console.log(`  Trade_Score = ${Hype_Ratio.toFixed(4)} × ${MRI} × ${Confidence.toFixed(4)}`);
    console.log(`  Trade_Score = ${Trade_Score.toFixed(4)}`);

    // Determine signal
    const signal = this.getSignal(Trade_Score);
    console.log(`\n🚦 Signal: ${signal}`);

    const scores = {
      tradeScore: this.roundToTwo(Trade_Score),
      hyeRatio: this.roundToTwo(Hype_Ratio),
      confidence: this.roundToTwo(Confidence),
      signal,
    };

    console.log('\n✅ Final Scores:');
    console.log(`  Trade Score: ${scores.tradeScore}`);
    console.log(`  Hype Ratio:  ${scores.hyeRatio}`);
    console.log(`  Confidence:  ${scores.confidence}`);
    console.log(`  Signal:      ${scores.signal}`);
    console.log('🎲 === SCORES CALCULATION END ===\n');

    return scores;
  }

  generateRecommendation(
    tradeScore: number,
    currentPrice: number,
    metrics?: Metrics
  ): Recommendation {
    const pricePercent = (currentPrice * 100).toFixed(0);

    // Calculate expected return based on multiple factors
    const { expectedReturn, reversionPercent } = this.calculateExpectedReturn(
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
