# Sentinel AI - Production-Ready Discord Moderation System

Sentinel AI is a scalable SaaS-grade AI-powered Discord moderation and governance platform built with clean architecture and modular structure.

## 🚀 Features

### Core Moderation Engine
- **AI-Powered Content Analysis**: Real-time message moderation using OpenAI GPT-4
- **Contextual Evaluation**: Analyzes last 10 messages for better understanding
- **Configurable Thresholds**: Warning, timeout, and ban thresholds per guild
- **Word Scoring System**: Customizable word-based scoring with AI severity combination

### Advanced Moderation Features
- **Smart Dispute Resolution**: AI analyzes conversations between users
- **Automated Actions**: Warning, timeout, kick, and permanent ban enforcement
- **Violation Tracking**: Comprehensive user violation history and scoring
- **Rate Limiting**: Redis-based rate limiting to prevent spam

### Support & Management
- **AI-Powered Ticket System**: Automated ticket creation and AI summarization
- **Intelligent Announcements**: Topic detection and relevant announcement posting
- **Comprehensive Reporting**: Detailed moderation logs and statistics
- **Admin REST API**: Full administrative control via REST endpoints

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Discord**: Discord.js v14
- **Web Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for rate limiting and caching
- **AI**: OpenAI API (GPT-4)
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional but recommended)
- OpenAI API key
- Discord bot token

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd sentinel-ai
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/sentinel_ai
REDIS_URL=redis://localhost:6379
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 4. Start the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f sentinel_ai
```

### Manual Docker Build

```bash
# Build image
docker build -t sentinel-ai .

# Run with environment variables
docker run -d \
  --name sentinel-ai \
  -p 3000:3000 \
  -e DISCORD_BOT_TOKEN=your_token \
  -e OPENAI_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  -e REDIS_URL=your_redis_url \
  sentinel-ai
```

## 📊 API Documentation

### Admin Endpoints

All admin endpoints require:
- `x-user-id` header with Discord user ID
- Appropriate permissions

#### Configuration
- `GET /api/admin/config/:guildId` - Get server configuration
- `PUT /api/admin/config/:guildId` - Update server configuration

#### Logs & Monitoring
- `GET /api/admin/logs/:guildId` - Get moderation logs
- `GET /api/admin/stats/:guildId` - Get server statistics
- `GET /api/admin/users/:guildId` - Get user statistics

#### Reports & Tickets
- `GET /api/admin/reports/:guildId` - Get user reports
- `GET /api/admin/tickets/:guildId` - Get support tickets

#### User Management
- `POST /api/admin/reset-user/:userId` - Reset user violation score

## 🎯 Discord Commands

### Moderation Commands
- `/report @user [reason]` - Report a user for inappropriate behavior
- `/ticket create` - Create a new support ticket
- `/ticket close` - Close current ticket

### Bot Features
- Automatic message moderation with AI analysis
- Context-aware violation detection
- Automated disciplinary actions
- Real-time announcement posting based on conversation topics

## ⚙️ Configuration

### Server Configuration

Each guild can be configured with:
- **Warning Threshold**: Score level for warnings (default: 10)
- **Timeout Threshold**: Score level for timeouts (default: 25)  
- **Ban Threshold**: Score level for bans (default: 50)
- **Word Scoring**: Custom word-to-score mappings
- **Escalation Rules**: Automated action settings

### Word Scoring Example

```json
{
  "idiot": 2,
  "stupid": 3,
  "hate": 5,
  "racist": 10,
  "toxic": 4
}
```

## 🏗 Architecture

```
src/
├── bot/
│   ├── events/          # Discord event handlers
│   └── commands/        # Slash command handlers
├── services/            # Business logic layer
├── database/           # Prisma schema & migrations
├── routes/             # REST API endpoints
├── middlewares/        # Express middleware
├── utils/              # Shared utilities
└── index.ts           # Application entry point
```

## 🔧 Development

### Scripts

```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm start           # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:seed       # Seed database with test data
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for consistent code style
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## 📈 Monitoring & Logging

- **Winston**: Structured logging
- **Health Endpoint**: `/health` for service monitoring
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Built-in performance monitoring

## 🔒 Security

- **Input Validation**: Joi schema validation
- **Rate Limiting**: Express-rate-limit with Redis
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin policies
- **Environment Variables**: Secure configuration management

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
   - [ ] Set all required environment variables
   - [ ] Configure production database
   - [ ] Set up Redis instance

2. **Security**
   - [ ] Enable HTTPS
   - [ ] Configure firewall rules
   - [ ] Set up monitoring alerts

3. **Scaling**
   - [ ] Configure load balancing
   - [ ] Set up database replication
   - [ ] Configure Redis clustering

4. **Monitoring**
   - [ ] Set up log aggregation
   - [ ] Configure health checks
   - [ ] Set up alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Join our Discord server
- Check the documentation

## 🎉 Acknowledgments

- OpenAI for the powerful AI capabilities
- Discord.js team for the excellent library
- Prisma for the modern database toolkit
- The open-source community for inspiration and tools
