/**
 * GRVT Utilities Unit Tests
 *
 * Covers the standalone pure normalizers over the REAL GRVT shapes (types.ts).
 */

import { describe, test, expect } from '@jest/globals';
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
  toGRVTOrderSide,
  toGRVTTimeInForce,
  mapGRVTError,
} from '../../src/adapters/grvt/utils.js';
import type {
  GRVTMarket,
  GRVTOrder,
  GRVTPosition,
  GRVTSpotBalance,
  GRVTOrderBook,
  GRVTTrade,
  GRVTTicker,
} from '../../src/adapters/grvt/types.js';

describe('GRVT Symbol Normalization', () => {
  describe('normalizeSymbol', () => {
    test('normalizes perpetual symbols', () => {
      expect(normalizeSymbol('BTC_USDT_Perp')).toBe('BTC/USDT:USDT');
      expect(normalizeSymbol('ETH_USDT_Perp')).toBe('ETH/USDT:USDT');
    });

    test('handles spot symbols', () => {
      expect(normalizeSymbol('BTC_USD')).toBe('BTC/USD');
    });
  });

  describe('toGRVTSymbol', () => {
    test('converts unified perpetual to GRVT format', () => {
      expect(toGRVTSymbol('BTC/USDT:USDT')).toBe('BTC_USDT_Perp');
      expect(toGRVTSymbol('ETH/USDT:USDT')).toBe('ETH_USDT_Perp');
    });

    test('converts unified spot to GRVT format', () => {
      expect(toGRVTSymbol('BTC/USD')).toBe('BTC_USD');
      expect(toGRVTSymbol('BTC/USDT')).toBe('BTC_USDT');
    });
  });
});

describe('GRVT Market Normalization', () => {
  test('normalizes instrument data (no fee fields; per-fill fees)', () => {
    const grvtMarket: GRVTMarket = {
      instrument: 'BTC_USDT_Perp',
      instrument_hash: '0x030501',
      base: 'BTC',
      quote: 'USDT',
      base_decimals: 9,
      quote_decimals: 6,
      tick_size: '0.5',
      min_size: '0.001',
      min_notional: '5',
      kind: 'PERPETUAL',
      is_active: true,
      funding_interval_hours: 8,
    };

    const market = normalizeMarket(grvtMarket);

    expect(market.id).toBe('BTC_USDT_Perp');
    expect(market.symbol).toBe('BTC/USDT:USDT');
    expect(market.base).toBe('BTC');
    expect(market.quote).toBe('USDT');
    expect(market.settle).toBe('USDT');
    expect(market.active).toBe(true);
    expect(market.minAmount).toBe(0.001);
    expect(market.priceTickSize).toBe(0.5);
    expect(market.minCost).toBe(5);
    expect(market.makerFee).toBe(0);
    expect(market.takerFee).toBe(0);
    expect(market.fundingIntervalHours).toBe(8);
  });
});

describe('GRVT Order Normalization', () => {
  test('normalizes a leg-based limit order', () => {
    const grvtOrder: GRVTOrder = {
      order_id: 'order-123',
      sub_account_id: 'sub-1',
      is_market: false,
      time_in_force: 'GOOD_TILL_TIME',
      post_only: true,
      reduce_only: false,
      legs: [{ instrument: 'BTC_USDT_Perp', size: '1.5', limit_price: '50000', is_buying_asset: true }],
      state: { status: 'OPEN', traded_size: ['0.5'], book_size: ['1.0'], avg_fill_price: ['49950'] },
      metadata: { client_order_id: 'cli-1', create_time: '1700000000000' },
    };

    const order = normalizeOrder(grvtOrder);

    expect(order.id).toBe('order-123');
    expect(order.clientOrderId).toBe('cli-1');
    expect(order.symbol).toBe('BTC/USDT:USDT');
    expect(order.type).toBe('limit');
    expect(order.side).toBe('buy');
    expect(order.amount).toBe(1.5);
    expect(order.price).toBe(50000);
    expect(order.filled).toBe(0.5);
    expect(order.remaining).toBe(1.0);
    expect(order.averagePrice).toBe(49950);
    expect(order.status).toBe('open');
    expect(order.postOnly).toBe(true);
    expect(order.timeInForce).toBe('GTC');
  });
});

describe('GRVT Position Normalization', () => {
  test('normalizes a long position', () => {
    const grvtPosition: GRVTPosition = {
      instrument: 'BTC_USDT_Perp',
      size: '2.5',
      notional: '125000',
      entry_price: '48000',
      mark_price: '50000',
      unrealized_pnl: '5000',
      realized_pnl: '1000',
      leverage: '10',
      est_liquidation_price: '45000',
    };

    const position = normalizePosition(grvtPosition);

    expect(position.symbol).toBe('BTC/USDT:USDT');
    expect(position.side).toBe('long');
    expect(position.size).toBe(2.5);
    expect(position.entryPrice).toBe(48000);
    expect(position.markPrice).toBe(50000);
    expect(position.liquidationPrice).toBe(45000);
    expect(position.leverage).toBe(10);
    expect(position.marginMode).toBe('cross');
  });

  test('normalizes a short position', () => {
    const grvtPosition: GRVTPosition = {
      instrument: 'ETH_USDT_Perp',
      size: '-10',
      entry_price: '3000',
      mark_price: '2900',
    };

    const position = normalizePosition(grvtPosition);
    expect(position.side).toBe('short');
    expect(position.size).toBe(10);
  });
});

describe('GRVT Balance Normalization', () => {
  test('normalizes a spot balance', () => {
    const grvtBalance: GRVTSpotBalance = { currency: 'USDT', balance: '10000.5' };
    const balance = normalizeBalance(grvtBalance);
    expect(balance.currency).toBe('USDT');
    expect(balance.total).toBe(10000.5);
    expect(balance.free).toBe(10000.5);
    expect(balance.used).toBe(0);
  });
});

describe('GRVT OrderBook Normalization', () => {
  test('normalizes a full snapshot with object levels', () => {
    const grvtOrderBook: GRVTOrderBook = {
      instrument: 'BTC_USDT_Perp',
      event_time: '1700000000000',
      bids: [{ price: '49990', size: '1.5', num_orders: 3 }],
      asks: [{ price: '50010', size: '1.0', num_orders: 2 }],
    };

    const book = normalizeOrderBook(grvtOrderBook);
    expect(book.symbol).toBe('BTC/USDT:USDT');
    expect(book.exchange).toBe('grvt');
    expect(book.bids[0]).toEqual([49990, 1.5]);
    expect(book.asks[0]).toEqual([50010, 1.0]);
  });
});

describe('GRVT Trade Normalization', () => {
  test('maps is_taker_buyer to side', () => {
    const grvtTrade: GRVTTrade = {
      event_time: '1700000000000',
      instrument: 'BTC_USDT_Perp',
      is_taker_buyer: true,
      size: '0.5',
      price: '50000',
      trade_id: '135831698-1',
    };

    const trade = normalizeTrade(grvtTrade);
    expect(trade.id).toBe('135831698-1');
    expect(trade.symbol).toBe('BTC/USDT:USDT');
    expect(trade.side).toBe('buy');
    expect(trade.price).toBe(50000);
    expect(trade.amount).toBe(0.5);
    expect(trade.cost).toBe(25000);
  });
});

describe('GRVT Ticker Normalization', () => {
  test('uses mark fallback + 24h quote volumes', () => {
    const grvtTicker: GRVTTicker = {
      instrument: 'BTC_USDT_Perp',
      mark_price: '50000',
      index_price: '49990',
      best_bid_price: '49990',
      best_bid_size: '1.5',
      best_ask_price: '50010',
      best_ask_size: '2.0',
      buy_volume_24h_q: '1000000',
      sell_volume_24h_q: '950000',
    };

    const ticker = normalizeTicker(grvtTicker);
    expect(ticker.symbol).toBe('BTC/USDT:USDT');
    expect(ticker.last).toBe(50000);
    expect(ticker.bid).toBe(49990);
    expect(ticker.ask).toBe(50010);
    expect(ticker.quoteVolume).toBe(1950000);
  });
});

describe('GRVT TIF / side converters', () => {
  test('toGRVTOrderSide', () => {
    expect(toGRVTOrderSide('buy')).toBe('BUY');
    expect(toGRVTOrderSide('sell')).toBe('SELL');
  });

  test('toGRVTTimeInForce maps to API strings (post_only => GOOD_TILL_TIME)', () => {
    expect(toGRVTTimeInForce('GTC')).toBe('GOOD_TILL_TIME');
    expect(toGRVTTimeInForce('IOC')).toBe('IMMEDIATE_OR_CANCEL');
    expect(toGRVTTimeInForce('FOK')).toBe('FILL_OR_KILL');
    expect(toGRVTTimeInForce('IOC', true)).toBe('GOOD_TILL_TIME');
  });
});

describe('mapGRVTError', () => {
  test('maps known numeric codes', () => {
    expect(mapGRVTError({ code: 1002 }).code).toBe('INSUFFICIENT_MARGIN');
    expect(mapGRVTError({ code: 2001 }).code).toBe('INVALID_SIGNATURE');
  });

  test('falls back to UNKNOWN_ERROR', () => {
    expect(mapGRVTError({ message: 'boom' }).code).toBe('UNKNOWN_ERROR');
    expect(mapGRVTError(null).code).toBe('UNKNOWN_ERROR');
  });
});
