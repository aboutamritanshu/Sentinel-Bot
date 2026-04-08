import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { redisClient } from '../utils/redis';
import logger from '../utils/logger';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const createRateLimit = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = req.headers['x-user-id'] as string;
      return userId || req.ip || 'unknown';
    },
    skip: async (req: Request) => {
      try {
        const userId = req.headers['x-user-id'] as string;
        if (userId) {
          const isAdmin = await redisClient.get(`admin:${userId}`);
          return !!isAdmin;
        }
        return false;
      } catch {
        return false;
      }
    },
    handler: (req: Request, res: Response) => {
      const userId = req.headers['x-user-id'] as string;
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId,
        endpoint: req.path,
        method: req.method
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false
  });
};

// Predefined rate limits
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again later.'
});

export const configRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many configuration changes, please try again later.'
});

export const logsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many log requests, please try again later.'
});

export const strictRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: 'Strict rate limit exceeded. Please wait before trying again.'
});

export const commandRateLimit = createRateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 3,
  message: 'Too many commands, please wait before trying again.'
});
