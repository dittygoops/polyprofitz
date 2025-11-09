#!/bin/bash

# Polymarket Sentiment Fade Strategy - Setup Script

echo "🚀 Setting up Polymarket Sentiment Fade Trading Strategy..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Fix npm cache permissions if needed
echo "🔧 Checking npm cache permissions..."
if [ ! -w "$HOME/.npm" ]; then
    echo "⚠️  npm cache has permission issues. Fixing..."
    sudo chown -R $(whoami) "$HOME/.npm" 2>/dev/null || echo "   (skipped - may require manual fix)"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Creating .env file..."
    cat > .env << EOL
# Anthropic API Key (required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=3001

# Optional: Enable debug logging
DEBUG=false
EOL
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Anthropic API key!"
    echo "   Get your key from: https://console.anthropic.com/"
    echo ""
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..
echo "✅ Frontend dependencies installed"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "⚠️  Build warnings (this is usually okay)"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env and add your ANTHROPIC_API_KEY"
echo "   2. Start the backend: npm run server:dev"
echo "   3. In another terminal, start the frontend: cd frontend && npm run dev"
echo "   4. Open http://localhost:3000 in your browser"
echo ""
echo "🎯 For more information, see README.md"
echo ""

