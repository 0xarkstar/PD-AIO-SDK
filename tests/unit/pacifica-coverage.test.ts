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
  PacificaMarket,
  PacificaOrderResponse,
  PacificaTicker,
  PacificaTradeResponse,
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
        body: { symbol: 'BTC' },
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
      const market = normalizer.normalizeMarket({
        symbol: 'BTC',
        tick_size: '1',
        lot_size: '1',
        min_tick: '0',
        max_tick: '1000000',
        max_leverage: 10,
        isolated_only: false,
        min_order_size: '10',
        max_order_size: '1000000',
        funding_rate: '0.0001',
        next_funding_rate: '0.00005',
        created_at: 1748881333944,
      });
      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });

    test('value with trailing zeros strips them', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC',
        tick_size: '0.10',
        lot_size: '0.0100',
        min_tick: '0',
        max_tick: '1000000',
        max_leverage: 10,
        isolated_only: false,
        min_order_size: '10',
        max_order_size: '1000000',
        funding_rate: '0.0001',
        next_funding_rate: '0.00005',
        created_at: 1748881333944,
      });
      expect(market.pricePrecision).toBe(1);
      expect(market.amountPrecision).toBe(2);
    });

    test('value with all trailing zeros after dot returns 0', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC',
        tick_size: '1.000',
        lot_size: '1.0',
        min_tick: '0',
        max_tick: '1000000',
        max_leverage: 10,
        isolated_only: false,
        min_order_size: '10',
        max_order_size: '1000000',
        funding_rate: '0.0001',
        next_funding_rate: '0.00005',
        created_at: 1748881333944,
      });
      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });

    test('empty string returns 0', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC',
        tick_size: '',
        lot_size: '',
        min_tick: '0',
        max_tick: '1000000',
        max_leverage: 10,
        isolated_only: false,
        min_order_size: '10',
        max_order_size: '1000000',
        funding_rate: '0.0001',
        next_funding_rate: '0.00005',
        created_at: 1748881333944,
      });
      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });
  });

  describe('normalizeOrder edge cases', () => {
    const baseOrder: PacificaOrderResponse = {
      order_id: 'order-no-fill',
      client_order_id: 'cid-1',
      symbol: 'BTC',
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

    test('normalizeOrder without avg_fill_price sets averagePrice to undefined', () => {
      const order = normalizer.normalizeOrder(baseOrder);
      expect(order.averagePrice).toBeUndefined();
    });

    test('normalizeOrder with cancelled (double-l) status maps to canceled', () => {
      const raw: PacificaOrderResponse = {
        ...baseOrder,
        order_id: 'order-cancel',
        symbol: 'ETH',
        side: 'sell',
        price: '3000.0',
        size: '1.0',
        status: 'cancelled',
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.status).toBe('canceled');
    });

    test('normalizeOrder with rejected status', () => {
      const raw: PacificaOrderResponse = {
        ...baseOrder,
        order_id: 'order-reject',
        symbol: 'SOL',
        type: 'market',
        price: '100.0',
        size: '10',
        filled_size: '0',
        status: 'rejected',
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.status).toBe('rejected');
    });

    test('normalizeOrder with unknown status defaults to open', () => {
      const raw: PacificaOrderResponse = {
        ...baseOrder,
        order_id: 'order-unknown',
        status: 'some_new_status' as string,
      };
      const order = normalizer.normalizeOrder(raw);
      expect(order.status).toBe('open');
    });

    test('normalizeOrder without symbol uses exchange symbol conversion', () => {
      const raw: PacificaOrderResponse = {
        ...baseOrder,
        order_id: 'order-nosymbol',
        symbol: 'ETH',
        price: '3000.0',
        size: '1.0',
        filled_size: '0.5',
        avg_fill_price: '2999.5',
        status: 'partially_filled',
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
        symbol: 'SOL',
        mark: '100.1',
        mid: '100.0',
        oracle: '100.2',
        funding: '0.0002',
        next_funding: '0.0001',
        open_interest: '12345.6',
        volume_24h: '5000000.0',
        yesterday_price: '95.0',
        timestamp: 1699999000000,
      });
      expect(ticker.symbol).toBe('SOL/USDC:USDC');
    });
  });

  describe('normalizeTrade without explicit symbol', () => {
    test('uses empty string when no unified symbol provided', () => {
      const trade = normalizer.normalizeTrade({
        event_type: 'fulfill_taker',
        price: '3000.0',
        amount: '0.5',
        side: 'open_short',
        cause: 'normal',
        created_at: 1699999000000,
      });
      expect(trade.symbol).toBe('');
      expect(trade.cost).toBe(1500);
      expect(trade.side).toBe('sell');
    });
  });

  describe('normalizePosition without explicit symbol', () => {
    test('uses exchange symbol when no unified symbol provided', () => {
      const position = normalizer.normalizePosition({
        symbol: 'SOL',
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
      // marginRatio = maintenanceMargin / (size * markPrice) = 200 / (100 * 95)
      expect(position.marginRatio).toBeCloseTo(200 / (100 * 95), 6);
    });
  });
});
