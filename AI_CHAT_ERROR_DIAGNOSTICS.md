# 🔍 AI Chat Error Diagnostics

## Common Errors and Why They Occur

### ❌ Error 1: "AI service not configured"

**When it happens:**
- User tries to send a message in AI Chat
- API keys are placeholder values or not set in `.env`

**What you'll see:**

**Backend Terminal:**
```
🤖 Initializing AI Services...
   ⚠️  OpenAI API key found but appears to be a placeholder value
   → Replace your placeholder with a real OpenAI API key
   ⚠️  Groq API key found but appears to be a placeholder value
   → Replace your placeholder with a real Groq API key

   ❌ CRITICAL: No AI service available!
   → Please configure at least ONE API key in backend/.env file

❌ AI SERVICE ERROR: No valid API keys configured
```

**Frontend/Browser:**
- Error message: "AI service not configured. Please set OPENAI_API_KEY or GROQ_API_KEY in .env file"
- Red error banner appears in chat interface
- Message is removed from UI

**Why it happens:**
- `.env` file still has placeholder values like `ybour-openai-api-key-here`
- No actual API keys have been added

**How to fix:**
1. Open `backend/.env` file
2. Replace `OPENAI_API_KEY=your-openai-api-key-here` with your actual key
3. OR replace `GROQ_API_KEY=your-groq-api-key-here` with your actual key
4. Restart backend server

---

### ❌ Error 2: "Invalid API key" (401 Unauthorized)

**When it happens:**
- API key is set but incorrect, expired, or invalid

**What you'll see:**

**Backend Terminal:**
```
❌ OpenAI API Error: Incorrect API key provided
```

**Frontend/Browser:**
- Error: "AI service temporarily unavailable"
- Message fails to send

**Why it happens:**
- API key is wrong (typo, extra spaces)
- API key has expired
- API key doesn't have proper permissions

**How to fix:**
1. Verify API key format:
   - OpenAI: should start with `sk-`
   - Groq: should start with `gsk_`
2. Check for extra spaces or quotes in `.env` file
3. Regenerate API key from provider dashboard
4. Update `.env` and restart server

---

### ❌ Error 3: "Database not available"

**When it happens:**
- MongoDB is not running
- Wrong connection string

**What you'll see:**

**Backend Terminal:**
```
❌ DATABASE ERROR: MongoDB not available
```

**Frontend/Browser:**
- Error: "Database not available. Please check MongoDB connection."

**Why it happens:**
- MongoDB service is not started
- Connection string in `.env` is wrong
- MongoDB is running on different port

**How to fix:**
1. Start MongoDB:
   ```bash
   # Windows
   net start MongoDB
   ```
2. Check `.env` has correct `MONGO_URI=mongodb://localhost:27017/knowledgehub`
3. Verify MongoDB is running: `Get-Service MongoDB`

---

### ❌ Error 4: "Rate limit exceeded" (429)

**When it happens:**
- Too many API requests in short time
- Free tier limits reached

**What you'll see:**

**Backend Terminal:**
```
❌ OpenAI API Error: Rate limit exceeded
```

**Frontend/Browser:**
- Error: "AI service temporarily unavailable"
- May fallback to Groq if configured

**Why it happens:**
- Free tier API has rate limits
- Too many requests sent too quickly
- Daily/monthly quota exceeded

**How to fix:**
1. Wait a few minutes
2. Try again
3. Consider upgrading API plan
4. Use both OpenAI and Groq for redundancy

---

### ❌ Error 5: "No AI service available in getAIResponse()"

**When it happens:**
- Both API clients failed to initialize
- Runtime error occurred

**What you'll see:**

**Backend Terminal:**
```
❌ AI API Error in chat route: No AI service available...
```

**Frontend/Browser:**
- Error: "AI service not configured"

**Why it happens:**
- Clients were not initialized at startup
- Environment variables not loaded properly

**How to fix:**
1. Check backend startup logs for initialization errors
2. Verify `.env` file is in `backend/` directory
3. Restart backend server
4. Check for syntax errors in `.env` file (no spaces around `=`)

---

## 🔍 Diagnostic Checklist

### Step 1: Check Backend Startup Logs

Look for these messages when backend starts:

```
🔍 Environment Variables Status:
==================================================
✅ .env file found at: C:\...\backend\.env

📋 AI Service Configuration:
   OPENAI_API_KEY: ✅ Set (sk-proj-...)
   GROQ_API_KEY:   ❌ NOT SET
   AI_PROVIDER:    openai (default)
   Active:         ✅ OpenAI

🤖 Initializing AI Services...
   ✅ OpenAI client initialized
```

**If you see warnings:**
- `⚠️ Placeholder value` → Replace with real API key
- `❌ NOT SET` → Add API key to `.env`
- `❌ CRITICAL: No AI service available` → Fix API keys

### Step 2: Test API Connection

**In Browser Console (F12):**
```javascript
// Check if backend is reachable
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)

// Should return: { status: "OK", mongo: "Connected" }
```

### Step 3: Check Frontend Error Display

**In AI Chat component:**
- Error appears in red banner below messages
- Check browser console (F12) for detailed errors
- Look for network errors in Network tab

### Step 4: Verify .env File Location

**Correct:** `backend/.env`
**Wrong:** `.env` (root), `frontend/.env`

### Step 5: Verify API Key Format

**OpenAI:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ✅ Correct: starts with sk-, no quotes, no spaces
```

**Groq:**
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ✅ Correct: starts with gsk_, no quotes, no spaces
```

**Common mistakes:**
```env
OPENAI_API_KEY="sk-proj-..."  # ❌ Don't use quotes
OPENAI_API_KEY = sk-proj-...  # ❌ No spaces around =
OPENAI_API_KEY=sk-proj-...    # ✅ Correct
```

---

## 🚨 Quick Fix Guide

### If AI Chat Shows Error:

1. **Check backend terminal** - Look for error messages
2. **Check `.env` file** - Verify API keys are real (not placeholders)
3. **Restart backend** - Always restart after changing `.env`
4. **Check MongoDB** - Ensure it's running
5. **Check browser console** - Look for frontend errors

### If Still Not Working:

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
2. **Check network tab** - See what request is failing
3. **Verify backend URL** - Should be `http://localhost:5000`
4. **Check CORS** - Backend must allow frontend origin

---

## 📋 Error Message Reference

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "AI service not configured" | No valid API keys | Add real API keys to `.env` |
| "Invalid API key" | Wrong/expired key | Update API key in `.env` |
| "Database not available" | MongoDB not running | Start MongoDB service |
| "Rate limit exceeded" | Too many requests | Wait or upgrade plan |
| "Failed to process message" | General error | Check backend logs |

---

## 🔗 Get API Keys

- **OpenAI:** https://platform.openai.com/api-keys
- **Groq:** https://console.groq.com/keys

---

**Remember:** Always restart backend server after changing `.env` file!

