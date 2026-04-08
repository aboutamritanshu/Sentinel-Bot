import { PrismaClient, Report } from '@prisma/client';
import { AIService, AIDisputeResponse } from './ai.service';
import logger from '../utils/logger';

export interface CreateReportData {
  reporterId: string;
  reportedUserId: string;
  guildId: string;
  channelId: string;
  messageId?: string;
  reason?: string;
}

export class ReportService {
  constructor(
    private prisma: PrismaClient,
    private aiService: AIService
  ) {}

  async createReport(data: CreateReportData): Promise<Report> {
    try {
      const report = await this.prisma.report.create({
        data: {
          reporterId: data.reporterId,
          reportedUserId: data.reportedUserId,
          status: 'pending'
        }
      });

      logger.info(`Created report: ${report.id}`);
      return report;
    } catch (error) {
      logger.error('Error creating report:', error);
      throw error;
    }
  }

  async analyzeReport(
    reportId: string,
    conversation: Array<{ author: string; content: string; timestamp: string }>
  ): Promise<{ report: Report; aiVerdict: AIDisputeResponse }> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: {
          reporter: true,
          reportedUser: true
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      const aiVerdict = await this.aiService.analyzeDispute(conversation);

      const updatedReport = await this.prisma.report.update({
        where: { id: reportId },
        data: {
          aiVerdict: aiVerdict as any,
          status: 'analyzed'
        }
      });

      logger.info(`Analyzed report ${reportId} with verdict: ${aiVerdict.recommendedAction}`);
      
      return {
        report: updatedReport,
        aiVerdict
      };
    } catch (error) {
      logger.error('Error analyzing report:', error);
      throw error;
    }
  }

  async getReportsByGuild(_guildId: string, limit: number = 50): Promise<Report[]> {
    try {
      const reports = await this.prisma.report.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              discordId: true
            }
          },
          reportedUser: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return reports;
    } catch (error) {
      logger.error('Error getting reports by guild:', error);
      throw error;
    }
  }

  async getReportsByUser(userId: string, limit: number = 50): Promise<Report[]> {
    try {
      const reports = await this.prisma.report.findMany({
        where: {
          OR: [
            { reporterId: userId },
            { reportedUserId: userId }
          ]
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              discordId: true
            }
          },
          reportedUser: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return reports;
    } catch (error) {
      logger.error('Error getting reports by user:', error);
      throw error;
    }
  }

  async updateReportStatus(reportId: string, status: string): Promise<Report> {
    try {
      const report = await this.prisma.report.update({
        where: { id: reportId },
        data: { status }
      });

      logger.info(`Updated report ${reportId} status to: ${status}`);
      return report;
    } catch (error) {
      logger.error('Error updating report status:', error);
      throw error;
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      await this.prisma.report.delete({
        where: { id: reportId }
      });

      logger.info(`Deleted report: ${reportId}`);
    } catch (error) {
      logger.error('Error deleting report:', error);
      throw error;
    }
  }

  async getReportStats(_guildId: string): Promise<{
    total: number;
    pending: number;
    analyzed: number;
    resolved: number;
  }> {
    try {
      const [total, pending, analyzed, resolved] = await Promise.all([
        this.prisma.report.count(),
        this.prisma.report.count({ where: { status: 'pending' } }),
        this.prisma.report.count({ where: { status: 'analyzed' } }),
        this.prisma.report.count({ where: { status: 'resolved' } })
      ]);

      return {
        total,
        pending,
        analyzed,
        resolved
      };
    } catch (error) {
      logger.error('Error getting report stats:', error);
      throw error;
    }
  }
}
