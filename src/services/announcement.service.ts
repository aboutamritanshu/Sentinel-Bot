import { Client, TextChannel } from 'discord.js';
import { AIService } from './ai.service';
import { redisClient } from '../utils/redis';
import logger from '../utils/logger';

export interface AnnouncementConfig {
  channelId: string;
  relevanceThreshold: number;
  cooldownMinutes: number;
  enabled: boolean;
}

export interface TopicAnalysis {
  topic: string;
  confidence: number;
  messageCount: number;
}

export class AnnouncementService {
  private announcementConfigs = new Map<string, AnnouncementConfig>();

  constructor(
    private client: Client,
    private aiService: AIService
  ) {}

  async scanChannelActivity(channelId: string): Promise<void> {
    try {
      const config = this.announcementConfigs.get(channelId);
      if (!config || !config.enabled) {
        return;
      }

      const isRateLimited = await this.isRateLimited(channelId, config.cooldownMinutes * 60);
      if (isRateLimited) {
        return;
      }

      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        logger.warn(`Channel ${channelId} not found`);
        return;
      }

      const messages = await this.fetchRecentMessages(channel, 50);
      if (messages.length < 10) {
        return;
      }

      const topics = await this.analyzeChannelTopics(messages);
      const relevantTopic = await this.findRelevantAnnouncement(topics, config.relevanceThreshold);

      if (relevantTopic) {
        await this.postAnnouncement(channel, relevantTopic);
        await this.setRateLimit(channelId, config.cooldownMinutes * 60);
      }
    } catch (error) {
      logger.error('Error scanning channel activity:', error);
    }
  }

  async configureAnnouncement(
    channelId: string,
    config: AnnouncementConfig
  ): Promise<void> {
    this.announcementConfigs.set(channelId, config);
    logger.info(`Configured announcements for channel ${channelId}`);
  }

  async fetchRecentMessages(channel: TextChannel, limit: number): Promise<string[]> {
    try {
      const messages = await channel.messages.fetch({ limit });
      return messages
        .filter(msg => !msg.author.bot)
        .map(msg => msg.content)
        .filter(content => content.length > 0);
    } catch (error) {
      logger.error('Error fetching recent messages:', error);
      return [];
    }
  }

  async analyzeChannelTopics(messages: string[]): Promise<TopicAnalysis[]> {
    try {
      const aiTopics = await this.aiService.detectTopics(messages);
      
      const topicMap = new Map<string, TopicAnalysis>();
      
      for (const aiTopic of aiTopics) {
        const topic = aiTopic.topic.toLowerCase();
        const existing = topicMap.get(topic);
        
        if (existing) {
          existing.confidence = Math.max(existing.confidence, aiTopic.confidence);
          existing.messageCount += 1;
        } else {
          topicMap.set(topic, {
            topic,
            confidence: aiTopic.confidence,
            messageCount: 1
          });
        }
      }

      return Array.from(topicMap.values())
        .filter(topic => topic.confidence >= 0.3)
        .sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error analyzing channel topics:', error);
      return [];
    }
  }

  async findRelevantAnnouncement(
    topics: TopicAnalysis[],
    threshold: number
  ): Promise<TopicAnalysis | null> {
    try {
      const relevantTopics = topics.filter(topic => topic.confidence >= threshold);
      
      if (relevantTopics.length === 0) {
        return null;
      }

      return relevantTopics[0] || null;
    } catch (error) {
      logger.error('Error finding relevant announcement:', error);
      return null;
    }
  }

  async postAnnouncement(channel: TextChannel, topic: TopicAnalysis): Promise<void> {
    try {
      const announcement = await this.generateAnnouncement(topic);
      
      await channel.send({
        content: announcement,
        allowedMentions: { parse: [] }
      });

      logger.info(`Posted announcement in channel ${channel.id} about topic: ${topic.topic}`);
    } catch (error) {
      logger.error('Error posting announcement:', error);
    }
  }

  async generateAnnouncement(topic: TopicAnalysis): Promise<string> {
    const prompt = `Generate a brief, helpful announcement about the topic "${topic.topic}" that's being discussed in the community. 
    The topic has a confidence score of ${topic.confidence} and was mentioned in ${topic.messageCount} messages.
    
    Guidelines:
    - Keep it under 200 characters
    - Make it helpful and engaging
    - Don't be promotional
    - Match the community tone
    - Include relevant emojis if appropriate`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful community assistant that generates brief, relevant announcements.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      });

      const data = await response.json() as any;
      return data.choices[0]?.message?.content || `Interesting discussion about ${topic.topic}! 🎯`;
    } catch (error) {
      logger.error('Error generating announcement:', error);
      return `Interesting discussion about ${topic.topic}! 🎯`;
    }
  }

  private async isRateLimited(channelId: string, _cooldownSeconds: number): Promise<boolean> {
    try {
      const key = `announcement_cooldown:${channelId}`;
      const exists = await redisClient.exists(key);
      return exists;
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      return false;
    }
  }

  private async setRateLimit(channelId: string, cooldownSeconds: number): Promise<void> {
    try {
      const key = `announcement_cooldown:${channelId}`;
      await redisClient.set(key, '1', cooldownSeconds);
    } catch (error) {
      logger.error('Error setting rate limit:', error);
    }
  }

  async getAnnouncementStats(channelId: string): Promise<{
    enabled: boolean;
    lastPosted?: string;
    topicsAnalyzed: number;
  }> {
    try {
      const config = this.announcementConfigs.get(channelId);
      const key = `announcement_stats:${channelId}`;
      const stats = await redisClient.get(key);

      return {
        enabled: config?.enabled || false,
        lastPosted: stats ? JSON.parse(stats).lastPosted : undefined,
        topicsAnalyzed: stats ? JSON.parse(stats).topicsAnalyzed : 0
      };
    } catch (error) {
      logger.error('Error getting announcement stats:', error);
      return {
        enabled: false,
        topicsAnalyzed: 0
      };
    }
  }

  async startPeriodicScanning(intervalMinutes: number = 30): Promise<void> {
    setInterval(async () => {
      for (const [channelId, config] of this.announcementConfigs) {
        if (config.enabled) {
          await this.scanChannelActivity(channelId);
        }
      }
    }, intervalMinutes * 60 * 1000);

    logger.info(`Started periodic announcement scanning every ${intervalMinutes} minutes`);
  }
}
