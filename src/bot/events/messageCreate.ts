import { Message, TextChannel } from 'discord.js';
import { ModerationService } from '../../services/moderation.service';
import { AIService } from '../../services/ai.service';
import { ScoringService } from '../../services/scoring.service';
import logger from '../../utils/logger';

export class MessageCreateHandler {
  constructor(
    private moderationService: ModerationService,
    private aiService: AIService,
    private scoringService: ScoringService
  ) {}

  async handle(message: Message): Promise<void> {
    try {
      if (message.author.bot || !message.guild || !message.channel) {
        return;
      }

      const user = await this.moderationService.getOrCreateUser(message.author.id);
      
      if (user.isBanned) {
        await message.delete();
        return;
      }

      const isRateLimited = await this.moderationService.isRateLimited(
        message.author.id,
        'moderation',
        5,
        60
      );

      if (isRateLimited) {
        return;
      }

      const context = await this.fetchMessageContext(message.channel as TextChannel, 10);
      const aiResult = await this.aiService.moderateContent(message.content, context);
      
      const scoringResult = await this.scoringService.calculateTotalScore(
        message.content,
        aiResult.severity,
        message.guild.id
      );

      if (scoringResult.totalScore > 0) {
        const config = await this.moderationService.getServerConfig(message.guild.id);
        const moderationResult = await this.moderationService.determineAction(
          user,
          scoringResult.totalScore,
          config
        );

        if (moderationResult.action !== 'none') {
          await this.applyModerationAction(message, moderationResult, user);
          
          await this.moderationService.createViolation(
            user.id,
            message.content,
            scoringResult.totalScore,
            moderationResult.action
          );

          await this.moderationService.updateUserStats(user.id, moderationResult.action as any);
        }
      }

      logger.info(`Processed message from ${message.author.id}: ${scoringResult.totalScore} total score`);
    } catch (error) {
      logger.error('Error in messageCreate handler:', error);
    }
  }

  private async fetchMessageContext(channel: TextChannel, limit: number): Promise<string[]> {
    try {
      const messages = await channel.messages.fetch({ limit: limit + 1 });
      return messages
        .filter(msg => msg.id !== messages.first()?.id)
        .map(msg => msg.content)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error fetching message context:', error);
      return [];
    }
  }

  private async applyModerationAction(
    message: Message,
    result: any,
    _user: any
  ): Promise<void> {
    try {
      const guild = message.guild!;
      const member = await guild.members.fetch(message.author.id);

      switch (result.action) {
        case 'warn':
          await this.sendWarning(member, result.reason);
          break;

        case 'timeout':
          await this.applyTimeout(member, result.reason);
          break;

        case 'kick':
          await this.applyKick(member, result.reason);
          break;

        case 'ban':
          await this.applyBan(member, result.reason);
          break;
      }
    } catch (error) {
      logger.error('Error applying moderation action:', error);
    }
  }

  private async sendWarning(member: any, reason: string): Promise<void> {
    try {
      const warningMessage = `⚠️ **Warning** - ${member.user.username}\n${reason}`;
      await member.send(warningMessage).catch(() => {});
      logger.info(`Sent warning to ${member.user.id}: ${reason}`);
    } catch (error) {
      logger.error('Error sending warning:', error);
    }
  }

  private async applyTimeout(member: any, reason: string): Promise<void> {
    try {
      await member.timeout(15 * 60 * 1000, reason);
      const timeoutMessage = `🔇 **Timeout** - ${member.user.username}\n${reason}\nDuration: 15 minutes`;
      await member.send(timeoutMessage).catch(() => {});
      logger.info(`Applied timeout to ${member.user.id}: ${reason}`);
    } catch (error) {
      logger.error('Error applying timeout:', error);
    }
  }

  private async applyKick(member: any, reason: string): Promise<void> {
    try {
      await member.kick(reason);
      logger.info(`Kicked user ${member.user.id}: ${reason}`);
    } catch (error) {
      logger.error('Error applying kick:', error);
    }
  }

  private async applyBan(member: any, reason: string): Promise<void> {
    try {
      await member.ban({ reason });
      logger.info(`Banned user ${member.user.id}: ${reason}`);
    } catch (error) {
      logger.error('Error applying ban:', error);
    }
  }
}
