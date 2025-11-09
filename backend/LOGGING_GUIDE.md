# 📋 Comprehensive Logging Guide

## Overview

I've added **extensive logging** throughout the proxy implementation so you can see exactly what's happening at every step. This will help you debug issues and understand how the proxy is working.

## Where to Find Logs

All logs appear in your terminal where you run `npm run dev` or `npm run start`.

---

## 🔧 Startup Logs (Config Validation)

When you start the backend server, you'll immediately see the proxy configuration:

### Example 1: Proxy DISABLED (default)

```
════════════════════════════════════════════════════════
🔧 PROXY CONFIGURATION
════════════════════════════════════════════════════════
Environment Variables:
  PROXY_ENABLED: "undefined" (type: undefined)
  PROXY_PROVIDER: "undefined"
  SCRAPER_API_KEY: (not set)
  CUSTOM_PROXY_URL: (not set)

Parsed Config:
  proxy.enabled: false (boolean)
  proxy.provider: "scraperapi"
  proxy.scraperApiKey: ✗ Not set
  proxy.customProxyUrl: ✗ Not set

⚠️  STATUS: PROXY IS DISABLED
   → Google Trends will use DIRECT requests (may be rate limited)
   → You may encounter HTTP 429 errors after 5-10 requests

   To enable proxy:
   1. Create/edit backend/.env file
   2. Add: PROXY_ENABLED=true
   3. Add: PROXY_PROVIDER=scraperapi
   4. Add: SCRAPER_API_KEY=your_key_here
   5. Restart the server
════════════════════════════════════════════════════════

🚀 Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
```

### Example 2: Proxy ENABLED (correctly configured)

```
════════════════════════════════════════════════════════
🔧 PROXY CONFIGURATION
════════════════════════════════════════════════════════
Environment Variables:
  PROXY_ENABLED: "true" (type: string)
  PROXY_PROVIDER: "scraperapi"
  SCRAPER_API_KEY: "abc123def456..." (24 chars)
  CUSTOM_PROXY_URL: (not set)

Parsed Config:
  proxy.enabled: true (boolean)
  proxy.provider: "scraperapi"
  proxy.scraperApiKey: ✓ Set
  proxy.customProxyUrl: ✗ Not set

✅ STATUS: PROXY IS ENABLED
   Provider: scraperapi
   ✅ ScraperAPI key is configured
   → Google Trends requests will route through ScraperAPI
════════════════════════════════════════════════════════

🚀 Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
```

### Example 3: Proxy ENABLED but MISCONFIGURED

```
════════════════════════════════════════════════════════
🔧 PROXY CONFIGURATION
════════════════════════════════════════════════════════
Environment Variables:
  PROXY_ENABLED: "true" (type: string)
  PROXY_PROVIDER: "scraperapi"
  SCRAPER_API_KEY: (not set)
  CUSTOM_PROXY_URL: (not set)

Parsed Config:
  proxy.enabled: true (boolean)
  proxy.provider: "scraperapi"
  proxy.scraperApiKey: ✗ Not set
  proxy.customProxyUrl: ✗ Not set

✅ STATUS: PROXY IS ENABLED
   Provider: scraperapi
   ❌ ERROR: PROXY_PROVIDER is "scraperapi" but SCRAPER_API_KEY is missing!
   → Add SCRAPER_API_KEY to your .env file
   → Get your key at: https://www.scraperapi.com/signup
════════════════════════════════════════════════════════

🚀 Server running on port 3001
```

---

## 🔍 Request Logs (When Analyzing a Market)

### When You Make a Market Analysis Request

Every Google Trends request will show detailed logs:

#### Example: Successful Proxy Request

```
Converting market question to search query: Will Trump win 2024?
✓ Search query generated: trump 2024 election

┌─────────────────────────────────────────────────────────────┐
│ 🔍 GOOGLE TRENDS REQUEST                                    │
└─────────────────────────────────────────────────────────────┘
  Keyword: "trump 2024 election"
  Days Back: 7
  Max Retries: 2
  Proxy Config:
    - Enabled: true
    - Provider: scraperapi
    - Has API Key: true

✅ Routing through PROXY (scraperapi)
─────────────────────────────────────────────────────────────

[Attempt 1/3] Fetching via scraperapi proxy...
  🌐 Target: https://trends.google.com/trends/explore?q=trump%202024%20election&geo=US
  🔑 API Key: abc123de...f456
  ⏱️  Timeout: 30 seconds
  📤 Sending request to ScraperAPI...
  📥 Response received in 12.45s
  📊 Status: 200 OK
  📦 Content-Type: text/html; charset=utf-8
  📏 Size: 245678 chars
  ✅ Received response (string, 245678 chars)
  🔍 Response is HTML, extracting embedded trends data...
  ✓ Extracted JSON from HTML response
  ✅ Parsed JSON successfully
  📈 Found 168 data points in timeline

  ✅ SUCCESS! Trends Data:
     Current: 85
     24h ago: 82
     7d ago: 74
     History points: 168
─────────────────────────────────────────────────────────────
```

#### Example: Direct Request (No Proxy)

```
Converting market question to search query: Will Trump win 2024?
✓ Search query generated: trump 2024 election

┌─────────────────────────────────────────────────────────────┐
│ 🔍 GOOGLE TRENDS REQUEST                                    │
└─────────────────────────────────────────────────────────────┘
  Keyword: "trump 2024 election"
  Days Back: 7
  Max Retries: 2
  Proxy Config:
    - Enabled: false
    - Provider: scraperapi
    - Has API Key: false

⚠️  Using DIRECT method (no proxy)
─────────────────────────────────────────────────────────────
Fetching Google Trends for "trump 2024 election" (attempt 1/3)...
✓ Received response from Google Trends (string, 12543 chars)
✓ Successfully parsed JSON response
✓ Found 168 data points in timeline
```

#### Example: Rate Limited (429 Error)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 GOOGLE TRENDS REQUEST                                    │
└─────────────────────────────────────────────────────────────┘
  Keyword: "biden polling"
  Days Back: 7
  Max Retries: 2
  Proxy Config:
    - Enabled: false
    - Provider: scraperapi
    - Has API Key: false

⚠️  Using DIRECT method (no proxy)
─────────────────────────────────────────────────────────────
Fetching Google Trends for "biden polling" (attempt 1/3)...
✗ Google Trends returned HTML instead of JSON
  Response preview: <!DOCTYPE html><html><head><title>429 Too Many Requests</title></head>...

Retrying Google Trends (attempt 2/3) after 1000ms...
✗ Google Trends returned HTML instead of JSON
  Response preview: <!DOCTYPE html><html><head><title>429 Too Many Requests</title></head>...

Retrying Google Trends (attempt 3/3) after 2000ms...
✗ Google Trends returned HTML instead of JSON
  Response preview: <!DOCTYPE html><html><head><title>429 Too Many Requests</title></head>...

❌ Google Trends failed after 3 attempts for "biden polling"
   Last error: Google Trends returned HTML (likely rate limited or blocked)
   Diagnosis: Google is rate limiting or blocking automated requests
   Solution: Wait a few minutes before trying again, or use a different search term
   ℹ Returning zero trends data - analysis will continue without trends
```

#### Example: Proxy Request with Retry

```
[Attempt 1/3] Fetching via scraperapi proxy...
  🌐 Target: https://trends.google.com/trends/explore?q=biden%20polling&geo=US
  🔑 API Key: abc123de...f456
  ⏱️  Timeout: 30 seconds
  📤 Sending request to ScraperAPI...
  ❌ FAILED: timeout of 30000ms exceeded

Retrying Google Trends via proxy (attempt 2/3) after 1000ms...

[Attempt 2/3] Fetching via scraperapi proxy...
  🌐 Target: https://trends.google.com/trends/explore?q=biden%20polling&geo=US
  🔑 API Key: abc123de...f456
  ⏱️  Timeout: 30 seconds
  📤 Sending request to ScraperAPI...
  📥 Response received in 15.23s
  📊 Status: 200 OK
  📦 Content-Type: text/html; charset=utf-8
  📏 Size: 198543 chars
  ✅ Received response (string, 198543 chars)
  🔍 Response is HTML, extracting embedded trends data...
  ✓ Extracted JSON from HTML response
  ✅ Parsed JSON successfully
  📈 Found 168 data points in timeline

  ✅ SUCCESS! Trends Data:
     Current: 45
     24h ago: 47
     7d ago: 52
     History points: 168
─────────────────────────────────────────────────────────────
```

#### Example: All Retries Failed

```
[Attempt 1/3] Fetching via scraperapi proxy...
  🌐 Target: https://trends.google.com/trends/explore?q=test&geo=US
  🔑 API Key: abc123de...f456
  ⏱️  Timeout: 30 seconds
  📤 Sending request to ScraperAPI...
  ❌ FAILED: Request failed with status code 403
     HTTP Status: 403
     Response: {"error":"Forbidden","message":"Invalid API key"}
  ⏳ Will retry in 1000ms...

[Attempt 2/3] Fetching via scraperapi proxy...
  [... same error ...]
  ⏳ Will retry in 2000ms...

[Attempt 3/3] Fetching via scraperapi proxy...
  [... same error ...]

❌ ALL RETRIES EXHAUSTED
   Attempts: 3
   Last error: Request failed with status code 403
   Error code: ERR_BAD_REQUEST
   ⚠️  Returning zero trends data - analysis will continue without trends
─────────────────────────────────────────────────────────────
```

---

## 🐛 What to Look For

### ✅ Everything Working (Proxy Enabled)

Look for:
- `✅ STATUS: PROXY IS ENABLED` on startup
- `✅ Routing through PROXY` in requests
- `📥 Response received in X.XXs` (usually 10-30 seconds)
- `✅ SUCCESS! Trends Data:` with actual numbers

### ⚠️ Proxy Disabled (Will Get Rate Limited)

Look for:
- `⚠️  STATUS: PROXY IS DISABLED` on startup
- `⚠️  Using DIRECT method (no proxy)` in requests
- Eventually: `❌ Google Trends returned HTML (likely rate limited or blocked)`

### ❌ Proxy Misconfigured

Look for:
- `❌ ERROR: PROXY_PROVIDER is "scraperapi" but SCRAPER_API_KEY is missing!`
- `Invalid proxy configuration` error during requests

### 🔍 Debugging Steps

1. **Check startup logs** - Does it show your config correctly?
2. **Verify env vars** - Are they showing as expected?
3. **Watch request logs** - Is it routing through proxy or direct?
4. **Check response times** - Proxy requests take 10-30s, direct takes 1-5s
5. **Look for success message** - Did you get actual trend data?

---

## 💡 Quick Troubleshooting

| You See | Problem | Solution |
|---------|---------|----------|
| `PROXY_ENABLED: "undefined"` | .env not loaded | Create `.env` file in backend folder |
| `proxy.enabled: false` when you set true | Wrong value | Use `PROXY_ENABLED=true` (no quotes) |
| `SCRAPER_API_KEY: (not set)` | Missing API key | Add to `.env` file |
| `❌ ERROR: ... but SCRAPER_API_KEY is missing!` | API key not set | Get key from scraperapi.com |
| `timeout of 30000ms exceeded` | Slow proxy response | Normal, will retry automatically |
| `Request failed with status code 403` | Invalid API key | Check your ScraperAPI key |
| `Request failed with status code 429` | Quota exceeded | Check ScraperAPI dashboard |

---

## 📝 Testing Your Setup

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check startup logs** - You should see the proxy configuration banner

3. **Make a test request** through your frontend

4. **Watch the terminal** - You'll see detailed logs for every step

5. **Verify success** - Look for `✅ SUCCESS! Trends Data:`

---

## 🔧 Example .env File

Create `/Users/apgupta/Documents/Coding/polyprofitz/backend/.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# API Keys
ANTHROPIC_API_KEY=your_anthropic_key

# Proxy (for Google Trends)
PROXY_ENABLED=true
PROXY_PROVIDER=scraperapi
SCRAPER_API_KEY=your_scraperapi_key_here

# Don't need this unless using custom proxy:
# CUSTOM_PROXY_URL=http://user:pass@proxy.example.com:8080
```

Then restart: `npm run dev`

---

## 🎯 Success Indicators

You know it's working when you see:

1. ✅ At startup: `✅ STATUS: PROXY IS ENABLED`
2. ✅ In requests: `✅ Routing through PROXY (scraperapi)`
3. ✅ Response: `📥 Response received in 12.45s`
4. ✅ Success: `✅ SUCCESS! Trends Data:`
5. ✅ No more 429 errors!

---

Need more help? Check `PROXY_SETUP.md` or `QUICK_START_PROXY.md`

