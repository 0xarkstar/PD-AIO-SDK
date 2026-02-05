/**
 * Paradex Utilities Unit Tests
 */

import {
  normalizeSymbol,
  toParadexSymbol,
  normalizeMarket,
  normalizeOrder,
  normalizePosition,
  normalizeBalance,
  normalizeOrderBook,
  normalizeTrade,
  normalizeTicker,
  normalizeFundingRate,
  toParadexOrderType,
  toParadexOrderSide,
  toParadexTimeInForce,
  mapParadexError,
} from '../../src/adapters/paradex/utils.js';
import type {
  ParadexMarket,
  ParadexOrder,
  ParadexPosition,
  ParadexBalance,
  ParadexOrderBook,
  ParadexTrade,
  ParadexTicker,
  ParadexFundingRate,
} from '../../src/adapters/paradex/types.js';

describe('Paradex Symbol Normalization', () => {
  describe('normalizeSymbol', () => {
    test('normalizes perpetual symbols', () => {
      expect(normalizeSymbol('BTC-USD-PERP')).toBe('BTC/USD:USD');
      expect(normalizeSymbol('ETH-USD-PERP')).toBe('ETH/USD:USD');
    });

    test('handles spot symbols', () => {
      expect(normalizeSymbol('BTC-USD')).toBe('BTC/USD');
    });
  });

  describe('toParadexSymbol', () => {
    test('converts unified perpetual to Paradex format', () => {
      expect(toParadexSymbol('BTC/USD:USD')).toBe('BTC-USD-PERP');
      expect(toParadexSymbol('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    test('converts unified spot to Paradex format', () => {
      expect(toParadexSymbol('BTC/USD')).toBe('BTC-USD');
    });
  });
});

describe('Paradex Market Normalization', () => {
  test('normalizes market data', () => {
    const paradexMarket: ParadexMarket = {
      symbol: 'BTC-USD-PERP',
      base_currency: 'BTC',
      quote_currency: 'USD',
      settlement_currency: 'USD',
      status: 'ACTIVE',
      min_order_size: '0.001',
      max_order_size: '100',
      tick_size: '0.1',
      step_size: '0.001',
      maker_fee_rate: '0.0002',
      taker_fee_rate: '0.0005',
      max_leverage: '20',
      is_active: true,
    };

    const normalized = normalizeMarket(paradexMarket);

    expect(normalized).toMatchObject({
      id: 'BTC-USD-PERP',
      symbol: 'BTC/USD:USD',
      base: 'BTC',
      quote: 'USD',
      settle: 'USD',
      active: true,
      minAmount: 0.001,
      maxLeverage: 20,
    });
  });
});

describe('Paradex Order Normalization', () => {
  test('normalizes buy limit order', () => {
    const paradexOrder: ParadexOrder = {
      id: '12345',
      client_id: 'test-123',
      market: 'BTC-USD-PERP',
      side: 'BUY',
      type: 'LIMIT',
      size: '0.1',
      price: '50000',
      filled_size: '0.02',
      avg_fill_price: '49995',
      status: 'PARTIAL',
      time_in_force: 'GTC',
      post_only: false,
      reduce_only: false,
      created_at: 1234567890000,
      updated_at: 1234567890100,
    };

    const normalized = normalizeOrder(paradexOrder);

    expect(normalized).toMatchObject({
      id: '12345',
      clientOrderId: 'test-123',
      symbol: 'BTC/USD:USD',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      status: 'partiallyFilled',
      postOnly: false,
      reduceOnly: false,
    });
    expect(normalized.filled).toBeCloseTo(0.02, 10);
  });

  test('normalizes sell market order', () => {
    const paradexOrder: ParadexOrder = {
      id: '67890',
      market: 'ETH-USD-PERP',
      side: 'SELL',
      type: 'MARKET',
      size: '1.5',
      filled_size: '1.5',
      avg_fill_price: '3000',
      status: 'FILLED',
      time_in_force: 'IOC',
      post_only: false,
      reduce_only: true,
      created_at: 1234567891000,
      updated_at: 1234567891500,
    };

    const normalized = normalizeOrder(paradexOrder);

    expect(normalized.type).toBe('market');
    expect(normalized.side).toBe('sell');
    expect(normalized.status).toBe('filled');
    expect(normalized.reduceOnly).toBe(true);
  });
});

describe('Paradex Position Normalization', () => {
  test('normalizes long position', () => {
    const paradexPosition: ParadexPosition = {
      market: 'BTC-USD-PERP',
      side: 'LONG',
      size: '0.5',
      entry_price: '48000',
      mark_price: '50000',
      liquidation_price: '40000',
      unrealized_pnl: '1000',
      realized_pnl: '500',
      margin: '2400',
      leverage: '20',
      last_updated: 1234567890000,
    };

    const normalized = normalizePosition(paradexPosition);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USD:USD',
      side: 'long',
      marginMode: 'cross',
      size: 0.5,
      entryPrice: 48000,
      markPrice: 50000,
      liquidationPrice: 40000,
      unrealizedPnl: 1000,
      realizedPnl: 500,
      margin: 2400,
      leverage: 20,
    });
  });
});

describe('Paradex Balance Normalization', () => {
  test('normalizes balance', () => {
    const paradexBalance: ParadexBalance = {
      asset: 'USDC',
      total: '10000',
      available: '7500',
      locked: '2500',
    };

    const normalized = normalizeBalance(paradexBalance);

    expect(normalized).toMatchObject({
      currency: 'USDC',
      total: 10000,
      free: 7500,
      used: 2500,
    });
    expect(normalized.info).toBeDefined();
  });

  test('normalizes zero balance', () => {
    const paradexBalance: ParadexBalance = {
      asset: 'USD',
      total: '0',
      available: '0',
      locked: '0',
    };

    const normalized = normalizeBalance(paradexBalance);

    expect(normalized.total).toBe(0);
    expect(normalized.free).toBe(0);
    expect(normalized.used).toBe(0);
  });
});

describe('Paradex OrderBook Normalization', () => {
  test('normalizes order book', () => {
    const paradexOrderBook: ParadexOrderBook = {
      market: 'BTC-USD-PERP',
      bids: [
        ['50000', '0.5'],
        ['49900', '1.0'],
      ],
      asks: [
        ['50100', '0.3'],
        ['50200', '0.8'],
      ],
      timestamp: 1234567890000,
      sequence: 12345,
    };

    const normalized = normalizeOrderBook(paradexOrderBook);

    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.exchange).toBe('paradex');
    expect(normalized.bids).toHaveLength(2);
    expect(normalized.asks).toHaveLength(2);
    expect(normalized.bids[0]).toEqual([50000, 0.5]);
    expect(normalized.asks[0]).toEqual([50100, 0.3]);
  });
});

describe('Paradex Trade Normalization', () => {
  test('normalizes trade', () => {
    const paradexTrade: ParadexTrade = {
      id: 'trade-123',
      market: 'ETH-USD-PERP',
      side: 'BUY',
      price: '3000',
      size: '2.5',
      timestamp: 1234567890000,
    };

    const normalized = normalizeTrade(paradexTrade);

    expect(normalized).toMatchObject({
      id: 'trade-123',
      symbol: 'ETH/USD:USD',
      side: 'buy',
      price: 3000,
      amount: 2.5,
      cost: 7500,
    });
  });
});

describe('Paradex Ticker Normalization', () => {
  test('normalizes ticker', () => {
    const paradexTicker: ParadexTicker = {
      market: 'BTC-USD-PERP',
      last_price: '50000',
      bid: '49995',
      ask: '50005',
      high_24h: '51000',
      low_24h: '48000',
      volume_24h: '1000',
      price_change_24h: '1000',
      price_change_percent_24h: '2.04',
      timestamp: 1234567890000,
    };

    const normalized = normalizeTicker(paradexTicker);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USD:USD',
      last: 50000,
      bid: 49995,
      ask: 50005,
      high: 51000,
      low: 48000,
      change: 1000,
      percentage: 2.04,
      baseVolume: 1000,
    });
  });
});

describe('Paradex Funding Rate Normalization', () => {
  test('normalizes funding rate', () => {
    const paradexFunding: ParadexFundingRate = {
      market: 'BTC-USD-PERP',
      rate: '0.0001',
      timestamp: 1234567890000,
      next_funding_time: 1234596000000,
      mark_price: '50000',
      index_price: '49995',
    };

    const normalized = normalizeFundingRate(paradexFunding);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USD:USD',
      fundingRate: 0.0001,
      markPrice: 50000,
      indexPrice: 49995,
      fundingIntervalHours: 8,
    });
  });
});

describe('Paradex Order Type Conversion', () => {
  test('converts order types', () => {
    expect(toParadexOrderType('market', false)).toBe('MARKET');
    expect(toParadexOrderType('limit', false)).toBe('LIMIT');
    expect(toParadexOrderType('limit', true)).toBe('LIMIT_MAKER');
  });
});

describe('Paradex Order Side Conversion', () => {
  test('converts order sides', () => {
    expect(toParadexOrderSide('buy')).toBe('BUY');
    expect(toParadexOrderSide('sell')).toBe('SELL');
  });
});

describe('Paradex Time In Force Conversion', () => {
  test('converts time in force', () => {
    expect(toParadexTimeInForce('GTC', false)).toBe('GTC');
    expect(toParadexTimeInForce('IOC', false)).toBe('IOC');
    expect(toParadexTimeInForce('FOK', false)).toBe('FOK');
    expect(toParadexTimeInForce('PO', false)).toBe('POST_ONLY');
    expect(toParadexTimeInForce('GTC', true)).toBe('POST_ONLY');
  });

  test('uses default GTC when undefined', () => {
    expect(toParadexTimeInForce(undefined, false)).toBe('GTC');
  });
});

describe('Paradex Error Mapping', () => {
  test('maps INVALID_ORDER error (code 1001)', () => {
    const result = mapParadexError({ code: 1001, message: 'Bad params' });
    expect(result.code).toBe('INVALID_ORDER');
    expect(result.message).toBe('Invalid order parameters');
  });

  test('maps INSUFFICIENT_MARGIN error (code 1002)', () => {
    const result = mapParadexError({ code: 1002, message: 'Not enough' });
    expect(result.code).toBe('INSUFFICIENT_MARGIN');
    expect(result.message).toBe('Insufficient margin');
  });

  test('maps ORDER_NOT_FOUND error (code 1003)', () => {
    const result = mapParadexError({ code: 1003 });
    expect(result.code).toBe('ORDER_NOT_FOUND');
    expect(result.message).toBe('Order not found');
  });

  test('maps POSITION_NOT_FOUND error (code 1004)', () => {
    const result = mapParadexError({ code: 1004 });
    expect(result.code).toBe('POSITION_NOT_FOUND');
    expect(result.message).toBe('Position not found');
  });

  test('maps INVALID_SIGNATURE error (code 2001)', () => {
    const result = mapParadexError({ code: 2001 });
    expect(result.code).toBe('INVALID_SIGNATURE');
    expect(result.message).toBe('Invalid signature');
  });

  test('maps EXPIRED_AUTH error (code 2002)', () => {
    const result = mapParadexError({ code: 2002 });
    expect(result.code).toBe('EXPIRED_AUTH');
    expect(result.message).toBe('JWT token expired');
  });

  test('maps INVALID_API_KEY error (code 2003)', () => {
    const result = mapParadexError({ code: 2003 });
    expect(result.code).toBe('INVALID_API_KEY');
    expect(result.message).toBe('Invalid API key');
  });

  test('maps RATE_LIMIT_EXCEEDED error (code 4001)', () => {
    const result = mapParadexError({ code: 4001 });
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(result.message).toBe('Rate limit exceeded');
  });

  test('maps EXCHANGE_UNAVAILABLE error (code 5001)', () => {
    const result = mapParadexError({ code: 5001 });
    expect(result.code).toBe('EXCHANGE_UNAVAILABLE');
    expect(result.message).toBe('Exchange unavailable');
  });

  test('maps unknown error code to UNKNOWN_ERROR', () => {
    const result = mapParadexError({ code: 9999, message: 'Something else' });
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('Something else');
  });

  test('maps error without code to UNKNOWN_ERROR', () => {
    const result = mapParadexError({ message: 'Generic error' });
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  test('handles non-object error', () => {
    const result = mapParadexError('string error');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('Unknown error occurred');
  });

  test('handles null error', () => {
    const result = mapParadexError(null);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });
});
