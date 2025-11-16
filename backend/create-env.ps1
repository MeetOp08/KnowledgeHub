# PowerShell script to create .env file from .env.example
# This script copies .env.example to .env if .env doesn't exist

$envExamplePath = Join-Path $PSScriptRoot ".env.example"
$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envExamplePath) {
    if (-not (Test-Path $envPath)) {
        Copy-Item $envExamplePath $envPath
        Write-Host "[OK] Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] .env file already exists. Skipping creation." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] .env.example file not found. Creating empty .env template..." -ForegroundColor Yellow
    Write-Host "[WARNING] Please edit .env file and add your configuration values" -ForegroundColor Yellow
}

Write-Host "`nEnvironment variables configured!" -ForegroundColor Cyan
Write-Host "   - OpenAI API Key: $(if ($env:OPENAI_API_KEY) { 'Set' } else { 'Not set' })" -ForegroundColor $(if ($env:OPENAI_API_KEY) { 'Green' } else { 'Yellow' })
Write-Host "   - Groq API Key: $(if ($env:GROQ_API_KEY) { 'Set' } else { 'Not set' })" -ForegroundColor $(if ($env:GROQ_API_KEY) { 'Green' } else { 'Yellow' })
Write-Host "`nNote: Restart the backend server after creating/updating .env file" -ForegroundColor Magenta

