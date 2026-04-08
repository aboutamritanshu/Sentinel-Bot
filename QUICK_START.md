# 🚀 Sentinel AI Quick Start Guide

## 📋 Prerequisites

Before you start, make sure you have:

### **Required**
- Node.js 18+ 
- Discord Bot Token
- OpenAI API Key

### **Optional (for full functionality)**
- PostgreSQL 15+ (or use cloud database)
- Redis 7+ (or use cloud Redis)
- Docker & Docker Compose (for containerized deployment)

---

## 🎯 Option 1: Quick Local Setup (5 minutes)

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Setup Environment**
```bash
# Copy environment template
cp .env.template .env

# Edit .env file with your values
notepad .env
```

Add your values to `.env`:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
OPENAI_API_KEY=your_openai_key_here
# Other values can stay as defaults for now
```

### **Step 3: Build & Run**
```bash
# Build the project
npm run build

# Start the application
npm start
```

### **Step 4: Verify Running**
```bash
# Check health endpoint
curl http://localhost:3000/health

# Or visit in browser
# http://localhost:3000/health
```

---

## 🐳 Option 2: Docker Setup (Recommended)

### **Step 1: Install Docker**
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Restart your computer

### **Step 2: Setup Environment**
```bash
# Copy environment template
cp .env.template .env

# Edit .env file
notepad .env
```

### **Step 3: Deploy**
```bash
# Run deployment script (Windows)
.\deploy.ps1

# Or run manually
docker-compose up -d
```

---

## 🌐 Option 3: Cloud Services Setup

### **Database Options**
1. **Supabase** (Free PostgreSQL)
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project
   - Get connection string
   - Add to `.env`: `DATABASE_URL=your_supabase_url`

2. **Neon** (Free PostgreSQL)
   - Sign up at [neon.tech](https://neon.tech)
   - Create database
   - Get connection string
   - Add to `.env`

3. **Railway** (Simple Hosting)
   - Sign up at [railway.app](https://railway.app)
   - Deploy directly from GitHub

### **Redis Options**
1. **Redis Cloud** (Free tier)
   - Sign up at [redis.com](https://redis.com)
   - Create database
   - Get connection string
   - Add to `.env`: `REDIS_URL=your_redis_url`

2. **Upstash** (Free Redis)
   - Sign up at [upstash.com](https://upstash.com)
   - Create Redis database
   - Get REST URL
   - Add to `.env`

---

## 🔧 Environment Setup Details

### **Discord Bot Token**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to "Bot" section
4. Click "Add Bot"
5. Copy the token
6. Add to `.env`: `DISCORD_BOT_TOKEN=your_token_here`

### **OpenAI API Key**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up/login
3. Go to API Keys
4. Create new key
5. Add to `.env`: `OPENAI_API_KEY=your_key_here`

### **Complete .env Example**
```env
# Discord Bot
DISCORD_BOT_TOKEN=ODIxNzE5NjY5NzQ5NjQ5NjQ5NjQ5NjQ5NjQ5NjQ5

# OpenAI
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://host:6379

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

---

## 🚀 Running the Application

### **Development Mode**
```bash
npm run dev
```
- Auto-restarts on file changes
- Detailed logging
- Debug information

### **Production Mode**
```bash
npm run build
npm start
```
- Optimized build
- Production logging
- Better performance

### **Testing**
```bash
# Run basic tests
npm run test:simple

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

---

## 📊 Verification Checklist

### **Application Health**
- [ ] Application starts without errors
- [ ] Health endpoint returns 200
- [ ] Logs show successful startup
- [ ] Discord bot connects (if token provided)

### **API Endpoints**
- [ ] `GET /health` - Application status
- [ ] `GET /api/admin/stats/:guildId` - Statistics
- [ ] `POST /api/admin/config/:guildId` - Configuration

### **Discord Bot**
- [ ] Bot appears online in Discord
- [ ] `/report` command works
- [ ] `/ticket` command works
- [ ] Message moderation works

---

## 🔍 Troubleshooting

### **Common Issues**

**"Discord Bot Token invalid"**
- Check token in Discord Developer Portal
- Ensure token has correct permissions
- Verify token is copied correctly

**"OpenAI API Key invalid"**
- Check API key in OpenAI Platform
- Ensure account has credits
- Verify key is copied correctly

**"Database connection failed"**
- Check DATABASE_URL format
- Ensure database is running
- Verify credentials

**"Port already in use"**
- Change PORT in .env
- Kill existing process: `taskkill /F /IM node.exe`

**"Build failed"**
- Run `npm install` again
- Clear node_modules and reinstall
- Check Node.js version (18+)

### **Debug Commands**
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Fresh install
rm -rf node_modules package-lock.json
npm install

# Check environment variables
echo $env:DISCORD_BOT_TOKEN
```

---

## 🎯 Next Steps

### **After Successful Start**
1. **Invite Bot to Discord**
   - Generate OAuth2 URL in Discord Developer Portal
   - Add bot permissions: Read Messages, Send Messages, Manage Channels

2. **Test Commands**
   - Try `/report @user reason:test`
   - Try `/ticket create category:general`

3. **Configure Settings**
   - Use admin API to configure moderation settings
   - Set up custom word scoring
   - Configure announcement channels

4. **Monitor Performance**
   - Check logs regularly
   - Monitor API usage
   - Track bot statistics

---

## 📞 Support

### **Getting Help**
1. Check this guide first
2. Review logs for error messages
3. Test with minimal configuration
4. Join Discord community (if available)

### **Useful Commands**
```bash
# View application logs
npm run dev

# Check all services
docker-compose ps

# View Docker logs
docker-compose logs -f

# Test API endpoint
curl http://localhost:3000/health
```

---

**🎉 Your Sentinel AI is ready to deploy!**

Choose the option that best fits your needs and follow the steps. The application is designed to work with minimal setup and scale up as needed.
