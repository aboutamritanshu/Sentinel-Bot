import { PrismaClient } from '@prisma/client';

// Mock Redis client
jest.mock('../../utils/redis', () => ({
  redisClient: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(undefined),
    getClient: jest.fn().mockReturnValue(null),
  },
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'warn',
                reason: 'Test moderation',
                confidence: 0.8
              })
            }
          }]
        })
      }
    }
  }))
}));

// Mock Discord.js
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue('test-token'),
    user: {
      setActivity: jest.fn().mockResolvedValue(undefined),
    },
    on: jest.fn(),
    guilds: {
      cache: new Map(),
    },
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4,
    GuildMembers: 8,
  },
  ChatInputCommandInteraction: jest.fn(),
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addUserOption: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
    addSubcommand: jest.fn().mockReturnThis(),
    setDefaultMemberPermissions: jest.fn().mockReturnThis(),
  })),
  ActivityType: {
    Watching: 3,
  },
  ChannelType: {
    GuildText: 0,
  },
  PermissionFlagsBits: {
    SendMessages: 1,
  },
}));

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

// Global test database setup
let testPrisma: PrismaClient;

beforeAll(async () => {
  testPrisma = new PrismaClient();

  // Connect to test database
  try {
    await testPrisma.$connect();
  } catch (error) {
    console.warn('Test database not available, using mock');
  }
});

afterAll(async () => {
  // Clean up test database connection
  if (testPrisma) {
    await testPrisma.$disconnect();
  }
});

beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Clean up test data if database is available
  if (testPrisma) {
    try {
      // Delete test data in order of dependencies
      await testPrisma.ticket.deleteMany({ where: { id: { contains: 'test-' } } });
      await testPrisma.report.deleteMany({ where: { id: { contains: 'test-' } } });
      await testPrisma.violation.deleteMany({ where: { userId: { contains: 'test-' } } });
      await testPrisma.user.deleteMany({ where: { discordId: { contains: 'test-' } } });
      await testPrisma.serverConfig.deleteMany({ where: { guildId: { contains: 'test-' } } });
    } catch (error) {
      // Ignore cleanup errors if database is not available
    }
  }
});

// Export test utilities
export const createTestUser = async (discordId: string = 'test-user-123') => {
  if (!testPrisma) return null;
  
  return testPrisma.user.create({
    data: {
      discordId,
      violationScore: 0,
      warnings: 0,
      timeouts: 0,
    },
  });
};

export const createTestServerConfig = async (guildId: string = 'test-guild-123') => {
  if (!testPrisma) return null;
  
  return testPrisma.serverConfig.create({
    data: {
      guildId,
      wordScoringConfig: {},
      escalationConfig: {},
    },
  });
};

export const testPrismaClient = () => testPrisma;
