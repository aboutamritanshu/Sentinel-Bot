# Sentinel AI Quick Start Script (No Docker Required)
# This script will start the application locally

Write-Host "🚀 Sentinel AI Quick Start" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Status "Node.js is installed: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Status "npm is installed: $npmVersion"
} catch {
    Write-Error "npm is not installed"
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found."
    if (Test-Path ".env.template") {
        Copy-Item ".env.template" ".env"
        Write-Status "Created .env file from template."
        Write-Warning "IMPORTANT: Please edit .env file with your Discord bot token and OpenAI API key!"
        Write-Warning "Without these, the bot will not function properly."
        Write-Host "Opening .env file for editing..." -ForegroundColor Cyan
        Start-Process notepad ".env"
        Read-Host "Press Enter after editing .env file (or just press Enter to continue without editing)"
    } else {
        Write-Error ".env.template file not found. Please create .env file manually."
        exit 1
    }
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Status "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
} else {
    Write-Status "Dependencies already installed"
}

# Build the project
Write-Status "Building project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

# Start the application
Write-Status "Starting Sentinel AI..."
Write-Host ""
Write-Host "🎉 Sentinel AI is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Application will be available at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/health" -ForegroundColor White
Write-Host ""
Write-Host "🤖 Discord Bot Features:" -ForegroundColor Cyan
Write-Host "   - AI-powered moderation" -ForegroundColor White
Write-Host "   - User reporting system" -ForegroundColor White
Write-Host "   - Support tickets with AI" -ForegroundColor White
Write-Host "   - Smart announcements" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Admin API:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/api/admin/stats/:guildId" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm start
