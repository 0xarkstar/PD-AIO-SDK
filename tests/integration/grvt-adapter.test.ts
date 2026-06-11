/**
 * Integration Tests for GRVTAdapter.
 *
 * Injects fake GRVTSDKWrapper + GRVTAuth instances (via the adapter's private
 * fields) and drives the adapter end-to-end against the REAL GRVT contract
 * (unwrapped `{ result }` payloads, cookie-session sub_account_id threading,
 * leg-based order signing). No live network, no ESM module mocking.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GRVTAdapter } from '../../src/adapters/grvt/GRVTAdapter.js';
import type { GRVTMarket, GRVTOrderBook, GRVTTrade } from '../../src/adapters/grvt/types.js';

const SESSION = { cookie: 'c', accountId: 'a', subAccountId: 'sub-1', expiresAt: Date.now() + 60000 };

function makeSdk(): Record<string, jest.Mock> {
  return {
    login: jest.fn(async () => SESSION),
    getInstruments: jest.fn(),
    getOrderBook: jest.fn(),
    getTrades: jest.fn(),
    getTicker: jest.fn(),
    getFunding: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    cancelAllOrders: jest.fn(),
    getOpenOrders: jest.fn(),
    getOrderHistory: jest.fn(),
    getFillHistory: jest.fn(),
    getPositions: jest.fn(),
    getSubAccountSummary: jest.fn(),
    getSubAccountId: jest.fn(() => 'sub-1'),
    clearSession: jest.fn(),
  };
}

function makeAuth(): Record<string, jest.Mock> {
  return {
    verify: jest.fn(async () => true),
    hasCredentials: jest.fn(() => true),
    requireAuth: jest.fn(),
    getAddress: jest.fn(() => '0xabc'),
    getSession: jest.fn(() => SESSION),
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

describe('GRVTAdapter Integration Tests', () => {
  let adapter: GRVTAdapter;
  let sdk: Record<string, jest.Mock>;
  let auth: Record<string, jest.Mock>;

  beforeEach(() => {
    adapter = new GRVTAdapter({ apiKey: 'test', testnet: true });
    sdk = makeSdk();
    auth = makeAuth();
    (adapter as any).sdk = sdk;
    (adapter as any).auth = auth;
    (adapter as any).rateLimiter = { acquire: jest.fn(async () => {}) };
    (adapter as any)._isReady = true;
  });

  describe('Initialization', () => {
    it('reports id/name and feature flags', () => {
      expect(adapter.id).toBe('grvt');
      expect(adapter.name).toBe('GRVT');
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.fetchMarkets).toBe(true);
    });

    it('logs in during initialize and shares the session with auth', async () => {
      (adapter as any)._isReady = false;
      await adapter.initialize();
      expect(sdk.login).toHaveBeenCalled();
      expect(auth.setSession).toHaveBeenCalledWith(SESSION);
    });
  });

  describe('Market Data', () => {
    it('fetches + normalizes markets and caches instrument meta', async () => {
      const markets: GRVTMarket[] = [
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
      sdk.getInstruments.mockResolvedValue(markets as never);

      const result = await adapter.fetchMarkets();
      expect(result).toHaveLength(1);
      expect(result[0]!.symbol).toBe('BTC/USDT:USDT');
      expect((adapter as any).instrumentMeta.get('BTC_USDT_Perp')).toEqual({
        instrumentHash: '0x030501',
        baseDecimals: 9,
      });
    });

    it('fetches + normalizes the order book', async () => {
      const book: GRVTOrderBook = {
        instrument: 'BTC_USDT_Perp',
        event_time: '1234567890000000000', // ns on the wire
        bids: [{ price: '50000', size: '1.5', num_orders: 3 }],
        asks: [{ price: '50010', size: '1.0', num_orders: 2 }],
      };
      sdk.getOrderBook.mockResolvedValue(book as never);

      const result = await adapter.fetchOrderBook('BTC/USDT:USDT');
      expect(sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 50);
      expect(result.bids[0]).toEqual([50000, 1.5]);
      expect(result.asks[0]).toEqual([50010, 1.0]);
    });

    it('fetches + normalizes public trades', async () => {
      const trades: GRVTTrade[] = [
        { event_time: '1234567890001000000', instrument: 'BTC_USDT_Perp', is_taker_buyer: true, size: '0.5', price: '50000', trade_id: 't-1' },
        { event_time: '1234567890002000000', instrument: 'BTC_USDT_Perp', is_taker_buyer: false, size: '1', price: '49995', trade_id: 't-2' },
      ];
      sdk.getTrades.mockResolvedValue(trades as never);

      const result = await adapter.fetchTrades('BTC/USDT:USDT');
      expect(result).toHaveLength(2);
      expect(result[0]!.side).toBe('buy');
      expect(result[1]!.side).toBe('sell');
    });
  });

  describe('Trading', () => {
    beforeEach(() => {
      (adapter as any).instrumentMeta = new Map([
        ['BTC_USDT_Perp', { instrumentHash: '0x030501', baseDecimals: 9 }],
      ]);
    });

    it('signs + creates an order, sending a leg-based wire body', async () => {
      sdk.createOrder.mockResolvedValue({
        order_id: 'o-1',
        legs: [{ instrument: 'BTC_USDT_Perp', size: '0.1', limit_price: '50000', is_buying_asset: true }],
        state: { status: 'OPEN' },
      } as never);

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        postOnly: true,
      });

      expect(auth.signOrder).toHaveBeenCalled();
      const body = sdk.createOrder.mock.calls[0]![0] as Record<string, any>;
      expect(body.sub_account_id).toBe('sub-1');
      expect(body.legs[0].instrument).toBe('BTC_USDT_Perp');
      expect(body.signature.signer).toBe('0xabc');
      expect(order.id).toBe('o-1');
    });

    it('cancels an order with the sub_account_id', async () => {
      sdk.cancelOrder.mockResolvedValue({
        order_id: 'o-1',
        legs: [{ instrument: 'BTC_USDT_Perp', size: '0.1', is_buying_asset: true }],
        state: { status: 'CANCELLED' },
      } as never);

      const order = await adapter.cancelOrder('o-1');
      expect(sdk.cancelOrder).toHaveBeenCalledWith({ sub_account_id: 'sub-1', order_id: 'o-1' });
      expect(order.status).toBe('canceled');
    });

    it('cancels all orders for the sub-account', async () => {
      sdk.cancelAllOrders.mockResolvedValue({ num_cancelled: 2 } as never);
      const result = await adapter.cancelAllOrders();
      expect(result).toEqual([]);
      expect(sdk.cancelAllOrders).toHaveBeenCalledWith('sub-1');
    });
  });

  describe('Account', () => {
    it('fetches positions threaded with sub_account_id', async () => {
      sdk.getPositions.mockResolvedValue([
        { instrument: 'BTC_USDT_Perp', size: '0.1', entry_price: '35000', mark_price: '36000' },
      ] as never);
      const positions = await adapter.fetchPositions();
      expect(sdk.getPositions).toHaveBeenCalledWith('sub-1');
      expect(positions).toHaveLength(1);
      expect(positions[0]!.symbol).toBe('BTC/USDT:USDT');
    });

    it('fetches balances from the sub-account summary', async () => {
      sdk.getSubAccountSummary.mockResolvedValue({ spot_balances: [{ currency: 'USDT', balance: '10000' }] } as never);
      const balances = await adapter.fetchBalance();
      expect(balances).toHaveLength(1);
      expect(balances[0]!.currency).toBe('USDT');
    });
  });

  describe('disconnect', () => {
    it('clears sessions', async () => {
      await adapter.disconnect();
      expect(auth.clearSession).toHaveBeenCalled();
      expect(sdk.clearSession).toHaveBeenCalled();
    });
  });
});
