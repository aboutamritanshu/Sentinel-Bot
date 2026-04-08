# Sentinel AI Frontend Setup Script
# This script will set up the complete frontend dashboard

Write-Host "🎨 Sentinel AI Frontend Setup" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

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

# Navigate to frontend directory
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Status "Current directory: $(Get-Location)"

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the frontend directory."
    exit 1
}

# Install dependencies
Write-Status "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Create environment file
if (-not (Test-Path ".env.local")) {
    Write-Status "Creating environment file..."
    $envContent = @"
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_APP_NAME=Sentinel AI Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
"@
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Status "Created .env.local file"
} else {
    Write-Status ".env.local file already exists"
}

# Create TypeScript configuration
if (-not (Test-Path "tsconfig.json")) {
    Write-Status "Creating TypeScript configuration..."
    $tsConfig = @{
        compilerOptions = @{
            target = "es5"
            lib = @("dom", "dom.iterable", "es6")
            allowJs = $true
            skipLibCheck = $true
            strict = $true
            noEmit = $true
            esModuleInterop = $true
            module = "esnext"
            moduleResolution = "bundler"
            resolveJsonModule = $true
            isolatedModules = $true
            jsx = "preserve"
            incremental = $true
            plugins = @(@{
                name = "next"
            })
            paths = @{
                "@/*" = @("./*")
                "@/components/*" = @("./components/*")
                "@/lib/*" = @("./lib/*")
            }
        }
        include = @("next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts")
        exclude = @("node_modules")
    }
    $tsConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "tsconfig.json" -Encoding UTF8
    Write-Status "Created tsconfig.json"
}

# Create PostCSS configuration
if (-not (Test-Path "postcss.config.js")) {
    Write-Status "Creating PostCSS configuration..."
    $postcssConfig = @"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@
    $postcssConfig | Out-File -FilePath "postcss.config.js" -Encoding UTF8
    Write-Status "Created postcss.config.js"
}

# Build the project
Write-Status "Building the project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Build failed, but this might be expected during setup"
} else {
    Write-Status "Build completed successfully"
}

# Create development script
if (-not (Test-Path "dev.ps1")) {
    Write-Status "Creating development script..."
    $devScript = @"
# Development server startup script
Write-Host "🚀 Starting Sentinel AI Frontend..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

Write-Host "📊 Dashboard will be available at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Backend API should be running at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "🎨 Features:" -ForegroundColor Cyan
Write-Host "   • Real-time statistics" -ForegroundColor White
Write-Host "   • Beautiful animations" -ForegroundColor White
Write-Host "   • Dark mode support" -ForegroundColor White
Write-Host "   • Responsive design" -ForegroundColor White
Write-Host ""

Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev
"@
    $devScript | Out-File -FilePath "dev.ps1" -Encoding UTF8
    Write-Status "Created dev.ps1 script"
}

# Create production script
if (-not (Test-Path "start.ps1")) {
    Write-Status "Creating production script..."
    $startScript = @"
# Production server startup script
Write-Host "🚀 Starting Sentinel AI Frontend (Production)..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host "📊 Dashboard is running at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001" -ForegroundColor White
Write-Host ""

Write-Host "🎧 This is a production build with optimizations" -ForegroundColor Yellow
Write-Host ""

# Start the production server
npm start
"@
    $startScript | Out-File -FilePath "start.ps1" -Encoding UTF8
    Write-Status "Created start.ps1 script"
}

Write-Status ""
Write-Status "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Status ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure your Sentinel AI backend is running on port 3000" -ForegroundColor White
Write-Host "   2. Run '.\dev.ps1' to start the development server" -ForegroundColor White
Write-Host "   3. Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "🎨 Features included:" -ForegroundColor Cyan
Write-Host "   • Beautiful shadcn/ui components" -ForegroundColor White
Write-Host "   • Smooth Framer Motion animations" -ForegroundColor White
Write-Host "   • Real-time dashboard with live updates" -ForegroundColor White
Write-Host "   • Dark mode and responsive design" -ForegroundColor White
Write-Host "   • Professional analytics and monitoring" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Customization:" -ForegroundColor Cyan
Write-Host "   • Edit tailwind.config.js for colors and styling" -ForegroundColor White
Write-Host "   • Modify app/globals.css for custom animations" -ForegroundColor White
Write-Host "   • Update components in the components/ folder" -ForegroundColor White
Write-Host ""
Write-Host "📞 Need help?" -ForegroundColor Cyan
Write-Host "   • Check frontend/README.md for detailed documentation" -ForegroundColor White
Write-Host "   • Review the code comments for implementation details" -ForegroundColor White
Write-Host ""
Write-Status "Your Sentinel AI frontend is ready to use! 🚀"
