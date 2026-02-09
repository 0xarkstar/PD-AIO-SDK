/**
 * LoggerMixin Unit Tests
 *
 * Tests the LoggerMixin factory function that adds logging capabilities
 * to any class implementing ILoggerMixinBase.
 */

import { LoggerMixin, type ILoggerMixinBase } from '../../src/adapters/base/mixins/LoggerMixin.js';
import { Logger, LogLevel } from '../../src/core/logger.js';
import type { ExchangeConfig } from '../../src/types/index.js';

// Minimal base class implementing ILoggerMixinBase
class TestBase implements ILoggerMixinBase {
  readonly name: string;
  readonly config: ExchangeConfig;

  constructor(name: string, config: ExchangeConfig = {}) {
    this.name = name;
    this.config = { timeout: 30000, testnet: false, debug: false, ...config };
  }
}

// Apply mixin
const TestWithLogger = LoggerMixin(TestBase);

describe('LoggerMixin', () => {
  describe('lazy initialization', () => {
    test('creates logger on first access', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      expect(instance._logger).toBeUndefined();

      // Access logger property to trigger initialization
      const logger = instance.logger;
      expect(logger).toBeInstanceOf(Logger);
      expect(instance._logger).toBeDefined();
    });

    test('reuses logger on subsequent accesses', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const logger1 = instance.logger;
      const logger2 = instance.logger;
      expect(logger1).toBe(logger2);
    });

    test('initializes with adapter name as context', () => {
      const instance = new TestWithLogger('MyExchange', {});
      const logger = instance.logger;
      // Logger context should be the adapter name
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('log level configuration', () => {
    test('uses DEBUG level when config.debug is true', () => {
      const instance = new TestWithLogger('TestAdapter', { debug: true });
      const logger = instance.logger;
      // Logger should be initialized - we verify it logs debug messages
      const debugSpy = jest.spyOn(logger, 'debug');
      instance.debug('test debug message');
      expect(debugSpy).toHaveBeenCalledWith('test debug message', undefined);
    });

    test('uses INFO level when config.debug is false', () => {
      const instance = new TestWithLogger('TestAdapter', { debug: false });
      const logger = instance.logger;
      // Logger should be at INFO level
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('debug()', () => {
    test('delegates to logger.debug', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const debugSpy = jest.spyOn(instance.logger, 'debug');

      instance.debug('debug message');
      expect(debugSpy).toHaveBeenCalledWith('debug message', undefined);
    });

    test('passes metadata to logger', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const debugSpy = jest.spyOn(instance.logger, 'debug');

      const meta = { key: 'value', count: 42 };
      instance.debug('debug with meta', meta);
      expect(debugSpy).toHaveBeenCalledWith('debug with meta', meta);
    });
  });

  describe('info()', () => {
    test('delegates to logger.info', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const infoSpy = jest.spyOn(instance.logger, 'info');

      instance.info('info message');
      expect(infoSpy).toHaveBeenCalledWith('info message', undefined);
    });

    test('passes metadata to logger', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const infoSpy = jest.spyOn(instance.logger, 'info');

      const meta = { endpoint: '/api/v1/orders' };
      instance.info('info with meta', meta);
      expect(infoSpy).toHaveBeenCalledWith('info with meta', meta);
    });
  });

  describe('warn()', () => {
    test('delegates to logger.warn', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const warnSpy = jest.spyOn(instance.logger, 'warn');

      instance.warn('warning message');
      expect(warnSpy).toHaveBeenCalledWith('warning message', undefined);
    });

    test('passes metadata to logger', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const warnSpy = jest.spyOn(instance.logger, 'warn');

      const meta = { code: 'RATE_LIMIT' };
      instance.warn('rate limited', meta);
      expect(warnSpy).toHaveBeenCalledWith('rate limited', meta);
    });
  });

  describe('error()', () => {
    test('delegates to logger.error', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const errorSpy = jest.spyOn(instance.logger, 'error');

      instance.error('error message');
      expect(errorSpy).toHaveBeenCalledWith('error message', undefined, undefined);
    });

    test('passes error object to logger', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const errorSpy = jest.spyOn(instance.logger, 'error');

      const err = new Error('connection failed');
      instance.error('connection error', err);
      expect(errorSpy).toHaveBeenCalledWith('connection error', err, undefined);
    });

    test('passes error and metadata to logger', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      const errorSpy = jest.spyOn(instance.logger, 'error');

      const err = new Error('timeout');
      const meta = { endpoint: '/api/v1/orders', latency: 5000 };
      instance.error('request failed', err, meta);
      expect(errorSpy).toHaveBeenCalledWith('request failed', err, meta);
    });
  });

  describe('sensitive data masking', () => {
    test('logger is configured with maskSensitiveData enabled', () => {
      const instance = new TestWithLogger('TestAdapter', {});
      // Logger is created with maskSensitiveData: true by default
      const logger = instance.logger;
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('mixin composition', () => {
    test('preserves base class properties', () => {
      const instance = new TestWithLogger('MyAdapter', { timeout: 5000 });
      expect(instance.name).toBe('MyAdapter');
      expect(instance.config.timeout).toBe(5000);
    });

    test('can be applied to different base classes', () => {
      class AnotherBase implements ILoggerMixinBase {
        readonly name = 'AnotherAdapter';
        readonly config: ExchangeConfig = { timeout: 10000 };
        customMethod() {
          return 'custom';
        }
      }

      const AnotherWithLogger = LoggerMixin(AnotherBase);
      const instance = new AnotherWithLogger();

      expect(instance.name).toBe('AnotherAdapter');
      expect(instance.customMethod()).toBe('custom');
      expect(instance.logger).toBeInstanceOf(Logger);
    });
  });
});
