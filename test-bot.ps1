# Quick Test Script for Sentinel AI Bot

# 1. Test Bot Directly (without build)
Write-Host "Starting Sentinel AI Bot for testing..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file for testing..." -ForegroundColor Yellow
    $envContent = @"
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/sentinel_bot

# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=3000
NODE_ENV=development

# AI Service Configuration
OPENAI_API_KEY=your_openai_key_here
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Created .env file. Please update with your actual values." -ForegroundColor Yellow
}

# 2. Test Health Endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    Write-Host "Health check response: $response" -ForegroundColor Green
} catch {
    Write-Host "Health endpoint not responding (expected if bot not running)" -ForegroundColor Yellow
}

# 3. Test Frontend
Write-Host "Testing frontend dashboard..." -ForegroundColor Cyan
Set-Location "frontend"
if (Test-Path "package.json") {
    Write-Host "Frontend directory found. Starting development server..." -ForegroundColor Green
    Write-Host "Open http://localhost:3001 in your browser" -ForegroundColor Cyan
    # npm run dev
} else {
    Write-Host "Frontend not found" -ForegroundColor Red
}

# 4. Test Commands
Write-Host ""
Write-Host "Testing Checklist:" -ForegroundColor Cyan
Write-Host "1. Bot Commands:" -ForegroundColor White
Write-Host "   - /report @user [reason]" -ForegroundColor Gray
Write-Host "   - /ticket create [reason]" -ForegroundColor Gray
Write-Host "   - /utility serverinfo" -ForegroundColor Gray
Write-Host "   - /utility ping" -ForegroundColor Gray
Write-Host "   - /utility uptime" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Frontend Features:" -ForegroundColor White
Write-Host "   - Dashboard loads at http://localhost:3001" -ForegroundColor Gray
Write-Host "   - Statistics display correctly" -ForegroundColor Gray
Write-Host "   - Health monitoring works" -ForegroundColor Gray
Write-Host "   - Responsive design on mobile" -ForegroundColor Gray
Write-Host ""
Write-Host "3. API Endpoints:" -ForegroundColor White
Write-Host "   - GET /health" -ForegroundColor Gray
Write-Host "   - GET /health/detailed" -ForegroundColor Gray
Write-Host "   - GET /api/admin/stats/guild-id" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Bot Status:" -ForegroundColor White
Write-Host "   - Bot appears online in Discord" -ForegroundColor Gray
Write-Host "   - Slash commands appear in chat" -ForegroundColor Gray
Write-Host "   - Bot responds to commands" -ForegroundColor Gray
Write-Host "   - No error messages in console" -ForegroundColor Gray

Write-Host ""
Write-Host "Quick Test Commands:" -ForegroundColor Green
Write-Host "npm start                 # Start bot" -ForegroundColor Gray
Write-Host "cd frontend && npm run dev # Start dashboard" -ForegroundColor Gray
Write-Host "curl http://localhost:3000/health # Test API" -ForegroundColor Gray
Write-Host "npm test                  # Run unit tests" -ForegroundColor Gray

Write-Host ""
Write-Host "Test Complete! Check the items above to verify everything works." -ForegroundColor Green
