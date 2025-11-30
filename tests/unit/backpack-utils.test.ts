/**
 * Backpack Utilities Unit Tests
 */

import {
  normalizeSymbol,
  toBackpackSymbol,
  normalizeMarket,
  normalizeOrder,
  normalizePosition,
  toBackpackOrderType,
  toBackpackOrderSide,
  toBackpackTimeInForce,
} from '../../src/adapters/backpack/utils.js';
import type {
  BackpackMarket,
  BackpackOrder,
  BackpackPosition,
} from '../../src/adapters/backpack/types.js';

describe('Backpack Symbol Normalization', () => {
  describe('normalizeSymbol', () => {
    test('normalizes perpetual symbols', () => {
      expect(normalizeSymbol('BTCUSDT_PERP')).toBe('BTC/USDT:USDT');
      expect(normalizeSymbol('ETHUSDT_PERP')).toBe('ETH/USDT:USDT');
    });

    test('handles non-perpetual symbols', () => {
      expect(normalizeSymbol('BTCUSDT')).toBe('BTCUSDT');
    });
  });

  describe('toBackpackSymbol', () => {
    test('converts unified perpetual to Backpack format', () => {
      expect(toBackpackSymbol('BTC/USDT:USDT')).toBe('BTCUSDT_PERP');
      expect(toBackpackSymbol('ETH/USDT:USDT')).toBe('ETHUSDT_PERP');
    });

    test('converts unified spot to Backpack format', () => {
      expect(toBackpackSymbol('BTC/USDT')).toBe('BTC/USDT');
    });
  });
});

describe('Backpack Market Normalization', () => {
  test('normalizes market data', () => {
    const backpackMarket: BackpackMarket = {
      symbol: 'BTCUSDT_PERP',
      base_currency: 'BTC',
      quote_currency: 'USDT',
      settlement_currency: 'USDT',
      status: 'ACTIVE',
      min_order_size: '0.001',
      max_order_size: '100',
      tick_size: '0.1',
      step_size: '0.001',
      maker_fee: '0.0002',
      taker_fee: '0.0005',
      max_leverage: '10',
      is_active: true,
    };

    const normalized = normalizeMarket(backpackMarket);

    expect(normalized).toMatchObject({
      id: 'BTCUSDT_PERP',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      minAmount: 0.001,
      maxLeverage: 10,
    });
  });
});

describe('Backpack Order Normalization', () => {
  test('normalizes limit order', () => {
    const backpackOrder: BackpackOrder = {
      order_id: '12345',
      client_order_id: 'test-123',
      market: 'BTCUSDT_PERP',
      side: 'BUY',
      type: 'LIMIT',
      size: '0.1',
      price: '50000',
      filled_size: '0.02',
      avg_price: '49995',
      status: 'OPEN',
      time_in_force: 'GTC',
      post_only: false,
      reduce_only: false,
      created_at: 1234567890000,
      updated_at: 1234567890100,
    };

    const normalized = normalizeOrder(backpackOrder);

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

  test('normalizes POST_ONLY order type', () => {
    const backpackOrder: BackpackOrder = {
      order_id: '67890',
      market: 'ETHUSDT_PERP',
      side: 'SELL',
      type: 'POST_ONLY',
      size: '1.0',
      price: '3000',
      filled_size: '0',
      status: 'NEW',
      time_in_force: 'POST_ONLY',
      post_only: true,
      reduce_only: false,
      created_at: 1234567890000,
      updated_at: 1234567890000,
    };

    const normalized = normalizeOrder(backpackOrder);

    expect(normalized.type).toBe('limit');
    expect(normalized.postOnly).toBe(true);
  });
});

describe('Backpack Position Normalization', () => {
  test('normalizes long position', () => {
    const backpackPosition: BackpackPosition = {
      market: 'BTCUSDT_PERP',
      side: 'LONG',
      size: '0.5',
      entry_price: '48000',
      mark_price: '50000',
      liquidation_price: '40000',
      unrealized_pnl: '1000',
      realized_pnl: '500',
      margin: '2400',
      leverage: '10',
      timestamp: 1234567890000,
    };

    const normalized = normalizePosition(backpackPosition);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      side: 'long',
      marginMode: 'cross',
      size: 0.5,
      entryPrice: 48000,
      leverage: 10,
    });
  });
});

describe('Backpack Conversion Functions', () => {
  test('converts order types', () => {
    expect(toBackpackOrderType('market', false)).toBe('MARKET');
    expect(toBackpackOrderType('limit', false)).toBe('LIMIT');
    expect(toBackpackOrderType('limit', true)).toBe('POST_ONLY');
  });

  test('converts order sides', () => {
    expect(toBackpackOrderSide('buy')).toBe('BUY');
    expect(toBackpackOrderSide('sell')).toBe('SELL');
  });

  test('converts time in force', () => {
    expect(toBackpackTimeInForce('GTC', false)).toBe('GTC');
    expect(toBackpackTimeInForce('IOC', false)).toBe('IOC');
    expect(toBackpackTimeInForce('FOK', false)).toBe('FOK');
    expect(toBackpackTimeInForce('PO', false)).toBe('POST_ONLY');
    expect(toBackpackTimeInForce('GTC', true)).toBe('POST_ONLY');
  });
});
