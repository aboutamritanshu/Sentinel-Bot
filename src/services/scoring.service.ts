import { PrismaClient } from '@prisma/client';
import { ModerationService, WordScoringConfig } from './moderation.service';
import logger from '../utils/logger';

export interface ScoringResult {
  aiScore: number;
  wordScore: number;
  totalScore: number;
  detectedWords: string[];
}

export class ScoringService {
  constructor(
    private prisma: PrismaClient,
    private moderationService: ModerationService
  ) {}

  async calculateTotalScore(
    content: string,
    aiSeverity: number,
    guildId: string
  ): Promise<ScoringResult> {
    try {
      const config = await this.moderationService.getServerConfig(guildId);
      const wordScoringConfig = config.wordScoringConfig as WordScoringConfig;

      const { score: wordScore, detectedWords } = this.calculateWordScore(
        content,
        wordScoringConfig
      );

      const totalScore = aiSeverity + wordScore;

      const result: ScoringResult = {
        aiScore: aiSeverity,
        wordScore,
        totalScore,
        detectedWords
      };

      logger.info(`Score calculation - AI: ${aiSeverity}, Words: ${wordScore}, Total: ${totalScore}`);
      return result;
    } catch (error) {
      logger.error('Error in calculateTotalScore:', error);
      throw error;
    }
  }

  calculateWordScore(content: string, wordScoringConfig: WordScoringConfig): {
    score: number;
    detectedWords: string[];
  } {
    try {
      const words = content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0);

      let score = 0;
      const detectedWords: string[] = [];

      for (const word of words) {
        if (wordScoringConfig[word]) {
          score += wordScoringConfig[word];
          detectedWords.push(word);
        }
      }

      return { score, detectedWords };
    } catch (error) {
      logger.error('Error in calculateWordScore:', error);
      return { score: 0, detectedWords: [] };
    }
  }

  async updateWordScoringConfig(
    guildId: string,
    newConfig: WordScoringConfig
  ): Promise<void> {
    try {
      await this.moderationService.updateServerConfig(guildId, {
        wordScoringConfig: newConfig as any
      });

      logger.info(`Updated word scoring config for guild ${guildId}`);
    } catch (error) {
      logger.error('Error updating word scoring config:', error);
      throw error;
    }
  }

  async getTopViolators(_guildId: string, limit: number = 10): Promise<Array<{
    discordId: string;
    violationScore: number;
    warnings: number;
    timeouts: number;
    isBanned: boolean;
  }>> {
    try {
      const users = await this.prisma.user.findMany({
        take: limit,
        orderBy: { violationScore: 'desc' },
        select: {
          discordId: true,
          violationScore: true,
          warnings: true,
          timeouts: true,
          isBanned: true
        }
      });

      return users;
    } catch (error) {
      logger.error('Error getting top violators:', error);
      throw error;
    }
  }

  async getViolationTrends(_guildId: string, days: number = 7): Promise<{
    date: string;
    violations: number;
    warnings: number;
    timeouts: number;
    bans: number;
  }[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const violations = await this.prisma.violation.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      const trends = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayViolations = violations.filter(v => 
          v.createdAt.toISOString().split('T')[0] === dateStr
        );

        if (dateStr) {
          trends.push({
            date: dateStr,
            violations: dayViolations.reduce((sum: number, v: any) => sum + v._count.id, 0),
            warnings: 0,
            timeouts: 0,
            bans: 0
          });
        }
      }

      return trends.reverse();
    } catch (error) {
      logger.error('Error getting violation trends:', error);
      throw error;
    }
  }

  async resetUserScore(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          violationScore: 0,
          warnings: 0,
          timeouts: 0,
          isBanned: false
        }
      });

      await this.prisma.violation.deleteMany({
        where: { userId }
      });

      logger.info(`Reset score for user: ${userId}`);
    } catch (error) {
      logger.error('Error resetting user score:', error);
      throw error;
    }
  }

  validateWordScoringConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof config !== 'object' || config === null) {
      errors.push('Config must be an object');
      return { isValid: false, errors };
    }

    for (const [word, scoreValue] of Object.entries(config)) {
      if (typeof word !== 'string' || word.trim().length === 0) {
        errors.push(`Invalid word: ${word}`);
      }

      const score = scoreValue as number;
      if (typeof score !== 'number' || score < 0) {
        errors.push(`Invalid score for word "${word}": must be a non-negative number`);
      }

      if (score > 100) {
        errors.push(`Score for word "${word}" is too high (max: 100)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
