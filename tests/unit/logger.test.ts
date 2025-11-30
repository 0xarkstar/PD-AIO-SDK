/**
 * Structured Logging Unit Tests
 */

import { Logger, LogLevel, createChildLogger, formatLogEntry, type LogEntry } from '../../src/core/logger.js';

describe('Logger', () => {
  describe('Basic logging', () => {
    test('creates logger with context', () => {
      const logger = new Logger('TestContext');
      expect(logger).toBeDefined();
    });

    test('logs debug messages', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        level: LogLevel.DEBUG,
        output: (entry) => logs.push(entry),
      });

      logger.debug('Debug message', { key: 'value' });

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context).toBe('Test');
      expect(logs[0].meta).toEqual({ key: 'value' });
    });

    test('logs info messages', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.info('Info message');

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
    });

    test('logs warning messages', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.warn('Warning message', { code: 'WARN_001' });

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].meta).toEqual({ code: 'WARN_001' });
    });

    test('logs error messages with error object', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].meta?.error).toBeDefined();
      expect((logs[0].meta?.error as any).message).toBe('Test error');
    });

    test('includes timestamp in logs', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.info('Test');

      expect(logs[0].timestamp).toBeDefined();
      expect(typeof logs[0].timestamp).toBe('string');
      expect(new Date(logs[0].timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Log levels', () => {
    test('filters logs below minimum level', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        level: LogLevel.WARN, // Only WARN and ERROR
        output: (entry) => logs.push(entry),
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
    });

    test('setLevel changes filtering threshold', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        level: LogLevel.ERROR,
        output: (entry) => logs.push(entry),
      });

      logger.warn('Warning 1'); // Filtered out
      logger.setLevel(LogLevel.WARN);
      logger.warn('Warning 2'); // Logged

      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Warning 2');
    });

    test('DEBUG level logs everything', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        level: LogLevel.DEBUG,
        output: (entry) => logs.push(entry),
      });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(logs).toHaveLength(4);
    });

    test('ERROR level logs only errors', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        level: LogLevel.ERROR,
        output: (entry) => logs.push(entry),
      });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe('Enable/disable', () => {
    test('disabled logger produces no output', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        enabled: false,
        output: (entry) => logs.push(entry),
      });

      logger.info('Test message');
      logger.error('Error message');

      expect(logs).toHaveLength(0);
    });

    test('setEnabled toggles logging', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.info('Message 1'); // Logged
      logger.setEnabled(false);
      logger.info('Message 2'); // Not logged
      logger.setEnabled(true);
      logger.info('Message 3'); // Logged

      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Message 1');
      expect(logs[1].message).toBe('Message 3');
    });
  });

  describe('Metadata handling', () => {
    test('logs metadata objects', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.info('Test', {
        userId: 123,
        action: 'create_order',
        details: {
          symbol: 'BTC/USDT',
          amount: 0.1,
        },
      });

      expect(logs[0].meta).toEqual({
        userId: 123,
        action: 'create_order',
        details: {
          symbol: 'BTC/USDT',
          amount: 0.1,
        },
      });
    });

    test('handles empty metadata', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.info('Test');

      expect(logs[0].meta).toBeUndefined();
    });

    test('handles undefined metadata', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.info('Test', undefined);

      expect(logs[0].meta).toBeUndefined();
    });
  });

  describe('Sensitive data masking', () => {
    test('masks sensitive keys in metadata', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
        maskSensitiveData: true,
      });

      logger.info('Login attempt', {
        username: 'john_doe',
        password: 'secret123',
        apiKey: 'abcdef1234567890',
        publicData: 'not masked',
      });

      expect(logs[0].meta?.username).toBe('john_doe');
      expect(logs[0].meta?.password).toBe('***t123'); // Shows last 4 (9 chars total)
      expect(logs[0].meta?.apiKey).toBe('***7890'); // Shows last 4
      expect(logs[0].meta?.publicData).toBe('not masked');
    });

    test('masks nested sensitive data', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
        maskSensitiveData: true,
      });

      logger.info('Config loaded', {
        exchange: 'hyperliquid',
        credentials: {
          apiKey: 'secret_api_key_12345',
          apiSecret: 'secret_api_secret_67890',
        },
        endpoint: 'https://api.example.com',
      });

      const meta = logs[0].meta as any;
      expect(meta.exchange).toBe('hyperliquid');
      expect(meta.credentials.apiKey).toBe('***2345');
      expect(meta.credentials.apiSecret).toBe('***7890');
      expect(meta.endpoint).toBe('https://api.example.com');
    });

    test('can disable sensitive data masking', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
        maskSensitiveData: false,
      });

      logger.info('Auth', {
        apiKey: 'secret123',
        password: 'password123',
      });

      expect(logs[0].meta?.apiKey).toBe('secret123');
      expect(logs[0].meta?.password).toBe('password123');
    });

    test('masks short sensitive values completely', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
        maskSensitiveData: true,
      });

      logger.info('Short secret', {
        token: 'abc',
      });

      expect(logs[0].meta?.token).toBe('***');
    });
  });

  describe('Error serialization', () => {
    test('serializes error with stack trace', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error);

      const errorObj = (logs[0].meta?.error as any);
      expect(errorObj.name).toBe('Error');
      expect(errorObj.message).toBe('Test error');
      expect(errorObj.stack).toBeDefined();
      expect(typeof errorObj.stack).toBe('string');
    });

    test('handles errors with custom codes', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      const error: any = new Error('Custom error');
      error.code = 'ERR_001';

      logger.error('Error with code', error);

      const errorObj = (logs[0].meta?.error as any);
      expect(errorObj.code).toBe('ERR_001');
    });

    test('logs errors without metadata', () => {
      const logs: LogEntry[] = [];
      const logger = new Logger('Test', {
        output: (entry) => logs.push(entry),
      });

      logger.error('Simple error', new Error('Test'));

      expect(logs[0].meta?.error).toBeDefined();
      expect((logs[0].meta?.error as any).message).toBe('Test');
    });
  });

  describe('Child logger', () => {
    test('creates child logger with extended context', () => {
      const logs: LogEntry[] = [];
      const parent = new Logger('Parent', {
        output: (entry) => logs.push(entry),
      });

      const child = createChildLogger(parent, 'Child');
      child.info('Test message');

      expect(logs[0].context).toBe('Parent:Child');
    });

    test('child inherits parent configuration', () => {
      const logs: LogEntry[] = [];
      const parent = new Logger('Parent', {
        level: LogLevel.WARN,
        enabled: true,
        output: (entry) => logs.push(entry),
      });

      const child = createChildLogger(parent, 'Child');

      child.info('Info message'); // Filtered out
      child.warn('Warning message'); // Logged

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
    });
  });

  describe('Log formatting', () => {
    test('formatLogEntry creates human-readable string', () => {
      const entry: LogEntry = {
        timestamp: '2025-12-01T10:00:00.000Z',
        level: LogLevel.INFO,
        context: 'Test',
        message: 'Test message',
      };

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('[2025-12-01T10:00:00.000Z]');
      expect(formatted).toContain('INFO');
      expect(formatted).toContain('[Test]');
      expect(formatted).toContain('Test message');
    });

    test('formatLogEntry includes metadata', () => {
      const entry: LogEntry = {
        timestamp: '2025-12-01T10:00:00.000Z',
        level: LogLevel.INFO,
        context: 'Test',
        message: 'Test',
        meta: { key: 'value' },
      };

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('{"key":"value"}');
    });

    test('formatLogEntry includes error details', () => {
      const entry: LogEntry = {
        timestamp: '2025-12-01T10:00:00.000Z',
        level: LogLevel.ERROR,
        context: 'Test',
        message: 'Error occurred',
        error: {
          name: 'Error',
          message: 'Test error',
          stack: 'Error: Test error\n  at ...',
        },
      };

      const formatted = formatLogEntry(entry);

      expect(formatted).toContain('Error: Test error');
      expect(formatted).toContain('Stack:');
    });
  });
});
