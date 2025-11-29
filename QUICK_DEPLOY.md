# ⚡ Quick Deploy Guide

**Deploy your AI Resume Builder in 15 minutes using 100% free hosting!**

## 🎯 What You'll Deploy

- **Backend** → Render (free tier)
- **Frontend** → Vercel (free tier)
- **Database** → Your existing MongoDB

---

## 📦 Step 1: Push to GitHub (2 min)

If not already done:

```bash
# Initialize git (if needed)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/ai-resume-builder-hf.git
git push -u origin main
```

---

## 🔧 Step 2: Deploy Backend to Render (5 min)

1. Go to [render.com](https://render.com) → Sign up (free, no credit card)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo → Select your repository
4. Configure:
   - **Name**: `ai-resume-builder-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   HUGGINGFACE_API_KEY=your_api_key
   FRONTEND_URL=(leave blank for now)
   ```
6. Click **"Create Web Service"**
7. Wait 3-5 minutes → Copy your backend URL: `https://your-backend.onrender.com`

---

## 🎨 Step 3: Deploy Frontend to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → Sign up (free, no credit card)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
   (Replace with your actual Render backend URL)
6. Click **"Deploy"**
7. Wait 1-2 minutes → Copy your frontend URL: `https://your-app.vercel.app`

---

## 🔗 Step 4: Connect Frontend to Backend (2 min)

1. Go back to Render dashboard
2. Open your backend service → **"Environment"** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
   (Replace with your actual Vercel frontend URL)
4. Save → Render auto-redeploys

---

## ✅ Step 5: Test (1 min)

1. Visit your frontend: `https://your-app.vercel.app`
2. Test backend: `https://your-backend.onrender.com/health`
3. Try uploading a resume or using AI features

**Done! 🎉**

---

## 📚 Need More Details?

- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting**: See `DEPLOYMENT_GUIDE.md` → Troubleshooting section

---

## ⚠️ Important Notes

1. **Render Free Tier**: Spins down after 15 min inactivity. First request takes ~30 seconds (normal!)
2. **MongoDB**: Make sure IP whitelist allows `0.0.0.0/0` in MongoDB Atlas
3. **Environment Variables**: Double-check all URLs have no trailing slashes

---

## 🆘 Quick Troubleshooting

**CORS Errors?**
- Verify `FRONTEND_URL` in Render matches Vercel URL exactly
- Wait 2-3 minutes after updating env vars

**API Not Connecting?**
- Check `VITE_API_URL` in Vercel is: `https://your-backend.onrender.com/api`
- Verify backend is running (check Render dashboard)

**Backend Slow?**
- Normal! Render free tier spins down. First request wakes it up (~30 sec)

---

**That's it! Your app is now live on the internet for free! 🚀**

