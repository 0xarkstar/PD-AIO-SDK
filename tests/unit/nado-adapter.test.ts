/**
 * NadoAdapter Unit Tests
 *
 * Tests for the Nado DEX adapter covering market data, trading, and WebSocket methods
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { NadoAdapter } from '../../src/adapters/nado/NadoAdapter.js';
import { PerpDEXError, InvalidOrderError } from '../../src/types/errors.js';

// Mock NadoAPIClient
jest.mock('../../src/adapters/nado/NadoAPIClient.js', () => ({
  NadoAPIClient: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    execute: jest.fn(),
  })),
}));

// Mock NadoAuth
jest.mock('../../src/adapters/nado/NadoAuth.js', () => ({
  NadoAuth: jest.fn().mockImplementation(() => ({
    getAddress: jest.fn().mockReturnValue('0x1234567890abcdef1234567890abcdef12345678'),
    getNextNonce: jest.fn().mockReturnValue('1'),
    getCurrentNonce: jest.fn().mockReturnValue('0'),
    setNonce: jest.fn(),
    signOrder: jest.fn().mockResolvedValue('0xsignature'),
    signCancellation: jest.fn().mockResolvedValue('0xsignature'),
  })),
}));

// Mock WebSocketManager
jest.mock('../../src/websocket/index.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

describe('NadoAdapter', () => {
  const testPrivateKey = '0x' + '1'.repeat(64);

  describe('constructor', () => {
    it('should initialize without wallet or privateKey (for public API access)', () => {
      const adapter = new NadoAdapter({ testnet: true });
      expect(adapter.id).toBe('nado');
      expect(adapter.name).toBe('Nado');
      // Auth should be undefined when no credentials provided
      expect((adapter as any).auth).toBeUndefined();
    });

    it('should initialize with privateKey', () => {
      const adapter = new NadoAdapter({ privateKey: testPrivateKey });
      expect(adapter.id).toBe('nado');
      expect(adapter.name).toBe('Nado');
      // Auth should be defined when credentials provided
      expect((adapter as any).auth).toBeDefined();
    });

    it('should initialize with wallet', () => {
      const wallet = new Wallet(testPrivateKey);
      const adapter = new NadoAdapter({ wallet });
      expect(adapter.id).toBe('nado');
    });

    it('should use testnet configuration when testnet is true', () => {
      const adapter = new NadoAdapter({ privateKey: testPrivateKey, testnet: true });
      expect((adapter as any).chainId).toBe(763373); // Ink L2 testnet
    });

    it('should use mainnet configuration when testnet is false', () => {
      const adapter = new NadoAdapter({ privateKey: testPrivateKey, testnet: false });
      expect((adapter as any).chainId).toBe(57073); // Ink L2 mainnet
    });
  });

  describe('has feature map', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should have correct supported features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(false); // REST API not available, use watchTrades
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.cancelBatchOrders).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchUserFees).toBe(true);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
      expect(adapter.has.watchOrders).toBe(true);
      expect(adapter.has.watchBalance).toBe(true);
    });

    it('should have correct unsupported features', () => {
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
      expect(adapter.has.createBatchOrders).toBe(false);
      expect(adapter.has.editOrder).toBe(false);
      expect(adapter.has.fetchMyTrades).toBe(false);
      expect(adapter.has.fetchDeposits).toBe(false);
      expect(adapter.has.fetchWithdrawals).toBe(false);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
      expect(adapter.has.watchTicker).toBe(false);
      expect(adapter.has.watchFundingRate).toBe(false);
      expect(adapter.has.twapOrders).toBe(false);
      expect(adapter.has.vaultTrading).toBe(false);
      expect(adapter.has.fetchPortfolio).toBe(false);
      expect(adapter.has.fetchRateLimitStatus).toBe(false);
    });
  });

  describe('unsupported methods', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('fetchFundingRateHistory should throw not supported error', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USDT:USDT')).rejects.toThrow(
        'not supported'
      );
    });

    it('fetchMyTrades should throw not supported error', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow('not supported');
    });

    it('setLeverage should throw not supported error', async () => {
      await expect(adapter.setLeverage('BTC/USDT:USDT', 10)).rejects.toThrow('not supported');
    });
  });

  describe('WebSocket methods without initialization', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('watchOrderBook should throw without WebSocket manager', async () => {
      const generator = adapter.watchOrderBook('BTC/USDT:USDT');
      await expect(generator.next()).rejects.toThrow('WebSocket not initialized');
    });

    it('watchPositions should throw without WebSocket manager', async () => {
      const generator = adapter.watchPositions();
      await expect(generator.next()).rejects.toThrow('WebSocket not initialized');
    });

    it('watchOrders should throw without WebSocket manager', async () => {
      const generator = adapter.watchOrders();
      await expect(generator.next()).rejects.toThrow('WebSocket not initialized');
    });

    it('watchTrades should throw without WebSocket manager', async () => {
      const generator = adapter.watchTrades('BTC/USDT:USDT');
      await expect(generator.next()).rejects.toThrow('WebSocket not initialized');
    });

    it('watchBalance should throw without WebSocket manager', async () => {
      const generator = adapter.watchBalance();
      await expect(generator.next()).rejects.toThrow('WebSocket not initialized');
    });
  });

  describe('trading methods without initialization', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('createOrder should throw without contracts info', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow('Contracts info not loaded');
    });

    it('cancelOrder should throw without contracts info', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow('Contracts info not loaded');
    });

    it('cancelAllOrders should throw without contracts info', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow('Contracts info not loaded');
    });
  });

  describe('symbol conversion', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('symbolToExchange should convert CCXT symbol to Nado format', () => {
      const result = (adapter as any).symbolToExchange('BTC/USDT:USDT');
      expect(result).toBe('BTC-PERP');
    });

    it('symbolFromExchange should convert Nado symbol to CCXT format', () => {
      const result = (adapter as any).symbolFromExchange('BTC-PERP');
      expect(result).toBe('BTC/USDT:USDT');
    });

    it('symbolToExchange should handle ETH symbol', () => {
      const result = (adapter as any).symbolToExchange('ETH/USDT:USDT');
      expect(result).toBe('ETH-PERP');
    });

    it('symbolFromExchange should handle ETH symbol', () => {
      const result = (adapter as any).symbolFromExchange('ETH-PERP');
      expect(result).toBe('ETH/USDT:USDT');
    });

    it('symbolToExchange should handle spot symbol', () => {
      const result = (adapter as any).symbolToExchange('BTC/USDC');
      expect(result).toBe('BTC-USDC');
    });

    it('symbolFromExchange should handle spot symbol', () => {
      const result = (adapter as any).symbolFromExchange('BTC-USDC');
      expect(result).toBe('BTC/USDC');
    });
  });

  describe('trackRequest', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should update metrics on successful request', () => {
      (adapter as any).trackRequest('test', 100, true);

      expect((adapter as any).metrics.totalRequests).toBe(1);
      expect((adapter as any).metrics.successfulRequests).toBe(1);
      expect((adapter as any).metrics.failedRequests).toBe(0);
      expect((adapter as any).metrics.averageLatency).toBe(100);
    });

    it('should update metrics on failed request', () => {
      (adapter as any).trackRequest('test', 150, false);

      expect((adapter as any).metrics.totalRequests).toBe(1);
      expect((adapter as any).metrics.successfulRequests).toBe(0);
      expect((adapter as any).metrics.failedRequests).toBe(1);
    });

    it('should calculate average latency correctly', () => {
      (adapter as any).trackRequest('test1', 100, true);
      (adapter as any).trackRequest('test2', 200, true);

      expect((adapter as any).metrics.totalRequests).toBe(2);
      expect((adapter as any).metrics.averageLatency).toBe(150);
    });
  });

  describe('getProductMapping', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should throw InvalidOrderError for unknown symbol', () => {
      expect(() => (adapter as any).getProductMapping('UNKNOWN/USD:USD')).toThrow(InvalidOrderError);
      expect(() => (adapter as any).getProductMapping('UNKNOWN/USD:USD')).toThrow(
        'mapping not found'
      );
    });
  });

  describe('disconnect', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should disconnect and clean up resources', async () => {
      // Set some internal state
      (adapter as any).productMappings.set('test', { productId: 1, symbol: 'TEST', ccxtSymbol: 'TEST/USD' });

      await adapter.disconnect();

      expect((adapter as any).productMappings.size).toBe(0);
      expect((adapter as any).wsManager).toBeUndefined();
    });
  });

  describe('connect', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should be an alias for initialize', () => {
      expect(adapter.connect).toBeDefined();
      // connect() will fail without network, but at least verify it exists
    });
  });

  describe('rate limiter', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should have rate limiter configured', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });
  });

  describe('normalizer', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should have normalizer instance', () => {
      expect((adapter as any).normalizer).toBeDefined();
    });
  });

  describe('fetchMarketsFromAPI with mocked client', () => {
    let adapter: NadoAdapter;
    let mockApiClient: any;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
      mockApiClient = (adapter as any).apiClient;
    });

    it('should handle empty symbols', async () => {
      mockApiClient.query.mockResolvedValue({ symbols: {} });

      const markets = await (adapter as any).fetchMarketsFromAPI();

      expect(markets).toHaveLength(0);
    });
  });

  describe('fetchTicker with mocked client', () => {
    let adapter: NadoAdapter;
    let mockApiClient: any;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
      mockApiClient = (adapter as any).apiClient;

      // Set up product mappings
      (adapter as any).productMappings.set('BTC/USDT:USDT', {
        productId: 1,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      });
    });

    it('should throw when no ticker data returned', async () => {
      mockApiClient.query.mockResolvedValue({ market_prices: [] });

      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchOrderBook with mocked client', () => {
    let adapter: NadoAdapter;
    let mockApiClient: any;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
      mockApiClient = (adapter as any).apiClient;

      // Set up product mappings
      (adapter as any).productMappings.set('BTC/USDT:USDT', {
        productId: 1,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      });
    });

    it('should call API with correct parameters', async () => {
      // Use x18 format for bid/ask as expected by Nado
      const mockOrderBook = {
        bids: [
          ['50000000000000000000000', '1500000000000000000'], // 50000.00, 1.5 in x18
        ],
        asks: [
          ['50001000000000000000000', '1000000000000000000'], // 50001.00, 1.0 in x18
        ],
      };

      mockApiClient.query.mockResolvedValue(mockOrderBook);

      const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 10 });

      expect(mockApiClient.query).toHaveBeenCalledWith('market_liquidity', {
        product_id: 1,
        depth: 10,
      });
      expect(orderBook).toBeDefined();
    });
  });

  describe('fetchFundingRateHistory', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should throw not supported error', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USDT:USDT')).rejects.toThrow(
        /not supported/i
      );
    });
  });

  describe('fetchTrades', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should throw not supported error', async () => {
      await expect(adapter.fetchTrades('BTC/USDT:USDT')).rejects.toThrow(/not supported/i);
    });
  });

  describe('private methods without auth', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      // Create adapter without credentials
      adapter = new NadoAdapter({ testnet: true });
    });

    it('fetchPositions should throw without auth', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow(PerpDEXError);
      await expect(adapter.fetchPositions()).rejects.toMatchObject({
        code: 'MISSING_CREDENTIALS',
      });
    });

    it('fetchBalance should throw without auth', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow(PerpDEXError);
      await expect(adapter.fetchBalance()).rejects.toMatchObject({
        code: 'MISSING_CREDENTIALS',
      });
    });

    it('fetchOrderHistory should throw without auth', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(PerpDEXError);
    });
  });

  describe('initialize', () => {
    let adapter: NadoAdapter;
    let mockApiClient: any;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
      mockApiClient = (adapter as any).apiClient;
    });

    it('should skip re-initialization if already ready', async () => {
      (adapter as any)._isReady = true;

      await adapter.initialize();

      expect(mockApiClient.query).not.toHaveBeenCalled();
    });

    it('should throw on initialization failure', async () => {
      mockApiClient.query.mockRejectedValue(new Error('Network error'));

      await expect(adapter.initialize()).rejects.toThrow('Nado initialization failed');
    });
  });

  describe('fetchPositions with mocked client', () => {
    let adapter: NadoAdapter;
    let mockApiClient: any;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
      mockApiClient = (adapter as any).apiClient;

      // Set up product mappings
      (adapter as any).productMappings.set('BTC/USDT:USDT', {
        productId: 1,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      });
    });

    it('should skip positions with unknown product ID', async () => {
      // Use x18 format for position amounts as expected by Nado
      const mockPositions = [
        {
          product_id: 999, // Unknown product ID
          amount_x18: '1500000000000000000',
          v_quote_balance_x18: '5000000000000000000000',
          last_cumulative_funding_x18: '0',
        },
      ];

      mockApiClient.query.mockResolvedValue(mockPositions);

      const positions = await adapter.fetchPositions();

      expect(positions).toHaveLength(0);
    });
  });

  describe('getMetrics', () => {
    let adapter: NadoAdapter;

    beforeEach(() => {
      adapter = new NadoAdapter({ privateKey: testPrivateKey });
    });

    it('should return metrics object', () => {
      const metrics = adapter.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });
  });
});
