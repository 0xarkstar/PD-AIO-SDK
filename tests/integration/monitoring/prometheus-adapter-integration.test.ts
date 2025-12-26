/**
 * Prometheus-BaseAdapter Integration Tests
 *
 * Tests the integration between Prometheus metrics and BaseAdapter,
 * ensuring that metrics are correctly tracked for adapter operations.
 */

import { Registry } from 'prom-client';
import { initializeMetrics, PrometheusMetrics } from '../../../src/monitoring/prometheus.js';
import type {
  IExchangeAdapter,
  Market,
  ExchangeConfig,
  FeatureMap,
} from '../../../src/types/index.js';
import { BaseAdapter } from '../../../src/adapters/base/BaseAdapter.js';

// Mock adapter for testing
class MockAdapter extends BaseAdapter {
  readonly id = 'mock';
  readonly name = 'Mock Exchange';
  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchOrderBook: true,
  };

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async fetchMarkets(): Promise<Market[]> {
    // Simulate API call
    const result = await this.request<any>('GET', 'https://api.mock.com/markets');
    return [];
  }

  async fetchTicker(symbol: string): Promise<any> {
    return {};
  }

  async fetchOrderBook(symbol: string): Promise<any> {
    return {};
  }

  async fetchTrades(symbol: string): Promise<any> {
    return [];
  }

  async fetchBalance(): Promise<any> {
    return {};
  }

  async fetchPositions(): Promise<any> {
    return [];
  }

  async createOrder(params: any): Promise<any> {
    return {};
  }

  async cancelOrder(id: string): Promise<any> {
    return {};
  }

  async fetchOpenOrders(symbol?: string): Promise<any> {
    return [];
  }

  async fetchOrder(id: string): Promise<any> {
    return {};
  }

  async fetchMyTrades(symbol?: string): Promise<any> {
    return [];
  }

  async fetchClosedOrders(symbol?: string): Promise<any> {
    return [];
  }

  async fetchCanceledOrders(symbol?: string): Promise<any> {
    return [];
  }

  async fetchDeposits(currency?: string): Promise<any> {
    return [];
  }

  async fetchWithdrawals(currency?: string): Promise<any> {
    return [];
  }

  async fetchDepositAddress(currency: string): Promise<any> {
    return {};
  }

  async fetchFundingRate(symbol: string): Promise<any> {
    return {};
  }

  async fetchFundingRateHistory(symbol: string): Promise<any> {
    return [];
  }

  async fetchLeverage(symbol: string): Promise<any> {
    return {};
  }

  async setLeverage(leverage: number, symbol: string): Promise<any> {
    return {};
  }

  async setMarginMode(marginMode: string, symbol: string): Promise<any> {
    return {};
  }

  async fetchTransactionFees(symbol?: string): Promise<any> {
    return {};
  }

  async fetchTradingFees(symbol?: string): Promise<any> {
    return {};
  }

  async withdraw(currency: string, amount: number, address: string): Promise<any> {
    return {};
  }

  async deposit(currency: string): Promise<any> {
    return {};
  }

  async transfer(currency: string, amount: number, fromAccount: string, toAccount: string): Promise<any> {
    return {};
  }

  async fetchPortfolio(): Promise<any> {
    return {};
  }

  async cancelAllOrders(symbol?: string): Promise<any> {
    return [];
  }

  async createBatchOrders(orders: any[]): Promise<any> {
    return [];
  }

  async cancelBatchOrders(ids: string[]): Promise<any> {
    return [];
  }

  protected symbolToExchange(symbol: string): string {
    return symbol;
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return exchangeSymbol;
  }
}

describe('Prometheus-BaseAdapter Integration', () => {
  let adapter: MockAdapter;
  let metrics: PrometheusMetrics;
  let registry: Registry;

  beforeEach(() => {
    // Create new registry for each test
    registry = new Registry();
    metrics = initializeMetrics({
      registry,
      metricPrefix: 'test_',
      enableDefaultMetrics: false,
    });

    adapter = new MockAdapter();
  });

  afterEach(async () => {
    await adapter.disconnect();
    registry.clear();
  });

  describe('Request Metrics Integration', () => {
    test('should track successful requests', async () => {
      await adapter.initialize();

      // Mock successful fetch response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ markets: [] }),
      } as Response);

      await adapter.fetchMarkets();

      const metricsData = await registry.getMetricsAsJSON();
      const requestCounter = metricsData.find((m: any) => m.name === 'test_requests_total');

      expect(requestCounter).toBeDefined();
      const successMetric = requestCounter?.values.find(
        (v: any) => v.labels.exchange === 'mock' && v.labels.status === 'success'
      );
      expect(successMetric?.value).toBe(1);
    });

    test('should track failed requests', async () => {
      await adapter.initialize();

      // Mock failed fetch response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(adapter.fetchMarkets()).rejects.toThrow();

      const metricsData = await registry.getMetricsAsJSON();
      const requestCounter = metricsData.find((m: any) => m.name === 'test_requests_total');
      const errorCounter = metricsData.find((m: any) => m.name === 'test_request_errors_total');

      const errorMetric = requestCounter?.values.find(
        (v: any) => v.labels.exchange === 'mock' && v.labels.status === 'error'
      );
      expect(errorMetric?.value).toBe(1);
      expect(errorCounter).toBeDefined();
    });

    test('should track request latency', async () => {
      await adapter.initialize();

      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ markets: [] }),
                } as Response),
              50
            )
          )
      );

      await adapter.fetchMarkets();

      const metricsData = await registry.getMetricsAsJSON();
      const latencyHistogram = metricsData.find(
        (m: any) => m.name === 'test_request_duration_ms'
      );

      expect(latencyHistogram).toBeDefined();
      expect(latencyHistogram?.values.length).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaker Metrics Integration', () => {
    test('should track circuit breaker state changes', async () => {
      // Create adapter with low failure threshold
      const cbAdapter = new MockAdapter({
        circuitBreaker: {
          failureThreshold: 2,
          minimumRequestVolume: 0,
        },
      });
      await cbAdapter.initialize();

      // Mock failed requests to open circuit
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Make requests to trigger circuit breaker
      await expect(cbAdapter.fetchMarkets()).rejects.toThrow();
      await expect(cbAdapter.fetchMarkets()).rejects.toThrow();

      const metricsData = await registry.getMetricsAsJSON();

      // Check circuit breaker state
      const stateGauge = metricsData.find(
        (m: any) => m.name === 'test_circuit_breaker_state'
      );
      expect(stateGauge).toBeDefined();

      // Check transitions
      const transitionCounter = metricsData.find(
        (m: any) => m.name === 'test_circuit_breaker_transitions_total'
      );
      expect(transitionCounter).toBeDefined();

      await cbAdapter.disconnect();
    });

    test('should track circuit breaker successes and failures', async () => {
      await adapter.initialize();

      // Mock successful request
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ markets: [] }),
      } as Response);

      await adapter.fetchMarkets();

      const metricsData = await registry.getMetricsAsJSON();
      const successCounter = metricsData.find(
        (m: any) => m.name === 'test_circuit_breaker_successes_total'
      );

      expect(successCounter).toBeDefined();
      const mockSuccess = successCounter?.values.find(
        (v: any) => v.labels.exchange === 'mock'
      );
      expect(mockSuccess?.value).toBe(1);
    });
  });

  describe('Multiple Operations', () => {
    test('should track metrics for different operations', async () => {
      await adapter.initialize();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      // Make multiple different requests
      await adapter.fetchMarkets();
      await adapter.fetchMarkets();

      const metricsData = await registry.getMetricsAsJSON();
      const requestCounter = metricsData.find((m: any) => m.name === 'test_requests_total');

      const mockMetrics = requestCounter?.values.filter(
        (v: any) => v.labels.exchange === 'mock'
      );
      expect(mockMetrics?.length).toBeGreaterThan(0);
    });
  });

  describe('Error Type Tracking', () => {
    test('should track different error types', async () => {
      await adapter.initialize();

      // Test network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));
      await expect(adapter.fetchMarkets()).rejects.toThrow();

      // Test HTTP error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);
      await expect(adapter.fetchMarkets()).rejects.toThrow();

      const metricsData = await registry.getMetricsAsJSON();
      const errorCounter = metricsData.find(
        (m: any) => m.name === 'test_request_errors_total'
      );

      expect(errorCounter).toBeDefined();
      expect(errorCounter?.values.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics Without Initialization', () => {
    test('should work without metrics initialized', async () => {
      // Clear global metrics
      registry.clear();

      const standaloneAdapter = new MockAdapter();
      await standaloneAdapter.initialize();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ markets: [] }),
      } as Response);

      // Should not throw error even without metrics
      await expect(standaloneAdapter.fetchMarkets()).resolves.not.toThrow();

      await standaloneAdapter.disconnect();
    });
  });

  describe('Long-Running Operations', () => {
    test('should track metrics over multiple operations', async () => {
      await adapter.initialize();

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'first' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'second' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Third failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'fourth' }),
        } as Response);

      // Execute multiple operations
      await adapter.fetchMarkets(); // success
      await adapter.fetchMarkets(); // success
      await expect(adapter.fetchMarkets()).rejects.toThrow(); // error
      await adapter.fetchMarkets(); // success

      const metricsData = await registry.getMetricsAsJSON();
      const requestCounter = metricsData.find((m: any) => m.name === 'test_requests_total');

      const successCount = requestCounter?.values.find(
        (v: any) => v.labels.exchange === 'mock' && v.labels.status === 'success'
      )?.value;
      const errorCount = requestCounter?.values.find(
        (v: any) => v.labels.exchange === 'mock' && v.labels.status === 'error'
      )?.value;

      expect(successCount).toBe(3);
      expect(errorCount).toBe(1);
    });
  });

  describe('Metrics Export', () => {
    test('should export metrics in Prometheus format', async () => {
      await adapter.initialize();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ markets: [] }),
      } as Response);

      await adapter.fetchMarkets();

      const metricsText = await metrics.getMetrics();

      expect(metricsText).toContain('test_requests_total');
      expect(metricsText).toContain('exchange="mock"');
      expect(metricsText).toContain('test_request_duration_ms');
      expect(metricsText).toContain('test_circuit_breaker_state');
    });
  });
});
