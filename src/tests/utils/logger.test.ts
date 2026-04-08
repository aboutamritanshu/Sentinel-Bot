import logger from '../../utils/logger';

describe('Logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should log info messages', () => {
    // Test that info method doesn't throw
    expect(() => {
      logger.info('Test info message');
    }).not.toThrow();
  });

  it('should log error messages', () => {
    // Test that error method doesn't throw
    expect(() => {
      logger.error('Test error message');
    }).not.toThrow();
  });

  it('should log warning messages', () => {
    // Test that warn method doesn't throw
    expect(() => {
      logger.warn('Test warning message');
    }).not.toThrow();
  });

  it('should log debug messages', () => {
    // Test that debug method doesn't throw
    expect(() => {
      logger.debug('Test debug message');
    }).not.toThrow();
  });

  it('should handle objects in log messages', () => {
    // Test that objects can be logged
    expect(() => {
      logger.info({ test: 'object', number: 123 });
    }).not.toThrow();
  });

  it('should handle errors in log messages', () => {
    // Test that errors can be logged
    expect(() => {
      logger.error(new Error('Test error'));
    }).not.toThrow();
  });
});
