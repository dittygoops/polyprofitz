import Anthropic from '@anthropic-ai/sdk';
import googleTrends from 'google-trends-api';
import { PolymarketClient } from '../api/polymarket';
import { Event, PricePoint } from '../types/polymarket';
import {
  MarketAnalysis,
  MarketCategory,
  GoogleTrendsData,
  PriceData,
  MetricsCalculation
} from '../types/market-analysis';

/**
 * Market Analysis Service
 * Implements the sentiment fade trading strategy
 */
export class MarketAnalysisService {
  private polymarketClient: PolymarketClient;
  private anthropicClient: Anthropic;

  // Mean Reversion Indicator mapping by category
  private static readonly MRI_MAP: Record<MarketCategory, number> = {
    politics: 0.8,
    sports: 0.6,
    crypto: 0.9,
    entertainment: 0.7,
    other: 0.7
  };

  constructor() {
    this.polymarketClient = new PolymarketClient();
    this.anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Main analysis function
   */
  async analyzeMarket(userQuery: string): Promise<MarketAnalysis> {
    console.log(`[MarketAnalysis] Starting analysis for query: "${userQuery}"`);
    
    // 1. Find matching event
    const event = await this.polymarketClient.findClosestEvent(userQuery, {
      closed: false
    });

    if (!event) {
      throw new Error('No matching market found for your query');
    }

    console.log(`[MarketAnalysis] Found event: ${event.title}`);

    const market = event.markets?.[0];
    if (!market) {
      throw new Error('Event has no markets');
    }

    // 2. Get YES token
    const yesToken = market.tokens?.find((t: any) => t.outcome === 'Yes');
    if (!yesToken) {
      throw new Error('No YES token found for this market');
    }

    // 3. Get price history (7 days)
    console.log(`[MarketAnalysis] Fetching price history for token: ${yesToken.token_id}`);
    const priceData = await this.getPriceData(yesToken.token_id, event);

    // 4. Extract category from tags
    const category = this.getMarketCategory(event);
    const mri = MarketAnalysisService.MRI_MAP[category];
    console.log(`[MarketAnalysis] Market category: ${category}, MRI: ${mri}`);

    // 5. Get search query using Claude
    console.log(`[MarketAnalysis] Extracting search query using Claude...`);
    const searchQuery = await this.extractSearchQuery(market.question);
    console.log(`[MarketAnalysis] Search query: "${searchQuery}"`);

    // 6. Get Google Trends data
    console.log(`[MarketAnalysis] Fetching Google Trends data...`);
    const trendsData = await this.getGoogleTrends(searchQuery);
    console.log(`[MarketAnalysis] Trends - Current: ${trendsData.current}, 7d ago: ${trendsData.sevenDaysAgo}`);

    // 7. Calculate all metrics
    const metrics = this.calculateMetrics(priceData, trendsData, mri);

    // 8. Generate signal and recommendation
    const signal = this.getSignal(metrics.tradeScore);
    const recommendation = this.generateRecommendation(priceData.current, metrics.tradeScore);

    // 9. Build response
    return {
      market: {
        title: event.title || 'Unknown',
        question: market.question,
        slug: market.market_slug,
        category,
        eventSlug: event.slug || ''
      },
      scores: {
        tradeScore: metrics.tradeScore,
        hypeRatio: metrics.hypeRatio,
        confidence: metrics.confidence,
        signal
      },
      metrics: {
        svc: metrics.svc,
        pm: metrics.pm,
        vs: metrics.vs,
        oes: metrics.oes,
        rw: metrics.rw,
        mri: metrics.mri
      },
      prices: {
        current: priceData.current,
        sevenDaysAgo: priceData.sevenDaysAgo,
        twentyFourHoursAgo: priceData.twentyFourHoursAgo
      },
      trends: {
        current: trendsData.current,
        sevenDaysAgo: trendsData.sevenDaysAgo,
        searchQuery
      },
      recommendation,
      volume: priceData.volume
    };
  }

  /**
   * Extract price data from price history
   */
  private async getPriceData(tokenId: string, event: Event): Promise<PriceData> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const priceHistory = await this.polymarketClient.getPriceHistory(
      tokenId,
      startDate,
      endDate,
      60  // hourly data
    );

    if (!priceHistory || priceHistory.length === 0) {
      throw new Error('No price history available for this market');
    }

    // Parse prices (they come as strings)
    const parsePrice = (point: PricePoint) => parseFloat(point.p);
    
    const current = parsePrice(priceHistory[priceHistory.length - 1]);
    const sevenDaysAgo = parsePrice(priceHistory[0]);

    // Get 24h ago price (approximately 24 data points back if hourly)
    let twentyFourHoursAgo: number;
    if (priceHistory.length >= 24) {
      twentyFourHoursAgo = parsePrice(priceHistory[priceHistory.length - 24]);
    } else {
      twentyFourHoursAgo = current;
    }

    // Calculate volume if available, otherwise use market volume from event
    let volume = priceHistory.reduce((sum, point) => sum + (point.v || 0), 0);
    
    // If no volume from price history, try to get it from event
    if (volume === 0 && event.volume) {
      volume = event.volume;
    }
    
    // If still no volume, use a reasonable default to avoid division by zero
    if (volume === 0) {
      volume = 10000; // Default volume for calculation purposes
      console.warn('[MarketAnalysis] No volume data available, using default');
    }

    return {
      current,
      sevenDaysAgo,
      twentyFourHoursAgo,
      volume
    };
  }

  /**
   * Extract market category from event tags
   */
  private getMarketCategory(event: Event): MarketCategory {
    const tags = event.tags || [];

    for (const tag of tags) {
      const label = tag.label?.toLowerCase() || '';

      if (label.includes('polit') || label.includes('elect')) return 'politics';
      if (label.includes('sport') || label.includes('nba') || 
          label.includes('nfl') || label.includes('soccer')) return 'sports';
      if (label.includes('crypto') || label.includes('bitcoin') || 
          label.includes('eth')) return 'crypto';
      if (label.includes('entertain') || label.includes('celebrity') || 
          label.includes('pop')) return 'entertainment';
    }

    return 'other';
  }

  /**
   * Use Claude to extract Google search query from market question
   */
  private async extractSearchQuery(marketQuestion: string): Promise<string> {
    try {
      const message = await this.anthropicClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Extract the most relevant 2-4 word Google search query from this prediction market title: '${marketQuestion}'. Return only the search query, no explanation.`
        }]
      });

      const textContent = message.content.find(c => c.type === 'text');
      return (textContent as any)?.text?.trim() || marketQuestion;
    } catch (error) {
      console.warn('Failed to extract search query with Claude, using market question:', error);
      // Fallback: use first few words of market question
      return marketQuestion.split(' ').slice(0, 4).join(' ');
    }
  }

  /**
   * Fetch Google Trends data
   */
  private async getGoogleTrends(keyword: string): Promise<GoogleTrendsData> {
    try {
      const result = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        granularTimeResolution: true
      });

      const data = JSON.parse(result);
      const timelineData = data.default?.timelineData || [];

      if (timelineData.length === 0) {
        return { current: 0, sevenDaysAgo: 0 };
      }

      const current = timelineData[timelineData.length - 1]?.value?.[0] || 0;
      const sevenDaysAgo = timelineData[0]?.value?.[0] || 0;

      return {
        current,
        sevenDaysAgo,
        allData: timelineData.map((t: any) => ({
          time: new Date(t.time * 1000),
          value: t.value?.[0] || 0
        }))
      };
    } catch (error) {
      console.warn('Failed to fetch Google Trends data:', error);
      // Return zeros if Google Trends fails
      return { current: 0, sevenDaysAgo: 0 };
    }
  }

  /**
   * Calculate all metrics for the strategy
   */
  private calculateMetrics(
    priceData: PriceData,
    trendsData: GoogleTrendsData,
    mri: number
  ): MetricsCalculation {
    // Search Volume Change
    const svc = trendsData.sevenDaysAgo === 0 
      ? 0 
      : (trendsData.current - trendsData.sevenDaysAgo) / trendsData.sevenDaysAgo;

    // Price Movement
    const pm = priceData.sevenDaysAgo === 0
      ? 0
      : Math.abs(priceData.current - priceData.sevenDaysAgo) / priceData.sevenDaysAgo;

    // Velocity Score
    const priceDiff = Math.abs(priceData.current - priceData.sevenDaysAgo);
    const vs = priceDiff === 0
      ? 0
      : Math.abs(priceData.twentyFourHoursAgo - priceData.sevenDaysAgo) / priceDiff;

    // Odds Extremity Score
    const oes = Math.abs(priceData.current - 0.50) * 2;

    // Recency Weight
    const maxTrend = Math.max(trendsData.current, trendsData.sevenDaysAgo);
    const rw = trendsData.current >= maxTrend * 0.9 ? 1.0 : 0.5;

    // Hype Ratio
    const volumeFactor = Math.log(priceData.volume + 1) || 1;
    const hypeRatio = (svc * pm * vs) / volumeFactor * (1 + oes) * rw;

    // Confidence
    const confidence = Math.min(svc, pm, priceData.volume / 10000) * rw;

    // Trade Score
    const tradeScore = hypeRatio * mri * confidence;

    return {
      svc,
      pm,
      vs,
      oes,
      rw,
      mri,
      hypeRatio,
      confidence,
      tradeScore
    };
  }

  /**
   * Determine signal strength from trade score
   */
  private getSignal(tradeScore: number): string {
    if (tradeScore >= 0.50) return 'STRONG BUY 🔥';
    if (tradeScore >= 0.15) return 'MODERATE ⚠️';
    if (tradeScore >= 0.05) return 'WEAK 💤';
    return 'SKIP 🚫';
  }

  /**
   * Generate trading recommendation
   */
  private generateRecommendation(
    currentPrice: number,
    tradeScore: number
  ): { action: string; targetExit: string; expectedReturn: string } {
    const pricePercent = (currentPrice * 100).toFixed(0);
    const expectedReturn = ((1 - currentPrice) / currentPrice * 0.5 * 100).toFixed(0);

    let holdDays = '3-5';
    if (tradeScore >= 0.50) {
      holdDays = '2-4';
    } else if (tradeScore < 0.15) {
      holdDays = '5-7';
    }

    return {
      action: `BUY NO at ${pricePercent}%`,
      targetExit: `Price reverts 50% in ${holdDays} days`,
      expectedReturn: `${expectedReturn}% return`
    };
  }
}

