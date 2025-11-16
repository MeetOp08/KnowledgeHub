# AI Chat - Errors & Solutions Guide

## 🔍 Common Errors & How to Fix Them

### ❌ Error 1: "AI service not configured"

**What You See:**
- **Terminal:** `❌ AI SERVICE ERROR: No API keys configured`
- **UI:** Red banner "AI Service Not Configured"
- **Browser Console:** `Status: 503, Message: AI service not configured...`

**Why It Happens:**
1. API keys are missing in `.env` file
2. API keys are empty or have spaces
3. Backend server wasn't restarted after adding keys
4. `.env` file is in wrong location

**How to Fix:**

```bash
# Step 1: Open backend/.env file
# Step 2: Add your API keys (remove quotes, no spaces around =)
OPENAI_API_KEY=sk-proj-your-key-here
GROQ_API_KEY=gsk_your-key-here

# Step 3: Set AI provider (choose one)
AI_PROVIDER=openai
# OR
AI_PROVIDER=groq

# Step 4: Restart backend server
# Stop server (Ctrl+C), then restart:
npm start
# or
node index.js
```

**Verify It's Fixed:**
- Check terminal: Should NOT see "❌ AI SERVICE ERROR"
- UI should show green "AI Ready" badge
- Try sending a message

---

### ❌ Error 2: "AI_PROVIDER is set incorrectly"

**What You See:**
- Terminal shows provider check but uses wrong service
- Wrong provider being called

**Why It Happens:**
- `AI_PROVIDER` has wrong value (e.g., `AI_PROVIDER=GROQ_API_KEY` instead of `AI_PROVIDER=groq`)

**How to Fix:**

```env
# ❌ WRONG:
AI_PROVIDER=GROQ_API_KEY
AI_PROVIDER=OPENAI_API_KEY
AI_PROVIDER=openai-key

# ✅ CORRECT:
AI_PROVIDER=openai
# OR
AI_PROVIDER=groq
# OR (leave empty for default openai)
AI_PROVIDER=
```

**Restart backend after fixing!**

---

### ❌ Error 3: "Database not available"

**What You See:**
- Terminal: `❌ DATABASE ERROR: MongoDB not available`
- Connection State: 0 (disconnected)
- Status: 503

**Why It Happens:**
1. MongoDB service is not running
2. Wrong MongoDB URI in `.env`
3. Network/firewall blocking connection

**How to Fix:**

```bash
# Step 1: Check if MongoDB is running
# Windows (if installed as service):
Get-Service MongoDB

# Step 2: Check .env file
MONGODB_URI=mongodb://localhost:27017/knowledgehub
# OR for MongoDB Atlas:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/knowledgehub

# Step 3: Start MongoDB (if not running)
# Windows:
net start MongoDB
# OR start manually:
mongod

# Step 4: Restart backend server
```

---

### ❌ Error 4: "OpenAI API Error" / "Invalid API key"

**What You See:**
- Terminal: `❌ OpenAI API ERROR: Invalid API key provided`
- HTTP Status: 401
- Error Type: APIError

**Why It Happens:**
1. API key is invalid/expired
2. API key has extra spaces or quotes
3. API key is from wrong account

**How to Fix:**

```bash
# Step 1: Get a valid API key
# OpenAI: https://platform.openai.com/api-keys
# Groq: https://console.groq.com/keys

# Step 2: Update .env (NO quotes, NO spaces)
OPENAI_API_KEY=sk-proj-actual-key-without-quotes-or-spaces

# Step 3: Verify key format
# OpenAI: starts with sk-proj- or sk-
# Groq: starts with gsk_

# Step 4: Restart backend
```

---

### ❌ Error 5: "API rate limit exceeded"

**What You See:**
- Terminal: `❌ OpenAI API ERROR: Rate limit exceeded`
- Status: 429
- Message: "You exceeded your current quota"

**Why It Happens:**
1. API quota/credits exhausted
2. Too many requests too quickly
3. Free tier limit reached

**How to Fix:**

```bash
# Option 1: Wait and retry (rate limits reset)
# Option 2: Use different provider
AI_PROVIDER=groq  # Switch to Groq
# OR
AI_PROVIDER=openai  # Switch to OpenAI

# Option 3: Add credits to your API account
# OpenAI: https://platform.openai.com/account/billing
# Groq: https://console.groq.com/settings/billing
```

---

### ❌ Error 6: "Network Error" / "Failed to fetch"

**What You See:**
- Browser Console: `Failed to fetch` or `Network error`
- Frontend can't reach backend

**Why It Happens:**
1. Backend server is not running
2. Wrong API URL in frontend
3. CORS issues
4. Firewall blocking requests

**How to Fix:**

```bash
# Step 1: Verify backend is running
# Check terminal for: "✅ Server running on port 5000"

# Step 2: Check API base URL
# Frontend uses: http://localhost:5000
# Verify in browser console: API_BASE_URL

# Step 3: Test backend directly
curl http://localhost:5000/api/chat
# Should return error (not connection refused)

# Step 4: Check CORS settings in backend/index.js
```

---

### ❌ Error 7: "User not authenticated"

**What You See:**
- UI: Alert "User not authenticated. Please refresh the page."
- userId is null or undefined

**Why It Happens:**
1. User session expired
2. Not logged in
3. Session cookies not being sent

**How to Fix:**

```bash
# Step 1: Refresh the page
# Step 2: Log in again
# Step 3: Check browser DevTools → Application → Cookies
# Step 4: Verify session is set
```

---

## 🔧 Complete Diagnostic Checklist

Run through this checklist to diagnose issues:

### 1. Check Environment Variables

```bash
# In backend directory
cd backend
Get-Content .env | Select-String -Pattern "OPENAI|GROQ|AI_PROVIDER"
```

**Expected Output:**
```
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
AI_PROVIDER=openai
```

### 2. Check Backend Server Logs

```bash
# Start backend and watch for errors
npm start
# Look for:
# ✅ Connected to MongoDB
# ✅ Server running on port 5000
# ❌ Any error messages
```

### 3. Check Frontend Console

```javascript
// Press F12 in browser
// Go to Console tab
// Look for:
// ❌ API Response Error
// ❌ AIChat Error
// ✅ Successful requests
```

### 4. Test API Endpoint Directly

```bash
# Test if endpoint is reachable
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"test123","sessionId":"test"}'
```

---

## 📋 Step-by-Step Fix Procedure

### If AI Chat is NOT Working:

**Step 1: Check .env File**
```bash
cd backend
cat .env | grep -E "OPENAI|GROQ|AI_PROVIDER"
```

**Step 2: Verify Format**
- ✅ No quotes around values
- ✅ No spaces around `=`
- ✅ Correct values:
  - `OPENAI_API_KEY=sk-proj-...`
  - `GROQ_API_KEY=gsk_...`
  - `AI_PROVIDER=openai` or `AI_PROVIDER=groq`

**Step 3: Restart Backend**
```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

**Step 4: Check Terminal Output**
- Should see: `✅ Connected to MongoDB`
- Should NOT see: `❌ AI SERVICE ERROR`

**Step 5: Test in Browser**
- Open AI Chat page
- Check for green "AI Ready" badge
- Send test message

**Step 6: Check Errors**
- If still not working, check:
  - Browser console (F12)
  - Backend terminal
  - Error details panel in UI

---

## 🎯 Quick Fix Commands

```bash
# Fix 1: Check what's wrong
cd backend
Get-Content .env

# Fix 2: Test API keys (replace with your keys)
$env:OPENAI_API_KEY="sk-proj-your-key"
node -e "console.log(process.env.OPENAI_API_KEY)"

# Fix 3: Restart everything
# Stop backend (Ctrl+C)
# Then restart:
npm start
```

---

## 📞 Still Not Working?

If you've tried everything above:

1. **Check Error Logs:**
   - Backend terminal (look for ❌ errors)
   - Browser console (F12 → Console)
   - UI error details panel

2. **Verify Setup:**
   - MongoDB is running
   - Backend server is running on port 5000
   - Frontend is running on port 5173
   - `.env` file exists in `backend/` directory

3. **Common Mistakes:**
   - ❌ Forgot to restart backend after changing .env
   - ❌ API keys have quotes: `OPENAI_API_KEY="sk-..."`
   - ❌ Wrong AI_PROVIDER value
   - ❌ .env file in wrong directory
   - ❌ Extra spaces: `OPENAI_API_KEY = sk-...`

---

## ✅ Success Indicators

**When Everything Works:**
- ✅ Backend terminal: No ❌ errors
- ✅ UI shows: Green "AI Ready" badge
- ✅ Messages send successfully
- ✅ AI responds with answers
- ✅ Chat history loads

---

## 🆘 Emergency Reset

If nothing works, start fresh:

```bash
# 1. Stop all servers
# 2. Check .env file exists
cd backend
ls .env

# 3. Create/update .env with correct values
# 4. Restart MongoDB
# 5. Restart backend
npm start

# 6. Restart frontend (in new terminal)
cd frontend
npm run dev
```

---

## 📝 Example Working .env File

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/knowledgehub

# AI Services
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_PROVIDER=openai

# Session (auto-generated if not set)
SESSION_SECRET=
```

**Remember:**
- No quotes
- No spaces around `=`
- Restart backend after changes!

