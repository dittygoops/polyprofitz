import fs from 'fs/promises';
import { AppError } from '../middleware/errorHandler';

export interface CLIMarketData {
  market: {
    id: string;
    question: string;
    slug: string;
    description?: string;
    outcomes?: string;
    volume: string;
    closed?: boolean;
    tags?: Array<{
      id: string;
      label: string;
      slug: string;
    }>;
  };
  tokens: Array<{
    tokenId: string;
    outcome: string;
    priceHistory: Array<{
      t: number;  // Unix timestamp
      p: string;  // Price as string
    }>;
  }>;
  fetchedAt: string;
  timeRange?: {
    start: string | null;
    end: string | null;
  };
}

export class FileService {
  /**
   * Read and parse market data from CLI-generated JSON file
   */
  async readMarketData(filePath: string): Promise<CLIMarketData> {
    try {
      console.log(`Reading market data from: ${filePath}`);

      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: CLIMarketData = JSON.parse(fileContent);

      // Validate required fields
      if (!data.market || !data.tokens || data.tokens.length === 0) {
        throw new AppError(500, 'Invalid JSON structure: missing market or tokens data');
      }

      console.log(`Successfully loaded market data: ${data.market.question}`);
      return data;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new AppError(404, `Market data file not found: ${filePath}`);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, `Failed to read market data: ${error.message}`);
    }
  }

  /**
   * Extract all tokens with their price histories
   */
  extractAllTokens(data: CLIMarketData): Array<{
    outcome: string;
    tokenId: string;
    priceHistory: Array<{ t: number; p: number }>;
  }> {
    return data.tokens.map(token => ({
      outcome: token.outcome,
      tokenId: token.tokenId,
      priceHistory: token.priceHistory.map(point => ({
        t: point.t,
        p: parseFloat(point.p),
      })),
    }));
  }

  /**
   * Get category from market tags
   */
  extractCategory(data: CLIMarketData): string {
    const tags = data.market.tags || [];

    for (const tag of tags) {
      const label = tag.label?.toLowerCase() || '';

      if (label.includes('polit') || label.includes('elect')) return 'politics';
      if (label.includes('sport') || label.includes('nba') || label.includes('nfl') || label.includes('soccer'))
        return 'sports';
      if (label.includes('crypto') || label.includes('bitcoin') || label.includes('eth')) return 'crypto';
      if (label.includes('entertain') || label.includes('celebrity') || label.includes('pop'))
        return 'entertainment';
    }

    return 'other';
  }
}
