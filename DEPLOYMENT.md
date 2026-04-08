# 🚀 Sentinel AI Deployment Guide

## 📋 Overview

This guide will help you deploy Sentinel AI to production using Docker and Docker Compose.

## 🐋 Docker Deployment (Recommended)

### **Step 1: Environment Setup**

Create your production environment file:
```bash
cp .env.example .env
```

Edit `.env` with your production values:
```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/sentinel_ai

# Redis Configuration
REDIS_URL=redis://redis:6379

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security
JWT_SECRET=your_jwt_secret_here
ADMIN_API_KEY=your_admin_api_key_here
```

### **Step 2: Deploy with Docker Compose**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### **Step 3: Initialize Database**

```bash
# Generate Prisma client
docker-compose exec app npm run prisma:generate

# Run database migrations
docker-compose exec app npm run prisma:migrate

# Seed database (optional)
docker-compose exec app npm run prisma:seed
```

### **Step 4: Verify Deployment**

```bash
# Check health endpoint
curl http://localhost:3000/health

# Check Discord bot status
docker-compose logs app | grep "Bot logged in"
```

## 🌐 Manual Deployment

### **Prerequisites**
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- PM2 (for process management)

### **Step 1: Install Dependencies**
```bash
npm ci --production
```

### **Step 2: Setup Database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

### **Step 3: Start with PM2**
```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

## 🔧 Production Configuration

### **PM2 Ecosystem Config**
```javascript
module.exports = {
  apps: [{
    name: 'sentinel-ai',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};
```

### **Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Considerations

### **Environment Security**
- Use strong, unique passwords
- Rotate secrets regularly
- Use environment-specific secrets
- Enable SSL/TLS

### **Database Security**
- Use SSL connections
- Limit database user permissions
- Regular backups
- Monitor access logs

### **API Security**
- Rate limiting implemented
- Input validation
- Admin authentication
- CORS configuration

## 📊 Monitoring & Logging

### **Application Logs**
```bash
# View real-time logs
docker-compose logs -f app

# View specific log levels
docker-compose logs app | grep ERROR
```

### **Health Checks**
```bash
# Application health
curl http://localhost:3000/health

# Database connection
docker-compose exec postgres pg_isready

# Redis connection
docker-compose exec redis redis-cli ping
```

### **Performance Monitoring**
```bash
# Resource usage
docker stats

# PM2 monitoring (if using manual deployment)
pm2 monit
```

## 🔄 Updates & Maintenance

### **Application Updates**
```bash
# Pull latest code
git pull origin main

# Rebuild Docker image
docker-compose build --no-cache

# Restart services
docker-compose up -d

# Run migrations if needed
docker-compose exec app npm run prisma:migrate
```

### **Database Maintenance**
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres sentinel_ai > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres sentinel_ai < backup.sql

# Clear old logs (weekly)
find logs/ -name "*.log" -mtime +7 -delete
```

## 🚨 Troubleshooting

### **Common Issues**

**Bot won't start:**
- Check Discord bot token
- Verify bot permissions
- Check application logs

**Database connection failed:**
- Verify DATABASE_URL
- Check PostgreSQL status
- Run migrations

**Redis connection failed:**
- Verify REDIS_URL
- Check Redis service
- Test connection manually

**API not responding:**
- Check port configuration
- Verify Nginx setup
- Check firewall rules

### **Debug Commands**
```bash
# Check all services
docker-compose ps

# View service logs
docker-compose logs [service-name]

# Access container shell
docker-compose exec app sh

# Test database connection
docker-compose exec postgres psql -U postgres sentinel_ai

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## 📱 Deployment Checklist

### **Pre-Deployment**
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database credentials set
- [ ] Backup strategy planned
- [ ] Monitoring configured

### **Deployment**
- [ ] Docker images built
- [ ] Services started
- [ ] Database migrated
- [ ] Health checks passing
- [ ] Logs monitored

### **Post-Deployment**
- [ ] Bot functionality tested
- [ ] API endpoints tested
- [ ] Performance monitored
- [ ] Alerts configured
- [ ] Documentation updated

## 🎯 Production Best Practices

### **Performance**
- Use PM2 for process management
- Enable gzip compression
- Implement caching strategies
- Monitor memory usage

### **Reliability**
- Set up health checks
- Configure auto-restart
- Use load balancing
- Implement failover

### **Security**
- Regular security updates
- Vulnerability scanning
- Access control lists
- Audit logging

---

## 🚀 Quick Deploy Script

```bash
#!/bin/bash
# Quick deployment script

echo "🚀 Deploying Sentinel AI..."

# Check environment
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🔄 Starting services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services..."
sleep 30

# Run migrations
echo "🗄️ Running database migrations..."
docker-compose exec app npm run prisma:migrate

# Health check
echo "🏥 Checking health..."
if curl -f http://localhost:3000/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed!"
    docker-compose logs app
    exit 1
fi

echo "🎉 Sentinel AI is now running!"
```

---

**🎯 Your Sentinel AI is now production-ready!**
