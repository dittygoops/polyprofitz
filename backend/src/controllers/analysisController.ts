import { Request, Response, NextFunction } from 'express';
import { PolymarketService } from '../services/polymarketService';
import { ClaudeService } from '../services/claudeService';
import { TrendsService } from '../services/trendsService';
import { MetricsService } from '../services/metricsService';
import { AnalysisResponse, OutcomeAnalysis } from '../types/analysis';

export class AnalysisController {
  private polymarketService: PolymarketService;
  private claudeService: ClaudeService;
  private trendsService: TrendsService;
  private metricsService: MetricsService;

  constructor() {
    this.polymarketService = new PolymarketService();
    this.claudeService = new ClaudeService();
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

      // Step 4: Convert market question to search query using Claude (ONCE for all outcomes)
      console.log(`Converting market question to search query: ${marketData.market.question}`);
      const searchQuery = await this.claudeService.extractSearchQuery(marketData.market.question);

      // Step 5: Fetch Google Trends data (ONCE for all outcomes)
      console.log(`Fetching Google Trends for: ${searchQuery}`);
      const trendsResult = await this.trendsService.getGoogleTrends(searchQuery, 7);

      // Step 6: Analyze EACH outcome
      const outcomeAnalyses: OutcomeAnalysis[] = [];

      for (const token of tokens) {
        console.log(`Analyzing outcome: ${token.outcome}`);

        const priceHistory = token.priceHistory;

        // Extract key prices
        const currentPrice = priceHistory[priceHistory.length - 1]?.p || 0;
        const sevenDaysAgoPrice = priceHistory[0]?.p || 0;

        // For 24h ago price, find the point approximately 24 hours back
        const hoursBack24 = Math.min(24, priceHistory.length - 1);
        const twentyFourHoursAgoPrice = priceHistory[priceHistory.length - 1 - hoursBack24]?.p || currentPrice;

        // Calculate metrics for this outcome
        const metrics = this.metricsService.calculateMetrics(
          {
            current: currentPrice,
            sevenDaysAgo: sevenDaysAgoPrice,
            twentyFourHoursAgo: twentyFourHoursAgoPrice,
          },
          {
            current: trendsResult.current,
            twentyFourHoursAgo: trendsResult.twentyFourHoursAgo,
            sevenDaysAgo: trendsResult.sevenDaysAgo,
            history: trendsResult.history,
          },
          marketVolume,
          mri
        );

        // Calculate scores for this outcome
        const scores = this.metricsService.calculateScores(metrics, marketVolume);

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
          trends: {
            current: trendsResult.current,
            sevenDaysAgo: trendsResult.sevenDaysAgo,
            searchQuery,
            history: trendsResult.history,
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
