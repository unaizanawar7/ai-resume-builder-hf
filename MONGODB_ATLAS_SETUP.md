# 🗄️ MongoDB Atlas Setup Guide

This guide will help you set up a free MongoDB Atlas cluster for your production deployment.

## Step 1: Create MongoDB Atlas Account

1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"** or **"Sign Up"**
3. Sign up with:
   - Email address, OR
   - Google account (recommended - faster)
4. **No credit card required!**

## Step 2: Create a Free Cluster

1. After signing up, you'll see the **"Deploy a cloud database"** screen
2. Choose **"M0"** (Free tier) - it's already selected
3. Select a **Cloud Provider**:
   - AWS (recommended)
   - Google Cloud
   - Azure
4. Select a **Region**:
   - Choose the region closest to you
   - For Render deployment, any region works fine
5. Click **"Create"** (or "Create Deployment")
6. Wait 1-3 minutes for cluster creation

## Step 3: Create Database User

1. You'll see a **"Create Database User"** screen
2. Choose **"Password"** authentication method
3. Enter:
   - **Username**: `resume-builder` (or any username you prefer)
   - **Password**: Click **"Autogenerate Secure Password"** (recommended)
     - **IMPORTANT**: Copy and save this password! You won't see it again.
     - Or create your own strong password
4. Click **"Create Database User"**

## Step 4: Configure Network Access (IP Whitelist)

This is **critical** for Render to connect to your database!

1. You'll see **"Where would you like to connect from?"** screen
2. Click **"Add My Current IP Address"** (for testing)
3. **THEN** click **"Add a Different IP Address"**
4. Enter: `0.0.0.0/0`
   - This allows connections from anywhere (required for Render)
5. Click **"Add"**
6. Click **"Finish and Close"**

**Important**: `0.0.0.0/0` allows all IPs. This is safe because:
- Your database still requires username/password authentication
- Only your application (with the connection string) can access it

## Step 5: Get Your Connection String

1. Click **"Connect"** button on your cluster
2. Choose **"Connect your application"**
3. Select:
   - **Driver**: `Node.js`
   - **Version**: `5.5 or later` (or latest)
4. You'll see a connection string like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace the placeholders**:
   - Replace `<username>` with your database username (from Step 3)
   - Replace `<password>` with your database password (from Step 3)
   - **Remove** the `<>` brackets
6. **Add database name** at the end:
   - Change: `mongodb.net/?retryWrites=true&w=majority`
   - To: `mongodb.net/ai-resume-builder?retryWrites=true&w=majority`
   - (Replace `ai-resume-builder` with your preferred database name)

**Final connection string should look like:**
```
mongodb+srv://resume-builder:YourPassword123@cluster0.xxxxx.mongodb.net/ai-resume-builder?retryWrites=true&w=majority
```

7. **Copy this connection string** - you'll need it for Render!

## Step 6: Verify Connection (Optional)

You can test the connection string locally:

1. Create or update `backend/.env` file:
   ```env
   MONGODB_URI=mongodb+srv://resume-builder:YourPassword123@cluster0.xxxxx.mongodb.net/ai-resume-builder?retryWrites=true&w=majority
   ```
2. Start your backend: `npm run dev`
3. Check if you see: `✅ MongoDB connected successfully`

## ✅ Checklist

Before deploying to Render, verify:

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created and running
- [ ] Database user created (username and password saved)
- [ ] Network access configured with `0.0.0.0/0`
- [ ] Connection string copied and tested
- [ ] Connection string includes database name at the end

## 🔐 Security Best Practices

1. **Save your credentials securely**:
   - Database username
   - Database password
   - Connection string

2. **Never commit credentials to Git**:
   - Connection strings go in Render environment variables only
   - Never push `.env` files with real credentials

3. **Use strong passwords**:
   - Atlas auto-generated passwords are secure
   - If creating your own, use 16+ characters with mixed case, numbers, symbols

## 📝 What You'll Need for Render

When deploying to Render, you'll use:

**Environment Variable:**
- **Key**: `MONGODB_URI`
- **Value**: Your complete connection string from Step 5

Example:
```
MONGODB_URI=mongodb+srv://resume-builder:YourPassword123@cluster0.xxxxx.mongodb.net/ai-resume-builder?retryWrites=true&w=majority
```

## 🆘 Troubleshooting

### "Authentication failed"
- Double-check username and password in connection string
- Make sure you replaced `<username>` and `<password>` placeholders
- Verify password doesn't have special characters that need URL encoding

### "IP not whitelisted"
- Make sure you added `0.0.0.0/0` to Network Access
- Wait 1-2 minutes after adding IP for changes to take effect

### "Connection timeout"
- Check that your cluster is running (not paused)
- Verify the connection string format is correct
- Make sure database name is included in the connection string

### "Database name not found"
- The database will be created automatically on first connection
- Make sure you included the database name in the connection string: `/ai-resume-builder`

## 🎯 Next Steps

Once you have your MongoDB Atlas connection string:

1. ✅ You're ready to deploy to Render!
2. Follow `DEPLOYMENT_STEPS.md` → Step 2
3. Use your Atlas connection string for the `MONGODB_URI` environment variable

---

**Need more help?** Check MongoDB Atlas documentation: https://docs.atlas.mongodb.com/

