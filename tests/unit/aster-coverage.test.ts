/**
 * Aster Adapter Coverage Tests
 *
 * Targets uncovered lines in AsterAdapter, AsterAuth, and error handling paths.
 */

import { AsterAdapter } from '../../src/adapters/aster/AsterAdapter.js';
import { AsterAuth } from '../../src/adapters/aster/AsterAuth.js';
import { PerpDEXError } from '../../src/types/errors.js';
import { createHmacSha256 } from '../../src/utils/crypto.js';

// Mock HTTPClient
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock crypto for AsterAuth
jest.mock('../../src/utils/crypto.js', () => ({
  createHmacSha256: jest.fn().mockResolvedValue('mock-signature'),
}));

describe('AsterAdapter coverage', () => {
  let adapter: AsterAdapter;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AsterAdapter();
    mockHttpClient = (adapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
  });

  // =========================================================================
  // symbolFromExchange — various quote assets
  // =========================================================================

  describe('symbolFromExchange', () => {
    // Access protected method via cast
    const callSymbolFromExchange = (a: AsterAdapter, sym: string): string => {
      return (a as unknown as { symbolFromExchange(s: string): string }).symbolFromExchange(sym);
    };

    test('converts USDT-quoted symbol', () => {
      expect(callSymbolFromExchange(adapter, 'BTCUSDT')).toBe('BTC/USDT:USDT');
    });

    test('converts USDC-quoted symbol', () => {
      expect(callSymbolFromExchange(adapter, 'ETHUSDC')).toBe('ETH/USDC:USDC');
    });

    test('converts BUSD-quoted symbol', () => {
      expect(callSymbolFromExchange(adapter, 'SOLBUSD')).toBe('SOL/BUSD:BUSD');
    });

    test('returns raw symbol when no known quote suffix', () => {
      expect(callSymbolFromExchange(adapter, 'BTCEUR')).toBe('BTCEUR');
    });

    test('handles short symbol matching USDT', () => {
      // "USDT" itself ends with USDT, base would be empty string
      expect(callSymbolFromExchange(adapter, 'USDT')).toBe('/USDT:USDT');
    });
  });

  // =========================================================================
  // handleError — private error handler paths
  // =========================================================================

  describe('handleError', () => {
    // We test handleError indirectly via publicGet failures

    test('passes through PerpDEXError unchanged', async () => {
      const original = new PerpDEXError('Test error', 'TEST', 'aster');
      mockHttpClient.get.mockRejectedValue(original);

      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toBe(original);
    });

    test('extracts error code from message via regex', async () => {
      const err = new Error('API error code: -2010 order rejected');
      mockHttpClient.get.mockRejectedValue(err);

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).exchange).toBe('aster');
      }
    });

    test('extracts error code from JSON-style message', async () => {
      const err = new Error('{"code":-1022,"msg":"Invalid signature"}');
      mockHttpClient.get.mockRejectedValue(err);

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
      }
    });

    test('handles Error without code in message', async () => {
      const err = new Error('Network timeout');
      mockHttpClient.get.mockRejectedValue(err);

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).message).toBe('Network timeout');
        expect((e as PerpDEXError).code).toBe('UNKNOWN');
      }
    });

    test('handles non-Error unknown values', async () => {
      mockHttpClient.get.mockRejectedValue('string error');

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).message).toBe('Unknown error');
        expect((e as PerpDEXError).code).toBe('UNKNOWN');
      }
    });

    test('handles null rejection', async () => {
      mockHttpClient.get.mockRejectedValue(null);

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).message).toBe('Unknown error');
      }
    });

    test('handles undefined rejection', async () => {
      mockHttpClient.get.mockRejectedValue(undefined);

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).message).toBe('Unknown error');
      }
    });

    test('handles numeric rejection', async () => {
      mockHttpClient.get.mockRejectedValue(42);

      try {
        await adapter.fetchTicker('BTC/USDT:USDT');
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).message).toBe('Unknown error');
      }
    });
  });

  // =========================================================================
  // fetchFundingRateHistory — additional edge cases
  // =========================================================================

  describe('fetchFundingRateHistory', () => {
    const mockFundingRate = {
      symbol: 'BTCUSDT',
      markPrice: '40500.00',
      indexPrice: '40490.00',
      estimatedSettlePrice: '40495.00',
      lastFundingRate: '0.0001',
      nextFundingTime: 1700028800000,
      interestRate: '0.0001',
      time: 1700000000000,
    };

    test('calls correct path with since param only', async () => {
      mockHttpClient.get.mockResolvedValue([mockFundingRate]);

      await adapter.fetchFundingRateHistory('BTC/USDT:USDT', 1700000000000);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/fapi/v1/fundingRate?symbol=BTCUSDT&startTime=1700000000000'
      );
    });

    test('calls correct path with limit param only', async () => {
      mockHttpClient.get.mockResolvedValue([mockFundingRate]);

      await adapter.fetchFundingRateHistory('BTC/USDT:USDT', undefined, 50);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/fapi/v1/fundingRate?symbol=BTCUSDT&limit=50'
      );
    });

    test('calls correct path with no optional params', async () => {
      mockHttpClient.get.mockResolvedValue([mockFundingRate]);

      await adapter.fetchFundingRateHistory('ETH/USDT:USDT');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/fapi/v1/fundingRate?symbol=ETHUSDT'
      );
    });

    test('returns normalized funding rates', async () => {
      mockHttpClient.get.mockResolvedValue([mockFundingRate, mockFundingRate]);

      const rates = await adapter.fetchFundingRateHistory('BTC/USDT:USDT');

      expect(rates).toHaveLength(2);
      expect(rates[0].symbol).toBe('BTC/USDT:USDT');
      expect(rates[0].fundingRate).toBe(0.0001);
      expect(rates[0].markPrice).toBe(40500);
    });

    test('throws on non-array response', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'not-array' });

      await expect(
        adapter.fetchFundingRateHistory('BTC/USDT:USDT')
      ).rejects.toThrow('Invalid funding rate history response');
    });

    test('throws on null response', async () => {
      mockHttpClient.get.mockResolvedValue(null);

      await expect(
        adapter.fetchFundingRateHistory('BTC/USDT:USDT')
      ).rejects.toThrow('Invalid funding rate history response');
    });

    test('handles empty array response', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const rates = await adapter.fetchFundingRateHistory('BTC/USDT:USDT');

      expect(rates).toEqual([]);
    });
  });

  // =========================================================================
  // fetchOrderHistory — NOT_IMPLEMENTED
  // =========================================================================

  describe('fetchOrderHistory', () => {
    test('throws PerpDEXError with NOT_IMPLEMENTED', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(PerpDEXError);
      await expect(adapter.fetchOrderHistory()).rejects.toThrow('fetchOrderHistory not yet implemented');
    });

    test('error has correct code and exchange', async () => {
      try {
        await adapter.fetchOrderHistory('BTC/USDT:USDT', 123, 50);
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).code).toBe('NOT_IMPLEMENTED');
        expect((e as PerpDEXError).exchange).toBe('aster');
      }
    });
  });

  // =========================================================================
  // fetchMyTrades — NOT_IMPLEMENTED
  // =========================================================================

  describe('fetchMyTrades', () => {
    test('throws PerpDEXError with NOT_IMPLEMENTED', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow(PerpDEXError);
      await expect(adapter.fetchMyTrades()).rejects.toThrow('fetchMyTrades not yet implemented');
    });

    test('error has correct code and exchange', async () => {
      try {
        await adapter.fetchMyTrades('BTC/USDT:USDT', 123, 50);
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(PerpDEXError);
        expect((e as PerpDEXError).code).toBe('NOT_IMPLEMENTED');
        expect((e as PerpDEXError).exchange).toBe('aster');
      }
    });
  });
});

// =========================================================================
// AsterAuth direct tests
// =========================================================================

describe('AsterAuth', () => {
  const mockCreateHmac = createHmacSha256 as jest.MockedFunction<typeof createHmacSha256>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHeaders', () => {
    test('returns X-MBX-APIKEY header', () => {
      const auth = new AsterAuth({ apiKey: 'my-api-key', apiSecret: 'my-secret' });
      const headers = auth.getHeaders();

      expect(headers).toEqual({ 'X-MBX-APIKEY': 'my-api-key' });
    });

    test('returns correct key for different config', () => {
      const auth = new AsterAuth({ apiKey: 'another-key', apiSecret: 'another-secret' });
      const headers = auth.getHeaders();

      expect(headers['X-MBX-APIKEY']).toBe('another-key');
    });
  });

  describe('hasCredentials', () => {
    test('returns true when both key and secret are provided', () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      expect(auth.hasCredentials()).toBe(true);
    });

    test('returns false when apiKey is empty', () => {
      const auth = new AsterAuth({ apiKey: '', apiSecret: 'secret' });
      expect(auth.hasCredentials()).toBe(false);
    });

    test('returns false when apiSecret is empty', () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: '' });
      expect(auth.hasCredentials()).toBe(false);
    });

    test('returns false when both are empty', () => {
      const auth = new AsterAuth({ apiKey: '', apiSecret: '' });
      expect(auth.hasCredentials()).toBe(false);
    });
  });

  describe('sign', () => {
    test('includes timestamp in params', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      const result = await auth.sign({ method: 'GET', path: '/test' });

      expect(result.params).toBeDefined();
      expect(result.params!.timestamp).toBeDefined();
      expect(typeof result.params!.timestamp).toBe('number');
    });

    test('uses provided timestamp override', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      const result = await auth.sign({
        method: 'GET',
        path: '/test',
        timestamp: 1700000000000,
      });

      expect(result.params!.timestamp).toBe(1700000000000);
    });

    test('includes recvWindow in params', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      const result = await auth.sign({ method: 'GET', path: '/test' });

      expect(result.params!.recvWindow).toBe(5000);
    });

    test('uses custom recvWindow', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret', recvWindow: 10000 });
      const result = await auth.sign({ method: 'GET', path: '/test' });

      expect(result.params!.recvWindow).toBe(10000);
    });

    test('includes signature in params', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      const result = await auth.sign({ method: 'GET', path: '/test' });

      expect(result.params!.signature).toBe('mock-signature');
    });

    test('includes X-MBX-APIKEY in headers', async () => {
      const auth = new AsterAuth({ apiKey: 'my-key', apiSecret: 'secret' });
      const result = await auth.sign({ method: 'GET', path: '/test' });

      expect(result.headers!['X-MBX-APIKEY']).toBe('my-key');
      expect(result.headers!['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    test('passes body params to HMAC query string', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      await auth.sign({
        method: 'POST',
        path: '/test',
        body: { symbol: 'BTCUSDT', side: 'BUY' },
        timestamp: 1700000000000,
      });

      // Verify createHmacSha256 was called with a query string containing body params
      expect(mockCreateHmac).toHaveBeenCalledTimes(1);
      const queryString = mockCreateHmac.mock.calls[0][0];
      expect(queryString).toContain('symbol=BTCUSDT');
      expect(queryString).toContain('side=BUY');
      expect(queryString).toContain('timestamp=1700000000000');
      expect(queryString).toContain('recvWindow=5000');
    });

    test('calls createHmacSha256 with secret', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'my-secret-key' });
      await auth.sign({ method: 'GET', path: '/test' });

      expect(mockCreateHmac).toHaveBeenCalledTimes(1);
      expect(mockCreateHmac.mock.calls[0][1]).toBe('my-secret-key');
    });

    test('merges existing params with signature params', async () => {
      const auth = new AsterAuth({ apiKey: 'key', apiSecret: 'secret' });
      const result = await auth.sign({
        method: 'GET',
        path: '/test',
        params: { existing: 'value' },
      });

      expect(result.params!.existing).toBe('value');
      expect(result.params!.signature).toBe('mock-signature');
      expect(result.params!.timestamp).toBeDefined();
    });
  });
});
