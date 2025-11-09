import axios, { AxiosInstance } from 'axios';
import {
  Market,
  PricePoint,
  Trade,
  PolymarketApiConfig,
  MarketSearchParams,
  Event,
  EventSearchParams,
} from '../types/polymarket';

/**
 * Polymarket API Client
 * Handles all interactions with the Polymarket API
 */
export class PolymarketClient {
  private client: AxiosInstance;
  private clobClient: AxiosInstance;
  private baseUrl: string;
  private clobUrl: string;

  constructor(config: PolymarketApiConfig = { baseUrl: 'https://gamma-api.polymarket.com' }) {
    this.baseUrl = config.baseUrl;
    this.clobUrl = 'https://clob.polymarket.com';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Separate client for CLOB API (price/trade data)
    this.clobClient = axios.create({
      baseURL: this.clobUrl,
      timeout: config.timeout || 30000,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Search for markets by slug or other parameters
   */
  async searchMarkets(slug: string, searchParams?: MarketSearchParams): Promise<Market[]> {
    try {
      const params: any = {
        slug,
        ...searchParams,
      };

      const response = await this.client.get('/markets', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search markets: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get detailed information about a specific market
   */
  async getMarketDetails(marketId: string): Promise<Market> {
    try {
      const response = await this.client.get(`/markets/${marketId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get market details: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get tags/categories for a specific market
   */
  async getMarketTags(marketId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/markets/${marketId}/tags`);
      return response.data || [];
    } catch (error) {
      console.warn(`Could not fetch tags for market ${marketId}`);
      return [];
    }
  }

  /**
   * Get price history for a specific token
   */
  async getPriceHistory(
    tokenId: string,
    startDate?: Date,
    endDate?: Date,
    fidelity: number = 720 // 12 hours between data points by default
  ): Promise<PricePoint[]> {
    try {
      const params: any = {
        market: tokenId,
        fidelity,
      };

      // Use CLOB API parameters
      if (startDate && endDate) {
        params.startTs = Math.floor(startDate.getTime() / 1000);
        params.endTs = Math.floor(endDate.getTime() / 1000);
      } else if (startDate) {
        params.startTs = Math.floor(startDate.getTime() / 1000);
        params.endTs = Math.floor(Date.now() / 1000); // Now
      } else {
        // Default: fetch all historical data
        params.interval = 'all';
      }

      const response = await this.clobClient.get('/prices-history', {
        params,
      });

      return response.data.history || [];
    } catch (error) {
      throw new Error(`Failed to get price history: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get trade data for a specific token with optional date filtering
   */
  async getTrades(
    tokenId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 1000
  ): Promise<Trade[]> {
    try {
      const params: any = {
        asset_id: tokenId,
        limit,
      };

      if (startDate) {
        params.after = Math.floor(startDate.getTime() / 1000);
      }

      if (endDate) {
        params.before = Math.floor(endDate.getTime() / 1000);
      }

      const response = await this.client.get('/data/trades', {
        params,
      });

      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get trades: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get an event by its exact slug
   */
  async getEventBySlug(slug: string): Promise<Event> {
    try {
      const response = await this.client.get(`/events/slug/${slug}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get event by slug: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Search for events with various filters
   */
  async searchEvents(searchParams?: EventSearchParams): Promise<Event[]> {
    try {
      const response = await this.client.get('/events', {
        params: searchParams,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search events: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Calculate similarity score between two strings (simple Levenshtein-like approach)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    const wordOverlap = commonWords.length / Math.max(words1.length, words2.length);

    return wordOverlap * 0.6;
  }

  /**
   * Search for events by query and return the closest match
   */
  async findClosestEvent(query: string, searchParams?: EventSearchParams): Promise<Event | null> {
    try {
      // Search events with pagination
      const params: EventSearchParams = {
        limit: 50,
        ...searchParams,
      };

      const events = await this.searchEvents(params);

      if (!events || events.length === 0) {
        return null;
      }

      // Find best match based on title and slug similarity
      let bestMatch: Event | null = null;
      let bestScore = 0;

      for (const event of events) {
        const titleScore = event.title ? this.calculateSimilarity(event.title, query) : 0;
        const slugScore = event.slug ? this.calculateSimilarity(event.slug, query) : 0;
        const score = Math.max(titleScore, slugScore);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = event;
        }
      }

      // Only return if we have a reasonable match (> 30% similarity)
      return bestScore > 0.3 ? bestMatch : null;
    } catch (error) {
      throw new Error(`Failed to find closest event: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Helper method to extract error messages
   */
  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    }
    return String(error);
  }
}