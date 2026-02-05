/**
 * Lighter Normalizer Unit Tests
 *
 * Tests for the LighterNormalizer class that transforms
 * Lighter-specific data structures to unified SDK format.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LighterNormalizer } from '../../src/adapters/lighter/LighterNormalizer.js';
import type {
  LighterOrder,
  LighterPosition,
  LighterBalance,
  LighterOrderBook,
  LighterTrade,
  LighterFundingRate,
} from '../../src/adapters/lighter/types.js';

describe('LighterNormalizer', () => {
  let normalizer: LighterNormalizer;

  beforeEach(() => {
    normalizer = new LighterNormalizer();
  });

  describe('toLighterSymbol', () => {
    it('should convert unified perpetual symbol to Lighter format', () => {
      expect(normalizer.toLighterSymbol('BTC/USDC:USDC')).toBe('BTC');
      expect(normalizer.toLighterSymbol('ETH/USDC:USDC')).toBe('ETH');
    });

    it('should handle spot symbol format', () => {
      expect(normalizer.toLighterSymbol('BTC/USDC')).toBe('BTC');
    });

    it('should handle already simple symbol', () => {
      expect(normalizer.toLighterSymbol('BTC')).toBe('BTC');
    });

    it('should handle empty or malformed input', () => {
      expect(normalizer.toLighterSymbol('')).toBe('');
    });
  });

  describe('normalizeSymbol', () => {
    it('should convert Lighter symbol to unified format', () => {
      expect(normalizer.normalizeSymbol('BTC')).toBe('BTC/USDC:USDC');
      expect(normalizer.normalizeSymbol('ETH')).toBe('ETH/USDC:USDC');
      expect(normalizer.normalizeSymbol('SOL')).toBe('SOL/USDC:USDC');
    });
  });

  describe('symbol conversion round-trip', () => {
    const symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB'];

    symbols.forEach((lighterSymbol) => {
      it(`should round-trip ${lighterSymbol}`, () => {
        const unified = normalizer.normalizeSymbol(lighterSymbol);
        const backToLighter = normalizer.toLighterSymbol(unified);
        expect(backToLighter).toBe(lighterSymbol);
      });
    });
  });

  describe('normalizeMarket', () => {
    it('should normalize market with full data', () => {
      const lighterMarket = {
        symbol: 'BTC',
        market_type: 'perp',
        status: 'active',
        supported_price_decimals: 2,
        supported_size_decimals: 4,
        min_base_amount: '0.001',
        min_quote_amount: '10',
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        default_initial_margin_fraction: 500, // 20x leverage
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.id).toBe('BTC');
      expect(market.symbol).toBe('BTC/USDC:USDC');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDC');
      expect(market.settle).toBe('USDC');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.pricePrecision).toBe(2);
      expect(market.amountPrecision).toBe(4);
      expect(market.makerFee).toBe(0.0002);
      expect(market.takerFee).toBe(0.0005);
      expect(market.maxLeverage).toBe(20);
      expect(market.fundingIntervalHours).toBe(8);
    });

    it('should handle inactive market', () => {
      const lighterMarket = {
        symbol: 'ETH',
        status: 'inactive',
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.active).toBe(false);
    });

    it('should use defaults for missing data', () => {
      const lighterMarket = {
        symbol: 'SOL',
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.pricePrecision).toBe(2);
      expect(market.amountPrecision).toBe(4);
      expect(market.minAmount).toBe(0);
      expect(market.makerFee).toBe(0);
      expect(market.takerFee).toBe(0);
      expect(market.maxLeverage).toBe(20);
    });

    it('should calculate tick size from precision', () => {
      const lighterMarket = {
        symbol: 'BTC',
        supported_price_decimals: 3,
        supported_size_decimals: 5,
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.priceTickSize).toBeCloseTo(0.001, 5);
      expect(market.amountStepSize).toBeCloseTo(0.00001, 7);
    });

    it('should handle alternative field names', () => {
      const lighterMarket = {
        symbol: 'AVAX',
        price_decimals: 4,
        size_decimals: 3,
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.pricePrecision).toBe(4);
      expect(market.amountPrecision).toBe(3);
    });
  });

  describe('normalizeOrder', () => {
    it('should normalize open order', () => {
      const lighterOrder: LighterOrder = {
        orderId: 'order-123',
        clientOrderId: 'client-456',
        symbol: 'BTC',
        type: 'limit',
        side: 'buy',
        price: 50000,
        size: 0.1,
        filledSize: 0,
        status: 'open',
        timestamp: 1700000000000,
        reduceOnly: false,
      };

      const order = normalizer.normalizeOrder(lighterOrder);

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-456');
      expect(order.symbol).toBe('BTC/USDC:USDC');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.price).toBe(50000);
      expect(order.amount).toBe(0.1);
      expect(order.filled).toBe(0);
      expect(order.remaining).toBe(0.1);
      expect(order.status).toBe('open');
      expect(order.timestamp).toBe(1700000000000);
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(false);
    });

    it('should normalize partially filled order', () => {
      const lighterOrder: LighterOrder = {
        orderId: 'order-789',
        symbol: 'ETH',
        type: 'limit',
        side: 'sell',
        price: 3000,
        size: 1.0,
        filledSize: 0.5,
        status: 'partially_filled',
        timestamp: 1700000001000,
        reduceOnly: false,
      };

      const order = normalizer.normalizeOrder(lighterOrder);

      expect(order.status).toBe('open');
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(0.5);
    });

    it('should normalize filled order', () => {
      const lighterOrder: LighterOrder = {
        orderId: 'order-filled',
        symbol: 'BTC',
        type: 'market',
        side: 'buy',
        price: 51000,
        size: 0.2,
        filledSize: 0.2,
        status: 'filled',
        timestamp: 1700000002000,
        reduceOnly: true,
      };

      const order = normalizer.normalizeOrder(lighterOrder);

      expect(order.status).toBe('closed');
      expect(order.filled).toBe(0.2);
      expect(order.remaining).toBe(0);
      expect(order.reduceOnly).toBe(true);
    });

    it('should normalize cancelled order', () => {
      const lighterOrder: LighterOrder = {
        orderId: 'order-cancelled',
        symbol: 'SOL',
        type: 'limit',
        side: 'sell',
        price: 100,
        size: 10,
        filledSize: 2,
        status: 'cancelled',
        timestamp: 1700000003000,
        reduceOnly: false,
      };

      const order = normalizer.normalizeOrder(lighterOrder);

      expect(order.status).toBe('canceled');
      expect(order.filled).toBe(2);
      expect(order.remaining).toBe(8);
    });
  });

  describe('normalizePosition', () => {
    it('should normalize long position', () => {
      const lighterPosition: LighterPosition = {
        symbol: 'BTC',
        side: 'long',
        size: 0.5,
        entryPrice: 50000,
        markPrice: 51000,
        liquidationPrice: 45000,
        unrealizedPnl: 500,
        margin: 5000,
        leverage: 10,
      };

      const position = normalizer.normalizePosition(lighterPosition);

      expect(position.symbol).toBe('BTC/USDC:USDC');
      expect(position.side).toBe('long');
      expect(position.size).toBe(0.5);
      expect(position.entryPrice).toBe(50000);
      expect(position.markPrice).toBe(51000);
      expect(position.liquidationPrice).toBe(45000);
      expect(position.unrealizedPnl).toBe(500);
      expect(position.realizedPnl).toBe(0);
      expect(position.margin).toBe(5000);
      expect(position.leverage).toBe(10);
      expect(position.marginMode).toBe('cross');
      expect(position.maintenanceMargin).toBe(2500); // 50% of margin
    });

    it('should normalize short position', () => {
      const lighterPosition: LighterPosition = {
        symbol: 'ETH',
        side: 'short',
        size: 2,
        entryPrice: 3000,
        markPrice: 2900,
        liquidationPrice: 3500,
        unrealizedPnl: 200,
        margin: 1200,
        leverage: 5,
      };

      const position = normalizer.normalizePosition(lighterPosition);

      expect(position.side).toBe('short');
      expect(position.leverage).toBe(5);
    });
  });

  describe('normalizeBalance', () => {
    it('should normalize balance', () => {
      const lighterBalance: LighterBalance = {
        currency: 'USDC',
        total: 10000,
        available: 8000,
        reserved: 2000,
      };

      const balance = normalizer.normalizeBalance(lighterBalance);

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(10000);
      expect(balance.free).toBe(8000);
      expect(balance.used).toBe(2000);
    });

    it('should normalize zero balance', () => {
      const lighterBalance: LighterBalance = {
        currency: 'USDC',
        total: 0,
        available: 0,
        reserved: 0,
      };

      const balance = normalizer.normalizeBalance(lighterBalance);

      expect(balance.total).toBe(0);
      expect(balance.free).toBe(0);
      expect(balance.used).toBe(0);
    });
  });

  describe('normalizeOrderBook', () => {
    it('should normalize order book', () => {
      const lighterOrderBook: LighterOrderBook = {
        symbol: 'BTC',
        bids: [
          [49900, 1.5],
          [49800, 2.0],
        ],
        asks: [
          [50100, 1.2],
          [50200, 1.8],
        ],
        timestamp: 1700000000000,
      };

      const orderBook = normalizer.normalizeOrderBook(lighterOrderBook);

      expect(orderBook.symbol).toBe('BTC/USDC:USDC');
      expect(orderBook.exchange).toBe('lighter');
      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.bids[0]).toEqual([49900, 1.5]);
      expect(orderBook.asks[0]).toEqual([50100, 1.2]);
      expect(orderBook.timestamp).toBe(1700000000000);
    });

    it('should handle empty order book', () => {
      const lighterOrderBook: LighterOrderBook = {
        symbol: 'ETH',
        bids: [],
        asks: [],
        timestamp: 1700000001000,
      };

      const orderBook = normalizer.normalizeOrderBook(lighterOrderBook);

      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });
  });

  describe('normalizeTrade', () => {
    it('should normalize trade', () => {
      const lighterTrade: LighterTrade = {
        id: 'trade-123',
        symbol: 'BTC',
        side: 'buy',
        price: 50000,
        amount: 0.5,
        timestamp: 1700000000000,
      };

      const trade = normalizer.normalizeTrade(lighterTrade);

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USDC:USDC');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(25000);
      expect(trade.timestamp).toBe(1700000000000);
    });

    it('should normalize sell trade', () => {
      const lighterTrade: LighterTrade = {
        id: 'trade-456',
        symbol: 'ETH',
        side: 'sell',
        price: 3000,
        amount: 2.5,
        timestamp: 1700000001000,
      };

      const trade = normalizer.normalizeTrade(lighterTrade);

      expect(trade.side).toBe('sell');
      expect(trade.cost).toBe(7500);
    });
  });

  describe('normalizeTicker', () => {
    it('should normalize ticker with full data', () => {
      const lighterTicker = {
        symbol: 'BTC',
        last_trade_price: '50000.50',
        daily_price_high: '51000.00',
        daily_price_low: '49000.00',
        daily_base_token_volume: '1000.5',
        daily_quote_token_volume: '50000000',
        daily_price_change: '2.5',
      };

      const ticker = normalizer.normalizeTicker(lighterTicker);

      expect(ticker.symbol).toBe('BTC/USDC:USDC');
      expect(ticker.last).toBe(50000.5);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
      expect(ticker.baseVolume).toBe(1000.5);
      expect(ticker.quoteVolume).toBe(50000000);
      expect(ticker.change).toBe(2.5);
      expect(ticker.percentage).toBe(2.5);
    });

    it('should handle missing data with defaults', () => {
      const lighterTicker = {
        symbol: 'ETH',
      };

      const ticker = normalizer.normalizeTicker(lighterTicker);

      expect(ticker.last).toBe(0);
      expect(ticker.high).toBe(0);
      expect(ticker.low).toBe(0);
      expect(ticker.baseVolume).toBe(0);
      expect(ticker.quoteVolume).toBe(0);
      expect(ticker.change).toBe(0);
    });

    it('should calculate open price from change', () => {
      const lighterTicker = {
        symbol: 'SOL',
        last_trade_price: '102',
        daily_price_high: '105',
        daily_price_change: '2', // 2% increase
      };

      const ticker = normalizer.normalizeTicker(lighterTicker);

      // open = last / (1 + change/100) = 102 / 1.02 = 100
      expect(ticker.open).toBeCloseTo(100, 1);
      expect(ticker.close).toBe(102);
    });
  });

  describe('normalizeFundingRate', () => {
    it('should normalize funding rate', () => {
      const lighterFundingRate: LighterFundingRate = {
        symbol: 'BTC',
        fundingRate: 0.0001,
        nextFundingTime: 1700000000000,
        markPrice: 50000,
      };

      const fundingRate = normalizer.normalizeFundingRate(lighterFundingRate);

      expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.fundingTimestamp).toBe(1700000000000);
      expect(fundingRate.nextFundingTimestamp).toBe(1700000000000);
      expect(fundingRate.markPrice).toBe(50000);
      expect(fundingRate.indexPrice).toBe(50000); // Uses mark price as fallback
      expect(fundingRate.fundingIntervalHours).toBe(8);
    });

    it('should handle negative funding rate', () => {
      const lighterFundingRate: LighterFundingRate = {
        symbol: 'ETH',
        fundingRate: -0.0002,
        nextFundingTime: 1700000001000,
        markPrice: 3000,
      };

      const fundingRate = normalizer.normalizeFundingRate(lighterFundingRate);

      expect(fundingRate.fundingRate).toBe(-0.0002);
    });
  });
});
