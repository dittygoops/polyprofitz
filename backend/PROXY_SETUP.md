# Google Trends Proxy Setup Guide

## Overview

This application uses Google Trends data for market analysis. However, Google actively rate-limits automated requests. To avoid **HTTP 429 (Too Many Requests)** errors, we've implemented proxy rotation support.

## Why Use a Proxy?

- ✅ **Avoid rate limits** - Google blocks IPs that make too many automated requests
- ✅ **IP rotation** - Proxy services automatically rotate IPs to appear as different users
- ✅ **CAPTCHA handling** - Some services can bypass CAPTCHAs automatically
- ✅ **Higher success rate** - Enterprise proxy services have better success rates than direct requests

## Supported Proxy Providers

### 1. ScraperAPI (Recommended) ⭐

**Best for:** Most users, easiest setup, automatic IP rotation + CAPTCHA solving

- **Website:** https://www.scraperapi.com/
- **Free Tier:** 1,000 requests/month
- **Paid Plans:** Starting at $49/month (100,000 requests)
- **Features:** 
  - Automatic IP rotation from residential/datacenter pool
  - JavaScript rendering support
  - Automatic CAPTCHA solving
  - No infrastructure management needed

**Setup:**
```bash
# 1. Sign up at https://www.scraperapi.com/
# 2. Get your API key from the dashboard
# 3. Add to your .env file:
PROXY_ENABLED=true
PROXY_PROVIDER=scraperapi
SCRAPER_API_KEY=your_api_key_here
```

### 2. Bright Data

**Best for:** Enterprise users, high-volume requirements

- **Website:** https://brightdata.com/
- **Pricing:** Pay-as-you-go or monthly plans (more expensive than ScraperAPI)
- **Features:**
  - Largest proxy network (72M+ IPs)
  - Residential, mobile, and datacenter proxies
  - Very high success rates

**Setup:**
```bash
# 1. Sign up at https://brightdata.com/
# 2. Create a proxy zone in the dashboard
# 3. Get your proxy credentials
# 4. Add to your .env file:
PROXY_ENABLED=true
PROXY_PROVIDER=custom
CUSTOM_PROXY_URL=http://username:password@proxy.brightdata.com:port
```

### 3. Custom Proxy

**Best for:** If you have your own proxy infrastructure

**Setup:**
```bash
PROXY_ENABLED=true
PROXY_PROVIDER=custom
CUSTOM_PROXY_URL=http://your-proxy-host:port
# Or with authentication:
CUSTOM_PROXY_URL=http://username:password@your-proxy-host:port
```

## Environment Variables

Add these to your `/Users/apgupta/Documents/Coding/polyprofitz/backend/.env` file:

```bash
# Enable proxy for Google Trends
PROXY_ENABLED=true

# Choose provider: 'scraperapi', 'brightdata', or 'custom'
PROXY_PROVIDER=scraperapi

# ScraperAPI key (if using ScraperAPI)
SCRAPER_API_KEY=your_key_here

# Custom proxy URL (if using custom/Bright Data)
CUSTOM_PROXY_URL=http://user:pass@proxy.example.com:8080
```

## Testing Your Setup

1. **Add environment variables** to `.env`
2. **Restart the backend server**:
   ```bash
   cd /Users/apgupta/Documents/Coding/polyprofitz/backend
   npm run dev
   ```
3. **Make a test request** through your frontend
4. **Check the logs** - you should see:
   ```
   🔄 Proxy is enabled (provider: scraperapi)
   Fetching Google Trends for "trump 2024" via scraperapi proxy...
   ✓ Successfully fetched trends via proxy
   ```

## Without Proxy (Default Behavior)

If `PROXY_ENABLED=false` or not set, the app will use the original direct method:
- Makes requests directly to Google Trends
- Uses browser-like headers to avoid detection
- Has exponential backoff retry logic
- ⚠️ **Still susceptible to rate limiting** (HTTP 429 errors)

## Cost Comparison

| Provider | Free Tier | Starter Plan | Cost per 1K requests |
|----------|-----------|--------------|---------------------|
| **ScraperAPI** | 1,000 req/mo | $49/mo (100K) | ~$0.49 |
| **Bright Data** | None | $500/mo | ~$3-5 |
| **Direct (no proxy)** | Free | Free | Free (but rate limited) |

## Troubleshooting

### "Invalid proxy configuration" error
- Check that `PROXY_ENABLED=true` in your `.env`
- Verify you've set the correct API key or proxy URL
- Make sure there are no extra spaces in the values

### Still getting 429 errors with proxy
- Check your proxy service dashboard - you may have hit your quota
- Try switching to a different proxy provider
- Contact your proxy provider's support

### Proxy requests timing out
- ScraperAPI requests can take 10-30 seconds (it's rendering JavaScript)
- The timeout is set to 30 seconds - this is normal
- If it consistently times out, check your proxy provider status

## Code Implementation

The proxy logic is in `/Users/apgupta/Documents/Coding/polyprofitz/backend/src/services/trendsService.ts`:

- **Line 181-187:** Checks if proxy is enabled and routes accordingly
- **Line 44-177:** Proxy implementation with ScraperAPI and custom proxy support
- **Line 190-302:** Original direct method (fallback)

## Recommendations

1. **Start with ScraperAPI free tier** (1,000 requests/month)
2. **Monitor your usage** in the provider's dashboard
3. **Upgrade as needed** based on your request volume
4. **Enable caching** (future enhancement) to reduce proxy calls
5. **Add delays** between requests if still hitting limits

## Questions?

- ScraperAPI Docs: https://www.scraperapi.com/documentation/
- Bright Data Docs: https://docs.brightdata.com/
- Issues: Contact the development team

