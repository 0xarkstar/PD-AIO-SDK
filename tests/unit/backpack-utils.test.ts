/**
 * Backpack Utilities Unit Tests
 */

import { BackpackNormalizer } from '../../src/adapters/backpack/BackpackNormalizer.js';
import {
  toBackpackOrderType,
  toBackpackOrderSide,
  toBackpackTimeInForce,
} from '../../src/adapters/backpack/utils.js';

const normalizer = new BackpackNormalizer();
import type {
  BackpackMarket,
  BackpackOrder,
  BackpackPosition,
} from '../../src/adapters/backpack/types.js';

describe('Backpack Symbol Normalization', () => {
  describe('normalizeSymbol', () => {
    test('normalizes new format perpetual symbols', () => {
      expect(normalizer.normalizeSymbol('BTC_USDC_PERP')).toBe('BTC/USDC:USDC');
      expect(normalizer.normalizeSymbol('ETH_USDC_PERP')).toBe('ETH/USDC:USDC');
      expect(normalizer.normalizeSymbol('SOL_USDC_PERP')).toBe('SOL/USDC:USDC');
    });

    test('normalizes legacy format perpetual symbols', () => {
      expect(normalizer.normalizeSymbol('BTCUSDT_PERP')).toBe('BTC/USDT:USDT');
      expect(normalizer.normalizeSymbol('ETHUSDT_PERP')).toBe('ETH/USDT:USDT');
    });

    test('normalizes spot symbols', () => {
      expect(normalizer.normalizeSymbol('BTC_USDC')).toBe('BTC/USDC');
      expect(normalizer.normalizeSymbol('SOL_USDC')).toBe('SOL/USDC');
    });

    test('handles non-standard symbols', () => {
      expect(normalizer.normalizeSymbol('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('toBackpackSymbol', () => {
    test('converts unified perpetual to Backpack format', () => {
      expect(normalizer.toBackpackSymbol('BTC/USDC:USDC')).toBe('BTC_USDC_PERP');
      expect(normalizer.toBackpackSymbol('ETH/USDC:USDC')).toBe('ETH_USDC_PERP');
      expect(normalizer.toBackpackSymbol('SOL/USDC:USDC')).toBe('SOL_USDC_PERP');
    });

    test('converts unified spot to Backpack format', () => {
      expect(normalizer.toBackpackSymbol('BTC/USDC')).toBe('BTC_USDC');
      expect(normalizer.toBackpackSymbol('SOL/USDC')).toBe('SOL_USDC');
    });

    test('returns symbol as-is when no slash present (fallback case, line 115)', () => {
      expect(normalizer.toBackpackSymbol('UNKNOWN')).toBe('UNKNOWN');
      expect(normalizer.toBackpackSymbol('BTCUSDT')).toBe('BTCUSDT');
    });
  });

  describe('normalizeSymbol edge cases', () => {
    test('normalizes legacy format without underscore (BTCUSDT -> BTC/USDT, lines 81-83)', () => {
      // This tests the quoteMatch branch in normalizeSymbol
      expect(normalizer.normalizeSymbol('BTCUSDT')).toBe('BTC/USDT');
      expect(normalizer.normalizeSymbol('ETHUSDC')).toBe('ETH/USDC');
      expect(normalizer.normalizeSymbol('SOLUSD')).toBe('SOL/USD');
    });
  });
});

describe('Backpack Market Normalization', () => {
  test('normalizes market data', () => {
    const backpackMarket: BackpackMarket = {
      symbol: 'BTC_USDC_PERP',
      baseSymbol: 'BTC',
      quoteSymbol: 'USDC',
      marketType: 'PERP',
      orderBookState: 'Open',
      visible: true,
      filters: {
        price: {
          tickSize: '0.1',
          minPrice: '0.01',
          maxPrice: null,
        },
        quantity: {
          stepSize: '0.001',
          minQuantity: '0.001',
          maxQuantity: null,
        },
      },
      fundingInterval: 3600000,
      openInterestLimit: '1000000',
    };

    const normalized = normalizer.normalizeMarket(backpackMarket);

    expect(normalized).toMatchObject({
      id: 'BTC_USDC_PERP',
      symbol: 'BTC/USDC:USDC',
      base: 'BTC',
      quote: 'USDC',
      settle: 'USDC',
      active: true,
      minAmount: 0.001,
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

    const normalized = normalizer.normalizeOrder(backpackOrder);

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

    const normalized = normalizer.normalizeOrder(backpackOrder);

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

    const normalized = normalizer.normalizePosition(backpackPosition);

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

describe('Backpack Balance Normalization', () => {
  test('normalizes balance data (line 210)', () => {
    const backpackBalance = {
      asset: 'USDC',
      total: '10000.5',
      available: '8000.25',
      locked: '2000.25',
    };

    const normalized = normalizer.normalizeBalance(backpackBalance);

    expect(normalized.currency).toBe('USDC');
    expect(normalized.total).toBe(10000.5);
    expect(normalized.free).toBe(8000.25);
    expect(normalized.used).toBe(2000.25);
    expect(normalized.info).toBeDefined();
  });

  test('normalizes zero balance', () => {
    const backpackBalance = {
      asset: 'BTC',
      total: '0',
      available: '0',
      locked: '0',
    };

    const normalized = normalizer.normalizeBalance(backpackBalance);

    expect(normalized.currency).toBe('BTC');
    expect(normalized.total).toBe(0);
    expect(normalized.free).toBe(0);
    expect(normalized.used).toBe(0);
  });
});

describe('Backpack Conversion Functions', () => {
  test('converts order types', () => {
    expect(toBackpackOrderType('market', false)).toBe('Market');
    expect(toBackpackOrderType('limit', false)).toBe('Limit');
    expect(toBackpackOrderType('limit', true)).toBe('PostOnly');
  });

  test('converts order sides', () => {
    expect(toBackpackOrderSide('buy')).toBe('Bid');
    expect(toBackpackOrderSide('sell')).toBe('Ask');
  });

  test('converts time in force', () => {
    expect(toBackpackTimeInForce('GTC', false)).toBe('GTC');
    expect(toBackpackTimeInForce('IOC', false)).toBe('IOC');
    expect(toBackpackTimeInForce('FOK', false)).toBe('FOK');
    expect(toBackpackTimeInForce('PO', false)).toBe('POST_ONLY');
    expect(toBackpackTimeInForce('GTC', true)).toBe('POST_ONLY');
  });
});
