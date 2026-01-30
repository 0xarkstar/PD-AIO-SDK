/**
 * Unit Tests for GRVTNormalizer
 *
 * Tests data normalization from SDK types to unified types
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTNormalizer } from '../../src/adapters/grvt/GRVTNormalizer.js';
import type {
  IInstrumentDisplay,
  IOrder,
  IPositions,
  ISpotBalance,
  IFill,
  ITicker,
  IOrderbookLevels,
  ITrade,
} from '@grvt/client/interfaces';

describe('GRVTNormalizer', () => {
  let normalizer: GRVTNormalizer;

  beforeEach(() => {
    normalizer = new GRVTNormalizer();
  });

  describe('Symbol Conversion', () => {
    describe('symbolToCCXT', () => {
      it('should convert PERP symbols correctly', () => {
        expect(normalizer.symbolToCCXT('BTC_USDT_Perp')).toBe('BTC/USDT:USDT');
        expect(normalizer.symbolToCCXT('ETH_USDT_Perp')).toBe('ETH/USDT:USDT');
      });

      it('should convert SPOT symbols correctly', () => {
        // GRVT uses BTC_USDT format for spot (no _Perp suffix)
        expect(normalizer.symbolToCCXT('BTC_USDT')).toBe('BTC/USDT');
        expect(normalizer.symbolToCCXT('ETH_USDT')).toBe('ETH/USDT');
      });

      it('should fallback to PERP for unknown formats', () => {
        expect(normalizer.symbolToCCXT('BTC')).toBe('BTC/USDT:USDT');
      });
    });

    describe('symbolFromCCXT', () => {
      it('should convert perpetual symbols correctly', () => {
        expect(normalizer.symbolFromCCXT('BTC/USDT:USDT')).toBe('BTC_USDT_Perp');
        expect(normalizer.symbolFromCCXT('ETH/USDT:USDT')).toBe('ETH_USDT_Perp');
      });

      it('should convert spot symbols correctly', () => {
        // GRVT uses BTC_USDT format for spot
        expect(normalizer.symbolFromCCXT('BTC/USDT')).toBe('BTC_USDT');
        expect(normalizer.symbolFromCCXT('ETH/USDT')).toBe('ETH_USDT');
      });
    });
  });

  describe('Market Normalization', () => {
    it('should normalize market correctly', () => {
      const grvtMarket: IInstrumentDisplay = {
        instrument: 'BTC_USDT_Perp',
        base: 'BTC',
        quote: 'USDT',
        tick_size: '0.5',
        min_size: '0.001',
        max_position_size: '100',
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
      expect(market.maxAmount).toBe(100);
      expect(market.priceTickSize).toBe(0.5);
      expect(market.fundingIntervalHours).toBe(8);
    });

    it('should normalize batch markets', () => {
      const markets: IInstrumentDisplay[] = [
        { instrument: 'BTC_USDT_Perp', base: 'BTC', quote: 'USDT' } as any,
        { instrument: 'ETH_USDT_Perp', base: 'ETH', quote: 'USDT' } as any,
      ];

      const normalized = normalizer.normalizeMarkets(markets);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].symbol).toBe('BTC/USDT:USDT');
      expect(normalized[1].symbol).toBe('ETH/USDT:USDT');
    });
  });

  describe('Order Normalization', () => {
    it('should normalize buy limit order', () => {
      const grvtOrder: IOrder = {
        order_id: 'order-123',
        sub_account_id: 'sub-123',
        is_market: false,
        post_only: false,
        reduce_only: false,
        legs: [
          {
            instrument: 'BTC_USDT_Perp',
            size: '1.5',
            limit_price: '50000',
            is_buying_asset: true,
          },
        ],
        state: {
          status: 'OPEN',
          traded_size: ['0.5'],
          book_size: ['1.0'],
          avg_fill_price: ['49950'],
          update_time: '1234567890000',
        },
        metadata: {
          client_order_id: 'client-123',
          create_time: '1234567890000',
        },
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
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(false);
    });

    it('should normalize market order', () => {
      const grvtOrder: IOrder = {
        order_id: 'order-456',
        is_market: true,
        legs: [
          {
            instrument: 'ETH_USDT_Perp',
            size: '10',
            is_buying_asset: false,
          },
        ],
        state: {
          status: 'FILLED',
          traded_size: ['10'],
          book_size: ['0'],
        },
      };

      const order = normalizer.normalizeOrder(grvtOrder);

      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.status).toBe('filled');
      expect(order.price).toBeUndefined();
    });
  });

  describe('Position Normalization', () => {
    it('should normalize long position', () => {
      const grvtPosition: IPositions = {
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
      expect(position.unrealizedPnl).toBe(5000);
      expect(position.realizedPnl).toBe(1000);
      expect(position.leverage).toBe(10);
      expect(position.marginMode).toBe('cross');
    });

    it('should normalize short position', () => {
      const grvtPosition: IPositions = {
        instrument: 'ETH_USDT_Perp',
        size: '-10',
        entry_price: '3000',
        mark_price: '2900',
        notional: '29000',
        unrealized_pnl: '1000',
        realized_pnl: '500',
        leverage: '5',
      };

      const position = normalizer.normalizePosition(grvtPosition);

      expect(position.side).toBe('short');
      expect(position.size).toBe(10); // Absolute value
    });
  });

  describe('Balance Normalization', () => {
    it('should normalize spot balance', () => {
      const grvtBalance: ISpotBalance = {
        currency: 'USDT',
        balance: '10000.50',
        index_price: '1.0',
      };

      const balance = normalizer.normalizeBalance(grvtBalance);

      expect(balance.currency).toBe('USDT');
      expect(balance.total).toBe(10000.5);
      expect(balance.free).toBe(10000.5);
      expect(balance.used).toBe(0);
    });

    it('should normalize batch balances', () => {
      const balances: ISpotBalance[] = [
        { currency: 'USDT', balance: '10000' } as any,
        { currency: 'BTC', balance: '0.5' } as any,
      ];

      const normalized = normalizer.normalizeBalances(balances);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].currency).toBe('USDT');
      expect(normalized[1].currency).toBe('BTC');
    });
  });

  describe('Trade Normalization', () => {
    it('should normalize public trade', () => {
      const grvtTrade: ITrade = {
        trade_id: 'trade-123',
        instrument: 'BTC_USDT_Perp',
        price: '50000',
        size: '0.5',
        is_taker_buyer: true,
        event_time: '1234567890000',
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

    it('should normalize user fill', () => {
      const grvtFill: IFill = {
        trade_id: 'fill-456',
        order_id: 'order-123',
        instrument: 'ETH_USDT_Perp',
        price: '3000',
        size: '2',
        is_buyer: false,
        is_taker: true,
        fee: '1.5',
        event_time: '1234567890000',
      };

      const trade = normalizer.normalizeFill(grvtFill);

      expect(trade.id).toBe('fill-456');
      expect(trade.orderId).toBe('order-123');
      expect(trade.symbol).toBe('ETH/USDT:USDT');
      expect(trade.side).toBe('sell');
      expect(trade.price).toBe(3000);
      expect(trade.amount).toBe(2);
      expect(trade.cost).toBe(6000);
    });
  });

  describe('Ticker Normalization', () => {
    it('should normalize ticker', () => {
      const grvtTicker: ITicker = {
        instrument: 'BTC_USDT_Perp',
        last_price: '50000',
        best_bid_price: '49990',
        best_bid_size: '1.5',
        best_ask_price: '50010',
        best_ask_size: '2.0',
        high_price: '51000',
        low_price: '49000',
        open_price: '49500',
        buy_volume_24h_b: '100',
        sell_volume_24h_b: '95',
        event_time: '1234567890000',
      };

      const ticker = normalizer.normalizeTicker(grvtTicker);

      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(ticker.last).toBe(50000);
      expect(ticker.bid).toBe(49990);
      expect(ticker.bidVolume).toBe(1.5);
      expect(ticker.ask).toBe(50010);
      expect(ticker.askVolume).toBe(2.0);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
      expect(ticker.open).toBe(49500);
      expect(ticker.close).toBe(50000);
      expect(ticker.change).toBe(500);
      expect(ticker.baseVolume).toBe(195); // 100 + 95
    });
  });

  describe('OrderBook Normalization', () => {
    it('should normalize order book', () => {
      const grvtOrderBook: IOrderbookLevels = {
        instrument: 'BTC_USDT_Perp',
        bids: [
          { price: '49990', size: '1.5', num_orders: 3 },
          { price: '49980', size: '2.0', num_orders: 5 },
        ],
        asks: [
          { price: '50010', size: '1.0', num_orders: 2 },
          { price: '50020', size: '1.5', num_orders: 4 },
        ],
        event_time: '1234567890000',
      };

      const orderBook = normalizer.normalizeOrderBook(grvtOrderBook);

      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.bids[0]).toEqual([49990, 1.5]);
      expect(orderBook.bids[1]).toEqual([49980, 2.0]);
      expect(orderBook.asks[0]).toEqual([50010, 1.0]);
      expect(orderBook.asks[1]).toEqual([50020, 1.5]);
      expect(orderBook.exchange).toBe('grvt');
    });

    it('should handle empty order book', () => {
      const grvtOrderBook: IOrderbookLevels = {
        instrument: 'ETH_USDT_Perp',
        bids: [],
        asks: [],
        event_time: '1234567890000',
      };

      const orderBook = normalizer.normalizeOrderBook(grvtOrderBook);

      expect(orderBook.bids).toEqual([]);
      expect(orderBook.asks).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid number conversion', () => {
      expect(() => {
        normalizer['toNumberSafe']('invalid');
      }).toThrow();
    });

    it('should handle zero values correctly', () => {
      expect(normalizer['toNumberSafe']('0')).toBe(0);
      expect(normalizer['toNumberSafe']('')).toBe(0);
    });

    it('should handle precision correctly', () => {
      const value = normalizer['toNumberSafe']('123.456789', 4);
      expect(value).toBe(123.4568); // Rounded to 4 decimals
    });
  });
});
