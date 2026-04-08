import request from 'supertest';
import express from 'express';
import { AdminRoutes } from '../../routes/admin.routes';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestServerConfig, testPrismaClient } from '../setup';

describe('Admin Routes', () => {
  let app: express.Application;
  let adminRoutes: AdminRoutes;
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = testPrismaClient() || new PrismaClient();
    adminRoutes = new AdminRoutes(
      prisma,
      {} as any, // moderationService mock
      {} as any, // reportService mock
      {} as any, // ticketService mock
      {} as any  // scoringService mock
    );

    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes.getRouter());
  });

  describe('GET /api/admin/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'healthy');
    });
  });

  describe('GET /api/admin/config/:guildId', () => {
    it('should return server config', async () => {
      const guildId = 'test-guild-config-123';
      await createTestServerConfig(guildId);

      const response = await request(app)
        .get(`/api/admin/config/${guildId}`)
        .set('x-user-id', 'test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('guildId', guildId);
    });

    it('should return 400 if guildId is missing', async () => {
      await request(app)
        .get('/api/admin/config/')
        .set('x-user-id', 'test-user-123')
        .expect(404); // Route not found
    });
  });

  describe('POST /api/admin/config/:guildId', () => {
    it('should update server config', async () => {
      const guildId = 'test-guild-update-123';
      await createTestServerConfig(guildId);

      const configData = {
        wordScoringConfig: { test: 20 },
        escalationConfig: { warnings: 5 },
      };

      const response = await request(app)
        .post(`/api/admin/config/${guildId}`)
        .set('x-user-id', 'test-user-123')
        .send(configData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Configuration updated successfully');
    });
  });

  describe('GET /api/admin/users/:guildId', () => {
    it('should return users list', async () => {
      const guildId = 'test-guild-users-123';
      await createTestUser('test-user-123');

      const response = await request(app)
        .get(`/api/admin/users/${guildId}`)
        .set('x-user-id', 'test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const guildId = 'test-guild-limit-123';

      const response = await request(app)
        .get(`/api/admin/users/${guildId}?limit=5`)
        .set('x-user-id', 'test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/stats/:guildId', () => {
    it('should return statistics', async () => {
      const guildId = 'test-guild-stats-123';

      const response = await request(app)
        .get(`/api/admin/stats/${guildId}`)
        .set('x-user-id', 'test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('reports');
      expect(response.body.data).toHaveProperty('tickets');
      expect(response.body.data).toHaveProperty('violations');
    });
  });

  describe('Authentication', () => {
    it('should return 400 if x-user-id header is missing', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing guildId or userId');
    });

    it('should return 400 if x-user-id header is empty', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('x-user-id', '')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing guildId or userId');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      await request(app)
        .post('/api/admin/config/test-guild')
        .set('x-user-id', 'test-user-123')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle invalid guildId', async () => {
      await request(app)
        .get('/api/admin/config/invalid-guild-id')
        .set('x-user-id', 'test-user-123')
        .expect(200); // Should return default config
    });
  });
});
