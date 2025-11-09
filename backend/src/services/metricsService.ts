import { Metrics, Scores, Recommendation } from '../types/analysis';
import { VolumeMetrics } from './trendsService';

export interface PriceInput {
  current: number;
  sevenDaysAgo: number;
  twentyFourHoursAgo: number;
}

export class MetricsService {
  calculateMetrics(
    prices: PriceInput,
    volumeMetrics: VolumeMetrics,
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
    console.log(`  Volume:
    - VC (combined): ${(volumeMetrics.vc * 100).toFixed(1)}%
    - VC_24h: ${(volumeMetrics.vc_24h * 100).toFixed(1)}%
    - VC_7d: ${(volumeMetrics.vc_7d * 100).toFixed(1)}%
    - RW (from volume): ${volumeMetrics.rw}`);
    console.log(`  Market Volume: $${(marketVolume / 1000000).toFixed(2)}M`);
    console.log(`  MRI (category): ${mri}`);

    // VC (Volume Change) - Already calculated in volumeMetrics
    console.log('\n🔥 Volume Change (VC):');
    const VC = volumeMetrics.vc;
    console.log(`  VC = ${(VC * 100).toFixed(1)}% (volume spike indicator)`);
    console.log(`  Interpretation: ${VC > 2.0 ? '🔥 STRONG SPIKE!' : VC > 1.0 ? '⚡ MODERATE SPIKE' : VC > 0 ? '↗️ ELEVATED' : VC < 0 ? '↘️ COOLING OFF' : '→ NORMAL'}`);

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

    // RW (Recency Weight) - From volume peak detection
    console.log('\n⏰ Recency Weight (RW):');
    const RW = volumeMetrics.rw;
    console.log(`  RW = ${RW} (from volume peak detection)`);
    console.log(`  Interpretation: ${RW === 1.0 ? '🔝 Volume at PEAK (prime fade time)' : '⚠️ Volume elevated but not at peak'}`);

    const metrics = {
      vc: this.roundToTwo(VC),             // Volume Change (replaces SVC)
      vc_24h: this.roundToTwo(volumeMetrics.vc_24h),  // NEW
      vc_7d: this.roundToTwo(volumeMetrics.vc_7d),    // NEW
      pm: this.roundToTwo(PM),
      vs: this.roundToTwo(VS),
      oes: this.roundToTwo(OES),
      rw: this.roundToTwo(RW),
      mri: this.roundToTwo(mri),
    };

    console.log('\n✅ Final Metrics:');
    console.log(`  VC:  ${metrics.vc} (Volume Change - replaces SVC)`);
    console.log(`  PM:  ${metrics.pm} (Price Movement)`);
    console.log(`  VS:  ${metrics.vs} (Velocity Score)`);
    console.log(`  OES: ${metrics.oes} (Odds Extremity Score)`);
    console.log(`  RW:  ${metrics.rw} (Recency Weight)`);
    console.log(`  MRI: ${metrics.mri} (Mean Reversion Indicator)`);
    console.log('📊 === METRICS CALCULATION END ===\n');

    return metrics;
  }

  calculateScores(metrics: Metrics, marketVolume: number, prices?: { current: number }): Scores {
    const { vc, pm, vs, oes, rw, mri } = metrics;

    console.log('\n🎲 === SCORES CALCULATION START ===');
    console.log('\n📊 Input Metrics:');
    console.log(`  VC: ${vc}, PM: ${pm}, VS: ${vs}, OES: ${oes}, RW: ${rw}, MRI: ${mri}`);
    console.log(`  Market Volume: $${(marketVolume / 1000000).toFixed(2)}M`);

    // SIMPLIFIED HYPE FORMULA - much more forgiving!
    console.log('\n🔥 Calculating Hype Ratio (Simplified):');
    
    // Use baseline + actual values so nothing kills the signal
    const vcComponent = 0.5 + (vc * 2);  // Baseline 0.5, VC adds up to 2x boost
    const pmComponent = pm * 10;          // Price movement is primary driver
    const vsComponent = 0.3 + (vs * 0.7); // Baseline 0.3, VS can boost to 1.0
    
    console.log(`  VC component: 0.5 + (${vc} × 2) = ${vcComponent.toFixed(4)}`);
    console.log(`  PM component: ${pm} × 10 = ${pmComponent.toFixed(4)}`);
    console.log(`  VS component: 0.3 + (${vs} × 0.7) = ${vsComponent.toFixed(4)}`);
    
    const baseScore = vcComponent * pmComponent * vsComponent;
    const oesBoost = 1 + (oes * 0.5);  // OES adds up to 50% boost
    const rwBoost = rw;
    
    console.log(`  Base score: ${vcComponent.toFixed(4)} × ${pmComponent.toFixed(4)} × ${vsComponent.toFixed(4)} = ${baseScore.toFixed(4)}`);
    console.log(`  OES boost: 1 + (${oes} × 0.5) = ${oesBoost.toFixed(4)}`);
    console.log(`  RW boost: ${rwBoost}`);
    
    const Hype_Ratio = baseScore * oesBoost * rwBoost;
    console.log(`  Hype_Ratio = ${baseScore.toFixed(4)} × ${oesBoost.toFixed(4)} × ${rwBoost} = ${Hype_Ratio.toFixed(4)}`);

    // SIMPLIFIED CONFIDENCE - based on price movement strength
    console.log('\n🎯 Calculating Confidence:');
    const Confidence = (pm * 5) + 0.5;  // PM drives it, plus baseline of 0.5
    console.log(`  Confidence = (${pm} × 5) + 0.5 = ${Confidence.toFixed(4)}`);

    // TRADE SCORE - simpler multiplication
    console.log('\n⭐ Calculating Trade Score:');
    const Trade_Score = (Hype_Ratio * Confidence * mri) / 10;  // Divide by 10 to normalize
    console.log(`  Trade_Score = (${Hype_Ratio.toFixed(4)} × ${Confidence.toFixed(4)} × ${mri}) / 10`);
    console.log(`  Trade_Score = ${Trade_Score.toFixed(4)}`);

    // Determine signal - can only FADE UP (buy underpriced), not fade down (can't short)
    let signal: string;
    
    if (prices && Trade_Score >= 0.05) {
      if (prices.current < 0.5) {
        // Price is LOW and hyped down → We CAN fade UP by buying
        const baseSignal = this.getSignal(Trade_Score);
        signal = `${baseSignal} FADE ↑ (Buy to push toward 50%)`;
      } else {
        // Price is HIGH and hyped up → We CANNOT fade DOWN (can't short)
        signal = 'SKIP 🚫 (Price too high to fade, can\'t short)';
      }
    } else {
      signal = this.getSignal(Trade_Score);
    }
    
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

    // FADE STRATEGY: We can only FADE UP (buy underpriced), NOT fade down (can't short)
    // Only tradeable when price is LOW (<50%) and we want to buy it UP toward 50%
    
    if (currentPrice >= 0.5) {
      // Price is HIGH - we would need to SHORT to fade, but we can't
      action = `SKIP - Price too high (${pricePercent}%), can't fade down (no shorting)`;
      targetExit = 'Wait for price to dump below 50%, or find undervalued outcome';
    } else if (tradeScore >= 0.5) {
      // Strong fade UP signal - price is LOW, buy it toward 50%
      action = `FADE UP: BUY at ${pricePercent}% (hyped down, buy toward 50%)`;
      targetExit = `Price reverts UP ${reversionPercent}% toward 50% in 2-5 days`;
    } else if (tradeScore >= 0.15) {
      // Moderate fade UP signal
      action = `CONSIDER: Buy at ${pricePercent}% (moderate undervalue signal)`;
      targetExit = `Price reverts UP ${reversionPercent}% toward 50% in 3-7 days`;
    } else {
      action = 'SKIP - Insufficient signal strength';
      targetExit = 'Wait for stronger volume spike + price movement';
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
      const { vc, pm, oes } = metrics;
      
      // Higher volume change = stronger reversion potential
      if (vc > 0.5) {
        scoreMultiplier *= 1.1;
      }
      
      // Higher price movement = more volatile, expect more reversion
      if (pm > 0.3) {
        baseReversionPercent *= 1.1;
      }
      
      // More extreme odds = more room to revert
      baseReversionPercent *= (1 + oes * 0.2);
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
