/**
 * Logger Integration Tests
 *
 * Tests the integration of the structured Logger into BaseAdapter
 */

import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import { LogLevel, type LogEntry } from '../../src/core/logger.js';
import type { Market, Order, OrderRequest } from '../../src/types/common.js';
import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/HyperliquidAdapter.js';

// Mock adapter for testing logger integration
class MockAdapterWithLogging extends BaseAdapter {
  readonly id = 'mock-logger-test';
  readonly name = 'Mock Adapter (Logger Test)';
  readonly has = {};

  // Capture log entries for testing
  private capturedLogs: LogEntry[] = [];

  async initialize(): Promise<void> {
    // Override logger output to capture logs
    (this.logger as any).output = (entry: LogEntry) => {
      this.capturedLogs.push(entry);
    };

    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    await super.disconnect();
  }

  // Public method to access captured logs
  getCapturedLogs(): LogEntry[] {
    return this.capturedLogs;
  }

  // Public method to clear captured logs
  clearCapturedLogs(): void {
    this.capturedLogs = [];
  }

  // Public methods to test logging at different levels
  testDebugLog(message: string, meta?: Record<string, unknown>): void {
    this.debug(message, meta);
  }

  testInfoLog(message: string, meta?: Record<string, unknown>): void {
    this.info(message, meta);
  }

  testWarnLog(message: string, meta?: Record<string, unknown>): void {
    this.warn(message, meta);
  }

  testErrorLog(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.error(message, error, meta);
  }

  async createOrder(): Promise<Order> {
    throw new Error('Not implemented');
  }

  async cancelOrder(): Promise<Order> {
    throw new Error('Not implemented');
  }

  async cancelAllOrders() {
    return [];
  }

  async fetchMarkets(): Promise<Market[]> {
    return [];
  }

  async fetchTicker() {
    throw new Error('Not implemented');
  }

  async fetchOrderBook() {
    throw new Error('Not implemented');
  }

  async fetchTrades() {
    return [];
  }

  async fetchFundingRate() {
    throw new Error('Not implemented');
  }

  async fetchFundingRateHistory() {
    return [];
  }

  async fetchPositions() {
    return [];
  }

  async fetchBalance() {
    return [];
  }

  async setLeverage() {}

  protected symbolToExchange(symbol: string) {
    return symbol;
  }

  protected symbolFromExchange(symbol: string) {
    return symbol;
  }
}

describe('Logger Integration in BaseAdapter', () => {
  describe('Logger initialization', () => {
    test('logger is initialized with INFO level by default', async () => {
      const adapter = new MockAdapterWithLogging();
      await adapter.initialize();

      // Logger should be initialized
      expect((adapter as any).logger).toBeDefined();
      expect((adapter as any).logger.level).toBe(LogLevel.INFO);

      await adapter.disconnect();
    });

    test('logger uses DEBUG level when debug config is true', async () => {
      const adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();

      expect((adapter as any).logger.level).toBe(LogLevel.DEBUG);

      await adapter.disconnect();
    });

    test('logger has sensitive data masking enabled by default', async () => {
      const adapter = new MockAdapterWithLogging();
      await adapter.initialize();

      expect((adapter as any).logger.maskSensitiveData).toBe(true);

      await adapter.disconnect();
    });
  });

  describe('Logging methods', () => {
    let adapter: MockAdapterWithLogging;

    beforeEach(async () => {
      adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    test('debug() logs at DEBUG level', () => {
      adapter.testDebugLog('Test debug message', { key: 'value' });

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Test debug message');
      expect(logs[0].meta).toEqual({ key: 'value' });
    });

    test('info() logs at INFO level', () => {
      adapter.testInfoLog('Test info message');

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Test info message');
    });

    test('warn() logs at WARN level', () => {
      adapter.testWarnLog('Test warning', { code: 'WARN_001' });

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].meta).toEqual({ code: 'WARN_001' });
    });

    test('error() logs at ERROR level with error object', () => {
      const error = new Error('Test error');
      adapter.testErrorLog('Error occurred', error);

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error occurred');
      expect(logs[0].meta?.error).toBeDefined();
      expect((logs[0].meta?.error as any).message).toBe('Test error');
    });

    test('error() logs with additional metadata', () => {
      const error = new Error('Test error');
      adapter.testErrorLog('Error with context', error, { userId: 123 });

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].meta?.userId).toBe(123);
      expect(logs[0].meta?.error).toBeDefined();
    });

    test('logs include timestamp', () => {
      adapter.testInfoLog('Test');

      const logs = adapter.getCapturedLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(typeof logs[0].timestamp).toBe('string');
      expect(new Date(logs[0].timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Log level filtering', () => {
    test('INFO level filters out DEBUG messages', async () => {
      const adapter = new MockAdapterWithLogging({ debug: false }); // INFO level
      await adapter.initialize();

      adapter.testDebugLog('Debug message');
      adapter.testInfoLog('Info message');

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);

      await adapter.disconnect();
    });

    test('DEBUG level logs all messages', async () => {
      const adapter = new MockAdapterWithLogging({ debug: true }); // DEBUG level
      await adapter.initialize();

      adapter.testDebugLog('Debug');
      adapter.testInfoLog('Info');
      adapter.testWarnLog('Warn');
      adapter.testErrorLog('Error');

      const logs = adapter.getCapturedLogs();
      expect(logs).toHaveLength(4);

      await adapter.disconnect();
    });
  });

  describe('Sensitive data masking', () => {
    let adapter: MockAdapterWithLogging;

    beforeEach(async () => {
      adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    test('masks API keys in metadata', () => {
      adapter.testInfoLog('API call', {
        apiKey: 'secret_api_key_12345',
        symbol: 'BTC/USDT:USDT',
      });

      const logs = adapter.getCapturedLogs();
      expect(logs[0].meta?.apiKey).toBe('***2345');
      expect(logs[0].meta?.symbol).toBe('BTC/USDT:USDT');
    });

    test('masks passwords in metadata', () => {
      adapter.testInfoLog('Login attempt', {
        username: 'user123',
        password: 'secret_password',
      });

      const logs = adapter.getCapturedLogs();
      expect(logs[0].meta?.username).toBe('user123');
      expect(logs[0].meta?.password).toBe('***word');
    });

    test('masks nested sensitive data', () => {
      adapter.testInfoLog('Config loaded', {
        exchange: 'test',
        credentials: {
          apiKey: 'api_key_123',
          apiSecret: 'api_secret_456',
        },
      });

      const logs = adapter.getCapturedLogs();
      const meta = logs[0].meta as any;
      expect(meta.exchange).toBe('test');
      expect(meta.credentials.apiKey).toBe('***_123');
      expect(meta.credentials.apiSecret).toBe('***_456');
    });
  });

  describe('Batch operation logging', () => {
    test('createBatchOrders logs fallback execution', async () => {
      // Create adapter without batch support
      class NoBatchAdapter extends MockAdapterWithLogging {
        readonly has = { createBatchOrders: false };
        private orderCounter = 1;

        async createOrder(request: OrderRequest): Promise<Order> {
          return {
            id: `order-${this.orderCounter++}`,
            clientOrderId: request.clientOrderId,
            timestamp: Date.now(),
            datetime: new Date().toISOString(),
            lastTradeTimestamp: undefined,
            symbol: request.symbol,
            type: request.type,
            timeInForce: request.timeInForce,
            postOnly: request.postOnly,
            reduceOnly: request.reduceOnly,
            side: request.side,
            price: request.price,
            amount: request.amount,
            cost: undefined,
            average: undefined,
            filled: 0,
            remaining: request.amount,
            status: 'open',
            fee: undefined,
            trades: [],
          };
        }
      }

      const adapter = new NoBatchAdapter({ debug: true });
      await adapter.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
      ];

      await adapter.createBatchOrders(requests);

      const logs = adapter.getCapturedLogs();

      // Should have logged the fallback message
      const fallbackLog = logs.find((log) =>
        log.message.includes('No native batch support')
      );
      expect(fallbackLog).toBeDefined();
      expect(fallbackLog?.meta?.count).toBe(2);

      await adapter.disconnect();
    });

    test('logs individual order failures in batch', async () => {
      class FailingAdapter extends MockAdapterWithLogging {
        readonly has = { createBatchOrders: false };
        private callCount = 0;

        async createOrder(request: OrderRequest): Promise<Order> {
          this.callCount++;
          if (this.callCount === 2) {
            throw new Error('Order failed');
          }

          return {
            id: `order-${this.callCount}`,
            clientOrderId: request.clientOrderId,
            timestamp: Date.now(),
            datetime: new Date().toISOString(),
            lastTradeTimestamp: undefined,
            symbol: request.symbol,
            type: request.type,
            timeInForce: request.timeInForce,
            postOnly: request.postOnly,
            reduceOnly: request.reduceOnly,
            side: request.side,
            price: request.price,
            amount: request.amount,
            cost: undefined,
            average: undefined,
            filled: 0,
            remaining: request.amount,
            status: 'open',
            fee: undefined,
            trades: [],
          };
        }
      }

      const adapter = new FailingAdapter({ debug: true });
      await adapter.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
        { symbol: 'SOL/USDT:USDT', side: 'sell', type: 'limit', amount: 10, price: 100 },
      ];

      await adapter.createBatchOrders(requests);

      const logs = adapter.getCapturedLogs();

      // Should log the failure
      const failureLog = logs.find((log) => log.message.includes('Failed to create order'));
      expect(failureLog).toBeDefined();
      expect(failureLog?.meta?.error).toBe('Order failed');

      // Should log the summary
      const summaryLog = logs.find((log) => log.message.includes('completed'));
      expect(summaryLog).toBeDefined();
      expect(summaryLog?.meta?.succeeded).toBe(2);
      expect(summaryLog?.meta?.failed).toBe(1);

      await adapter.disconnect();
    });
  });

  describe('Context and metadata', () => {
    test('logs contain context information', async () => {
      const adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();

      adapter.testInfoLog('Test message');

      const logs = adapter.getCapturedLogs();
      expect(logs[0].context).toBeDefined();
      expect(typeof logs[0].context).toBe('string');

      await adapter.disconnect();
    });

    test('logger context uses adapter name', async () => {
      const adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();

      adapter.testInfoLog('Test message');

      const logs = adapter.getCapturedLogs();
      // Should use the adapter's name, not generic "ExchangeAdapter"
      expect(logs[0].context).toBe('Mock Adapter (Logger Test)');

      await adapter.disconnect();
    });

    test('supports complex metadata objects', async () => {
      const adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();

      adapter.testInfoLog('Order created', {
        orderId: 'order-123',
        symbol: 'BTC/USDT:USDT',
        details: {
          side: 'buy',
          amount: 0.1,
          price: 50000,
        },
        timestamp: Date.now(),
      });

      const logs = adapter.getCapturedLogs();
      const meta = logs[0].meta as any;
      expect(meta.orderId).toBe('order-123');
      expect(meta.details.side).toBe('buy');
      expect(meta.details.amount).toBe(0.1);

      await adapter.disconnect();
    });
  });

  describe('Disconnect logging', () => {
    test('logs disconnect process', async () => {
      const adapter = new MockAdapterWithLogging({ debug: true });
      await adapter.initialize();

      adapter.clearCapturedLogs(); // Clear initialization logs

      await adapter.disconnect();

      const logs = adapter.getCapturedLogs();

      // Should have logged disconnect messages
      const disconnectLogs = logs.filter((log) =>
        log.message.includes('disconnect') || log.message.includes('cleanup')
      );
      expect(disconnectLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Real adapter context', () => {
    test('HyperliquidAdapter uses correct context', async () => {
      const capturedLogs: LogEntry[] = [];

      const adapter = new HyperliquidAdapter({
        privateKey: '0x0000000000000000000000000000000000000000000000000000000000000001',
        debug: true,
      });

      // Override logger output to capture logs
      await adapter.initialize();
      (adapter as any).logger.output = (entry: LogEntry) => {
        capturedLogs.push(entry);
      };

      // Trigger a log message
      (adapter as any).debug('Test message from HyperliquidAdapter');

      // Should use adapter's name "Hyperliquid", not generic "ExchangeAdapter"
      expect(capturedLogs[0].context).toBe('Hyperliquid');
      expect(capturedLogs[0].message).toBe('Test message from HyperliquidAdapter');

      await adapter.disconnect();
    });

    test('Different adapters have different contexts', async () => {
      const mockLogs: LogEntry[] = [];
      const hlLogs: LogEntry[] = [];

      const mockAdapter = new MockAdapterWithLogging({ debug: true });
      const hlAdapter = new HyperliquidAdapter({
        privateKey: '0x0000000000000000000000000000000000000000000000000000000000000001',
        debug: true,
      });

      await mockAdapter.initialize();
      await hlAdapter.initialize();

      (mockAdapter as any).logger.output = (entry: LogEntry) => mockLogs.push(entry);
      (hlAdapter as any).logger.output = (entry: LogEntry) => hlLogs.push(entry);

      (mockAdapter as any).info('Mock message');
      (hlAdapter as any).info('Hyperliquid message');

      // Each adapter should have its own context
      expect(mockLogs[0].context).toBe('Mock Adapter (Logger Test)');
      expect(hlLogs[0].context).toBe('Hyperliquid');

      await mockAdapter.disconnect();
      await hlAdapter.disconnect();
    });
  });
});
