/**
 * Reya Utils Tests
 *
 * Tests for utility functions: buildOrderRequest, mapOrderStatus,
 * parseReyaSymbol, mapTimeframeToResolution.
 */

import { buildOrderRequest, mapOrderStatus, parseReyaSymbol, mapTimeframeToResolution } from '../../../src/adapters/reya/utils.js';
import type { OrderRequest } from '../../../src/types/common.js';

describe('Reya Utils', () => {
  // =========================================================================
  // buildOrderRequest
  // =========================================================================

  describe('buildOrderRequest', () => {
    const baseRequest: OrderRequest = {
      symbol: 'BTC/USD:USD',
      side: 'buy',
      type: 'limit',
      amount: 0.5,
      price: 65000,
    };

    test('builds limit buy order correctly', () => {
      const result = buildOrderRequest(baseRequest, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.symbol).toBe('BTCRUSDPERP');
      expect(result.accountId).toBe(123);
      expect(result.exchangeId).toBe(1);
      expect(result.isBuy).toBe(true);
      expect(result.limitPx).toBe('65000');
      expect(result.qty).toBe('0.5');
      expect(result.orderType).toBe('LIMIT');
      expect(result.timeInForce).toBe('GTC');
      expect(result.signature).toBe('0xsig');
      expect(result.nonce).toBe('100');
      expect(result.signerWallet).toBe('0xwallet');
    });

    test('builds market buy order with IOC and high limit price', () => {
      const marketReq: OrderRequest = { ...baseRequest, type: 'market', price: undefined };
      const result = buildOrderRequest(marketReq, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.orderType).toBe('LIMIT');
      expect(result.timeInForce).toBe('IOC');
      expect(result.limitPx).toBe('999999999');
    });

    test('builds market sell order with low limit price', () => {
      const marketSellReq: OrderRequest = { ...baseRequest, type: 'market', side: 'sell', price: undefined };
      const result = buildOrderRequest(marketSellReq, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.isBuy).toBe(false);
      expect(result.limitPx).toBe('0.000001');
    });

    test('builds stopMarket order as SL type', () => {
      const slReq: OrderRequest = {
        ...baseRequest,
        type: 'stopMarket' as OrderRequest['type'],
        stopPrice: 60000,
      };
      const result = buildOrderRequest(slReq, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.orderType).toBe('SL');
      expect(result.triggerPx).toBe('60000');
    });

    test('builds takeProfit order as TP type', () => {
      const tpReq: OrderRequest = {
        ...baseRequest,
        type: 'takeProfit' as OrderRequest['type'],
        stopPrice: 70000,
      };
      const result = buildOrderRequest(tpReq, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.orderType).toBe('TP');
      expect(result.triggerPx).toBe('70000');
    });

    test('includes clientOrderId when provided', () => {
      const reqWithClientId: OrderRequest = { ...baseRequest, clientOrderId: '42' };
      const result = buildOrderRequest(reqWithClientId, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.clientOrderId).toBe(42);
    });

    test('includes reduceOnly flag', () => {
      const reqReduceOnly: OrderRequest = { ...baseRequest, reduceOnly: true };
      const result = buildOrderRequest(reqReduceOnly, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.reduceOnly).toBe(true);
    });

    test('sets postOnly GTC time in force for limit order', () => {
      const reqPostOnly: OrderRequest = { ...baseRequest, postOnly: true };
      const result = buildOrderRequest(reqPostOnly, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.timeInForce).toBe('GTC');
    });

    test('defaults limitPx to 0 when price is undefined for limit order', () => {
      const reqNoPrice: OrderRequest = { ...baseRequest, price: undefined };
      const result = buildOrderRequest(reqNoPrice, 123, 1, '0xsig', '100', '0xwallet');

      expect(result.limitPx).toBe('0');
    });
  });

  // =========================================================================
  // mapOrderStatus
  // =========================================================================

  describe('mapOrderStatus', () => {
    test('maps OPEN to open', () => {
      expect(mapOrderStatus('OPEN')).toBe('open');
    });

    test('maps FILLED to filled', () => {
      expect(mapOrderStatus('FILLED')).toBe('filled');
    });

    test('maps CANCELLED to canceled', () => {
      expect(mapOrderStatus('CANCELLED')).toBe('canceled');
    });

    test('maps REJECTED to rejected', () => {
      expect(mapOrderStatus('REJECTED')).toBe('rejected');
    });

    test('defaults unknown status to open', () => {
      // Force an unknown value through the type system
      expect(mapOrderStatus('UNKNOWN' as 'OPEN')).toBe('open');
    });
  });

  // =========================================================================
  // parseReyaSymbol
  // =========================================================================

  describe('parseReyaSymbol', () => {
    test('parses BTCRUSDPERP to BTC/USD', () => {
      expect(parseReyaSymbol('BTCRUSDPERP')).toEqual({ base: 'BTC', quote: 'USD' });
    });

    test('parses ETHRUSDPERP to ETH/USD', () => {
      expect(parseReyaSymbol('ETHRUSDPERP')).toEqual({ base: 'ETH', quote: 'USD' });
    });

    test('parses symbol without PERP suffix', () => {
      expect(parseReyaSymbol('WETHRUSD')).toEqual({ base: 'WETH', quote: 'USD' });
    });

    test('returns full marketPart as base when no RUSD found', () => {
      expect(parseReyaSymbol('UNKNOWN')).toEqual({ base: 'UNKNOWN', quote: 'USD' });
    });
  });

  // =========================================================================
  // mapTimeframeToResolution
  // =========================================================================

  describe('mapTimeframeToResolution', () => {
    test('maps 1m to 1m', () => {
      expect(mapTimeframeToResolution('1m')).toBe('1m');
    });

    test('maps 5m to 5m', () => {
      expect(mapTimeframeToResolution('5m')).toBe('5m');
    });

    test('maps 15m to 15m', () => {
      expect(mapTimeframeToResolution('15m')).toBe('15m');
    });

    test('maps 1h to 1h', () => {
      expect(mapTimeframeToResolution('1h')).toBe('1h');
    });

    test('maps 4h to 4h', () => {
      expect(mapTimeframeToResolution('4h')).toBe('4h');
    });

    test('maps 1d to 1d', () => {
      expect(mapTimeframeToResolution('1d')).toBe('1d');
    });

    test('defaults unknown timeframe to 1h', () => {
      expect(mapTimeframeToResolution('2w')).toBe('1h');
    });
  });
});
