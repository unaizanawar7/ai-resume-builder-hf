# 🚀 Deployment Checklist

Use this checklist to ensure everything is set up correctly before and after deployment.

## Pre-Deployment

### Backend Preparation
- [ ] Backend `package.json` has `start` script: `"start": "node src/server.js"`
- [ ] Backend CORS configured to use `FRONTEND_URL` environment variable
- [ ] MongoDB connection string ready
- [ ] Hugging Face or Gemini API key ready
- [ ] Code pushed to GitHub repository

### Frontend Preparation
- [ ] Frontend `package.json` has `build` script: `"build": "vite build"`
- [ ] Frontend uses `VITE_API_URL` environment variable (already configured in `src/services/api.js`)
- [ ] Code pushed to GitHub repository

---

## Render (Backend) Setup

### Account & Service
- [ ] Render account created (render.com)
- [ ] GitHub repository connected to Render
- [ ] New Web Service created
- [ ] Service name: `ai-resume-builder-backend` (or your choice)

### Configuration
- [ ] Environment: `Node`
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Plan: **Free**

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGODB_URI` = Your MongoDB connection string
- [ ] `HUGGINGFACE_API_KEY` or `GEMINI_API_KEY` = Your API key
- [ ] `FRONTEND_URL` = (Leave blank initially, add after frontend deploy)

### Deployment
- [ ] Backend deployed successfully
- [ ] Backend URL obtained: `https://your-backend.onrender.com`
- [ ] Health check works: Visit `/health` endpoint
- [ ] Backend logs show no errors

---

## Vercel (Frontend) Setup

### Account & Project
- [ ] Vercel account created (vercel.com)
- [ ] GitHub repository imported to Vercel
- [ ] Project created

### Configuration
- [ ] Framework Preset: `Vite` (auto-detected)
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build` (auto-detected)
- [ ] Output Directory: `dist` (auto-detected)

### Environment Variables
- [ ] `VITE_API_URL` = `https://your-backend.onrender.com/api`
  - Replace `your-backend.onrender.com` with your actual Render backend URL
- [ ] Environment: Production, Preview, Development (all selected)

### Deployment
- [ ] Frontend deployed successfully
- [ ] Frontend URL obtained: `https://your-app.vercel.app`
- [ ] Frontend loads without errors

---

## Post-Deployment Configuration

### Update Backend CORS
- [ ] Go back to Render dashboard
- [ ] Update `FRONTEND_URL` environment variable
- [ ] Set value to: `https://your-app.vercel.app` (your Vercel URL)
- [ ] Save changes (triggers automatic redeploy)

---

## Testing

### Backend Tests
- [ ] Health endpoint: `https://your-backend.onrender.com/health` returns OK
- [ ] API root: `https://your-backend.onrender.com/` returns API info
- [ ] No errors in Render logs

### Frontend Tests
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] No console errors in browser
- [ ] API connection works (test a feature that calls backend)

### Integration Tests
- [ ] Upload resume file works
- [ ] AI features work (Career Coach, content generation)
- [ ] Resume export (PDF) works
- [ ] User authentication works (if using)
- [ ] No CORS errors in browser console

---

## Troubleshooting

### If Backend Takes 30+ Seconds to Respond
- ✅ **Normal for Render free tier** - spins down after 15 min inactivity
- First request wakes it up (~30 seconds)
- Subsequent requests are fast

### If CORS Errors Appear
- [ ] Check `FRONTEND_URL` in Render matches Vercel URL exactly
- [ ] No trailing slash in `FRONTEND_URL`
- [ ] Wait 2-3 minutes after updating env vars for redeploy

### If API Connection Fails
- [ ] Verify `VITE_API_URL` in Vercel is correct
- [ ] Should be: `https://your-backend.onrender.com/api`
- [ ] Check browser console for exact error
- [ ] Verify backend is running (check Render dashboard)

### If MongoDB Connection Fails
- [ ] Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Verify `MONGODB_URI` is correct in Render
- [ ] Check MongoDB connection string format

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ Frontend loads at Vercel URL
- ✅ Backend responds at Render URL
- ✅ Frontend can communicate with backend (no CORS errors)
- ✅ Core features work (upload, AI, export)
- ✅ No critical errors in logs

---

## 📝 Quick Reference

**Backend URL**: `https://your-backend.onrender.com`  
**Frontend URL**: `https://your-app.vercel.app`  
**Health Check**: `https://your-backend.onrender.com/health`

**Render Dashboard**: https://dashboard.render.com  
**Vercel Dashboard**: https://vercel.com/dashboard

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

