# Polymarket Sentiment Fade Trading Strategy

A comprehensive tool that identifies mispriced Polymarket markets driven by viral hype spikes. The strategy: Buy against public sentiment when hype peaks, sell when sentiment normalizes (2-7 day hold), profit from mean reversion regardless of actual outcome.

## 🎯 Strategy Overview

**Philosophy**: We're not predicting outcomes. We're arbitraging emotional overreactions by trading volatility caused by viral hype spikes. Buy when public panics in, sell when they calm down.

### Core Formula

```
Trade_Score = Hype_Ratio × MRI × Confidence
Hype_Ratio = (SVC × PM × VS) / log(MV + 1) × (1 + OES) × RW
Confidence = min(SVC, PM, MV/10000) × RW
```

### Signal Strength
- **STRONG BUY 🔥** (≥0.50): High-confidence mispricing opportunity
- **MODERATE ⚠️** (≥0.15): Worth investigating
- **WEAK 💤** (≥0.05): Low confidence
- **SKIP 🚫** (<0.05): No significant opportunity

## 🏗️ Architecture

```
User Query → Backend API → PolymarketClient.findClosestEvent() 
           → Fetch Price History → Extract Category → Claude API (search query)
           → Google Trends → Calculate Metrics → Return Analysis → Frontend Display
```

## 📋 Prerequisites

- Node.js v18+ 
- npm or yarn
- Anthropic API Key (for Claude)

## 🚀 Installation

### 1. Clone and Install Dependencies

```bash
# Fix npm cache issues (if needed)
sudo chown -R $(whoami) ~/.npm

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Anthropic API Key (required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=3001

# Optional: Enable debug logging
DEBUG=false
```

Get your Anthropic API key from: https://console.anthropic.com/

## 🎮 Usage

### Running the Application

#### Option 1: Development Mode (Recommended)

Run backend and frontend in separate terminals:

```bash
# Terminal 1: Start backend server
npm run server:dev

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

Then open http://localhost:3000 in your browser.

#### Option 2: Production Build

```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build
cd ..

# Start backend server
npm run server

# Serve frontend (using a static server)
npx serve frontend/dist -p 3000
```

### Using the API Directly

```bash
# Analyze a market
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Trump election 2024"}'

# Health check
curl http://localhost:3001/health

# Get example queries
curl http://localhost:3001/api/examples
```

### Example Queries

- `Trump election 2024`
- `Bitcoin price 100k`
- `Fed rate decision December`
- `Super Bowl winner`
- `Ethereum ETF approval`

## 📊 Metrics Explained

### Raw Data Metrics

1. **Current_Price** - Latest YES price (0-1) from price history
2. **Price_7d_Ago** - Price 7 days ago
3. **Price_24h_Ago** - Price 24 hours ago
4. **Market_Volume** - Sum of all volume over 7 days
5. **Market_Category** - Extracted from tags (politics, sports, crypto, entertainment, other)
6. **Trends_Current** - Google Trends search volume now (0-100)
7. **Trends_7d_Ago** - Google Trends search volume 7 days ago

### Calculated Metrics

8. **SVC** (Search Volume Change) = `(Trends_Current - Trends_7d_Ago) / Trends_7d_Ago`
9. **PM** (Price Movement) = `|Current_Price - Price_7d_Ago| / Price_7d_Ago`
10. **VS** (Velocity Score) = `|Price_24h_Ago - Price_7d_Ago| / |Current_Price - Price_7d_Ago|`
11. **OES** (Odds Extremity Score) = `|Current_Price - 0.50| × 2`
12. **RW** (Recency Weight) = `1.0` if Trends peaked in last 24h, else `0.5`
13. **MRI** (Mean Reversion Indicator) - Mapped by category:
    - politics: 0.8
    - sports: 0.6
    - crypto: 0.9
    - entertainment: 0.7
    - other: 0.7

## 🔧 Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **APIs**: 
  - Polymarket API (market data)
  - Anthropic Claude API (search query extraction)
  - Google Trends API (sentiment data)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

## 📁 Project Structure

```
polyprofitz/
├── src/
│   ├── api/
│   │   └── polymarket.ts          # Polymarket API client
│   ├── services/
│   │   └── market-analysis.ts     # Core analysis logic
│   ├── types/
│   │   ├── polymarket.ts          # Polymarket type definitions
│   │   └── market-analysis.ts     # Analysis type definitions
│   ├── server.ts                  # Express server
│   └── index.ts                   # CLI entry point
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main React component
│   │   ├── main.tsx               # React entry point
│   │   ├── types.ts               # Frontend type definitions
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── data/                          # Stored analysis results
├── dist/                          # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 API Endpoints

### POST /api/analyze
Analyze a Polymarket market by query.

**Request:**
```json
{
  "query": "Trump election 2024"
}
```

**Response:**
```json
{
  "market": {
    "title": "Presidential Election Winner 2024",
    "question": "Will Donald Trump win the 2024 US Presidential Election?",
    "slug": "will-donald-trump-win-the-2024-us-presidential-election",
    "category": "politics",
    "eventSlug": "presidential-election-winner-2024"
  },
  "scores": {
    "tradeScore": 0.82,
    "hypeRatio": 1.45,
    "confidence": 0.67,
    "signal": "STRONG BUY 🔥"
  },
  "metrics": {
    "svc": 6.08,
    "pm": 1.34,
    "vs": 0.74,
    "oes": 0.70,
    "rw": 1.0,
    "mri": 0.8
  },
  "prices": {
    "current": 0.85,
    "sevenDaysAgo": 0.45,
    "twentyFourHoursAgo": 0.72
  },
  "trends": {
    "current": 92,
    "sevenDaysAgo": 13,
    "searchQuery": "Trump election"
  },
  "recommendation": {
    "action": "BUY NO at 85%",
    "targetExit": "Price reverts 50% in 2-4 days",
    "expectedReturn": "41% return"
  },
  "volume": 2500000
}
```

### GET /health
Health check endpoint.

### GET /api/examples
Get example search queries.

## 🐛 Troubleshooting

### npm install fails with permission errors
```bash
sudo chown -R $(whoami) ~/.npm
```

### Backend fails to start
- Check that `.env` file exists with `ANTHROPIC_API_KEY`
- Ensure port 3001 is not in use
- Verify all dependencies are installed

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check Vite proxy configuration in `frontend/vite.config.ts`
- Verify CORS is enabled in backend

### Google Trends API errors
- Google Trends API has rate limits
- If requests fail, the system will return SVC=0 and continue analysis
- Consider adding caching for production use

### No matching market found
- Try different query terms
- Check if market is still active (not closed)
- Verify Polymarket API is accessible

## 🔒 Security Notes

- Keep your `.env` file private (already in `.gitignore`)
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Consider rate limiting in production

## 📈 Future Enhancements

- [ ] Add caching layer for repeated queries
- [ ] Implement historical performance tracking
- [ ] Add portfolio management features
- [ ] Create backtesting framework
- [ ] Add real-time price alerts
- [ ] Implement automated trading (with user approval)
- [ ] Add more visualization charts
- [ ] Support multiple markets comparison
- [ ] Add user authentication and saved searches

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Trading prediction markets involves risk. Past performance does not guarantee future results. Always do your own research and never invest more than you can afford to lose.

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ for the Polymarket community**
