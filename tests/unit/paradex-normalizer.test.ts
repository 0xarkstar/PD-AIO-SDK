/**
 * Unit Tests for ParadexNormalizer
 *
 * Tests data normalization from Paradex types to unified types
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParadexNormalizer } from '../../src/adapters/paradex/ParadexNormalizer.js';
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

describe('ParadexNormalizer', () => {
  let normalizer: ParadexNormalizer;

  beforeEach(() => {
    normalizer = new ParadexNormalizer();
  });

  describe('Symbol Conversion', () => {
    describe('symbolToCCXT', () => {
      it('should convert PERP symbols correctly', () => {
        expect(normalizer.symbolToCCXT('BTC-USD-PERP')).toBe('BTC/USD:USD');
        expect(normalizer.symbolToCCXT('ETH-USD-PERP')).toBe('ETH/USD:USD');
        expect(normalizer.symbolToCCXT('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
      });

      it('should convert SPOT symbols correctly', () => {
        expect(normalizer.symbolToCCXT('BTC-USD')).toBe('BTC/USD');
        expect(normalizer.symbolToCCXT('ETH-USDC')).toBe('ETH/USDC');
      });
    });

    describe('symbolFromCCXT', () => {
      it('should convert perpetual symbols correctly', () => {
        expect(normalizer.symbolFromCCXT('BTC/USD:USD')).toBe('BTC-USD-PERP');
        expect(normalizer.symbolFromCCXT('ETH/USD:USD')).toBe('ETH-USD-PERP');
        expect(normalizer.symbolFromCCXT('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
      });

      it('should convert spot symbols correctly', () => {
        expect(normalizer.symbolFromCCXT('BTC/USD')).toBe('BTC-USD');
        expect(normalizer.symbolFromCCXT('ETH/USDC')).toBe('ETH-USDC');
      });
    });

    it('should be bidirectional', () => {
      const ccxtSymbol = 'BTC/USD:USD';
      const paradexSymbol = 'BTC-USD-PERP';

      expect(normalizer.symbolFromCCXT(ccxtSymbol)).toBe(paradexSymbol);
      expect(normalizer.symbolToCCXT(paradexSymbol)).toBe(ccxtSymbol);
    });
  });

  describe('Market Normalization', () => {
    it('should normalize market correctly', () => {
      const paradexMarket: ParadexMarket = {
        symbol: 'BTC-USD-PERP',
        base_currency: 'BTC',
        quote_currency: 'USD',
        settlement_currency: 'USD',
        is_active: true,
        min_order_size: '0.001',
        tick_size: '0.5',
        step_size: '0.001',
        maker_fee_rate: '0.0002',
        taker_fee_rate: '0.0005',
        max_leverage: '50',
      };

      const market = normalizer.normalizeMarket(paradexMarket);

      expect(market.id).toBe('BTC-USD-PERP');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.priceTickSize).toBe(0.5);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.pricePrecision).toBe(1); // '0.5' has 1 decimal
      expect(market.amountPrecision).toBe(3); // '0.001' has 3 decimals
      expect(market.makerFee).toBe(0.0002);
      expect(market.takerFee).toBe(0.0005);
      expect(market.maxLeverage).toBe(50);
      expect(market.fundingIntervalHours).toBe(8);
    });

    it('should normalize batch markets', () => {
      const markets: ParadexMarket[] = [
        {
          symbol: 'BTC-USD-PERP',
          base_currency: 'BTC',
          quote_currency: 'USD',
          settlement_currency: 'USD',
          is_active: true,
          min_order_size: '0.001',
          tick_size: '0.5',
          step_size: '0.001',
          maker_fee_rate: '0.0002',
          taker_fee_rate: '0.0005',
          max_leverage: '50',
        },
        {
          symbol: 'ETH-USD-PERP',
          base_currency: 'ETH',
          quote_currency: 'USD',
          settlement_currency: 'USD',
          is_active: true,
          min_order_size: '0.01',
          tick_size: '0.1',
          step_size: '0.01',
          maker_fee_rate: '0.0002',
          taker_fee_rate: '0.0005',
          max_leverage: '50',
        },
      ];

      const normalized = normalizer.normalizeMarkets(markets);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].symbol).toBe('BTC/USD:USD');
      expect(normalized[1].symbol).toBe('ETH/USD:USD');
    });
  });

  describe('Order Normalization', () => {
    it('should normalize buy limit order', () => {
      const paradexOrder: ParadexOrder = {
        id: 'order-123',
        client_id: 'client-123',
        market: 'BTC-USD-PERP',
        type: 'LIMIT',
        side: 'BUY',
        size: '1.5',
        price: '50000',
        filled_size: '0.5',
        avg_fill_price: '49950',
        status: 'OPEN',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: 1234567890000,
        updated_at: 1234567890000,
      };

      const order = normalizer.normalizeOrder(paradexOrder);

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(1.5);
      expect(order.price).toBe(50000);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(1.0);
      expect(order.averagePrice).toBe(49950);
      expect(order.timeInForce).toBe('GTC');
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(false);
      expect(order.timestamp).toBe(1234567890000);
    });

    it('should normalize market order', () => {
      const paradexOrder: ParadexOrder = {
        id: 'order-456',
        market: 'ETH-USD-PERP',
        type: 'MARKET',
        side: 'SELL',
        size: '10',
        filled_size: '10',
        status: 'FILLED',
        time_in_force: 'IOC',
        post_only: false,
        reduce_only: false,
        created_at: 1234567890000,
        updated_at: 1234567890000,
      };

      const order = normalizer.normalizeOrder(paradexOrder);

      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.status).toBe('filled');
      expect(order.price).toBeUndefined();
      expect(order.timeInForce).toBe('IOC');
    });

    it('should normalize order with LIMIT_MAKER type', () => {
      const paradexOrder: ParadexOrder = {
        id: 'order-789',
        market: 'BTC-USD-PERP',
        type: 'LIMIT_MAKER',
        side: 'BUY',
        size: '1',
        price: '50000',
        filled_size: '0',
        status: 'OPEN',
        time_in_force: 'POST_ONLY',
        post_only: true,
        reduce_only: false,
        created_at: 1234567890000,
        updated_at: 1234567890000,
      };

      const order = normalizer.normalizeOrder(paradexOrder);

      expect(order.type).toBe('limit');
      expect(order.postOnly).toBe(true);
      expect(order.timeInForce).toBe('PO');
    });

    it('should handle all order statuses', () => {
      const statuses = ['PENDING', 'OPEN', 'PARTIAL', 'FILLED', 'CANCELLED', 'REJECTED'];
      const expected = ['open', 'open', 'partiallyFilled', 'filled', 'canceled', 'rejected'];

      statuses.forEach((status, index) => {
        const paradexOrder: ParadexOrder = {
          id: `order-${index}`,
          market: 'BTC-USD-PERP',
          type: 'LIMIT',
          side: 'BUY',
          size: '1',
          price: '50000',
          filled_size: '0',
          status,
          time_in_force: 'GTC',
          post_only: false,
          reduce_only: false,
          created_at: 1234567890000,
          updated_at: 1234567890000,
        };

        const order = normalizer.normalizeOrder(paradexOrder);
        expect(order.status).toBe(expected[index]);
      });
    });

    it('should normalize batch orders', () => {
      const orders: ParadexOrder[] = [
        {
          id: 'order-1',
          market: 'BTC-USD-PERP',
          type: 'LIMIT',
          side: 'BUY',
          size: '1',
          price: '50000',
          filled_size: '0',
          status: 'OPEN',
          time_in_force: 'GTC',
          post_only: false,
          reduce_only: false,
          created_at: 1234567890000,
          updated_at: 1234567890000,
        },
        {
          id: 'order-2',
          market: 'ETH-USD-PERP',
          type: 'MARKET',
          side: 'SELL',
          size: '10',
          filled_size: '10',
          status: 'FILLED',
          time_in_force: 'IOC',
          post_only: false,
          reduce_only: false,
          created_at: 1234567890000,
          updated_at: 1234567890000,
        },
      ];

      const normalized = normalizer.normalizeOrders(orders);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].id).toBe('order-1');
      expect(normalized[1].id).toBe('order-2');
    });
  });

  describe('Position Normalization', () => {
    it('should normalize long position', () => {
      const paradexPosition: ParadexPosition = {
        market: 'BTC-USD-PERP',
        side: 'LONG',
        size: '2.5',
        entry_price: '48000',
        mark_price: '50000',
        liquidation_price: '45000',
        unrealized_pnl: '5000',
        realized_pnl: '1000',
        margin: '10000',
        leverage: '5',
        last_updated: 1234567890000,
      };

      const position = normalizer.normalizePosition(paradexPosition);

      expect(position.symbol).toBe('BTC/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(2.5);
      expect(position.entryPrice).toBe(48000);
      expect(position.markPrice).toBe(50000);
      expect(position.liquidationPrice).toBe(45000);
      expect(position.unrealizedPnl).toBe(5000);
      expect(position.realizedPnl).toBe(1000);
      expect(position.margin).toBe(10000);
      expect(position.leverage).toBe(5);
      expect(position.marginMode).toBe('cross');
      expect(position.maintenanceMargin).toBe(250); // 10000 * 0.025
      expect(position.timestamp).toBe(1234567890000);
    });

    it('should normalize short position', () => {
      const paradexPosition: ParadexPosition = {
        market: 'ETH-USD-PERP',
        side: 'SHORT',
        size: '-10',
        entry_price: '3000',
        mark_price: '2900',
        liquidation_price: '3200',
        unrealized_pnl: '1000',
        realized_pnl: '500',
        margin: '5000',
        leverage: '10',
        last_updated: 1234567890000,
      };

      const position = normalizer.normalizePosition(paradexPosition);

      expect(position.side).toBe('short');
      expect(position.size).toBe(10); // Absolute value
      expect(position.leverage).toBe(10);
    });

    it('should handle missing liquidation price', () => {
      const paradexPosition: ParadexPosition = {
        market: 'BTC-USD-PERP',
        side: 'LONG',
        size: '1',
        entry_price: '50000',
        mark_price: '50000',
        unrealized_pnl: '0',
        realized_pnl: '0',
        margin: '1000',
        leverage: '1',
        last_updated: 1234567890000,
      };

      const position = normalizer.normalizePosition(paradexPosition);

      expect(position.liquidationPrice).toBe(0);
    });

    it('should normalize batch positions', () => {
      const positions: ParadexPosition[] = [
        {
          market: 'BTC-USD-PERP',
          side: 'LONG',
          size: '1',
          entry_price: '50000',
          mark_price: '50000',
          unrealized_pnl: '0',
          realized_pnl: '0',
          margin: '1000',
          leverage: '1',
          last_updated: 1234567890000,
        },
        {
          market: 'ETH-USD-PERP',
          side: 'SHORT',
          size: '-10',
          entry_price: '3000',
          mark_price: '3000',
          unrealized_pnl: '0',
          realized_pnl: '0',
          margin: '5000',
          leverage: '10',
          last_updated: 1234567890000,
        },
      ];

      const normalized = normalizer.normalizePositions(positions);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].symbol).toBe('BTC/USD:USD');
      expect(normalized[1].symbol).toBe('ETH/USD:USD');
    });
  });

  describe('Balance Normalization', () => {
    it('should normalize balance', () => {
      const paradexBalance: ParadexBalance = {
        asset: 'USD',
        total: '10000.50',
        available: '9500.00',
        locked: '500.50',
      };

      const balance = normalizer.normalizeBalance(paradexBalance);

      expect(balance.currency).toBe('USD');
      expect(balance.total).toBe(10000.5);
      expect(balance.free).toBe(9500);
      expect(balance.used).toBe(500.5);
    });

    it('should normalize batch balances', () => {
      const balances: ParadexBalance[] = [
        { asset: 'USD', total: '10000', available: '9500', locked: '500' },
        { asset: 'BTC', total: '0.5', available: '0.3', locked: '0.2' },
      ];

      const normalized = normalizer.normalizeBalances(balances);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].currency).toBe('USD');
      expect(normalized[1].currency).toBe('BTC');
    });
  });

  describe('Trade Normalization', () => {
    it('should normalize buy trade', () => {
      const paradexTrade: ParadexTrade = {
        id: 'trade-123',
        market: 'BTC-USD-PERP',
        price: '50000',
        size: '0.5',
        side: 'BUY',
        timestamp: 1234567890000,
      };

      const trade = normalizer.normalizeTrade(paradexTrade);

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(25000);
      expect(trade.timestamp).toBe(1234567890000);
    });

    it('should normalize sell trade', () => {
      const paradexTrade: ParadexTrade = {
        id: 'trade-456',
        market: 'ETH-USD-PERP',
        price: '3000',
        size: '2',
        side: 'SELL',
        timestamp: 1234567890000,
      };

      const trade = normalizer.normalizeTrade(paradexTrade);

      expect(trade.side).toBe('sell');
      expect(trade.cost).toBe(6000);
    });

    it('should normalize batch trades', () => {
      const trades: ParadexTrade[] = [
        {
          id: 'trade-1',
          market: 'BTC-USD-PERP',
          price: '50000',
          size: '0.5',
          side: 'BUY',
          timestamp: 1234567890000,
        },
        {
          id: 'trade-2',
          market: 'ETH-USD-PERP',
          price: '3000',
          size: '2',
          side: 'SELL',
          timestamp: 1234567890000,
        },
      ];

      const normalized = normalizer.normalizeTrades(trades);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].id).toBe('trade-1');
      expect(normalized[1].id).toBe('trade-2');
    });
  });

  describe('Ticker Normalization', () => {
    it('should normalize ticker', () => {
      const paradexTicker: ParadexTicker = {
        market: 'BTC-USD-PERP',
        last_price: '50000',
        bid: '49990',
        ask: '50010',
        high_24h: '51000',
        low_24h: '49000',
        volume_24h: '1000',
        price_change_24h: '500',
        price_change_percent_24h: '1.01',
        timestamp: 1234567890000,
      };

      const ticker = normalizer.normalizeTicker(paradexTicker);

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50000);
      expect(ticker.bid).toBe(49990);
      expect(ticker.ask).toBe(50010);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
      expect(ticker.open).toBe(49500); // 50000 - 500
      expect(ticker.close).toBe(50000);
      expect(ticker.change).toBe(500);
      expect(ticker.percentage).toBe(1.01);
      expect(ticker.baseVolume).toBe(1000);
      expect(ticker.timestamp).toBe(1234567890000);
    });

    it('should normalize batch tickers', () => {
      const tickers: ParadexTicker[] = [
        {
          market: 'BTC-USD-PERP',
          last_price: '50000',
          bid: '49990',
          ask: '50010',
          high_24h: '51000',
          low_24h: '49000',
          volume_24h: '1000',
          price_change_24h: '500',
          price_change_percent_24h: '1.01',
          timestamp: 1234567890000,
        },
        {
          market: 'ETH-USD-PERP',
          last_price: '3000',
          bid: '2999',
          ask: '3001',
          high_24h: '3100',
          low_24h: '2900',
          volume_24h: '5000',
          price_change_24h: '50',
          price_change_percent_24h: '1.69',
          timestamp: 1234567890000,
        },
      ];

      const normalized = normalizer.normalizeTickers(tickers);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].symbol).toBe('BTC/USD:USD');
      expect(normalized[1].symbol).toBe('ETH/USD:USD');
    });
  });

  describe('OrderBook Normalization', () => {
    it('should normalize order book', () => {
      const paradexOrderBook: ParadexOrderBook = {
        market: 'BTC-USD-PERP',
        bids: [
          ['49990', '1.5'],
          ['49980', '2.0'],
        ],
        asks: [
          ['50010', '1.0'],
          ['50020', '1.5'],
        ],
        timestamp: 1234567890000,
      };

      const orderBook = normalizer.normalizeOrderBook(paradexOrderBook);

      expect(orderBook.symbol).toBe('BTC/USD:USD');
      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.bids[0]).toEqual([49990, 1.5]);
      expect(orderBook.bids[1]).toEqual([49980, 2.0]);
      expect(orderBook.asks[0]).toEqual([50010, 1.0]);
      expect(orderBook.asks[1]).toEqual([50020, 1.5]);
      expect(orderBook.exchange).toBe('paradex');
      expect(orderBook.timestamp).toBe(1234567890000);
    });

    it('should handle empty order book', () => {
      const paradexOrderBook: ParadexOrderBook = {
        market: 'ETH-USD-PERP',
        bids: [],
        asks: [],
        timestamp: 1234567890000,
      };

      const orderBook = normalizer.normalizeOrderBook(paradexOrderBook);

      expect(orderBook.bids).toEqual([]);
      expect(orderBook.asks).toEqual([]);
    });
  });

  describe('Funding Rate Normalization', () => {
    it('should normalize funding rate', () => {
      const paradexFunding: ParadexFundingRate = {
        market: 'BTC-USD-PERP',
        rate: '0.0001',
        mark_price: '50000',
        index_price: '50010',
        timestamp: 1234567890000,
        next_funding_time: 1234596690000,
      };

      const fundingRate = normalizer.normalizeFundingRate(paradexFunding);

      expect(fundingRate.symbol).toBe('BTC/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(50000);
      expect(fundingRate.indexPrice).toBe(50010);
      expect(fundingRate.fundingTimestamp).toBe(1234567890000);
      expect(fundingRate.nextFundingTimestamp).toBe(1234596690000);
      expect(fundingRate.fundingIntervalHours).toBe(8);
    });

    it('should normalize batch funding rates', () => {
      const fundingRates: ParadexFundingRate[] = [
        {
          market: 'BTC-USD-PERP',
          rate: '0.0001',
          mark_price: '50000',
          index_price: '50010',
          timestamp: 1234567890000,
          next_funding_time: 1234596690000,
        },
        {
          market: 'ETH-USD-PERP',
          rate: '0.0002',
          mark_price: '3000',
          index_price: '3005',
          timestamp: 1234567890000,
          next_funding_time: 1234596690000,
        },
      ];

      const normalized = normalizer.normalizeFundingRates(fundingRates);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].symbol).toBe('BTC/USD:USD');
      expect(normalized[1].symbol).toBe('ETH/USD:USD');
    });
  });

  describe('Reverse Conversion (To Paradex)', () => {
    it('should convert order type to Paradex format', () => {
      expect(normalizer.toParadexOrderType('market')).toBe('MARKET');
      expect(normalizer.toParadexOrderType('limit')).toBe('LIMIT');
      expect(normalizer.toParadexOrderType('limit', true)).toBe('LIMIT_MAKER');
    });

    it('should convert order side to Paradex format', () => {
      expect(normalizer.toParadexOrderSide('buy')).toBe('BUY');
      expect(normalizer.toParadexOrderSide('sell')).toBe('SELL');
    });

    it('should convert time in force to Paradex format', () => {
      expect(normalizer.toParadexTimeInForce('GTC')).toBe('GTC');
      expect(normalizer.toParadexTimeInForce('IOC')).toBe('IOC');
      expect(normalizer.toParadexTimeInForce('FOK')).toBe('FOK');
      expect(normalizer.toParadexTimeInForce('PO')).toBe('POST_ONLY');
      expect(normalizer.toParadexTimeInForce(undefined)).toBe('GTC');
      expect(normalizer.toParadexTimeInForce(undefined, true)).toBe('POST_ONLY');
    });
  });

  // Error Handling tests removed - toNumberSafe and countDecimals were unused private methods removed during cleanup
});
