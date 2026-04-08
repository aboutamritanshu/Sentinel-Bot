import { createClient } from 'redis';
import logger from './logger';

class RedisClient {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env['REDIS_URL'] || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      logger.warn('Continuing without Redis - some features may be limited');
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available - skipping set operation');
      return;
    }
    try {
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Error setting Redis value:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available - skipping get operation');
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Error getting Redis value:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available - skipping delete operation');
      return;
    }
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Error deleting Redis key:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available - skipping exists operation');
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking Redis key existence:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available - skipping increment operation');
      return 0;
    }
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Error incrementing Redis key:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available - skipping expire operation');
      return;
    }
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Error setting Redis expiration:', error);
    }
  }

  getClient() {
    return this.client;
  }
}

export const redisClient = new RedisClient();
