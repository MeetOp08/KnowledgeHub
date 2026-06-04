# 🔧 Troubleshooting AI Chat Errors

## ❌ Error: "No AI service available"

### What This Error Means
This error occurs when the backend cannot find any configured AI API keys in your `.env` file.

### How to Fix It

#### Step 1: Check Your Backend Terminal
When you start your backend server, you should now see detailed diagnostics like this:

```
🔍 Environment Variables Status:
==================================================
✅ .env file found at: C:\...\backend\.env

📋 AI Service Configuration:
   OPENAI_API_KEY: ❌ NOT SET
   GROQ_API_KEY:   ❌ NOT SET

❌ ERROR: No AI service configured!
   → At least ONE API key is required:
   → Set OPENAI_API_KEY in .env file
   → OR set GROQ_API_KEY in .env file
```

#### Step 2: Create/Update `.env` File
1. Navigate to `backend/` directory
2. Create or edit `.env` file
3. Add at least ONE API key:

```env
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-actual-key-here

# OR get from: https://console.groq.com/keys
GROQ_API_KEY=gsk_your-actual-key-here

# Optional: Choose provider
AI_PROVIDER=openai
```

#### Step 3: Get API Keys

**OpenAI API Key:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste in `.env` file

**Groq API Key:**
1. Go to: https://console.groq.com/keys
2. Sign up or log in
3. Create new API key
4. Copy the key (starts with `gsk_`)
5. Paste in `.env` file

#### Step 4: Restart Backend Server
**IMPORTANT:** After updating `.env` file, you MUST restart your backend server!

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd backend
npm start
```

### ✅ Verification
After restarting, your backend terminal should show:

```
🔍 Environment Variables Status:
==================================================
✅ .env file found at: C:\...\backend\.env

📋 AI Service Configuration:
   OPENAI_API_KEY: ✅ Set (sk-proj-...)
   GROQ_API_KEY:   ❌ NOT SET
   AI_PROVIDER:    openai (default)
   Active:         ✅ OpenAI
```

## 🔍 Other Common Errors

### Error: "Database not available"
**What it means:** MongoDB is not running or connection failed

**How to fix:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   Get-Service MongoDB
   net start MongoDB
   ```
2. Check `MONGO_URI` in `.env` file
3. Look at backend terminal for connection state

### Error: "Invalid API key" (401)
**What it means:** Your API key is incorrect or expired

**How to fix:**
1. Verify API key is correct (no extra spaces)
2. Make sure key format is correct:
   - OpenAI: starts with `sk-`
   - Groq: starts with `gsk_`
3. Regenerate API key if needed

### Error: "Rate limit exceeded" (429)
**What it means:** Too many requests to API

**How to fix:**
1. Wait a few minutes
2. Try again
3. Consider upgrading API plan if frequent

## 📋 What You'll See in Backend Terminal

### ✅ Success - Everything Working:
```
🤖 Initializing AI Services...
   ✅ OpenAI client initialized
   ✅ Groq client initialized
```

### ❌ Error - Missing Keys:
```
🤖 Initializing AI Services...
   ⚠️  OpenAI API key not found in .env file
   ⚠️  Groq API key not found in .env file

   ❌ CRITICAL: No AI service available!
   → Please configure at least ONE API key in .env file
```

### ❌ Error - When Chat Request Fails:
```
❌ AI SERVICE ERROR: No API keys configured
   → Request received but no AI service available
   → OPENAI_API_KEY: ❌ NOT SET
   → GROQ_API_KEY:   ❌ NOT SET
   → Solution: Add at least one API key to backend/.env file
```

## 🎯 Quick Checklist

- [ ] `.env` file exists in `backend/` directory
- [ ] At least ONE API key is set (OPENAI_API_KEY or GROQ_API_KEY)
- [ ] API key format is correct (no quotes, no spaces around `=`)
- [ ] Backend server restarted after adding keys
- [ ] MongoDB is running
- [ ] Check backend terminal for error messages

## 📍 .env File Location
**Correct location:** `backend/.env`

**NOT in:**
- ❌ Root directory
- ❌ Frontend directory
- ❌ Anywhere else

## 🔗 Need Help?

1. Check backend terminal output - it now shows detailed error messages
2. Verify `.env` file location and content
3. Make sure backend server was restarted after changes
4. See `AI_CHAT_ERROR_DIAGNOSTICS.md` for detailed error diagnostics

---

**Remember:** Always restart the backend server after changing `.env` file!

