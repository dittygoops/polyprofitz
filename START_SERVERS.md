# 🚀 Start the Application

## ✅ Setup Complete!

All dependencies are installed and the code is compiled successfully.

## 🔑 Configure API Key (Required)

Before starting the servers, you need to add your Anthropic API key:

1. Edit the `.env` file:
   ```bash
   nano .env
   # or use your preferred editor: code .env, vim .env, etc.
   ```

2. Replace `your_anthropic_api_key_here` with your actual API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
   ```

3. Get your API key from: **https://console.anthropic.com/**

## 🎮 Start the Servers

### Option 1: Two Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd /Users/apgupta/Documents/Coding/polyprofitz
npm run server:dev
```

Expected output:
```
🚀 Polymarket Sentiment Fade Server running on port 3001
   Health check: http://localhost:3001/health
   Analysis API: http://localhost:3001/api/analyze

📊 Ready to analyze markets!
```

**Terminal 2 - Frontend:**
```bash
cd /Users/apgupta/Documents/Coding/polyprofitz/frontend
npm run dev
```

Expected output:
```
  VITE v5.4.21  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Option 2: Background Processes

```bash
# Start backend in background
cd /Users/apgupta/Documents/Coding/polyprofitz
npm run server:dev &

# Start frontend in background
cd frontend
npm run dev &

# To stop them later:
# pkill -f "server:dev"
# pkill -f "vite"
```

## 🌐 Access the Application

**Frontend:** http://localhost:5173

**Backend API:** http://localhost:3001

## 🧪 Test the Setup

### 1. Test Backend Health
```bash
curl http://localhost:3001/health
```

Expected:
```json
{"status":"ok","timestamp":"2025-11-09T..."}
```

### 2. Test Analysis API
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Trump election 2024"}'
```

Expected: Full analysis JSON response

### 3. Test Frontend
1. Open http://localhost:5173
2. Enter query: **"Trump election 2024"**
3. Click "Analyze"
4. Wait 5-10 seconds
5. See the complete analysis!

## 📊 Example Queries to Try

- `Trump election 2024` - Politics market
- `Bitcoin 100k` - Crypto market
- `Fed rate December` - Economics market
- `Super Bowl winner` - Sports market
- `Ethereum ETF` - Regulatory market

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if .env has API key
cat .env | grep ANTHROPIC_API_KEY

# Check if port 3001 is in use
lsof -i :3001

# View error logs
tail -f ~/.npm/_logs/*.log
```

### Frontend can't connect to backend
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check proxy in `frontend/vite.config.ts`
3. Check browser console (F12) for errors

### "No matching market found"
- Try different search terms
- Use more specific keywords
- Check if market is active on Polymarket.com

### Google Trends fails
- Normal - has rate limits
- System continues with SVC=0
- Wait a few minutes and try again

## 🎯 Quick Start Command Sequence

```bash
# 1. Edit .env and add API key
nano .env

# 2. Start backend (Terminal 1)
npm run server:dev

# 3. Start frontend (Terminal 2 - new terminal)
cd frontend && npm run dev

# 4. Open browser
open http://localhost:5173
```

## 🎉 You're All Set!

Both servers should now be running:
- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:5173

Start analyzing markets for sentiment fade opportunities! 🚀

---

**Strategy Reminder:** Buy against public sentiment when hype peaks, sell when sentiment normalizes. We're not predicting outcomes—we're arbitraging emotional overreactions! 💡

