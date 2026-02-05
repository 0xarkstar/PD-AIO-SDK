/**
 * dYdX v4 Normalizer Unit Tests
 */

import { DydxNormalizer } from '../../src/adapters/dydx/DydxNormalizer.js';
import type {
  DydxPerpetualMarket,
  DydxOrder,
  DydxPerpetualPosition,
  DydxOrderBookResponse,
  DydxTrade,
  DydxFill,
  DydxHistoricalFunding,
  DydxSubaccount,
  DydxCandle,
} from '../../src/adapters/dydx/types.js';

describe('DydxNormalizer', () => {
  let normalizer: DydxNormalizer;

  beforeEach(() => {
    normalizer = new DydxNormalizer();
  });

  describe('normalizeMarket', () => {
    test('normalizes market data correctly', () => {
      const dydxMarket: DydxPerpetualMarket = {
        ticker: 'BTC-USD',
        status: 'ACTIVE',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        oraclePrice: '85000.50',
        priceChange24H: '0.025',
        volume24H: '1500000000',
        trades24H: 50000,
        openInterest: '10000',
        openInterestUSDC: '850000000',
        nextFundingRate: '0.0001',
        nextFundingAt: '2024-01-15T12:00:00.000Z',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
        stepSize: '0.0001',
        stepBaseQuantums: 1000000,
        subticksPerTick: 100000,
        tickSize: '1',
        atomicResolution: -10,
        quantumConversionExponent: -8,
      };

      const market = normalizer.normalizeMarket(dydxMarket);

      expect(market.id).toBe('BTC-USD');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.0001);
      expect(market.fundingIntervalHours).toBe(1);
    });

    test('marks inactive markets correctly', () => {
      const dydxMarket: DydxPerpetualMarket = {
        ticker: 'ETH-USD',
        status: 'PAUSED',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        oraclePrice: '3500.00',
        priceChange24H: '0',
        volume24H: '0',
        trades24H: 0,
        openInterest: '0',
        openInterestUSDC: '0',
        nextFundingRate: '0',
        nextFundingAt: '2024-01-15T12:00:00.000Z',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
        stepSize: '0.001',
        stepBaseQuantums: 1000000,
        subticksPerTick: 100000,
        tickSize: '0.1',
        atomicResolution: -9,
        quantumConversionExponent: -7,
      };

      const market = normalizer.normalizeMarket(dydxMarket);

      expect(market.active).toBe(false);
    });
  });

  describe('normalizeOrder', () => {
    test('normalizes open order correctly', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-123',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-456',
        clobPairId: '0',
        side: 'BUY',
        size: '0.5',
        price: '85000',
        totalFilled: '0',
        status: 'OPEN',
        type: 'LIMIT',
        timeInForce: 'GTT',
        postOnly: true,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.id).toBe('order-123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(0.5);
      expect(order.price).toBe(85000);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0);
      expect(order.remaining).toBe(0.5);
      expect(order.postOnly).toBe(true);
      expect(order.reduceOnly).toBe(false);
    });

    test('normalizes filled order correctly', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-789',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-789',
        clobPairId: '0',
        side: 'SELL',
        size: '1.0',
        price: '86000',
        totalFilled: '1.0',
        status: 'FILLED',
        type: 'LIMIT',
        timeInForce: 'IOC',
        postOnly: false,
        reduceOnly: true,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T11:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.status).toBe('filled');
      expect(order.filled).toBe(1.0);
      expect(order.remaining).toBe(0);
      expect(order.reduceOnly).toBe(true);
      expect(order.timeInForce).toBe('IOC');
    });

    test('normalizes canceled order correctly', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-999',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-999',
        clobPairId: '0',
        side: 'BUY',
        size: '0.25',
        price: '84000',
        totalFilled: '0.1',
        status: 'CANCELED',
        type: 'LIMIT',
        timeInForce: 'GTT',
        postOnly: false,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        removalReason: 'USER_CANCELED',
        updatedAt: '2024-01-15T12:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.status).toBe('canceled');
      expect(order.filled).toBe(0.1);
      expect(order.remaining).toBe(0.15);
    });

    test('normalizes stop limit order correctly', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-stop-1',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-stop',
        clobPairId: '0',
        side: 'SELL',
        size: '0.5',
        price: '80000',
        totalFilled: '0',
        status: 'UNTRIGGERED',
        type: 'STOP_LIMIT',
        timeInForce: 'GTT',
        postOnly: false,
        reduceOnly: true,
        ticker: 'BTC-USD',
        orderFlags: '0',
        triggerPrice: '81000',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.type).toBe('stopLimit');
      expect(order.stopPrice).toBe(81000);
      expect(order.status).toBe('open');
    });

    test('normalizes stop market order correctly', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-stop-market-1',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-stop-market',
        clobPairId: '0',
        side: 'SELL',
        size: '0.5',
        price: '0',
        totalFilled: '0',
        status: 'UNTRIGGERED',
        type: 'STOP_MARKET',
        timeInForce: 'GTT',
        postOnly: false,
        reduceOnly: true,
        ticker: 'BTC-USD',
        orderFlags: '0',
        triggerPrice: '80000',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.type).toBe('stopMarket');
      expect(order.stopPrice).toBe(80000);
    });

    test('normalizes market order correctly', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-market-1',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-market',
        clobPairId: '0',
        side: 'BUY',
        size: '1.0',
        price: '0',
        totalFilled: '1.0',
        status: 'FILLED',
        type: 'MARKET',
        timeInForce: 'IOC',
        postOnly: false,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.type).toBe('market');
      expect(order.status).toBe('filled');
    });

    test('normalizes order with FOK time in force', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-fok-1',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-fok',
        clobPairId: '0',
        side: 'BUY',
        size: '2.0',
        price: '85000',
        totalFilled: '0',
        status: 'OPEN',
        type: 'LIMIT',
        timeInForce: 'FOK',
        postOnly: false,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.timeInForce).toBe('FOK');
    });

    test('normalizes order with BEST_EFFORT_CANCELED status', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-best-effort-canceled',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-bec',
        clobPairId: '0',
        side: 'BUY',
        size: '1.0',
        price: '85000',
        totalFilled: '0',
        status: 'BEST_EFFORT_CANCELED',
        type: 'LIMIT',
        timeInForce: 'GTT',
        postOnly: false,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.status).toBe('canceled');
    });

    test('normalizes order with PENDING status', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-pending-1',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-pending',
        clobPairId: '0',
        side: 'BUY',
        size: '1.0',
        price: '85000',
        totalFilled: '0',
        status: 'PENDING',
        type: 'LIMIT',
        timeInForce: 'GTT',
        postOnly: false,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      expect(order.status).toBe('open');
    });

    test('normalizes order with unknown status to open', () => {
      const dydxOrder: DydxOrder = {
        id: 'order-unknown-status',
        subaccountId: 'dydx1abc/0',
        clientId: 'client-unknown',
        clobPairId: '0',
        side: 'BUY',
        size: '1.0',
        price: '85000',
        totalFilled: '0',
        status: 'SOME_UNKNOWN_STATUS' as any,
        type: 'LIMIT',
        timeInForce: 'GTT',
        postOnly: false,
        reduceOnly: false,
        ticker: 'BTC-USD',
        orderFlags: '0',
        clientMetadata: '0',
        updatedAt: '2024-01-15T13:00:00.000Z',
      };

      const order = normalizer.normalizeOrder(dydxOrder);

      // Unknown status defaults to 'open'
      expect(order.status).toBe('open');
    });
  });

  describe('normalizePosition', () => {
    test('normalizes long position correctly', () => {
      const dydxPosition: DydxPerpetualPosition = {
        market: 'BTC-USD',
        status: 'OPEN',
        side: 'LONG',
        size: '0.5',
        maxSize: '1.0',
        entryPrice: '84000',
        realizedPnl: '100',
        unrealizedPnl: '500',
        createdAt: '2024-01-15T08:00:00.000Z',
        createdAtHeight: '1000000',
        sumOpen: '0.5',
        sumClose: '0',
        netFunding: '-10',
        subaccountNumber: 0,
      };

      const position = normalizer.normalizePosition(dydxPosition, 85000);

      expect(position.symbol).toBe('BTC/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(0.5);
      expect(position.entryPrice).toBe(84000);
      expect(position.markPrice).toBe(85000);
      expect(position.unrealizedPnl).toBe(500);
      expect(position.realizedPnl).toBe(100);
      expect(position.marginMode).toBe('cross');
    });

    test('normalizes short position correctly', () => {
      const dydxPosition: DydxPerpetualPosition = {
        market: 'ETH-USD',
        status: 'OPEN',
        side: 'SHORT',
        size: '-2.0',
        maxSize: '5.0',
        entryPrice: '3600',
        realizedPnl: '200',
        unrealizedPnl: '300',
        createdAt: '2024-01-15T09:00:00.000Z',
        createdAtHeight: '1000100',
        sumOpen: '2.0',
        sumClose: '0',
        netFunding: '5',
        subaccountNumber: 0,
      };

      const position = normalizer.normalizePosition(dydxPosition, 3500);

      expect(position.symbol).toBe('ETH/USD:USD');
      expect(position.side).toBe('short');
      expect(position.size).toBe(2.0);
      expect(position.markPrice).toBe(3500);
    });
  });

  describe('normalizeOrderBook', () => {
    test('normalizes order book correctly', () => {
      const dydxOrderBook: DydxOrderBookResponse = {
        bids: [
          { price: '84990', size: '1.5' },
          { price: '84980', size: '2.0' },
          { price: '84970', size: '3.5' },
        ],
        asks: [
          { price: '85000', size: '1.0' },
          { price: '85010', size: '2.5' },
          { price: '85020', size: '4.0' },
        ],
      };

      const orderBook = normalizer.normalizeOrderBook(dydxOrderBook, 'BTC-USD');

      expect(orderBook.symbol).toBe('BTC/USD:USD');
      expect(orderBook.exchange).toBe('dydx');
      expect(orderBook.bids).toHaveLength(3);
      expect(orderBook.asks).toHaveLength(3);
      expect(orderBook.bids[0]).toEqual([84990, 1.5]);
      expect(orderBook.asks[0]).toEqual([85000, 1.0]);
    });

    test('handles empty order book', () => {
      const dydxOrderBook: DydxOrderBookResponse = {
        bids: [],
        asks: [],
      };

      const orderBook = normalizer.normalizeOrderBook(dydxOrderBook, 'BTC-USD');

      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });
  });

  describe('normalizeTrade', () => {
    test('normalizes buy trade correctly', () => {
      const dydxTrade: DydxTrade = {
        id: 'trade-123',
        side: 'BUY',
        size: '0.25',
        price: '85000',
        type: 'LIMIT',
        createdAt: '2024-01-15T10:30:00.000Z',
        createdAtHeight: '1000500',
      };

      const trade = normalizer.normalizeTrade(dydxTrade, 'BTC-USD');

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(85000);
      expect(trade.amount).toBe(0.25);
      expect(trade.cost).toBe(21250);
    });

    test('normalizes sell trade correctly', () => {
      const dydxTrade: DydxTrade = {
        id: 'trade-456',
        side: 'SELL',
        size: '1.5',
        price: '3500',
        type: 'LIMIT',
        createdAt: '2024-01-15T11:30:00.000Z',
        createdAtHeight: '1000600',
      };

      const trade = normalizer.normalizeTrade(dydxTrade, 'ETH-USD');

      expect(trade.side).toBe('sell');
      expect(trade.amount).toBe(1.5);
      expect(trade.cost).toBe(5250);
    });
  });

  describe('normalizeFill', () => {
    test('normalizes fill correctly', () => {
      const dydxFill: DydxFill = {
        id: 'fill-123',
        side: 'BUY',
        liquidity: 'TAKER',
        type: 'LIMIT',
        market: 'BTC-USD',
        marketType: 'PERPETUAL',
        price: '85000',
        size: '0.5',
        fee: '21.25',
        createdAt: '2024-01-15T12:00:00.000Z',
        createdAtHeight: '1000700',
        orderId: 'order-123',
        subaccountNumber: 0,
      };

      const trade = normalizer.normalizeFill(dydxFill);

      expect(trade.id).toBe('fill-123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.orderId).toBe('order-123');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(85000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(42500);
      expect(trade.info?.liquidity).toBe('TAKER');
      expect(trade.info?.fee).toBe('21.25');
    });
  });

  describe('normalizeFundingRate', () => {
    test('normalizes funding rate correctly', () => {
      const dydxFunding: DydxHistoricalFunding = {
        ticker: 'BTC-USD',
        rate: '0.0001',
        price: '85000',
        effectiveAt: '2024-01-15T12:00:00.000Z',
        effectiveAtHeight: '1000800',
      };

      const fundingRate = normalizer.normalizeFundingRate(dydxFunding, 85100);

      expect(fundingRate.symbol).toBe('BTC/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(85100);
      expect(fundingRate.indexPrice).toBe(85000);
      expect(fundingRate.fundingIntervalHours).toBe(1);
    });
  });

  describe('normalizeBalance', () => {
    test('normalizes subaccount balance correctly', () => {
      const dydxSubaccount: DydxSubaccount = {
        address: 'dydx1abc123',
        subaccountNumber: 0,
        equity: '100000',
        freeCollateral: '75000',
        pendingDeposits: '0',
        pendingWithdrawals: '0',
        marginEnabled: true,
        updatedAtHeight: '1000900',
        latestProcessedBlockHeight: '1000900',
        openPerpetualPositions: {},
        assetPositions: {},
      };

      const balances = normalizer.normalizeBalance(dydxSubaccount);

      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe('USDC');
      expect(balances[0].total).toBe(100000);
      expect(balances[0].free).toBe(75000);
      expect(balances[0].used).toBe(25000);
      expect(balances[0].usdValue).toBe(100000);
    });
  });

  describe('normalizeTicker', () => {
    test('normalizes ticker correctly', () => {
      const dydxMarket: DydxPerpetualMarket = {
        ticker: 'BTC-USD',
        status: 'ACTIVE',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        oraclePrice: '85000',
        priceChange24H: '0.025',
        volume24H: '1500000000',
        trades24H: 50000,
        openInterest: '10000',
        openInterestUSDC: '850000000',
        nextFundingRate: '0.0001',
        nextFundingAt: '2024-01-15T12:00:00.000Z',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
        stepSize: '0.0001',
        stepBaseQuantums: 1000000,
        subticksPerTick: 100000,
        tickSize: '1',
        atomicResolution: -10,
        quantumConversionExponent: -8,
      };

      const ticker = normalizer.normalizeTicker(dydxMarket);

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(85000);
      expect(ticker.percentage).toBeCloseTo(2.5, 1);
      expect(ticker.quoteVolume).toBe(1500000000);
    });
  });

  describe('normalizeCandle', () => {
    test('normalizes candle correctly', () => {
      const dydxCandle: DydxCandle = {
        startedAt: '2024-01-15T11:00:00.000Z',
        ticker: 'BTC-USD',
        resolution: '1HOUR',
        low: '84500',
        high: '85500',
        open: '84800',
        close: '85200',
        baseTokenVolume: '150.5',
        usdVolume: '12787500',
        trades: 5000,
        startingOpenInterest: '10000',
      };

      const ohlcv = normalizer.normalizeCandle(dydxCandle);

      expect(ohlcv).toHaveLength(6);
      expect(ohlcv[0]).toBe(new Date('2024-01-15T11:00:00.000Z').getTime());
      expect(ohlcv[1]).toBe(84800); // open
      expect(ohlcv[2]).toBe(85500); // high
      expect(ohlcv[3]).toBe(84500); // low
      expect(ohlcv[4]).toBe(85200); // close
      expect(ohlcv[5]).toBe(150.5); // volume
    });
  });
});
