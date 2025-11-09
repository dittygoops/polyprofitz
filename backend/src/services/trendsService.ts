export interface PricePoint {
  t: number;  // timestamp
  p: number;  // price
  v?: number; // volume (optional)
}

export interface VolumeMetrics {
  vc: number;           // Volume Change (combined)
  vc_24h: number;       // 24h volume change
  vc_7d: number;        // 7d volume change
  rw: number;           // Recency Weight (volume peak detection)
  volume_24h: number;   // Last 24h volume
  volume_7d: number;    // Total 7d volume
  avg_per_day: number;  // Average volume per day
}

export class TrendsService {
  /**
   * Calculate volume spike metrics from market-level volume data
   * Uses aggregate volume stats from Polymarket (no auth required)
   */
  calculateVolumeMetrics(volume24hr?: number, volume1wk?: number): VolumeMetrics {
    console.log(`\n📊 Calculating Volume Spike Metrics (from market data)`);

    // Handle edge case: no volume data
    if (!volume24hr || !volume1wk) {
      console.warn(`   ⚠️  No volume data available (24h: ${volume24hr}, 1wk: ${volume1wk})`);
      console.warn(`   Returning zero metrics\n`);
      return {
        vc: 0,
        vc_24h: 0,
        vc_7d: 0,
        rw: 0.5,
        volume_24h: 0,
        volume_7d: 0,
        avg_per_day: 0,
      };
    }

    const volume_7d = volume1wk;
    const volume_24h = volume24hr;
    const volume_prev_6d = volume_7d - volume_24h;
    const avg_per_day = volume_prev_6d / 6;

    console.log(`   Volume (7d): $${volume_7d.toFixed(2)}`);
    console.log(`   Volume (24h): $${volume_24h.toFixed(2)}`);
    console.log(`   Avg per day (prev 6d): $${avg_per_day.toFixed(2)}`);

    // Calculate volume change
    let vc_24h = 0;
    let vc_7d = 0;

    if (avg_per_day > 0) {
      // 24h volume vs 6-day average
      vc_24h = (volume_24h - avg_per_day) / avg_per_day;
      // 7d total vs expected (if it was constant at avg rate)
      const expected_7d_volume = avg_per_day * 7;
      vc_7d = (volume_7d - expected_7d_volume) / expected_7d_volume;
    } else {
      console.log(`   ℹ️  No baseline volume (avg = 0), VC set to 0`);
    }

    // Combined Volume Change (60% recent, 40% trend)
    const vc = (vc_24h * 0.6) + (vc_7d * 0.4);

    console.log(`   VC (24h): ${(vc_24h * 100).toFixed(1)}%`);
    console.log(`   VC (7d): ${(vc_7d * 100).toFixed(1)}%`);
    console.log(`   VC (combined): ${(vc * 100).toFixed(1)}%`);

    // Recency weight: if 24h volume > avg, we're at peak
    const rw = volume_24h > avg_per_day ? 1.0 : 0.5;
    console.log(`   Current volume ${volume_24h > avg_per_day ? '>' : '<='} average? RW = ${rw}`);

    // Interpret the results
    if (vc_24h > 2.0) {
      console.log(`   🔥 STRONG VOLUME SPIKE: 24h volume is ${(vc_24h + 1).toFixed(1)}x average!`);
    } else if (vc_24h > 1.0) {
      console.log(`   ⚡ MODERATE VOLUME SPIKE: 24h volume is ${(vc_24h + 1).toFixed(1)}x average`);
    } else if (vc_24h > 0) {
      console.log(`   ↗️  ELEVATED VOLUME: 24h volume is ${((vc_24h + 1) * 100).toFixed(0)}% of average`);
    } else if (vc_24h < 0) {
      console.log(`   ↘️  COOLING OFF: 24h volume is ${((1 + vc_24h) * 100).toFixed(0)}% of average`);
    } else {
      console.log(`   →  NORMAL VOLUME: No significant change`);
    }

    console.log('');

    return {
      vc,
      vc_24h,
      vc_7d,
      rw,
      volume_24h,
      volume_7d,
      avg_per_day,
    };
  }
}
