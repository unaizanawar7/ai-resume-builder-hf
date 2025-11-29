#!/bin/bash

# AI Resume Builder - Quick Setup Script
# This script automates the setup process

echo "🚀 AI Resume Builder - Quick Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Created .env file. Please edit it and add your Anthropic API key!"
    echo ""
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi

echo "✅ Backend setup complete"
echo ""

# Setup Frontend
echo "📦 Setting up frontend..."
cd ../frontend

npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi

echo "✅ Frontend setup complete"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo "===================="
echo ""
echo "⚠️  IMPORTANT: Edit backend/.env and add your Anthropic API key"
echo "   Get your API key from: https://console.anthropic.com/"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Happy resume building! ✨"
