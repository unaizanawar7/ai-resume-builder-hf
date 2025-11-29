# 🚀 Google Gemini Setup (FREE AI)

## Why Gemini?
- ✅ **Completely FREE** - No credit card required
- ✅ **Generous limits** - 60 requests/minute
- ✅ **High quality** - Comparable to GPT-3.5
- ✅ **Fast responses** - Real-time AI features
- ✅ **Easy setup** - Get your key in 2 minutes!

## Quick Setup (2 Minutes)

### Step 1: Get Your FREE Gemini API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Click **"Create API key in new project"** (or select existing project)
5. **Copy** your API key (looks like: `AIzaSyAbc123...`)

### Step 2: Add API Key to Your Project

1. Open (or create) `backend/.env` file
2. Add your API key:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Google Gemini AI Configuration
GEMINI_API_KEY=AIzaSyAbc123...paste_your_key_here...
```

3. Save the file

### Step 3: Restart Backend (if running)

```bash
# Stop the backend (Ctrl+C) and restart:
cd backend
npm run dev
```

You should see:
```
🚀 AI Resume Builder Backend (Google Gemini Edition)
📡 Server running on: http://localhost:3001
🔑 API Key configured: ✅ Yes
🤖 AI Model: Google Gemini 1.5 Flash (Free)
```

## ✨ What Works Now?

All AI features are now fully functional:

1. **📄 Resume Parsing** - Extract info from uploaded PDFs/DOCX
2. **🎨 Smart Layout Recommendations** - AI suggests best layout
3. **✨ Content Optimization** - Improves bullets with action verbs & metrics
4. **💬 AI Career Coach** - Get real career advice
5. **🎯 ATS Optimization** - Keywords and formatting

## 🎯 Rate Limits

Gemini Free Tier:
- **60 requests per minute**
- **1,500 requests per day**
- **1 million requests per month**

More than enough for personal use!

## 🔐 Security

Your API key is:
- ✅ Stored locally in `.env` (never committed to git)
- ✅ Only used on your local backend
- ✅ Never exposed to the frontend

## 🆘 Troubleshooting

### "API Key not configured"

1. Make sure `.env` file is in the `backend/` folder
2. Check that `GEMINI_API_KEY=` is set (no quotes needed)
3. Restart the backend server

### "API Error"

1. Verify your key at: https://makersuite.google.com/app/apikey
2. Make sure you copied the entire key
3. Check your internet connection

### Still not working?

1. The `.env` file should be in `backend/` folder, NOT the root
2. Make sure there are no extra spaces or quotes around the key
3. Restart the backend completely (Ctrl+C then `npm run dev`)

## 📚 Resources

- Gemini API Docs: https://ai.google.dev/docs
- Get API Key: https://makersuite.google.com/app/apikey
- Rate Limits: https://ai.google.dev/pricing

---

**That's it! Your AI Resume Builder now has real, FREE AI! 🎉**

