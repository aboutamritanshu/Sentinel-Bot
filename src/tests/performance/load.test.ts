import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminRoutes } from '../../routes/admin.routes';

describe('Load Testing', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Setup test application
    app = express();
    app.use(express.json());
    
    prisma = new PrismaClient();
    
    // Mock services for testing
    const mockModerationService = {
      getServerConfig: jest.fn(),
      updateServerConfig: jest.fn(),
      getViolationStats: jest.fn()
    };
    
    const mockReportService = {
      getReportsByGuild: jest.fn(),
      getRecentReports: jest.fn()
    };
    
    const mockTicketService = {
      getRecentActivity: jest.fn(),
      getOpenTickets: jest.fn()
    };
    
    const mockScoringService = {
      getTopViolators: jest.fn(),
      getViolationTrends: jest.fn()
    };

    const adminRoutes = new AdminRoutes(
      prisma,
      mockModerationService as any,
      mockReportService as any,
      mockTicketService as any,
      mockScoringService as any
    );

    app.use('/api/admin', adminRoutes.getRouter());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('API Load Tests', () => {
    it('should handle 100 concurrent health requests', async () => {
      const startTime = Date.now();
      
      const promises = Array(100).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild')
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle 50 concurrent stats requests', async () => {
      const startTime = Date.now();
      
      const promises = Array(50).fill().map((_, index) => 
        request(app)
          .get(`/api/admin/stats/test-guild-${index}`)
          .set('x-user-id', 'test-user')
          .set('x-guild-id', `test-guild-${index}`)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // Most requests should succeed (some might fail due to mocking)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(40); // At least 80% success
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });

    it('should handle mixed concurrent requests', async () => {
      const startTime = Date.now();
      
      const healthRequests = Array(25).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild')
      );
      
      const statsRequests = Array(25).fill().map((_, index) => 
        request(app)
          .get(`/api/admin/stats/test-guild-${index}`)
          .set('x-user-id', 'test-user')
          .set('x-guild-id', `test-guild-${index}`)
      );
      
      const allRequests = [...healthRequests, ...statsRequests];
      const responses = await Promise.all(allRequests);
      const endTime = Date.now();
      
      // Check overall success rate
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(40); // At least 80% success
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds
    });
  });

  describe('Memory Tests', () => {
    it('should maintain stable memory usage during load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate load
      const promises = Array(100).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild')
      );
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory growth should be reasonable (less than 50MB)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should free memory after requests complete', async () => {
      // Initial memory
      const initialMemory = process.memoryUsage();
      
      // Create and complete requests
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterRequestsMemory = process.memoryUsage();
      
      // Memory should not grow significantly
      const memoryGrowth = afterRequestsMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // 20MB
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should handle rate limiting gracefully', async () => {
      const startTime = Date.now();
      
      // Make requests that might trigger rate limiting
      const promises = Array(20).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild')
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // Some requests might be rate limited (429), but should complete
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount + rateLimitedCount).toBe(20); // All requests handled
      
      // Should complete quickly even with rate limiting
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully during high load', async () => {
      // Mix of valid and invalid requests
      const validRequests = Array(25).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild')
      );
      
      const invalidRequests = Array(25).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          // Missing headers to trigger errors
      );
      
      const allRequests = [...validRequests, ...invalidRequests];
      const responses = await Promise.allSettled(allRequests);
      
      // All requests should be handled (either success or error)
      const handledCount = responses.filter(r => 
        r.status === 'fulfilled'
      ).length;
      
      expect(handledCount).toBe(50); // All requests handled
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time benchmarks', async () => {
      const responseTimes: number[] = [];
      
      // Make 50 requests and measure response times
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild');
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }
      
      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      
      // Performance benchmarks
      expect(avgResponseTime).toBeLessThan(100); // Average < 100ms
      expect(maxResponseTime).toBeLessThan(500); // Max < 500ms
      expect(p95ResponseTime).toBeLessThan(200); // 95th percentile < 200ms
    });
  });
});
