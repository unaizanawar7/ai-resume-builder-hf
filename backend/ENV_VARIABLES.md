# Environment Variables Reference

Create a `.env` file in the `backend` directory with these variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
# For local MongoDB: mongodb://localhost:27017/ai-resume-builder
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/ai-resume-builder

# Frontend URL (for CORS)
# In production, set this to your Vercel frontend URL
# For multiple origins, separate with commas: https://app1.vercel.app,https://app2.vercel.app
FRONTEND_URL=http://localhost:5173

# AI API Keys (use only one)
# Option 1: Hugging Face (Free)
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Option 2: Google Gemini (Free)
# GEMINI_API_KEY=your_gemini_api_key_here
```

## For Production (Render)

Set these environment variables in Render dashboard:

- `NODE_ENV=production`
- `PORT=10000`
- `MONGODB_URI` - Your MongoDB connection string
- `HUGGINGFACE_API_KEY` or `GEMINI_API_KEY` - Your AI API key
- `FRONTEND_URL` - Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

