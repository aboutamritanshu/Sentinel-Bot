# Sentinel AI Quick Deployment Script for Windows
# This script will deploy the entire application using Docker Compose

Write-Host "🚀 Sentinel AI Deployment Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

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

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Status "Docker is installed"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Status "Docker Compose is installed"
} catch {
    Write-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Status "Created .env file from template."
        Write-Warning "Please edit .env file with your Discord bot token, OpenAI API key, and database credentials."
        Read-Host "Press Enter after editing .env file..."
    } else {
        Write-Error ".env.example file not found. Please create .env file manually."
        exit 1
    }
}

# Load environment variables
try {
    $envContent = Get-Content ".env"
    $envContent | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Status "Environment variables loaded"
} catch {
    Write-Error "Failed to load environment variables from .env file"
    exit 1
}

# Check if required environment variables are set
if (-not $env:DISCORD_BOT_TOKEN -or $env:DISCORD_BOT_TOKEN -eq "your_discord_bot_token_here") {
    Write-Error "Please set DISCORD_BOT_TOKEN in .env file"
    exit 1
}

if (-not $env:OPENAI_API_KEY -or $env:OPENAI_API_KEY -eq "your_openai_api_key_here") {
    Write-Error "Please set OPENAI_API_KEY in .env file"
    exit 1
}

Write-Status "Environment check passed!"

# Stop existing services if running
Write-Status "Stopping existing services..."
docker-compose down

# Build Docker images
Write-Status "Building Docker images..."
docker-compose build

# Start services
Write-Status "Starting services..."
docker-compose up -d

# Wait for services to start
Write-Status "Waiting for services to start (30 seconds)..."
Start-Sleep -Seconds 30

# Check if services are running
Write-Status "Checking service status..."
docker-compose ps

# Wait for database to be ready
Write-Status "Waiting for database to be ready..."
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T postgres pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Database is ready!"
            break
        }
    } catch {
        # Continue trying
    }
    
    if ($i -eq 30) {
        Write-Error "Database failed to start"
        docker-compose logs postgres
        exit 1
    }
    Start-Sleep -Seconds 1
}

# Wait for Redis to be ready
Write-Status "Waiting for Redis to be ready..."
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T redis redis-cli ping 2>$null
        if ($result -eq "PONG") {
            Write-Status "Redis is ready!"
            break
        }
    } catch {
        # Continue trying
    }
    
    if ($i -eq 30) {
        Write-Error "Redis failed to start"
        docker-compose logs redis
        exit 1
    }
    Start-Sleep -Seconds 1
}

# Run database migrations
Write-Status "Running database migrations..."
docker-compose exec -T app npm run prisma:generate
docker-compose exec -T app npm run prisma:migrate

# Check application health
Write-Status "Checking application health..."
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Status "Application is healthy!"
            break
        }
    } catch {
        # Continue trying
    }
    
    if ($i -eq 30) {
        Write-Error "Application health check failed"
        docker-compose logs app
        exit 1
    }
    Start-Sleep -Seconds 2
}

# Show final status
Write-Status "Deployment completed successfully!"
Write-Host ""
Write-Host "🎉 Sentinel AI is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""
Write-Host "🔗 Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose logs -f"
Write-Host "  Stop services: docker-compose down"
Write-Host "  Restart services: docker-compose restart"
Write-Host "  Access application: http://localhost:3000/health"
Write-Host ""
Write-Host "🤖 Discord Bot Status:" -ForegroundColor Cyan
$botLogs = docker-compose logs app | Select-String -Pattern "bot|discord|logged" | Select-Object -Last 5
$botLogs | ForEach-Object { Write-Host $_.Line }

Write-Status "Deployment script completed successfully!"
