import { CLIService } from './cliService';
import { FileService, CLIMarketData } from './fileService';

export class PolymarketService {
  private cliService: CLIService;
  private fileService: FileService;

  constructor() {
    this.cliService = new CLIService();
    this.fileService = new FileService();
  }

  /**
   * Execute CLI tool and return the market data from generated JSON file
   */
  async fetchMarketData(query: string): Promise<CLIMarketData> {
    // Execute CLI tool to fetch data and save to JSON
    const jsonFilePath = await this.cliService.executeDataFetch(query);

    // Read the generated JSON file
    const marketData = await this.fileService.readMarketData(jsonFilePath);

    return marketData;
  }

  /**
   * Extract all tokens with price histories from CLI market data
   */
  extractAllTokens(marketData: CLIMarketData): Array<{
    outcome: string;
    tokenId: string;
    priceHistory: Array<{ t: number; p: number }>;
  }> {
    return this.fileService.extractAllTokens(marketData);
  }

  /**
   * Extract category from market tags
   */
  extractCategory(marketData: CLIMarketData): string {
    return this.fileService.extractCategory(marketData);
  }

  /**
   * Get Mean Reversion Indicator based on category
   */
  getMRI(category: string): number {
    const MRI_MAP: Record<string, number> = {
      politics: 0.8,
      sports: 0.6,
      crypto: 0.9,
      entertainment: 0.7,
      other: 0.7,
    };

    return MRI_MAP[category] || 0.7;
  }
}
