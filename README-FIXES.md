# KnowledgeHub - How to Fix Login and AI Chat Issues

## 🚨 Current Issues Fixed:

### 1. **AI Chat Component Fixed**
- ✅ Changed API calls from port 1234 to port 5000
- ✅ Fixed fetch URLs in AIChat.tsx

### 2. **Login Component Status**
- ✅ Already using correct port (5000)
- ✅ Proper error handling in place

## 🚀 How to Start Your Application:

### **Step 1: Start Backend Server**
Open PowerShell and run:
```powershell
cd C:\Users\smitp\Desktop\KnowledgeHub\KnowledgeHub\backend
$env:PORT = "5000"
node index.js
```

You should see:
```
🚀 Server running at http://localhost:5000
✅ Connected to MongoDB
```

### **Step 2: Start Frontend Server**
Open a NEW PowerShell window and run:
```powershell
cd C:\Users\smitp\Desktop\KnowledgeHub\KnowledgeHub\frontend
npm run dev
```

You should see:
```
VITE v7.1.4  ready in 1234 ms
➜  Local:   http://localhost:5173/
```

## 🧪 Testing Your Application:

### **Test Login:**
1. Go to http://localhost:5173
2. Click "Sign In"
3. Try logging in as:
   - **Student**: Use any email/password (will create account if doesn't exist)
   - **Teacher**: Select "Login as Teacher" (bypasses database)

### **Test AI Chat:**
1. After logging in, click "AI Chat"
2. Type a message like "Hello, can you help me with math?"
3. You should get a response (even without API keys, it has fallback responses)

## 🔧 If Still Not Working:

### **Check Backend is Running:**
```powershell
curl http://localhost:5000/api/message
```
Should return: `{"message":"Hello from backend!"}`

### **Check Frontend is Running:**
Visit: http://localhost:5173

### **Common Issues:**
1. **MongoDB not running**: Install and start MongoDB
2. **Port conflicts**: Make sure nothing else is using ports 5000 or 5173
3. **Firewall**: Windows might block the connections

## 📝 What's Working Now:
- ✅ Backend server starts properly
- ✅ All database models created
- ✅ Authentication system
- ✅ AI Chat with fallback responses
- ✅ File upload system
- ✅ Teacher and student roles
- ✅ Study materials system

## 🎯 Next Steps:
1. Start both servers using the commands above
2. Test login functionality
3. Test AI chat functionality
4. If issues persist, check the browser console for errors
