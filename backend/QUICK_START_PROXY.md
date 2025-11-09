# 🚀 Quick Start: Enable Proxy for Google Trends

## ⚡ 5-Minute Setup (ScraperAPI - Recommended)

### Step 1: Get Your API Key (2 minutes)

1. Go to https://www.scraperapi.com/signup
2. Sign up (free tier = 1,000 requests/month)
3. Copy your API key from the dashboard

### Step 2: Configure Backend (1 minute)

Create or edit `/Users/apgupta/Documents/Coding/polyprofitz/backend/.env`:

```bash
# Add these lines:
PROXY_ENABLED=true
PROXY_PROVIDER=scraperapi
SCRAPER_API_KEY=paste_your_key_here
```

### Step 3: Restart Backend (1 minute)

```bash
cd /Users/apgupta/Documents/Coding/polyprofitz/backend
npm run dev
```

### Step 4: Test It (1 minute)

1. Open your frontend
2. Search for any market
3. Check backend logs - you should see:
   ```
   🔄 Proxy is enabled (provider: scraperapi)
   Fetching Google Trends for "..." via scraperapi proxy...
   ✓ Successfully fetched trends via proxy
   ```

## ✅ That's It!

No more **429 rate limit errors** from Google Trends!

## 📊 What Changed?

Your app now routes Google Trends requests through ScraperAPI's proxy network:

```
Before:
Your Server → Google Trends → ❌ 429 Rate Limited

After:
Your Server → ScraperAPI → Rotating IPs → Google Trends → ✅ Success
```

## 🔧 Alternative: Bright Data (Enterprise)

If you need more volume or already use Bright Data:

```bash
PROXY_ENABLED=true
PROXY_PROVIDER=custom
CUSTOM_PROXY_URL=http://username:password@brd.superproxy.io:22225
```

## 🆘 Troubleshooting

**Still getting rate limited?**
- Check that `.env` file exists and has the correct values
- Verify `PROXY_ENABLED=true` (no quotes, lowercase true)
- Restart the backend server
- Check ScraperAPI dashboard for remaining quota

**Requests timing out?**
- Normal! Proxy requests take 10-30 seconds (rendering JavaScript)
- Timeout is set to 30s
- Be patient on first request

**Need help?**
See full documentation: `/Users/apgupta/Documents/Coding/polyprofitz/backend/PROXY_SETUP.md`

## 💰 Free Tier Limits

- **ScraperAPI:** 1,000 requests/month free
- **Your usage:** ~1 request per market analysis
- **Should last:** 1,000 market searches/month

Upgrade if you need more!

