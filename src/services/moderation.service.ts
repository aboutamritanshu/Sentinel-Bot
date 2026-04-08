import { PrismaClient, User, Violation, ServerConfig } from '@prisma/client';
import logger from '../utils/logger';
import { redisClient } from '../utils/redis';

export interface ModerationResult {
  action: 'none' | 'warn' | 'timeout' | 'kick' | 'ban';
  severityScore: number;
  reason: string;
}

export interface WordScoringConfig {
  [word: string]: number;
}

export class ModerationService {
  constructor(private prisma: PrismaClient) {}

  async getOrCreateUser(discordId: string): Promise<User> {
    try {
      let user = await this.prisma.user.findUnique({
        where: { discordId }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            discordId,
            violationScore: 0,
            warnings: 0,
            timeouts: 0,
            isBanned: false
          }
        });
        logger.info(`Created new user with Discord ID: ${discordId}`);
      }

      return user;
    } catch (error) {
      logger.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  async getServerConfig(guildId: string): Promise<ServerConfig> {
    try {
      let config = await this.prisma.serverConfig.findUnique({
        where: { guildId }
      });

      if (!config) {
        config = await this.prisma.serverConfig.create({
          data: {
            guildId,
            warningThreshold: 10,
            timeoutThreshold: 25,
            banThreshold: 50,
            wordScoringConfig: {},
            escalationConfig: {}
          }
        });
        logger.info(`Created default config for guild: ${guildId}`);
      }

      return config;
    } catch (error) {
      logger.error('Error in getServerConfig:', error);
      throw error;
    }
  }

  async updateServerConfig(guildId: string, configData: Partial<ServerConfig>): Promise<ServerConfig> {
    try {
      const config = await this.prisma.serverConfig.update({
        where: { guildId },
        data: {
          ...configData,
          updatedAt: new Date()
        } as any
      });

      await this.clearConfigCache(guildId);
      logger.info(`Updated config for guild: ${guildId}`);
      return config;
    } catch (error) {
      logger.error('Error in updateServerConfig:', error);
      throw error;
    }
  }

  async calculateWordScore(content: string, wordScoringConfig: WordScoringConfig): Promise<number> {
    try {
      const words = content.toLowerCase().split(/\s+/);
      let score = 0;

      for (const word of words) {
        if (wordScoringConfig[word]) {
          score += wordScoringConfig[word];
        }
      }

      return score;
    } catch (error) {
      logger.error('Error in calculateWordScore:', error);
      return 0;
    }
  }

  async determineAction(
    user: User,
    totalScore: number,
    config: ServerConfig
  ): Promise<ModerationResult> {
    try {
      const newViolationScore = user.violationScore + totalScore;

      if (newViolationScore >= config.banThreshold) {
        return {
          action: 'ban',
          severityScore: totalScore,
          reason: `Violation score (${newViolationScore}) exceeds ban threshold (${config.banThreshold})`
        };
      }

      if (newViolationScore >= config.timeoutThreshold) {
        return {
          action: 'timeout',
          severityScore: totalScore,
          reason: `Violation score (${newViolationScore}) exceeds timeout threshold (${config.timeoutThreshold})`
        };
      }

      if (newViolationScore >= config.warningThreshold) {
        return {
          action: 'warn',
          severityScore: totalScore,
          reason: `Violation score (${newViolationScore}) exceeds warning threshold (${config.warningThreshold})`
        };
      }

      return {
        action: 'none',
        severityScore: totalScore,
        reason: 'No action required'
      };
    } catch (error) {
      logger.error('Error in determineAction:', error);
      throw error;
    }
  }

  async createViolation(
    userId: string,
    content: string,
    severityScore: number,
    action: string
  ): Promise<Violation> {
    try {
      const violation = await this.prisma.violation.create({
        data: {
          userId,
          content,
          severityScore,
          action
        }
      });

      logger.info(`Created violation for user ${userId} with score ${severityScore}`);
      return violation;
    } catch (error) {
      logger.error('Error in createViolation:', error);
      throw error;
    }
  }

  async updateUserStats(
    userId: string,
    action: 'warn' | 'timeout' | 'ban'
  ): Promise<User> {
    try {
      const updateData: any = {};

      switch (action) {
        case 'warn':
          updateData.warnings = { increment: 1 };
          break;
        case 'timeout':
          updateData.timeouts = { increment: 1 };
          break;
        case 'ban':
          updateData.isBanned = true;
          break;
      }

      updateData.violationScore = { increment: 1 };

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      logger.info(`Updated user stats for ${userId}: ${action}`);
      return user;
    } catch (error) {
      logger.error('Error in updateUserStats:', error);
      throw error;
    }
  }

  async isRateLimited(discordId: string, action: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      const key = `rate_limit:${discordId}:${action}`;
      const current = await redisClient.get(key);

      if (current && parseInt(current) >= limit) {
        return true;
      }

      if (!current) {
        await redisClient.set(key, '1', windowSeconds);
      } else {
        await redisClient.incr(key);
      }

      return false;
    } catch (error) {
      logger.error('Error in isRateLimited:', error);
      return false;
    }
  }

  private async clearConfigCache(guildId: string): Promise<void> {
    try {
      await redisClient.del(`config:${guildId}`);
    } catch (error) {
      logger.error('Error clearing config cache:', error);
    }
  }
}
