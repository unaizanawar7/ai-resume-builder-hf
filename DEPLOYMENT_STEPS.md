# 🚀 Deployment Steps - Follow This Guide

This document provides step-by-step instructions to deploy your AI Resume Builder application.

## ✅ Step 1: Code Preparation (COMPLETED)

- [x] Code committed and pushed to GitHub
- [x] Build scripts verified
- [x] Repository: `unaizanawar7/ai-resume-builder-hf`

## 📋 Prerequisites Checklist

Before proceeding, ensure you have:

- [ ] **MongoDB Connection String**
  - Local MongoDB: `mongodb://localhost:27017/ai-resume-builder`
  - OR MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
  - For Atlas: Make sure IP whitelist includes `0.0.0.0/0` (allows all IPs)

- [ ] **AI API Key** (choose one):
  - Hugging Face API Key: Get from https://huggingface.co/settings/tokens
  - OR Gemini API Key: Get from https://makersuite.google.com/app/apikey

- [ ] **JWT Secret** (generate a secure random string):
  - You can use: `openssl rand -base64 32` (in terminal)
  - OR use an online generator: https://randomkeygen.com/

---

## 🔧 Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. **No credit card required!**

### 2.2 Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - If not connected, click **"Connect GitHub"**
   - Authorize Render to access your repositories
   - Select: `unaizanawar7/ai-resume-builder-hf`

### 2.3 Configure Backend Service

Fill in these settings:

- **Name**: `ai-resume-builder-backend` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: **Free** (select this!)

### 2.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Required for Render |
| `MONGODB_URI` | Your MongoDB connection string | From prerequisites |
| `HUGGINGFACE_API_KEY` | Your Hugging Face token | OR use GEMINI_API_KEY |
| `GEMINI_API_KEY` | Your Gemini API key | OR use HUGGINGFACE_API_KEY |
| `JWT_SECRET` | Your secure random string | From prerequisites |
| `FRONTEND_URL` | _(leave blank for now)_ | Add after frontend deploy |

**Important:**
- You only need ONE of `HUGGINGFACE_API_KEY` or `GEMINI_API_KEY`, not both
- Leave `FRONTEND_URL` blank - we'll add it after deploying frontend

### 2.5 Deploy Backend

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for the first deployment
3. Once deployed, you'll see a URL like: `https://ai-resume-builder-backend.onrender.com`
4. **Copy this URL** - you'll need it for the frontend!

### 2.6 Test Backend

1. Visit: `https://your-backend.onrender.com/health`
2. You should see: `{"status":"ok","message":"AI Resume Builder API is running",...}`
3. If it works, backend is ready! ✅

**Note**: Render's free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds to wake up. This is normal!

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. **No credit card required!**

### 3.2 Import Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Select: `unaizanawar7/ai-resume-builder-hf`

### 3.3 Configure Frontend

Vercel will auto-detect Vite, but verify these settings:

- **Framework Preset**: `Vite` (should be auto-detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3.4 Add Environment Variable

**Before deploying**, add this environment variable:

1. In the project settings, find **"Environment Variables"**
2. Click **"Add"**
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com/api`
     - Replace `your-backend.onrender.com` with your actual Render backend URL from Step 2.5
   - **Environment**: Production, Preview, Development (select all three)

### 3.5 Deploy Frontend

1. Click **"Deploy"**
2. Wait 1-2 minutes for deployment
3. Once deployed, Vercel will give you a URL like: `https://your-app.vercel.app`
4. **Copy this URL** - this is your live website!

---

## 🔗 Step 4: Connect Frontend to Backend

### 4.1 Update Backend CORS

Now we need to tell the backend to accept requests from your frontend:

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Find `FRONTEND_URL` environment variable
5. Update the value to: `https://your-app.vercel.app`
   - Replace with your actual Vercel frontend URL from Step 3.5
6. Click **"Save Changes"**
7. Render will automatically redeploy with the new environment variable
8. Wait 2-3 minutes for redeploy to complete

---

## ✅ Step 5: Testing & Verification

### 5.1 Backend Tests

- [ ] Health endpoint: `https://your-backend.onrender.com/health` returns OK
- [ ] API root: `https://your-backend.onrender.com/` returns API info
- [ ] Check Render logs for errors (should be clean)

### 5.2 Frontend Tests

- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] No console errors in browser (press F12 to check)
- [ ] Test API connection (try login/signup or upload feature)

### 5.3 Integration Tests

- [ ] Upload resume file works
- [ ] AI features work (Career Coach, content generation)
- [ ] Resume export (PDF) works
- [ ] No CORS errors in browser console

---

## 🎉 Success!

Your AI Resume Builder is now live on the internet!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

## 🆘 Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in Render matches Vercel URL exactly (no trailing slash)
- Wait 2-3 minutes after updating environment variables

### API Not Connecting
- Check `VITE_API_URL` in Vercel is: `https://your-backend.onrender.com/api`
- Verify backend is running (check Render dashboard)

### Backend Slow
- Normal! Render free tier spins down. First request wakes it up (~30 seconds)

### MongoDB Connection Errors
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify `MONGODB_URI` is correct in Render

---

## 📚 Additional Resources

- **Detailed Guide**: See `DEPLOYMENT_GUIDE.md`
- **Quick Reference**: See `QUICK_DEPLOY.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`

---

**Need help?** Check the troubleshooting section or review the detailed guides in the docs folder.

