# PolyProfitz - Google Trends Analysis for Prediction Markets

This project fetches Google Trends data to analyze search interest for topics related to Polymarket prediction markets.

## Features

- ✅ Fetch current Google Trends search volume (0-100)
- ✅ Fetch Google Trends search volume from 7 days ago (0-100)
- ✅ Compare trends over time to identify gainers/losers
- ✅ Test queries related to popular prediction market topics

## Setup

1. Install dependencies:

```bash
npm install
```

## Usage

### Quick Start (Mock Data)

The script comes with mock data enabled by default for quick testing:

```bash
npm run test:trends
```

### Using Real Google Trends Data

To use real Google Trends data:

1. Open `google_trends_test.ts`
2. Change `USE_MOCK_DATA = true` to `USE_MOCK_DATA = false` (around line 115)
3. Run the script:

```bash
npm run test:trends
```

**Note**: Real API calls are rate-limited (2 seconds between requests) to avoid being blocked by Google.

## Test Queries

The script tests the following prediction market-related queries:

- `elon musk dogecoin`
- `trump election`
- `bitcoin price`
- `ethereum merge`
- `fed interest rate`
- `taylor swift`
- `world cup 2024`
- `presidential debate`
- `stock market crash`
- `ai artificial intelligence`

## Output

The script provides:

1. **Console output** with current trends, 7-day trends, and changes
2. **JSON export** (`trends_results.json`) with detailed results

Example output:

```
🔍 Google Trends Test - Prediction Market Queries

================================================================================

Testing query: "elon musk dogecoin"
  Current:  65/100
  7d ago:   58/100
  Change:   +7 (12.1%) 📈

...

📊 Summary of Results:

Top Trending Now:
  1. bitcoin price              - 78/100
  2. elon musk dogecoin          - 65/100
  ...

Biggest Gainers (vs 7d ago):
  1. trump election              - +15 points
  2. elon musk dogecoin          - +7 points
  ...
```

## API Alternatives

The script includes two methods for fetching Google Trends data:

1. **google-trends-api package** (recommended) - More reliable and easier to use
2. **Direct API calls** - Using unofficial Google Trends endpoints

## Customization

To add your own test queries, edit the `TEST_QUERIES` array in `google_trends_test.ts`:

```typescript
const TEST_QUERIES = [
  'your custom query',
  'another query',
  // ...
];
```

## Data Structure

Each result includes:

```typescript
{
  query: string;              // Search query
  trends_current: number;     // Current search volume (0-100)
  trends_7d_ago: number;      // Search volume 7 days ago (0-100)
  timestamp: string;          // When data was fetched
}
```

## Rate Limiting

When using real API calls, the script automatically waits 2 seconds between requests to respect Google's rate limits.

## Troubleshooting

If you encounter API errors:
1. Enable mock data for testing: `USE_MOCK_DATA = true`
2. Check your internet connection
3. Ensure you're not making too many requests (rate limiting)
4. Consider using a VPN if Google is blocking requests

## License

ISC

