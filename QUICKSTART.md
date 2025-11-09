# 🚀 Quick Start Guide

Get up and running with the Polymarket Sentiment Fade Strategy in 5 minutes.

## Prerequisites

- Node.js v18 or higher
- npm (comes with Node.js)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Installation

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

### Option 2: Manual Setup

```bash
# Fix npm cache issues (if needed)
sudo chown -R $(whoami) ~/.npm

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create .env file
cp .env.example .env
# Then edit .env and add your ANTHROPIC_API_KEY
```

## Configuration

Edit the `.env` file in the root directory:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Your Anthropic API key
PORT=3001                        # Backend port (optional)
```

## Running the Application

### Start Backend Server

```bash
npm run server:dev
```

You should see:
```
🚀 Polymarket Sentiment Fade Server running on port 3001
   Health check: http://localhost:3001/health
   Analysis API: http://localhost:3001/api/analyze
```

### Start Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Access the Application

Open your browser to: **http://localhost:3000**

## Your First Analysis

1. Enter a query like: `Trump election 2024`
2. Click "Analyze"
3. Wait 5-10 seconds for the analysis to complete
4. View the trading signal and metrics!

## Example Queries

Try these queries to see the system in action:

- `Trump election 2024` - Politics market
- `Bitcoin 100k` - Crypto market
- `Fed rate December` - Economics market
- `Super Bowl winner` - Sports market
- `Ethereum ETF` - Crypto/regulatory market

## Understanding the Results

### Signal Strength
- 🔥 **STRONG BUY** (≥0.50): High-confidence opportunity
- ⚠️ **MODERATE** (≥0.15): Worth investigating
- 💤 **WEAK** (≥0.05): Low confidence
- 🚫 **SKIP** (<0.05): No opportunity

### Key Metrics
- **Trade Score**: Overall opportunity strength (higher is better)
- **Google Trends**: Search volume change (measures hype)
- **Price Movement**: 7-day price change (measures volatility)
- **Velocity Score**: How fast the price moved
- **Odds Extremity**: How far from 50/50 (extreme = overreaction)

## API Usage

You can also use the API directly:

```bash
# Analyze a market
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Trump election 2024"}'

# Health check
curl http://localhost:3001/health
```

## Troubleshooting

### "No matching market found"
- Try different search terms
- Check if the market is still active on Polymarket.com
- Use more specific keywords

### Backend won't start
- Verify `.env` has `ANTHROPIC_API_KEY` set
- Check port 3001 is not in use: `lsof -i :3001`
- Check backend logs for errors

### Frontend can't connect
- Ensure backend is running on port 3001
- Check browser console for errors
- Try refreshing the page

### Google Trends errors
- This is normal - Google Trends has rate limits
- The system will continue with SVC=0 if Trends fails
- Wait a few minutes and try again

## Next Steps

1. **Read the Strategy**: Check out the [full documentation](README.md) to understand the trading philosophy
2. **Analyze Markets**: Try different markets and compare signals
3. **Track Performance**: Keep notes on your analyses and actual market outcomes
4. **Customize**: Modify the metrics or add new features

## Production Deployment

For production use:

```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build

# Start production server
npm run server

# Serve frontend with a static server
npx serve frontend/dist -p 3000
```

Consider adding:
- Nginx or Apache for production serving
- PM2 for process management
- Redis for caching
- Rate limiting
- User authentication

## Support

- 📖 Full documentation: [README.md](README.md)
- 🐛 Issues: Open an issue on GitHub
- 💬 Questions: Check the documentation first

---

**Happy trading! Remember: This is for educational purposes. Always DYOR! 🎯**

