/**
 * Hyperliquid Utilities Unit Tests
 */

import { HyperliquidNormalizer } from '../../src/adapters/hyperliquid/HyperliquidNormalizer.js';
import { convertOrderRequest, mapError } from '../../src/adapters/hyperliquid/utils.js';
import {
  InsufficientMarginError,
  InvalidOrderError,
  InvalidSignatureError,
  RateLimitError,
  OrderNotFoundError,
  ExchangeUnavailableError,
  PerpDEXError,
} from '../../src/types/errors.js';
import type {
  HyperliquidOpenOrder,
  HyperliquidPosition,
  HyperliquidAsset,
  HyperliquidL2Book,
  HyperliquidWsTrade,
  HyperliquidFill,
  HyperliquidUserFill,
  HyperliquidHistoricalOrder,
  HyperliquidFundingRate,
  HyperliquidUserState,
} from '../../src/adapters/hyperliquid/types.js';
import type { OrderRequest } from '../../src/types/index.js';

// Create normalizer instance for all tests
const normalizer = new HyperliquidNormalizer();

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

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');

    expect(normalized).toMatchObject({
      id: '12345',
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      status: 'open',
      remaining: 0.08,
      clientOrderId: 'test-123',
      timestamp: 1234567890000,
    });
    expect(normalized.filled).toBeCloseTo(0.02, 10);
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

    const normalized = normalizer.normalizeOrder(hlOrder, 'ETH-PERP');

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

    const normalized = normalizer.normalizePosition(hlPosition);

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

    const normalized = normalizer.normalizePosition(hlPosition);

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

    const normalized = normalizer.normalizeMarket(hlAsset, 0);

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

    const normalized = normalizer.normalizeOrderBook(hlBook);

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

    const normalized = normalizer.normalizeTrade(hlTrade);

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

// ============================================================================
// COMPREHENSIVE EDGE CASES - Week 2
// ============================================================================

describe('Symbol Conversion - Edge Cases', () => {
  test('handles reduce-only order', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      reduceOnly: true,
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');
    expect(converted.reduce_only).toBe(true);
  });

  test('handles client order ID', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      clientOrderId: 'my-order-123',
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');
    expect(converted.cloid).toBe('my-order-123');
  });

  test('handles GTC time in force', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      timeInForce: 'GTC',
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');
    expect(converted.order_type).toEqual({ limit: { tif: 'Gtc' } });
  });

  test('handles very small amounts', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.001,
      price: 50000,
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');
    expect(converted.sz).toBe(0.001);
  });

  test('handles very large prices', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 1000000,
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');
    expect(converted.limit_px).toBe(1000000);
  });

  test('handles market order without price', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'market',
      side: 'buy',
      amount: 0.1,
    };

    const converted = convertOrderRequest(request, 'BTC-PERP');
    expect(converted.order_type).toEqual({ market: {} });
    // limit_px is set to 0 for market orders per the type definition
    expect(converted.limit_px).toBe(0);
  });
});

describe('Order Normalization - Edge Cases', () => {
  test('handles order without client order ID', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.1',
      oid: 12345,
      timestamp: 1234567890000,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.clientOrderId).toBeUndefined();
  });

  test('handles fully filled order', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.0',
      oid: 12345,
      timestamp: 1234567890000,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.remaining).toBe(0);
    expect(normalized.filled).toBeCloseTo(0.1, 10);
  });

  test('handles partially filled order', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.05',
      oid: 12345,
      timestamp: 1234567890000,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.remaining).toBe(0.05);
    expect(normalized.filled).toBeCloseTo(0.05, 10);
  });

  test('handles very small remaining amounts', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.001',
      oid: 12345,
      timestamp: 1234567890000,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.remaining).toBe(0.001);
    expect(normalized.filled).toBeCloseTo(0.099, 10);
  });

  test('handles order with string numeric ID', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.1',
      oid: 999999999,
      timestamp: 1234567890000,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.id).toBe('999999999');
  });

  test('handles order with decimal prices', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.12345',
      sz: '0.1',
      oid: 12345,
      timestamp: 1234567890000,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.price).toBeCloseTo(50000.12345, 5);
  });

  test('handles order with zero timestamp', () => {
    const hlOrder: HyperliquidOpenOrder = {
      coin: 'BTC-PERP',
      side: 'B',
      limitPx: '50000.0',
      sz: '0.1',
      oid: 12345,
      timestamp: 0,
      origSz: '0.1',
    };

    const normalized = normalizer.normalizeOrder(hlOrder, 'BTC-PERP');
    expect(normalized.timestamp).toBe(0);
  });
});

describe('Position Normalization - Edge Cases', () => {
  test('handles position with zero size', () => {
    const hlPosition: HyperliquidPosition = {
      position: {
        coin: 'BTC-PERP',
        entryPx: '50000',
        leverage: {
          type: 'cross',
          value: 10,
        },
        liquidationPx: null,
        marginUsed: '0',
        positionValue: '0',
        returnOnEquity: '0',
        szi: '0',
        unrealizedPnl: '0',
      },
      type: 'oneWay',
    };

    const normalized = normalizer.normalizePosition(hlPosition);
    expect(normalized.size).toBe(0);
    expect(normalized.unrealizedPnl).toBe(0);
  });

  test('handles position without liquidation price', () => {
    const hlPosition: HyperliquidPosition = {
      position: {
        coin: 'BTC-PERP',
        entryPx: '50000',
        leverage: {
          type: 'cross',
          value: 10,
        },
        liquidationPx: null,
        marginUsed: '5000',
        positionValue: '50000',
        returnOnEquity: '0.1',
        szi: '1.0',
        unrealizedPnl: '1000',
      },
      type: 'oneWay',
    };

    const normalized = normalizer.normalizePosition(hlPosition);
    // Implementation sets liquidationPrice to 0 when null
    expect(normalized.liquidationPrice).toBe(0);
  });

  test('handles position with negative PnL', () => {
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
        returnOnEquity: '-0.5',
        szi: '1.0',
        unrealizedPnl: '-2500',
      },
      type: 'oneWay',
    };

    const normalized = normalizer.normalizePosition(hlPosition);
    expect(normalized.unrealizedPnl).toBe(-2500);
  });

  test('handles position with very high leverage', () => {
    const hlPosition: HyperliquidPosition = {
      position: {
        coin: 'BTC-PERP',
        entryPx: '50000',
        leverage: {
          type: 'cross',
          value: 50,
        },
        liquidationPx: '49000',
        marginUsed: '1000',
        positionValue: '50000',
        returnOnEquity: '0.1',
        szi: '1.0',
        unrealizedPnl: '100',
      },
      type: 'oneWay',
    };

    const normalized = normalizer.normalizePosition(hlPosition);
    expect(normalized.leverage).toBe(50);
  });

  test('handles position with decimal size', () => {
    const hlPosition: HyperliquidPosition = {
      position: {
        coin: 'ETH-PERP',
        entryPx: '3000',
        leverage: {
          type: 'isolated',
          value: 5,
        },
        liquidationPx: '2500',
        marginUsed: '1500',
        positionValue: '7500',
        returnOnEquity: '0',
        szi: '2.5',
        unrealizedPnl: '0',
      },
      type: 'oneWay',
    };

    const normalized = normalizer.normalizePosition(hlPosition);
    expect(normalized.size).toBe(2.5);
    expect(normalized.side).toBe('long');
  });

  test('handles short position with decimal size', () => {
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
        positionValue: '7500',
        returnOnEquity: '0',
        szi: '-2.5',
        unrealizedPnl: '0',
      },
      type: 'oneWay',
    };

    const normalized = normalizer.normalizePosition(hlPosition);
    expect(normalized.size).toBe(2.5);
    expect(normalized.side).toBe('short');
  });
});

describe('Market Normalization - Edge Cases', () => {
  test('handles market with only isolated margin', () => {
    const hlAsset: HyperliquidAsset = {
      name: 'BTC-PERP',
      szDecimals: 3,
      maxLeverage: 50,
      onlyIsolated: true,
    };

    const normalized = normalizer.normalizeMarket(hlAsset, 0);
    expect(normalized.info?.onlyIsolated).toBe(true);
  });

  test('handles market with high precision', () => {
    const hlAsset: HyperliquidAsset = {
      name: 'BTC-PERP',
      szDecimals: 8,
      maxLeverage: 50,
      onlyIsolated: false,
    };

    const normalized = normalizer.normalizeMarket(hlAsset, 0);
    expect(normalized.amountPrecision).toBe(8);
  });

  test('handles market with low leverage', () => {
    const hlAsset: HyperliquidAsset = {
      name: 'BTC-PERP',
      szDecimals: 3,
      maxLeverage: 5,
      onlyIsolated: false,
    };

    const normalized = normalizer.normalizeMarket(hlAsset, 0);
    expect(normalized.maxLeverage).toBe(5);
  });

  test('handles different market index', () => {
    const hlAsset: HyperliquidAsset = {
      name: 'ETH-PERP',
      szDecimals: 4,
      maxLeverage: 30,
      onlyIsolated: false,
    };

    const normalized = normalizer.normalizeMarket(hlAsset, 42);
    expect(normalized.id).toBe('42');
    expect(normalized.symbol).toBe('ETH/USDT:USDT');
  });

  test('handles exotic asset name', () => {
    const hlAsset: HyperliquidAsset = {
      name: 'DOGE-PERP',
      szDecimals: 0,
      maxLeverage: 20,
      onlyIsolated: false,
    };

    const normalized = normalizer.normalizeMarket(hlAsset, 5);
    expect(normalized.symbol).toBe('DOGE/USDT:USDT');
    expect(normalized.base).toBe('DOGE');
  });
});

describe('OrderBook Normalization - Edge Cases', () => {
  test('handles order book with empty bids', () => {
    const hlBook: HyperliquidL2Book = {
      coin: 'BTC-PERP',
      levels: [
        [],
        [
          ['50000.5', '1.2'],
          ['50001.0', '1.8'],
        ],
      ],
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeOrderBook(hlBook);
    expect(normalized.bids).toHaveLength(0);
    expect(normalized.asks).toHaveLength(2);
  });

  test('handles order book with empty asks', () => {
    const hlBook: HyperliquidL2Book = {
      coin: 'BTC-PERP',
      levels: [
        [
          ['49999.5', '1.5'],
          ['49999.0', '2.0'],
        ],
        [],
      ],
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeOrderBook(hlBook);
    expect(normalized.bids).toHaveLength(2);
    expect(normalized.asks).toHaveLength(0);
  });

  test('handles completely empty order book', () => {
    const hlBook: HyperliquidL2Book = {
      coin: 'BTC-PERP',
      levels: [[], []],
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeOrderBook(hlBook);
    expect(normalized.bids).toHaveLength(0);
    expect(normalized.asks).toHaveLength(0);
  });

  test('handles order book with decimal prices and amounts', () => {
    const hlBook: HyperliquidL2Book = {
      coin: 'BTC-PERP',
      levels: [
        [['49999.12345', '1.5678']],
        [['50000.98765', '2.3456']],
      ],
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeOrderBook(hlBook);
    expect(normalized.bids[0][0]).toBeCloseTo(49999.12345, 5);
    expect(normalized.bids[0][1]).toBeCloseTo(1.5678, 4);
    expect(normalized.asks[0][0]).toBeCloseTo(50000.98765, 5);
    expect(normalized.asks[0][1]).toBeCloseTo(2.3456, 4);
  });

  test('handles order book with many levels', () => {
    const bidLevels = Array.from({ length: 20 }, (_, i) => [
      `${50000 - i}`,
      `${1 + i * 0.1}`,
    ]);
    const askLevels = Array.from({ length: 20 }, (_, i) => [
      `${50001 + i}`,
      `${1 + i * 0.1}`,
    ]);

    const hlBook: HyperliquidL2Book = {
      coin: 'BTC-PERP',
      levels: [bidLevels, askLevels],
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeOrderBook(hlBook);
    expect(normalized.bids).toHaveLength(20);
    expect(normalized.asks).toHaveLength(20);
  });
});

describe('Trade Normalization - Edge Cases', () => {
  test('handles sell side trade', () => {
    const hlTrade: HyperliquidWsTrade = {
      coin: 'BTC-PERP',
      side: 'A',
      px: '50000.0',
      sz: '0.5',
      time: 1234567890000,
      hash: '0xabc123',
    };

    const normalized = normalizer.normalizeTrade(hlTrade);
    expect(normalized.side).toBe('sell');
  });

  test('handles trade with very small amount', () => {
    const hlTrade: HyperliquidWsTrade = {
      coin: 'BTC-PERP',
      side: 'B',
      px: '50000.0',
      sz: '0.001',
      time: 1234567890000,
      hash: '0xabc123',
    };

    const normalized = normalizer.normalizeTrade(hlTrade);
    expect(normalized.amount).toBe(0.001);
    expect(normalized.cost).toBeCloseTo(50, 3);
  });

  test('handles trade with decimal price', () => {
    const hlTrade: HyperliquidWsTrade = {
      coin: 'BTC-PERP',
      side: 'B',
      px: '50000.12345',
      sz: '1.0',
      time: 1234567890000,
      hash: '0xabc123',
    };

    const normalized = normalizer.normalizeTrade(hlTrade);
    expect(normalized.price).toBeCloseTo(50000.12345, 5);
  });

  test('handles trade with long hash', () => {
    const hlTrade: HyperliquidWsTrade = {
      coin: 'BTC-PERP',
      side: 'B',
      px: '50000.0',
      sz: '0.5',
      time: 1234567890000,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };

    const normalized = normalizer.normalizeTrade(hlTrade);
    expect(normalized.id).toBe(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    );
  });

  test('handles trade with zero timestamp', () => {
    const hlTrade: HyperliquidWsTrade = {
      coin: 'BTC-PERP',
      side: 'B',
      px: '50000.0',
      sz: '0.5',
      time: 0,
      hash: '0xabc123',
    };

    const normalized = normalizer.normalizeTrade(hlTrade);
    expect(normalized.timestamp).toBe(0);
  });
});

describe('normalizeFill', () => {
  test('normalizes basic fill', () => {
    const hlFill: HyperliquidFill = {
      coin: 'BTC-PERP',
      px: '50000.0',
      sz: '0.5',
      side: 'B',
      time: 1234567890000,
      startPosition: '0',
      dir: 'Open Long',
      closedPnl: '0',
      hash: '0xfill123',
      oid: 12345,
      crossed: false,
      fee: '5.0',
      tid: 67890,
      feeToken: 'USDT',
    };

    const normalized = normalizer.normalizeFill(hlFill);
    expect(normalized).toMatchObject({
      id: '0xfill123',
      symbol: 'BTC/USDT:USDT',
      side: 'buy',
      price: 50000,
      amount: 0.5,
      cost: 25000,
      timestamp: 1234567890000,
    });
  });

  test('handles sell fill', () => {
    const hlFill: HyperliquidFill = {
      coin: 'ETH-PERP',
      px: '3000.0',
      sz: '1.0',
      side: 'A',
      time: 1234567890000,
      startPosition: '2.0',
      dir: 'Close Long',
      closedPnl: '100',
      hash: '0xfill456',
      oid: 12345,
      crossed: false,
      fee: '3.0',
      tid: 67890,
      feeToken: 'USDT',
    };

    const normalized = normalizer.normalizeFill(hlFill);
    expect(normalized.side).toBe('sell');
  });

  test('handles fill with decimal amounts', () => {
    const hlFill: HyperliquidFill = {
      coin: 'BTC-PERP',
      px: '50000.12',
      sz: '0.123',
      side: 'B',
      time: 1234567890000,
      startPosition: '0',
      dir: 'Open Long',
      closedPnl: '0',
      hash: '0xfill789',
      oid: 12345,
      crossed: true,
      fee: '6.15',
      tid: 67890,
      feeToken: 'USDT',
    };

    const normalized = normalizer.normalizeFill(hlFill);
    expect(normalized.price).toBeCloseTo(50000.12, 2);
    expect(normalized.amount).toBeCloseTo(0.123, 3);
  });
});

describe('normalizeUserFill', () => {
  test('normalizes basic user fill', () => {
    const hlUserFill: HyperliquidUserFill = {
      coin: 'BTC-PERP',
      px: '50000.0',
      sz: '0.5',
      side: 'B',
      time: 1234567890000,
      startPosition: '0',
      dir: 'Open Long',
      closedPnl: '0',
      hash: '0xuserfill123',
      oid: 12345,
      crossed: false,
      fee: '5.0',
      tid: 67890,
      feeToken: 'USDT',
      cloid: 'user-123',
    };

    const normalized = normalizer.normalizeUserFill(hlUserFill);
    expect(normalized).toMatchObject({
      id: '0xuserfill123',
      symbol: 'BTC/USDT:USDT',
      side: 'buy',
      price: 50000,
      amount: 0.5,
      timestamp: 1234567890000,
    });
  });

  test('handles user fill without client order ID', () => {
    const hlUserFill: HyperliquidUserFill = {
      coin: 'ETH-PERP',
      px: '3000.0',
      sz: '1.0',
      side: 'A',
      time: 1234567890000,
      startPosition: '0',
      dir: 'Open Short',
      closedPnl: '0',
      hash: '0xuserfill456',
      oid: 12345,
      crossed: false,
      fee: '3.0',
      tid: 67890,
      feeToken: 'USDT',
    };

    const normalized = normalizer.normalizeUserFill(hlUserFill);
    expect(normalized.side).toBe('sell');
  });
});

describe('normalizeHistoricalOrder', () => {
  test('normalizes basic historical order', () => {
    const hlHistoricalOrder: HyperliquidHistoricalOrder = {
      order: {
        coin: 'BTC-PERP',
        side: 'B',
        limitPx: '50000.0',
        sz: '0.5',
        oid: 12345,
        timestamp: 1234567890000,
        origSz: '0.5',
        cloid: 'hist-123',
      },
      status: 'filled',
      statusTimestamp: 1234567890000,
    };

    const normalized = normalizer.normalizeHistoricalOrder(hlHistoricalOrder);
    expect(normalized).toMatchObject({
      id: '12345',
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.5,
      price: 50000,
      status: 'filled',
      remaining: 0.5,
      timestamp: 1234567890000,
      clientOrderId: 'hist-123',
    });
  });

  test('handles cancelled historical order', () => {
    const hlHistoricalOrder: HyperliquidHistoricalOrder = {
      order: {
        coin: 'ETH-PERP',
        side: 'A',
        limitPx: '3000.0',
        sz: '1.0',
        oid: 67890,
        timestamp: 1234567890000,
        origSz: '1.0',
      },
      status: 'canceled',
      statusTimestamp: 1234567890000,
    };

    const normalized = normalizer.normalizeHistoricalOrder(hlHistoricalOrder);
    expect(normalized.status).toBe('canceled');
  });

  test('handles rejected historical order', () => {
    const hlHistoricalOrder: HyperliquidHistoricalOrder = {
      order: {
        coin: 'BTC-PERP',
        side: 'B',
        limitPx: '50000.0',
        sz: '0.1',
        oid: 99999,
        timestamp: 1234567890000,
        origSz: '0.1',
      },
      status: 'rejected',
      statusTimestamp: 1234567890000,
    };

    const normalized = normalizer.normalizeHistoricalOrder(hlHistoricalOrder);
    expect(normalized.status).toBe('rejected');
  });
});

describe('normalizeFundingRate', () => {
  test('normalizes basic funding rate', () => {
    const hlFundingData: HyperliquidFundingRate = {
      coin: 'BTC-PERP',
      fundingRate: '0.0001',
      premium: '0.00005',
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeFundingRate(hlFundingData, 50000);
    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      fundingRate: 0.0001,
      fundingTimestamp: 1234567890000,
      markPrice: 50000,
    });
  });

  test('handles negative funding rate', () => {
    const hlFundingData: HyperliquidFundingRate = {
      coin: 'ETH-PERP',
      fundingRate: '-0.0002',
      premium: '-0.00015',
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeFundingRate(hlFundingData, 3000);
    expect(normalized.fundingRate).toBeCloseTo(-0.0002, 6);
  });

  test('handles zero funding rate', () => {
    const hlFundingData: HyperliquidFundingRate = {
      coin: 'BTC-PERP',
      fundingRate: '0',
      premium: '0',
      time: 1234567890000,
    };

    const normalized = normalizer.normalizeFundingRate(hlFundingData, 50000);
    expect(normalized.fundingRate).toBe(0);
  });
});

describe('normalizeBalance', () => {
  test('normalizes basic balance', () => {
    const hlUserState: HyperliquidUserState = {
      assetPositions: [
        {
          position: {
            coin: 'BTC-PERP',
            entryPx: '50000',
            leverage: { type: 'cross', value: 10 },
            liquidationPx: '45000',
            marginUsed: '5000',
            positionValue: '50000',
            returnOnEquity: '0.1',
            szi: '1.0',
            unrealizedPnl: '1000',
          },
          type: 'oneWay',
        },
      ],
      crossMarginSummary: {
        accountValue: '100000',
        totalMarginUsed: '10000',
        totalNtlPos: '50000',
        totalRawUsd: '90000',
      },
      marginSummary: {
        accountValue: '100000',
        totalMarginUsed: '10000',
        totalNtlPos: '50000',
        totalRawUsd: '90000',
      },
      withdrawable: '85000',
    };

    const normalized = normalizer.normalizeBalance(hlUserState);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      currency: 'USDT',
      free: 85000,
      used: 10000,
      total: 100000,
    });
  });

  test('handles empty balance', () => {
    const hlUserState: HyperliquidUserState = {
      assetPositions: [],
      crossMarginSummary: {
        accountValue: '0',
        totalMarginUsed: '0',
        totalNtlPos: '0',
        totalRawUsd: '0',
      },
      marginSummary: {
        accountValue: '0',
        totalMarginUsed: '0',
        totalNtlPos: '0',
        totalRawUsd: '0',
      },
      withdrawable: '0',
    };

    const normalized = normalizer.normalizeBalance(hlUserState);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].total).toBe(0);
  });

  test('handles balance with decimal values', () => {
    const hlUserState: HyperliquidUserState = {
      assetPositions: [],
      crossMarginSummary: {
        accountValue: '12345.6789',
        totalMarginUsed: '2345.6789',
        totalNtlPos: '0',
        totalRawUsd: '10000',
      },
      marginSummary: {
        accountValue: '12345.6789',
        totalMarginUsed: '2345.6789',
        totalNtlPos: '0',
        totalRawUsd: '10000',
      },
      withdrawable: '9999.9999',
    };

    const normalized = normalizer.normalizeBalance(hlUserState);
    expect(normalized[0].total).toBeCloseTo(12345.6789, 4);
    expect(normalized[0].free).toBeCloseTo(9999.9999, 4);
  });
});

describe('normalizeTicker', () => {
  test('normalizes basic ticker', () => {
    const normalized = normalizer.normalizeTicker('BTC-PERP', { mid: '50000.0' });
    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      last: 50000,
    });
  });

  test('handles ticker with decimal price', () => {
    const normalized = normalizer.normalizeTicker('ETH-PERP', { mid: '3000.12345' });
    expect(normalized.last).toBeCloseTo(3000.12345, 5);
  });

  test('handles ticker with extra fields', () => {
    const normalized = normalizer.normalizeTicker('BTC-PERP', {
      mid: '50000.0',
      extraField: 'ignored',
      anotherField: 123,
    });
    expect(normalized.symbol).toBe('BTC/USDT:USDT');
    expect(normalized.last).toBe(50000);
  });
});

describe('Error Mapping - Edge Cases', () => {
  test('maps order not found error', () => {
    const error = new Error('order not found');
    const mapped = mapError(error);
    expect(mapped).toBeInstanceOf(OrderNotFoundError);
  });

  test('maps unknown error patterns to ExchangeUnavailableError', () => {
    const error = new Error('position size would exceed maximum');
    const mapped = mapError(error);
    // Unknown patterns default to ExchangeUnavailableError
    expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
  });

  test('maps HTTP 503 to exchange unavailable', () => {
    const error = new Error('HTTP 503: Service Unavailable');
    const mapped = mapError(error);
    expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
  });

  test('maps network timeout error', () => {
    const error = new Error('request timeout');
    const mapped = mapError(error);
    expect(mapped.exchange).toBe('hyperliquid');
  });

  test('maps unknown error to generic PerpDEXError', () => {
    const error = new Error('Something completely unexpected happened');
    const mapped = mapError(error);
    expect(mapped).toBeInstanceOf(PerpDEXError);
    expect(mapped.exchange).toBe('hyperliquid');
  });

  test('handles non-Error objects', () => {
    const error = { message: 'Custom error object' };
    const mapped = mapError(error);
    expect(mapped).toBeInstanceOf(PerpDEXError);
  });

  test('handles string errors', () => {
    const error = 'Simple error string';
    const mapped = mapError(error);
    expect(mapped).toBeInstanceOf(PerpDEXError);
  });

  test('handles null error', () => {
    const mapped = mapError(null);
    expect(mapped).toBeInstanceOf(PerpDEXError);
    expect(mapped.message).toBeTruthy();
  });

  test('handles undefined error', () => {
    const mapped = mapError(undefined);
    expect(mapped).toBeInstanceOf(PerpDEXError);
    expect(mapped.message).toBeTruthy();
  });

  test('maps all HTTP status codes correctly', () => {
    const statuses = [400, 401, 403, 404, 429, 500, 502, 503, 504];
    statuses.forEach((status) => {
      const error = new Error(`HTTP ${status}: Error`);
      const mapped = mapError(error);
      expect(mapped).toBeInstanceOf(PerpDEXError);
    });
  });

  test('unknown errors get generic message', () => {
    const originalMessage = 'Very specific error message';
    const error = new Error(originalMessage);
    const mapped = mapError(error);
    // Unknown errors default to "Unknown exchange error"
    expect(mapped.message).toBe('Unknown exchange error');
  });
});
