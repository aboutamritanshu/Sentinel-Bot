import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

export interface AdminRequest extends Request {
  guildId?: string;
  userId?: string;
}

export class AdminMiddleware {
  constructor(private prisma: PrismaClient) {}

  requireAdmin = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guildId = req.params['guildId'] || req.body['guildId'];
      const userId = req.headers['x-user-id'] as string;

      if (!guildId || !userId) {
        res.status(400).json({ error: 'Missing guildId or userId' });
        return;
      }

      req.guildId = guildId;
      req.userId = userId;

      const user = await this.prisma.user.findUnique({
        where: { discordId: userId }
      });

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      if (user.isBanned) {
        res.status(403).json({ error: 'User is banned' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in admin middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  requireGuildAdmin = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.guildId || !req.userId) {
        res.status(400).json({ error: 'Missing guildId or userId' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in guild admin middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
