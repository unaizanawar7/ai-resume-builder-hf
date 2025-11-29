# 🚀 Free Hosting Deployment Guide

This guide will help you deploy your AI Resume Builder application to **100% free hosting** using Render (backend) and Vercel (frontend).

## 📋 Prerequisites

- GitHub account (free)
- MongoDB connection string (you mentioned you already have MongoDB)
- Hugging Face API key (or Gemini API key)
- 15-20 minutes

## 🎯 Overview

- **Backend**: Deploy to Render (free tier)
- **Frontend**: Deploy to Vercel (free tier)
- **Database**: Your existing MongoDB

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. **No credit card required!**

### Step 2: Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - If not connected, click **"Connect GitHub"**
   - Authorize Render to access your repositories
   - Select the repository containing this project

### Step 3: Configure Backend Service

Fill in the following settings:

- **Name**: `ai-resume-builder-backend` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: **Free** (select this!)

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your MongoDB connection string |
| `HUGGINGFACE_API_KEY` | Your Hugging Face API key (or leave blank if using Gemini) |
| `GEMINI_API_KEY` | Your Gemini API key (or leave blank if using Hugging Face) |
| `FRONTEND_URL` | Leave blank for now - we'll add this after deploying frontend |

**Important Notes:**
- For MongoDB Atlas: Make sure your IP whitelist includes `0.0.0.0/0` (allows all IPs)
- You only need ONE of `HUGGINGFACE_API_KEY` or `GEMINI_API_KEY`, not both

### Step 5: Deploy Backend

1. Click **"Create Web Service"**
2. Render will start building and deploying your backend
3. Wait 3-5 minutes for the first deployment
4. Once deployed, you'll see a URL like: `https://ai-resume-builder-backend.onrender.com`
5. **Copy this URL** - you'll need it for the frontend!

### Step 6: Test Backend

1. Visit your backend URL: `https://your-backend.onrender.com/health`
2. You should see: `{"status":"ok","message":"AI Resume Builder API is running",...}`
3. If it works, backend is ready! ✅

**Note**: Render's free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds to wake up. This is normal and free!

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. **No credit card required!**

### Step 2: Import Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Select the repository containing this project

### Step 3: Configure Frontend

Vercel will auto-detect Vite, but verify these settings:

- **Framework Preset**: `Vite` (should be auto-detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 4: Add Environment Variable

Before deploying, add this environment variable:

1. In the project settings, find **"Environment Variables"**
2. Click **"Add"**
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com/api`
     - Replace `your-backend.onrender.com` with your actual Render backend URL
   - **Environment**: Production, Preview, Development (select all)

### Step 5: Deploy Frontend

1. Click **"Deploy"**
2. Wait 1-2 minutes for deployment
3. Once deployed, Vercel will give you a URL like: `https://your-app.vercel.app`
4. **Copy this URL** - this is your live website!

### Step 6: Update Backend CORS

Now we need to tell the backend to accept requests from your frontend:

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Add/Update environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-app.vercel.app`
     - Replace with your actual Vercel frontend URL
5. Click **"Save Changes"**
6. Render will automatically redeploy with the new environment variable

---

## Part 3: Test Your Deployment

### Test Checklist

1. ✅ **Frontend loads**: Visit your Vercel URL
2. ✅ **Backend health**: Visit `https://your-backend.onrender.com/health`
3. ✅ **API connection**: Try using the app - upload a resume or use AI features
4. ✅ **File uploads**: Test uploading a resume file
5. ✅ **AI features**: Test the AI Career Coach or content generation

### Troubleshooting

**Problem**: Frontend shows "Cannot connect to API"
- **Solution**: Check that `VITE_API_URL` in Vercel matches your Render backend URL + `/api`
- **Solution**: Check that `FRONTEND_URL` in Render matches your Vercel frontend URL

**Problem**: CORS errors in browser console
- **Solution**: Make sure `FRONTEND_URL` in Render is set to your Vercel URL (without trailing slash)
- **Solution**: Wait a few minutes after updating environment variables for redeploy to complete

**Problem**: Backend takes 30 seconds to respond
- **Solution**: This is normal! Render free tier spins down after 15 minutes. First request wakes it up.

**Problem**: MongoDB connection errors
- **Solution**: Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- **Solution**: Verify `MONGODB_URI` is correct in Render environment variables

---

## 🎉 You're Live!

Your AI Resume Builder is now hosted for free on:
- **Frontend**: Vercel (fast, global CDN)
- **Backend**: Render (free tier with auto spin-down)

### Important Notes

1. **Render Free Tier**: 
   - Spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - This is normal and expected for free hosting

2. **Vercel Free Tier**:
   - Unlimited deployments
   - Global CDN
   - Automatic HTTPS
   - No spin-downs

3. **File Storage**:
   - Uploaded files are stored temporarily on Render
   - Files are lost when Render restarts (ephemeral storage)
   - For production, consider using S3 or Cloudinary

4. **MongoDB**:
   - Your existing MongoDB will work perfectly
   - Make sure IP whitelist allows all IPs (`0.0.0.0/0`)

---

## 🔄 Updating Your Deployment

### Backend Updates

1. Push changes to your GitHub repository
2. Render automatically detects changes and redeploys
3. Check Render dashboard for deployment status

### Frontend Updates

1. Push changes to your GitHub repository
2. Vercel automatically detects changes and redeploys
3. Check Vercel dashboard for deployment status

---

## 📊 Monitoring

- **Render Dashboard**: Monitor backend logs and deployments
- **Vercel Dashboard**: Monitor frontend deployments and analytics
- **Backend Health**: `https://your-backend.onrender.com/health`

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Check logs**: Both platforms provide detailed deployment and runtime logs

---

**Congratulations! Your AI Resume Builder is now live on the internet! 🚀**

