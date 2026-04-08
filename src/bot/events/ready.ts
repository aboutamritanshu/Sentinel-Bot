import { Client, ActivityType } from 'discord.js';
import { AnnouncementService } from '../../services/announcement.service';
import logger from '../../utils/logger';

export class ReadyHandler {
  constructor(
    private client: Client,
    private announcementService: AnnouncementService
  ) {}

  async handle(): Promise<void> {
    try {
      logger.info(`Bot logged in as ${this.client.user?.tag}`);
      logger.info(`Bot is in ${this.client.guilds.cache.size} guilds`);

      await this.client.user?.setActivity('Sentinel AI Moderation', { type: ActivityType.Watching });

      await this.announcementService.startPeriodicScanning(30);

      logger.info('Bot is ready and fully operational');
    } catch (error) {
      logger.error('Error in ready handler:', error);
    }
  }
}
