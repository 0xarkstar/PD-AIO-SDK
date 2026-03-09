/**
 * Ethereal Utils Tests
 *
 * Tests for utility functions.
 */

import {
  toEtherealOrderSide,
  toEtherealOrderType,
  toEtherealTimeInForce,
  buildOrderRequest,
  mapOrderStatus,
  parseEtherealSymbol,
  mapTimeframeToInterval,
} from '../../../src/adapters/ethereal/utils.js';
import type { OrderRequest } from '../../../src/types/common.js';

describe('Ethereal Utils', () => {
  // =========================================================================
  // toEtherealOrderSide
  // =========================================================================

  describe('toEtherealOrderSide', () => {
    test('maps buy to BUY', () => {
      expect(toEtherealOrderSide('buy')).toBe('BUY');
    });

    test('maps sell to SELL', () => {
      expect(toEtherealOrderSide('sell')).toBe('SELL');
    });

    test('falls back to uppercase for unknown side', () => {
      expect(toEtherealOrderSide('unknown')).toBe('UNKNOWN');
    });
  });

  // =========================================================================
  // toEtherealOrderType
  // =========================================================================

  describe('toEtherealOrderType', () => {
    test('maps market to MARKET', () => {
      expect(toEtherealOrderType('market')).toBe('MARKET');
    });

    test('maps limit to LIMIT', () => {
      expect(toEtherealOrderType('limit')).toBe('LIMIT');
    });

    test('maps stopMarket to STOP_MARKET', () => {
      expect(toEtherealOrderType('stopMarket')).toBe('STOP_MARKET');
    });

    test('falls back to uppercase for unknown type', () => {
      expect(toEtherealOrderType('custom')).toBe('CUSTOM');
    });
  });

  // =========================================================================
  // toEtherealTimeInForce
  // =========================================================================

  describe('toEtherealTimeInForce', () => {
    test('returns POST_ONLY when postOnly is true', () => {
      expect(toEtherealTimeInForce('GTC', true)).toBe('POST_ONLY');
    });

    test('maps GTC correctly', () => {
      expect(toEtherealTimeInForce('GTC')).toBe('GTC');
    });

    test('maps IOC correctly', () => {
      expect(toEtherealTimeInForce('IOC')).toBe('IOC');
    });

    test('maps FOK correctly', () => {
      expect(toEtherealTimeInForce('FOK')).toBe('FOK');
    });

    test('defaults to GTC when undefined', () => {
      expect(toEtherealTimeInForce()).toBe('GTC');
    });

    test('returns tif string as-is for unknown values', () => {
      expect(toEtherealTimeInForce('CUSTOM_TIF')).toBe('CUSTOM_TIF');
    });
  });

  // =========================================================================
  // buildOrderRequest
  // =========================================================================

  describe('buildOrderRequest', () => {
    const baseRequest: OrderRequest = {
      symbol: 'ETH/USD:USD',
      side: 'buy',
      type: 'limit',
      amount: 1.5,
      price: 3000,
    };

    test('builds basic limit order request', () => {
      const result = buildOrderRequest(baseRequest, 'acc-123', 'sig-abc', 'nonce-1');

      expect(result.symbol).toBe('ETH-USD');
      expect(result.side).toBe('BUY');
      expect(result.type).toBe('LIMIT');
      expect(result.quantity).toBe('1.5');
      expect(result.price).toBe('3000');
      expect(result.signature).toBe('sig-abc');
      expect(result.nonce).toBe('nonce-1');
      expect(result.accountId).toBe('acc-123');
      expect(result.timeInForce).toBe('GTC');
    });

    test('builds market order without timeInForce', () => {
      const marketReq: OrderRequest = {
        symbol: 'BTC/USD:USD',
        side: 'sell',
        type: 'market',
        amount: 0.1,
      };

      const result = buildOrderRequest(marketReq, 'acc-123', 'sig', 'nonce');
      expect(result.type).toBe('MARKET');
      expect(result.timeInForce).toBeUndefined();
      expect(result.price).toBeUndefined();
    });

    test('includes stopPrice when provided', () => {
      const stopReq: OrderRequest = {
        ...baseRequest,
        type: 'stopMarket',
        stopPrice: 2800,
      };

      const result = buildOrderRequest(stopReq, 'acc', 'sig', 'nonce');
      expect(result.stopPrice).toBe('2800');
    });

    test('includes reduceOnly when true', () => {
      const reduceReq: OrderRequest = {
        ...baseRequest,
        reduceOnly: true,
      };

      const result = buildOrderRequest(reduceReq, 'acc', 'sig', 'nonce');
      expect(result.reduceOnly).toBe(true);
    });

    test('includes postOnly when true', () => {
      const postOnlyReq: OrderRequest = {
        ...baseRequest,
        postOnly: true,
      };

      const result = buildOrderRequest(postOnlyReq, 'acc', 'sig', 'nonce');
      expect(result.postOnly).toBe(true);
      expect(result.timeInForce).toBe('POST_ONLY');
    });

    test('includes clientOrderId when provided', () => {
      const req: OrderRequest = {
        ...baseRequest,
        clientOrderId: 'my-order-123',
      };

      const result = buildOrderRequest(req, 'acc', 'sig', 'nonce');
      expect(result.clientOrderId).toBe('my-order-123');
    });
  });

  // =========================================================================
  // mapOrderStatus
  // =========================================================================

  describe('mapOrderStatus', () => {
    test('maps NEW to open', () => {
      expect(mapOrderStatus('NEW')).toBe('open');
    });

    test('maps OPEN to open', () => {
      expect(mapOrderStatus('OPEN')).toBe('open');
    });

    test('maps FILLED to filled', () => {
      expect(mapOrderStatus('FILLED')).toBe('filled');
    });

    test('maps PARTIALLY_FILLED to partiallyFilled', () => {
      expect(mapOrderStatus('PARTIALLY_FILLED')).toBe('partiallyFilled');
    });

    test('maps CANCELLED to canceled', () => {
      expect(mapOrderStatus('CANCELLED')).toBe('canceled');
    });

    test('maps CANCELED to canceled', () => {
      expect(mapOrderStatus('CANCELED')).toBe('canceled');
    });

    test('maps REJECTED to rejected', () => {
      expect(mapOrderStatus('REJECTED')).toBe('rejected');
    });

    test('defaults unknown status to open', () => {
      expect(mapOrderStatus('SOMETHING_ELSE')).toBe('open');
    });

    test('handles lowercase input', () => {
      expect(mapOrderStatus('filled')).toBe('filled');
    });
  });

  // =========================================================================
  // parseEtherealSymbol
  // =========================================================================

  describe('parseEtherealSymbol', () => {
    test('parses ETH-USD', () => {
      expect(parseEtherealSymbol('ETH-USD')).toEqual({ base: 'ETH', quote: 'USD' });
    });

    test('parses BTC-USD', () => {
      expect(parseEtherealSymbol('BTC-USD')).toEqual({ base: 'BTC', quote: 'USD' });
    });

    test('handles symbol without dash', () => {
      expect(parseEtherealSymbol('ETH')).toEqual({ base: 'ETH', quote: 'USD' });
    });
  });

  // =========================================================================
  // mapTimeframeToInterval
  // =========================================================================

  describe('mapTimeframeToInterval', () => {
    test('maps 1m', () => {
      expect(mapTimeframeToInterval('1m')).toBe('1m');
    });

    test('maps 1h', () => {
      expect(mapTimeframeToInterval('1h')).toBe('1h');
    });

    test('maps 1d', () => {
      expect(mapTimeframeToInterval('1d')).toBe('1d');
    });

    test('maps 1w', () => {
      expect(mapTimeframeToInterval('1w')).toBe('1w');
    });

    test('defaults unknown to 1h', () => {
      expect(mapTimeframeToInterval('2h')).toBe('1h');
    });
  });
});
