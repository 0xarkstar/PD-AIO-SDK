/**
 * EdgeX Utilities Unit Tests
 */

import { EdgeXNormalizer } from '../../src/adapters/edgex/EdgeXNormalizer.js';
import {
  toEdgeXOrderType,
  toEdgeXOrderSide,
  toEdgeXTimeInForce,
} from '../../src/adapters/edgex/utils.js';
import type {
  EdgeXMarket,
  EdgeXOrder,
  EdgeXPosition,
} from '../../src/adapters/edgex/types.js';

const normalizer = new EdgeXNormalizer();

describe('EdgeX Symbol Normalization', () => {
  describe('normalizeSymbol', () => {
    test('normalizes perpetual symbols', () => {
      expect(normalizer.normalizeSymbol('BTC-USDC-PERP')).toBe('BTC/USDC:USDC');
      expect(normalizer.normalizeSymbol('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
    });

    test('handles spot symbols', () => {
      expect(normalizer.normalizeSymbol('BTC-USDC')).toBe('BTC/USDC');
    });
  });

  describe('toEdgeXSymbol', () => {
    test('converts unified perpetual to EdgeX format', () => {
      expect(normalizer.toEdgeXSymbol('BTC/USDC:USDC')).toBe('BTC-USDC-PERP');
      expect(normalizer.toEdgeXSymbol('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    test('converts unified spot to EdgeX format', () => {
      expect(normalizer.toEdgeXSymbol('BTC/USDC')).toBe('BTC-USDC');
    });
  });
});

describe('EdgeX Market Normalization', () => {
  test('normalizes market data', () => {
    const edgexMarket: EdgeXMarket = {
      market_id: 'btc-usdc-perp',
      symbol: 'BTC-USDC-PERP',
      base_asset: 'BTC',
      quote_asset: 'USDC',
      settlement_asset: 'USDC',
      status: 'ACTIVE',
      min_order_size: '0.001',
      max_order_size: '100',
      tick_size: '0.1',
      step_size: '0.001',
      maker_fee: '0.0002',
      taker_fee: '0.0005',
      max_leverage: '25',
      is_active: true,
    };

    const normalized = normalizer.normalizeMarket(edgexMarket);

    expect(normalized).toMatchObject({
      id: 'btc-usdc-perp',
      symbol: 'BTC/USDC:USDC',
      base: 'BTC',
      quote: 'USDC',
      settle: 'USDC',
      active: true,
      minAmount: 0.001,
      maxLeverage: 25,
    });
  });
});

describe('EdgeX Order Normalization', () => {
  test('normalizes limit order', () => {
    const edgexOrder: EdgeXOrder = {
      order_id: '12345',
      client_order_id: 'test-123',
      market: 'BTC-USDC-PERP',
      side: 'BUY',
      type: 'LIMIT',
      size: '0.1',
      price: '50000',
      filled_size: '0.02',
      average_price: '49995',
      status: 'OPEN',
      time_in_force: 'GTC',
      post_only: false,
      reduce_only: false,
      created_at: 1234567890000,
      updated_at: 1234567890100,
    };

    const normalized = normalizer.normalizeOrder(edgexOrder);

    expect(normalized).toMatchObject({
      id: '12345',
      clientOrderId: 'test-123',
      symbol: 'BTC/USDC:USDC',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      status: 'open',
    });
  });
});

describe('EdgeX Position Normalization', () => {
  test('normalizes long position', () => {
    const edgexPosition: EdgeXPosition = {
      market: 'BTC-USDC-PERP',
      side: 'LONG',
      size: '0.5',
      entry_price: '48000',
      mark_price: '50000',
      liquidation_price: '40000',
      unrealized_pnl: '1000',
      realized_pnl: '500',
      margin: '2400',
      leverage: '25',
      timestamp: 1234567890000,
    };

    const normalized = normalizer.normalizePosition(edgexPosition);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDC:USDC',
      side: 'long',
      marginMode: 'cross',
      size: 0.5,
      entryPrice: 48000,
      leverage: 25,
    });
  });
});

describe('EdgeX Conversion Functions', () => {
  test('converts order types', () => {
    expect(toEdgeXOrderType('market')).toBe('MARKET');
    expect(toEdgeXOrderType('limit')).toBe('LIMIT');
  });

  test('converts order sides', () => {
    expect(toEdgeXOrderSide('buy')).toBe('BUY');
    expect(toEdgeXOrderSide('sell')).toBe('SELL');
  });

  test('converts time in force', () => {
    expect(toEdgeXTimeInForce('GTC')).toBe('GTC');
    expect(toEdgeXTimeInForce('IOC')).toBe('IOC');
    expect(toEdgeXTimeInForce('FOK')).toBe('FOK');
  });
});
