# 🔑 Your Deployment Values

Save this file - you'll need these values when deploying!

## Generated Values

### JWT Secret
```
BG7bYHv5BDaEWHGO3fgcV50maV4BAjuRbCtNASg7EiEGD+3tFbxw6oFWSMaeQhQ2
```

**Use this for:** Render environment variable `JWT_SECRET`

---

## Values You Need to Get/Set

### MongoDB Atlas Connection String
**Status**: ⏳ Need to set up (follow `MONGODB_ATLAS_SETUP.md`)

**After setup, it will look like:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ai-resume-builder?retryWrites=true&w=majority
```

**Use this for:** Render environment variable `MONGODB_URI`

---

### AI API Key
**Status**: ✅ You have this configured

**Check your local `backend/.env` file to find:**
- `HUGGINGFACE_API_KEY=...` OR
- `GEMINI_API_KEY=...`

**Use this for:** Render environment variable (same key name)

---

## Render Environment Variables Checklist

When deploying to Render, add these:

| Variable | Value | Status |
|----------|-------|--------|
| `NODE_ENV` | `production` | ✅ Ready |
| `PORT` | `10000` | ✅ Ready |
| `MONGODB_URI` | Your Atlas connection string | ⏳ Get from Atlas setup |
| `HUGGINGFACE_API_KEY` or `GEMINI_API_KEY` | Your existing API key | ✅ You have this |
| `JWT_SECRET` | `BG7bYHv5BDaEWHGO3fgcV50maV4BAjuRbCtNASg7EiEGD+3tFbxw6oFWSMaeQhQ2` | ✅ Ready |
| `FRONTEND_URL` | Leave blank initially | ⏳ Add after Vercel deploy |

---

## Vercel Environment Variables Checklist

When deploying to Vercel, add this:

| Variable | Value | Status |
|----------|-------|--------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | ⏳ Add after Render deploy |

---

## Quick Reference

1. **First**: Set up MongoDB Atlas → Get connection string
2. **Then**: Deploy to Render → Get backend URL
3. **Then**: Deploy to Vercel → Get frontend URL
4. **Finally**: Update `FRONTEND_URL` in Render

---

**Next Step**: Follow `MONGODB_ATLAS_SETUP.md` to get your MongoDB connection string!

