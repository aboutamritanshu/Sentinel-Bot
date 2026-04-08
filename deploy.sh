#!/bin/bash

# Sentinel AI Quick Deployment Script
# This script will deploy the entire application using Docker Compose

echo "🚀 Sentinel AI Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status "Created .env file from template. Please edit it with your values."
        print_warning "Please edit .env file with your Discord bot token, OpenAI API key, and database credentials."
        read -p "Press Enter after editing .env file..."
    else
        print_error ".env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Check if environment variables are set
source .env

if [ -z "$DISCORD_BOT_TOKEN" ] || [ "$DISCORD_BOT_TOKEN" = "your_discord_bot_token_here" ]; then
    print_error "Please set DISCORD_BOT_TOKEN in .env file"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    print_error "Please set OPENAI_API_KEY in .env file"
    exit 1
fi

print_status "Environment check passed!"

# Stop existing services if running
print_status "Stopping existing services..."
docker-compose down

# Build Docker images
print_status "Building Docker images..."
docker-compose build

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to start
print_status "Waiting for services to start (30 seconds)..."
sleep 30

# Check if services are running
print_status "Checking service status..."
docker-compose ps

# Wait for database to be ready
print_status "Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_status "Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Database failed to start"
        docker-compose logs postgres
        exit 1
    fi
    sleep 1
done

# Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Redis failed to start"
        docker-compose logs redis
        exit 1
    fi
    sleep 1
done

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T app npm run prisma:generate
docker-compose exec -T app npm run prisma:migrate

# Check application health
print_status "Checking application health..."
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "Application is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Application health check failed"
        docker-compose logs app
        exit 1
    fi
    sleep 2
done

# Show final status
print_status "Deployment completed successfully!"
echo ""
echo "🎉 Sentinel AI is now running!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🔗 Useful Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Access application: http://localhost:3000/health"
echo ""
echo "🤖 Discord Bot Status:"
docker-compose logs app | grep -i "bot\|discord\|logged" | tail -5

print_status "Deployment script completed successfully!"
