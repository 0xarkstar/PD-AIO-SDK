/**
 * StandxAdapter integration tests — mocked HTTP fed with byte-faithful fixtures
 * (recon capture 2026-06-11, https://perps.standx.com).
 *
 * PUBLIC-MARKET-DATA-FIRST scope: trading/auth/account methods are
 * NOT_IMPLEMENTED with has=false — pinned here so the flags stay truthful
 * (StandX private surface needs JWT wallet-signature auth + body signing —
 * a deliberate later phase).
 *
 * Venue footguns pinned:
 * - REST responses are BARE payloads (no {data} envelope); errors are JSON
 *   {code,message} with real HTTP statuses (401/429/…).
 * - query_depth_book has NO limit param — `limit` is served client-side.
 * - query_funding_rates REQUIRES start_time AND end_time (ms) — omitting
 *   either is a 400 ("missing field `start_time`").
 * - kline/history is TradingView-UDF: from/to are SECONDS, columns not rows.
 * - /api/health requires JWT — NEVER used as a keyless ping.
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

import { StandxAdapter } from '../../src/adapters/standx/StandxAdapter.js';
import { PerpDEXError, NotSupportedError } from '../../src/types/errors.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'standx');

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

const depthFixture = loadFixture('rest-query_depth_book_symbol_BTC-USD.json');
const tradesFixture = loadFixture('rest-query_recent_trades_symbol_BTC-USD.json');
const fundingFixture = loadFixture('rest-query_funding_rates.json');
const overviewFixture = loadFixture('rest-query_market_overview.json');
const symbolInfoAllFixture = loadFixture('rest-query_symbol_info_all.json');
const symbolMarketFixture = loadFixture('rest-query_symbol_market_symbol_BTC-USD.json');
const klineFixture = loadFixture('rest-kline_history.json');

const SYMBOL = 'BTC/USD:USD';

describe('StandxAdapter (mocked HTTP, fixture-fed)', () => {
  let adapter: StandxAdapter;
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new StandxAdapter();
    mockGet = (adapter as any).httpClient.get as jest.Mock;
  });

  describe('identity + truthful has-flags (PUBLIC-MARKET-DATA-FIRST)', () => {
    test('id and name', () => {
      expect(adapter.id).toBe('standx');
      expect(adapter.name).toBe('StandX');
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
  });

  describe('fetchMarkets (query_market_overview discovery + query_symbol_info join)', () => {
    beforeEach(() => {
      mockGet.mockImplementation(async (path: string) =>
        path.includes('query_market_overview') ? overviewFixture : symbolInfoAllFixture
      );
    });

    test('discovers ALL live symbols from the overview (never hardcoded — docs are stale at 4)', async () => {
      const markets = await adapter.fetchMarkets();

      // Live venue has 10 symbols (docs reference page lists only 4)
      expect(markets).toHaveLength(10);
      const symbols = markets.map((m) => m.symbol);
      expect(symbols).toContain('BTC/USD:USD');
      expect(symbols).toContain('HYPE/USD:USD');
      expect(symbols).toContain('TSLA/USD:USD');

      const btc = markets.find((m) => m.symbol === 'BTC/USD:USD')!;
      expect(btc.id).toBe('BTC-USD');
      expect(btc.priceTickSize).toBe(0.01);
      expect(btc.makerFee).toBe(0.0001);
      expect(btc.takerFee).toBe(0.0004);
      expect(btc.maxLeverage).toBe(40);
      expect(btc.fundingIntervalHours).toBe(1);
      expect(btc.active).toBe(true);
    });

    test('caches the markets payload (overview + info fetched once)', async () => {
      await adapter.fetchMarkets();
      await adapter.fetchMarkets();
      expect(mockGet).toHaveBeenCalledTimes(2); // 1× overview + 1× symbol_info
    });
  });

  describe('fetchOrderBook (query_depth_book — no venue limit param)', () => {
    test('requests with the dash symbol and returns the SORTED book', async () => {
      mockGet.mockResolvedValue(depthFixture);

      const book = await adapter.fetchOrderBook(SYMBOL);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/query_depth_book?symbol=BTC-USD')
      );
      expect(book.exchange).toBe('standx');
      expect(book.bids[0]).toEqual([62059, 0.2394]);
      expect(book.asks[0]).toEqual([62060, 0.001]);
      expect(book.bids).toHaveLength(130);
      expect(book.timestamp).toBe(depthFixture.time);
    });

    test('serves limit by slicing client-side (param NEVER forwarded)', async () => {
      mockGet.mockResolvedValue(depthFixture);

      const book = await adapter.fetchOrderBook(SYMBOL, { limit: 10 });

      const path = mockGet.mock.calls[0]![0] as string;
      expect(path).not.toContain('limit');
      expect(book.bids).toHaveLength(10);
      expect(book.asks).toHaveLength(10);
      expect(book.bids[0]).toEqual([62059, 0.2394]);
    });
  });

  describe('fetchTrades (query_recent_trades)', () => {
    test('normalizes the captured trades array', async () => {
      mockGet.mockResolvedValue(tradesFixture);

      const trades = await adapter.fetchTrades(SYMBOL);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/query_recent_trades?symbol=BTC-USD')
      );
      expect(trades).toHaveLength(100);
      expect(trades[0]!.side).toBe('buy'); // is_buyer_taker: true
      expect(trades[0]!.price).toBe(62059.72);
      expect(trades[0]!.timestamp).toBe(1781147756451);
    });

    test('serves limit by slicing client-side', async () => {
      mockGet.mockResolvedValue(tradesFixture);
      const trades = await adapter.fetchTrades(SYMBOL, { limit: 5 });
      expect(trades).toHaveLength(5);
    });
  });

  describe('fetchTicker (query_symbol_market)', () => {
    test('normalizes the captured symbol_market payload', async () => {
      mockGet.mockResolvedValue(symbolMarketFixture);

      const ticker = await adapter.fetchTicker(SYMBOL);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/query_symbol_market?symbol=BTC-USD')
      );
      expect(ticker.last).toBe(62046.91);
      expect(ticker.bid).toBe(62059.74);
      expect(ticker.ask).toBe(62059.75);
      expect(ticker.baseVolume).toBeCloseTo(10530.0493, 4);
    });
  });

  describe('fetchFundingRate (current, via query_symbol_market)', () => {
    test('fractional rate + hourly interval + ISO next_funding_time → ms', async () => {
      mockGet.mockResolvedValue(symbolMarketFixture);

      const fr = await adapter.fetchFundingRate(SYMBOL);

      expect(fr.fundingRate).toBe(0.0000125);
      expect(fr.fundingIntervalHours).toBe(1);
      expect(fr.nextFundingTimestamp).toBe(Date.parse('2026-06-11T04:00:00Z'));
    });
  });

  describe('fetchFundingRateHistory (query_funding_rates — start_time/end_time REQUIRED)', () => {
    test('always sends BOTH start_time and end_time in ms (omitting either is a 400)', async () => {
      mockGet.mockResolvedValue(fundingFixture);

      const history = await adapter.fetchFundingRateHistory(SYMBOL);

      const path = mockGet.mock.calls[0]![0] as string;
      expect(path).toContain('/api/query_funding_rates?symbol=BTC-USD');
      expect(path).toMatch(/start_time=\d{13}/);
      expect(path).toMatch(/end_time=\d{13}/);
      expect(history).toHaveLength(24);
      expect(history[0]!.fundingRate).toBe(0.0000125);
      expect(history[0]!.fundingTimestamp).toBe(1781064000000);
      expect(history[0]!.fundingIntervalHours).toBe(1);
    });

    test('uses since as start_time and filters/limits client-side', async () => {
      mockGet.mockResolvedValue(fundingFixture);
      const since = 1781143200000; // second-to-last captured settlement

      const history = await adapter.fetchFundingRateHistory(SYMBOL, since, 1);

      const path = mockGet.mock.calls[0]![0] as string;
      expect(path).toContain(`start_time=${since}`);
      expect(history).toHaveLength(1);
      expect(history.every((f) => f.fundingTimestamp >= since)).toBe(true);
    });
  });

  describe('fetchOHLCV (kline/history — TradingView-UDF, from/to in SECONDS)', () => {
    test('maps 1m → resolution=1 and zips the column arrays', async () => {
      mockGet.mockResolvedValue(klineFixture);

      const ohlcv = await adapter.fetchOHLCV(SYMBOL, '1m', {
        since: 1781147520000,
        until: 1781147790000,
      });

      const path = mockGet.mock.calls[0]![0] as string;
      expect(path).toContain('/api/kline/history?symbol=BTC-USD');
      expect(path).toContain('resolution=1');
      // from/to are SECONDS (10 digits), never ms
      expect(path).toContain('from=1781147520');
      expect(path).toContain('to=1781147790');
      expect(path).not.toContain('from=1781147520000');

      expect(ohlcv).toHaveLength(5);
      expect(ohlcv[0]).toEqual([
        1781147520000, 62042.02, 62047.99, 62001.01, 62004.04, 5.901799999999999,
      ]);
    });

    test('maps 1h → 60 and 1d → 1D', async () => {
      mockGet.mockResolvedValue({ s: 'no_data' });
      await adapter.fetchOHLCV(SYMBOL, '1h');
      expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('resolution=60'));
      await adapter.fetchOHLCV(SYMBOL, '1d');
      expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('resolution=1D'));
    });

    test('rejects unsupported timeframes', async () => {
      await expect(adapter.fetchOHLCV(SYMBOL, '4h')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('error surface', () => {
    test('wraps HTTP-layer failures in PerpDEXError tagged standx', async () => {
      mockGet.mockRejectedValue(new Error('HTTP 401: {"code":401,"message":"missing jwt"}'));
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
