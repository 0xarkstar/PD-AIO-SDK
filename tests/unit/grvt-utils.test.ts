/**
 * GRVT Utilities Unit Tests
 */

import {
  normalizeSymbol,
  toGRVTSymbol,
  normalizeMarket,
  normalizeOrder,
  normalizePosition,
  normalizeBalance,
  normalizeOrderBook,
  normalizeTrade,
  normalizeTicker,
  toGRVTOrderType,
  toGRVTOrderSide,
  toGRVTTimeInForce,
} from '../../src/adapters/grvt/utils.js';
import type {
  GRVTMarket,
  GRVTOrder,
  GRVTPosition,
  GRVTBalance,
  GRVTOrderBook,
  GRVTTrade,
  GRVTTicker,
} from '../../src/adapters/grvt/types.js';

describe('GRVT Symbol Normalization', () => {
  describe('normalizeSymbol', () => {
    test('normalizes perpetual symbols', () => {
      expect(normalizeSymbol('BTC-PERP')).toBe('BTC/USDT:USDT');
      expect(normalizeSymbol('ETH-PERP')).toBe('ETH/USDT:USDT');
    });

    test('handles spot symbols', () => {
      expect(normalizeSymbol('BTC-USD')).toBe('BTC/USD');
    });
  });

  describe('toGRVTSymbol', () => {
    test('converts unified perpetual to GRVT format', () => {
      expect(toGRVTSymbol('BTC/USDT:USDT')).toBe('BTC-PERP');
      expect(toGRVTSymbol('ETH/USDT:USDT')).toBe('ETH-PERP');
    });

    test('converts unified spot to GRVT format', () => {
      expect(toGRVTSymbol('BTC/USD')).toBe('BTC-USD');
    });
  });
});

describe('GRVT Market Normalization', () => {
  test('normalizes market data', () => {
    const grvtMarket: GRVTMarket = {
      instrument_id: 'btc-usdt-perp',
      instrument: 'BTC-PERP',
      base_currency: 'BTC',
      quote_currency: 'USDT',
      settlement_currency: 'USDT',
      is_active: true,
      min_size: '0.001',
      max_size: '100',
      tick_size: '0.1',
      step_size: '0.001',
      maker_fee: '0.0002',
      taker_fee: '0.0005',
      max_leverage: '50',
    };

    const normalized = normalizeMarket(grvtMarket);

    expect(normalized).toMatchObject({
      id: 'btc-usdt-perp',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      minAmount: 0.001,
      maxLeverage: 50,
    });
  });
});

describe('GRVT Order Normalization', () => {
  test('normalizes limit order', () => {
    const grvtOrder: GRVTOrder = {
      order_id: '12345',
      client_order_id: 'test-123',
      instrument: 'BTC-PERP',
      side: 'BUY',
      order_type: 'LIMIT',
      size: '0.1',
      price: '50000',
      filled_size: '0.02',
      average_fill_price: '49995',
      status: 'OPEN',
      time_in_force: 'GTC',
      post_only: false,
      reduce_only: false,
      created_at: 1234567890000,
      updated_at: 1234567890100,
    };

    const normalized = normalizeOrder(grvtOrder);

    expect(normalized).toMatchObject({
      id: '12345',
      clientOrderId: 'test-123',
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      status: 'open',
    });
  });

  test('normalizes market order', () => {
    const grvtOrder: GRVTOrder = {
      order_id: '67890',
      instrument: 'ETH-PERP',
      side: 'SELL',
      order_type: 'MARKET',
      size: '1.5',
      filled_size: '1.5',
      average_fill_price: '3000',
      status: 'FILLED',
      time_in_force: 'IOC',
      post_only: false,
      reduce_only: true,
      created_at: 1234567891000,
      updated_at: 1234567891500,
    };

    const normalized = normalizeOrder(grvtOrder);

    expect(normalized.type).toBe('market');
    expect(normalized.side).toBe('sell');
    expect(normalized.status).toBe('filled');
  });
});

describe('GRVT Position Normalization', () => {
  test('normalizes long position', () => {
    const grvtPosition: GRVTPosition = {
      instrument: 'BTC-PERP',
      side: 'LONG',
      size: '0.5',
      entry_price: '48000',
      mark_price: '50000',
      liquidation_price: '40000',
      unrealized_pnl: '1000',
      realized_pnl: '500',
      margin: '2400',
      leverage: '50',
      timestamp: 1234567890000,
    };

    const normalized = normalizePosition(grvtPosition);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      side: 'long',
      marginMode: 'cross',
      size: 0.5,
      entryPrice: 48000,
      leverage: 50,
    });
  });
});

describe('GRVT Balance Normalization', () => {
  test('normalizes balance', () => {
    const grvtBalance: GRVTBalance = {
      currency: 'USDT',
      total: '10000',
      available: '9000',
      reserved: '1000',
      unrealized_pnl: '0',
    };

    const normalized = normalizeBalance(grvtBalance);

    expect(normalized).toMatchObject({
      currency: 'USDT',
      total: 10000,
      free: 9000,
      used: 1000,
    });
  });
});

describe('GRVT OrderBook Normalization', () => {
  test('normalizes order book', () => {
    const grvtOrderBook: GRVTOrderBook = {
      instrument: 'BTC-PERP',
      bids: [
        ['50000', '0.5'],
        ['49900', '1.0'],
      ],
      asks: [
        ['50100', '0.3'],
        ['50200', '0.8'],
      ],
      timestamp: 1234567890000,
    };

    const normalized = normalizeOrderBook(grvtOrderBook);

    expect(normalized.symbol).toBe('BTC/USDT:USDT');
    expect(normalized.exchange).toBe('grvt');
    expect(normalized.bids).toHaveLength(2);
    expect(normalized.asks).toHaveLength(2);
  });
});

describe('GRVT Trade Normalization', () => {
  test('normalizes trade', () => {
    const grvtTrade: GRVTTrade = {
      trade_id: 'trade-123',
      instrument: 'ETH-PERP',
      side: 'BUY',
      price: '3000',
      size: '2.5',
      timestamp: 1234567890000,
    };

    const normalized = normalizeTrade(grvtTrade);

    expect(normalized).toMatchObject({
      id: 'trade-123',
      symbol: 'ETH/USDT:USDT',
      side: 'buy',
      price: 3000,
      amount: 2.5,
      cost: 7500,
    });
  });
});

describe('GRVT Ticker Normalization', () => {
  test('normalizes ticker', () => {
    const grvtTicker: GRVTTicker = {
      instrument: 'BTC-PERP',
      last_price: '50000',
      best_bid: '49995',
      best_ask: '50005',
      high_24h: '51000',
      low_24h: '48000',
      volume_24h: '1000',
      timestamp: 1234567890000,
    };

    const normalized = normalizeTicker(grvtTicker);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      last: 50000,
      bid: 49995,
      ask: 50005,
      high: 51000,
      low: 48000,
      baseVolume: 1000,
    });
  });
});

describe('GRVT Conversion Functions', () => {
  test('converts order types', () => {
    expect(toGRVTOrderType('market')).toBe('MARKET');
    expect(toGRVTOrderType('limit')).toBe('LIMIT');
    expect(toGRVTOrderType('limit', true)).toBe('LIMIT_MAKER');
  });

  test('converts order sides', () => {
    expect(toGRVTOrderSide('buy')).toBe('BUY');
    expect(toGRVTOrderSide('sell')).toBe('SELL');
  });

  test('converts time in force', () => {
    expect(toGRVTTimeInForce('GTC')).toBe('GTC');
    expect(toGRVTTimeInForce('IOC')).toBe('IOC');
    expect(toGRVTTimeInForce('FOK')).toBe('FOK');
    expect(toGRVTTimeInForce('PO')).toBe('POST_ONLY');
    expect(toGRVTTimeInForce('GTC', true)).toBe('POST_ONLY');
  });
});
