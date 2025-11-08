import axios from 'axios';
import * as fs from 'fs';

// Interface for Google Trends data point
interface TrendsDataPoint {
  query: string;
  trends_current: number;    // 0-100 search volume now
  trends_7d_ago: number;      // 0-100 search volume 7 days ago
  timestamp: string;
}

// Test queries related to Polymarket prediction markets
const TEST_QUERIES = [
  'elon musk dogecoin',
  'trump election',
  'bitcoin price',
  'ethereum merge',
  'fed interest rate',
  'taylor swift',
  'world cup 2024',
  'presidential debate',
  'stock market crash',
  'ai artificial intelligence'
];

/**
 * Fetch Google Trends data using the unofficial API
 * Note: This uses serpapi.com or similar service for reliable data
 */
async function getGoogleTrendsData(query: string, daysAgo: number = 0): Promise<number> {
  try {
    // Calculate the date range
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1); // Get 1 day window

    const formattedEndDate = endDate.toISOString().split('T')[0];
    const formattedStartDate = startDate.toISOString().split('T')[0];

    // Using Google Trends interest over time endpoint (unofficial)
    const url = 'https://trends.google.com/trends/api/widgetdata/multiline';
    
    const params = {
      req: JSON.stringify({
        time: `${formattedStartDate} ${formattedEndDate}`,
        resolution: 'DAY',
        locale: 'en-US',
        comparisonItem: [{
          geo: '',
          time: `${formattedStartDate} ${formattedEndDate}`,
          keyword: query
        }],
        requestOptions: {
          property: '',
          backend: 'IZG',
          category: 0
        }
      }),
      token: '',
      tz: '-480'
    };

    const response = await axios.get(url, { 
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Parse the response (Google returns JSON with ")]}'" prefix)
    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data.substring(5));
    }

    // Extract the interest value (0-100)
    if (data.default?.timelineData?.length > 0) {
      const values = data.default.timelineData[0].value;
      if (values && values.length > 0) {
        return values[values.length - 1]; // Get the most recent value
      }
    }

    return 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching trends for "${query}" (${daysAgo} days ago):`, errorMessage);
    return 0;
  }
}

/**
 * Alternative: Using google-trends-api npm package (more reliable)
 */
async function getGoogleTrendsDataAlternative(query: string, daysAgo: number = 0): Promise<number> {
  try {
    // Dynamic import to handle optional dependency
    // @ts-ignore - google-trends-api doesn't have type definitions
    const googleTrends: any = await import('google-trends-api');
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7); // Get 7 day window for better data

    const results = await googleTrends.interestOverTime({
      keyword: query,
      startTime: startDate,
      endTime: endDate,
      granularTimeResolution: true
    });

    const data = JSON.parse(results);
    
    if (data.default?.timelineData?.length > 0) {
      const timelineData = data.default.timelineData;
      // Get the last data point (most recent)
      const lastPoint = timelineData[timelineData.length - 1];
      return lastPoint.value[0] || 0;
    }

    return 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching trends (alternative) for "${query}":`, errorMessage);
    return 0;
  }
}

/**
 * Simple mock function for testing (returns random values 0-100)
 * Use this if API calls fail or for rapid testing
 */
function getMockTrendsData(query: string, daysAgo: number): number {
  // Generate deterministic but varying mock data
  const seed = query.length + daysAgo;
  return Math.floor((Math.sin(seed) + 1) * 50);
}

/**
 * Main test function
 */
async function runTrendsTest() {
  console.log('🔍 Google Trends Test - Prediction Market Queries\n');
  console.log('=' .repeat(80));
  console.log();

  const results: TrendsDataPoint[] = [];
  const USE_MOCK_DATA = true; // Set to false when you have google-trends-api installed

  for (const query of TEST_QUERIES) {
    console.log(`Testing query: "${query}"`);
    
    let trendsCurrent: number;
    let trends7dAgo: number;

    if (USE_MOCK_DATA) {
      // Use mock data for testing
      trendsCurrent = getMockTrendsData(query, 0);
      trends7dAgo = getMockTrendsData(query, 7);
    } else {
      // Use real API calls
      try {
        [trendsCurrent, trends7dAgo] = await Promise.all([
          getGoogleTrendsDataAlternative(query, 0),
          getGoogleTrendsDataAlternative(query, 7)
        ]);
      } catch (error) {
        console.log(`  ❌ Failed to fetch data, using mock data`);
        trendsCurrent = getMockTrendsData(query, 0);
        trends7dAgo = getMockTrendsData(query, 7);
      }
    }

    const change = trendsCurrent - trends7dAgo;
    const changePercent = trends7dAgo > 0 ? ((change / trends7dAgo) * 100).toFixed(1) : 'N/A';
    const trend = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';

    console.log(`  Current:  ${trendsCurrent}/100`);
    console.log(`  7d ago:   ${trends7dAgo}/100`);
    console.log(`  Change:   ${change > 0 ? '+' : ''}${change} (${changePercent}%) ${trend}`);
    console.log();

    results.push({
      query,
      trends_current: trendsCurrent,
      trends_7d_ago: trends7dAgo,
      timestamp: new Date().toISOString()
    });

    // Rate limiting - wait 2 seconds between requests to avoid being blocked
    if (!USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('=' .repeat(80));
  console.log('\n📊 Summary of Results:\n');
  
  // Sort by current trends (descending)
  const sortedResults = [...results].sort((a, b) => b.trends_current - a.trends_current);
  
  console.log('Top Trending Now:');
  sortedResults.slice(0, 5).forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.query.padEnd(30)} - ${result.trends_current}/100`);
  });

  console.log('\nBiggest Gainers (vs 7d ago):');
  const gainers = [...results]
    .map(r => ({ ...r, change: r.trends_current - r.trends_7d_ago }))
    .sort((a, b) => b.change - a.change);
  
  gainers.slice(0, 5).forEach((result, index) => {
    const changeSign = result.change > 0 ? '+' : '';
    console.log(`  ${index + 1}. ${result.query.padEnd(30)} - ${changeSign}${result.change} points`);
  });

  console.log('\n💾 Exporting results to JSON...');
  
  // Export results
  fs.writeFileSync(
    'trends_results.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
  
  console.log('✅ Results saved to trends_results.json');
}

// Run the test
runTrendsTest().catch(console.error);

