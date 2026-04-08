import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface RequestLog {
  method: string;
  url: string;
  ip: string;
  userAgent?: string | undefined;
  userId?: string | undefined;
  guildId?: string | undefined;
  responseTime: number;
  statusCode: number;
  timestamp: string;
}

export class RequestLogger {
  private static instance: RequestLogger;
  private requests: RequestLog[] = [];
  private maxLogs = 1000;

  static getInstance(): RequestLogger {
    if (!RequestLogger.instance) {
      RequestLogger.instance = new RequestLogger();
    }
    return RequestLogger.instance;
  }

  logRequest(req: Request, res: Response, responseTime: number): void {
    const log: RequestLog = {
      method: req.method,
      url: req.url,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      userId: req.headers['x-user-id'] as string,
      guildId: req.headers['x-guild-id'] as string,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    };

    // Store in memory (for recent requests)
    this.requests.push(log);
    if (this.requests.length > this.maxLogs) {
      this.requests.shift();
    }

    // Log to file/database for important requests
    if (res.statusCode >= 400 || req.url.startsWith('/api/admin')) {
      logger.info('API Request', log);
    }
  }

  getRecentRequests(limit: number = 100): RequestLog[] {
    return this.requests.slice(-limit);
  }

  getRequestsByUser(userId: string, limit: number = 50): RequestLog[] {
    return this.requests
      .filter(req => req.userId === userId)
      .slice(-limit);
  }

  getErrorRequests(limit: number = 50): RequestLog[] {
    return this.requests
      .filter(req => req.statusCode >= 400)
      .slice(-limit);
  }

  getAverageResponseTime(): number {
    if (this.requests.length === 0) return 0;
    
    const totalTime = this.requests.reduce((sum, req) => sum + req.responseTime, 0);
    return totalTime / this.requests.length;
  }

  getRequestsPerMinute(): number {
    if (this.requests.length === 0) return 0;
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentRequests = this.requests.filter(req => 
      new Date(req.timestamp).getTime() >= oneMinuteAgo
    );
    
    return recentRequests.length;
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]): Response {
    const responseTime = Date.now() - startTime;
    RequestLogger.getInstance().logRequest(req, res, responseTime);
    return originalEnd(...args);
  };
  
  next();
};

export const detailedLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.headers['x-user-id']
  });
  
  // Override res.end to capture completion
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]): Response {
    const responseTime = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userId: req.headers['x-user-id']
    });
    
    return originalEnd(...args);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (error: any, req: Request, _res: Response, next: NextFunction): void => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.headers['x-user-id'],
    body: req.body,
    query: req.query
  });
  
  next(error);
};
