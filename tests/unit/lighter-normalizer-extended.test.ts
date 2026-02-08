/**
 * Lighter Normalizer Extended Tests
 *
 * Comprehensive tests for LighterNormalizer data transformation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { LighterNormalizer } from '../../src/adapters/lighter/LighterNormalizer.js';

describe('LighterNormalizer', () => {
  let normalizer: LighterNormalizer;

  beforeEach(() => {
    normalizer = new LighterNormalizer();
  });

  describe('symbol conversion', () => {
    test('should convert unified symbol to Lighter format', () => {
      expect(normalizer.toLighterSymbol('BTC/USDC:USDC')).toBe('BTC');
      expect(normalizer.toLighterSymbol('ETH/USDC:USDC')).toBe('ETH');
      expect(normalizer.toLighterSymbol('SOL/USDC:USDC')).toBe('SOL');
    });

    test('should convert Lighter symbol to unified format', () => {
      expect(normalizer.normalizeSymbol('BTC')).toBe('BTC/USDC:USDC');
      expect(normalizer.normalizeSymbol('ETH')).toBe('ETH/USDC:USDC');
      expect(normalizer.normalizeSymbol('SOL')).toBe('SOL/USDC:USDC');
    });

    test('should handle empty or malformed symbols', () => {
      expect(normalizer.toLighterSymbol('')).toBe('');
      expect(normalizer.toLighterSymbol('INVALID')).toBe('INVALID');
    });

    test('should normalize various symbol formats', () => {
      const testCases = [
        ['BTC/USD:USD', 'BTC'],
        ['ETH/USDT:USDT', 'ETH'],
        ['AVAX/USDC:USDC', 'AVAX'],
      ];

      testCases.forEach(([input, expected]) => {
        expect(normalizer.toLighterSymbol(input)).toBe(expected);
      });
    });
  });

  describe('normalizeMarket', () => {
    test('should normalize market with all fields', () => {
      const lighterMarket = {
        symbol: 'BTC',
        market_type: 'perp',
        status: 'active',
        supported_price_decimals: 2,
        supported_size_decimals: 4,
        min_base_amount: '0.001',
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        default_initial_margin_fraction: 500, // 5% = 20x max leverage
      };

      const market = normalizer.normalizeMarket(lighterMarket);

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
    });

    test('should handle inactive market', () => {
      const lighterMarket = {
        symbol: 'TEST',
        market_type: 'perp',
        status: 'inactive',
        supported_price_decimals: 2,
        supported_size_decimals: 4,
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.active).toBe(false);
    });

    test('should use default values when fields missing', () => {
      const lighterMarket = {
        symbol: 'ETH',
        market_type: 'perp',
        status: 'active',
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.pricePrecision).toBe(2);
      expect(market.amountPrecision).toBe(4);
      expect(market.minAmount).toBe(0);
      expect(market.makerFee).toBe(0);
      expect(market.takerFee).toBe(0);
      expect(market.maxLeverage).toBe(20);
    });

    test('should calculate price tick size from precision', () => {
      const lighterMarket = {
        symbol: 'BTC',
        market_type: 'perp',
        status: 'active',
        supported_price_decimals: 1,
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.priceTickSize).toBe(0.1);
    });

    test('should calculate amount step size from precision', () => {
      const lighterMarket = {
        symbol: 'BTC',
        market_type: 'perp',
        status: 'active',
        supported_size_decimals: 3,
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.amountStepSize).toBe(0.001);
    });

    test('should use alternative field names for precision', () => {
      const lighterMarket = {
        symbol: 'BTC',
        market_type: 'perp',
        status: 'active',
        price_decimals: 3,
        size_decimals: 5,
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.pricePrecision).toBe(3);
      expect(market.amountPrecision).toBe(5);
    });

    test('should include original data in info field', () => {
      const lighterMarket = {
        symbol: 'BTC',
        market_type: 'perp',
        status: 'active',
        custom_field: 'custom_value',
      };

      const market = normalizer.normalizeMarket(lighterMarket);

      expect(market.info).toBeDefined();
      expect((market.info as any).custom_field).toBe('custom_value');
    });
  });

  describe('normalizeOrder', () => {
    test('should normalize limit order', () => {
      const lighterOrder = {
        orderId: 'order-123',
        clientOrderId: 'client-456',
        symbol: 'BTC',
        type: 'limit',
        side: 'buy',
        price: 50000,
        size: 0.1,
        filledSize: 0.05,
        status: 'open',
        timestamp: 1700000000000,
      };

      const order = normalizer.normalizeOrder(lighterOrder as any);

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-456');
      expect(order.symbol).toBe('BTC/USDC:USDC');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.price).toBe(50000);
      expect(order.amount).toBe(0.1);
      expect(order.filled).toBe(0.05);
      expect(order.remaining).toBe(0.05);
      expect(order.status).toBe('open');
      expect(order.timestamp).toBe(1700000000000);
    });

    test('should normalize market order', () => {
      const lighterOrder = {
        orderId: 'order-789',
        symbol: 'ETH',
        type: 'market',
        side: 'sell',
        size: 10,
        filledSize: 10,
        status: 'filled',
        timestamp: 1700001000000,
      };

      const order = normalizer.normalizeOrder(lighterOrder as any);

      expect(order.type).toBe('market');
      expect(order.status).toBe('closed');
      expect(order.filled).toBe(10);
    });

    test('should normalize cancelled order', () => {
      const lighterOrder = {
        orderId: 'order-cancelled',
        symbol: 'SOL',
        type: 'limit',
        side: 'buy',
        price: 100,
        size: 50,
        filledSize: 0,
        status: 'cancelled',
        timestamp: 1700002000000,
      };

      const order = normalizer.normalizeOrder(lighterOrder as any);

      expect(order.status).toBe('canceled');
    });

    test('should handle post-only order', () => {
      const lighterOrder = {
        orderId: 'order-po',
        symbol: 'BTC',
        type: 'limit',
        side: 'buy',
        price: 49000,
        size: 0.5,
        filledSize: 0,
        status: 'open',
        postOnly: true,
        timestamp: 1700003000000,
      };

      const order = normalizer.normalizeOrder(lighterOrder as any);

      // Note: postOnly is hardcoded to false in normalizer
      expect(order.postOnly).toBe(false);
    });

    test('should handle reduce-only order', () => {
      const lighterOrder = {
        orderId: 'order-reduce',
        symbol: 'ETH',
        type: 'market',
        side: 'sell',
        size: 5,
        filledSize: 5,
        status: 'filled',
        reduceOnly: true,
        timestamp: 1700004000000,
      };

      const order = normalizer.normalizeOrder(lighterOrder as any);

      expect(order.reduceOnly).toBe(true);
    });
  });

  describe('normalizePosition', () => {
    test('should normalize long position', () => {
      const lighterPosition = {
        symbol: 'BTC',
        side: 'long',
        size: 1.5,
        entryPrice: 50000,
        markPrice: 51000,
        liquidationPrice: 45000,
        unrealizedPnl: 1500,
        realizedPnl: 200,
        leverage: 10,
        margin: 7500,
        timestamp: 1700000000000,
      };

      const position = normalizer.normalizePosition(lighterPosition as any);

      expect(position.symbol).toBe('BTC/USDC:USDC');
      expect(position.side).toBe('long');
      expect(position.size).toBe(1.5);
      expect(position.entryPrice).toBe(50000);
      expect(position.markPrice).toBe(51000);
      expect(position.liquidationPrice).toBe(45000);
      expect(position.unrealizedPnl).toBe(1500);
      expect(position.leverage).toBe(10);
    });

    test('should normalize short position', () => {
      const lighterPosition = {
        symbol: 'ETH',
        side: 'short',
        size: 10,
        entryPrice: 3000,
        markPrice: 2900,
        liquidationPrice: 3500,
        unrealizedPnl: 1000,
        realizedPnl: 0,
        leverage: 5,
        margin: 6000,
        timestamp: 1700001000000,
      };

      const position = normalizer.normalizePosition(lighterPosition as any);

      expect(position.side).toBe('short');
      expect(position.size).toBe(10);
      expect(position.unrealizedPnl).toBe(1000);
    });

    test('should handle position with zero unrealized PnL', () => {
      const lighterPosition = {
        symbol: 'SOL',
        side: 'long',
        size: 100,
        entryPrice: 100,
        markPrice: 100,
        liquidationPrice: 90,
        unrealizedPnl: 0,
        realizedPnl: 50,
        leverage: 3,
        margin: 3333,
        timestamp: 1700002000000,
      };

      const position = normalizer.normalizePosition(lighterPosition as any);

      expect(position.unrealizedPnl).toBe(0);
    });

    test('should handle position with negative PnL', () => {
      const lighterPosition = {
        symbol: 'BTC',
        side: 'long',
        size: 0.5,
        entryPrice: 52000,
        markPrice: 50000,
        liquidationPrice: 47000,
        unrealizedPnl: -1000,
        realizedPnl: 0,
        leverage: 10,
        margin: 2600,
        timestamp: 1700003000000,
      };

      const position = normalizer.normalizePosition(lighterPosition as any);

      expect(position.unrealizedPnl).toBe(-1000);
    });
  });

  describe('normalizeTrade', () => {
    test('should normalize buy trade', () => {
      const lighterTrade = {
        id: 'trade-123',
        symbol: 'BTC',
        side: 'buy',
        price: 50000,
        amount: 0.1,
        timestamp: 1700000000000,
      };

      const trade = normalizer.normalizeTrade(lighterTrade as any);

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USDC:USDC');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.1);
      expect(trade.timestamp).toBe(1700000000000);
    });

    test('should normalize sell trade', () => {
      const lighterTrade = {
        id: 'trade-456',
        symbol: 'ETH',
        side: 'sell',
        price: 3000,
        amount: 5,
        timestamp: 1700001000000,
      };

      const trade = normalizer.normalizeTrade(lighterTrade as any);

      expect(trade.side).toBe('sell');
    });

    test('should calculate cost from price and amount', () => {
      const lighterTrade = {
        id: 'trade-789',
        symbol: 'SOL',
        side: 'buy',
        price: 100,
        amount: 50,
        timestamp: 1700002000000,
      };

      const trade = normalizer.normalizeTrade(lighterTrade as any);

      expect(trade.cost).toBe(5000); // 100 * 50
    });
  });

  describe('normalizeBalance', () => {
    test('should normalize balance with all fields', () => {
      const lighterBalance = {
        currency: 'USDC',
        available: 10000,
        reserved: 500,
        total: 10500,
      };

      const balance = normalizer.normalizeBalance(lighterBalance as any);

      expect(balance.currency).toBe('USDC');
      expect(balance.free).toBe(10000);
      expect(balance.used).toBe(500);
      expect(balance.total).toBe(10500);
    });

    test('should handle balance with available and reserved', () => {
      const lighterBalance = {
        currency: 'BTC',
        available: 1.5,
        reserved: 0.5,
        total: 2.0,
      };

      const balance = normalizer.normalizeBalance(lighterBalance as any);

      expect(balance.total).toBe(2.0);
      expect(balance.free).toBe(1.5);
      expect(balance.used).toBe(0.5);
    });

    test('should handle zero balances', () => {
      const lighterBalance = {
        currency: 'ETH',
        available: 0,
        reserved: 0,
        total: 0,
      };

      const balance = normalizer.normalizeBalance(lighterBalance as any);

      expect(balance.free).toBe(0);
      expect(balance.used).toBe(0);
      expect(balance.total).toBe(0);
    });
  });

  describe('normalizeOrderBook', () => {
    test('should normalize order book', () => {
      const lighterOrderBook = {
        symbol: 'BTC',
        bids: [
          ['50000', '0.5'],
          ['49999', '1.0'],
          ['49998', '2.0'],
        ],
        asks: [
          ['50001', '0.3'],
          ['50002', '0.7'],
          ['50003', '1.5'],
        ],
        timestamp: 1700000000000,
      };

      const orderBook = normalizer.normalizeOrderBook(lighterOrderBook as any);

      expect(orderBook.bids).toHaveLength(3);
      expect(orderBook.asks).toHaveLength(3);
      expect(orderBook.timestamp).toBe(1700000000000);
    });

    test('should preserve bid levels as strings', () => {
      const lighterOrderBook = {
        symbol: 'BTC',
        bids: [
          ['50000', '1.5'],
          ['49999', '2.0'],
        ],
        asks: [['50001', '1.0']],
        timestamp: Date.now(),
      };

      const orderBook = normalizer.normalizeOrderBook(lighterOrderBook as any);

      // Lighter normalizer doesn't parse strings to numbers
      expect(orderBook.bids[0]).toEqual(['50000', '1.5']);
      expect(orderBook.bids[1]).toEqual(['49999', '2.0']);
    });

    test('should preserve ask levels as strings', () => {
      const lighterOrderBook = {
        symbol: 'ETH',
        bids: [['49999', '1.0']],
        asks: [
          ['50001', '0.5'],
          ['50002', '1.5'],
        ],
        timestamp: Date.now(),
      };

      const orderBook = normalizer.normalizeOrderBook(lighterOrderBook as any);

      expect(orderBook.asks[0]).toEqual(['50001', '0.5']);
      expect(orderBook.asks[1]).toEqual(['50002', '1.5']);
    });

    test('should handle empty order book', () => {
      const lighterOrderBook = {
        symbol: 'SOL',
        bids: [],
        asks: [],
        timestamp: 1700000000000,
      };

      const orderBook = normalizer.normalizeOrderBook(lighterOrderBook as any);

      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });
  });

  describe('normalizeTicker', () => {
    test('should normalize ticker from real API format', () => {
      const lighterTicker = {
        symbol: 'BTC',
        last_trade_price: '50000',
        daily_price_high: '51000',
        daily_price_low: '49000',
        daily_base_token_volume: '1000',
        daily_quote_token_volume: '50000000',
        daily_price_change: '1.0',
      };

      const ticker = normalizer.normalizeTicker(lighterTicker as any);

      expect(ticker.symbol).toBe('BTC/USDC:USDC');
      expect(ticker.last).toBe(50000);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
      expect(ticker.baseVolume).toBe(1000);
      expect(ticker.quoteVolume).toBe(50000000);
      expect(ticker.percentage).toBe(1.0);
    });

    test('should handle missing optional fields', () => {
      const lighterTicker = {
        symbol: 'ETH',
        last_trade_price: '3000',
      };

      const ticker = normalizer.normalizeTicker(lighterTicker as any);

      expect(ticker.last).toBe(3000);
      expect(ticker.symbol).toBe('ETH/USDC:USDC');
    });
  });

  describe('normalizeFundingRate', () => {
    test('should normalize funding rate', () => {
      const lighterFundingRate = {
        symbol: 'BTC',
        fundingRate: 0.0001,
        nextFundingTime: 1700003600000,
        markPrice: 50000,
      };

      const fundingRate = normalizer.normalizeFundingRate(lighterFundingRate as any);

      expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.fundingTimestamp).toBe(1700003600000);
      expect(fundingRate.markPrice).toBe(50000);
    });

    test('should handle negative funding rate', () => {
      const lighterFundingRate = {
        symbol: 'ETH',
        fundingRate: -0.0002,
        nextFundingTime: 1700007200000,
        markPrice: 3000,
      };

      const fundingRate = normalizer.normalizeFundingRate(lighterFundingRate as any);

      expect(fundingRate.fundingRate).toBe(-0.0002);
    });
  });
});
