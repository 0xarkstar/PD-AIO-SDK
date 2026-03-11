/**
 * Reya Normalizer Tests
 *
 * Tests for all normalizer methods with realistic mock data
 * matching the Zod schemas (.passthrough()).
 */

import { ReyaNormalizer } from '../../../src/adapters/reya/ReyaNormalizer.js';
import type {
  ReyaMarketDefinition,
  ReyaMarketSummary,
  ReyaDepth,
  ReyaPerpExecution,
  ReyaOrder,
  ReyaPosition,
  ReyaAccountBalance,
  ReyaPrice,
  ReyaCandleHistoryData,
} from '../../../src/adapters/reya/types.js';

describe('ReyaNormalizer', () => {
  let normalizer: ReyaNormalizer;

  beforeEach(() => {
    normalizer = new ReyaNormalizer();
  });

  // =========================================================================
  // Symbol Conversion
  // =========================================================================

  describe('symbolToCCXT', () => {
    test('converts BTCRUSDPERP to BTC/USD:USD', () => {
      expect(normalizer.symbolToCCXT('BTCRUSDPERP')).toBe('BTC/USD:USD');
    });
  });

  describe('symbolFromCCXT', () => {
    test('converts BTC/USD:USD to BTCRUSDPERP', () => {
      expect(normalizer.symbolFromCCXT('BTC/USD:USD')).toBe('BTCRUSDPERP');
    });

    test('handles symbol without settle part', () => {
      expect(normalizer.symbolFromCCXT('ETH/USD')).toBe('ETHRUSDPERP');
    });
  });

  describe('normalizeSymbol / toExchangeSymbol', () => {
    test('normalizeSymbol delegates to symbolToCCXT', () => {
      expect(normalizer.normalizeSymbol('SOLRUSDPERP')).toBe('SOL/USD:USD');
    });

    test('toExchangeSymbol delegates to symbolFromCCXT', () => {
      expect(normalizer.toExchangeSymbol('SOL/USD:USD')).toBe('SOLRUSDPERP');
    });
  });

  // =========================================================================
  // normalizeMarket
  // =========================================================================

  describe('normalizeMarket', () => {
    const mockDefinition: ReyaMarketDefinition = {
      symbol: 'BTCRUSDPERP',
      marketId: 1,
      minOrderQty: '0.001',
      qtyStepSize: '0.001',
      tickSize: '0.01',
      liquidationMarginParameter: '0.005',
      initialMarginParameter: '0.02',
      maxLeverage: 50,
      oiCap: '1000000',
    };

    test('normalizes market definition correctly', () => {
      const market = normalizer.normalizeMarket(mockDefinition);

      expect(market.id).toBe('1');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.pricePrecision).toBe(2);
      expect(market.amountPrecision).toBe(3);
      expect(market.priceTickSize).toBe(0.01);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.makerFee).toBe(0.0002);
      expect(market.takerFee).toBe(0.0005);
      expect(market.maxLeverage).toBe(50);
      expect(market.fundingIntervalHours).toBe(1);
    });

    test('includes info fields from definition', () => {
      const market = normalizer.normalizeMarket(mockDefinition);

      expect(market.info).toEqual({
        liquidationMarginParameter: '0.005',
        initialMarginParameter: '0.02',
        oiCap: '1000000',
      });
    });

    test('handles summary parameter (optional)', () => {
      const summary: ReyaMarketSummary = {
        symbol: 'BTCRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '100',
        shortOiQty: '95',
        oiQty: '195',
        fundingRate: '0.0001',
        longFundingValue: '0',
        shortFundingValue: '0',
        fundingRateVelocity: '0.00001',
        volume24h: '50000000',
      };

      const market = normalizer.normalizeMarket(mockDefinition, summary);
      expect(market.symbol).toBe('BTC/USD:USD');
    });

    test('calculates precision correctly for small tick sizes', () => {
      const def: ReyaMarketDefinition = {
        ...mockDefinition,
        tickSize: '0.0001',
        qtyStepSize: '0.01',
      };

      const market = normalizer.normalizeMarket(def);
      expect(market.pricePrecision).toBe(4);
      expect(market.amountPrecision).toBe(2);
    });
  });

  // =========================================================================
  // normalizeTicker
  // =========================================================================

  describe('normalizeTicker', () => {
    const mockSummary: ReyaMarketSummary = {
      symbol: 'BTCRUSDPERP',
      updatedAt: 1700000000000,
      longOiQty: '100',
      shortOiQty: '95',
      oiQty: '195',
      fundingRate: '0.0001',
      longFundingValue: '500',
      shortFundingValue: '-500',
      fundingRateVelocity: '0.00001',
      volume24h: '50000000',
      pxChange24h: '0.02',
    };

    const mockPrice: ReyaPrice = {
      symbol: 'BTCRUSDPERP',
      oraclePrice: '65000.50',
      poolPrice: '65010.25',
      updatedAt: 1700000000000,
    };

    test('normalizes ticker with price data', () => {
      const ticker = normalizer.normalizeTicker(mockSummary, mockPrice);

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(65010.25);
      expect(ticker.bid).toBe(65010.25);
      expect(ticker.ask).toBe(65010.25);
      // close = currentPrice (poolPrice), not oraclePrice
      expect(ticker.close).toBe(65010.25);
      // pxChange24h is absolute USD change
      expect(ticker.change).toBe(0.02);
      // open = 65010.25 - 0.02 = 65010.23, pct = (0.02 / 65010.23) * 100
      expect(ticker.percentage).toBeCloseTo((0.02 / 65010.23) * 100, 6);
      expect(ticker.quoteVolume).toBe(50000000);
      expect(ticker.timestamp).toBe(1700000000000);
    });

    test('falls back to oraclePrice when poolPrice is missing', () => {
      const priceNoPool: ReyaPrice = {
        symbol: 'BTCRUSDPERP',
        oraclePrice: '65000.50',
        updatedAt: 1700000000000,
      };

      const ticker = normalizer.normalizeTicker(mockSummary, priceNoPool);
      expect(ticker.last).toBe(65000.50);
    });

    test('handles missing price entirely', () => {
      const ticker = normalizer.normalizeTicker(mockSummary);

      expect(ticker.last).toBe(0);
      expect(ticker.close).toBe(0);
    });

    test('includes funding info in ticker info', () => {
      const ticker = normalizer.normalizeTicker(mockSummary, mockPrice);

      expect(ticker.info).toEqual({
        fundingRate: '0.0001',
        fundingRateVelocity: '0.00001',
        longOiQty: '100',
        shortOiQty: '95',
        _bidAskSource: 'pool_price',
      });
    });

    test('calculates open price from currentPrice minus absolute pxChange', () => {
      const ticker = normalizer.normalizeTicker(mockSummary, mockPrice);

      // open = currentPrice - pxChangeAbs = 65010.25 - 0.02 = 65010.23
      expect(ticker.open).toBeCloseTo(65010.23, 2);
    });
  });

  // =========================================================================
  // normalizeOrderBook
  // =========================================================================

  describe('normalizeOrderBook', () => {
    const mockDepth: ReyaDepth = {
      symbol: 'ETHRUSDPERP',
      type: 'SNAPSHOT',
      bids: [
        { px: '3500.50', qty: '10.5' },
        { px: '3499.00', qty: '20.0' },
      ],
      asks: [
        { px: '3501.00', qty: '8.2' },
        { px: '3502.50', qty: '15.0' },
      ],
      updatedAt: 1700000000000,
    };

    test('normalizes order book structure', () => {
      const ob = normalizer.normalizeOrderBook(mockDepth);

      expect(ob.symbol).toBe('ETH/USD:USD');
      expect(ob.exchange).toBe('reya');
      expect(ob.timestamp).toBe(1700000000000);
    });

    test('normalizes bids as [price, qty] tuples', () => {
      const ob = normalizer.normalizeOrderBook(mockDepth);

      expect(ob.bids).toEqual([
        [3500.50, 10.5],
        [3499.00, 20.0],
      ]);
    });

    test('normalizes asks as [price, qty] tuples', () => {
      const ob = normalizer.normalizeOrderBook(mockDepth);

      expect(ob.asks).toEqual([
        [3501.00, 8.2],
        [3502.50, 15.0],
      ]);
    });

    test('handles empty order book', () => {
      const emptyDepth: ReyaDepth = {
        symbol: 'BTCRUSDPERP',
        type: 'SNAPSHOT',
        bids: [],
        asks: [],
        updatedAt: 1700000000000,
      };

      const ob = normalizer.normalizeOrderBook(emptyDepth);
      expect(ob.bids).toEqual([]);
      expect(ob.asks).toEqual([]);
    });
  });

  // =========================================================================
  // normalizeTrade
  // =========================================================================

  describe('normalizeTrade', () => {
    const mockExecution: ReyaPerpExecution = {
      exchangeId: 1,
      symbol: 'BTCRUSDPERP',
      accountId: 123,
      qty: '0.5',
      side: 'B',
      price: '65000.00',
      fee: '16.25',
      type: 'ORDER_MATCH',
      timestamp: 1700000000000,
      sequenceNumber: 42,
    };

    test('normalizes buy trade', () => {
      const trade = normalizer.normalizeTrade(mockExecution);

      expect(trade.id).toBe('42');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(65000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(32500);
      expect(trade.timestamp).toBe(1700000000000);
    });

    test('normalizes sell trade', () => {
      const sellExec: ReyaPerpExecution = { ...mockExecution, side: 'A' };
      const trade = normalizer.normalizeTrade(sellExec);

      expect(trade.side).toBe('sell');
    });

    test('includes execution info', () => {
      const trade = normalizer.normalizeTrade(mockExecution);

      expect(trade.info).toEqual({
        fee: '16.25',
        executionType: 'ORDER_MATCH',
        accountId: 123,
      });
    });
  });

  // =========================================================================
  // normalizeOrder
  // =========================================================================

  describe('normalizeOrder', () => {
    const mockOrder: ReyaOrder = {
      exchangeId: 1,
      symbol: 'BTCRUSDPERP',
      accountId: 123,
      orderId: 'order-abc-123',
      qty: '0.5',
      cumQty: '0.2',
      side: 'B',
      limitPx: '65000.00',
      orderType: 'LIMIT',
      timeInForce: 'GTC',
      reduceOnly: false,
      status: 'OPEN',
      createdAt: 1700000000000,
      lastUpdateAt: 1700000001000,
    };

    test('normalizes open limit buy order', () => {
      const order = normalizer.normalizeOrder(mockOrder);

      expect(order.id).toBe('order-abc-123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(0.5);
      expect(order.price).toBe(65000);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0.2);
      expect(order.remaining).toBe(0.3);
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(false);
    });

    test('normalizes sell order', () => {
      const sellOrder: ReyaOrder = { ...mockOrder, side: 'A' };
      const order = normalizer.normalizeOrder(sellOrder);

      expect(order.side).toBe('sell');
    });

    test('normalizes TP order as stopMarket type', () => {
      const tpOrder: ReyaOrder = { ...mockOrder, orderType: 'TP', triggerPx: '70000' };
      const order = normalizer.normalizeOrder(tpOrder);

      expect(order.type).toBe('stopMarket');
    });

    test('normalizes SL order as stopMarket type', () => {
      const slOrder: ReyaOrder = { ...mockOrder, orderType: 'SL', triggerPx: '60000' };
      const order = normalizer.normalizeOrder(slOrder);

      expect(order.type).toBe('stopMarket');
    });

    test('handles missing qty and cumQty', () => {
      const noQtyOrder: ReyaOrder = { ...mockOrder, qty: undefined, cumQty: undefined };
      const order = normalizer.normalizeOrder(noQtyOrder);

      expect(order.amount).toBe(0);
      expect(order.filled).toBe(0);
      expect(order.remaining).toBe(0);
    });

    test('includes order info metadata', () => {
      const order = normalizer.normalizeOrder(mockOrder);

      expect(order.info).toEqual({
        orderType: 'LIMIT',
        timeInForce: 'GTC',
        triggerPx: undefined,
        accountId: 123,
      });
    });
  });

  // =========================================================================
  // normalizePosition
  // =========================================================================

  describe('normalizePosition', () => {
    const mockPosition: ReyaPosition = {
      exchangeId: 1,
      symbol: 'BTCRUSDPERP',
      accountId: 123,
      qty: '0.5',
      side: 'B',
      avgEntryPrice: '64000.00',
      avgEntryFundingValue: '3.50',
      lastTradeSequenceNumber: 100,
    };

    test('normalizes long position', () => {
      const pos = normalizer.normalizePosition(mockPosition);

      expect(pos.symbol).toBe('BTC/USD:USD');
      expect(pos.side).toBe('long');
      expect(pos.size).toBe(0.5);
      expect(pos.entryPrice).toBe(64000);
      expect(pos.marginMode).toBe('cross');
    });

    test('normalizes short position', () => {
      const shortPos: ReyaPosition = { ...mockPosition, side: 'A', qty: '-0.3' };
      const pos = normalizer.normalizePosition(shortPos);

      expect(pos.side).toBe('short');
      expect(pos.size).toBe(0.3);
    });

    test('sets zero values for unavailable fields', () => {
      const pos = normalizer.normalizePosition(mockPosition);

      expect(pos.markPrice).toBe(0);
      expect(pos.liquidationPrice).toBe(0);
      expect(pos.unrealizedPnl).toBe(0);
      expect(pos.leverage).toBe(0);
    });

    test('includes position info metadata', () => {
      const pos = normalizer.normalizePosition(mockPosition);

      expect(pos.info).toEqual({
        accountId: 123,
        avgEntryFundingValue: '3.50',
        lastTradeSequenceNumber: 100,
        _realizedPnlSource: 'not_available',
        _marginRatioSource: 'not_available',
      });
    });
  });

  // =========================================================================
  // normalizeBalance
  // =========================================================================

  describe('normalizeBalance', () => {
    const mockBalance: ReyaAccountBalance = {
      accountId: 123,
      asset: 'rUSD',
      realBalance: '50000.50',
      balanceDEPRECATED: '50000.50',
    };

    test('normalizes balance correctly', () => {
      const bal = normalizer.normalizeBalance(mockBalance);

      expect(bal.currency).toBe('rUSD');
      expect(bal.total).toBe(50000.50);
      expect(bal.free).toBe(50000.50);
      expect(bal.used).toBe(0);
      expect(bal.usdValue).toBe(50000.50);
    });
  });

  // =========================================================================
  // normalizeFundingRate
  // =========================================================================

  describe('normalizeFundingRate', () => {
    const mockSummary: ReyaMarketSummary = {
      symbol: 'BTCRUSDPERP',
      updatedAt: 1700000000000,
      longOiQty: '100',
      shortOiQty: '95',
      oiQty: '195',
      fundingRate: '0.0001',
      longFundingValue: '0',
      shortFundingValue: '0',
      fundingRateVelocity: '0.00001',
      volume24h: '50000000',
    };

    test('normalizes funding rate', () => {
      const fr = normalizer.normalizeFundingRate(mockSummary, 65000);

      expect(fr.symbol).toBe('BTC/USD:USD');
      expect(fr.fundingRate).toBe(0.0001);
      expect(fr.fundingTimestamp).toBe(1700000000000);
      expect(fr.markPrice).toBe(65000);
      expect(fr.indexPrice).toBe(65000);
      expect(fr.fundingIntervalHours).toBe(1);
    });

    test('calculates next funding timestamp correctly', () => {
      const fr = normalizer.normalizeFundingRate(mockSummary, 65000);

      // next = updatedAt + 1 hour in ms
      expect(fr.nextFundingTimestamp).toBe(1700000000000 + 3600000);
    });
  });

  // =========================================================================
  // normalizeCandles
  // =========================================================================

  describe('normalizeCandles', () => {
    const mockCandleData: ReyaCandleHistoryData = {
      t: [1700000000, 1700003600, 1700007200],
      o: ['65000.00', '65100.00', '65050.00'],
      h: ['65200.00', '65300.00', '65150.00'],
      l: ['64800.00', '64900.00', '64950.00'],
      c: ['65100.00', '65050.00', '65100.00'],
    };

    test('normalizes candles with timestamps in ms', () => {
      const candles = normalizer.normalizeCandles(mockCandleData);

      expect(candles).toHaveLength(3);
      expect(candles[0]).toEqual([
        1700000000000,  // t * 1000
        65000,          // open
        65200,          // high
        64800,          // low
        65100,          // close
        0,              // volume (not available)
      ]);
    });

    test('respects limit parameter', () => {
      const candles = normalizer.normalizeCandles(mockCandleData, 2);
      expect(candles).toHaveLength(2);
    });

    test('handles empty candle data', () => {
      const empty: ReyaCandleHistoryData = { t: [], o: [], h: [], l: [], c: [] };
      const candles = normalizer.normalizeCandles(empty);
      expect(candles).toEqual([]);
    });

    test('limit larger than data returns all candles', () => {
      const candles = normalizer.normalizeCandles(mockCandleData, 100);
      expect(candles).toHaveLength(3);
    });
  });
});
