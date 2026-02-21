/**
 * BaseAdapterCore Tests
 *
 * Tests for the abstract base adapter core class.
 * Creates a concrete test adapter to test abstract functionality.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BaseAdapter } from '../../../src/adapters/base/BaseAdapter.js';
import type {
  Balance,
  ExchangeConfig,
  FeatureMap,
  FundingRate,
  Market,
  Order,
  OrderBook,
  OrderRequest,
  Position,
  Ticker,
  Trade,
  TradeParams,
} from '../../../src/types/index.js';
import { PerpDEXError } from '../../../src/types/errors.js';

/**
 * Concrete test adapter for testing BaseAdapter/BaseAdapterCore
 */
class TestAdapter extends BaseAdapter {
  readonly id = 'test';
  readonly name = 'Test Exchange';
  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    createOrder: true,
    cancelOrder: true,
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: true,
  };

  // Track if initialize was called
  public initializeCalled = false;
  public disconnectCalled = false;

  async initialize(): Promise<void> {
    this.initializeCalled = true;
    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    this.disconnectCalled = true;
    await super.disconnect();
  }

  protected symbolToExchange(symbol: string): string {
    return symbol.replace('/', '_').replace(':USD', '');
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return exchangeSymbol.replace('_', '/') + ':USD';
  }

  // Minimal implementations for abstract methods
  async fetchMarkets(): Promise<Market[]> {
    this.ensureInitialized();
    return [
      {
        id: 'BTC_USDC',
        symbol: 'BTC/USDC:USD',
        base: 'BTC',
        quote: 'USDC',
        settle: 'USD',
        active: true,
        minAmount: 0.001,
        maxAmount: 1000,
        pricePrecision: 2,
        amountPrecision: 3,
        priceTickSize: 0.01,
        amountStepSize: 0.001,
        makerFee: -0.0001,
        takerFee: 0.0005,
        maxLeverage: 20,
        fundingIntervalHours: 8,
        contractSize: 1,
        info: {},
      },
    ];
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    this.ensureInitialized();
    return {
      symbol,
      timestamp: Date.now(),
      last: 50000,
      bid: 49999,
      ask: 50001,
      high: 51000,
      low: 49000,
      open: 49500,
      close: 50000,
      change: 500,
      percentage: 1.0,
      baseVolume: 100,
      quoteVolume: 5000000,
      info: {},
    };
  }

  async fetchOrderBook(symbol: string): Promise<OrderBook> {
    this.ensureInitialized();
    return {
      symbol,
      exchange: this.id,
      bids: [[50000, 1.5], [49999, 2.0]],
      asks: [[50001, 1.0], [50002, 3.0]],
      timestamp: Date.now(),
      sequenceId: Date.now(),
    };
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    this.ensureInitialized();
    return [
      {
        id: '1',
        symbol,
        side: 'buy',
        price: 50000,
        amount: 0.1,
        cost: 5000,
        timestamp: Date.now(),
        info: {},
      },
    ];
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    this.ensureInitialized();
    return {
      symbol,
      fundingRate: 0.0001,
      fundingIntervalHours: 8,
      fundingTimestamp: Date.now(),
      nextFundingTime: Date.now() + 8 * 3600 * 1000,
      markPrice: 50000,
      indexPrice: 49995,
      info: {},
    };
  }

  async fetchFundingRateHistory(): Promise<FundingRate[]> {
    this.ensureInitialized();
    return [];
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    this.ensureInitialized();
    return {
      id: 'order-123',
      symbol: request.symbol,
      type: request.type,
      side: request.side,
      amount: request.amount,
      price: request.price,
      status: 'open',
      filled: 0,
      remaining: request.amount,
      reduceOnly: request.reduceOnly || false,
      postOnly: request.postOnly || false,
      timestamp: Date.now(),
      info: {},
    };
  }

  async cancelOrder(orderId: string): Promise<Order> {
    this.ensureInitialized();
    return {
      id: orderId,
      symbol: 'BTC/USDC:USD',
      type: 'limit',
      side: 'buy',
      amount: 1,
      status: 'canceled',
      filled: 0,
      remaining: 0,
      reduceOnly: false,
      postOnly: false,
      timestamp: Date.now(),
      info: {},
    };
  }

  async cancelAllOrders(): Promise<Order[]> {
    this.ensureInitialized();
    return [];
  }

  async fetchOrderHistory(): Promise<Order[]> {
    this.ensureInitialized();
    return [];
  }

  async fetchMyTrades(): Promise<Trade[]> {
    this.ensureInitialized();
    return [];
  }

  async fetchPositions(): Promise<Position[]> {
    this.ensureInitialized();
    return [
      {
        symbol: 'BTC/USDC:USD',
        side: 'long',
        size: 1,
        entryPrice: 49000,
        markPrice: 50000,
        unrealizedPnl: 1000,
        realizedPnl: 0,
        liquidationPrice: 45000,
        leverage: 10,
        marginMode: 'cross',
        margin: 4900,
        timestamp: Date.now(),
        info: {},
      },
    ];
  }

  async fetchBalance(): Promise<Balance[]> {
    this.ensureInitialized();
    return [
      {
        currency: 'USDC',
        total: 10000,
        free: 5000,
        used: 5000,
        usdValue: 10000,
      },
    ];
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    this.ensureInitialized();
    // No-op for testing
  }
}

describe('BaseAdapterCore', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  afterEach(async () => {
    if (adapter.isReady) {
      await adapter.disconnect();
    }
  });

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      expect(adapter).toBeInstanceOf(TestAdapter);
      expect(adapter.id).toBe('test');
      expect(adapter.name).toBe('Test Exchange');
      expect(adapter.isReady).toBe(false);
    });

    test('creates adapter with custom config', () => {
      const customAdapter = new TestAdapter({
        timeout: 60000,
        testnet: true,
        debug: true,
      });

      expect(customAdapter).toBeInstanceOf(TestAdapter);
      expect((customAdapter as any).config.timeout).toBe(60000);
      expect((customAdapter as any).config.testnet).toBe(true);
      expect((customAdapter as any).config.debug).toBe(true);
    });

    test('initializes circuit breaker', () => {
      expect((adapter as any).circuitBreaker).toBeDefined();
      expect((adapter as any).circuitBreaker.getState()).toBe('CLOSED');
    });

    test('initializes metrics structure', () => {
      const metrics = (adapter as any).metrics;
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.rateLimitHits).toBe(0);
      expect(metrics.averageLatency).toBe(0);
      expect(metrics.endpointStats).toBeInstanceOf(Map);
      expect(metrics.startedAt).toBeGreaterThan(0);
    });

    test('initializes resource tracking sets', () => {
      expect((adapter as any).timers).toBeInstanceOf(Set);
      expect((adapter as any).timers.size).toBe(0);
      expect((adapter as any).intervals).toBeInstanceOf(Set);
      expect((adapter as any).intervals.size).toBe(0);
      expect((adapter as any).abortControllers).toBeInstanceOf(Set);
      expect((adapter as any).abortControllers.size).toBe(0);
    });

    test('initializes market cache to null', () => {
      expect((adapter as any).marketCache).toBe(null);
      expect((adapter as any).marketCacheExpiry).toBe(0);
    });
  });

  describe('state management', () => {
    test('isReady starts as false', () => {
      expect(adapter.isReady).toBe(false);
    });

    test('isReady becomes true after initialization', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('isDisconnected starts as false', () => {
      expect(adapter.isDisconnected()).toBe(false);
    });

    test('isDisconnected becomes true after disconnect', async () => {
      await adapter.initialize();
      await adapter.disconnect();
      expect(adapter.isDisconnected()).toBe(true);
    });

    test('isReady becomes false after disconnect', async () => {
      await adapter.initialize();
      await adapter.disconnect();
      expect(adapter.isReady).toBe(false);
    });
  });

  describe('ensureInitialized guard', () => {
    test('throws when adapter not initialized', async () => {
      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
      await expect(adapter.fetchMarkets()).rejects.toMatchObject({
        code: 'NOT_INITIALIZED',
      });
    });

    test('allows operations after initialization', async () => {
      await adapter.initialize();
      await expect(adapter.fetchMarkets()).resolves.toBeDefined();
    });

    test('throws for all methods requiring initialization', async () => {
      await expect(adapter.fetchTicker('BTC/USDC:USD')).rejects.toThrow(/not initialized/);
      await expect(adapter.fetchOrderBook('BTC/USDC:USD')).rejects.toThrow(/not initialized/);
      await expect(adapter.fetchTrades('BTC/USDC:USD')).rejects.toThrow(/not initialized/);
      await expect(adapter.fetchFundingRate('BTC/USDC:USD')).rejects.toThrow(/not initialized/);
      await expect(adapter.fetchPositions()).rejects.toThrow(/not initialized/);
      await expect(adapter.fetchBalance()).rejects.toThrow(/not initialized/);
    });
  });

  describe('resource cleanup', () => {
    test('clears timers on disconnect', async () => {
      await adapter.initialize();

      const timer = setTimeout(() => {}, 10000);
      (adapter as any).timers.add(timer);
      expect((adapter as any).timers.size).toBe(1);

      await adapter.disconnect();
      expect((adapter as any).timers.size).toBe(0);
    });

    test('clears intervals on disconnect', async () => {
      await adapter.initialize();

      const interval = setInterval(() => {}, 1000);
      (adapter as any).intervals.add(interval);
      expect((adapter as any).intervals.size).toBe(1);

      await adapter.disconnect();
      expect((adapter as any).intervals.size).toBe(0);
    });

    test('aborts all pending requests on disconnect', async () => {
      await adapter.initialize();

      const controller = new AbortController();
      const abortSpy = jest.spyOn(controller, 'abort');
      (adapter as any).abortControllers.add(controller);
      expect((adapter as any).abortControllers.size).toBe(1);

      await adapter.disconnect();
      expect(abortSpy).toHaveBeenCalled();
      expect((adapter as any).abortControllers.size).toBe(0);
    });

    test('clears market cache on disconnect', async () => {
      await adapter.initialize();

      (adapter as any).marketCache = [{ id: 'test' }];
      (adapter as any).marketCacheExpiry = Date.now() + 60000;

      await adapter.disconnect();
      expect((adapter as any).marketCache).toBe(null);
      expect((adapter as any).marketCacheExpiry).toBe(0);
    });

    test('destroys circuit breaker on disconnect', async () => {
      await adapter.initialize();

      const destroySpy = jest.spyOn((adapter as any).circuitBreaker, 'destroy');
      await adapter.disconnect();
      expect(destroySpy).toHaveBeenCalled();
    });

    test('disconnect is idempotent', async () => {
      await adapter.initialize();
      await adapter.disconnect();
      await expect(adapter.disconnect()).resolves.not.toThrow();
      expect(adapter.isDisconnected()).toBe(true);
    });
  });

  describe('metrics tracking', () => {
    test('getMetrics returns snapshot', async () => {
      await adapter.initialize();

      const snapshot = adapter.getMetrics();
      expect(snapshot).toMatchObject({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 0,
        successRate: 0,
        errorRate: 0,
      });
      expect(snapshot.endpoints).toBeInstanceOf(Array);
      expect(snapshot.collectionDuration).toBeGreaterThanOrEqual(0);
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });

    test('resetMetrics clears counters', async () => {
      await adapter.initialize();

      // Manually increment metrics
      (adapter as any).metrics.totalRequests = 100;
      (adapter as any).metrics.successfulRequests = 90;
      (adapter as any).metrics.failedRequests = 10;
      (adapter as any).metrics.rateLimitHits = 5;

      adapter.resetMetrics();

      expect((adapter as any).metrics.totalRequests).toBe(0);
      expect((adapter as any).metrics.successfulRequests).toBe(0);
      expect((adapter as any).metrics.failedRequests).toBe(0);
      expect((adapter as any).metrics.rateLimitHits).toBe(0);
      expect((adapter as any).metrics.lastResetAt).toBeGreaterThan(0);
    });

    test('updateEndpointMetrics tracks endpoint stats', async () => {
      await adapter.initialize();

      (adapter as any).updateEndpointMetrics('GET:/markets', 150, false);
      (adapter as any).updateEndpointMetrics('GET:/markets', 200, false);

      const stats = (adapter as any).metrics.endpointStats.get('GET:/markets');
      expect(stats).toMatchObject({
        endpoint: 'GET:/markets',
        count: 2,
        totalLatency: 350,
        minLatency: 150,
        maxLatency: 200,
        errors: 0,
      });
    });

    test('updateEndpointMetrics tracks errors', async () => {
      await adapter.initialize();

      (adapter as any).updateEndpointMetrics('POST:/order', 100, true);
      (adapter as any).updateEndpointMetrics('POST:/order', 150, false);

      const stats = (adapter as any).metrics.endpointStats.get('POST:/order');
      expect(stats).toMatchObject({
        count: 2,
        errors: 1,
      });
    });

    test('updateAverageLatency calculates rolling average', async () => {
      await adapter.initialize();

      (adapter as any).metrics.totalRequests = 1;
      (adapter as any).updateAverageLatency(100);
      expect((adapter as any).metrics.averageLatency).toBe(100);

      (adapter as any).metrics.totalRequests = 2;
      (adapter as any).updateAverageLatency(200);
      expect((adapter as any).metrics.averageLatency).toBe(150);

      (adapter as any).metrics.totalRequests = 3;
      (adapter as any).updateAverageLatency(300);
      expect((adapter as any).metrics.averageLatency).toBeCloseTo(200, 0);
    });
  });

  describe('circuit breaker integration', () => {
    test('getCircuitBreakerState returns current state', async () => {
      await adapter.initialize();
      const state = adapter.getCircuitBreakerState();
      expect(state).toBe('CLOSED');
    });

    test('getCircuitBreakerMetrics returns metrics', async () => {
      await adapter.initialize();
      const metrics = adapter.getCircuitBreakerMetrics();
      expect(metrics).toMatchObject({
        consecutiveFailures: 0,
        state: 'CLOSED',
      });
      expect(metrics).toHaveProperty('state');
      expect(metrics).toHaveProperty('consecutiveFailures');
    });
  });

  describe('cache management', () => {
    test('clearCache clears market cache', async () => {
      await adapter.initialize();

      (adapter as any).marketCache = [{ id: 'test' }];
      (adapter as any).marketCacheExpiry = Date.now() + 60000;

      adapter.clearCache();

      expect((adapter as any).marketCache).toBe(null);
      expect((adapter as any).marketCacheExpiry).toBe(0);
    });

    test('preloadMarkets caches markets', async () => {
      await adapter.initialize();

      await adapter.preloadMarkets({ ttl: 10000 });

      expect((adapter as any).marketCache).toHaveLength(1);
      expect((adapter as any).marketCacheExpiry).toBeGreaterThan(Date.now());
    });

    test('getPreloadedMarkets returns cached markets', async () => {
      await adapter.initialize();

      await adapter.preloadMarkets();
      const cached = adapter.getPreloadedMarkets();

      expect(cached).toHaveLength(1);
      expect(cached?.[0].symbol).toBe('BTC/USDC:USD');
    });

    test('getPreloadedMarkets returns null when cache expired', async () => {
      await adapter.initialize();

      await adapter.preloadMarkets({ ttl: 1 });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cached = adapter.getPreloadedMarkets();
      expect(cached).toBe(null);
    });

    test('getPreloadedMarkets returns null when no cache', async () => {
      await adapter.initialize();
      const cached = adapter.getPreloadedMarkets();
      expect(cached).toBe(null);
    });
  });

  describe('health check', () => {
    test('healthCheck returns healthy status', async () => {
      await adapter.initialize();

      const result = await adapter.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.exchange).toBe('test');
      expect(result.api.reachable).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    test('healthCheck respects timeout', async () => {
      await adapter.initialize();

      const result = await adapter.healthCheck({ timeout: 5000 });
      expect(result.latency).toBeLessThan(5000);
    });

    test('healthCheck can skip websocket check', async () => {
      await adapter.initialize();

      const result = await adapter.healthCheck({ checkWebSocket: false });
      expect(result.websocket).toBeUndefined();
    });

    test('healthCheck can skip auth check', async () => {
      await adapter.initialize();

      const result = await adapter.healthCheck({ checkAuth: false });
      expect(result.auth).toBeUndefined();
    });

    test('healthCheck can skip rate limit check', async () => {
      await adapter.initialize();

      const result = await adapter.healthCheck({ includeRateLimit: false });
      expect(result.rateLimit).toBeUndefined();
    });
  });

  describe('logger methods', () => {
    test('logger is initialized lazily', async () => {
      await adapter.initialize();

      const logger = (adapter as any).logger;
      expect(logger).toBeDefined();
      // Logger context is set based on adapter name
      expect(logger).toHaveProperty('context');
      expect(logger.context).toBe('Test Exchange');
    });

    test('debug logs when debug enabled', async () => {
      const debugAdapter = new TestAdapter({ debug: true });
      await debugAdapter.initialize();

      const logger = (debugAdapter as any).logger;
      const spy = jest.spyOn(logger, 'debug');

      (debugAdapter as any).debug('test message', { key: 'value' });
      expect(spy).toHaveBeenCalledWith('test message', { key: 'value' });
    });

    test('info logs message', async () => {
      await adapter.initialize();

      const logger = (adapter as any).logger;
      const spy = jest.spyOn(logger, 'info');

      (adapter as any).info('info message');
      expect(spy).toHaveBeenCalledWith('info message', undefined);
    });

    test('warn logs message', async () => {
      await adapter.initialize();

      const logger = (adapter as any).logger;
      const spy = jest.spyOn(logger, 'warn');

      (adapter as any).warn('warning message');
      expect(spy).toHaveBeenCalledWith('warning message', undefined);
    });

    test('error logs message and error object', async () => {
      await adapter.initialize();

      const logger = (adapter as any).logger;
      const spy = jest.spyOn(logger, 'error');

      const testError = new Error('test error');
      (adapter as any).error('error occurred', testError, { context: 'test' });
      expect(spy).toHaveBeenCalledWith('error occurred', testError, { context: 'test' });
    });
  });

  describe('resource tracking helpers', () => {
    test('registerTimer adds timer to set', async () => {
      await adapter.initialize();

      const timer = setTimeout(() => {}, 1000);
      (adapter as any).registerTimer(timer);

      expect((adapter as any).timers.has(timer)).toBe(true);
    });

    test('unregisterTimer removes and clears timer', async () => {
      await adapter.initialize();

      const timer = setTimeout(() => {}, 1000);
      (adapter as any).registerTimer(timer);
      (adapter as any).unregisterTimer(timer);

      expect((adapter as any).timers.has(timer)).toBe(false);
    });

    test('registerInterval adds interval to set', async () => {
      await adapter.initialize();

      const interval = setInterval(() => {}, 1000);
      (adapter as any).registerInterval(interval);

      expect((adapter as any).intervals.has(interval)).toBe(true);
      clearInterval(interval);
    });

    test('unregisterInterval removes and clears interval', async () => {
      await adapter.initialize();

      const interval = setInterval(() => {}, 1000);
      (adapter as any).registerInterval(interval);
      (adapter as any).unregisterInterval(interval);

      expect((adapter as any).intervals.has(interval)).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    test('symbolToExchange converts unified to exchange format', () => {
      expect((adapter as any).symbolToExchange('BTC/USDC:USD')).toBe('BTC_USDC');
    });

    test('symbolFromExchange converts exchange to unified format', () => {
      expect((adapter as any).symbolFromExchange('BTC_USDC')).toBe('BTC/USDC:USD');
    });
  });

  describe('feature support helpers', () => {
    test('supportsFeature returns true for supported features', async () => {
      await adapter.initialize();
      expect((adapter as any).supportsFeature('fetchMarkets')).toBe(true);
      expect((adapter as any).supportsFeature('createOrder')).toBe(true);
    });

    test('supportsFeature returns false for unsupported features', async () => {
      await adapter.initialize();
      expect((adapter as any).supportsFeature('fetchOHLCV')).toBe(false);
    });

    test('assertFeatureSupported throws for unsupported features', async () => {
      await adapter.initialize();
      expect(() => (adapter as any).assertFeatureSupported('fetchOHLCV')).toThrow();
    });

    test('assertFeatureSupported passes for supported features', async () => {
      await adapter.initialize();
      expect(() => (adapter as any).assertFeatureSupported('fetchMarkets')).not.toThrow();
    });
  });
});
