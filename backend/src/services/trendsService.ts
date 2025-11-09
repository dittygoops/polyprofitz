import googleTrends from 'google-trends-api';
import https from 'https';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config } from '../config';

export interface TrendsResult {
  current: number;
  twentyFourHoursAgo: number;
  sevenDaysAgo: number;
  history: Array<{ t: number; v: number }>;
}

export class TrendsService {
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch Google Trends data using a proxy service (ScraperAPI, Bright Data, etc.)
   */
  private async getGoogleTrendsViaProxy(keyword: string, _daysBack: number, retries: number): Promise<TrendsResult> {
    // Note: daysBack is not used in proxy requests as we fetch the full trends page
    // The parameter is kept for API consistency with the direct method
    
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`Retrying Google Trends via proxy (attempt ${attempt + 1}/${retries + 1}) after ${delay}ms...`);
          await this.sleep(delay);
        }

        console.log(`\n[Attempt ${attempt + 1}/${retries + 1}] Fetching via ${config.proxy.provider} proxy...`);
        
        let result: string;

        if (config.proxy.provider === 'scraperapi' && config.proxy.scraperApiKey) {
          // ScraperAPI approach: Use their proxy servers with google-trends-api
          const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const endTime = new Date();
          
          console.log(`  🌐 Using google-trends-api library through ScraperAPI proxy`);
          console.log(`  🔑 API Key: ${config.proxy.scraperApiKey.substring(0, 8)}...${config.proxy.scraperApiKey.substring(config.proxy.scraperApiKey.length - 4)}`);
          console.log(`  🔍 Keyword: "${keyword}"`);
          console.log(`  📅 Date Range: ${startTime.toISOString()} to ${endTime.toISOString()}`);
          console.log(`  📤 Calling google-trends-api with ScraperAPI proxy...`);
          
          // Configure proxy for google-trends-api with SSL support
          // ScraperAPI proxy format: http://scraperapi:API_KEY@proxy-server.scraperapi.com:8001
          const proxyUrl = `http://scraperapi:${config.proxy.scraperApiKey}@proxy-server.scraperapi.com:8001`;
          const proxyAgent = new HttpsProxyAgent(proxyUrl, {
            rejectUnauthorized: false, // Disable SSL verification for proxy (necessary for HTTP proxies with HTTPS targets)
          });
          
          // Monkey-patch https.request to use our proxy
          const originalRequest = https.request;
          (https as any).request = function(options: any, callback: any) {
            options.agent = proxyAgent;
            options.rejectUnauthorized = false; // Disable SSL verification
            options.headers = {
              ...(options.headers || {}),
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            };
            return originalRequest.call(this, options, callback);
          };
          
          const requestStartTime = Date.now();
          try {
            result = await googleTrends.interestOverTime({
              keyword,
              startTime,
              endTime,
              granularTimeResolution: true,
              geo: 'US',
            });
            
            const elapsedMs = Date.now() - requestStartTime;
            console.log(`  📥 Response received in ${(elapsedMs / 1000).toFixed(2)}s`);
            console.log(`  📏 Size: ${result.length} chars`);
          } finally {
            // Restore original request method
            (https as any).request = originalRequest;
          }
          
        } else if (config.proxy.provider === 'custom' && config.proxy.customProxyUrl) {
          // Custom proxy approach: Use HttpsProxyAgent
          const proxyAgent = new HttpsProxyAgent(config.proxy.customProxyUrl, {
            rejectUnauthorized: false, // Disable SSL verification for proxy
          });
          
          console.log(`  🔧 Custom Proxy: ${config.proxy.customProxyUrl.replace(/\/\/.*:.*@/, '//***:***@')}`);
          console.log(`  📤 Sending request through custom proxy...`);
          
          const response = await axios.get(`https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&geo=US`, {
            httpsAgent: proxyAgent,
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Referer': 'https://trends.google.com/',
            }
          });
          
          result = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          
        } else {
          throw new Error(`Invalid proxy configuration: provider=${config.proxy.provider}, hasKey=${!!config.proxy.scraperApiKey}, hasCustomUrl=${!!config.proxy.customProxyUrl}`);
        }

        console.log(`  ✅ Received response (${typeof result}, ${result.length} chars)`);

        // Check if response is HTML (error page)
        if (typeof result === 'string' && result.trim().startsWith('<')) {
          console.error(`  ❌ Response is HTML, not JSON - likely an error page`);
          const preview = result.substring(0, 500).replace(/\s+/g, ' ');
          console.error(`  Preview: ${preview}...`);
          throw new Error('Google Trends returned HTML error page instead of JSON');
        }

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(result);
          console.log(`  ✅ Parsed JSON successfully`);
        } catch (parseError: any) {
          console.error(`  ❌ JSON parse failed: ${parseError.message}`);
          console.error(`  First 200 chars: ${result.substring(0, 200)}`);
          throw new Error(`Failed to parse Google Trends response: ${parseError.message}`);
        }
        
        const timelineData = data.default?.timelineData || data.timelineData || [];
        console.log(`  📈 Found ${timelineData.length} data points in timeline`);
        
        if (timelineData.length === 0) {
          console.warn(`  ⚠️  No timeline data found in response`);
          console.warn(`  Response structure: ${JSON.stringify(Object.keys(data)).substring(0, 200)}`);
        }

        if (timelineData.length === 0) {
          console.warn(`No Google Trends data for keyword: ${keyword}`);
          return {
            current: 0,
            twentyFourHoursAgo: 0,
            sevenDaysAgo: 0,
            history: [],
          };
        }

        // Extract history
        const history = timelineData.map((point: any) => ({
          t: new Date(point.time * 1000).getTime(),
          v: point.value[0] || 0,
        }));

        // Get current, 24h ago, and 7 days ago values
        const current = timelineData[timelineData.length - 1]?.value[0] || 0;
        const twentyFourHoursAgo = timelineData.length >= 24
          ? timelineData[timelineData.length - 24]?.value[0] || 0
          : current;
        const sevenDaysAgo = timelineData[0]?.value[0] || 0;

        console.log(`\n  ✅ SUCCESS! Trends Data:`);
        console.log(`     Current: ${current}`);
        console.log(`     24h ago: ${twentyFourHoursAgo}`);
        console.log(`     7d ago: ${sevenDaysAgo}`);
        console.log(`     History points: ${history.length}`);
        console.log('─────────────────────────────────────────────────────────────\n');

        return {
          current,
          twentyFourHoursAgo,
          sevenDaysAgo,
          history,
        };

      } catch (error: any) {
        lastError = error;
        console.error(`  ❌ FAILED: ${error.message}`);
        
        if (error.response) {
          console.error(`     HTTP Status: ${error.response.status}`);
          console.error(`     Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        }
        
        if (attempt < retries) {
          const nextDelay = 1000 * Math.pow(2, attempt);
          console.log(`  ⏳ Will retry in ${nextDelay}ms...`);
        }
      }
    }

    // All retries exhausted
    console.error(`\n❌ ALL RETRIES EXHAUSTED`);
    console.error(`   Attempts: ${retries + 1}`);
    console.error(`   Last error: ${lastError?.message || 'Unknown error'}`);
    if (lastError?.code) {
      console.error(`   Error code: ${lastError.code}`);
    }
    console.error(`   ⚠️  Returning zero trends data - analysis will continue without trends`);
    console.error('─────────────────────────────────────────────────────────────\n');
    
    return {
      current: 0,
      twentyFourHoursAgo: 0,
      sevenDaysAgo: 0,
      history: [],
    };
  }

  async getGoogleTrends(keyword: string, daysBack: number = 7, retries: number = 2): Promise<TrendsResult> {
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 🔍 GOOGLE TRENDS REQUEST                                    │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  Keyword: "${keyword}"`);
    console.log(`  Days Back: ${daysBack}`);
    console.log(`  Max Retries: ${retries}`);
    console.log(`  Proxy Config:`);
    console.log(`    - Enabled: ${config.proxy.enabled}`);
    console.log(`    - Provider: ${config.proxy.provider}`);
    console.log(`    - Has API Key: ${!!config.proxy.scraperApiKey}`);
    console.log('');
    
    // If proxy is enabled, use proxy service
    if (config.proxy.enabled) {
      console.log(`✅ Routing through PROXY (${config.proxy.provider})`);
      console.log('─────────────────────────────────────────────────────────────');
      return this.getGoogleTrendsViaProxy(keyword, daysBack, retries);
    }

    // Otherwise, use the direct (original) method
    console.log(`⚠️  Using DIRECT method (no proxy)`);
    console.log('─────────────────────────────────────────────────────────────');
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`Retrying Google Trends (attempt ${attempt + 1}/${retries + 1}) after ${delay}ms...`);
          await this.sleep(delay);
        }

        const startTime = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        const endTime = new Date();

        console.log(`Fetching Google Trends for "${keyword}" (attempt ${attempt + 1}/${retries + 1})...`);
        
        // Create custom HTTPS agent with browser-like headers
        // Monkey-patch to add headers to all requests
        const originalRequest = https.request;
        
        (https as any).request = function(options: any, callback: any) {
          options.headers = {
            ...(options.headers || {}),
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://trends.google.com/trends/',
          };
          return originalRequest.call(this, options, callback);
        };
        
        try {
          const result = await googleTrends.interestOverTime({
            keyword,
            startTime,
            endTime,
            granularTimeResolution: true,
            geo: 'US', // Focus on US trends to reduce rate limiting
          });
          
          // Restore original request method
          (https as any).request = originalRequest;

          console.log(`✓ Received response from Google Trends (${typeof result}, ${result.length} chars)`);

          // Check if result looks like HTML (rate limit or error page)
          if (typeof result === 'string' && result.trim().startsWith('<')) {
            const preview = result.substring(0, 200).replace(/\n/g, ' ');
            console.warn(`✗ Google Trends returned HTML instead of JSON`);
            console.warn(`  Response preview: ${preview}...`);
            throw new Error('Google Trends returned HTML (likely rate limited or blocked)');
          }

          const data = JSON.parse(result);
          console.log(`✓ Successfully parsed JSON response`);
          
          const timelineData = data.default?.timelineData || [];
          console.log(`✓ Found ${timelineData.length} data points in timeline`);

          if (timelineData.length === 0) {
            console.warn(`No Google Trends data for keyword: ${keyword}`);
            return {
              current: 0,
              twentyFourHoursAgo: 0,
              sevenDaysAgo: 0,
              history: [],
            };
          }

          // Extract history
          const history = timelineData.map((point: any) => ({
            t: new Date(point.time * 1000).getTime(),
            v: point.value[0] || 0,
          }));

          // Get current, 24h ago, and 7 days ago values
          const current = timelineData[timelineData.length - 1]?.value[0] || 0;
          const twentyFourHoursAgo = timelineData.length >= 24
            ? timelineData[timelineData.length - 24]?.value[0] || 0
            : current; // Fallback to current if not enough data
          const sevenDaysAgo = timelineData[0]?.value[0] || 0;

          return {
            current,
            twentyFourHoursAgo,
            sevenDaysAgo,
            history,
          };
        } catch (innerError) {
          // Restore original request method on error
          (https as any).request = originalRequest;
          throw innerError;
        }
    } catch (error: any) {
      lastError = error;
      
      // If it's an HTML response, definitely rate limited - continue retrying
      if (error.message?.includes('HTML')) {
        console.warn(`✗ Google Trends returned HTML for "${keyword}" (attempt ${attempt + 1}/${retries + 1})`);
        if (attempt < retries) {
          console.log(`  Will retry in ${1000 * Math.pow(2, attempt)}ms...`);
        }
        continue;
      }
      
      // For JSON parse errors, also retry
      if (error.name === 'SyntaxError') {
        console.warn(`✗ JSON parse error for "${keyword}" (attempt ${attempt + 1}/${retries + 1})`);
        console.warn(`  Error: ${error.message}`);
        if (attempt < retries) {
          console.log(`  Will retry in ${1000 * Math.pow(2, attempt)}ms...`);
        }
        continue;
      }
      
      // For other errors, log details and don't retry
      console.error(`✗ Google Trends error (${error.name}):`, error.message);
      console.error(`  Stack trace:`, error.stack?.split('\n').slice(0, 3).join('\n'));
      break;
    }
  }

  // All retries exhausted
  console.error(`\n❌ Google Trends failed after ${retries + 1} attempts for "${keyword}"`);
  console.error(`   Last error: ${lastError?.message || 'Unknown error'}`);
  
  if (lastError?.message?.includes('HTML')) {
    console.error(`   Diagnosis: Google is rate limiting or blocking automated requests`);
    console.error(`   Solution: Wait a few minutes before trying again, or use a different search term`);
  } else if (lastError?.name === 'SyntaxError') {
    console.error(`   Diagnosis: Received invalid JSON from Google Trends API`);
  }
  
  console.log(`   ℹ Returning zero trends data - analysis will continue without trends\n`);
  
  return {
    current: 0,
    twentyFourHoursAgo: 0,
    sevenDaysAgo: 0,
    history: [],
  };
}
}
