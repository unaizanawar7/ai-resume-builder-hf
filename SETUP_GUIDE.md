# 🎯 SETUP GUIDE - Hugging Face Edition (100% FREE)

Follow these steps **exactly** and you'll have your AI Resume Builder running in 10 minutes!

## ✅ What You'll Need

1. ✅ Computer (Windows, Mac, or Linux)
2. ✅ Internet connection
3. ✅ 10 minutes of time
4. ✅ That's it! (No credit card, no payment)

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Get Your FREE Hugging Face Account (2 minutes)

1. **Open browser** → Go to: https://huggingface.co/
2. **Click "Sign Up"** (top right corner)
3. **Enter your email** and create password
4. **Verify email** (check your inbox)
5. **Done!** You now have a free account

---

### STEP 2: Get Your FREE API Token (1 minute)

1. **Go to:** https://huggingface.co/settings/tokens
2. **Click "New token"**
3. **Name:** Type "resume-builder"
4. **Role:** Select "Read"
5. **Click "Generate"**
6. **COPY THE TOKEN** → It looks like: `hf_xxxxxxxxxxxxx`
   - ⚠️ **Save this somewhere!** You'll need it in Step 6

---

### STEP 3: Download the Project (30 seconds)

**Click this download link:**

👉 **[Download AI Resume Builder (Hugging Face).zip](computer:///mnt/user-data/outputs/ai-resume-builder-huggingface.zip)** 👈

Save it to your **Desktop** or **Downloads** folder.

---

### STEP 4: Extract the ZIP File (30 seconds)

**On Windows:**
1. Right-click the ZIP file
2. Click "Extract All..."
3. Click "Extract"
4. You'll see a folder called `ai-resume-builder-hf`

**On Mac:**
1. Double-click the ZIP file
2. It automatically extracts
3. You'll see a folder called `ai-resume-builder-hf`

---

### STEP 5: Install Node.js (if needed) (2 minutes)

**Check if you have it:**
1. Open Git Bash (Windows) or Terminal (Mac/Linux)
2. Type: `node --version`
3. Press Enter

**If you see a version number (like v18.0.0):**
- ✅ Great! Skip to Step 6

**If you see an error:**
1. Go to: https://nodejs.org/
2. Click the **big green button** (LTS version)
3. Download and install it
4. Close and reopen Git Bash/Terminal
5. Try `node --version` again

---

### STEP 6: Setup Backend (3 minutes)

**Open Git Bash (Windows) or Terminal (Mac/Linux):**

Type these commands **one by one** (press Enter after each):

```bash
# 1. Go to your Desktop (or Downloads if you saved there)
cd Desktop

# 2. Go into the project folder
cd ai-resume-builder-hf

# 3. Go into backend folder
cd backend

# 4. Install dependencies (takes 1-2 minutes, be patient!)
npm install
```

**Wait for it to finish...** You'll see lots of text, this is normal!

When done, you'll see: `added XXX packages`

---

### STEP 7: Add Your API Token (1 minute)

**Still in Git Bash/Terminal, type:**

```bash
# Copy the example file
cp .env.example .env
```

**Now edit the file:**

**Option A - Using Notepad (Easier for beginners):**
1. In File Explorer, go to: `Desktop\ai-resume-builder-hf\backend`
2. Find the file `.env`
3. Right-click → "Open with" → Notepad
4. Find the line: `HUGGINGFACE_API_KEY=your_huggingface_token_here`
5. Replace `your_huggingface_token_here` with your actual token from Step 2
6. Example: `HUGGINGFACE_API_KEY=hf_abcdef1234567890`
7. Save the file (Ctrl+S)

**Option B - Using Command Line:**
```bash
# Open the file
nano .env

# Use arrow keys to move to the token line
# Delete the placeholder text
# Paste your token (right-click in Git Bash)
# Press Ctrl+X, then Y, then Enter
```

---

### STEP 8: Start the Backend (30 seconds)

**In Git Bash/Terminal, type:**

```bash
npm run dev
```

**You should see:**
```
🚀 AI Resume Builder Backend (Hugging Face Edition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3001
🔑 API Key configured: ✅ Yes
🤖 AI Model: Meta Llama 3.1 70B (Free)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**🎉 If you see "✅ Yes" next to API Key → SUCCESS!**

⚠️ **IMPORTANT: Keep this window open!** Don't close it.

---

### STEP 9: Setup Frontend (2 minutes)

**Open a NEW Git Bash/Terminal window** (keep the first one running!):

```bash
# 1. Go to Desktop (or Downloads)
cd Desktop

# 2. Go into project
cd ai-resume-builder-hf

# 3. Go into frontend folder
cd frontend

# 4. Install dependencies (takes 1-2 minutes)
npm install
```

Wait for it to finish...

When done, type:

```bash
npm run dev
```

**You should see:**
```
➜  Local:   http://localhost:5173/
```

**✅ Perfect!**

---

### STEP 10: Open in Browser (10 seconds)

1. **Open your web browser** (Chrome, Firefox, Safari, Edge)
2. **Go to:** http://localhost:5173
3. **You should see:** "AI Resume Builder" welcome screen

**🎉🎉🎉 YOU'RE DONE! 🎉🎉🎉**

---

## 💻 What Should Be Running?

You should have **3 things open:**

### Window 1: Backend
```
📡 Server running on: http://localhost:3001
🔑 API Key configured: ✅ Yes
✅ Keep this open!
```

### Window 2: Frontend
```
➜  Local:   http://localhost:5173/
✅ Keep this open!
```

### Window 3: Web Browser
```
http://localhost:5173
✅ This is where you build resumes!
```

---

## 🎯 Now What? Start Building!

1. **Click "Get Started"**
2. **Choose:**
   - Upload your existing resume, OR
   - Start from scratch
3. **Follow the steps** (it guides you through)
4. **Click "AI Career Coach"** for personalized advice
5. **Download your resume** when done!

---

## 🆘 TROUBLESHOOTING

### Problem: "API Key configured: ❌ No"

**Solution:**
1. Go back to Step 7
2. Make sure the file is named `.env` (not `.env.example`)
3. Check your token is correct (no spaces, starts with `hf_`)
4. Restart backend: Press Ctrl+C, then `npm run dev` again

---

### Problem: "npm: command not found"

**Solution:**
1. Node.js isn't installed
2. Go back to Step 5
3. Install Node.js
4. Close and reopen Git Bash/Terminal
5. Try again

---

### Problem: "Port 3001 already in use"

**Solution:**
1. Something else is using port 3001
2. Open `backend/.env` in Notepad
3. Add a new line: `PORT=3002`
4. Save the file
5. Restart backend

---

### Problem: Browser shows blank page

**Solution:**
1. Check if backend is running (Window 1)
2. Check if frontend is running (Window 2)
3. Try refreshing the page (F5)
4. Check browser console for errors (Press F12)

---

### Problem: AI is slow (takes 15-20 seconds)

**Solution:**
- ✅ This is NORMAL for free tier!
- The AI is processing your request
- Just wait, it will complete
- Quality is worth the wait

---

### Problem: "Rate limit exceeded"

**Solution:**
1. You've made too many requests too quickly (free tier limit)
2. Wait 60 seconds
3. Try again
4. Use during off-peak hours for faster service

---

## 📞 Still Stuck?

1. **Read README.md** in the project folder
2. **Check WHATS_DIFFERENT.md** for more info
3. **Look at docs/USER_GUIDE.md** for detailed instructions

---

## 🎉 Enjoy Your FREE AI Resume Builder!

You now have a fully functional AI Resume Builder that:
- ✅ Costs $0.00 forever
- ✅ Uses powerful AI (Llama 3.1 70B)
- ✅ Includes career coaching
- ✅ Exports professional PDFs
- ✅ No credit card needed
- ✅ No limits for personal use

**Go build an amazing resume!** 🚀

---

**Questions? The AI Career Coach in the app can help you! Just click the button in the header.** 💬
