import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

export interface CommandUsage {
  command: string;
  userId: string;
  guildId: string;
  timestamp: Date;
  success: boolean;
  responseTime: number;
}

export interface ServerStats {
  totalMembers: number;
  activeMembers: number;
  totalMessages: number;
  totalViolations: number;
  totalReports: number;
  totalTickets: number;
  botUptime: number;
}

export interface ModerationAnalytics {
  period: string;
  totalActions: number;
  warnings: number;
  timeouts: number;
  kicks: number;
  bans: number;
  activeCases: number;
  topViolators: Array<{
    userId: string;
    tag: string;
    violations: number;
  }>;
  trends: Array<{
    date: string;
    actions: number;
  }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async trackCommandUsage(usage: Omit<CommandUsage, 'timestamp'>): Promise<void> {
    try {
      // Store command usage in database
      await this.prisma.$executeRaw`
        INSERT INTO analytics (event_type, data, created_at)
        VALUES ('command_usage', ${JSON.stringify(usage)}, NOW())
      `;

      logger.debug('Command usage tracked', { command: usage.command });
    } catch (error) {
      logger.error('Failed to track command usage:', error);
    }
  }

  async getServerStats(guildId: string): Promise<ServerStats> {
    try {
      const [
        totalMembers,
        activeMembers,
        totalMessages,
        totalViolations,
        totalReports,
        totalTickets
      ] = await Promise.all([
        this.getTotalMembers(guildId),
        this.getActiveMembers(guildId),
        this.getTotalMessages(guildId),
        this.getTotalViolations(guildId),
        this.getTotalReports(guildId),
        this.getTotalTickets(guildId)
      ]);

      return {
        totalMembers,
        activeMembers,
        totalMessages,
        totalViolations,
        totalReports,
        totalTickets,
        botUptime: process.uptime()
      };
    } catch (error) {
      logger.error('Failed to get server stats:', error);
      throw error;
    }
  }

  async getModerationAnalytics(guildId: string, period: '24h' | '7d' | '30d'): Promise<ModerationAnalytics> {
    try {
      const dateFilter = this.getDateFilter(period);

      const [
        totalActions,
        warnings,
        timeouts,
        kicks,
        bans,
        activeCases,
        topViolators,
        trends
      ] = await Promise.all([
        this.getTotalActions(guildId, dateFilter),
        this.getWarningsCount(guildId, dateFilter),
        this.getTimeoutsCount(guildId, dateFilter),
        this.getKicksCount(guildId, dateFilter),
        this.getBansCount(guildId, dateFilter),
        this.getActiveCasesCount(guildId),
        this.getTopViolators(guildId, dateFilter),
        this.getActionTrends(guildId, dateFilter)
      ]);

      return {
        period,
        totalActions,
        warnings,
        timeouts,
        kicks,
        bans,
        activeCases,
        topViolators,
        trends
      };
    } catch (error) {
      logger.error('Failed to get moderation analytics:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        averageResponseTime: await this.getAverageResponseTime(),
        requestsPerMinute: await this.getRequestsPerMinute(),
        errorRate: await this.getErrorRate(),
        memoryUsage: memoryUsage.heapUsed,
        cpuUsage: cpuUsage.user
      };
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  async generateReport(guildId: string, period: '24h' | '7d' | '30d'): Promise<any> {
    try {
      const [serverStats, moderationAnalytics, performanceMetrics] = await Promise.all([
        this.getServerStats(guildId),
        this.getModerationAnalytics(guildId, period),
        this.getPerformanceMetrics()
      ]);

      return {
        generatedAt: new Date().toISOString(),
        period,
        guildId,
        serverStats,
        moderationAnalytics,
        performanceMetrics,
        recommendations: this.generateRecommendations(serverStats, moderationAnalytics)
      };
    } catch (error) {
      logger.error('Failed to generate report:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getTotalMembers(guildId: string): Promise<number> {
    // This would typically use Discord.js API
    // For now, return a placeholder
    return 0;
  }

  private async getActiveMembers(guildId: string): Promise<number> {
    // Members who have been active in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      const result = await this.prisma.$queryRaw`
        SELECT COUNT(DISTINCT user_id) as count
        FROM messages 
        WHERE guild_id = ${guildId} AND created_at >= ${sevenDaysAgo}
      ` as Array<{ count: bigint }>;
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      return 0;
    }
  }

  private async getTotalMessages(guildId: string): Promise<number> {
    try {
      const result = await this.prisma.message.count({
        where: { guildId }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalViolations(guildId: string): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: { guildId }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalReports(guildId: string): Promise<number> {
    try {
      const result = await this.prisma.report.count({
        where: { guildId }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalTickets(guildId: string): Promise<number> {
    try {
      const result = await this.prisma.ticket.count({
        where: { guildId }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private getDateFilter(period: '24h' | '7d' | '30d'): Date {
    const now = new Date();
    switch (period) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private async getTotalActions(guildId: string, since: Date): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: {
          guildId,
          createdAt: { gte: since }
        }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getWarningsCount(guildId: string, since: Date): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: {
          guildId,
          action: 'warn',
          createdAt: { gte: since }
        }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getTimeoutsCount(guildId: string, since: Date): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: {
          guildId,
          action: 'timeout',
          createdAt: { gte: since }
        }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getKicksCount(guildId: string, since: Date): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: {
          guildId,
          action: 'kick',
          createdAt: { gte: since }
        }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getBansCount(guildId: string, since: Date): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: {
          guildId,
          action: 'ban',
          createdAt: { gte: since }
        }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveCasesCount(guildId: string): Promise<number> {
    try {
      const result = await this.prisma.violation.count({
        where: {
          guildId,
          status: 'active'
        }
      });
      return result;
    } catch (error) {
      return 0;
    }
  }

  private async getTopViolators(guildId: string, since: Date): Promise<Array<{ userId: string; tag: string; violations: number }>> {
    try {
      const results = await this.prisma.violation.groupBy({
        by: ['userId'],
        where: {
          guildId,
          createdAt: { gte: since }
        },
        _count: {
          userId: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 5
      });

      return results.map(result => ({
        userId: result.userId,
        tag: `User#${result.userId.slice(-4)}`, // Placeholder tag
        violations: result._count.userId
      }));
    } catch (error) {
      return [];
    }
  }

  private async getActionTrends(guildId: string, since: Date): Promise<Array<{ date: string; actions: number }>> {
    try {
      // Get daily action counts for the period
      const results = await this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as actions
        FROM violations
        WHERE guild_id = ${guildId} AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      ` as Array<{ date: Date; actions: bigint }>;

      return results.map(result => ({
        date: result.date.toISOString().split('T')[0],
        actions: Number(result.actions)
      }));
    } catch (error) {
      return [];
    }
  }

  private async getAverageResponseTime(): Promise<number> {
    // This would track actual response times
    // For now, return a placeholder
    return 150;
  }

  private async getRequestsPerMinute(): Promise<number> {
    // This would track actual request rates
    // For now, return a placeholder
    return 10;
  }

  private async getErrorRate(): Promise<number> {
    // This would track actual error rates
    // For now, return a placeholder
    return 0.02; // 2%
  }

  private generateRecommendations(serverStats: ServerStats, analytics: ModerationAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.totalActions > 50) {
      recommendations.push('Consider increasing moderation team size due to high activity');
    }

    if (analytics.activeCases > 20) {
      recommendations.push('Review and resolve active cases to maintain server health');
    }

    if (serverStats.totalViolations > serverStats.totalMembers * 0.1) {
      recommendations.push('Violation rate is high. Consider reviewing server rules and moderation policies');
    }

    if (analytics.topViolators.length > 0 && analytics.topViolators[0].violations > 10) {
      recommendations.push('Consider taking action against repeat violators');
    }

    if (recommendations.length === 0) {
      recommendations.push('Server moderation is running smoothly. Keep up the good work!');
    }

    return recommendations;
  }
}
