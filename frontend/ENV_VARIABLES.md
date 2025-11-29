# Frontend Environment Variables

## For Local Development

The frontend uses Vite's environment variable system. Variables must be prefixed with `VITE_` to be accessible in the browser.

Create a `.env` file in the `frontend` directory (optional for local dev):

```env
# API Base URL
# For local development, this defaults to http://localhost:3001/api
# You can override it here if needed
VITE_API_URL=http://localhost:3001/api
```

## For Production (Vercel)

Set this environment variable in Vercel dashboard:

- `VITE_API_URL` - Your Render backend URL + `/api`
  - Example: `https://ai-resume-builder-backend.onrender.com/api`

**Important**: 
- Vercel will automatically rebuild when you change environment variables
- Make sure to set this for Production, Preview, and Development environments
- The value should NOT have a trailing slash

