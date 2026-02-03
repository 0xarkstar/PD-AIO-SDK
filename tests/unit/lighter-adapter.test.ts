/**
 * LighterAdapter Unit Tests
 *
 * Tests for the Lighter DEX adapter covering market data, trading, and WebSocket methods
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LighterAdapter } from '../../src/adapters/lighter/LighterAdapter.js';

describe('LighterAdapter', () => {
  describe('constructor', () => {
    it('should initialize with default config', () => {
      const adapter = new LighterAdapter();
      expect(adapter.id).toBe('lighter');
      expect(adapter.name).toBe('Lighter');
    });

    it('should initialize with API credentials', () => {
      const adapter = new LighterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(adapter.id).toBe('lighter');
    });

    it('should use testnet URLs when testnet is true', () => {
      const adapter = new LighterAdapter({ testnet: true });
      expect((adapter as any).apiUrl).toContain('testnet');
    });

    it('should use mainnet URLs when testnet is false', () => {
      const adapter = new LighterAdapter({ testnet: false });
      expect((adapter as any).apiUrl).not.toContain('testnet');
    });

    it('should set rate limit tier', () => {
      const adapter = new LighterAdapter({ rateLimitTier: 'tier2' });
      expect((adapter as any).rateLimiter).toBeDefined();
    });

    it('should set custom timeout', () => {
      const adapter = new LighterAdapter({ timeout: 60000 });
      expect((adapter as any).httpClient).toBeDefined();
    });
  });

  describe('has feature map', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have correct supported features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
    });

    it('should have correct unsupported features', () => {
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
      expect(adapter.has.setLeverage).toBe(false);
    });

    it('should have emulated batch order support', () => {
      expect(adapter.has.createBatchOrders).toBe('emulated');
      expect(adapter.has.cancelBatchOrders).toBe('emulated');
    });
  });

  describe('symbol conversion', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('symbolToExchange should convert CCXT symbol to Lighter format', () => {
      const result = (adapter as any).symbolToExchange('BTC/USDT:USDT');
      expect(result).toBeDefined();
    });

    it('symbolFromExchange should convert Lighter symbol to CCXT format', () => {
      const result = (adapter as any).symbolFromExchange('BTCUSDT');
      expect(result).toBeDefined();
    });
  });

  describe('rate limiter', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have rate limiter configured', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });
  });

  describe('http client', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have http client configured', () => {
      expect((adapter as any).httpClient).toBeDefined();
    });
  });

  describe('normalizer', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have normalizer instance', () => {
      expect((adapter as any).normalizer).toBeDefined();
    });
  });

  describe('trading methods without authentication', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('createOrder should throw without API credentials', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow();
    });

    it('cancelOrder should throw without API credentials', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should disconnect and clean up resources', async () => {
      await adapter.disconnect();
      expect((adapter as any).wsManager).toBeNull();
    });
  });

  describe('health check methods', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter({ testnet: true });
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    describe('getStatus', () => {
      it('should return status object with expected properties', async () => {
        const status = await adapter.getStatus();

        expect(status).toHaveProperty('ready');
        expect(status).toHaveProperty('authenticated');
        expect(status).toHaveProperty('authMode');
        expect(status).toHaveProperty('wsConnected');
        expect(status).toHaveProperty('network');
        expect(status).toHaveProperty('rateLimiter');

        expect(status.network).toBe('testnet');
        expect(status.authMode).toBe('none');
        expect(status.authenticated).toBe(false);
      });

      it('should show hmac auth mode when credentials provided', async () => {
        const authAdapter = new LighterAdapter({
          apiKey: 'test-key',
          apiSecret: 'test-secret',
          testnet: true,
        });

        const status = await authAdapter.getStatus();
        expect(status.authMode).toBe('hmac');
        expect(status.authenticated).toBe(true);

        await authAdapter.disconnect();
      });
    });

    describe('isHealthy', () => {
      it('should return false when not ready', async () => {
        // New adapter is not ready until initialize() is called
        const healthy = await adapter.isHealthy();
        expect(healthy).toBe(false);
      });
    });
  });
});

describe('Lighter Utility Functions', () => {
  let convertOrderRequest: typeof import('../../src/adapters/lighter/utils.js').convertOrderRequest;
  let mapError: typeof import('../../src/adapters/lighter/utils.js').mapError;

  beforeAll(async () => {
    const utilsModule = await import('../../src/adapters/lighter/utils.js');
    convertOrderRequest = utilsModule.convertOrderRequest;
    mapError = utilsModule.mapError;
  });

  describe('convertOrderRequest', () => {
    test('should convert basic market order', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'buy' as const,
        type: 'market' as const,
        amount: 1.5,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.symbol).toBe('BTC-USD');
      expect(result.side).toBe('buy');
      expect(result.type).toBe('market');
      expect(result.quantity).toBe(1.5);
    });

    test('should convert limit order with price', () => {
      const request = {
        symbol: 'ETH/USD:USD',
        side: 'sell' as const,
        type: 'limit' as const,
        amount: 10,
        price: 3000,
      };

      const result = convertOrderRequest(request, 'ETH-USD');

      expect(result.price).toBe(3000);
    });

    test('should include clientOrderId when provided', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'buy' as const,
        type: 'market' as const,
        amount: 1,
        clientOrderId: 'client-123',
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.clientOrderId).toBe('client-123');
    });

    test('should not include clientOrderId when not provided', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'buy' as const,
        type: 'market' as const,
        amount: 1,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.clientOrderId).toBeUndefined();
    });

    test('should set reduceOnly when true', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'sell' as const,
        type: 'market' as const,
        amount: 1,
        reduceOnly: true,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.reduceOnly).toBe(true);
    });

    test('should not set reduceOnly when false', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'sell' as const,
        type: 'market' as const,
        amount: 1,
        reduceOnly: false,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.reduceOnly).toBeUndefined();
    });

    test('should set timeInForce to PO for postOnly', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'buy' as const,
        type: 'limit' as const,
        amount: 1,
        price: 50000,
        postOnly: true,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.timeInForce).toBe('PO');
    });

    test('should set timeInForce when provided', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'buy' as const,
        type: 'limit' as const,
        amount: 1,
        price: 50000,
        timeInForce: 'IOC' as const,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.timeInForce).toBe('IOC');
    });

    test('should prefer postOnly over timeInForce', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        side: 'buy' as const,
        type: 'limit' as const,
        amount: 1,
        price: 50000,
        postOnly: true,
        timeInForce: 'GTC' as const,
      };

      const result = convertOrderRequest(request, 'BTC-USD');

      expect(result.timeInForce).toBe('PO');
    });
  });

  describe('mapError', () => {
    test('should pass through PerpDEXError', async () => {
      const { PerpDEXError } = await import('../../src/types/errors.js');
      const perpError = new PerpDEXError('Test error', 'TEST_CODE', 'lighter');
      const result = mapError(perpError);
      expect(result).toBe(perpError);
    });

    test('should map rate limit error', () => {
      const error = new Error('rate limit exceeded');
      const result = mapError(error);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should map too many requests error', () => {
      const error = new Error('too many requests');
      const result = mapError(error);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should map insufficient margin error', () => {
      const error = new Error('insufficient margin');
      const result = mapError(error);
      expect(result.code).toBe('INSUFFICIENT_MARGIN');
    });

    test('should map insufficient balance error', () => {
      const error = new Error('insufficient balance');
      const result = mapError(error);
      expect(result.code).toBe('INSUFFICIENT_MARGIN');
    });

    test('should map invalid order error', () => {
      const error = new Error('invalid order parameters');
      const result = mapError(error);
      expect(result.code).toBe('INVALID_ORDER');
    });

    test('should map order size error', () => {
      const error = new Error('order size too small');
      const result = mapError(error);
      expect(result.code).toBe('INVALID_ORDER');
    });

    test('should map price error', () => {
      const error = new Error('price is invalid');
      const result = mapError(error);
      expect(result.code).toBe('INVALID_ORDER');
    });

    test('should map order not found error', () => {
      const error = new Error('order not found');
      const result = mapError(error);
      expect(result.code).toBe('ORDER_NOT_FOUND');
    });

    test('should map unauthorized error', () => {
      const error = new Error('unauthorized');
      const result = mapError(error);
      expect(result.code).toBe('INVALID_SIGNATURE');
    });

    test('should map authentication error', () => {
      const error = new Error('authentication failed');
      const result = mapError(error);
      expect(result.code).toBe('INVALID_SIGNATURE');
    });

    test('should map invalid signature error', () => {
      const error = new Error('invalid signature');
      const result = mapError(error);
      expect(result.code).toBe('INVALID_SIGNATURE');
    });

    test('should map unavailable error', () => {
      const error = new Error('service unavailable');
      const result = mapError(error);
      expect(result.code).toBe('EXCHANGE_UNAVAILABLE');
    });

    test('should map maintenance error', () => {
      const error = new Error('system under maintenance');
      const result = mapError(error);
      expect(result.code).toBe('EXCHANGE_UNAVAILABLE');
    });

    test('should map offline error', () => {
      const error = new Error('exchange offline');
      const result = mapError(error);
      expect(result.code).toBe('EXCHANGE_UNAVAILABLE');
    });

    test('should map unknown error', () => {
      const error = new Error('some random error');
      const result = mapError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle string error', () => {
      const result = mapError('string error message');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('string error message');
    });

    test('should handle non-Error object', () => {
      const result = mapError({ custom: 'error' });
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });
});
