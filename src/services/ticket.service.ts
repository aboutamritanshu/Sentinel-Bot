import { PrismaClient, Ticket } from '@prisma/client';
import { AIService, AITicketSummaryResponse } from './ai.service';
import logger from '../utils/logger';

export interface CreateTicketData {
  creatorId: string;
  categoryId: string;
  category: string;
  description?: string;
}

export interface TicketMessage {
  author: string;
  content: string;
  timestamp: string;
}

export class TicketService {
  constructor(
    private prisma: PrismaClient,
    private aiService: AIService
  ) {}

  async createTicket(data: CreateTicketData, channelId: string): Promise<Ticket> {
    try {
      const ticket = await this.prisma.ticket.create({
        data: {
          creatorId: data.creatorId,
          channelId,
          category: data.category,
          status: 'open'
        }
      });

      logger.info(`Created ticket: ${ticket.id} in channel: ${channelId}`);
      return ticket;
    } catch (error) {
      logger.error('Error creating ticket:', error);
      throw error;
    }
  }

  async closeTicket(
    ticketId: string,
    conversation: TicketMessage[]
  ): Promise<{ ticket: Ticket; summary: AITicketSummaryResponse }> {
    try {
      const summary = await this.aiService.summarizeTicket(conversation);

      const ticket = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'closed',
          aiSummary: summary as any,
          closedAt: new Date()
        }
      });

      logger.info(`Closed ticket: ${ticketId} with AI summary`);
      return { ticket, summary };
    } catch (error) {
      logger.error('Error closing ticket:', error);
      throw error;
    }
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          creator: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return ticket;
    } catch (error) {
      logger.error('Error getting ticket by ID:', error);
      throw error;
    }
  }

  async getTicketsByUser(userId: string, limit: number = 50): Promise<Ticket[]> {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { creatorId: userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return tickets;
    } catch (error) {
      logger.error('Error getting tickets by user:', error);
      throw error;
    }
  }

  async getOpenTickets(limit: number = 50): Promise<Ticket[]> {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { status: 'open' },
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          creator: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return tickets;
    } catch (error) {
      logger.error('Error getting open tickets:', error);
      throw error;
    }
  }

  async updateTicketStatus(ticketId: string, status: string): Promise<Ticket> {
    try {
      const ticket = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status }
      });

      logger.info(`Updated ticket ${ticketId} status to: ${status}`);
      return ticket;
    } catch (error) {
      logger.error('Error updating ticket status:', error);
      throw error;
    }
  }

  async deleteTicket(ticketId: string): Promise<void> {
    try {
      await this.prisma.ticket.delete({
        where: { id: ticketId }
      });

      logger.info(`Deleted ticket: ${ticketId}`);
    } catch (error) {
      logger.error('Error deleting ticket:', error);
      throw error;
    }
  }

  async getTicketStats(): Promise<{
    total: number;
    open: number;
    closed: number;
    averageResolutionTime: number;
  }> {
    try {
      const [total, open, closed] = await Promise.all([
        this.prisma.ticket.count(),
        this.prisma.ticket.count({ where: { status: 'open' } }),
        this.prisma.ticket.count({ where: { status: 'closed' } })
      ]);

      const closedTickets = await this.prisma.ticket.findMany({
        where: { 
          status: 'closed',
          closedAt: { not: null }
        },
        select: {
          createdAt: true,
          closedAt: true
        }
      });

      let averageResolutionTime = 0;
      if (closedTickets.length > 0) {
        const totalTime = closedTickets.reduce((sum, ticket) => {
          if (ticket.closedAt) {
            return sum + (ticket.closedAt.getTime() - ticket.createdAt.getTime());
          }
          return sum;
        }, 0);
        averageResolutionTime = totalTime / closedTickets.length / (1000 * 60 * 60);
      }

      return {
        total,
        open,
        closed,
        averageResolutionTime
      };
    } catch (error) {
      logger.error('Error getting ticket stats:', error);
      throw error;
    }
  }

  async getTicketsByCategory(category: string, limit: number = 50): Promise<Ticket[]> {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { category },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return tickets;
    } catch (error) {
      logger.error('Error getting tickets by category:', error);
      throw error;
    }
  }

  async getRecentActivity(hours: number = 24): Promise<Ticket[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const tickets = await this.prisma.ticket.findMany({
        where: {
          createdAt: {
            gte: since
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              discordId: true
            }
          }
        }
      });

      return tickets;
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw error;
    }
  }
}
