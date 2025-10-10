# PowerShell script to start both frontend and backend servers
# Make sure to run this from the KnowledgeHub directory

Write-Host "Starting KnowledgeHub servers..." -ForegroundColor Green

# Start backend server with correct port
Write-Host "Starting backend server on port 5000..." -ForegroundColor Yellow
$env:PORT = "5000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'KnowledgeHub\backend'; `$env:PORT='5000'; node index.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'KnowledgeHub\frontend'; npm run dev"

Write-Host "Both servers should now be running!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
