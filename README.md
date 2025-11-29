# 🚀 AI Resume Builder (Hugging Face Edition - 100% FREE)

An intelligent, AI-powered resume building platform that helps users create professional, ATS-friendly resumes with personalized career coaching.

![AI Resume Builder](https://img.shields.io/badge/AI-Powered-blue) ![HuggingFace](https://img.shields.io/badge/HuggingFace-FREE-yellow) ![React](https://img.shields.io/badge/React-18-61DAFB) ![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## 🆓 **COMPLETELY FREE!**

This version uses **Hugging Face's free API** - no credit card, no payment, no limits!
- **Model:** Meta Llama 3.1 70B Instruct (powerful, open-source)
- **Cost:** $0.00 forever
- **Rate Limits:** Generous free tier

## ✨ Features

- **📤 Resume Import** - Upload existing resumes (PDF/DOCX) with AI-powered parsing
- **✍️ Manual Entry** - Build your resume from scratch with an intuitive form
- **🎨 Smart Layout Selection** - Choose from 5 professional templates with AI recommendations
- **🤖 AI Content Generation** - Enhance your resume with AI-optimized content
- **✏️ Interactive Editing** - Real-time preview and editing capabilities
- **💬 AI Career Coach** - Get personalized career advice and resume improvements
- **📥 Multiple Export Formats** - Download as PDF or text file

## 🛠️ Technology Stack

### Frontend
- React 18, Vite, Tailwind CSS, Axios, Lucide React

### Backend
- Node.js, Express, **Hugging Face Inference API**
- Multer (file upload), PDFKit (PDF generation)
- Mammoth.js (DOCX parsing), PDF-Parse (PDF extraction)

### AI Model
- **Meta Llama 3.1 70B Instruct** - Free, powerful, open-source

## 📋 Prerequisites

- **Node.js** (v18 or higher) - Download from https://nodejs.org/
- **Hugging Face Account** (Free) - Sign up at https://huggingface.co/

## ⚡ Quick Start

### Step 1: Get Your FREE Hugging Face API Key

1. Go to https://huggingface.co/
2. Click "Sign Up" (completely free, no credit card)
3. Once logged in, go to https://huggingface.co/settings/tokens
4. Click "New token"
5. Give it a name (like "resume-builder")
6. Select "Read" access
7. Click "Generate"
8. **Copy the token** (starts with `hf_...`)

### Step 2: Extract the Project

1. Extract the downloaded ZIP file
2. You should have a folder called `ai-resume-builder-hf`

### Step 3: Setup Backend

Open **Git Bash** (Windows) or **Terminal** (Mac/Linux) and type:

```bash
# Go to the project folder (adjust path if needed)
cd Desktop/ai-resume-builder-hf

# Go into backend folder
cd backend

# Install dependencies (takes 1-2 minutes)
npm install

# Create environment file
cp .env.example .env
```

### Step 4: Add Your API Key

**Option A - Using Text Editor (Easier):**
1. In the `backend` folder, find `.env.example`
2. Right-click → Open with Notepad (Windows) or TextEdit (Mac)
3. Change this line:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_token_here
   ```
   To:
   ```
   HUGGINGFACE_API_KEY=hf_your_actual_token_here
   ```
4. Save as `.env` (remove `.example`)

**Option B - Using Command Line:**
```bash
# Edit the .env file
nano .env

# Paste your Hugging Face token
# Press Ctrl+X, then Y, then Enter to save
```

### Step 5: Start Backend

```bash
# Make sure you're in the backend folder
npm run dev
```

You should see:
```
🚀 AI Resume Builder Backend (Hugging Face Edition)
📡 Server running on: http://localhost:3001
🔑 API Key configured: ✅ Yes
🤖 AI Model: Meta Llama 3.1 70B (Free)
```

**Keep this window open!**

### Step 6: Setup Frontend

Open a **NEW** Git Bash/Terminal window (keep backend running):

```bash
# Go to the project folder
cd Desktop/ai-resume-builder-hf

# Go into frontend folder
cd frontend

# Install dependencies (takes 1-2 minutes)
npm install

# Start the frontend
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
```

### Step 7: Open in Browser

1. Open your web browser
2. Go to: **http://localhost:5173**
3. Start building your resume! 🎉

## 🎯 How to Use

1. **Get Started** - Click the button on welcome screen
2. **Choose Input Method:**
   - Upload existing resume (PDF/DOCX)
   - Or start from scratch
3. **Review Information** - Check extracted/entered data
4. **Choose Layout** - Select from AI-recommended templates
5. **Generate with AI** - Let AI enhance your content
6. **Edit & Refine** - Make final adjustments
7. **Chat with AI Coach** - Get personalized career advice (click button in header)
8. **Export** - Download as PDF or text file

## 💡 Important Notes

### About Hugging Face Free API

**Advantages:**
- ✅ Completely FREE forever
- ✅ No credit card required
- ✅ Generous rate limits
- ✅ Powerful Llama 3.1 70B model

**Things to Know:**
- May be slightly slower than paid APIs (5-20 seconds per operation)
- If you get rate limited, wait a minute and try again
- Free tier has daily limits (more than enough for personal use)
- Model automatically falls back to faster Mistral 7B if overloaded

### Performance Tips

- Be patient - AI responses take 5-20 seconds (free tier)
- If you see "rate limit" error, wait 60 seconds
- Use during off-peak hours for faster responses
- The AI is smart but may need clarification sometimes

## 🐛 Troubleshooting

### "API Key configured: ❌ No"
- Check that `.env` file exists in `backend/` folder
- Make sure you saved it as `.env` not `.env.example`
- Verify your Hugging Face token is correct

### "AI service temporarily unavailable"
- You hit the rate limit - wait 1 minute
- Or Hugging Face is experiencing high load
- Try again in a moment

### Slow AI responses
- This is normal for free tier (5-20 seconds)
- Hugging Face is processing your request
- Just wait, it will complete

### Backend not starting
- Make sure you ran `npm install`
- Check Node.js is installed: `node --version`
- Make sure port 3001 isn't in use

### Frontend shows errors
- Make sure backend is running (Window 1)
- Check you're on http://localhost:5173
- Look at browser console (F12) for errors

## 📊 What Makes This Different?

### vs. Anthropic (Claude) Version:
| Feature | Hugging Face | Anthropic |
|---------|-------------|-----------|
| Cost | FREE forever | $5 free credits, then paid |
| Speed | 5-20 seconds | 3-10 seconds |
| Quality | Excellent | Slightly better |
| Rate Limits | Generous free tier | Pay as you go |
| Best For | Personal use, testing | Production apps |

## 🔐 Privacy & Security

- ✅ API keys stored in environment variables
- ✅ Files validated before processing
- ✅ No data stored permanently
- ✅ All processing happens on your computer
- ✅ Hugging Face doesn't store your resume data

## 🚀 Future Enhancements

Potential features:
- [ ] User accounts and saved resumes
- [ ] Cover letter generation
- [ ] LinkedIn optimization
- [ ] Job application tracking
- [ ] ATS score checker
- [ ] Multiple resume versions

## 📚 Learn More

- [Hugging Face Documentation](https://huggingface.co/docs)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Llama 3.1 Model Card](https://huggingface.co/meta-llama/Meta-Llama-3.1-70B-Instruct)

## 🆘 Need Help?

**Common Issues:**
1. **Slow responses** - Normal for free tier, be patient
2. **Rate limited** - Wait 60 seconds, try again
3. **API key not working** - Check it's a valid Read token
4. **Backend crashes** - Restart: `npm run dev`

**Still stuck?** Check the troubleshooting section above or the detailed USER_GUIDE.md in the docs folder.

## 🎉 You're All Set!

Enjoy building your perfect resume with **100% FREE AI assistance!**

No credit card. No payment. No limits. Just great resumes. 🚀

---

**Built with ❤️ using open-source AI technology**
