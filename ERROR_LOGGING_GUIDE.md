# Error Logging Guide - AI Chat

## ✅ Enhanced Error Logging Implemented

### Backend Terminal Errors

When errors occur, you'll see detailed logs in the backend terminal:

#### **AI Service Not Configured**
```
❌ AI SERVICE ERROR: No API keys configured
   - OPENAI_API_KEY: ❌ Not set
   - GROQ_API_KEY: ❌ Not set
   - AI_PROVIDER: Not set (default: openai)
```

#### **OpenAI API Error**
```
❌ OpenAI API ERROR: [error message]
   - Error Type: [Error class name]
   - Error Details: [JSON error details]
   - Status: [HTTP status if available]
   - Status Text: [Status text if available]
```

#### **Groq API Error**
```
❌ Groq API ERROR: [error message]
   - Error Type: [Error class name]
   - Error Details: [JSON error details]
```

#### **Database Error**
```
❌ DATABASE ERROR: MongoDB not available
   - Connection State: [0-3 status code]
   - MongoDB URI: [connection string]
```

#### **General Chat Error**
```
❌ CHAT ERROR (General): [error message]
   - Stack: [stack trace]
   - Full Error: [full error object]
```

### Frontend Browser Console Errors

Open browser DevTools (F12) → Console tab to see:

#### **When Sending Messages**
```
❌ API Response Error: {
  status: 503,
  statusText: "Service Unavailable",
  error: { message: "...", error: "..." }
}

❌ AIChat Error: [Error object]
   - Error Type: Error
   - Error Message: [message]
   - Error Stack: [stack trace]
   - Full Error Object: [complete error]
```

#### **When Checking Service Status**
```
🔍 Checking AI service status...
🔍 AI Service Check Response: {
  status: 503,
  data: { message: "AI service not configured" }
}
❌ AI Service Not Configured
```

### Frontend UI Error Display

Errors are displayed in the UI with:

1. **Status Badge**: Red badge showing "AI Service Not Configured"
2. **Error Banner**: Red warning box with error message
3. **Error Details Toggle**: Click "Show Error Details" to see:
   - HTTP Status Code
   - Error Message
   - Error Type
   - Full Error Details
4. **Quick Fix Guide**: Step-by-step instructions to fix the issue

### Common Errors & Solutions

#### Error: "AI service not configured"
**Terminal Shows:**
```
❌ AI SERVICE ERROR: No API keys configured
   - OPENAI_API_KEY: ❌ Not set
   - GROQ_API_KEY: ❌ Not set
```

**Solution:**
1. Open `backend/.env` file
2. Add `OPENAI_API_KEY=sk-...` or `GROQ_API_KEY=gsk_...`
3. Restart backend server

#### Error: "Database not available"
**Terminal Shows:**
```
❌ DATABASE ERROR: MongoDB not available
   - Connection State: 0
```

**Solution:**
1. Start MongoDB service
2. Check `MONGODB_URI` in `.env`
3. Verify MongoDB is running on the correct port

#### Error: "OpenAI API error"
**Terminal Shows:**
```
❌ OpenAI API ERROR: [specific error]
```

**Common Causes:**
- Invalid API key
- Rate limit exceeded
- Network connectivity issues
- API key expired

**Solution:**
- Check API key validity
- Check API usage/quota
- Verify network connection
- System will auto-fallback to Groq if available

### How to Debug

1. **Check Backend Terminal**: Look for ❌ error messages
2. **Check Browser Console**: Press F12 → Console tab
3. **Check Error Details Panel**: Click "Show Error Details" in UI
4. **Verify Environment Variables**: Check `.env` file values
5. **Test API Keys**: Verify keys are valid and have quota

### Error Logging Features

✅ **Detailed Error Messages** - Complete error context  
✅ **Stack Traces** - Full error stack for debugging  
✅ **Error Types** - Identifies error class  
✅ **API Response Details** - HTTP status and response body  
✅ **Environment Variable Status** - Shows which keys are set  
✅ **UI Error Display** - User-friendly error messages  
✅ **Quick Fix Guides** - Step-by-step solutions  

All errors are now logged comprehensively for easy debugging! 🐛

