# 🔧 Troubleshooting: Endpoints Not Responding

## Problem: Frontend can't connect to backend API

Your frontend at https://ai-resume-builder-hf.vercel.app/ is live but endpoints aren't responding.

## Quick Fix Checklist

### ✅ Step 1: Set VITE_API_URL in Vercel

The frontend needs to know where your backend is!

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project: `ai-resume-builder-hf`
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com/api`
     - Replace `your-backend.onrender.com` with your actual Render backend URL
     - **IMPORTANT**: Include `/api` at the end!
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy**: Go to **Deployments** → Click the 3 dots on latest deployment → **Redeploy**

### ✅ Step 2: Set FRONTEND_URL in Render

The backend needs to allow requests from your Vercel frontend!

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service
3. Go to **Environment** tab
4. Add/Update:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://ai-resume-builder-hf.vercel.app`
     - **IMPORTANT**: No trailing slash!
   - Click **Save Changes**
5. Render will automatically redeploy (takes 2-3 minutes)

### ✅ Step 3: Verify Backend URL

Make sure you have the correct Render backend URL:

1. In Render dashboard, your backend service should show a URL like:
   - `https://ai-resume-builder-backend.onrender.com`
   - Or `https://ai-resume-builder-hf.onrender.com`
   - Or similar

2. Test it directly in browser:
   - `https://your-backend.onrender.com/health`
   - Should return: `{"status":"ok",...}`

3. Use this URL in Vercel's `VITE_API_URL`:
   - `https://your-backend.onrender.com/api`

## Common Issues

### Issue 1: "Network Error" or "Failed to fetch"

**Cause**: `VITE_API_URL` not set or incorrect in Vercel

**Fix**:
- Check Vercel Environment Variables
- Make sure `VITE_API_URL` is set to: `https://your-backend.onrender.com/api`
- Redeploy after adding/updating

### Issue 2: CORS Error in Browser Console

**Cause**: `FRONTEND_URL` not set in Render or incorrect

**Fix**:
- Check Render Environment Variables
- Make sure `FRONTEND_URL` is: `https://ai-resume-builder-hf.vercel.app`
- No trailing slash!
- Wait 2-3 minutes for redeploy

### Issue 3: "404 Not Found" on API calls

**Cause**: Backend URL missing `/api` suffix

**Fix**:
- `VITE_API_URL` should be: `https://your-backend.onrender.com/api`
- Not: `https://your-backend.onrender.com` (missing `/api`)

### Issue 4: Backend takes 30+ seconds to respond

**Cause**: Render free tier spin-down (normal!)

**Fix**:
- This is normal for Render free tier
- First request after 15 min inactivity takes ~30 seconds
- Subsequent requests are fast

## Step-by-Step Fix

### 1. Get Your Render Backend URL

In Render dashboard, find your backend service URL. It looks like:
```
https://ai-resume-builder-backend-xxxx.onrender.com
```

### 2. Update Vercel Environment Variable

```
VITE_API_URL = https://your-backend-url.onrender.com/api
```

### 3. Update Render Environment Variable

```
FRONTEND_URL = https://ai-resume-builder-hf.vercel.app
```

### 4. Redeploy Both

- **Vercel**: Redeploy manually or wait for auto-redeploy
- **Render**: Auto-redeploys when you save environment variables

### 5. Test

1. Open browser console (F12)
2. Visit: https://ai-resume-builder-hf.vercel.app
3. Try using the app
4. Check console for errors

## Verification

### Check Vercel Environment Variables

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Should see: `VITE_API_URL` with value like `https://xxx.onrender.com/api`

### Check Render Environment Variables

1. Render Dashboard → Your Service → Environment
2. Should see: `FRONTEND_URL` with value `https://ai-resume-builder-hf.vercel.app`

### Test Backend Directly

Visit in browser:
```
https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "AI Resume Builder API is running",
  "timestamp": "..."
}
```

### Test Frontend API Connection

1. Open browser console (F12)
2. Visit your Vercel site
3. Check Network tab for API calls
4. Should see requests to: `https://your-backend.onrender.com/api/...`

## Still Not Working?

1. **Check browser console** (F12) for specific error messages
2. **Check Render logs** for backend errors
3. **Check Vercel logs** for build/deployment errors
4. **Verify URLs** - no typos, correct format
5. **Wait 2-3 minutes** after updating environment variables for redeploy

## Quick Reference

**Vercel Environment Variable:**
```
VITE_API_URL=https://your-backend.onrender.com/api
```

**Render Environment Variable:**
```
FRONTEND_URL=https://ai-resume-builder-hf.vercel.app
```

**Test URLs:**
- Frontend: https://ai-resume-builder-hf.vercel.app
- Backend Health: https://your-backend.onrender.com/health
- Backend Root: https://your-backend.onrender.com/


