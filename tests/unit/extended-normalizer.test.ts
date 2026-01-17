/**
 * ExtendedNormalizer Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExtendedNormalizer } from '../../src/adapters/extended/ExtendedNormalizer.js';
import type {
  ExtendedMarket,
  ExtendedTicker,
  ExtendedOrderBook,
  ExtendedTrade,
  ExtendedFundingRate,
  ExtendedOrder,
  ExtendedPosition,
  ExtendedBalance,
} from '../../src/adapters/extended/types.js';

describe('ExtendedNormalizer', () => {
  let normalizer: ExtendedNormalizer;

  beforeEach(() => {
    normalizer = new ExtendedNormalizer();
  });

  describe('symbolToCCXT', () => {
    it('should convert BTC-USD-PERP to BTC/USD:USD', () => {
      expect(normalizer.symbolToCCXT('BTC-USD-PERP')).toBe('BTC/USD:USD');
    });

    it('should convert ETH-USDT-PERP to ETH/USDT:USDT', () => {
      expect(normalizer.symbolToCCXT('ETH-USDT-PERP')).toBe('ETH/USDT:USDT');
    });

    it('should handle BTCUSD format', () => {
      expect(normalizer.symbolToCCXT('BTCUSD')).toBe('BTC/USD:USD');
    });

    it('should handle ETHUSDT format', () => {
      expect(normalizer.symbolToCCXT('ETHUSDT')).toBe('ETH/USDT:USDT');
    });

    it('should return as-is for unknown format', () => {
      expect(normalizer.symbolToCCXT('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('symbolFromCCXT', () => {
    it('should convert BTC/USD:USD to BTC-USD-PERP', () => {
      expect(normalizer.symbolFromCCXT('BTC/USD:USD')).toBe('BTC-USD-PERP');
    });

    it('should convert ETH/USDT:USDT to ETH-USDT-PERP', () => {
      expect(normalizer.symbolFromCCXT('ETH/USDT:USDT')).toBe('ETH-USDT-PERP');
    });

    it('should handle symbols without settlement currency', () => {
      expect(normalizer.symbolFromCCXT('BTC/USD')).toBe('BTC-USD-PERP');
    });
  });

  describe('normalizeMarket', () => {
    it('should normalize Extended market data', () => {
      const extendedMarket: ExtendedMarket = {
        marketId: 'btc-usd-perp',
        symbol: 'BTC-USD-PERP',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        settleAsset: 'USD',
        isActive: true,
        minOrderQuantity: '0.001',
        maxOrderQuantity: '100',
        contractMultiplier: '1',
        pricePrecision: 2,
        quantityPrecision: 3,
        minPrice: '0.01',
        maxLeverage: '100',
        timestamp: Date.now(),
      };

      const result = normalizer.normalizeMarket(extendedMarket);

      expect(result.id).toBe('btc-usd-perp');
      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.base).toBe('BTC');
      expect(result.quote).toBe('USD');
      expect(result.settle).toBe('USD');
      expect(result.contractSize).toBe(1);
      expect(result.active).toBe(true);
      expect(result.minAmount).toBe(0.001);
      expect(result.maxAmount).toBe(100);
      expect(result.pricePrecision).toBe(2);
      expect(result.amountPrecision).toBe(3);
      expect(result.maxLeverage).toBe(100);
    });

    it('should handle missing optional fields', () => {
      const extendedMarket: ExtendedMarket = {
        marketId: 'eth-usd-perp',
        symbol: 'ETH-USD-PERP',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        settleAsset: 'USD',
        isActive: false,
        minOrderQuantity: '0.01',
        maxOrderQuantity: '1000',
        contractMultiplier: '1',
        pricePrecision: 2,
        quantityPrecision: 2,
        minPrice: '0.01',
        timestamp: Date.now(),
      };

      const result = normalizer.normalizeMarket(extendedMarket);

      expect(result.active).toBe(false);
      expect(result.maxLeverage).toBe(1); // Default leverage when not specified
    });
  });

  describe('normalizeTicker', () => {
    it('should normalize Extended ticker data', () => {
      const extendedTicker: ExtendedTicker = {
        symbol: 'BTC-USD-PERP',
        lastPrice: '50000',
        bidPrice: '49999',
        askPrice: '50001',
        high24h: '51000',
        low24h: '49000',
        volume24h: '1000',
        quoteVolume24h: '50000000',
        priceChange24h: '500',
        priceChangePercent24h: '1.01',
        timestamp: 1234567890,
      };

      const result = normalizer.normalizeTicker(extendedTicker);

      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.last).toBe(50000);
      expect(result.bid).toBe(49999);
      expect(result.ask).toBe(50001);
      expect(result.high).toBe(51000);
      expect(result.low).toBe(49000);
      expect(result.baseVolume).toBe(1000);
      expect(result.quoteVolume).toBe(50000000);
      expect(result.change).toBe(500);
      expect(result.percentage).toBe(1.01);
      expect(result.timestamp).toBe(1234567890);
    });
  });

  describe('normalizeOrderBook', () => {
    it('should normalize Extended order book data', () => {
      const extendedOrderBook: ExtendedOrderBook = {
        symbol: 'BTC-USD-PERP',
        bids: [
          ['49999', '1.5'],
          ['49998', '2.0'],
        ],
        asks: [
          ['50001', '1.2'],
          ['50002', '1.8'],
        ],
        timestamp: 1234567890,
      };

      const result = normalizer.normalizeOrderBook(extendedOrderBook);

      expect(result.exchange).toBe('extended');
      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.bids).toEqual([
        [49999, 1.5],
        [49998, 2.0],
      ]);
      expect(result.asks).toEqual([
        [50001, 1.2],
        [50002, 1.8],
      ]);
      expect(result.timestamp).toBe(1234567890);
    });
  });

  describe('normalizeTrade', () => {
    it('should normalize Extended trade data', () => {
      const extendedTrade: ExtendedTrade = {
        id: 'trade-123',
        symbol: 'BTC-USD-PERP',
        price: '50000',
        quantity: '0.5',
        side: 'buy',
        timestamp: 1234567890,
      };

      const result = normalizer.normalizeTrade(extendedTrade);

      expect(result.id).toBe('trade-123');
      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.price).toBe(50000);
      expect(result.amount).toBe(0.5);
      expect(result.cost).toBe(25000);
      expect(result.side).toBe('buy');
      expect(result.timestamp).toBe(1234567890);
    });
  });

  describe('normalizeFundingRate', () => {
    it('should normalize Extended funding rate data', () => {
      const extendedFundingRate: ExtendedFundingRate = {
        symbol: 'BTC-USD-PERP',
        fundingRate: '0.0001',
        fundingTime: 1234567890,
        nextFundingTime: 1234596690,
        markPrice: '50000',
        indexPrice: '50005',
      };

      const result = normalizer.normalizeFundingRate(extendedFundingRate);

      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.fundingRate).toBe(0.0001);
      expect(result.fundingTimestamp).toBe(1234567890);
      expect(result.nextFundingTimestamp).toBe(1234596690);
      expect(result.markPrice).toBe(50000);
      expect(result.indexPrice).toBe(50005);
      expect(result.fundingIntervalHours).toBe(8);
    });

    it('should handle missing nextFundingTime', () => {
      const extendedFundingRate: ExtendedFundingRate = {
        symbol: 'ETH-USD-PERP',
        fundingRate: '0.0002',
        fundingTime: 1234567890,
        markPrice: '3000',
        indexPrice: '3001',
      };

      const result = normalizer.normalizeFundingRate(extendedFundingRate);

      expect(result.nextFundingTimestamp).toBe(0);
    });
  });

  describe('normalizeOrder', () => {
    it('should normalize Extended order data - market order', () => {
      const extendedOrder: ExtendedOrder = {
        orderId: 'order-123',
        clientOrderId: 'client-123',
        symbol: 'BTC-USD-PERP',
        type: 'market',
        side: 'buy',
        quantity: '1.0',
        filledQuantity: '0.5',
        remainingQuantity: '0.5',
        status: 'partially_filled',
        timestamp: 1234567890,
        updateTime: 1234567900,
      };

      const result = normalizer.normalizeOrder(extendedOrder);

      expect(result.id).toBe('order-123');
      expect(result.clientOrderId).toBe('client-123');
      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.type).toBe('market');
      expect(result.side).toBe('buy');
      expect(result.amount).toBe(1.0);
      expect(result.filled).toBe(0.5);
      expect(result.remaining).toBe(0.5);
      expect(result.status).toBe('open');
      expect(result.timestamp).toBe(1234567890);
      expect(result.lastUpdateTimestamp).toBe(1234567900);
    });

    it('should normalize Extended order data - limit order with price', () => {
      const extendedOrder: ExtendedOrder = {
        orderId: 'order-456',
        symbol: 'ETH-USD-PERP',
        type: 'limit',
        side: 'sell',
        price: '3000',
        quantity: '2.0',
        filledQuantity: '2.0',
        remainingQuantity: '0',
        status: 'filled',
        timestamp: 1234567890,
        updateTime: 1234567920,
      };

      const result = normalizer.normalizeOrder(extendedOrder);

      expect(result.type).toBe('limit');
      expect(result.price).toBe(3000);
      expect(result.filled).toBe(2.0);
      expect(result.remaining).toBe(0);
      expect(result.status).toBe('closed');
    });

    it('should normalize order status correctly', () => {
      const statuses: Array<[ExtendedOrder['status'], string]> = [
        ['pending', 'open'],
        ['open', 'open'],
        ['filled', 'closed'],
        ['cancelled', 'canceled'],
        ['expired', 'expired'],
        ['rejected', 'rejected'],
        ['partially_filled', 'open'],
      ];

      statuses.forEach(([extendedStatus, expectedStatus]) => {
        const order: ExtendedOrder = {
          orderId: 'test',
          symbol: 'BTC-USD-PERP',
          type: 'limit',
          side: 'buy',
          quantity: '1',
          status: extendedStatus,
          timestamp: Date.now(),
          updateTime: Date.now(),
        };

        const result = normalizer.normalizeOrder(order);
        expect(result.status).toBe(expectedStatus);
      });
    });

    it('should handle stop orders', () => {
      const extendedOrder: ExtendedOrder = {
        orderId: 'order-789',
        symbol: 'BTC-USD-PERP',
        type: 'stop',
        side: 'sell',
        stopPrice: '48000',
        quantity: '0.5',
        status: 'open',
        timestamp: 1234567890,
        updateTime: 1234567890,
      };

      const result = normalizer.normalizeOrder(extendedOrder);

      expect(result.type).toBe('limit');
      expect(result.stopPrice).toBe(48000);
    });
  });

  describe('normalizePosition', () => {
    it('should normalize Extended position data - long', () => {
      const extendedPosition: ExtendedPosition = {
        symbol: 'BTC-USD-PERP',
        side: 'long',
        size: '2.5',
        entryPrice: '48000',
        markPrice: '50000',
        leverage: '10',
        liquidationPrice: '43200',
        unrealizedPnl: '5000',
        initialMargin: '12000',
        maintenanceMargin: '600',
        marginMode: 'cross',
        timestamp: 1234567890,
      };

      const result = normalizer.normalizePosition(extendedPosition);

      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.side).toBe('long');
      expect(result.size).toBe(2.5);
      expect(result.entryPrice).toBe(48000);
      expect(result.markPrice).toBe(50000);
      expect(result.leverage).toBe(10);
      expect(result.liquidationPrice).toBe(43200);
      expect(result.unrealizedPnl).toBe(5000);
      expect(result.margin).toBe(12000);
      expect(result.maintenanceMargin).toBe(600);
      expect(result.marginMode).toBe('cross');
      expect(result.timestamp).toBe(1234567890);
    });

    it('should normalize Extended position data - short', () => {
      const extendedPosition: ExtendedPosition = {
        symbol: 'ETH-USD-PERP',
        side: 'short',
        size: '5.0',
        entryPrice: '3100',
        markPrice: '3000',
        leverage: '5',
        liquidationPrice: '3410',
        unrealizedPnl: '500',
        initialMargin: '3100',
        maintenanceMargin: '155',
        marginMode: 'isolated',
        timestamp: 1234567890,
      };

      const result = normalizer.normalizePosition(extendedPosition);

      expect(result.side).toBe('short');
      expect(result.marginMode).toBe('isolated');
      expect(result.unrealizedPnl).toBe(500);
    });

    it('should calculate margin ratio correctly', () => {
      const extendedPosition: ExtendedPosition = {
        symbol: 'BTC-USD-PERP',
        side: 'long',
        size: '1.0',
        entryPrice: '50000',
        markPrice: '50000',
        leverage: '10',
        liquidationPrice: '45000',
        unrealizedPnl: '0',
        initialMargin: '5000',
        maintenanceMargin: '250',
        marginMode: 'cross',
        timestamp: Date.now(),
      };

      const result = normalizer.normalizePosition(extendedPosition);

      // marginRatio = maintenanceMargin / (size * markPrice)
      // 250 / (1.0 * 50000) = 0.005
      expect(result.marginRatio).toBe(0.005);
    });
  });

  describe('normalizeBalance', () => {
    it('should normalize Extended balance data', () => {
      const extendedBalance: ExtendedBalance = {
        asset: 'USDT',
        free: '10000',
        locked: '2000',
        total: '12000',
      };

      const result = normalizer.normalizeBalance(extendedBalance);

      expect(result.currency).toBe('USDT');
      expect(result.free).toBe(10000);
      expect(result.used).toBe(2000);
      expect(result.total).toBe(12000);
    });

    it('should handle zero balances', () => {
      const extendedBalance: ExtendedBalance = {
        asset: 'BTC',
        free: '0',
        locked: '0',
        total: '0',
      };

      const result = normalizer.normalizeBalance(extendedBalance);

      expect(result.free).toBe(0);
      expect(result.used).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('batch normalization methods', () => {
    it('should normalize multiple markets', () => {
      const markets: ExtendedMarket[] = [
        {
          marketId: 'btc-usd-perp',
          symbol: 'BTC-USD-PERP',
          baseAsset: 'BTC',
          quoteAsset: 'USD',
          settleAsset: 'USD',
          isActive: true,
          minOrderQuantity: '0.001',
          maxOrderQuantity: '100',
          contractMultiplier: '1',
          pricePrecision: 2,
          quantityPrecision: 3,
          minPrice: '0.01',
          timestamp: Date.now(),
        },
        {
          marketId: 'eth-usd-perp',
          symbol: 'ETH-USD-PERP',
          baseAsset: 'ETH',
          quoteAsset: 'USD',
          settleAsset: 'USD',
          isActive: true,
          minOrderQuantity: '0.01',
          maxOrderQuantity: '1000',
          contractMultiplier: '1',
          pricePrecision: 2,
          quantityPrecision: 2,
          minPrice: '0.01',
          timestamp: Date.now(),
        },
      ];

      const result = normalizer.normalizeMarkets(markets);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC/USD:USD');
      expect(result[1].symbol).toBe('ETH/USD:USD');
    });

    it('should normalize multiple orders', () => {
      const orders: ExtendedOrder[] = [
        {
          orderId: 'order-1',
          symbol: 'BTC-USD-PERP',
          type: 'limit',
          side: 'buy',
          price: '50000',
          quantity: '1',
          status: 'open',
          timestamp: Date.now(),
          updateTime: Date.now(),
        },
        {
          orderId: 'order-2',
          symbol: 'ETH-USD-PERP',
          type: 'market',
          side: 'sell',
          quantity: '5',
          status: 'filled',
          timestamp: Date.now(),
          updateTime: Date.now(),
        },
      ];

      const result = normalizer.normalizeOrders(orders);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('order-1');
      expect(result[1].id).toBe('order-2');
    });

    it('should normalize multiple positions', () => {
      const positions: ExtendedPosition[] = [
        {
          symbol: 'BTC-USD-PERP',
          side: 'long',
          size: '1',
          entryPrice: '50000',
          markPrice: '51000',
          leverage: '10',
          liquidationPrice: '45000',
          unrealizedPnl: '1000',
          initialMargin: '5000',
          maintenanceMargin: '250',
          marginMode: 'cross',
          timestamp: Date.now(),
        },
      ];

      const result = normalizer.normalizePositions(positions);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC/USD:USD');
    });

    it('should normalize multiple balances', () => {
      const balances: ExtendedBalance[] = [
        { asset: 'USDT', free: '10000', locked: '0', total: '10000' },
        { asset: 'BTC', free: '0.5', locked: '0.1', total: '0.6' },
      ];

      const result = normalizer.normalizeBalances(balances);

      expect(result).toHaveLength(2);
      expect(result[0].currency).toBe('USDT');
      expect(result[1].currency).toBe('BTC');
    });

    it('should normalize multiple trades', () => {
      const trades: ExtendedTrade[] = [
        {
          id: 'trade-1',
          symbol: 'BTC-USD-PERP',
          price: '50000',
          quantity: '0.5',
          side: 'buy',
          timestamp: 1234567890,
        },
        {
          id: 'trade-2',
          symbol: 'ETH-USD-PERP',
          price: '3000',
          quantity: '2',
          side: 'sell',
          timestamp: 1234567900,
        },
      ];

      const result = normalizer.normalizeTrades(trades);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('trade-1');
      expect(result[1].id).toBe('trade-2');
    });

    it('should normalize multiple funding rates', () => {
      const rates: ExtendedFundingRate[] = [
        {
          symbol: 'BTC-USD-PERP',
          fundingRate: '0.0001',
          fundingTime: 1234567890,
          markPrice: '50000',
          indexPrice: '50005',
        },
        {
          symbol: 'ETH-USD-PERP',
          fundingRate: '0.0002',
          fundingTime: 1234567890,
          markPrice: '3000',
          indexPrice: '3001',
        },
      ];

      const result = normalizer.normalizeFundingRates(rates);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC/USD:USD');
      expect(result[1].symbol).toBe('ETH/USD:USD');
    });
  });
});
