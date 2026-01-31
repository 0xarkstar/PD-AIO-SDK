/**
 * Logger Correlation ID Tests
 *
 * Tests for correlation ID tracking in the Logger class
 * and request context generation.
 */

import {
  Logger,
  LogLevel,
  generateCorrelationId,
  createRequestContext,
  createChildLogger,
  formatLogEntry,
  type LogEntry,
} from '../../src/core/logger.js';

describe('Correlation ID Generation', () => {
  describe('generateCorrelationId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });

    it('should generate non-empty strings', () => {
      const id = generateCorrelationId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should include timestamp component', () => {
      const id = generateCorrelationId();
      expect(id).toContain('-');
    });
  });

  describe('createRequestContext', () => {
    it('should create context with all required fields', () => {
      const context = createRequestContext('hyperliquid', 'fetchMarkets');

      expect(context.correlationId).toBeDefined();
      expect(context.adapter).toBe('hyperliquid');
      expect(context.method).toBe('fetchMarkets');
      expect(context.timestamp).toBeGreaterThan(0);
    });

    it('should include optional metadata', () => {
      const context = createRequestContext('paradex', 'createOrder', {
        symbol: 'BTC/USDT:USDT',
        amount: 0.1,
      });

      expect(context.metadata).toBeDefined();
      expect(context.metadata?.symbol).toBe('BTC/USDT:USDT');
      expect(context.metadata?.amount).toBe(0.1);
    });

    it('should generate unique correlation ID per context', () => {
      const ctx1 = createRequestContext('test', 'method');
      const ctx2 = createRequestContext('test', 'method');
      expect(ctx1.correlationId).not.toBe(ctx2.correlationId);
    });
  });
});

describe('Logger Correlation ID Support', () => {
  let logOutput: LogEntry[];
  let logger: Logger;

  beforeEach(() => {
    logOutput = [];
    logger = new Logger('TestContext', {
      level: LogLevel.DEBUG,
      output: (entry) => logOutput.push(entry),
    });
  });

  describe('setCorrelationId', () => {
    it('should set correlation ID for subsequent logs', () => {
      logger.setCorrelationId('test-corr-123');
      logger.info('Test message');

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].correlationId).toBe('test-corr-123');
    });

    it('should allow clearing correlation ID', () => {
      logger.setCorrelationId('test-corr-123');
      logger.info('First message');

      logger.setCorrelationId(undefined);
      logger.info('Second message');

      expect(logOutput[0].correlationId).toBe('test-corr-123');
      expect(logOutput[1].correlationId).toBeUndefined();
    });
  });

  describe('getCorrelationId', () => {
    it('should return current correlation ID', () => {
      logger.setCorrelationId('get-test-456');
      expect(logger.getCorrelationId()).toBe('get-test-456');
    });

    it('should return undefined when not set', () => {
      expect(logger.getCorrelationId()).toBeUndefined();
    });
  });

  describe('withCorrelationId', () => {
    it('should create child logger with correlation ID', () => {
      const childLogger = logger.withCorrelationId('child-corr-789');
      childLogger.info('Child log message');

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].correlationId).toBe('child-corr-789');
    });

    it('should not affect parent logger', () => {
      const childLogger = logger.withCorrelationId('child-only');
      childLogger.info('Child message');
      logger.info('Parent message');

      expect(logOutput[0].correlationId).toBe('child-only');
      expect(logOutput[1].correlationId).toBeUndefined();
    });

    it('should inherit log level from parent', () => {
      const quietLogger = new Logger('Quiet', {
        level: LogLevel.ERROR,
        output: (entry) => logOutput.push(entry),
      });

      const childLogger = quietLogger.withCorrelationId('test');
      childLogger.debug('Debug message'); // Should be filtered
      childLogger.error('Error message'); // Should appear

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe(LogLevel.ERROR);
    });
  });
});

describe('Log Entry Formatting', () => {
  describe('formatLogEntry', () => {
    it('should include correlation ID when present', () => {
      const entry: LogEntry = {
        timestamp: '2025-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        context: 'TestContext',
        message: 'Test message',
        correlationId: 'format-test-123',
      };

      const formatted = formatLogEntry(entry);
      expect(formatted).toContain('[format-test-123]');
    });

    it('should not include correlation ID placeholder when absent', () => {
      const entry: LogEntry = {
        timestamp: '2025-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        context: 'TestContext',
        message: 'Test message',
      };

      const formatted = formatLogEntry(entry);
      expect(formatted).not.toContain('[undefined]');
    });

    it('should format all log levels correctly', () => {
      const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

      for (const level of levels) {
        const entry: LogEntry = {
          timestamp: '2025-01-01T00:00:00.000Z',
          level,
          context: 'Test',
          message: 'Message',
        };

        const formatted = formatLogEntry(entry);
        expect(formatted).toContain(level.toUpperCase());
      }
    });
  });
});

describe('Child Logger Creation', () => {
  let logOutput: LogEntry[];

  beforeEach(() => {
    logOutput = [];
  });

  describe('createChildLogger', () => {
    it('should create child with combined context', () => {
      const parent = new Logger('Exchange', {
        output: (entry) => logOutput.push(entry),
      });

      const child = createChildLogger(parent, 'WebSocket');
      child.info('Test');

      expect(logOutput[0].context).toBe('Exchange:WebSocket');
    });

    it('should inherit parent correlation ID', () => {
      const parent = new Logger('Parent', {
        output: (entry) => logOutput.push(entry),
        correlationId: 'inherited-123',
      });

      const child = createChildLogger(parent, 'Child');
      child.info('Test');

      expect(logOutput[0].correlationId).toBe('inherited-123');
    });

    it('should inherit parent configuration', () => {
      const parent = new Logger('Parent', {
        level: LogLevel.WARN,
        output: (entry) => logOutput.push(entry),
      });

      const child = createChildLogger(parent, 'Child');
      child.info('Should be filtered'); // INFO < WARN
      child.warn('Should appear');

      expect(logOutput).toHaveLength(1);
      expect(logOutput[0].level).toBe(LogLevel.WARN);
    });
  });
});

describe('Integration with Error Tracking', () => {
  let logOutput: LogEntry[];
  let logger: Logger;

  beforeEach(() => {
    logOutput = [];
    logger = new Logger('Integration', {
      output: (entry) => logOutput.push(entry),
    });
  });

  it('should track correlation through error flow', () => {
    const correlationId = generateCorrelationId();
    logger.setCorrelationId(correlationId);

    try {
      // Simulate operation that might fail
      throw new Error('Simulated error');
    } catch (error) {
      logger.error('Operation failed', error as Error, { operation: 'test' });
    }

    expect(logOutput).toHaveLength(1);
    expect(logOutput[0].correlationId).toBe(correlationId);
    expect(logOutput[0].meta?.operation).toBe('test');
  });

  it('should support tracking across multiple operations', () => {
    const correlationId = generateCorrelationId();
    logger.setCorrelationId(correlationId);

    // Note: Default log level is INFO, so debug messages are filtered
    logger.info('Starting operation');
    logger.info('Processing step 1');
    logger.info('Processing step 2');
    logger.info('Completed operation');

    expect(logOutput).toHaveLength(4);
    expect(logOutput.every((entry) => entry.correlationId === correlationId)).toBe(true);
  });
});
