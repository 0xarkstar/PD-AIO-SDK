/**
 * GRVTAdapter Coverage Tests
 *
 * Exercises the rewritten adapter against the REAL GRVT contract: direct
 * `GRVTSDKWrapper` methods (getInstruments/getTicker/getOrderBook/getTrades/
 * getKline/getFunding/createOrder/...), cookie-session sub_account_id threading,
 * and leg-based order signing (auth.signOrder). Internals are mocked — no network.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTAdapter } from '../../src/adapters/grvt/GRVTAdapter.js';

const INSTRUMENTS = [
  {
    instrument: 'BTC_USDT_Perp',
    instrument_hash: '0x030501',
    base: 'BTC',
    quote: 'USDT',
    base_decimals: 9,
    quote_decimals: 6,
    tick_size: '0.5',
    min_size: '0.001',
    kind: 'PERPETUAL',
    is_active: true,
  },
];

function makeSdk(): Record<string, jest.Mock> {
  return {
    login: jest.fn(async () => ({ cookie: 'c', accountId: 'a', subAccountId: 'sub-1', expiresAt: Date.now() + 60000 })),
    getInstruments: jest.fn(async () => INSTRUMENTS),
    getTicker: jest.fn(async () => ({ instrument: 'BTC_USDT_Perp', last_price: '36000' })),
    getOrderBook: jest.fn(async () => ({ instrument: 'BTC_USDT_Perp', event_time: '1700000000000', bids: [], asks: [] })),
    getTrades: jest.fn(async () => [
      { event_time: '1700000000000', instrument: 'BTC_USDT_Perp', is_taker_buyer: true, size: '1', price: '36000', trade_id: 't-1' },
    ]),
    getKline: jest.fn(async () => [
      { open_time: '1700000000000000000', open: '36000', high: '36500', low: '35800', close: '36200', volume_b: '100' },
    ]),
    getFunding: jest.fn(async () => [{ instrument: 'BTC_USDT_Perp', funding_rate: '0.0001', funding_time: '1700000000000', mark_price: '36000' }]),
    createOrder: jest.fn(async () => ({
      order_id: '123',
      legs: [{ instrument: 'BTC_USDT_Perp', size: '0.1', limit_price: '36000', is_buying_asset: true }],
      state: { status: 'OPEN' },
    })),
    cancelOrder: jest.fn(async () => ({
      order_id: '123',
      legs: [{ instrument: 'BTC_USDT_Perp', size: '0.1', is_buying_asset: true }],
      state: { status: 'CANCELLED' },
    })),
    cancelAllOrders: jest.fn(async () => ({ num_cancelled: 5 })),
    getOpenOrders: jest.fn(async () => [{ order_id: '1', legs: [{ instrument: 'BTC_USDT_Perp', size: '1', is_buying_asset: true }], state: { status: 'OPEN' } }]),
    getOrderHistory: jest.fn(async () => [{ order_id: '1', legs: [{ instrument: 'BTC_USDT_Perp', size: '1', is_buying_asset: true }], state: { status: 'FILLED' } }]),
    getFillHistory: jest.fn(async () => [{ trade_id: 'f-1', order_id: '1', instrument: 'BTC_USDT_Perp', price: '36000', size: '1', is_buyer: true }]),
    getPositions: jest.fn(async () => [{ instrument: 'BTC_USDT_Perp', size: '0.1', entry_price: '35000', mark_price: '36000' }]),
    getSubAccountSummary: jest.fn(async () => ({ spot_balances: [{ currency: 'USDT', balance: '10000' }] })),
    getSubAccountId: jest.fn(() => 'sub-1'),
    clearSession: jest.fn(),
  };
}

function makeAuth(): Record<string, jest.Mock> {
  return {
    hasCredentials: jest.fn(() => true),
    verify: jest.fn(async () => true),
    requireAuth: jest.fn(),
    getAddress: jest.fn(() => '0xabc'),
    getSession: jest.fn(() => ({ cookie: 'c', accountId: 'a', subAccountId: 'sub-1', expiresAt: Date.now() + 60000 })),
    setSession: jest.fn(),
    clearSession: jest.fn(),
    signOrder: jest.fn(async () => ({
      signer: '0xabc',
      r: '0x' + 'a'.repeat(64),
      s: '0x' + 'b'.repeat(64),
      v: 27,
      expiration: '1900000000000000000',
      nonce: 12345,
      chainId: 326,
    })),
  };
}

function createTestAdapter(config: Record<string, unknown> = {}): GRVTAdapter {
  const adapter = new GRVTAdapter({ testnet: true, apiKey: 'k', ...config });
  (adapter as any).sdk = makeSdk();
  (adapter as any).auth = makeAuth();
  (adapter as any).rateLimiter = { acquire: jest.fn(async () => {}) };
  (adapter as any)._isReady = true;
  // Seed instrument meta cache so createOrder does not need a markets fetch.
  (adapter as any).instrumentMeta = new Map([
    ['BTC_USDT_Perp', { instrumentHash: '0x030501', baseDecimals: 9 }],
  ]);
  return adapter;
}

describe('GRVTAdapter Coverage', () => {
  let adapter: GRVTAdapter;

  beforeEach(() => {
    adapter = createTestAdapter();
  });

  describe('fetchMarkets', () => {
    it('fetches + normalizes markets and caches instrument meta', async () => {
      const fresh = new GRVTAdapter({ testnet: true });
      (fresh as any).sdk = makeSdk();
      (fresh as any).auth = makeAuth();
      (fresh as any).rateLimiter = { acquire: jest.fn(async () => {}) };
      const result = await fresh.fetchMarkets();
      expect(result).toHaveLength(1);
      expect((fresh as any).instrumentMeta.get('BTC_USDT_Perp')).toEqual({
        instrumentHash: '0x030501',
        baseDecimals: 9,
      });
    });

    it('filters by active param', async () => {
      const result = await adapter.fetchMarkets({ active: true });
      expect(result).toHaveLength(1);
    });

    it('throws on null result', async () => {
      (adapter as any).sdk.getInstruments.mockResolvedValue(null);
      await expect(adapter.fetchMarkets()).rejects.toThrow('Invalid API response');
    });
  });

  describe('fetchTicker', () => {
    it('fetches + normalizes ticker', async () => {
      const result = await adapter.fetchTicker('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
    });

    it('throws on null result', async () => {
      (adapter as any).sdk.getTicker.mockResolvedValue(null);
      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow('Invalid API response');
    });
  });

  describe('fetchOrderBook', () => {
    it('uses default depth 50', async () => {
      await adapter.fetchOrderBook('BTC/USDT:USDT');
      expect((adapter as any).sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 50);
    });

    it('snaps limit <= 10 to depth 10', async () => {
      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 5 });
      expect((adapter as any).sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 10);
    });

    it('snaps limit > 50 to depth 100', async () => {
      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 75 });
      expect((adapter as any).sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 100);
    });
  });

  describe('fetchTrades', () => {
    it('fetches + normalizes trades', async () => {
      const result = await adapter.fetchTrades('BTC/USDT:USDT');
      expect(result).toHaveLength(1);
      expect(result[0]!.side).toBe('buy');
    });

    it('passes the limit', async () => {
      await adapter.fetchTrades('BTC/USDT:USDT', { limit: 25 });
      expect((adapter as any).sdk.getTrades).toHaveBeenCalledWith('BTC_USDT_Perp', 25);
    });
  });

  describe('fetchOHLCV', () => {
    it('fetches via getKline with the mapped interval', async () => {
      const result = await adapter.fetchOHLCV('BTC/USDT:USDT', '1h');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(6);
      expect((adapter as any).sdk.getKline).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 'CI_1_H', type: 'TRADE' })
      );
    });

    it('returns empty for null result', async () => {
      (adapter as any).sdk.getKline.mockResolvedValue(null);
      expect(await adapter.fetchOHLCV('BTC/USDT:USDT')).toEqual([]);
    });

    it('rejects monthly (1M)', async () => {
      await expect(adapter.fetchOHLCV('BTC/USDT:USDT', '1M')).rejects.toThrow(/does not support monthly/);
    });

    it('converts since/until to nanoseconds', async () => {
      await adapter.fetchOHLCV('BTC/USDT:USDT', '1h', { since: 1700000000000, until: 1700100000000, limit: 100 });
      expect((adapter as any).sdk.getKline).toHaveBeenCalledWith(
        expect.objectContaining({ start_time: '1700000000000000000', end_time: '1700100000000000000', limit: 100 })
      );
    });
  });

  describe('fetchFundingRate', () => {
    it('fetches funding rate', async () => {
      const result = await adapter.fetchFundingRate('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.fundingRate).toBe(0.0001);
    });

    it('throws on empty result', async () => {
      (adapter as any).sdk.getFunding.mockResolvedValue([]);
      await expect(adapter.fetchFundingRate('BTC/USDT:USDT')).rejects.toThrow('No funding data');
    });
  });

  describe('createOrder', () => {
    it('signs (leg-based) and sends the wire body with sub_account_id + signature + client_order_id', async () => {
      const result = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
        postOnly: true,
      });
      expect(result.id).toBe('123');
      expect((adapter as any).auth.signOrder).toHaveBeenCalled();

      const body = ((adapter as any).sdk.createOrder.mock.calls[0][0]) as Record<string, any>;
      expect(body.sub_account_id).toBe('sub-1');
      expect(body.is_market).toBe(false);
      expect(body.post_only).toBe(true);
      expect(body.time_in_force).toBe('GOOD_TILL_TIME');
      expect(body.legs[0]).toMatchObject({ instrument: 'BTC_USDT_Perp', size: '0.1', is_buying_asset: true });
      expect(body.signature).toMatchObject({ v: 27, nonce: 12345, signer: '0xabc' });
      // client_order_id is a random integer in [2^63, 2^64-1]
      const coid = BigInt(body.metadata.client_order_id);
      expect(coid).toBeGreaterThanOrEqual(1n << 63n);
      expect(coid).toBeLessThan(1n << 64n);
    });

    it('builds the maker quote TIF (post_only => GOOD_TILL_TIME sign enum)', async () => {
      await adapter.createOrder({ symbol: 'BTC/USDT:USDT', type: 'limit', side: 'sell', amount: 0.1, price: 36000, postOnly: true });
      const signArg = ((adapter as any).auth.signOrder.mock.calls[0][0]) as Record<string, any>;
      expect(signArg.timeInForce).toBe('GOOD_TILL_TIME');
      expect(signArg.isMarket).toBe(false);
      expect(signArg.postOnly).toBe(true);
      expect(signArg.legs[0]).toMatchObject({ instrumentHash: '0x030501', baseDecimals: 9, isBuyingAsset: false });
    });

    it('throws on null result', async () => {
      (adapter as any).sdk.createOrder.mockResolvedValue(null);
      await expect(
        adapter.createOrder({ symbol: 'BTC/USDT:USDT', type: 'limit', side: 'buy', amount: 0.1, price: 36000 })
      ).rejects.toThrow('Invalid API response');
    });
  });

  describe('cancelOrder / cancelAllOrders', () => {
    it('cancels an order by id with sub_account_id', async () => {
      const result = await adapter.cancelOrder('123');
      expect(result.id).toBe('123');
      expect((adapter as any).sdk.cancelOrder).toHaveBeenCalledWith({ sub_account_id: 'sub-1', order_id: '123' });
    });

    it('cancels all orders for the sub-account', async () => {
      const result = await adapter.cancelAllOrders();
      expect(result).toEqual([]);
      expect((adapter as any).sdk.cancelAllOrders).toHaveBeenCalledWith('sub-1');
    });
  });

  describe('account', () => {
    it('fetches positions and filters by symbol', async () => {
      expect(await adapter.fetchPositions()).toHaveLength(1);
      expect(await adapter.fetchPositions(['BTC/USDT:USDT'])).toHaveLength(1);
      expect(await adapter.fetchPositions(['SOL/USDT:USDT'])).toHaveLength(0);
    });

    it('fetches balances and handles empty spot_balances', async () => {
      expect(await adapter.fetchBalance()).toHaveLength(1);
      (adapter as any).sdk.getSubAccountSummary.mockResolvedValue({ spot_balances: [] });
      expect(await adapter.fetchBalance()).toHaveLength(0);
    });

    it('fetches open orders, history, my trades with sub_account_id', async () => {
      expect(await adapter.fetchOpenOrders('BTC/USDT:USDT')).toHaveLength(1);
      expect((adapter as any).sdk.getOpenOrders).toHaveBeenCalledWith('sub-1', 'BTC_USDT_Perp');
      expect(await adapter.fetchOrderHistory(undefined, undefined, 50)).toHaveLength(1);
      expect((adapter as any).sdk.getOrderHistory).toHaveBeenCalledWith('sub-1', undefined, 50);
      expect(await adapter.fetchMyTrades()).toHaveLength(1);
    });
  });

  describe('helpers', () => {
    it('fetchFundingRateHistory throws NOT_SUPPORTED', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USDT:USDT')).rejects.toThrow('does not provide');
    });

    it('setLeverage is not supported on GRVT (cross-margin)', async () => {
      await expect(adapter.setLeverage('BTC/USDT:USDT', 10)).rejects.toThrow(/not supported/i);
    });

    it('symbol conversions', () => {
      expect(adapter.symbolToExchange('BTC/USDT:USDT')).toBe('BTC_USDT_Perp');
      expect(adapter.symbolFromExchange('BTC_USDT_Perp')).toBe('BTC/USDT:USDT');
    });

    it('disconnect clears auth + sdk sessions', async () => {
      await adapter.disconnect();
      expect((adapter as any).auth.clearSession).toHaveBeenCalled();
      expect((adapter as any).sdk.clearSession).toHaveBeenCalled();
      expect((adapter as any)._isReady).toBe(false);
    });
  });

  describe('initialize', () => {
    it('verifies credentials and logs in', async () => {
      const fresh = createTestAdapter();
      (fresh as any)._isReady = false;
      await fresh.initialize();
      expect((fresh as any).auth.verify).toHaveBeenCalled();
      expect((fresh as any).sdk.login).toHaveBeenCalled();
      expect((fresh as any).auth.setSession).toHaveBeenCalled();
    });

    it('throws on invalid credentials', async () => {
      const fresh = createTestAdapter();
      (fresh as any)._isReady = false;
      (fresh as any).auth.verify.mockResolvedValue(false);
      await expect(fresh.initialize()).rejects.toThrow('verify GRVT credentials');
    });

    it('skips login when no credentials', async () => {
      const fresh = createTestAdapter();
      (fresh as any)._isReady = false;
      (fresh as any).auth.hasCredentials.mockReturnValue(false);
      await fresh.initialize();
      expect((fresh as any).auth.verify).not.toHaveBeenCalled();
      expect((fresh as any).sdk.login).not.toHaveBeenCalled();
    });
  });

  describe('builder code (signing input, not a wire field)', () => {
    it('stores builderCode + defaults builderCodeEnabled to true', () => {
      const a = new GRVTAdapter({ builderCode: '0xbuilder', builderFee: '0.001' });
      expect((a as any).builderCode).toBe('0xbuilder');
      expect((a as any).builderCodeEnabled).toBe(true);
    });

    it('passes builder + builderFee into the signing input when enabled', async () => {
      const a = createTestAdapter({ builderCode: '0xbuilder', builderFee: '0.001' });
      await a.createOrder({ symbol: 'BTC/USDT:USDT', type: 'limit', side: 'buy', amount: 0.1, price: 36000 });
      const signArg = ((a as any).auth.signOrder.mock.calls[0][0]) as Record<string, any>;
      expect(signArg.builder).toBe('0xbuilder');
      expect(signArg.builderFee).toBe('0.001');
    });

    it('omits builder when builderCodeEnabled=false', async () => {
      const a = createTestAdapter({ builderCode: '0xbuilder', builderFee: '0.001', builderCodeEnabled: false });
      await a.createOrder({ symbol: 'BTC/USDT:USDT', type: 'limit', side: 'buy', amount: 0.1, price: 36000 });
      const signArg = ((a as any).auth.signOrder.mock.calls[0][0]) as Record<string, any>;
      expect(signArg.builder).toBeUndefined();
    });

    it('allows a per-order builderCode override', async () => {
      const a = createTestAdapter({ builderCode: '0xadapter', builderFee: '0.001' });
      await a.createOrder({ symbol: 'BTC/USDT:USDT', type: 'limit', side: 'buy', amount: 0.1, price: 36000, builderCode: '0xorder' });
      const signArg = ((a as any).auth.signOrder.mock.calls[0][0]) as Record<string, any>;
      expect(signArg.builder).toBe('0xorder');
    });
  });
});
