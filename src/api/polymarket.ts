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
   * Calculate similarity score between two strings with improved word matching
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    // Word overlap with stop word filtering and possessive handling
    const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'will', 'be', 'is', 'are', '?', 'by', 'if']);
    
    // Remove possessives ('s) and punctuation for better matching
    const cleanWord = (w: string) => w.replace(/['']s$/, '').replace(/[^a-z0-9]/g, '');
    
    const words1 = s1.split(/\s+/)
      .map(cleanWord)
      .filter(w => w.length > 0 && !stopWords.has(w));
    const words2 = s2.split(/\s+/)
      .map(cleanWord)
      .filter(w => w.length > 0 && !stopWords.has(w));
    
    if (words1.length === 0 || words2.length === 0) return 0;

    // Count matching words (exact or partial matches for word variations)
    let matchCount = 0;
    for (const w1 of words1) {
      for (const w2 of words2) {
        // Exact match
        if (w1 === w2) {
          matchCount++;
          break;
        }
        // Partial match for word stems (e.g., "rule" matches "rules")
        if (w1.length >= 4 && w2.length >= 4) {
          const stem1 = w1.substring(0, Math.min(w1.length - 1, 5));
          const stem2 = w2.substring(0, Math.min(w2.length - 1, 5));
          if (stem1 === stem2) {
            matchCount += 0.9; // Slightly lower score for partial match
            break;
          }
        }
      }
    }
    
    // Calculate score based on proportion of matching important words
    const score1 = matchCount / words1.length;
    const score2 = matchCount / words2.length;
    
    // Use average of both proportions
    return (score1 + score2) / 2;
  }

  /**
   * Search for events and find the closest match using fuzzy matching
   */
  async findClosestEvent(query: string, searchParams?: EventSearchParams): Promise<Event | null> {
    try {
      // Try to get event by exact slug first
      try {
        const event = await this.getEventBySlug(query);
        return event;
      } catch (error) {
        // If exact slug fails, do fuzzy search
        console.log('Exact slug failed, doing fuzzy search across all events...');
      }

      // Fetch all events without keyword filtering
      // API search is too aggressive and filters out good matches
      console.log('Fetching all active events for local fuzzy matching...');
      
      const params = {
        ...searchParams,
        limit: searchParams?.limit || 1000, // Fetch more events by default
        // Don't use API search - it filters out too many good matches
      };
      const events = await this.searchEvents(params);
      
      if (events.length === 0) {
        console.log('No events found to search');
        return null;
      }

      console.log(`Searching through ${events.length} events for best match...`);

      // Calculate similarity for each event
      const matches: Array<{ event: Event; textScore: number; volumeScore: number; finalScore: number }> = [];

      // Find max volume for normalization
      let maxVolume = 0;
      for (const event of events) {
        const volume = parseFloat(String(event.volume || 0));
        if (volume > maxVolume) maxVolume = volume;
      }

      for (const event of events) {
        // Check similarity against title and slug
        const titleScore = this.calculateSimilarity(query, event.title || '');
        const slugScore = this.calculateSimilarity(query, event.slug || '');
        const textScore = Math.max(titleScore, slugScore);

        // Calculate volume score (normalized 0-1)
        const volume = parseFloat(String(event.volume || 0));
        const volumeScore = maxVolume > 0 ? volume / maxVolume : 0;

        // Combined score: 85% text similarity, 15% volume
        // Volume helps break ties but doesn't override good text matches
        const finalScore = (textScore * 0.85) + (volumeScore * 0.15);

        matches.push({ event, textScore, volumeScore, finalScore });
        
        // Debug: Show scoring for events containing "trump" and "tariff"
        const titleLower = (event.title || '').toLowerCase();
        if (titleLower.includes('trump') && titleLower.includes('tariff')) {
          console.log(`  DEBUG: "${event.title}" → ${(finalScore * 100).toFixed(1)}% (text: ${(textScore * 100).toFixed(1)}%, volume: ${(volumeScore * 100).toFixed(1)}%, vol: $${(volume / 1000000).toFixed(2)}M)`);
        }
      }

      // Sort by final score descending
      matches.sort((a, b) => b.finalScore - a.finalScore);

      // Show top 5 matches for debugging
      console.log('\nTop 5 matches:');
      for (let i = 0; i < Math.min(5, matches.length); i++) {
        const match = matches[i];
        const volume = parseFloat(String(match.event.volume || 0));
        console.log(`  ${i + 1}. "${match.event.title}" (${(match.finalScore * 100).toFixed(1)}%)`);
        console.log(`      Text: ${(match.textScore * 100).toFixed(1)}%, Volume: $${(volume / 1000000).toFixed(2)}M, Slug: ${match.event.slug}`);
      }

      // Always return the best match (no threshold)
      if (matches.length > 0 && matches[0].finalScore > 0) {
        const winner = matches[0];
        const volume = parseFloat(String(winner.event.volume || 0));
        console.log(`\nSelected: "${winner.event.title}" (text: ${(winner.textScore * 100).toFixed(1)}%, volume: $${(volume / 1000000).toFixed(2)}M)`);
        return winner.event;
      }

      console.log('No events available to match');
      return null;
    } catch (error) {
      throw new Error(`Failed to find event: ${this.getErrorMessage(error)}`);
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