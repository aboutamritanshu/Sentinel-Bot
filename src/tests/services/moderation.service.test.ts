import { ModerationService } from '../../services/moderation.service';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestServerConfig, testPrismaClient } from '../setup';

describe('ModerationService', () => {
  let moderationService: ModerationService;
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = testPrismaClient() || new PrismaClient();
    moderationService = new ModerationService(prisma);
  });

  describe('getOrCreateUser', () => {
    it('should create a new user if not exists', async () => {
      const discordId = 'test-new-user-123';
      
      const user = await moderationService.getOrCreateUser(discordId);
      
      expect(user).toBeDefined();
      expect(user.discordId).toBe(discordId);
      expect(user.violationScore).toBe(0);
      expect(user.warnings).toBe(0);
      expect(user.timeouts).toBe(0);
      expect(user.isBanned).toBe(false);
    });

    it('should return existing user if exists', async () => {
      const discordId = 'test-existing-user-456';
      
      // Create user first
      await createTestUser(discordId);
      
      const user = await moderationService.getOrCreateUser(discordId);
      
      expect(user).toBeDefined();
      expect(user.discordId).toBe(discordId);
    });
  });

  describe('getServerConfig', () => {
    it('should return default config if not exists', async () => {
      const guildId = 'test-guild-default-123';
      
      const config = await moderationService.getServerConfig(guildId);
      
      expect(config).toBeDefined();
      expect(config.guildId).toBe(guildId);
      expect(config.wordScoringConfig).toEqual({});
      expect(config.escalationConfig).toEqual({});
    });

    it('should return existing config if exists', async () => {
      const guildId = 'test-guild-existing-456';
      
      await createTestServerConfig(guildId);
      
      const config = await moderationService.getServerConfig(guildId);
      
      expect(config).toBeDefined();
      expect(config.guildId).toBe(guildId);
    });
  });

  describe('updateServerConfig', () => {
    it('should update server config', async () => {
      const guildId = 'test-guild-update-789';
      
      await createTestServerConfig(guildId);
      
      const updateData = {
        wordScoringConfig: { test: 10 },
        escalationConfig: { warnings: 3 },
      };
      
      const updatedConfig = await moderationService.updateServerConfig(guildId, updateData);
      
      expect(updatedConfig).toBeDefined();
      expect(updatedConfig.guildId).toBe(guildId);
    });
  });

  describe('createViolation', () => {
    it('should create a violation', async () => {
      const user = await createTestUser('test-violation-user-123');
      
      if (!user) return;
      
      const violation = await moderationService.createViolation(
        user.id,
        'Test violation content',
        50,
        'warn'
      );
      
      expect(violation).toBeDefined();
      expect(violation.userId).toBe(user.id);
      expect(violation.content).toBe('Test violation content');
      expect(violation.severityScore).toBe(50);
      expect(violation.action).toBe('warn');
    });
  });

  describe('updateUserStats', () => {
    it('should apply warning action', async () => {
      const user = await createTestUser('test-warning-user-123');
      
      if (!user) return;
      
      const updatedUser = await moderationService.updateUserStats(
        user.id,
        'warn'
      );
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.warnings).toBe(1);
      expect(updatedUser.violationScore).toBe(1);
    });

    it('should apply timeout action', async () => {
      const user = await createTestUser('test-timeout-user-123');
      
      if (!user) return;
      
      const updatedUser = await moderationService.updateUserStats(
        user.id,
        'timeout'
      );
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.timeouts).toBe(1);
      expect(updatedUser.violationScore).toBe(1);
    });

    it('should apply ban action', async () => {
      const user = await createTestUser('test-ban-user-123');
      
      if (!user) return;
      
      const updatedUser = await moderationService.updateUserStats(
        user.id,
        'ban'
      );
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.isBanned).toBe(true);
      expect(updatedUser.violationScore).toBe(1);
    });
  });
});
