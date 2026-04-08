import { PrismaClient } from '@prisma/client';
import { Client } from 'discord.js';
import { redisClient } from './redis';
import logger from './logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    discord: ServiceHealth;
    ai: ServiceHealth;
  };
  uptime: number;
  timestamp: string;
  version: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

export class HealthChecker {
  constructor(
    private prisma: PrismaClient,
    private client: Client
  ) {}

  async getDetailedHealth(): Promise<HealthStatus> {
    const [database, redis, discord, ai] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiscord(),
      this.checkAI()
    ]);

    const services = {
      database: this.getServiceHealth(database),
      redis: this.getServiceHealth(redis),
      discord: this.getServiceHealth(discord),
      ai: this.getServiceHealth(ai)
    };

    const overallStatus = this.getOverallStatus(services);

    return {
      status: overallStatus,
      services,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0'
    };
  }

  private async checkDatabase(): Promise<{ responseTime: number }> {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return { responseTime: Date.now() - start };
  }

  private async checkRedis(): Promise<{ responseTime: number }> {
    const start = Date.now();
    await redisClient.set('health-check', 'ok');
    await redisClient.expire('health-check', 10);
    await redisClient.del('health-check');
    return { responseTime: Date.now() - start };
  }

  private async checkDiscord(): Promise<{ status: string; ping: number }> {
    const status = this.client.isReady() ? 'connected' : 'disconnected';
    const ping = this.client.ws.ping || 0;
    return { status, ping };
  }

  private async checkAI(): Promise<{ responseTime: number }> {
    const start = Date.now();
    // Simulate AI health check (you could add actual OpenAI ping here)
    await new Promise(resolve => setTimeout(resolve, 50));
    return { responseTime: Date.now() - start };
  }

  private getServiceHealth(result: PromiseSettledResult<any>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return {
        status: 'healthy',
        responseTime: result.value.responseTime || 0,
        lastCheck: new Date().toISOString()
      };
    } else {
      return {
        status: 'unhealthy',
        error: result.reason?.message || 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  private getOverallStatus(services: HealthStatus['services']): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map(s => s.status);
    
    if (statuses.every(s => s === 'healthy')) {
      return 'healthy';
    } else if (statuses.some(s => s === 'unhealthy')) {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  }

  async getBasicHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}
