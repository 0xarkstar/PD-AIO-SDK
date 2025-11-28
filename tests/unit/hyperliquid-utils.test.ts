/**
 * Hyperliquid Utilities Unit Tests
 */

import {
  normalizeOrder,
  normalizePosition,
  normalizeMarket,
  normalizeOrderBook,
  normalizeTrade,
  convertOrderRequest,
  mapError,
} from '../../src/adapters/hyperliquid/utils.js';
import {
  InsufficientMarginError,
  InvalidOrderError,
  InvalidSignatureError,
  RateLimitError,
} from '../../src/types/errors.js';
import type {
  HyperliquidOpenOrder,
  HyperliquidPosition,
  HyperliquidAsset,
  HyperliquidL2Book,
  HyperliquidWsTrade,
} from '../../src/adapters/hyperliquid/types.js';
import type { OrderRequest } from '../../src/types/index.js';

describe('Symbol Conversion', () => {
  test('converts order correctly', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      postOnly: true,
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');

    expect(converted).toEqual({
      coin: 'BTC-PERP',
      is_buy: true,
      sz: 0.1,
      limit_px: 50000,
      order_type: { limit: { tif: 'Alo' } }, // Post-only = Alo
      reduce_only: false,
      cloid: undefined,
    });
  });

  test('converts market order', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'market',
      side: 'sell',
      amount: 0.1,
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');

    expect(converted.order_type).toEqual({ market: {} });
    expect(converted.is_buy).toBe(false);
  });

  test('converts IOC order', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      timeInForce: 'IOC',
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');

    expect(converted.order_type).toEqual({ limit: { tif: 'Ioc' } });
  });
});

describe('Order Normalization', () => {
  test('normalizes open order', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.08',
      oid: 12345,
      timestamp: 1234567890000,
      origSz: '0.1',
      cloid: 'test-123',
    };

    const normalized = normalizeOrder(hlOrder, 'BTC-PERP');

    expect(normalized).toMatchObject({
      id: '12345',
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      status: 'open',
      filled: 0.02,
      remaining: 0.08,
      clientOrderId: 'test-123',
      timestamp: 1234567890000,
    });
  });

  test('normalizes sell order', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'ETH-PERP',
      side: 'A',
      limitPx: '3000.0',
      sz: '1.0',
      oid: 67890,
      timestamp: 1234567890000,
      origSz: '1.0',
    };

    const normalized = normalizeOrder(hlOrder, 'ETH-PERP');

    expect(normalized.side).toBe('sell');
    expect(normalized.symbol).toBe('ETH/USDT:USDT');
  });
});

describe('Position Normalization', () => {
  test('normalizes long position', () => {
    const hlPosition: HyperliquidPosition = {
      position: {
        coin: 'BTC-PERP',
        entryPx: '50000',
        leverage: {
          type: 'cross',
          value: 10,
        },
        liquidationPx: '45000',
        marginUsed: '5000',
        positionValue: '50000',
        returnOnEquity: '0.1',
        szi: '1.0',
        unrealizedPnl: '1000',
      },
      type: 'oneWay',
    };

    const normalized = normalizePosition(hlPosition);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      side: 'long',
      size: 1.0,
      entryPrice: 50000,
      liquidationPrice: 45000,
      unrealizedPnl: 1000,
      leverage: 10,
      marginMode: 'cross',
      margin: 5000,
    });
  });

  test('normalizes short position', () => {
    const hlPosition: HyperliquidPosition = {
      position: {
        coin: 'ETH-PERP',
        entryPx: '3000',
        leverage: {
          type: 'isolated',
          value: 5,
        },
        liquidationPx: '3500',
        marginUsed: '1500',
        positionValue: '15000',
        returnOnEquity: '-0.05',
        szi: '-5.0',
        unrealizedPnl: '-250',
      },
      type: 'oneWay',
    };

    const normalized = normalizePosition(hlPosition);

    expect(normalized.side).toBe('short');
    expect(normalized.size).toBe(5.0);
    expect(normalized.marginMode).toBe('isolated');
  });
});

describe('Market Normalization', () => {
  test('normalizes market asset', () => {
    const hlAsset: HyperliquidAsset = {
      name: 'BTC-PERP',
      szDecimals: 3,
      maxLeverage: 50,
      onlyIsolated: false,
    };

    const normalized = normalizeMarket(hlAsset, 0);

    expect(normalized).toMatchObject({
      id: '0',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      amountPrecision: 3,
      maxLeverage: 50,
      fundingIntervalHours: 8,
    });
  });
});

describe('OrderBook Normalization', () => {
  test('normalizes order book', () => {
    const hlBook: HyperliquidL2Book = {
      coin: 'BTC-PERP',
      levels: [
        [
          ['49999.5', '1.5'],
          ['49999.0', '2.0'],
        ],
        [
          ['50000.5', '1.2'],
          ['50001.0', '1.8'],
        ],
      ],
      time: 1234567890000,
    };

    const normalized = normalizeOrderBook(hlBook);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      timestamp: 1234567890000,
      exchange: 'hyperliquid',
    });

    expect(normalized.bids).toHaveLength(2);
    expect(normalized.asks).toHaveLength(2);
    expect(normalized.bids[0]).toEqual([49999.5, 1.5]);
    expect(normalized.asks[0]).toEqual([50000.5, 1.2]);
  });
});

describe('Trade Normalization', () => {
  test('normalizes trade', () => {
    const hlTrade: HyperliquidWsTrade = {
      coin: 'BTC-PERP',
      side: 'B',
      px: '50000.0',
      sz: '0.5',
      time: 1234567890000,
      hash: '0xabc123',
    };

    const normalized = normalizeTrade(hlTrade);

    expect(normalized).toMatchObject({
      id: '0xabc123',
      symbol: 'BTC/USDT:USDT',
      side: 'buy',
      price: 50000,
      amount: 0.5,
      cost: 25000,
      timestamp: 1234567890000,
    });
  });
});

describe('Error Mapping', () => {
  test('maps insufficient margin error', () => {
    const error = new Error('insufficient margin for trade');
    const mapped = mapError(error);

    expect(mapped).toBeInstanceOf(InsufficientMarginError);
    expect(mapped.code).toBe('INSUFFICIENT_MARGIN');
    expect(mapped.exchange).toBe('hyperliquid');
  });

  test('maps invalid signature error', () => {
    const error = new Error('invalid signature provided');
    const mapped = mapError(error);

    expect(mapped).toBeInstanceOf(InvalidSignatureError);
  });

  test('maps order would match error', () => {
    const error = new Error('order would immediately match');
    const mapped = mapError(error);

    expect(mapped).toBeInstanceOf(InvalidOrderError);
  });

  test('maps HTTP 429 to rate limit error', () => {
    const error = new Error('HTTP 429: Too Many Requests');
    const mapped = mapError(error);

    expect(mapped).toBeInstanceOf(RateLimitError);
  });

  test('preserves original error', () => {
    const originalError = new Error('Test error');
    const mapped = mapError(originalError);

    expect(mapped.originalError).toBe(originalError);
  });
});
