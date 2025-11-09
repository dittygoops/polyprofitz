import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MarketAnalysisService } from './services/market-analysis';
import { AnalysisRequest, AnalysisError } from './types/market-analysis';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize service
const marketAnalysisService = new MarketAnalysisService();

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Main analysis endpoint
 * POST /api/analyze
 * Body: { query: string }
 */
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { query } = req.body as AnalysisRequest;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter is required and must be a non-empty string'
      } as AnalysisError);
      return;
    }

    console.log(`Analyzing market for query: "${query}"`);

    // Perform analysis
    const analysis = await marketAnalysisService.analyzeMarket(query);

    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing market:', error);

    const statusCode = error.message.includes('No matching market') ? 404 : 500;
    
    res.status(statusCode).json({
      error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    } as AnalysisError);
  }
});

/**
 * Get example queries
 */
app.get('/api/examples', (_req: Request, res: Response) => {
  res.json({
    examples: [
      'Trump election 2024',
      'Bitcoin price 100k',
      'Fed rate decision December',
      'Super Bowl winner',
      'Ethereum ETF approval'
    ]
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  } as AnalysisError);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Polymarket Sentiment Fade Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Analysis API: http://localhost:${PORT}/api/analyze`);
  console.log('\n📊 Ready to analyze markets!');
});

export default app;

