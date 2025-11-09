# Installation Instructions

## Issue Fixed ✅

The `google-trends-api` version has been corrected from `^5.1.0` to `^4.3.3` in `package.json`.

## Installation Steps

### Step 1: Fix npm Cache Permissions

Run this command in your terminal:

```bash
sudo chown -R $(whoami) /Users/apgupta/.npm
```

Or if you know your user ID:

```bash
sudo chow -R 501:20 "/Users/apgupta/.npm"
```

### Step 2: Install Backend Dependencies

```bash
cd /Users/apgupta/Documents/Coding/polyprofitz
npm install
```

This should now work! You'll see packages being installed including:
- @anthropic-ai/sdk
- express
- cors
- dotenv
- google-trends-api (correct version 4.3.3)
- And all other dependencies

### Step 3: Set Up Environment Variables

Create a `.env` file:

```bash
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3001
DEBUG=false
EOF
```

Then edit `.env` and replace `your_anthropic_api_key_here` with your actual API key from https://console.anthropic.com/

### Step 4: Build the Backend

```bash
npm run build
```

### Step 5: Start the Backend Server

```bash
npm run server:dev
```

You should see:
```
🚀 Polymarket Sentiment Fade Server running on port 3001
   Health check: http://localhost:3001/health
   Analysis API: http://localhost:3001/api/analyze

📊 Ready to analyze markets!
```

### Step 6: Start the Frontend (Already Working! ✅)

In a new terminal:

```bash
cd /Users/apgupta/Documents/Coding/polyprofitz/frontend
npm run dev
```

**Note:** Your frontend is already installed and runs on port **5173** (Vite's default), not 3000.

Access it at: **http://localhost:5173**

### Step 7: Update Vite Config (Optional)

If you want the frontend on port 3000, edit `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // Changed from default 5173
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

## Quick Commands Summary

```bash
# Fix npm permissions
sudo chown -R $(whoami) /Users/apgupta/.npm

# Install backend
cd /Users/apgupta/Documents/Coding/polyprofitz
npm install

# Create .env (then edit it)
cp ENV_SETUP.txt .env

# Start backend
npm run server:dev

# Start frontend (in new terminal)
cd frontend
npm run dev
```

## Verification

### Test Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-09T..."}
```

### Test Analysis API

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Trump election 2024"}'
```

Expected: Full analysis JSON with trade score, signals, etc.

### Test Frontend

Open browser to:
- http://localhost:5173 (or http://localhost:3000 if you changed the port)

Try query: **"Trump election 2024"**

## Troubleshooting

### Backend won't start
- Check `.env` file has valid `ANTHROPIC_API_KEY`
- Run `npm run build` first
- Check port 3001 isn't in use: `lsof -i :3001`

### Frontend can't connect to backend
- Make sure backend is running on port 3001
- Check proxy in `frontend/vite.config.ts`
- Check browser console for errors

### Google Trends fails
- Normal - has rate limits
- System continues with SVC=0
- Wait a few minutes and try again

## Success! 🎉

Once both servers are running:
1. Backend: http://localhost:3001
2. Frontend: http://localhost:5173 (or 3000)

You can now analyze Polymarket markets for sentiment fade opportunities!

