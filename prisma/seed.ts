import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  try {
    logger.info('Starting database seed...');

    const testGuildId = '123456789012345678';
    
    const serverConfig = await prisma.serverConfig.upsert({
      where: { guildId: testGuildId },
      update: {},
      create: {
        guildId: testGuildId,
        warningThreshold: 10,
        timeoutThreshold: 25,
        banThreshold: 50,
        wordScoringConfig: {
          "idiot": 2,
          "stupid": 3,
          "hate": 5,
          "racist": 10,
          "toxic": 4,
          "spam": 3,
          "inappropriate": 6,
          "offensive": 7,
          "vulgar": 5,
          "profane": 4
        },
        escalationConfig: {
          "autoWarn": true,
          "autoTimeout": true,
          "autoBan": false,
          "timeoutDuration": 15,
          "maxWarningsPerDay": 3,
          "maxTimeoutsPerWeek": 2
        }
      }
    });

    logger.info(`Created/updated server config for guild: ${testGuildId}`);

    const testUsers = [
      { discordId: '123456789012345678', violationScore: 5, warnings: 1, timeouts: 0 },
      { discordId: '234567890123456789', violationScore: 15, warnings: 2, timeouts: 1 },
      { discordId: '345678901234567890', violationScore: 0, warnings: 0, timeouts: 0 }
    ];

    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { discordId: userData.discordId },
        update: userData,
        create: userData
      });
      logger.info(`Created/updated test user: ${user.discordId}`);
    }

    const testViolations = [
      {
        userId: '123456789012345678',
        content: 'This is a test violation message',
        severityScore: 3.5,
        action: 'warn'
      },
      {
        userId: '234567890123456789',
        content: 'Another test violation with higher severity',
        severityScore: 7.2,
        action: 'timeout'
      }
    ];

    for (const violationData of testViolations) {
      const violation = await prisma.violation.create({
        data: violationData
      });
      logger.info(`Created test violation: ${violation.id}`);
    }

    const testReports = [
      {
        reporterId: '345678901234567890',
        reportedUserId: '123456789012345678',
        aiVerdict: {
          initiator: 'userA',
          severity: 5,
          recommendedAction: 'warn',
          reason: 'User initiated inappropriate conversation'
        },
        status: 'analyzed'
      }
    ];

    for (const reportData of testReports) {
      const report = await prisma.report.create({
        data: reportData
      });
      logger.info(`Created test report: ${report.id}`);
    }

    const testTickets = [
      {
        creatorId: '123456789012345678',
        channelId: '987654321098765432',
        category: 'general',
        aiSummary: {
          issue: 'User needs help with bot commands',
          highlights: 'User was confused about report functionality',
          resolution: 'Provided documentation and examples'
        },
        status: 'closed',
        closedAt: new Date()
      }
    ];

    for (const ticketData of testTickets) {
      const ticket = await prisma.ticket.create({
        data: ticketData
      });
      logger.info(`Created test ticket: ${ticket.id}`);
    }

    logger.info('Database seed completed successfully!');
  } catch (error) {
    logger.error('Error during database seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
