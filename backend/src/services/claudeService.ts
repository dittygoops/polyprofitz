import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export class ClaudeService {
  private client: Anthropic;

  constructor() {
    if (!config.anthropicApiKey) {
      throw new AppError(500, 'Anthropic API key is not configured');
    }

    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  async extractSearchQuery(marketQuestion: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Extract the most relevant 2-4 word Google search query from this prediction market title: '${marketQuestion}'. Return only the search query, no explanation.`,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textContent.text.trim();
    } catch (error: any) {
      console.error('Claude API error:', error);

      // Fallback: Simple keyword extraction if Claude fails
      return this.fallbackExtraction(marketQuestion);
    }
  }

  private fallbackExtraction(marketQuestion: string): string {
    // Simple fallback: take first 3-4 significant words
    const words = marketQuestion
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !['will', 'does', 'what', 'when', 'where', 'who'].includes(word))
      .slice(0, 4);

    return words.join(' ') || 'market prediction';
  }
}
