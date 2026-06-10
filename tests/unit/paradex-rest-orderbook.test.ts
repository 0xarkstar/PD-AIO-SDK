/**
 * Paradex REST order book tests — fixture-backed against the LIVE response
 * (capture 2026-06-11, GET https://api.prod.paradex.trade/v1/orderbook/BTC-USD-PERP?depth=15).
 *
 * The real REST shape is {market, seq_no, last_updated_at, bids, asks} with
 * [price, size] string tuples — NO `timestamp`, NO `sequence` field. The old
 * schema required timestamp/sequence and threw ZodError on every live call.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { ParadexOrderBookSchema } from '../../src/adapters/paradex/types.js';
import { ParadexNormalizer } from '../../src/adapters/paradex/ParadexNormalizer.js';
import { ParadexAdapter } from '../../src/adapters/paradex/ParadexAdapter.js';

// Mock ParadexHTTPClient (house pattern, cf. paradex-adapter.test.ts)
jest.mock('../../src/adapters/paradex/ParadexHTTPClient.js', () => ({
  ParadexHTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('../../src/adapters/paradex/ParadexAuth.js', () => ({
  ParadexAuth: jest.fn().mockImplementation(() => ({
    hasCredentials: jest.fn().mockReturnValue(false),
    clearJWTToken: jest.fn(),
    getStarkPublicKey: jest.fn(),
  })),
}));

jest.mock('../../src/adapters/paradex/ParadexParaclearWrapper.js', () => ({
  ParadexParaclearWrapper: jest.fn().mockImplementation(() => ({})),
}));

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'paradex');
const restOrderBook = JSON.parse(
  readFileSync(join(FIXTURE_DIR, 'rest_orderbook_btc_depth15.json'), 'utf8')
);

describe('Paradex REST order book (live shape)', () => {
  describe('ParadexOrderBookSchema', () => {
    it('accepts the real REST response (the old schema threw ZodError)', () => {
      expect(() => ParadexOrderBookSchema.parse(restOrderBook)).not.toThrow();

      const parsed = ParadexOrderBookSchema.parse(restOrderBook);
      expect(parsed.market).toBe('BTC-USD-PERP');
      expect(parsed.seq_no).toBe(7510710621);
      expect(parsed.last_updated_at).toBe(1781122591836);
    });
  });

  describe('normalizeOrderBook', () => {
    it('maps last_updated_at -> timestamp and seq_no -> sequenceId', () => {
      const normalizer = new ParadexNormalizer();
      const book = normalizer.normalizeOrderBook(restOrderBook);

      expect(book.symbol).toBe('BTC/USD:USD');
      expect(book.exchange).toBe('paradex');
      expect(book.timestamp).toBe(1781122591836);
      expect(book.sequenceId).toBe(7510710621);

      // [price, size] string tuples -> floats
      expect(book.bids).toHaveLength(15);
      expect(book.asks).toHaveLength(15);
      expect(book.bids[0]).toEqual([61767.2, 0.01577]);
      expect(book.asks[0]).toEqual([61782.3, 0.02265]);

      // bids DESC, asks ASC (live REST ordering)
      for (let i = 1; i < book.bids.length; i++) {
        expect(book.bids[i]![0]).toBeLessThan(book.bids[i - 1]![0]);
      }
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }
    });
  });

  describe('adapter wiring', () => {
    it('_fetchOrderBook hits GET /orderbook/{market}?depth=15 and normalizes', async () => {
      const adapter = new ParadexAdapter();
      const mockClient = (adapter as any).client;
      mockClient.get.mockResolvedValue(restOrderBook);

      const book = await adapter._fetchOrderBook('BTC/USD:USD', { limit: 15 });

      expect(mockClient.get).toHaveBeenCalledWith('/orderbook/BTC-USD-PERP?depth=15');
      expect(book.symbol).toBe('BTC/USD:USD');
      expect(book.sequenceId).toBe(7510710621);
      expect(book.timestamp).toBe(1781122591836);
      expect(book.bids[0]).toEqual([61767.2, 0.01577]);
      expect(book.asks[0]).toEqual([61782.3, 0.02265]);
    });
  });
});
