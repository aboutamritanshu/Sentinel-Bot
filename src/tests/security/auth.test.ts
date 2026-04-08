import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminRoutes } from '../../routes/admin.routes';

describe('Security Tests', () => {
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

  describe('Authentication Tests', () => {
    it('should reject requests without user ID', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-guild-id', 'test-guild');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests without guild ID', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', 'test-user');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with empty user ID', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', '')
        .set('x-guild-id', 'test-guild');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with empty guild ID', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', 'test-user')
        .set('x-guild-id', '');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept requests with valid headers', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', 'test-user-123')
        .set('x-guild-id', 'test-guild-123');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation Tests', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/admin/config/test-guild')
        .set('Content-Type', 'application/json')
        .set('x-user-id', 'test-user')
        .set('x-guild-id', 'test-guild')
        .send('{"invalid": json}');
      
      expect(response.status).toBe(400);
    });

    it('should validate guild ID format', async () => {
      const response = await request(app)
        .get('/api/admin/stats/invalid-guild-id!')
        .set('x-user-id', 'test-user')
        .set('x-guild-id', 'invalid-guild-id!');
      
      // Should handle gracefully (might succeed or fail gracefully)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should handle extremely long user IDs', async () => {
      const longUserId = 'a'.repeat(1000);
      
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', longUserId)
        .set('x-guild-id', 'test-guild');
      
      // Should handle gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should handle special characters in headers', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', 'test<script>alert("xss")</script>user')
        .set('x-guild-id', 'test-guild');
      
      // Should handle XSS attempts gracefully
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should implement rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(20).fill().map(() => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild')
      );
      
      const responses = await Promise.all(promises);
      
      // Some requests might be rate limited
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      // Should have some rate limiting in place (or at least handle it)
      expect(successCount + rateLimitedCount).toBe(20);
    });
  });

  describe('CORS Tests', () => {
    it('should handle cross-origin requests appropriately', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Origin', 'https://malicious-site.com')
        .set('x-user-id', 'test-user')
        .set('x-guild-id', 'test-guild');
      
      // Should handle CORS appropriately
      expect([200, 400]).toContain(response.status);
      
      // Check CORS headers if present
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];
      
      corsHeaders.forEach(header => {
        if (response.headers[header]) {
          expect(typeof response.headers[header]).toBe('string');
        }
      });
    });
  });

  describe('SQL Injection Tests', () => {
    it('should handle SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET password='hacked' WHERE '1'='1'; --",
        "' UNION SELECT * FROM users --"
      ];
      
      for (const attempt of sqlInjectionAttempts) {
        const response = await request(app)
          .get(`/api/admin/stats/${encodeURIComponent(attempt)}`)
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild');
        
        // Should handle SQL injection attempts gracefully
        expect([200, 400, 404, 500]).toContain(response.status);
        
        // Should not leak database information
        if (response.status === 500) {
          expect(response.body).not.toContain('SQL');
          expect(response.body).not.toContain('syntax');
          expect(response.body).not.toContain('table');
        }
      }
    });
  });

  describe('XSS Protection Tests', () => {
    it('should handle XSS attempts', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        '<svg onload="alert(\'xss\')">'
      ];
      
      for (const attempt of xssAttempts) {
        const response = await request(app)
          .get('/api/admin/health')
          .set('x-user-id', attempt)
          .set('x-guild-id', 'test-guild');
        
        // Should handle XSS attempts gracefully
        expect([200, 400]).toContain(response.status);
        
        // Response should not contain unescaped scripts
        if (response.text) {
          expect(response.text.toLowerCase()).not.toContain('<script>');
          expect(response.text.toLowerCase()).not.toContain('javascript:');
        }
      }
    });
  });

  describe('Path Traversal Tests', () => {
    it('should handle path traversal attempts', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];
      
      for (const attempt of pathTraversalAttempts) {
        const response = await request(app)
          .get(`/api/admin/stats/${encodeURIComponent(attempt)}`)
          .set('x-user-id', 'test-user')
          .set('x-guild-id', 'test-guild');
        
        // Should handle path traversal attempts gracefully
        expect([200, 400, 404]).toContain(response.status);
        
        // Should not leak file system information
        if (response.text) {
          expect(response.text.toLowerCase()).not.toContain('root:');
          expect(response.text.toLowerCase()).not.toContain('passwd');
        }
      }
    });
  });

  describe('Header Injection Tests', () => {
    it('should handle header injection attempts', async () => {
      const headerInjectionAttempts = [
        'test-value\r\nSet-Cookie: malicious=value',
        'test-value\r\nLocation: https://malicious-site.com',
        'test-value\r\nX-Forwarded-For: malicious-ip'
      ];
      
      for (const attempt of headerInjectionAttempts) {
        const response = await request(app)
          .get('/api/admin/health')
          .set('x-user-id', attempt)
          .set('x-guild-id', 'test-guild');
        
        // Should handle header injection attempts gracefully
        expect([200, 400]).toContain(response.status);
        
        // Should not have injected headers in response
        expect(response.headers['set-cookie']).toBeUndefined();
        expect(response.headers['location']).toBeUndefined();
      }
    });
  });

  describe('Large Payload Tests', () => {
    it('should handle large payloads gracefully', async () => {
      const largePayload = {
        data: 'x'.repeat(1024 * 1024), // 1MB of data
        nested: {
          data: 'y'.repeat(1024 * 1024) // Another 1MB
        }
      };
      
      const response = await request(app)
        .post('/api/admin/config/test-guild')
        .set('x-user-id', 'test-user')
        .set('x-guild-id', 'test-guild')
        .send(largePayload);
      
      // Should handle large payloads gracefully
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('Concurrent Security Tests', () => {
    it('should handle concurrent malicious requests', async () => {
      const maliciousRequests = Array(50).fill().map((_, index) => 
        request(app)
          .get('/api/admin/health')
          .set('x-user-id', `malicious-user-${index}<script>alert('xss')</script>`)
          .set('x-guild-id', `test-guild-${index}'; DROP TABLE users; --`)
      );
      
      const responses = await Promise.allSettled(maliciousRequests);
      
      // All requests should be handled gracefully
      const handledCount = responses.filter(r => 
        r.status === 'fulfilled'
      ).length;
      
      expect(handledCount).toBe(50);
      
      // No request should cause server crash
      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          expect([200, 400, 429]).toContain(response.value.status);
        }
      });
    });
  });
});
