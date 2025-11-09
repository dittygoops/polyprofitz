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
  proxy: {
    enabled: process.env.PROXY_ENABLED === 'true',
    provider: process.env.PROXY_PROVIDER || 'scraperapi', // 'scraperapi', 'brightdata', 'custom'
    scraperApiKey: process.env.SCRAPER_API_KEY || '',
    customProxyUrl: process.env.CUSTOM_PROXY_URL || '', // For custom proxy services
  },
};

// Validate required environment variables
if (!config.anthropicApiKey && config.nodeEnv === 'production') {
  console.warn('WARNING: ANTHROPIC_API_KEY is not set. Claude API integration will fail.');
}

// Log proxy configuration on startup
console.log('\n════════════════════════════════════════════════════════');
console.log('🔧 PROXY CONFIGURATION');
console.log('════════════════════════════════════════════════════════');
console.log(`Environment Variables:`);
console.log(`  PROXY_ENABLED: "${process.env.PROXY_ENABLED}" (type: ${typeof process.env.PROXY_ENABLED})`);
console.log(`  PROXY_PROVIDER: "${process.env.PROXY_PROVIDER}"`);
console.log(`  SCRAPER_API_KEY: ${process.env.SCRAPER_API_KEY ? `"${process.env.SCRAPER_API_KEY.substring(0, 12)}..." (${process.env.SCRAPER_API_KEY.length} chars)` : '(not set)'}`);
console.log(`  CUSTOM_PROXY_URL: ${process.env.CUSTOM_PROXY_URL ? '"***hidden***"' : '(not set)'}`);
console.log('');
console.log(`Parsed Config:`);
console.log(`  proxy.enabled: ${config.proxy.enabled} (${typeof config.proxy.enabled})`);
console.log(`  proxy.provider: "${config.proxy.provider}"`);
console.log(`  proxy.scraperApiKey: ${config.proxy.scraperApiKey ? '✓ Set' : '✗ Not set'}`);
console.log(`  proxy.customProxyUrl: ${config.proxy.customProxyUrl ? '✓ Set' : '✗ Not set'}`);
console.log('');

if (config.proxy.enabled) {
  console.log('✅ STATUS: PROXY IS ENABLED');
  console.log(`   Provider: ${config.proxy.provider}`);
  
  // Validate configuration
  if (config.proxy.provider === 'scraperapi') {
    if (config.proxy.scraperApiKey) {
      console.log('   ✅ ScraperAPI key is configured');
      console.log('   → Google Trends requests will route through ScraperAPI');
    } else {
      console.log('   ❌ ERROR: PROXY_PROVIDER is "scraperapi" but SCRAPER_API_KEY is missing!');
      console.log('   → Add SCRAPER_API_KEY to your .env file');
      console.log('   → Get your key at: https://www.scraperapi.com/signup');
    }
  } else if (config.proxy.provider === 'custom') {
    if (config.proxy.customProxyUrl) {
      console.log('   ✅ Custom proxy URL is configured');
      console.log('   → Google Trends requests will route through custom proxy');
    } else {
      console.log('   ❌ ERROR: PROXY_PROVIDER is "custom" but CUSTOM_PROXY_URL is missing!');
      console.log('   → Add CUSTOM_PROXY_URL to your .env file');
    }
  } else {
    console.log(`   ⚠️  WARNING: Unknown proxy provider: "${config.proxy.provider}"`);
  }
} else {
  console.log('⚠️  STATUS: PROXY IS DISABLED');
  console.log('   → Google Trends will use DIRECT requests (may be rate limited)');
  console.log('   → You may encounter HTTP 429 errors after 5-10 requests');
  console.log('');
  console.log('   To enable proxy:');
  console.log('   1. Create/edit backend/.env file');
  console.log('   2. Add: PROXY_ENABLED=true');
  console.log('   3. Add: PROXY_PROVIDER=scraperapi');
  console.log('   4. Add: SCRAPER_API_KEY=your_key_here');
  console.log('   5. Restart the server');
}
console.log('════════════════════════════════════════════════════════\n');
