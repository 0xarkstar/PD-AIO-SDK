/**
 * Unit Tests for GRVTNormalizer
 *
 * Tests normalization from the REAL GRVT shapes (types.ts) to unified types.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTNormalizer } from '../../src/adapters/grvt/GRVTNormalizer.js';
import type {
  GRVTMarket,
  GRVTOrder,
  GRVTPosition,
  GRVTSpotBalance,
  GRVTFill,
  GRVTTicker,
  GRVTOrderBook,
  GRVTTrade,
  GRVTFunding,
} from '../../src/adapters/grvt/types.js';

describe('GRVTNormalizer', () => {
  let normalizer: GRVTNormalizer;

  beforeEach(() => {
    normalizer = new GRVTNormalizer();
  });

  describe('Symbol Conversion', () => {
    it('converts perpetual symbols both ways', () => {
      expect(normalizer.symbolToCCXT('BTC_USDT_Perp')).toBe('BTC/USDT:USDT');
      expect(normalizer.symbolToCCXT('ETH_USDT_Perp')).toBe('ETH/USDT:USDT');
      expect(normalizer.symbolFromCCXT('BTC/USDT:USDT')).toBe('BTC_USDT_Perp');
      expect(normalizer.symbolFromCCXT('ETH/USDT:USDT')).toBe('ETH_USDT_Perp');
    });

    it('converts spot symbols', () => {
      expect(normalizer.symbolToCCXT('BTC_USDT')).toBe('BTC/USDT');
      expect(normalizer.symbolFromCCXT('BTC/USDT')).toBe('BTC_USDT');
    });

    it('falls back to perp for bare symbols', () => {
      expect(normalizer.symbolToCCXT('BTC')).toBe('BTC/USDT:USDT');
    });
  });

  describe('Market Normalization', () => {
    it('normalizes an instrument (hash + base_decimals, no fees)', () => {
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

      const market = normalizer.normalizeMarket(grvtMarket);

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

    it('batch-normalizes markets', () => {
      const markets: GRVTMarket[] = [
        {
          instrument: 'BTC_USDT_Perp',
          instrument_hash: '0x030501',
          base: 'BTC',
          quote: 'USDT',
          base_decimals: 9,
          quote_decimals: 6,
          tick_size: '0.5',
          min_size: '0.001',
          kind: 'PERPETUAL',
        },
        {
          instrument: 'ETH_USDT_Perp',
          instrument_hash: '0x040501',
          base: 'ETH',
          quote: 'USDT',
          base_decimals: 9,
          quote_decimals: 6,
          tick_size: '0.05',
          min_size: '0.01',
          kind: 'PERPETUAL',
        },
      ];

      const normalized = normalizer.normalizeMarkets(markets);
      expect(normalized).toHaveLength(2);
      expect(normalized[0]!.symbol).toBe('BTC/USDT:USDT');
      expect(normalized[1]!.symbol).toBe('ETH/USDT:USDT');
    });
  });

  describe('Order Normalization', () => {
    it('normalizes a buy limit order', () => {
      const grvtOrder: GRVTOrder = {
        order_id: 'order-123',
        sub_account_id: 'sub-123',
        is_market: false,
        post_only: false,
        reduce_only: false,
        time_in_force: 'GOOD_TILL_TIME',
        legs: [{ instrument: 'BTC_USDT_Perp', size: '1.5', limit_price: '50000', is_buying_asset: true }],
        state: {
          status: 'OPEN',
          traded_size: ['0.5'],
          book_size: ['1.0'],
          avg_fill_price: ['49950'],
          update_time: '1234567890000',
        },
        metadata: { client_order_id: 'client-123', create_time: '1234567890000' },
      };

      const order = normalizer.normalizeOrder(grvtOrder);

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-123');
      expect(order.symbol).toBe('BTC/USDT:USDT');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(1.5);
      expect(order.price).toBe(50000);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(1.0);
      expect(order.averagePrice).toBe(49950);
      expect(order.timeInForce).toBe('GTC');
    });

    it('normalizes a market order', () => {
      const grvtOrder: GRVTOrder = {
        order_id: 'order-456',
        is_market: true,
        legs: [{ instrument: 'ETH_USDT_Perp', size: '10', is_buying_asset: false }],
        state: { status: 'FILLED', traded_size: ['10'], book_size: ['0'] },
      };

      const order = normalizer.normalizeOrder(grvtOrder);
      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.status).toBe('filled');
      expect(order.price).toBeUndefined();
    });

    it('batch-normalizes orders', () => {
      const orders: GRVTOrder[] = [
        {
          order_id: 'order-1',
          is_market: false,
          legs: [{ instrument: 'BTC_USDT_Perp', size: '1', is_buying_asset: true }],
          state: { status: 'OPEN' },
        },
        {
          order_id: 'order-2',
          is_market: true,
          legs: [{ instrument: 'ETH_USDT_Perp', size: '2', is_buying_asset: false }],
          state: { status: 'FILLED' },
        },
      ];

      const normalized = normalizer.normalizeOrders(orders);
      expect(normalized).toHaveLength(2);
      expect(normalized[0]!.id).toBe('order-1');
      expect(normalized[1]!.id).toBe('order-2');
    });
  });

  describe('Position Normalization', () => {
    it('normalizes a long position', () => {
      const grvtPosition: GRVTPosition = {
        instrument: 'BTC_USDT_Perp',
        size: '2.5',
        entry_price: '48000',
        mark_price: '50000',
        notional: '125000',
        unrealized_pnl: '5000',
        realized_pnl: '1000',
        leverage: '10',
        est_liquidation_price: '45000',
        event_time: '1234567890000',
      };

      const position = normalizer.normalizePosition(grvtPosition);
      expect(position.symbol).toBe('BTC/USDT:USDT');
      expect(position.side).toBe('long');
      expect(position.size).toBe(2.5);
      expect(position.entryPrice).toBe(48000);
      expect(position.markPrice).toBe(50000);
      expect(position.liquidationPrice).toBe(45000);
      expect(position.leverage).toBe(10);
      expect(position.marginMode).toBe('cross');
    });

    it('normalizes a short position', () => {
      const grvtPosition: GRVTPosition = {
        instrument: 'ETH_USDT_Perp',
        size: '-10',
        entry_price: '3000',
        mark_price: '2900',
      };
      const position = normalizer.normalizePosition(grvtPosition);
      expect(position.side).toBe('short');
      expect(position.size).toBe(10);
    });

    it('handles zero leverage (margin = 0)', () => {
      const position = normalizer.normalizePosition({
        instrument: 'BTC_USDT_Perp',
        size: '1',
        notional: '50000',
        leverage: '0',
      });
      expect(position.margin).toBe(0);
    });
  });

  describe('Balance Normalization', () => {
    it('normalizes a spot balance', () => {
      const grvtBalance: GRVTSpotBalance = { currency: 'USDT', balance: '10000.50' };
      const balance = normalizer.normalizeBalance(grvtBalance);
      expect(balance.currency).toBe('USDT');
      expect(balance.total).toBe(10000.5);
      expect(balance.free).toBe(10000.5);
      expect(balance.used).toBe(0);
    });

    it('batch-normalizes balances', () => {
      const balances: GRVTSpotBalance[] = [
        { currency: 'USDT', balance: '10000' },
        { currency: 'BTC', balance: '0.5' },
      ];
      const normalized = normalizer.normalizeBalances(balances);
      expect(normalized).toHaveLength(2);
      expect(normalized[0]!.currency).toBe('USDT');
      expect(normalized[1]!.currency).toBe('BTC');
    });
  });

  describe('Trade / Fill Normalization', () => {
    it('normalizes a public trade (is_taker_buyer => buy)', () => {
      const grvtTrade: GRVTTrade = {
        event_time: '1234567890000',
        instrument: 'BTC_USDT_Perp',
        is_taker_buyer: true,
        size: '0.5',
        price: '50000',
        trade_id: 'trade-123',
      };
      const trade = normalizer.normalizeTrade(grvtTrade);
      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USDT:USDT');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(25000);
      expect(trade.orderId).toBeUndefined();
    });

    it('normalizes a user fill (with fee; negative = maker rebate)', () => {
      const grvtFill: GRVTFill = {
        trade_id: 'fill-456',
        order_id: 'order-123',
        instrument: 'ETH_USDT_Perp',
        price: '3000',
        size: '2',
        is_buyer: false,
        is_taker: true,
        fee: '-1.5',
        event_time: '1234567890000',
      };
      const trade = normalizer.normalizeFill(grvtFill);
      expect(trade.id).toBe('fill-456');
      expect(trade.orderId).toBe('order-123');
      expect(trade.symbol).toBe('ETH/USDT:USDT');
      expect(trade.side).toBe('sell');
      expect(trade.cost).toBe(6000);
      expect(trade.fee).toEqual({ cost: -1.5, currency: 'USDT' });
    });
  });

  describe('Ticker Normalization', () => {
    it('normalizes a ticker with 24h quote volumes', () => {
      const grvtTicker: GRVTTicker = {
        instrument: 'BTC_USDT_Perp',
        mark_price: '50005',
        index_price: '49995',
        last_price: '50000',
        best_bid_price: '49990',
        best_bid_size: '1.5',
        best_ask_price: '50010',
        best_ask_size: '2.0',
        buy_volume_24h_q: '1000000',
        sell_volume_24h_q: '950000',
        event_time: '1234567890000',
      };

      const ticker = normalizer.normalizeTicker(grvtTicker);
      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(ticker.last).toBe(50000);
      expect(ticker.bid).toBe(49990);
      expect(ticker.bidVolume).toBe(1.5);
      expect(ticker.ask).toBe(50010);
      expect(ticker.askVolume).toBe(2.0);
      expect(ticker.quoteVolume).toBe(1950000);
    });

    it('falls back to mark_price when last_price absent', () => {
      const ticker = normalizer.normalizeTicker({
        instrument: 'BTC_USDT_Perp',
        mark_price: '50000',
      });
      expect(ticker.last).toBe(50000);
    });
  });

  describe('OrderBook Normalization', () => {
    it('normalizes a full snapshot with object levels', () => {
      const grvtOrderBook: GRVTOrderBook = {
        instrument: 'BTC_USDT_Perp',
        event_time: '1234567890000',
        bids: [
          { price: '49990', size: '1.5', num_orders: 3 },
          { price: '49980', size: '2.0', num_orders: 5 },
        ],
        asks: [
          { price: '50010', size: '1.0', num_orders: 2 },
          { price: '50020', size: '1.5', num_orders: 4 },
        ],
      };

      const book = normalizer.normalizeOrderBook(grvtOrderBook);
      expect(book.symbol).toBe('BTC/USDT:USDT');
      expect(book.exchange).toBe('grvt');
      expect(book.bids).toHaveLength(2);
      expect(book.asks).toHaveLength(2);
      expect(book.bids[0]).toEqual([49990, 1.5]);
      expect(book.asks[1]).toEqual([50020, 1.5]);
    });

    it('handles an empty book', () => {
      const book = normalizer.normalizeOrderBook({
        instrument: 'ETH_USDT_Perp',
        event_time: '1234567890000',
        bids: [],
        asks: [],
      });
      expect(book.bids).toEqual([]);
      expect(book.asks).toEqual([]);
    });
  });

  describe('Funding Normalization', () => {
    it('normalizes a funding entry', () => {
      const funding: GRVTFunding = {
        instrument: 'BTC_USDT_Perp',
        funding_rate: '0.0001',
        funding_time: '1700000000000',
        mark_price: '50000',
        index_price: '49990',
        funding_interval_hours: 8,
      };
      const result = normalizer.normalizeFundingRate(funding);
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.fundingRate).toBe(0.0001);
      expect(result.markPrice).toBe(50000);
      expect(result.indexPrice).toBe(49990);
      expect(result.fundingIntervalHours).toBe(8);
    });
  });
});
