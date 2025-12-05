/**
 * Unit Tests for Nado Subscription Builder
 *
 * Tests WebSocket subscription payload generation and channel ID creation.
 */

import { describe, it, expect } from '@jest/globals';
import { NadoSubscriptionBuilder } from '../../src/adapters/nado/subscriptions.js';
import { NADO_WS_CHANNELS } from '../../src/adapters/nado/constants.js';

describe('NadoSubscriptionBuilder', () => {
  // ===========================================================================
  // Product-Based Subscriptions
  // ===========================================================================

  describe('orderBook', () => {
    it('should build orderbook subscription for product ID', () => {
      const subscription = NadoSubscriptionBuilder.orderBook(2);

      expect(subscription).toEqual({
        type: 'subscribe',
        channel: NADO_WS_CHANNELS.ORDERBOOK,
        product_id: 2,
      });
    });

    it('should handle product ID 0', () => {
      const subscription = NadoSubscriptionBuilder.orderBook(0);

      expect(subscription.product_id).toBe(0);
    });

    it('should handle large product IDs', () => {
      const subscription = NadoSubscriptionBuilder.orderBook(999999);

      expect(subscription.product_id).toBe(999999);
    });
  });

  describe('trades', () => {
    it('should build trades subscription for product ID', () => {
      const subscription = NadoSubscriptionBuilder.trades(5);

      expect(subscription).toEqual({
        type: 'subscribe',
        channel: NADO_WS_CHANNELS.TRADES,
        product_id: 5,
      });
    });

    it('should use correct channel name', () => {
      const subscription = NadoSubscriptionBuilder.trades(1);

      expect(subscription.channel).toBe(NADO_WS_CHANNELS.TRADES);
      expect(subscription.channel).toBe('recent_trades');
    });
  });

  // ===========================================================================
  // Account-Based Subscriptions
  // ===========================================================================

  describe('positions', () => {
    it('should build positions subscription for subaccount', () => {
      const subaccount = '0x1234567890abcdef1234567890abcdef12345678';
      const subscription = NadoSubscriptionBuilder.positions(subaccount);

      expect(subscription).toEqual({
        type: 'subscribe',
        channel: NADO_WS_CHANNELS.POSITIONS,
        subaccount,
      });
    });

    it('should preserve subaccount address format', () => {
      const subaccount = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const subscription = NadoSubscriptionBuilder.positions(subaccount);

      expect(subscription.subaccount).toBe(subaccount);
    });
  });

  describe('orders', () => {
    it('should build orders subscription for subaccount', () => {
      const subaccount = '0x1234567890abcdef1234567890abcdef12345678';
      const subscription = NadoSubscriptionBuilder.orders(subaccount);

      expect(subscription).toEqual({
        type: 'subscribe',
        channel: NADO_WS_CHANNELS.ORDERS,
        subaccount,
      });
    });

    it('should use correct channel name', () => {
      const subscription = NadoSubscriptionBuilder.orders('0x123');

      expect(subscription.channel).toBe(NADO_WS_CHANNELS.ORDERS);
      expect(subscription.channel).toBe('orders');
    });
  });

  describe('balance', () => {
    it('should build balance subscription for subaccount', () => {
      const subaccount = '0x1234567890abcdef1234567890abcdef12345678';
      const subscription = NadoSubscriptionBuilder.balance(subaccount);

      expect(subscription).toEqual({
        type: 'subscribe',
        channel: NADO_WS_CHANNELS.SUBACCOUNT,
        subaccount,
      });
    });

    it('should use SUBACCOUNT channel', () => {
      const subscription = NadoSubscriptionBuilder.balance('0x123');

      expect(subscription.channel).toBe(NADO_WS_CHANNELS.SUBACCOUNT);
      expect(subscription.channel).toBe('subaccount_info');
    });
  });

  // ===========================================================================
  // Channel ID Generation
  // ===========================================================================

  describe('channelId', () => {
    describe('product-based channels', () => {
      it('should generate channel ID for orderbook', () => {
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERBOOK, 2);

        expect(channelId).toBe('market_liquidity:2');
      });

      it('should generate channel ID for trades', () => {
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.TRADES, 5);

        expect(channelId).toBe('recent_trades:5');
      });

      it('should handle product ID 0', () => {
        const channelId = NadoSubscriptionBuilder.channelId('orderbook', 0);

        expect(channelId).toBe('orderbook:0');
      });

      it('should handle large product IDs', () => {
        const channelId = NadoSubscriptionBuilder.channelId('trades', 999999);

        expect(channelId).toBe('trades:999999');
      });
    });

    describe('account-based channels', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

      it('should generate channel ID for positions', () => {
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.POSITIONS, testAddress);

        expect(channelId).toBe(`isolated_positions:${testAddress}`);
      });

      it('should generate channel ID for orders', () => {
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERS, testAddress);

        expect(channelId).toBe(`orders:${testAddress}`);
      });

      it('should generate channel ID for balance', () => {
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.SUBACCOUNT, testAddress);

        expect(channelId).toBe(`subaccount_info:${testAddress}`);
      });

      it('should preserve address case', () => {
        const mixedCaseAddress = '0xABCDef1234567890ABCDef1234567890ABCDef12';
        const channelId = NadoSubscriptionBuilder.channelId('test', mixedCaseAddress);

        expect(channelId).toContain(mixedCaseAddress);
      });
    });

    describe('format consistency', () => {
      it('should always use colon separator', () => {
        const channelId1 = NadoSubscriptionBuilder.channelId('channel', 123);
        const channelId2 = NadoSubscriptionBuilder.channelId('channel', '0xabc');

        expect(channelId1).toContain(':');
        expect(channelId2).toContain(':');
        expect(channelId1.split(':').length).toBe(2);
        expect(channelId2.split(':').length).toBe(2);
      });

      it('should handle custom channel names', () => {
        const channelId = NadoSubscriptionBuilder.channelId('custom_channel', 42);

        expect(channelId).toBe('custom_channel:42');
      });
    });
  });

  // ===========================================================================
  // Unsubscribe
  // ===========================================================================

  describe('unsubscribe', () => {
    it('should build unsubscribe payload with channel only', () => {
      const unsub = NadoSubscriptionBuilder.unsubscribe('orderbook');

      expect(unsub).toEqual({
        type: 'unsubscribe',
        channel: 'orderbook',
      });
    });

    it('should build unsubscribe payload with product_id', () => {
      const unsub = NadoSubscriptionBuilder.unsubscribe('orderbook', { product_id: 2 });

      expect(unsub).toEqual({
        type: 'unsubscribe',
        channel: 'orderbook',
        product_id: 2,
      });
    });

    it('should build unsubscribe payload with subaccount', () => {
      const subaccount = '0x123';
      const unsub = NadoSubscriptionBuilder.unsubscribe('positions', { subaccount });

      expect(unsub).toEqual({
        type: 'unsubscribe',
        channel: 'positions',
        subaccount,
      });
    });

    it('should merge custom parameters', () => {
      const unsub = NadoSubscriptionBuilder.unsubscribe('test', {
        custom_param1: 'value1',
        custom_param2: 123,
      });

      expect(unsub.type).toBe('unsubscribe');
      expect(unsub.channel).toBe('test');
      expect((unsub as any).custom_param1).toBe('value1');
      expect((unsub as any).custom_param2).toBe(123);
    });
  });

  // ===========================================================================
  // Integration Patterns
  // ===========================================================================

  describe('subscription patterns', () => {
    it('should create matching subscription and channel ID for orderbook', () => {
      const productId = 2;
      const subscription = NadoSubscriptionBuilder.orderBook(productId);
      const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERBOOK, productId);

      expect(subscription.channel).toBe(NADO_WS_CHANNELS.ORDERBOOK);
      expect(subscription.product_id).toBe(productId);
      expect(channelId).toBe(`${NADO_WS_CHANNELS.ORDERBOOK}:${productId}`);
    });

    it('should create matching subscription and channel ID for positions', () => {
      const subaccount = '0x123';
      const subscription = NadoSubscriptionBuilder.positions(subaccount);
      const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.POSITIONS, subaccount);

      expect(subscription.channel).toBe(NADO_WS_CHANNELS.POSITIONS);
      expect(subscription.subaccount).toBe(subaccount);
      expect(channelId).toBe(`${NADO_WS_CHANNELS.POSITIONS}:${subaccount}`);
    });

    it('should create multiple independent subscriptions', () => {
      const sub1 = NadoSubscriptionBuilder.orderBook(1);
      const sub2 = NadoSubscriptionBuilder.orderBook(2);
      const sub3 = NadoSubscriptionBuilder.trades(3);

      expect(sub1.product_id).toBe(1);
      expect(sub2.product_id).toBe(2);
      expect(sub3.product_id).toBe(3);
      expect(sub1.channel).toBe(NADO_WS_CHANNELS.ORDERBOOK);
      expect(sub3.channel).toBe(NADO_WS_CHANNELS.TRADES);
    });
  });

  // ===========================================================================
  // Type Safety
  // ===========================================================================

  describe('type safety', () => {
    it('should have type property set to subscribe', () => {
      const subscriptions = [
        NadoSubscriptionBuilder.orderBook(1),
        NadoSubscriptionBuilder.trades(2),
        NadoSubscriptionBuilder.positions('0x123'),
        NadoSubscriptionBuilder.orders('0x456'),
        NadoSubscriptionBuilder.balance('0x789'),
      ];

      subscriptions.forEach((sub) => {
        expect(sub.type).toBe('subscribe');
      });
    });

    it('should have channel property set correctly', () => {
      expect(NadoSubscriptionBuilder.orderBook(1).channel).toBe(NADO_WS_CHANNELS.ORDERBOOK);
      expect(NadoSubscriptionBuilder.trades(1).channel).toBe(NADO_WS_CHANNELS.TRADES);
      expect(NadoSubscriptionBuilder.positions('0x').channel).toBe(NADO_WS_CHANNELS.POSITIONS);
      expect(NadoSubscriptionBuilder.orders('0x').channel).toBe(NADO_WS_CHANNELS.ORDERS);
      expect(NadoSubscriptionBuilder.balance('0x').channel).toBe(NADO_WS_CHANNELS.SUBACCOUNT);
    });
  });
});
