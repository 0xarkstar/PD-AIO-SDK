/**
 * Pacifica Coverage Tests
 *
 * Additional tests for PacificaAuth, handleError paths, signedRequest,
 * symbolToExchange/symbolFromExchange, unsupported methods, and normalizer edge cases.
 */

import { PacificaAdapter } from '../../src/adapters/pacifica/PacificaAdapter.js';
import { PacificaAuth } from '../../src/adapters/pacifica/PacificaAuth.js';
import { PacificaNormalizer } from '../../src/adapters/pacifica/PacificaNormalizer.js';
import { PerpDEXError } from '../../src/types/errors.js';
import type {
  PacificaOrderResponse,
} from '../../src/adapters/pacifica/types.js';

// Mock HTTPClient
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// ============================================================================
// PacificaAuth Tests
// ============================================================================

describe('PacificaAuth', () => {
  const validKey = 'test-api-key';
  const validSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  describe('hasCredentials', () => {
    test('returns true with valid credentials', () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: validSecret });
      expect(auth.hasCredentials()).toBe(true);
    });

    test('returns false with empty apiKey', () => {
      const auth = new PacificaAuth({ apiKey: '', apiSecret: validSecret });
      expect(auth.hasCredentials()).toBe(false);
    });

    test('returns false with empty apiSecret', () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: '' });
      expect(auth.hasCredentials()).toBe(false);
    });

    test('returns false with both empty', () => {
      const auth = new PacificaAuth({ apiKey: '', apiSecret: '' });
      expect(auth.hasCredentials()).toBe(false);
    });
  });

  describe('getHeaders', () => {
    test('returns X-API-KEY and Content-Type', () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: validSecret });
      const headers = auth.getHeaders();
      expect(headers).toEqual({
        'X-API-KEY': validKey,
        'Content-Type': 'application/json',
      });
    });
  });

  describe('sign', () => {
    test('returns headers with X-API-KEY, X-Timestamp, X-Window, X-Signature', async () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: validSecret });
      const result = await auth.sign({
        method: 'GET',
        path: '/test',
      });

      expect(result.headers).toBeDefined();
      expect(result.headers!['X-API-KEY']).toBe(validKey);
      expect(result.headers!['X-Timestamp']).toBeDefined();
      expect(result.headers!['X-Window']).toBe('5000');
      expect(result.headers!['X-Signature']).toBeDefined();
      expect(result.headers!['Content-Type']).toBe('application/json');
    });

    test('uses provided timestamp', async () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: validSecret });
      const result = await auth.sign({
        method: 'POST',
        path: '/orders',
        timestamp: 1700000000000,
        body: { symbol: 'BTC-PERP' },
      });

      expect(result.headers!['X-Timestamp']).toBe('1700000000000');
    });

    test('includes body in signature when present', async () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: validSecret });

      const withBody = await auth.sign({
        method: 'POST',
        path: '/orders',
        timestamp: 1700000000000,
        body: { key: 'value' },
      });

      const withoutBody = await auth.sign({
        method: 'POST',
        path: '/orders',
        timestamp: 1700000000000,
      });

      // Signatures should differ because body is included in the message
      expect(withBody.headers!['X-Signature']).not.toBe(withoutBody.headers!['X-Signature']);
    });
  });

  describe('signMessage error path', () => {
    test('throws PerpDEXError with SIGNATURE_ERROR on invalid key', async () => {
      const auth = new PacificaAuth({ apiKey: validKey, apiSecret: 'not-valid-hex' });

      await expect(
        auth.sign({ method: 'GET', path: '/test' })
      ).rejects.toThrow(PerpDEXError);

      try {
        await auth.sign({ method: 'GET', path: '/test' });
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).code).toBe('SIGNATURE_ERROR');
        expect((error as PerpDEXError).exchange).toBe('pacifica');
      }
    });
  });
});

// ============================================================================
// handleError Tests (via adapter methods)
// ============================================================================

describe('PacificaAdapter handleError paths', () => {
  let adapter: PacificaAdapter;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new PacificaAdapter();
    mockHttpClient = (adapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
  });

  test('handleError with JSON error code in message maps to specific error', async () => {
    const httpError = new Error('Request failed: {"code": "INVALID_ORDER", "message": "bad"}');
    mockHttpClient.get.mockRejectedValue(httpError);

    await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);

    try {
      await adapter.fetchMarkets();
    } catch (error) {
      expect(error).toBeInstanceOf(PerpDEXError);
      expect((error as PerpDEXError).code).toBe('INVALID_ORDER');
    }
  });

  test('handleError passes through PerpDEXError unchanged', async () => {
    const perpError = new PerpDEXError('Custom error', 'CUSTOM_CODE', 'pacifica');
    mockHttpClient.get.mockRejectedValue(perpError);

    await expect(adapter.fetchMarkets()).rejects.toThrow(perpError);

    try {
      await adapter.fetchMarkets();
    } catch (error) {
      expect(error).toBe(perpError);
    }
  });

  test('handleError wraps generic Error without code pattern', async () => {
    const genericError = new Error('Network timeout');
    mockHttpClient.get.mockRejectedValue(genericError);

    await expect(adapter.fetchMarkets()).rejects.toThrow('Network timeout');

    try {
      await adapter.fetchMarkets();
    } catch (error) {
      expect(error).toBeInstanceOf(PerpDEXError);
      expect((error as PerpDEXError).code).toBe('UNKNOWN');
    }
  });

  test('handleError wraps non-Error thrown value', async () => {
    mockHttpClient.get.mockRejectedValue('string error');

    await expect(adapter.fetchMarkets()).rejects.toThrow('Unknown error');

    try {
      await adapter.fetchMarkets();
    } catch (error) {
      expect(error).toBeInstanceOf(PerpDEXError);
      expect((error as PerpDEXError).code).toBe('UNKNOWN');
    }
  });
});

// ============================================================================
// signedRequest error propagation
// ============================================================================

describe('PacificaAdapter signedRequest error propagation', () => {
  test('auth.sign error propagates through signedRequest', async () => {
    const authAdapter = new PacificaAdapter({
      apiKey: 'test-key',
      apiSecret: 'invalid-hex-key',
    });
    const mockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as {
      get: jest.Mock;
      post: jest.Mock;
    };

    // createOrder calls signedRequest which calls auth.sign
    mockHttp.post.mockResolvedValue({});

    await expect(
      authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'market',
        side: 'buy',
        amount: 0.1,
      })
    ).rejects.toThrow(PerpDEXError);
  });
});

// ============================================================================
// Unsupported Methods (return empty arrays)
// ============================================================================

describe('PacificaAdapter unsupported methods', () => {
  let adapter: PacificaAdapter;

  beforeEach(() => {
    adapter = new PacificaAdapter();
  });

  test('fetchFundingRateHistory returns empty array', async () => {
    const result = await adapter.fetchFundingRateHistory('BTC/USDC:USDC');
    expect(result).toEqual([]);
  });

  test('fetchFundingRateHistory with optional params returns empty array', async () => {
    const result = await adapter.fetchFundingRateHistory('BTC/USDC:USDC', 1700000000000, 10);
    expect(result).toEqual([]);
  });

  test('cancelAllOrders returns empty array', async () => {
    const result = await adapter.cancelAllOrders();
    expect(result).toEqual([]);
  });

  test('cancelAllOrders with symbol returns empty array', async () => {
    const result = await adapter.cancelAllOrders('BTC/USDC:USDC');
    expect(result).toEqual([]);
  });

  test('fetchOrderHistory returns empty array', async () => {
    const result = await adapter.fetchOrderHistory();
    expect(result).toEqual([]);
  });

  test('fetchOrderHistory with params returns empty array', async () => {
    const result = await adapter.fetchOrderHistory('BTC/USDC:USDC', 1700000000000, 50);
    expect(result).toEqual([]);
  });

  test('fetchMyTrades returns empty array', async () => {
    const result = await adapter.fetchMyTrades();
    expect(result).toEqual([]);
  });

  test('fetchMyTrades with params returns empty array', async () => {
    const result = await adapter.fetchMyTrades('BTC/USDC:USDC', 1700000000000, 50);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// PacificaNormalizer edge cases
// ============================================================================

describe('PacificaNormalizer edge cases', () => {
  const normalizer = new PacificaNormalizer();

  describe('countDecimals', () => {
    test('value with no dot returns 0', () => {
      // Access via normalizeMarket since countDecimals is private
      const market = normalizer.normalizeMarket({
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDC',
        status: 'active',
        price_step: '1',
        size_step: '1',
        min_size: '1',
        max_leverage: 10,
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        funding_interval: 3600,
      });
      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });

    test('value with trailing zeros strips them', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDC',
        status: 'active',
        price_step: '0.10',
        size_step: '0.0100',
        min_size: '0.001',
        max_leverage: 10,
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        funding_interval: 3600,
      });
      expect(market.pricePrecision).toBe(1);
      expect(market.amountPrecision).toBe(2);
    });

    test('value with all trailing zeros after dot returns 0', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDC',
        status: 'active',
        price_step: '1.000',
        size_step: '1.0',
        min_size: '1',
        max_leverage: 10,
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        funding_interval: 3600,
      });
      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });

    test('empty string returns 0', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDC',
        status: 'active',
        price_step: '',
        size_step: '',
        min_size: '1',
        max_leverage: 10,
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        funding_interval: 3600,
      });
      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });
  });

  describe('normalizeOrder edge cases', () => {
    test('normalizeOrder without avg_fill_price sets averagePrice to undefined', () => {
      const raw: PacificaOrderResponse = {
        order_id: 'order-no-fill',
        client_order_id: 'cid-1',
        symbol: 'BTC-PERP',
        side: 'buy',
        type: 'limit',
        price: '50000.0',
        size: '0.1',
        filled_size: '0.0',
        status: 'open',
        reduce_only: false,
        post_only: false,
        created_at: 1699999000000,
        updated_at: 1699999000000,
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.averagePrice).toBeUndefined();
    });

    test('normalizeOrder with cancelled (double-l) status maps to canceled', () => {
      const raw: PacificaOrderResponse = {
        order_id: 'order-cancel',
        client_order_id: 'cid-2',
        symbol: 'ETH-PERP',
        side: 'sell',
        type: 'limit',
        price: '3000.0',
        size: '1.0',
        filled_size: '0.0',
        status: 'cancelled',
        reduce_only: false,
        post_only: false,
        created_at: 1699999000000,
        updated_at: 1699999000000,
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.status).toBe('canceled');
    });

    test('normalizeOrder with rejected status', () => {
      const raw: PacificaOrderResponse = {
        order_id: 'order-reject',
        client_order_id: 'cid-3',
        symbol: 'SOL-PERP',
        side: 'buy',
        type: 'market',
        price: '100.0',
        size: '10',
        filled_size: '0',
        status: 'rejected',
        reduce_only: false,
        post_only: false,
        created_at: 1699999000000,
        updated_at: 1699999000000,
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.status).toBe('rejected');
    });

    test('normalizeOrder with unknown status defaults to open', () => {
      const raw: PacificaOrderResponse = {
        order_id: 'order-unknown',
        client_order_id: 'cid-4',
        symbol: 'BTC-PERP',
        side: 'buy',
        type: 'limit',
        price: '50000.0',
        size: '0.1',
        filled_size: '0.0',
        status: 'some_new_status' as string,
        reduce_only: false,
        post_only: false,
        created_at: 1699999000000,
        updated_at: 1699999000000,
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.status).toBe('open');
    });

    test('normalizeOrder without symbol uses exchange symbol conversion', () => {
      const raw: PacificaOrderResponse = {
        order_id: 'order-nosymbol',
        client_order_id: 'cid-5',
        symbol: 'ETH-PERP',
        side: 'buy',
        type: 'limit',
        price: '3000.0',
        size: '1.0',
        filled_size: '0.5',
        avg_fill_price: '2999.5',
        status: 'partially_filled',
        reduce_only: false,
        post_only: false,
        created_at: 1699999000000,
        updated_at: 1699999000000,
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.symbol).toBe('ETH/USDC:USDC');
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(0.5);
      expect(order.averagePrice).toBe(2999.5);
    });
  });

  describe('normalizeTicker without explicit symbol', () => {
    test('uses exchange symbol when no unified symbol provided', () => {
      const ticker = normalizer.normalizeTicker({
        symbol: 'SOL-PERP',
        last_price: '100.0',
        mark_price: '100.1',
        index_price: '100.2',
        bid_price: '99.9',
        ask_price: '100.1',
        high_24h: '110.0',
        low_24h: '90.0',
        volume_24h: '50000.0',
        quote_volume_24h: '5000000.0',
        open_interest: '12345.6',
        funding_rate: '0.0002',
        next_funding_time: 1700000000000,
        timestamp: 1699999000000,
      });
      expect(ticker.symbol).toBe('SOL/USDC:USDC');
    });
  });

  describe('normalizeTrade without explicit symbol', () => {
    test('uses exchange symbol when no unified symbol provided', () => {
      const trade = normalizer.normalizeTrade({
        id: 'trade-xyz',
        symbol: 'ETH-PERP',
        price: '3000.0',
        size: '0.5',
        side: 'sell',
        timestamp: 1699999000000,
      });
      expect(trade.symbol).toBe('ETH/USDC:USDC');
      expect(trade.cost).toBe(1500);
    });
  });

  describe('normalizePosition without explicit symbol', () => {
    test('uses exchange symbol when no unified symbol provided', () => {
      const position = normalizer.normalizePosition({
        symbol: 'SOL-PERP',
        side: 'short',
        size: '100',
        entry_price: '100.0',
        mark_price: '95.0',
        liquidation_price: '120.0',
        unrealized_pnl: '500.0',
        realized_pnl: '0',
        leverage: 5,
        margin_mode: 'isolated',
        margin: '2000.0',
        maintenance_margin: '200.0',
        timestamp: 1699999000000,
      });
      expect(position.symbol).toBe('SOL/USDC:USDC');
      expect(position.marginMode).toBe('isolated');
      expect(position.marginRatio).toBe(0);
    });
  });
});
