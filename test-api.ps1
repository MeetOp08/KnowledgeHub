# Test script to verify API endpoints are working
Write-Host "Testing KnowledgeHub API endpoints..." -ForegroundColor Green

# Test 1: Basic API endpoint
Write-Host "`n1. Testing basic API endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/message" -Method GET
    Write-Host "✅ Basic API working: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Auth endpoint (should return error for no session)
Write-Host "`n2. Testing auth endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET
    Write-Host "✅ Auth endpoint working: $($response.isAuthenticated)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Chat endpoint (should work with fallback)
Write-Host "`n3. Testing chat endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Hello, can you help me with math?"
        userId = "test123"
        sessionId = "test-session"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Chat endpoint working: $($response.reply.Substring(0, 50))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Chat endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI testing complete!" -ForegroundColor Green
