/**
 * EtherealNormalizer Tests
 *
 * Tests all normalizer methods with realistic mock data.
 */

import { EtherealNormalizer } from '../../../src/adapters/ethereal/EtherealNormalizer.js';
import type {
  EtherealMarketInfo,
  EtherealTicker,
  EtherealOrderBookResponse,
  EtherealTradeResponse,
  EtherealOrderResponse,
  EtherealPositionResponse,
  EtherealBalanceResponse,
  EtherealCandleResponse,
  EtherealFundingRateResponse,
} from '../../../src/adapters/ethereal/types.js';

describe('EtherealNormalizer', () => {
  let normalizer: EtherealNormalizer;

  beforeEach(() => {
    normalizer = new EtherealNormalizer();
  });

  // =========================================================================
  // Symbol Conversion
  // =========================================================================

  describe('symbolToCCXT / symbolFromCCXT', () => {
    test('converts Ethereal to CCXT format', () => {
      expect(normalizer.symbolToCCXT('ETH-USD')).toBe('ETH/USD:USD');
    });

    test('converts CCXT to Ethereal format', () => {
      expect(normalizer.symbolFromCCXT('ETH/USD:USD')).toBe('ETH-USD');
    });

    test('normalizeSymbol delegates to symbolToCCXT', () => {
      expect(normalizer.normalizeSymbol('BTC-USD')).toBe('BTC/USD:USD');
    });

    test('toExchangeSymbol delegates to symbolFromCCXT', () => {
      expect(normalizer.toExchangeSymbol('BTC/USD:USD')).toBe('BTC-USD');
    });
  });

  // =========================================================================
  // normalizeMarket
  // =========================================================================

  describe('normalizeMarket', () => {
    const mockMarket: EtherealMarketInfo = {
      id: 'bc7d5575-3711-4532-a000-312bfacfb767',
      ticker: 'ETHUSD',
      displayTicker: 'ETH-USD',
      status: 'ACTIVE',
      baseTokenName: 'ETH',
      quoteTokenName: 'USD',
      tickSize: '0.01',
      lotSize: '0.001',
      minQuantity: '0.01',
      maxQuantity: '500',
      maxLeverage: 50,
      makerFee: '0.0002',
      takerFee: '0.0005',
      volume24h: '50000',
      openInterest: '10000',
      fundingRate1h: '0.0001',
      minPrice: '0.1',
      maxPrice: '100000',
      onchainId: 2,
      engineType: 0,
    };

    test('normalizes market info correctly', () => {
      const result = normalizer.normalizeMarket(mockMarket);

      expect(result.id).toBe('bc7d5575-3711-4532-a000-312bfacfb767');
      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.base).toBe('ETH');
      expect(result.quote).toBe('USD');
      expect(result.settle).toBe('USD');
      expect(result.active).toBe(true);
      expect(result.minAmount).toBe(0.01);
      expect(result.pricePrecision).toBe(2);
      expect(result.amountPrecision).toBe(3);
      expect(result.priceTickSize).toBe(0.01);
      expect(result.amountStepSize).toBe(0.001);
      expect(result.makerFee).toBe(0.0002);
      expect(result.takerFee).toBe(0.0005);
      expect(result.maxLeverage).toBe(50);
      expect(result.fundingIntervalHours).toBe(1);
    });

    test('uses default precision when tickSize is 0', () => {
      const market = { ...mockMarket, tickSize: '0', lotSize: '0' };
      const result = normalizer.normalizeMarket(market);
      expect(result.pricePrecision).toBe(8);
      expect(result.amountPrecision).toBe(6);
    });

    test('marks inactive market correctly', () => {
      const market = { ...mockMarket, status: 'INACTIVE' };
      const result = normalizer.normalizeMarket(market);
      expect(result.active).toBe(false);
    });
  });

  // =========================================================================
  // normalizeTicker
  // =========================================================================

  describe('normalizeTicker', () => {
    const mockTicker: EtherealTicker = {
      productId: 'bc7d5575-3711-4532-a000-312bfacfb767',
      bestBidPrice: '3150.00',
      bestAskPrice: '3151.00',
      oraclePrice: '3150.50',
      price24hAgo: '3120.00',
    };

    const mockProduct: EtherealMarketInfo = {
      id: 'bc7d5575-3711-4532-a000-312bfacfb767',
      ticker: 'ETHUSD',
      displayTicker: 'ETH-USD',
      status: 'ACTIVE',
      baseTokenName: 'ETH',
      quoteTokenName: 'USD',
      tickSize: '0.01',
      lotSize: '0.001',
      minQuantity: '0.01',
      maxQuantity: '500',
      maxLeverage: 50,
      makerFee: '0.0002',
      takerFee: '0.0005',
      volume24h: '50000.5',
      openInterest: '10000',
      fundingRate1h: '0.0001',
      minPrice: '0.1',
      maxPrice: '100000',
      onchainId: 2,
      engineType: 0,
    };

    test('normalizes ticker with product data', () => {
      const result = normalizer.normalizeTicker(mockTicker, 'ETH/USD:USD', mockProduct);

      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.bid).toBe(3150);
      expect(result.ask).toBe(3151);
      expect(result.last).toBe(3150.5); // mid price
      expect(result.open).toBe(3120);
      expect(result.baseVolume).toBe(50000.5);
    });

    test('normalizes ticker without product data', () => {
      const result = normalizer.normalizeTicker(mockTicker, 'ETH/USD:USD');
      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.bid).toBe(3150);
      expect(result.ask).toBe(3151);
      expect(result.baseVolume).toBe(0);
    });
  });

  // =========================================================================
  // normalizeOrderBook
  // =========================================================================

  describe('normalizeOrderBook', () => {
    const mockOrderBook: EtherealOrderBookResponse = {
      productId: 'bc7d5575-3711-4532-a000-312bfacfb767',
      timestamp: 1700000000000,
      previousTimestamp: 1699999999000,
      bids: [['3150.00', '10.5'], ['3149.00', '20.0']],
      asks: [['3151.00', '5.2'], ['3152.00', '15.0']],
    };

    test('normalizes order book correctly', () => {
      const result = normalizer.normalizeOrderBook(mockOrderBook, 'ETH/USD:USD');

      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.exchange).toBe('ethereal');
      expect(result.timestamp).toBe(1700000000000);
      expect(result.bids).toEqual([[3150, 10.5], [3149, 20]]);
      expect(result.asks).toEqual([[3151, 5.2], [3152, 15]]);
    });
  });

  // =========================================================================
  // normalizeTrade
  // =========================================================================

  describe('normalizeTrade', () => {
    const mockTrade: EtherealTradeResponse = {
      id: 'trade-001',
      productId: 'bc7d5575-3711-4532-a000-312bfacfb767',
      makerOrderId: 'mo1',
      takerOrderId: 'to1',
      makerSide: 1,
      takerSide: 0,
      price: '3150.00',
      filled: '2.5',
      makerFeeUsd: '0',
      takerFeeUsd: '2.3625',
      createdAt: 1700000000000,
    };

    test('normalizes buy trade (takerSide=0)', () => {
      const result = normalizer.normalizeTrade(mockTrade, 'ETH/USD:USD');

      expect(result.id).toBe('trade-001');
      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.side).toBe('buy');
      expect(result.price).toBe(3150);
      expect(result.amount).toBe(2.5);
      expect(result.cost).toBe(7875);
      expect(result.timestamp).toBe(1700000000000);
    });

    test('normalizes sell trade (takerSide=1)', () => {
      const sellTrade = { ...mockTrade, takerSide: 1 };
      const result = normalizer.normalizeTrade(sellTrade, 'ETH/USD:USD');
      expect(result.side).toBe('sell');
    });
  });

  // =========================================================================
  // normalizeOrder
  // =========================================================================

  describe('normalizeOrder', () => {
    const mockOrder: EtherealOrderResponse = {
      orderId: 'ord-001',
      symbol: 'ETH-USD',
      side: 'BUY',
      type: 'LIMIT',
      status: 'OPEN',
      price: '3150.00',
      avgPrice: '0',
      quantity: '10',
      filledQuantity: '0',
      remainingQuantity: '10',
      reduceOnly: false,
      postOnly: true,
      clientOrderId: 'client-123',
      timeInForce: 'GTC',
      createdAt: 1700000000000,
      updatedAt: 1700000000001,
    };

    test('normalizes open limit order', () => {
      const result = normalizer.normalizeOrder(mockOrder, 'ETH/USD:USD');

      expect(result.id).toBe('ord-001');
      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.type).toBe('limit');
      expect(result.side).toBe('buy');
      expect(result.amount).toBe(10);
      expect(result.price).toBe(3150);
      expect(result.status).toBe('open');
      expect(result.filled).toBe(0);
      expect(result.remaining).toBe(10);
      expect(result.reduceOnly).toBe(false);
      expect(result.postOnly).toBe(true);
      expect(result.clientOrderId).toBe('client-123');
      expect(result.timestamp).toBe(1700000000001);
    });

    test('normalizes filled order with avgPrice', () => {
      const filledOrder = {
        ...mockOrder,
        status: 'FILLED',
        avgPrice: '3148.50',
        filledQuantity: '10',
        remainingQuantity: '0',
      };
      const result = normalizer.normalizeOrder(filledOrder);

      expect(result.status).toBe('filled');
      expect(result.filled).toBe(10);
      expect(result.remaining).toBe(0);
      expect(result.averagePrice).toBe(3148.5);
      expect(result.cost).toBe(31485);
    });

    test('normalizes market order', () => {
      const marketOrder = { ...mockOrder, type: 'MARKET', price: '0' };
      const result = normalizer.normalizeOrder(marketOrder);
      expect(result.type).toBe('market');
      expect(result.price).toBeUndefined();
    });

    test('normalizes sell order', () => {
      const sellOrder = { ...mockOrder, side: 'SELL' };
      const result = normalizer.normalizeOrder(sellOrder);
      expect(result.side).toBe('sell');
    });

    test('maps cancelled status correctly', () => {
      const cancelled = { ...mockOrder, status: 'CANCELLED' };
      const result = normalizer.normalizeOrder(cancelled);
      expect(result.status).toBe('canceled');
    });

    test('derives symbol from raw data when not provided', () => {
      const result = normalizer.normalizeOrder(mockOrder);
      expect(result.symbol).toBe('ETH/USD:USD');
    });
  });

  // =========================================================================
  // normalizePosition
  // =========================================================================

  describe('normalizePosition', () => {
    const mockPosition: EtherealPositionResponse = {
      symbol: 'ETH-USD',
      side: 'LONG',
      size: '5.5',
      entryPrice: '3100.00',
      markPrice: '3150.00',
      liquidationPrice: '2800.00',
      unrealizedPnl: '275.00',
      realizedPnl: '100.00',
      leverage: '10',
      marginMode: 'cross',
      margin: '1705.00',
      updatedAt: 1700000000000,
    };

    test('normalizes long position', () => {
      const result = normalizer.normalizePosition(mockPosition);

      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.side).toBe('long');
      expect(result.size).toBe(5.5);
      expect(result.entryPrice).toBe(3100);
      expect(result.markPrice).toBe(3150);
      expect(result.liquidationPrice).toBe(2800);
      expect(result.unrealizedPnl).toBe(275);
      expect(result.realizedPnl).toBe(100);
      expect(result.leverage).toBe(10);
      expect(result.marginMode).toBe('cross');
      expect(result.margin).toBe(1705);
      expect(result.maintenanceMargin).toBe(0);
      expect(result.marginRatio).toBe(0);
      expect(result.timestamp).toBe(1700000000000);
    });

    test('normalizes short position', () => {
      const short = { ...mockPosition, side: 'SHORT' };
      const result = normalizer.normalizePosition(short);
      expect(result.side).toBe('short');
    });

    test('normalizes isolated margin mode', () => {
      const isolated = { ...mockPosition, marginMode: 'isolated' };
      const result = normalizer.normalizePosition(isolated);
      expect(result.marginMode).toBe('isolated');
    });

    test('uses provided symbol over raw data', () => {
      const result = normalizer.normalizePosition(mockPosition, 'BTC/USD:USD');
      expect(result.symbol).toBe('BTC/USD:USD');
    });
  });

  // =========================================================================
  // normalizeBalance
  // =========================================================================

  describe('normalizeBalance', () => {
    const mockBalance: EtherealBalanceResponse = {
      asset: 'USD',
      total: '10000.00',
      available: '8000.00',
      locked: '2000.00',
      updatedAt: 1700000000000,
    };

    test('normalizes balance correctly', () => {
      const result = normalizer.normalizeBalance(mockBalance);

      expect(result.currency).toBe('USD');
      expect(result.total).toBe(10000);
      expect(result.free).toBe(8000);
      expect(result.used).toBe(2000);
    });
  });

  // =========================================================================
  // normalizeFundingRate
  // =========================================================================

  describe('normalizeFundingRate', () => {
    const mockFunding: EtherealFundingRateResponse = {
      productId: 'bc7d5575-3711-4532-a000-312bfacfb767',
      fundingRateProjected1h: '-0.000017773',
      fundingRate1h: '-0.000022881',
    };

    test('normalizes funding rate correctly', () => {
      const result = normalizer.normalizeFundingRate(mockFunding, 'ETH/USD:USD');

      expect(result.symbol).toBe('ETH/USD:USD');
      expect(result.fundingRate).toBe(-0.000022881);
      expect(result.fundingTimestamp).toBeGreaterThan(0);
      expect(result.nextFundingTimestamp).toBeGreaterThan(result.fundingTimestamp);
      expect(result.fundingIntervalHours).toBe(1);
    });
  });

  // =========================================================================
  // normalizeCandles
  // =========================================================================

  describe('normalizeCandles', () => {
    const mockCandles: EtherealCandleResponse[] = [
      {
        timestamp: 1700000000000,
        open: '3100.00',
        high: '3200.00',
        low: '3050.00',
        close: '3150.00',
        volume: '5000.5',
      },
      {
        timestamp: 1700003600000,
        open: '3150.00',
        high: '3180.00',
        low: '3120.00',
        close: '3170.00',
        volume: '3200.0',
      },
    ];

    test('normalizes candles array', () => {
      const result = normalizer.normalizeCandles(mockCandles);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual([1700000000000, 3100, 3200, 3050, 3150, 5000.5]);
      expect(result[1]).toEqual([1700003600000, 3150, 3180, 3120, 3170, 3200]);
    });

    test('handles empty candles array', () => {
      const result = normalizer.normalizeCandles([]);
      expect(result).toEqual([]);
    });
  });
});
