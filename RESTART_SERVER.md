# 🔄 Restart Server Instructions

## ✅ TypeScript Configuration Fixed

I've updated `tsconfig.json` to properly include the type declarations for `google-trends-api`.

## 🔄 Restart the Server

### Option 1: Type 'rs' in the running terminal

In the terminal where `npm run server:dev` is running, just type:
```
rs
```
and press Enter. This will restart nodemon.

### Option 2: Stop and Restart

1. Press `Ctrl+C` to stop the server
2. Run again:
```bash
npm run server:dev
```

### Option 3: If nodemon auto-restarted

The server should have automatically detected the `tsconfig.json` change and restarted. 

Look for:
```
[nodemon] restarting due to changes...
[nodemon] starting `ts-node src/server.ts`
🚀 Polymarket Sentiment Fade Server running on port 3001
```

## ✅ Expected Output

When working correctly, you should see:

```
[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/*
[nodemon] watching extensions: ts,json
[nodemon] starting `ts-node src/server.ts`
🚀 Polymarket Sentiment Fade Server running on port 3001
   Health check: http://localhost:3001/health
   Analysis API: http://localhost:3001/api/analyze

📊 Ready to analyze markets!
```

## 🐛 If Still Getting Errors

If you still see the `google-trends-api` error, try:

```bash
# Stop the server (Ctrl+C)

# Clean build
rm -rf dist node_modules/.cache

# Restart
npm run server:dev
```

## 📝 What Was Fixed

1. ✅ Added `typeRoots` to include `src/types` directory
2. ✅ Added `ts-node` configuration for proper file resolution
3. ✅ Type declaration file for `google-trends-api` is in place

The server should now start successfully! 🚀

