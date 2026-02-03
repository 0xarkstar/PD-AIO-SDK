/**
 * dYdX v4 Adapter Unit Tests
 */

import { DydxAdapter, type DydxConfig } from '../../src/adapters/dydx/DydxAdapter.js';
import { DydxNormalizer } from '../../src/adapters/dydx/DydxNormalizer.js';
import {
  unifiedToDydx,
  dydxToUnified,
  DYDX_API_URLS,
  DYDX_ORDER_TYPES,
  DYDX_ORDER_SIDES,
  DYDX_ORDER_STATUSES,
  DYDX_TIME_IN_FORCE,
  DYDX_WS_CHANNELS,
  DYDX_DEFAULT_PRECISION,
  DYDX_FUNDING_INTERVAL_HOURS,
  DYDX_ERROR_MESSAGES,
} from '../../src/adapters/dydx/constants.js';

describe('DydxAdapter', () => {
  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const adapter = new DydxAdapter();

      expect(adapter.id).toBe('dydx');
      expect(adapter.name).toBe('dYdX v4');
      expect(adapter.isReady).toBe(false);
    });

    test('creates adapter with testnet config', () => {
      const adapter = new DydxAdapter({ testnet: true });

      expect(adapter.id).toBe('dydx');
    });

    test('creates adapter with custom subaccount number', () => {
      const adapter = new DydxAdapter({
        subaccountNumber: 5,
      });

      expect(adapter.getSubaccountNumber()).toBe(5);
    });

    test('defaults to subaccount 0', () => {
      const adapter = new DydxAdapter();

      expect(adapter.getSubaccountNumber()).toBe(0);
    });
  });

  describe('has capabilities', () => {
    let adapter: DydxAdapter;

    beforeAll(() => {
      adapter = new DydxAdapter();
    });

    test('supports market data', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchOHLCV).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
    });

    test('supports trading', () => {
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
    });

    test('has correct batch order support', () => {
      expect(adapter.has.createBatchOrders).toBe(false);
      expect(adapter.has.cancelBatchOrders).toBe('emulated');
    });

    test('supports account data', () => {
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);
    });

    test('does not support leverage/margin mode changes', () => {
      // dYdX v4 uses cross-margin without per-symbol leverage
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
    });

    test('supports WebSocket streams', () => {
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchTicker).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
      expect(adapter.has.watchOrders).toBe(true);
      expect(adapter.has.watchBalance).toBe(true);
      expect(adapter.has.watchOHLCV).toBe(true);
    });

    test('does not support deposits/withdrawals', () => {
      expect(adapter.has.fetchDeposits).toBe(false);
      expect(adapter.has.fetchWithdrawals).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    let adapter: DydxAdapter;

    beforeAll(() => {
      adapter = new DydxAdapter();
    });

    test('converts unified symbol to dYdX format', () => {
      // Access protected method through any
      const symbolToExchange = (adapter as any).symbolToExchange.bind(adapter);

      expect(symbolToExchange('BTC/USD:USD')).toBe('BTC-USD');
      expect(symbolToExchange('ETH/USD:USD')).toBe('ETH-USD');
      expect(symbolToExchange('SOL/USD:USD')).toBe('SOL-USD');
    });

    test('converts dYdX symbol to unified format', () => {
      const symbolFromExchange = (adapter as any).symbolFromExchange.bind(adapter);

      expect(symbolFromExchange('BTC-USD')).toBe('BTC/USD:USD');
      expect(symbolFromExchange('ETH-USD')).toBe('ETH/USD:USD');
      expect(symbolFromExchange('SOL-USD')).toBe('SOL/USD:USD');
    });
  });

  describe('disconnect', () => {
    test('cleans up resources on disconnect', async () => {
      const adapter = new DydxAdapter();

      await adapter.disconnect();

      expect(adapter.isDisconnected()).toBe(true);
    });
  });

  describe('setLeverage', () => {
    test('throws error because dYdX v4 uses cross-margin', async () => {
      const adapter = new DydxAdapter();

      await expect(adapter.setLeverage('BTC/USD:USD', 10)).rejects.toThrow('cross-margin');
    });
  });

  describe('authentication requirement', () => {
    let adapter: DydxAdapter;

    beforeAll(() => {
      adapter = new DydxAdapter();
    });

    test('fetchPositions requires authentication', async () => {
      // Without authentication, it should fail
      // Note: This test may need adjustment based on actual implementation
      await expect(adapter.fetchPositions()).rejects.toThrow();
    });

    test('fetchBalance requires authentication', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow();
    });

    test('fetchOrderHistory requires authentication', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow();
    });

    test('fetchMyTrades requires authentication', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow();
    });

    test('createOrder requires authentication', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USD:USD',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 50000,
        })
      ).rejects.toThrow();
    });

    test('cancelOrder requires authentication', async () => {
      await expect(adapter.cancelOrder('order-123', 'BTC/USD:USD')).rejects.toThrow();
    });

    test('cancelAllOrders requires authentication', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow();
    });
  });

  describe('getAddress', () => {
    test('returns undefined when not authenticated', async () => {
      const adapter = new DydxAdapter();

      const address = await adapter.getAddress();

      expect(address).toBeUndefined();
    });

    test('returns address when authenticated', async () => {
      const adapter = new DydxAdapter({
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      });

      const address = await adapter.getAddress();

      expect(address).toBeDefined();
      expect(address?.startsWith('dydx')).toBe(true);
    });
  });

  describe('rate limiter', () => {
    test('initializes rate limiter with correct config', () => {
      const adapter = new DydxAdapter({
        rateLimit: {
          maxRequests: 50,
          windowMs: 30000,
        },
      });

      // Rate limiter is protected, so we just verify adapter created successfully
      expect(adapter).toBeInstanceOf(DydxAdapter);
    });
  });
});

describe('dYdX Constants', () => {
  describe('symbol conversion functions', () => {
    test('unifiedToDydx converts correctly', () => {
      expect(unifiedToDydx('BTC/USD:USD')).toBe('BTC-USD');
      expect(unifiedToDydx('ETH/USD:USD')).toBe('ETH-USD');
      expect(unifiedToDydx('SOL/USD:USD')).toBe('SOL-USD');
    });

    test('unifiedToDydx handles simple symbols', () => {
      expect(unifiedToDydx('BTC/USD')).toBe('BTC-USD');
      expect(unifiedToDydx('ETH/USD')).toBe('ETH-USD');
    });

    test('unifiedToDydx throws on invalid format', () => {
      expect(() => unifiedToDydx('')).toThrow();
    });

    test('dydxToUnified converts correctly', () => {
      expect(dydxToUnified('BTC-USD')).toBe('BTC/USD:USD');
      expect(dydxToUnified('ETH-USD')).toBe('ETH/USD:USD');
      expect(dydxToUnified('SOL-USD')).toBe('SOL/USD:USD');
    });

    test('dydxToUnified handles base only', () => {
      expect(dydxToUnified('BTC')).toBe('BTC/USD:USD');
    });
  });

  describe('API URLs', () => {
    test('mainnet URLs are defined', () => {
      expect(DYDX_API_URLS.mainnet.indexer).toBeDefined();
      expect(DYDX_API_URLS.mainnet.websocket).toBeDefined();
      expect(DYDX_API_URLS.mainnet.indexer).toContain('dydx.trade');
    });

    test('testnet URLs are defined', () => {
      expect(DYDX_API_URLS.testnet.indexer).toBeDefined();
      expect(DYDX_API_URLS.testnet.websocket).toBeDefined();
      expect(DYDX_API_URLS.testnet.indexer).toContain('testnet');
    });
  });

  describe('Order Types', () => {
    test('order types are defined', () => {
      expect(DYDX_ORDER_TYPES.LIMIT).toBe('LIMIT');
      expect(DYDX_ORDER_TYPES.MARKET).toBe('MARKET');
      expect(DYDX_ORDER_TYPES.STOP_LIMIT).toBe('STOP_LIMIT');
      expect(DYDX_ORDER_TYPES.STOP_MARKET).toBe('STOP_MARKET');
      expect(DYDX_ORDER_TYPES.TRAILING_STOP).toBe('TRAILING_STOP');
      expect(DYDX_ORDER_TYPES.TAKE_PROFIT).toBe('TAKE_PROFIT');
      expect(DYDX_ORDER_TYPES.TAKE_PROFIT_MARKET).toBe('TAKE_PROFIT_MARKET');
    });

    test('order sides are defined', () => {
      expect(DYDX_ORDER_SIDES.BUY).toBe('BUY');
      expect(DYDX_ORDER_SIDES.SELL).toBe('SELL');
    });

    test('order statuses are defined', () => {
      expect(DYDX_ORDER_STATUSES.OPEN).toBe('OPEN');
      expect(DYDX_ORDER_STATUSES.FILLED).toBe('FILLED');
      expect(DYDX_ORDER_STATUSES.CANCELED).toBe('CANCELED');
      expect(DYDX_ORDER_STATUSES.BEST_EFFORT_CANCELED).toBe('BEST_EFFORT_CANCELED');
      expect(DYDX_ORDER_STATUSES.UNTRIGGERED).toBe('UNTRIGGERED');
      expect(DYDX_ORDER_STATUSES.PENDING).toBe('PENDING');
    });

    test('time in force options are defined', () => {
      expect(DYDX_TIME_IN_FORCE.GTT).toBe('GTT');
      expect(DYDX_TIME_IN_FORCE.FOK).toBe('FOK');
      expect(DYDX_TIME_IN_FORCE.IOC).toBe('IOC');
    });
  });

  describe('WebSocket channels', () => {
    test('WS channels are defined', () => {
      expect(DYDX_WS_CHANNELS.MARKETS).toBe('v4_markets');
      expect(DYDX_WS_CHANNELS.TRADES).toBe('v4_trades');
      expect(DYDX_WS_CHANNELS.ORDERBOOK).toBe('v4_orderbook');
      expect(DYDX_WS_CHANNELS.CANDLES).toBe('v4_candles');
      expect(DYDX_WS_CHANNELS.SUBACCOUNTS).toBe('v4_subaccounts');
      expect(DYDX_WS_CHANNELS.BLOCK_HEIGHT).toBe('v4_block_height');
    });
  });

  describe('Precision constants', () => {
    test('default precision is defined', () => {
      expect(DYDX_DEFAULT_PRECISION.price).toBe(6);
      expect(DYDX_DEFAULT_PRECISION.amount).toBe(4);
    });
  });

  describe('Funding constants', () => {
    test('funding interval is 1 hour', () => {
      expect(DYDX_FUNDING_INTERVAL_HOURS).toBe(1);
    });
  });

  describe('Error messages', () => {
    test('error messages are mapped', () => {
      expect(DYDX_ERROR_MESSAGES['insufficient funds']).toBe('INSUFFICIENT_MARGIN');
      expect(DYDX_ERROR_MESSAGES['invalid signature']).toBe('INVALID_SIGNATURE');
      expect(DYDX_ERROR_MESSAGES['rate limit exceeded']).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});

describe('DydxNormalizer', () => {
  let normalizer: DydxNormalizer;

  beforeEach(() => {
    normalizer = new DydxNormalizer();
  });

  describe('normalizeMarket', () => {
    test('normalizes market correctly', () => {
      const mockMarket = {
        ticker: 'BTC-USD',
        status: 'ACTIVE',
        stepSize: '0.001',
        tickSize: '0.1',
        oraclePrice: '50000',
        openInterest: '1000',
        volume24H: '100000000',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
      };

      const market = normalizer.normalizeMarket(mockMarket as any);

      expect(market.id).toBe('BTC-USD');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.priceTickSize).toBe(0.1);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.fundingIntervalHours).toBe(1);
    });

    test('normalizes inactive market', () => {
      const mockMarket = {
        ticker: 'TEST-USD',
        status: 'PAUSED',
        stepSize: '1',
        tickSize: '1',
        oraclePrice: '100',
        openInterest: '0',
        volume24H: '0',
        initialMarginFraction: '0.1',
        maintenanceMarginFraction: '0.05',
      };

      const market = normalizer.normalizeMarket(mockMarket as any);

      expect(market.active).toBe(false);
    });
  });

  describe('normalizeMarkets', () => {
    test('normalizes multiple markets', () => {
      const mockMarkets = {
        'BTC-USD': {
          ticker: 'BTC-USD',
          status: 'ACTIVE',
          stepSize: '0.001',
          tickSize: '0.1',
          oraclePrice: '50000',
          openInterest: '1000',
          volume24H: '100000000',
          initialMarginFraction: '0.05',
          maintenanceMarginFraction: '0.03',
        },
        'ETH-USD': {
          ticker: 'ETH-USD',
          status: 'ACTIVE',
          stepSize: '0.01',
          tickSize: '0.01',
          oraclePrice: '3000',
          openInterest: '5000',
          volume24H: '50000000',
          initialMarginFraction: '0.05',
          maintenanceMarginFraction: '0.03',
        },
      };

      const markets = normalizer.normalizeMarkets(mockMarkets as any);

      expect(markets).toHaveLength(2);
    });
  });

  describe('normalizeOrder', () => {
    test('normalizes limit order correctly', () => {
      const mockOrder = {
        id: 'order-123',
        ticker: 'BTC-USD',
        type: 'LIMIT',
        side: 'BUY',
        size: '0.1',
        price: '50000',
        totalFilled: '0',
        status: 'OPEN',
        reduceOnly: false,
        postOnly: true,
        clientId: 'client-order-1',
        timeInForce: 'GTT',
        triggerPrice: null,
        updatedAt: '2024-01-01T00:00:00Z',
        subaccountId: 'sub-1',
        clobPairId: 0,
        goodTilBlock: 1000,
        goodTilBlockTime: null,
        orderFlags: '0',
        removalReason: null,
      };

      const order = normalizer.normalizeOrder(mockOrder as any);

      expect(order.id).toBe('order-123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(0.1);
      expect(order.price).toBe(50000);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0);
      expect(order.remaining).toBe(0.1);
      expect(order.postOnly).toBe(true);
      expect(order.timeInForce).toBe('GTC');
    });

    test('normalizes market order correctly', () => {
      const mockOrder = {
        id: 'order-456',
        ticker: 'ETH-USD',
        type: 'MARKET',
        side: 'SELL',
        size: '1.0',
        price: null,
        totalFilled: '1.0',
        status: 'FILLED',
        reduceOnly: true,
        postOnly: false,
        clientId: null,
        timeInForce: 'IOC',
        triggerPrice: null,
        updatedAt: '2024-01-01T00:00:00Z',
        subaccountId: 'sub-1',
        clobPairId: 1,
        goodTilBlock: null,
        goodTilBlockTime: null,
        orderFlags: '0',
        removalReason: null,
      };

      const order = normalizer.normalizeOrder(mockOrder as any);

      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.status).toBe('filled');
      expect(order.reduceOnly).toBe(true);
      expect(order.timeInForce).toBe('IOC');
    });

    test('normalizes stop limit order correctly', () => {
      const mockOrder = {
        id: 'order-789',
        ticker: 'SOL-USD',
        type: 'STOP_LIMIT',
        side: 'SELL',
        size: '10',
        price: '95',
        totalFilled: '0',
        status: 'UNTRIGGERED',
        reduceOnly: true,
        postOnly: false,
        clientId: null,
        timeInForce: 'GTT',
        triggerPrice: '100',
        updatedAt: '2024-01-01T00:00:00Z',
        subaccountId: 'sub-1',
        clobPairId: 2,
        goodTilBlock: null,
        goodTilBlockTime: null,
        orderFlags: '0',
        removalReason: null,
      };

      const order = normalizer.normalizeOrder(mockOrder as any);

      expect(order.type).toBe('stopLimit');
      expect(order.stopPrice).toBe(100);
      expect(order.status).toBe('open');
    });

    test('normalizes canceled order correctly', () => {
      const mockOrder = {
        id: 'order-canceled',
        ticker: 'BTC-USD',
        type: 'LIMIT',
        side: 'BUY',
        size: '0.1',
        price: '50000',
        totalFilled: '0.05',
        status: 'CANCELED',
        reduceOnly: false,
        postOnly: false,
        clientId: null,
        timeInForce: 'GTT',
        triggerPrice: null,
        updatedAt: '2024-01-01T00:00:00Z',
        subaccountId: 'sub-1',
        clobPairId: 0,
        goodTilBlock: null,
        goodTilBlockTime: null,
        orderFlags: '0',
        removalReason: 'USER_CANCELED',
      };

      const order = normalizer.normalizeOrder(mockOrder as any);

      expect(order.status).toBe('canceled');
      expect(order.filled).toBe(0.05);
      expect(order.remaining).toBe(0.05);
    });
  });

  describe('normalizeOrders', () => {
    test('normalizes multiple orders', () => {
      const mockOrders = [
        {
          id: 'order-1',
          ticker: 'BTC-USD',
          type: 'LIMIT',
          side: 'BUY',
          size: '0.1',
          price: '50000',
          totalFilled: '0',
          status: 'OPEN',
          reduceOnly: false,
          postOnly: false,
          clientId: null,
          timeInForce: 'GTT',
          triggerPrice: null,
          updatedAt: '2024-01-01T00:00:00Z',
          subaccountId: 'sub-1',
          clobPairId: 0,
          goodTilBlock: null,
          goodTilBlockTime: null,
          orderFlags: '0',
          removalReason: null,
        },
        {
          id: 'order-2',
          ticker: 'ETH-USD',
          type: 'LIMIT',
          side: 'SELL',
          size: '1.0',
          price: '3000',
          totalFilled: '0',
          status: 'OPEN',
          reduceOnly: false,
          postOnly: false,
          clientId: null,
          timeInForce: 'GTT',
          triggerPrice: null,
          updatedAt: '2024-01-01T00:00:00Z',
          subaccountId: 'sub-1',
          clobPairId: 1,
          goodTilBlock: null,
          goodTilBlockTime: null,
          orderFlags: '0',
          removalReason: null,
        },
      ];

      const orders = normalizer.normalizeOrders(mockOrders as any);

      expect(orders).toHaveLength(2);
    });
  });

  describe('normalizePosition', () => {
    test('normalizes long position correctly', () => {
      const mockPosition = {
        market: 'BTC-USD',
        side: 'LONG',
        size: '0.5',
        entryPrice: '50000',
        unrealizedPnl: '2500',
        realizedPnl: '100',
        createdAt: '2024-01-01T00:00:00Z',
        status: 'OPEN',
        maxSize: '10',
        netFunding: '50',
        sumOpen: '0.5',
        sumClose: '0',
        subaccountNumber: 0,
      };

      const position = normalizer.normalizePosition(mockPosition as any, 55000);

      expect(position.symbol).toBe('BTC/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(0.5);
      expect(position.entryPrice).toBe(50000);
      expect(position.markPrice).toBe(55000);
      expect(position.unrealizedPnl).toBe(2500);
      expect(position.realizedPnl).toBe(100);
      expect(position.marginMode).toBe('cross');
    });

    test('normalizes short position correctly', () => {
      const mockPosition = {
        market: 'ETH-USD',
        side: 'SHORT',
        size: '-2',
        entryPrice: '3000',
        unrealizedPnl: '-100',
        realizedPnl: '0',
        createdAt: '2024-01-01T00:00:00Z',
        status: 'OPEN',
        maxSize: '100',
        netFunding: '10',
        sumOpen: '2',
        sumClose: '0',
        subaccountNumber: 0,
      };

      const position = normalizer.normalizePosition(mockPosition as any, 3050);

      expect(position.side).toBe('short');
      expect(position.size).toBe(2);
      expect(position.unrealizedPnl).toBe(-100);
    });
  });

  describe('normalizePositions', () => {
    test('normalizes positions and filters zero size', () => {
      const mockPositions = {
        'BTC-USD': {
          market: 'BTC-USD',
          side: 'LONG',
          size: '0.5',
          entryPrice: '50000',
          unrealizedPnl: '2500',
          realizedPnl: '100',
          createdAt: '2024-01-01T00:00:00Z',
          status: 'OPEN',
          maxSize: '10',
          netFunding: '50',
          sumOpen: '0.5',
          sumClose: '0',
          subaccountNumber: 0,
        },
        'ETH-USD': {
          market: 'ETH-USD',
          side: 'LONG',
          size: '0', // Zero position should be filtered
          entryPrice: '3000',
          unrealizedPnl: '0',
          realizedPnl: '0',
          createdAt: '2024-01-01T00:00:00Z',
          status: 'CLOSED',
          maxSize: '100',
          netFunding: '0',
          sumOpen: '0',
          sumClose: '0',
          subaccountNumber: 0,
        },
      };

      const positions = normalizer.normalizePositions(mockPositions as any, {
        'BTC-USD': 55000,
        'ETH-USD': 3000,
      });

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USD:USD');
    });
  });

  describe('normalizeOrderBook', () => {
    test('normalizes order book correctly', () => {
      const mockOrderBook = {
        bids: [
          { price: '50000', size: '1.5' },
          { price: '49999', size: '2.0' },
        ],
        asks: [
          { price: '50001', size: '1.0' },
          { price: '50002', size: '3.0' },
        ],
      };

      const orderBook = normalizer.normalizeOrderBook(mockOrderBook as any, 'BTC-USD');

      expect(orderBook.symbol).toBe('BTC/USD:USD');
      expect(orderBook.exchange).toBe('dydx');
      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.bids[0]).toEqual([50000, 1.5]);
      expect(orderBook.asks[0]).toEqual([50001, 1.0]);
    });
  });

  describe('normalizeTrade', () => {
    test('normalizes trade correctly', () => {
      const mockTrade = {
        id: 'trade-123',
        side: 'BUY',
        price: '50000',
        size: '0.1',
        type: 'LIMIT',
        createdAt: '2024-01-01T00:00:00Z',
        createdAtHeight: '12345',
      };

      const trade = normalizer.normalizeTrade(mockTrade as any, 'BTC-USD');

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.1);
      expect(trade.cost).toBe(5000);
    });

    test('normalizes sell trade correctly', () => {
      const mockTrade = {
        id: 'trade-456',
        side: 'SELL',
        price: '3000',
        size: '2.5',
        type: 'MARKET',
        createdAt: '2024-01-01T00:00:00Z',
        createdAtHeight: '12346',
      };

      const trade = normalizer.normalizeTrade(mockTrade as any, 'ETH-USD');

      expect(trade.side).toBe('sell');
      expect(trade.cost).toBe(7500);
    });
  });

  describe('normalizeTrades', () => {
    test('normalizes multiple trades', () => {
      const mockTrades = [
        {
          id: 'trade-1',
          side: 'BUY',
          price: '50000',
          size: '0.1',
          type: 'LIMIT',
          createdAt: '2024-01-01T00:00:00Z',
          createdAtHeight: '12345',
        },
        {
          id: 'trade-2',
          side: 'SELL',
          price: '50100',
          size: '0.1',
          type: 'LIMIT',
          createdAt: '2024-01-01T00:01:00Z',
          createdAtHeight: '12346',
        },
      ];

      const trades = normalizer.normalizeTrades(mockTrades as any, 'BTC-USD');

      expect(trades).toHaveLength(2);
    });
  });

  describe('normalizeFill', () => {
    test('normalizes fill correctly', () => {
      const mockFill = {
        id: 'fill-123',
        market: 'BTC-USD',
        orderId: 'order-456',
        side: 'BUY',
        price: '50000',
        size: '0.1',
        fee: '2.5',
        liquidity: 'MAKER',
        type: 'LIMIT',
        createdAt: '2024-01-01T00:00:00Z',
        subaccountNumber: 0,
      };

      const trade = normalizer.normalizeFill(mockFill as any);

      expect(trade.id).toBe('fill-123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.orderId).toBe('order-456');
      expect(trade.side).toBe('buy');
      expect(trade.info?.fee).toBe('2.5');
      expect(trade.info?.liquidity).toBe('MAKER');
    });
  });

  describe('normalizeFills', () => {
    test('normalizes multiple fills', () => {
      const mockFills = [
        {
          id: 'fill-1',
          market: 'BTC-USD',
          orderId: 'order-1',
          side: 'BUY',
          price: '50000',
          size: '0.1',
          fee: '2.5',
          liquidity: 'MAKER',
          type: 'LIMIT',
          createdAt: '2024-01-01T00:00:00Z',
          subaccountNumber: 0,
        },
        {
          id: 'fill-2',
          market: 'ETH-USD',
          orderId: 'order-2',
          side: 'SELL',
          price: '3000',
          size: '1.0',
          fee: '1.5',
          liquidity: 'TAKER',
          type: 'MARKET',
          createdAt: '2024-01-01T00:01:00Z',
          subaccountNumber: 0,
        },
      ];

      const fills = normalizer.normalizeFills(mockFills as any);

      expect(fills).toHaveLength(2);
    });
  });

  describe('normalizeFundingRate', () => {
    test('normalizes funding rate correctly', () => {
      const mockFunding = {
        ticker: 'BTC-USD',
        rate: '0.0001',
        price: '50000',
        effectiveAt: '2024-01-01T00:00:00Z',
        effectiveAtHeight: '12345',
      };

      const fundingRate = normalizer.normalizeFundingRate(mockFunding as any, 50100);

      expect(fundingRate.symbol).toBe('BTC/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(50100);
      expect(fundingRate.indexPrice).toBe(50000);
      expect(fundingRate.fundingIntervalHours).toBe(1);
    });

    test('uses price as mark price when oracle price not provided', () => {
      const mockFunding = {
        ticker: 'ETH-USD',
        rate: '-0.0001',
        price: '3000',
        effectiveAt: '2024-01-01T00:00:00Z',
        effectiveAtHeight: '12345',
      };

      const fundingRate = normalizer.normalizeFundingRate(mockFunding as any);

      expect(fundingRate.markPrice).toBe(3000);
    });
  });

  describe('normalizeFundingHistory', () => {
    test('normalizes multiple funding rates', () => {
      const mockHistory = [
        {
          ticker: 'BTC-USD',
          rate: '0.0001',
          price: '50000',
          effectiveAt: '2024-01-01T00:00:00Z',
          effectiveAtHeight: '12345',
        },
        {
          ticker: 'BTC-USD',
          rate: '0.00015',
          price: '50100',
          effectiveAt: '2024-01-01T01:00:00Z',
          effectiveAtHeight: '12346',
        },
      ];

      const history = normalizer.normalizeFundingHistory(mockHistory as any);

      expect(history).toHaveLength(2);
    });
  });

  describe('normalizeBalance', () => {
    test('normalizes balance correctly', () => {
      const mockSubaccount = {
        equity: '10000',
        freeCollateral: '7500',
        pendingDeposits: '0',
        pendingWithdrawals: '0',
        marginEnabled: true,
        subaccountNumber: 0,
      };

      const balances = normalizer.normalizeBalance(mockSubaccount as any);

      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe('USDC');
      expect(balances[0].total).toBe(10000);
      expect(balances[0].free).toBe(7500);
      expect(balances[0].used).toBe(2500);
      expect(balances[0].usdValue).toBe(10000);
    });

    test('handles zero equity', () => {
      const mockSubaccount = {
        equity: '0',
        freeCollateral: '0',
        pendingDeposits: '100',
        pendingWithdrawals: '0',
        marginEnabled: true,
        subaccountNumber: 0,
      };

      const balances = normalizer.normalizeBalance(mockSubaccount as any);

      expect(balances[0].total).toBe(0);
      expect(balances[0].free).toBe(0);
      expect(balances[0].used).toBe(0);
    });
  });

  describe('normalizeTicker', () => {
    test('normalizes ticker correctly', () => {
      const mockMarket = {
        ticker: 'BTC-USD',
        oraclePrice: '50000',
        priceChange24H: '0.02', // 2%
        volume24H: '100000000',
        openInterest: '1000',
        nextFundingRate: '0.0001',
        nextFundingAt: '2024-01-01T01:00:00Z',
        trades24H: '5000',
        status: 'ACTIVE',
        stepSize: '0.001',
        tickSize: '0.1',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
      };

      const ticker = normalizer.normalizeTicker(mockMarket as any);

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50000);
      expect(ticker.percentage).toBe(2);
      expect(ticker.quoteVolume).toBe(100000000);
    });

    test('handles zero price change', () => {
      const mockMarket = {
        ticker: 'ETH-USD',
        oraclePrice: '3000',
        priceChange24H: '0',
        volume24H: '50000000',
        openInterest: '5000',
        nextFundingRate: '0.00005',
        nextFundingAt: '2024-01-01T01:00:00Z',
        trades24H: '10000',
        status: 'ACTIVE',
        stepSize: '0.01',
        tickSize: '0.01',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
      };

      const ticker = normalizer.normalizeTicker(mockMarket as any);

      expect(ticker.open).toBe(3000);
      expect(ticker.change).toBe(0);
    });
  });

  describe('normalizeCandle', () => {
    test('normalizes candle correctly', () => {
      const mockCandle = {
        startedAt: '2024-01-01T00:00:00Z',
        open: '50000',
        high: '51000',
        low: '49500',
        close: '50500',
        baseTokenVolume: '100',
        usdVolume: '5000000',
        trades: '500',
      };

      const ohlcv = normalizer.normalizeCandle(mockCandle as any);

      expect(ohlcv).toHaveLength(6);
      expect(ohlcv[0]).toBe(new Date('2024-01-01T00:00:00Z').getTime());
      expect(ohlcv[1]).toBe(50000); // open
      expect(ohlcv[2]).toBe(51000); // high
      expect(ohlcv[3]).toBe(49500); // low
      expect(ohlcv[4]).toBe(50500); // close
      expect(ohlcv[5]).toBe(100); // volume
    });
  });

  describe('normalizeCandles', () => {
    test('normalizes multiple candles', () => {
      const mockCandles = [
        {
          startedAt: '2024-01-01T00:00:00Z',
          open: '50000',
          high: '51000',
          low: '49500',
          close: '50500',
          baseTokenVolume: '100',
          usdVolume: '5000000',
          trades: '500',
        },
        {
          startedAt: '2024-01-01T01:00:00Z',
          open: '50500',
          high: '52000',
          low: '50000',
          close: '51500',
          baseTokenVolume: '150',
          usdVolume: '7500000',
          trades: '750',
        },
      ];

      const candles = normalizer.normalizeCandles(mockCandles as any);

      expect(candles).toHaveLength(2);
      expect(candles[0][0]).toBeLessThan(candles[1][0]); // First candle is earlier
    });
  });
});
