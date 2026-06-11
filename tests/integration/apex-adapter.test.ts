/**
 * ApexAdapter integration tests — mocked HTTP fed with byte-faithful fixtures
 * (recon capture 2026-06-11, https://omni.apex.exchange/api/v3).
 *
 * PUBLIC-MARKET-DATA-FIRST scope: trading/auth/account methods are
 * NOT_IMPLEMENTED with has=false — pinned here so the flags stay truthful.
 *
 * Venue footguns pinned:
 * - Symbol formats are STRICT and PER-ENDPOINT: NO-DASH "BTCUSDT" for
 *   /depth /trades /ticker /klines; DASH "BTC-USDT" for /history-funding.
 * - /depth with a dash symbol returns HTTP 200 {a:null,b:null,...} (silent
 *   empty) — the adapter must REJECT that shape, never return an empty book.
 * - Error envelope is {code, msg, timeCost} with HTTP 200.
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

import { ApexAdapter } from '../../src/adapters/apex/ApexAdapter.js';
import { PerpDEXError, NotSupportedError } from '../../src/types/errors.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'apex');

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

const depthFixture = loadFixture('rest_depth_symbol_BTCUSDT_limit_100.json');
const tradesFixture = loadFixture('rest_trades_symbol_BTCUSDT_limit_50.json');
const tickerFixture = loadFixture('rest_ticker_symbol_BTCUSDT.json');
const fundingFixture = loadFixture('rest_history-funding_symbol_BTC-USDT_limit_20.json');
const klinesFixture = loadFixture('rest_klines_symbol_BTCUSDT_interval_1_limit_3.json');
const symbolsFixture = loadFixture('symbols_raw.json');

const SYMBOL = 'BTC/USDT:USDT';

describe('ApexAdapter (mocked HTTP, fixture-fed)', () => {
  let adapter: ApexAdapter;
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ApexAdapter();
    mockGet = (adapter as any).httpClient.get as jest.Mock;
  });

  describe('identity + truthful has-flags (PUBLIC-MARKET-DATA-FIRST)', () => {
    test('id and name', () => {
      expect(adapter.id).toBe('apex');
      expect(adapter.name).toBe('ApeX Omni');
    });

    test('public market data flags are TRUE', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchOHLCV).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchTicker).toBe(true);
    });

    test('ALL trading/auth/account flags are FALSE (not implemented = not claimed)', () => {
      expect(adapter.has.createOrder).toBe(false);
      expect(adapter.has.cancelOrder).toBe(false);
      expect(adapter.has.cancelAllOrders).toBe(false);
      expect(adapter.has.editOrder).toBe(false);
      expect(adapter.has.fetchPositions).toBe(false);
      expect(adapter.has.fetchBalance).toBe(false);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
      expect(adapter.has.fetchOpenOrders).toBe(false);
      expect(adapter.has.fetchOrderHistory).toBe(false);
      expect(adapter.has.fetchMyTrades).toBe(false);
      expect(adapter.has.watchOrders).toBe(false);
      expect(adapter.has.watchPositions).toBe(false);
      expect(adapter.has.watchBalance).toBe(false);
    });

    test('does NOT claim fetchOpenInterest (no dedicated endpoint)', () => {
      expect((adapter.has as any).fetchOpenInterest).not.toBe(true);
    });
  });

  describe('fetchMarkets (/symbols → contractConfig.perpetualContract[])', () => {
    test('returns only perpetual contracts, filtered by enableTrade/isPrelaunch', () => {
      mockGet.mockResolvedValue(symbolsFixture);

      return adapter.fetchMarkets().then((markets) => {
        // Capture: 135 perp entries, 95 tradeable non-prelaunch
        expect(markets).toHaveLength(95);
        const btc = markets.find((m) => m.symbol === 'BTC/USDT:USDT');
        expect(btc).toBeDefined();
        expect(btc!.priceTickSize).toBe(0.1);
        expect(btc!.fundingIntervalHours).toBe(1);
        // Spot/prediction/stock/prelaunch payloads never leak through
        for (const m of markets) {
          expect(m.symbol).toMatch(/^[A-Z0-9]+\/USDT:USDT$/);
          expect(m.active).toBe(true);
        }
      });
    });

    test('caches the heavy 731KB /symbols payload', async () => {
      mockGet.mockResolvedValue(symbolsFixture);
      await adapter.fetchMarkets();
      await adapter.fetchMarkets();
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchOrderBook (/depth — NO-DASH symbol)', () => {
    test('requests with no-dash symbol and normalizes', async () => {
      mockGet.mockResolvedValue(depthFixture);

      const book = await adapter.fetchOrderBook(SYMBOL, { limit: 100 });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('symbol=BTCUSDT'));
      expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining('BTC-USDT'));
      expect(book.exchange).toBe('apex');
      expect(book.bids[0]).toEqual([62037.4, 0.852]);
      expect(book.asks[0]).toEqual([62042.2, 0.887]);
      expect(book.sequenceId).toBe(17060617);
    });

    test('REJECTS the silent-empty null-book response (never an empty book)', async () => {
      mockGet.mockResolvedValue({ data: { a: null, b: null, s: '', u: 0 }, timeCost: 1 });
      await expect(adapter.fetchOrderBook(SYMBOL)).rejects.toThrow();
    });
  });

  describe('fetchTrades (/trades — NO-DASH symbol)', () => {
    test('normalizes the captured trades array', async () => {
      mockGet.mockResolvedValue(tradesFixture);

      const trades = await adapter.fetchTrades(SYMBOL, { limit: 50 });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('symbol=BTCUSDT'));
      expect(trades).toHaveLength(50);
      expect(trades[0]!.id).toBe('2cb892c9-37c5-58c4-a793-ef16ec730fc3');
      expect(trades[0]!.side).toBe('buy');
      expect(trades[0]!.timestamp).toBe(1781147624672);
    });
  });

  describe('fetchTicker (/ticker — data is ARRAY of one)', () => {
    test('unwraps the one-element array', async () => {
      mockGet.mockResolvedValue(tickerFixture);

      const ticker = await adapter.fetchTicker(SYMBOL);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('symbol=BTCUSDT'));
      expect(ticker.last).toBe(62048.7);
      expect(ticker.baseVolume).toBe(14896.419);
    });

    test('throws on an empty ticker array', async () => {
      mockGet.mockResolvedValue({ data: [], timeCost: 1 });
      await expect(adapter.fetchTicker(SYMBOL)).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchFundingRate (current, via /ticker)', () => {
    test('fractional rate + hourly interval + ISO nextFundingTime → ms', async () => {
      mockGet.mockResolvedValue(tickerFixture);

      const fr = await adapter.fetchFundingRate(SYMBOL);

      expect(fr.fundingRate).toBe(-0.00001374);
      expect(fr.fundingIntervalHours).toBe(1);
      expect(fr.nextFundingTimestamp).toBe(Date.parse('2026-06-11T04:00:00Z'));
    });
  });

  describe('fetchFundingRateHistory (/history-funding — DASH symbol)', () => {
    test('requests with DASH symbol (no-dash errors {code:3} live)', async () => {
      mockGet.mockResolvedValue(fundingFixture);

      const history = await adapter.fetchFundingRateHistory(SYMBOL, undefined, 20);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('symbol=BTC-USDT'));
      expect(history).toHaveLength(20);
      expect(history[0]!.fundingRate).toBe(-0.00000632);
      expect(history[0]!.fundingTimestamp).toBe(1781146800000);
      expect(history[0]!.fundingIntervalHours).toBe(1);
    });

    test('filters client-side by since (venue API has no start param)', async () => {
      mockGet.mockResolvedValue(fundingFixture);
      const since = 1781143200000; // second-newest record
      const history = await adapter.fetchFundingRateHistory(SYMBOL, since);
      expect(history.every((f) => f.fundingTimestamp >= since)).toBe(true);
      expect(history).toHaveLength(2);
    });
  });

  describe('fetchOHLCV (/klines — keyed BY SYMBOL, venue interval codes)', () => {
    test('maps 1m → interval=1 and unwraps the record-by-symbol shape', async () => {
      mockGet.mockResolvedValue(klinesFixture);

      const ohlcv = await adapter.fetchOHLCV(SYMBOL, '1m', { limit: 3 });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('interval=1'));
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('symbol=BTCUSDT'));
      expect(ohlcv).toHaveLength(3);
      expect(ohlcv[0]).toEqual([1781147520000, 62032.7, 62032.7, 61984.3, 61984.5, 11]);
    });

    test('maps 1h → 60, 1d → D', async () => {
      mockGet.mockResolvedValue({ data: { BTCUSDT: [] }, timeCost: 1 });
      await adapter.fetchOHLCV(SYMBOL, '1h');
      expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('interval=60'));
      await adapter.fetchOHLCV(SYMBOL, '1d');
      expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('interval=D'));
    });

    test('passes since/until as SECONDS (venue start/end are seconds)', async () => {
      mockGet.mockResolvedValue({ data: { BTCUSDT: [] }, timeCost: 1 });
      await adapter.fetchOHLCV(SYMBOL, '1m', { since: 1781147520000, until: 1781147640000 });
      const path = mockGet.mock.calls[mockGet.mock.calls.length - 1]![0] as string;
      expect(path).toContain('start=1781147520');
      expect(path).toContain('end=1781147640');
      expect(path).not.toContain('start=1781147520000');
    });
  });

  describe('error envelope {code, msg} (HTTP 200)', () => {
    test('throws a mapped PerpDEXError on {code:3} (invalid symbol)', async () => {
      mockGet.mockResolvedValue({ code: 3, msg: 'invalid symbol', timeCost: 1 });
      await expect(adapter.fetchOrderBook(SYMBOL)).rejects.toThrow(PerpDEXError);
    });
  });

  describe('NOT_IMPLEMENTED surface (PUBLIC-MARKET-DATA-FIRST)', () => {
    test('trading methods throw NOT_IMPLEMENTED', async () => {
      await expect(
        adapter.createOrder({ symbol: SYMBOL, type: 'limit', side: 'buy', amount: 1, price: 1 })
      ).rejects.toThrow(/NOT_IMPLEMENTED|not implemented/i);
      await expect(adapter.cancelOrder('1', SYMBOL)).rejects.toThrow(
        /NOT_IMPLEMENTED|not implemented/i
      );
      await expect(adapter.cancelAllOrders(SYMBOL)).rejects.toThrow(
        /NOT_IMPLEMENTED|not implemented/i
      );
    });

    test('account methods throw NOT_IMPLEMENTED', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow(/NOT_IMPLEMENTED|not implemented/i);
      await expect(adapter.fetchBalance()).rejects.toThrow(/NOT_IMPLEMENTED|not implemented/i);
      await expect(adapter.setLeverage(SYMBOL, 5)).rejects.toThrow(
        /NOT_IMPLEMENTED|not implemented/i
      );
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(/NOT_IMPLEMENTED|not implemented/i);
      await expect(adapter.fetchMyTrades()).rejects.toThrow(/NOT_IMPLEMENTED|not implemented/i);
    });

    test('private watch* streams throw NotSupportedError (has=false honored by BaseAdapter)', async () => {
      await expect(adapter.watchOrders().next()).rejects.toThrow(NotSupportedError);
      await expect(adapter.watchPositions().next()).rejects.toThrow(NotSupportedError);
      await expect(adapter.watchBalance().next()).rejects.toThrow(NotSupportedError);
    });
  });

  describe('lifecycle', () => {
    test('initialize marks ready WITHOUT opening a live WS (lazy connect)', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
      await adapter.disconnect();
      expect(adapter.isReady).toBe(false);
    });
  });
});
