/**
 * dYdX v4 Constants Unit Tests
 */

import {
  DYDX_API_URLS,
  DYDX_MAINNET_API,
  DYDX_TESTNET_API,
  DYDX_MAINNET_WS,
  DYDX_TESTNET_WS,
  DYDX_RATE_LIMIT,
  DYDX_ORDER_TYPES,
  DYDX_ORDER_SIDES,
  DYDX_ORDER_STATUSES,
  DYDX_TIME_IN_FORCE,
  DYDX_WS_CHANNELS,
  DYDX_FUNDING_INTERVAL_HOURS,
  unifiedToDydx,
  dydxToUnified,
} from '../../src/adapters/dydx/constants.js';

describe('dYdX Constants', () => {
  describe('API URLs', () => {
    test('mainnet URLs are correct', () => {
      expect(DYDX_API_URLS.mainnet.indexer).toBe('https://indexer.dydx.trade/v4');
      expect(DYDX_API_URLS.mainnet.websocket).toBe('wss://indexer.dydx.trade/v4/ws');
      expect(DYDX_MAINNET_API).toBe('https://indexer.dydx.trade/v4');
      expect(DYDX_MAINNET_WS).toBe('wss://indexer.dydx.trade/v4/ws');
    });

    test('testnet URLs are correct', () => {
      expect(DYDX_API_URLS.testnet.indexer).toBe('https://indexer.v4testnet.dydx.exchange/v4');
      expect(DYDX_API_URLS.testnet.websocket).toBe('wss://indexer.v4testnet.dydx.exchange/v4/ws');
      expect(DYDX_TESTNET_API).toBe('https://indexer.v4testnet.dydx.exchange/v4');
      expect(DYDX_TESTNET_WS).toBe('wss://indexer.v4testnet.dydx.exchange/v4/ws');
    });
  });

  describe('Rate Limits', () => {
    test('rate limit configuration is valid', () => {
      expect(DYDX_RATE_LIMIT.maxRequests).toBe(100);
      expect(DYDX_RATE_LIMIT.windowMs).toBe(60000);
      expect(DYDX_RATE_LIMIT.weights).toBeDefined();
      expect(DYDX_RATE_LIMIT.weights.fetchMarkets).toBe(1);
      expect(DYDX_RATE_LIMIT.weights.createOrder).toBe(5);
    });
  });

  describe('Order Types', () => {
    test('order types are defined', () => {
      expect(DYDX_ORDER_TYPES.LIMIT).toBe('LIMIT');
      expect(DYDX_ORDER_TYPES.MARKET).toBe('MARKET');
      expect(DYDX_ORDER_TYPES.STOP_LIMIT).toBe('STOP_LIMIT');
      expect(DYDX_ORDER_TYPES.STOP_MARKET).toBe('STOP_MARKET');
    });

    test('order sides are defined', () => {
      expect(DYDX_ORDER_SIDES.BUY).toBe('BUY');
      expect(DYDX_ORDER_SIDES.SELL).toBe('SELL');
    });

    test('order statuses are defined', () => {
      expect(DYDX_ORDER_STATUSES.OPEN).toBe('OPEN');
      expect(DYDX_ORDER_STATUSES.FILLED).toBe('FILLED');
      expect(DYDX_ORDER_STATUSES.CANCELED).toBe('CANCELED');
      expect(DYDX_ORDER_STATUSES.PENDING).toBe('PENDING');
    });

    test('time in force values are defined', () => {
      expect(DYDX_TIME_IN_FORCE.GTT).toBe('GTT');
      expect(DYDX_TIME_IN_FORCE.FOK).toBe('FOK');
      expect(DYDX_TIME_IN_FORCE.IOC).toBe('IOC');
    });
  });

  describe('WebSocket Channels', () => {
    test('channels are defined', () => {
      expect(DYDX_WS_CHANNELS.MARKETS).toBe('v4_markets');
      expect(DYDX_WS_CHANNELS.TRADES).toBe('v4_trades');
      expect(DYDX_WS_CHANNELS.ORDERBOOK).toBe('v4_orderbook');
      expect(DYDX_WS_CHANNELS.CANDLES).toBe('v4_candles');
      expect(DYDX_WS_CHANNELS.SUBACCOUNTS).toBe('v4_subaccounts');
    });
  });

  describe('Funding Interval', () => {
    test('funding interval is 1 hour for dYdX v4', () => {
      expect(DYDX_FUNDING_INTERVAL_HOURS).toBe(1);
    });
  });

  describe('Symbol Conversion', () => {
    describe('unifiedToDydx', () => {
      test('converts unified format to dYdX format', () => {
        expect(unifiedToDydx('BTC/USD:USD')).toBe('BTC-USD');
        expect(unifiedToDydx('ETH/USD:USD')).toBe('ETH-USD');
        expect(unifiedToDydx('SOL/USD:USD')).toBe('SOL-USD');
      });

      test('handles symbols with just base', () => {
        expect(unifiedToDydx('BTC/USDT:USDT')).toBe('BTC-USD');
      });

      test('throws on invalid format', () => {
        expect(() => unifiedToDydx('')).toThrow('Invalid symbol format');
        expect(() => unifiedToDydx('/')).toThrow('Invalid symbol format');
      });
    });

    describe('dydxToUnified', () => {
      test('converts dYdX format to unified format', () => {
        expect(dydxToUnified('BTC-USD')).toBe('BTC/USD:USD');
        expect(dydxToUnified('ETH-USD')).toBe('ETH/USD:USD');
        expect(dydxToUnified('SOL-USD')).toBe('SOL/USD:USD');
      });

      test('handles different quote currencies', () => {
        expect(dydxToUnified('BTC-USDC')).toBe('BTC/USDC:USDC');
      });

      test('handles single part symbol', () => {
        expect(dydxToUnified('BTC')).toBe('BTC/USD:USD');
      });
    });

    describe('round-trip conversion', () => {
      test('converts back and forth correctly', () => {
        const symbols = ['BTC/USD:USD', 'ETH/USD:USD', 'SOL/USD:USD', 'DOGE/USD:USD'];

        for (const symbol of symbols) {
          const dydxSymbol = unifiedToDydx(symbol);
          const backToUnified = dydxToUnified(dydxSymbol);
          expect(backToUnified).toBe(symbol);
        }
      });
    });
  });
});
