# PolyProfitz

CLI tool for fetching and storing Polymarket event data for analysis, modeling, and comparison.

## Features

- Fetch comprehensive market data from Polymarket API
- Retrieve price history for all market outcomes
- Collect trade data with volume metrics
- Filter markets by status (resolved, active, closed, archived)
- Filter data by custom date ranges
- Export data to structured JSON files
- TypeScript support with full type definitions

## Installation

```bash
npm install
```

## Usage

### Fetch Event Data

Fetch all data for a market by its slug:

```bash
npm run fetch <market-slug>
```

**Example:**

```bash
npm run fetch trump-2024-election
```

### Options

- `-s, --start-date <date>` - Start date for historical data (ISO format or common date format)
- `-e, --end-date <date>` - End date for historical data (ISO format or common date format)
- `-o, --output <path>` - Output directory for JSON file (default: `./data`)
- `--status <status>` - Market status filter: `active`, `closed`, `resolved`, or `archived` (default: `resolved`)

**Examples with options:**

```bash
# Fetch resolved (older/completed) events - this is the default
npm run fetch trump-2024-election --status resolved

# Fetch active (ongoing) events
npm run fetch presidential-election-2024 --status active

# Fetch data from a specific date range for resolved markets
npm run fetch trump-2024-election --start-date "2024-01-01" --end-date "2024-12-31"

# Custom output directory
npm run fetch trump-2024-election --output ./my-data

# Combine options: resolved market with date range and custom output
npm run fetch trump-2024-election --status resolved -s "2024-01-01" -e "2024-12-31" -o ./custom-output
```

### Using with ts-node (Development)

```bash
npm run dev fetch-event trump-2024-election
```

### Build and Run

```bash
# Build the project
npm run build

# Run the compiled version
npm start fetch-event trump-2024-election
```

## Output Format

The tool saves data to JSON files with the following structure:

```json
{
  "market": {
    "id": "...",
    "question": "...",
    "market_slug": "...",
    "end_date_iso": "...",
    "volume": "...",
    "tokens": [...]
  },
  "tokens": [
    {
      "tokenId": "...",
      "outcome": "Yes/No",
      "priceHistory": [
        { "t": 1234567890, "p": "0.65" }
      ],
      "trades": [
        {
          "id": "...",
          "price": "0.65",
          "size": "100",
          "timestamp": 1234567890,
          "side": "BUY"
        }
      ],
      "volumeMetrics": {
        "total_volume": "12345.67",
        "trade_count": 456,
        "volume_by_hour": {...},
        "volume_by_day": {...}
      }
    }
  ],
  "fetchedAt": "2024-01-01T00:00:00.000Z",
  "timeRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-12-31T23:59:59.999Z"
  }
}
```

## File Naming

Output files are automatically named with the format:
```
<market-slug>_<timestamp>.json
```

Example: `trump-2024-election_2024-01-15_14-30-45.json`

## Project Structure

```
polyprofitz/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/
│   │   └── fetch-event.ts    # Event fetching command
│   ├── api/
│   │   └── polymarket.ts     # Polymarket API client
│   ├── types/
│   │   └── polymarket.ts     # TypeScript type definitions
│   └── utils/
│       ├── time.ts           # Date/time utilities
│       └── storage.ts        # JSON file storage utilities
├── data/                     # Default output directory
├── package.json
└── tsconfig.json
```

## API Endpoints Used

- `GET /markets` - Search for markets by slug
- `GET /markets/{id}` - Get detailed market information
- `GET /prices-history` - Fetch historical price data
- `GET /data/trades` - Retrieve trade history

## Requirements

- Node.js 16+
- npm or yarn

## License

MIT
