# 🐙 GitHub Setup Guide

Your code is committed locally! Now let's push it to GitHub.

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `ai-resume-builder-hf` (or any name you prefer)
   - **Description**: "AI-powered resume builder with free Hugging Face API"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

### Option A: Using HTTPS (Easier)

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-resume-builder-hf.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Option B: Using SSH (If you have SSH keys set up)

```bash
git remote add origin git@github.com:YOUR_USERNAME/ai-resume-builder-hf.git
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Go to your GitHub repository page
2. You should see all your files there
3. ✅ Done! Your code is now on GitHub

## Next Steps

Now that your code is on GitHub, you can:

1. **Deploy to Render** (Backend) - See `QUICK_DEPLOY.md` or `DEPLOYMENT_GUIDE.md`
2. **Deploy to Vercel** (Frontend) - See `QUICK_DEPLOY.md` or `DEPLOYMENT_GUIDE.md`

Both platforms can connect directly to your GitHub repository for automatic deployments!

---

## Troubleshooting

### "remote origin already exists"
If you get this error, remove the existing remote first:
```bash
git remote remove origin
```
Then add it again with the correct URL.

### Authentication Issues
- **HTTPS**: GitHub may ask for your username and a Personal Access Token (not password)
- **SSH**: Make sure your SSH key is added to GitHub

### Need to generate a Personal Access Token?
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use this token as your password when pushing

---

**Once pushed, you're ready to deploy! 🚀**



