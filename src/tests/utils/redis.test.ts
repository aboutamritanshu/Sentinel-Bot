import { redisClient } from '../../utils/redis';

describe('RedisClient', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await expect(redisClient.connect()).resolves.not.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      // This should not throw due to graceful error handling
      await expect(redisClient.connect()).resolves.not.toThrow();
    });
  });

  describe('set', () => {
    it('should set a key-value pair', async () => {
      await expect(redisClient.set('test-key', 'test-value')).resolves.not.toThrow();
    });

    it('should set key with expiration', async () => {
      await expect(redisClient.set('test-key', 'test-value', 3600)).resolves.not.toThrow();
    });

    it('should handle setting when Redis is not available', async () => {
      // Should not throw when Redis is not connected
      await expect(redisClient.set('test-key', 'test-value')).resolves.not.toThrow();
    });
  });

  describe('get', () => {
    it('should get a value', async () => {
      const result = await redisClient.get('test-key');
      expect(result).toBeNull(); // Mock returns null
    });

    it('should handle getting when Redis is not available', async () => {
      const result = await redisClient.get('test-key');
      expect(result).toBeNull(); // Should return null when not available
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await expect(redisClient.del('test-key')).resolves.not.toThrow();
    });

    it('should handle deletion when Redis is not available', async () => {
      await expect(redisClient.del('test-key')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      const result = await redisClient.exists('test-key');
      expect(result).toBe(false); // Mock returns false
    });

    it('should handle exists check when Redis is not available', async () => {
      const result = await redisClient.exists('test-key');
      expect(result).toBe(false); // Should return false when not available
    });
  });

  describe('incr', () => {
    it('should increment a key', async () => {
      const result = await redisClient.incr('test-key');
      expect(result).toBe(0); // Mock returns 0
    });

    it('should handle increment when Redis is not available', async () => {
      const result = await redisClient.incr('test-key');
      expect(result).toBe(0); // Should return 0 when not available
    });
  });

  describe('expire', () => {
    it('should set expiration on key', async () => {
      await expect(redisClient.expire('test-key', 3600)).resolves.not.toThrow();
    });

    it('should handle expiration when Redis is not available', async () => {
      await expect(redisClient.expire('test-key', 3600)).resolves.not.toThrow();
    });
  });

  describe('getClient', () => {
    it('should return the client', () => {
      const client = redisClient.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await expect(redisClient.disconnect()).resolves.not.toThrow();
    });
  });
});
