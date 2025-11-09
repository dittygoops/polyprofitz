# PolyProfitz

CLI tool for fetching and storing Polymarket event data for analysis, modeling, and comparison.

## Features

- **Smart Event Search**: Search by event name with automatic slug conversion - no need to format slugs manually
- **Fuzzy Matching**: Finds closest matching events even with partial names
- **Interactive Price Charts**: Automatically generates HTML plots with Plotly.js for data visualization
- Fetch comprehensive market data from Polymarket API
- Retrieve price history for all market outcomes (CLOB API integration)
- Get market tags/categories for each event
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

Fetch all data for an event by name or slug. The tool automatically handles formatting:

```bash
npm run dev -- fetch-event <event-name>
```

**Examples (all formats work):**

```bash
# Natural language with spaces
npm run dev -- fetch-event "Presidential Election Winner 2024"

# Slug format
npm run dev -- fetch-event presidential-election-winner-2024

# Partial matches (uses fuzzy search)
npm run dev -- fetch-event "NBA Competitor" --status active

# Special characters are auto-removed
npm run dev -- fetch-event "Trump Election!!!"
```

### Options

- `-s, --start-date <date>` - Start date for historical data (ISO format or common date format)
- `-e, --end-date <date>` - End date for historical data (ISO format or common date format)
- `-o, --output <path>` - Output directory for JSON file (default: `./data`)
- `--status <status>` - Market status filter: `active`, `closed`, `resolved`, or `archived` (default: `resolved`)

**Examples with options:**

```bash
# Fetch resolved (older/completed) events - this is the default
npm run dev -- fetch-event "Presidential Election" --status resolved

# Fetch active (ongoing) events
npm run dev -- fetch-event "NBA Competitor" --status active

# Fetch data from a specific date range
npm run dev -- fetch-event presidential-election-2024 -s "2024-01-01" -e "2024-12-31"

# Custom output directory
npm run dev -- fetch-event "Presidential Election" -o ./my-data

# Combine options: resolved market with date range and custom output
npm run dev -- fetch-event "Presidential Election 2024" --status resolved -s "2024-01-01" -e "2024-12-31" -o ./data
```

### Build and Run (Production)

```bash
# Build the project
npm run build

# Run the compiled version
npm start fetch-event "Presidential Election 2024"
```

## Output Format

The tool saves data to JSON files with the following structure:

```json
{
  "market": {
    "id": "253591",
    "question": "Will Donald Trump win the 2024 US Presidential Election?",
    "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
    "slug": "will-donald-trump-win-the-2024-us-presidential-election",
    "description": "Market description...",
    "outcomes": "[\"Yes\", \"No\"]",
    "volume": "1531479284.504353",
    "closed": true,
    "clobTokenIds": "[\"21742633143463906290569050155826241533067272736897614950488156847949938836455\", \"48331043336612883890938759509493159234755048973500640148014422747788308965732\"]",
    "tags": [
      {
        "id": "126",
        "label": "Trump",
        "slug": "trump"
      },
      {
        "id": "2",
        "label": "Politics",
        "slug": "politics"
      }
    ]
  },
  "tokens": [
    {
      "tokenId": "21742633143463906290569050155826241533067272736897614950488156847949938836455",
      "outcome": "Yes",
      "priceHistory": [
        { "t": 1704412803, "p": 0.5 },
        { "t": 1704456003, "p": 0.405 }
      ],
      "trades": [],
      "volumeMetrics": {
        "total_volume": "0",
        "trade_count": 0
      }
    }
  ],
  "fetchedAt": "2025-01-08T16:02:06.000Z",
  "timeRange": {
    "start": null,
    "end": null
  }
}
```

### Key Fields

- **market.tags**: Array of category/tag objects with id, label, and slug
- **market.clobTokenIds**: Token IDs used for price history queries
- **tokens[].priceHistory**: Time-series price data (t = Unix timestamp, p = price 0-1)
- **fetchedAt**: Timestamp when data was retrieved
- **timeRange**: Date range used for filtering (null = all historical data)

## File Naming

Output files are automatically named with the format:

**JSON Data:**
```
<market-slug>_<timestamp>.json
```
Example: `trump-2024-election_2024-01-15_14-30-45.json`

**HTML Plots:**
```
<market-slug>_<timestamp>_plot.html
```
Example: `trump-2024-election_2024-01-15T14-30-45_plot.html`

Open the HTML file in any web browser to view an interactive price chart with:
- Multiple outcome traces (e.g., "Yes" vs "No")
- Hover-over tooltips showing exact prices and timestamps
- Zoom and pan controls
- Market metadata (ID, status, tags, volume, etc.)

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
│       ├── storage.ts        # JSON file storage utilities
│       └── plot.ts           # Price chart generation
├── data/                     # Default output directory (JSON + HTML)
├── package.json
└── tsconfig.json
```

## How It Works

### Search Strategy

1. **Exact Slug Match**: Tries the input as-is first
2. **Auto-Slugify**: Converts input to slug format (lowercase, hyphens, no special chars)
3. **Fuzzy Search**: Searches all events and returns closest match based on title/slug similarity

### API Endpoints Used

**Gamma API** (`https://gamma-api.polymarket.com`):
- `GET /events/slug/{slug}` - Get event by exact slug
- `GET /events` - Search/list events with filters
- `GET /markets/{id}` - Get detailed market information
- `GET /markets/{id}/tags` - Get market categories/tags

**CLOB API** (`https://clob.polymarket.com`):
- `GET /prices-history` - Fetch historical price data with fidelity controls

## Requirements

- Node.js 16+
- npm or yarn

## License

MIT
