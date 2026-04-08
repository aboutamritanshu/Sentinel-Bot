import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModerationService } from '../services/moderation.service';
import { ReportService } from '../services/report.service';
import { TicketService } from '../services/ticket.service';
import { ScoringService } from '../services/scoring.service';
import { AdminMiddleware, AdminRequest } from '../middlewares/admin.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import { apiRateLimit, configRateLimit, logsRateLimit } from '../middlewares/rateLimit.middleware';
import { serverConfigSchema } from '../utils/validation';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();

export class AdminRoutes {
  constructor(
    private prisma: PrismaClient,
    private moderationService: ModerationService,
    private reportService: ReportService,
    private ticketService: TicketService,
    private scoringService: ScoringService
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const adminMiddleware = new AdminMiddleware(this.prisma);

    router.get('/config/:guildId', 
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.getConfig.bind(this)
    );

    router.put('/config/:guildId',
      configRateLimit,
      apiRateLimit,
      adminMiddleware.requireAdmin,
      validateParams(Joi.object({ guildId: Joi.string().required() })),
      validateBody(serverConfigSchema),
      this.updateConfig.bind(this)
    );

    router.get('/logs/:guildId',
      logsRateLimit,
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.getLogs.bind(this)
    );

    router.get('/users/:guildId',
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.getUsers.bind(this)
    );

    router.get('/stats/:guildId',
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.getStats.bind(this)
    );

    router.get('/reports/:guildId',
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.getReports.bind(this)
    );

    router.get('/tickets/:guildId',
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.getTickets.bind(this)
    );

    router.post('/reset-user/:userId',
      configRateLimit,
      apiRateLimit,
      adminMiddleware.requireAdmin,
      this.resetUser.bind(this)
    );
  }

  private async getConfig(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId } = req.params!;
      
      const config = await this.moderationService.getServerConfig(guildId!);
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get configuration'
      });
    }
  }

  private async updateConfig(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId } = req.params!;
      const configData = req.body;

      const updatedConfig = await this.moderationService.updateServerConfig(guildId!, configData);
      
      res.json({
        success: true,
        data: updatedConfig,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      logger.error('Error updating config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration'
      });
    }
  }

  private async getLogs(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId } = req.params!;
      const limit = parseInt(req.query['limit'] as string) || 100;

      const [violations, reports, tickets] = await Promise.all([
        this.prisma.violation.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                discordId: true
              }
            }
          }
        }),
        this.reportService.getReportsByGuild(guildId!, limit),
        this.ticketService.getRecentActivity(24)
      ]);

      res.json({
        success: true,
        data: {
          violations,
          reports,
          tickets
        }
      });
    } catch (error) {
      logger.error('Error getting logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get logs'
      });
    }
  }

  private async getUsers(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId } = req.params!;
      const limit = parseInt(req.query['limit'] as string) || 50;
      const sortBy = req.query['sortBy'] as string || 'violationScore';

      let users;
      if (sortBy === 'violationScore') {
        users = await this.scoringService.getTopViolators(guildId!, limit);
      } else {
        users = await this.prisma.user.findMany({
          take: limit,
          orderBy: { [sortBy]: 'desc' },
          select: {
            id: true,
            discordId: true,
            violationScore: true,
            warnings: true,
            timeouts: true,
            isBanned: true,
            createdAt: true
          }
        });
      }

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      });
    }
  }

  private async getStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId } = req.params!;

      const [reportStats, ticketStats, violationTrends] = await Promise.all([
        await this.reportService.getReportStats(guildId!),
        this.ticketService.getTicketStats(),
        await this.scoringService.getViolationTrends(guildId!, 7)
      ]);

      res.json({
        success: true,
        data: {
          reports: reportStats,
          tickets: ticketStats,
          violations: violationTrends
        }
      });
    } catch (error) {
      logger.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  }

  private async getReports(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId } = req.params!;
      const limit = parseInt(req.query['limit'] as string) || 50;
      const status = req.query['status'] as string;

      let reports;
      if (status) {
        reports = await this.prisma.report.findMany({
          where: { status },
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: {
                discordId: true
              }
            },
            reportedUser: {
              select: {
                discordId: true
              }
            }
          }
        });
      } else {
        reports = await this.reportService.getReportsByGuild(guildId!, limit);
      }

      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      logger.error('Error getting reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get reports'
      });
    }
  }

  private async getTickets(_req: AdminRequest, res: Response): Promise<void> {
    try {
      const { guildId: _guildId } = _req.params!;
      const limit = parseInt(_req.query['limit'] as string) || 50;
      const status = _req.query['status'] as string;

      let tickets;
      if (status === 'open') {
        tickets = await this.ticketService.getOpenTickets(limit);
      } else if (status) {
        tickets = await this.prisma.ticket.findMany({
          where: { status },
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                discordId: true
              }
            }
          }
        });
      } else {
        tickets = await this.prisma.ticket.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                discordId: true
              }
            }
          }
        });
      }

      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      logger.error('Error getting tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tickets'
      });
    }
  }

  private async resetUser(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params!;

      await this.scoringService.resetUserScore(userId!);

      res.json({
        success: true,
        message: 'User score reset successfully'
      });
    } catch (error) {
      logger.error('Error resetting user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset user'
      });
    }
  }

  getRouter(): Router {
    return router;
  }
}
