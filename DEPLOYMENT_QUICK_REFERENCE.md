# 🚀 Deployment Quick Reference Card

Print this page or keep it open while deploying!

## Your Repository
- **GitHub**: `unaizanawar7/ai-resume-builder-hf`
- **Status**: ✅ Code pushed and ready

## Prerequisites Needed

```
MONGODB_URI=mongodb://localhost:27017/ai-resume-builder
  OR
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
  OR
GEMINI_API_KEY=xxxxxxxxxxxxx

JWT_SECRET=<generate secure random string>
```

## Render (Backend) Configuration

**URL**: https://render.com

**Service Settings:**
- Name: `ai-resume-builder-backend`
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Plan: **Free**

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
MONGODB_URI=<your connection string>
HUGGINGFACE_API_KEY=<your key> OR GEMINI_API_KEY=<your key>
JWT_SECRET=<secure random string>
FRONTEND_URL=<leave blank initially>
```

**After Deployment:**
- Backend URL: `https://your-backend.onrender.com`
- Test: `https://your-backend.onrender.com/health`

## Vercel (Frontend) Configuration

**URL**: https://vercel.com

**Project Settings:**
- Root Directory: `frontend`
- Framework: Vite (auto-detected)
- Build: `npm run build` (auto)

**Environment Variable:**
```
VITE_API_URL=https://your-backend.onrender.com/api
```
(Replace with your actual Render backend URL)

**After Deployment:**
- Frontend URL: `https://your-app.vercel.app`

## Final Step: Connect Services

1. Go back to Render → Environment tab
2. Update `FRONTEND_URL` = `https://your-app.vercel.app`
3. Save → Wait 2-3 minutes for redeploy

## Testing Checklist

- [ ] Backend health: `https://your-backend.onrender.com/health`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] No CORS errors in browser console
- [ ] Upload resume works
- [ ] AI features work
- [ ] Export PDF works

## Common Issues

**CORS Error?**
→ Check `FRONTEND_URL` in Render matches Vercel URL exactly

**API Not Connecting?**
→ Verify `VITE_API_URL` in Vercel is correct

**Backend Slow?**
→ Normal! Free tier spins down. First request takes ~30 seconds

---

**Full Guide**: See `DEPLOYMENT_STEPS.md` for detailed instructions

