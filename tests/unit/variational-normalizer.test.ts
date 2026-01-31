/**
 * VariationalNormalizer Unit Tests
 *
 * Tests for the Variational normalizer including RFQ order book and funding rate
 */

import { describe, it, expect } from '@jest/globals';
import { VariationalNormalizer } from '../../src/adapters/variational/VariationalNormalizer.js';
import type { VariationalListing } from '../../src/adapters/variational/types.js';

describe('VariationalNormalizer', () => {
  let normalizer: VariationalNormalizer;

  beforeEach(() => {
    normalizer = new VariationalNormalizer();
  });

  describe('symbol conversion', () => {
    it('symbolToCCXT should convert Variational format to CCXT', () => {
      expect(normalizer.symbolToCCXT('BTC-USDC-PERP')).toBe('BTC/USDC:USDC');
      expect(normalizer.symbolToCCXT('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
    });

    it('symbolFromCCXT should convert CCXT format to Variational', () => {
      expect(normalizer.symbolFromCCXT('BTC/USDC:USDC')).toBe('BTC-USDC-PERP');
      expect(normalizer.symbolFromCCXT('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    it('should handle invalid formats gracefully', () => {
      expect(normalizer.symbolToCCXT('BTCUSDC')).toBe('BTCUSDC');
      expect(normalizer.symbolFromCCXT('BTCUSDC')).toBe('BTCUSDC');
    });
  });

  describe('normalizeMarketFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '95000.50',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '94990.00', ask: '95010.00' },
        size_100k: { bid: '94950.00', ask: '95050.00' },
        size_1m: { bid: '94800.00', ask: '95200.00' },
      },
    };

    it('should normalize market from listing', () => {
      const market = normalizer.normalizeMarketFromListing(mockListing);

      expect(market.id).toBe('BTC');
      expect(market.symbol).toBe('BTC/USDC:USDC');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDC');
      expect(market.settle).toBe('USDC');
      expect(market.active).toBe(true);
      expect(market.fundingIntervalHours).toBe(8);
    });
  });

  describe('normalizeTickerFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'ETH',
      name: 'Ethereum',
      mark_price: '3500.25',
      volume_24h: '500000000',
      open_interest: {
        long_open_interest: '25000000',
        short_open_interest: '24000000',
      },
      funding_rate: '0.00005',
      funding_interval_s: 28800,
      base_spread_bps: '3',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '3498.00', ask: '3502.00' },
        size_100k: { bid: '3495.00', ask: '3505.00' },
      },
    };

    it('should normalize ticker from listing', () => {
      const ticker = normalizer.normalizeTickerFromListing(mockListing);

      expect(ticker.symbol).toBe('ETH/USDC:USDC');
      expect(ticker.last).toBe(3500.25);
      expect(ticker.bid).toBe(3495); // Uses 100k size
      expect(ticker.ask).toBe(3505); // Uses 100k size
      expect(ticker.baseVolume).toBe(500000000);
    });
  });

  describe('normalizeFundingRateFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '95000.00',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '94990.00', ask: '95010.00' },
        size_100k: { bid: '94950.00', ask: '95050.00' },
      },
    };

    it('should normalize funding rate from listing', () => {
      const fundingRate = normalizer.normalizeFundingRateFromListing(mockListing);

      expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(95000);
      expect(fundingRate.indexPrice).toBe(95000);
      expect(fundingRate.fundingIntervalHours).toBe(8);
      expect(fundingRate.fundingTimestamp).toBeGreaterThan(0);
      expect(fundingRate.nextFundingTimestamp).toBeGreaterThan(fundingRate.fundingTimestamp);
    });
  });

  describe('normalizeOrderBookFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '100000.00',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '99950.00', ask: '100050.00' },
        size_100k: { bid: '99900.00', ask: '100100.00' },
        size_1m: { bid: '99800.00', ask: '100200.00' },
      },
    };

    it('should normalize order book from listing quotes', () => {
      const orderbook = normalizer.normalizeOrderBookFromListing(mockListing);

      expect(orderbook.exchange).toBe('variational');
      expect(orderbook.symbol).toBe('BTC/USDC:USDC');
      expect(orderbook.bids.length).toBe(3);
      expect(orderbook.asks.length).toBe(3);
      expect(orderbook.timestamp).toBeGreaterThan(0);
    });

    it('should sort bids descending and asks ascending', () => {
      const orderbook = normalizer.normalizeOrderBookFromListing(mockListing);

      // Bids should be sorted descending (highest first)
      expect(orderbook.bids[0][0]).toBeGreaterThan(orderbook.bids[1][0]);
      expect(orderbook.bids[1][0]).toBeGreaterThan(orderbook.bids[2][0]);

      // Asks should be sorted ascending (lowest first)
      expect(orderbook.asks[0][0]).toBeLessThan(orderbook.asks[1][0]);
      expect(orderbook.asks[1][0]).toBeLessThan(orderbook.asks[2][0]);
    });

    it('should calculate correct sizes based on notional', () => {
      const orderbook = normalizer.normalizeOrderBookFromListing(mockListing);

      // $1k notional at $100k mark price = 0.01 BTC
      const expectedSize1k = 1000 / 100000;
      // Find the bid/ask at $1k size level
      const size1kBid = orderbook.bids.find((b) => Math.abs(b[0] - 99950) < 1);
      expect(size1kBid).toBeDefined();
      expect(size1kBid![1]).toBeCloseTo(expectedSize1k, 4);
    });

    it('should handle listings without 1m size', () => {
      const listingWithout1m: VariationalListing = {
        ...mockListing,
        quotes: {
          updated_at: '2025-01-01T00:00:00Z',
          size_1k: { bid: '99950.00', ask: '100050.00' },
          size_100k: { bid: '99900.00', ask: '100100.00' },
        },
      };

      const orderbook = normalizer.normalizeOrderBookFromListing(listingWithout1m);

      expect(orderbook.bids.length).toBe(2);
      expect(orderbook.asks.length).toBe(2);
    });
  });

  describe('normalizeOrder', () => {
    it('should normalize order with all fields', () => {
      const order = normalizer.normalizeOrder({
        orderId: 'order-123',
        clientOrderId: 'client-456',
        symbol: 'BTC-USDC-PERP',
        type: 'limit',
        side: 'buy',
        status: 'open',
        price: '95000',
        amount: '0.5',
        filledAmount: '0.1',
        remainingAmount: '0.4',
        timestamp: 1704067200000,
        updateTime: 1704067260000,
      });

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-456');
      expect(order.symbol).toBe('BTC/USDC:USDC');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.status).toBe('open');
      expect(order.price).toBe(95000);
      expect(order.amount).toBe(0.5);
      expect(order.filled).toBe(0.1);
      expect(order.remaining).toBe(0.4);
    });

    it('should convert rfq type to market', () => {
      const order = normalizer.normalizeOrder({
        orderId: 'order-123',
        symbol: 'BTC-USDC-PERP',
        type: 'rfq',
        side: 'buy',
        status: 'filled',
        amount: '0.5',
        timestamp: Date.now(),
      });

      expect(order.type).toBe('market');
    });

    it('should normalize all status values correctly', () => {
      const statuses = [
        { input: 'pending', expected: 'open' },
        { input: 'open', expected: 'open' },
        { input: 'filled', expected: 'closed' },
        { input: 'partially_filled', expected: 'open' },
        { input: 'cancelled', expected: 'canceled' },
        { input: 'expired', expected: 'expired' },
        { input: 'rejected', expected: 'rejected' },
      ] as const;

      for (const { input, expected } of statuses) {
        const order = normalizer.normalizeOrder({
          orderId: 'test',
          symbol: 'BTC-USDC-PERP',
          type: 'limit',
          side: 'buy',
          status: input,
          amount: '1',
          timestamp: Date.now(),
        });
        expect(order.status).toBe(expected);
      }
    });
  });

  describe('normalizePosition', () => {
    it('should normalize position data', () => {
      const position = normalizer.normalizePosition({
        symbol: 'ETH-USDC-PERP',
        side: 'long',
        size: '10.5',
        entryPrice: '3200',
        markPrice: '3300',
        liquidationPrice: '2800',
        margin: '3360',
        leverage: '10',
        unrealizedPnl: '1050',
        timestamp: Date.now(),
      });

      expect(position.symbol).toBe('ETH/USDC:USDC');
      expect(position.side).toBe('long');
      expect(position.size).toBe(10.5);
      expect(position.entryPrice).toBe(3200);
      expect(position.markPrice).toBe(3300);
      expect(position.liquidationPrice).toBe(2800);
      expect(position.leverage).toBe(10);
      expect(position.unrealizedPnl).toBe(1050);
    });
  });

  describe('normalizeBalance', () => {
    it('should normalize balance data', () => {
      const balance = normalizer.normalizeBalance({
        asset: 'USDC',
        free: '10000',
        locked: '5000',
        total: '15000',
      });

      expect(balance.currency).toBe('USDC');
      expect(balance.free).toBe(10000);
      expect(balance.used).toBe(5000);
      expect(balance.total).toBe(15000);
    });
  });
});
