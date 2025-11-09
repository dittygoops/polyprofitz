import { Request, Response, NextFunction } from 'express';
import { PolymarketService } from '../services/polymarketService';
import { TrendsService } from '../services/trendsService';
import { MetricsService } from '../services/metricsService';
import { AnalysisResponse, OutcomeAnalysis } from '../types/analysis';

export class AnalysisController {
  private polymarketService: PolymarketService;
  private trendsService: TrendsService;
  private metricsService: MetricsService;

  constructor() {
    this.polymarketService = new PolymarketService();
    this.trendsService = new TrendsService();
    this.metricsService = new MetricsService();
  }

  analyze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query } = req.body;

      // Step 1: Execute CLI tool to fetch market data and save to JSON
      console.log(`Fetching market data via CLI for: ${query}`);
      const marketData = await this.polymarketService.fetchMarketData(query);

      // Step 2: Extract ALL tokens from CLI data
      console.log(`Extracting all tokens from CLI data`);
      const tokens = this.polymarketService.extractAllTokens(marketData);

      console.log(`Found ${tokens.length} outcome(s) to analyze`);

      // Calculate market volume from CLI data
      const marketVolume = parseFloat(marketData.market.volume) || 100000;

      // Step 3: Extract category and get MRI
      const category = this.polymarketService.extractCategory(marketData);
      const mri = this.polymarketService.getMRI(category);

      // Step 4: Analyze EACH outcome
      const outcomeAnalyses: OutcomeAnalysis[] = [];

      for (const token of tokens) {
        console.log(`\nAnalyzing outcome: ${token.outcome}`);

        const priceHistory = token.priceHistory;

        // Extract key prices
        const currentPrice = priceHistory[priceHistory.length - 1]?.p || 0;
        const sevenDaysAgoPrice = priceHistory[0]?.p || 0;

        // For 24h ago price, find the point approximately 24 hours back
        const hoursBack24 = Math.min(24, priceHistory.length - 1);
        const twentyFourHoursAgoPrice = priceHistory[priceHistory.length - 1 - hoursBack24]?.p || currentPrice;

        // Calculate volume spike metrics from market-level volume data (no auth required)
        const volumeMetrics = this.trendsService.calculateVolumeMetrics(
          marketData.market.volume24hr,
          marketData.market.volume1wk
        );

        // Calculate metrics for this outcome
        const metrics = this.metricsService.calculateMetrics(
          {
            current: currentPrice,
            sevenDaysAgo: sevenDaysAgoPrice,
            twentyFourHoursAgo: twentyFourHoursAgoPrice,
          },
          volumeMetrics,
          marketVolume,
          mri
        );

        // Calculate scores for this outcome
        const scores = this.metricsService.calculateScores(metrics, marketVolume, { current: currentPrice });

        // Generate recommendation for this outcome
        const recommendation = this.metricsService.generateRecommendation(scores.tradeScore, currentPrice, metrics);

        // Add to analyses array
        outcomeAnalyses.push({
          outcome: token.outcome,
          scores,
          metrics,
          prices: {
            current: currentPrice,
            sevenDaysAgo: sevenDaysAgoPrice,
            twentyFourHoursAgo: twentyFourHoursAgoPrice,
          },
          volume: {
            current_24h: volumeMetrics.volume_24h,
            total_7d: volumeMetrics.volume_7d,
            avg_per_day: volumeMetrics.avg_per_day,
          },
          recommendation,
          priceHistory,
        });
      }

      // Build response with ALL outcome analyses
      const response: AnalysisResponse = {
        success: true,
        data: {
          market: {
            id: marketData.market.id || '',
            question: marketData.market.question || '',
            slug: marketData.market.slug || '',
            category,
            currentPrice: 0, // Not meaningful for multi-outcome
            volume: marketVolume,
            title: marketData.market.question || '',
          },
          outcomes: outcomeAnalyses,
          volume: marketVolume,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
