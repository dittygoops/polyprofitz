import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
  polymarket: {
    baseUrl: process.env.POLYMARKET_BASE_URL || 'https://gamma-api.polymarket.com',
    clobUrl: process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validate required environment variables
if (!config.anthropicApiKey && config.nodeEnv === 'production') {
  console.warn('WARNING: ANTHROPIC_API_KEY is not set. Claude API integration will fail.');
}
