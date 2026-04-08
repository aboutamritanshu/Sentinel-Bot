import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import { ModerationService } from './services/moderation.service';
import { AIService } from './services/ai.service';
import { ReportService } from './services/report.service';
import { ScoringService } from './services/scoring.service';
import { TicketService } from './services/ticket.service';
import { AnnouncementService } from './services/announcement.service';
import { AnalyticsService } from './services/analytics.service';

import { MessageCreateHandler } from './bot/events/messageCreate';
import { ReadyHandler } from './bot/events/ready';
import { ReportCommandHandler } from './bot/commands/report';
import { TicketCommandHandler } from './bot/commands/ticket';
import { UtilityCommandHandler } from './bot/commands/utility';

import { AdminRoutes } from './routes/admin.routes';
import logger from './utils/logger';
import { redisClient } from './utils/redis';
import { HealthChecker } from './utils/health';
import { requestLogger, detailedLogger, errorLogger } from './middlewares/logging.middleware';
import { apiRateLimit, configRateLimit, logsRateLimit } from './middlewares/rateLimit.middleware';

dotenv.config();

export class SentinelAI {
  private client: Client;
  private prisma: PrismaClient;
  private app: express.Application;

  // Services
  private moderationService: ModerationService;
  private aiService: AIService;
  private reportService: ReportService;
  private scoringService: ScoringService;
  private ticketService: TicketService;
  private announcementService: AnnouncementService;
  private analyticsService: AnalyticsService;

  // Handlers
  private messageCreateHandler: MessageCreateHandler;
  private readyHandler: ReadyHandler;
  private reportCommandHandler: ReportCommandHandler;
  private ticketCommandHandler: TicketCommandHandler;
  private utilityCommandHandler: UtilityCommandHandler;

  // Health & Monitoring
  private healthChecker: HealthChecker;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.prisma = new PrismaClient();
    this.app = express();

    this.moderationService = new ModerationService(this.prisma);
    this.aiService = new AIService();
    this.reportService = new ReportService(this.prisma, this.aiService);
    this.scoringService = new ScoringService(this.prisma, this.moderationService);
    this.ticketService = new TicketService(this.prisma, this.aiService);
    this.announcementService = new AnnouncementService(this.client, this.aiService);
    this.analyticsService = new AnalyticsService(this.prisma);

    this.messageCreateHandler = new MessageCreateHandler(
      this.moderationService,
      this.aiService,
      this.scoringService
    );

    this.readyHandler = new ReadyHandler(
      this.client,
      this.announcementService
    );

    this.reportCommandHandler = new ReportCommandHandler(
      this.reportService,
      this.moderationService
    );

    this.ticketCommandHandler = new TicketCommandHandler(
      this.prisma,
      this.ticketService,
      this.moderationService
    );

    this.utilityCommandHandler = new UtilityCommandHandler(this);

    this.healthChecker = new HealthChecker(this.prisma, this.client);

    this.setupEventListeners();
    this.setupExpress();
  }

  private setupEventListeners(): void {
    this.client.on('ready', () => this.readyHandler.handle());
    this.client.on('messageCreate', (message) => this.messageCreateHandler.handle(message));
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;

      try {
        switch (interaction.commandName) {
          case 'report':
            if (interaction.isChatInputCommand()) {
              await this.reportCommandHandler.handle(interaction);
            }
            break;
          case 'ticket':
            if (interaction.isChatInputCommand()) {
              await this.ticketCommandHandler.handle(interaction);
            }
            break;
        }
      } catch (error) {
        logger.error('Error handling interaction:', error);
        if (interaction.isRepliable()) {
          await interaction.reply({
            content: 'An error occurred while processing your command.',
            ephemeral: true
          });
        }
      }
    });
  }

  private setupExpress(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Request logging and monitoring
    this.app.use(requestLogger);
    this.app.use(detailedLogger);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    this.app.use('/api/admin', apiRateLimit);
    this.app.use('/api/admin/config', configRateLimit);
    this.app.use('/api/admin/logs', logsRateLimit);

    // Performance monitoring
    this.app.use((_req, res, next) => {
      res.setHeader('X-Response-Time', `${Date.now()}`);
      next();
    });

    // Health check endpoints
    this.app.get('/health', async (_req, res) => {
      const health = await this.healthChecker.getBasicHealth();
      res.json(health);
    });

    this.app.get('/health/detailed', async (_req, res) => {
      const health = await this.healthChecker.getDetailedHealth();
      res.json(health);
    });

    // API routes
    const adminRoutes = new AdminRoutes(
      this.prisma,
      this.moderationService,
      this.reportService,
      this.ticketService,
      this.scoringService
    );

    this.app.use('/api/admin', adminRoutes.getRouter());

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Error handling
    this.app.use(errorLogger);
    this.app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Express error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Sentinel AI...');

      // Connect to Redis
      await redisClient.connect();

      // Connect to Discord
      await this.client.login(process.env['DISCORD_BOT_TOKEN']);

      // Start Express server
      const port = process.env['PORT'] || 3000;
      this.app.listen(port, () => {
        logger.info(`Express server running on port ${port}`);
      });

      logger.info('Sentinel AI started successfully');
    } catch (error) {
      logger.error('Failed to start Sentinel AI:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Shutting down Sentinel AI...');

      // Disconnect from Discord
      if (this.client.isReady()) {
        this.client.destroy();
      }

      // Disconnect from Redis
      await redisClient.disconnect();

      // Disconnect from database
      await this.prisma.$disconnect();

      logger.info('Sentinel AI shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Start the bot
const bot = new SentinelAI();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await bot.stop();
  process.exit(0);
});

// Start the application
bot.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
