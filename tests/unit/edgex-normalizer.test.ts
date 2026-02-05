/**
 * EdgeX Normalizer Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { EdgeXNormalizer } from '../../src/adapters/edgex/EdgeXNormalizer.js';

describe('EdgeXNormalizer', () => {
  let normalizer: EdgeXNormalizer;

  beforeEach(() => {
    normalizer = new EdgeXNormalizer();
  });

  describe('initializeMappings', () => {
    it('should initialize symbol to contractId mappings', () => {
      const contracts = [
        { contractId: '10000001', contractName: 'BTCUSD' },
        { contractId: '10000002', contractName: 'ETHUSD' },
        { contractId: '10000003', contractName: 'SOLUSD' },
      ];

      normalizer.initializeMappings(contracts);

      // Verify mappings are stored by testing toEdgeXContractId
      expect(normalizer.toEdgeXContractId('BTC/USD:USD')).toBe('10000001');
      expect(normalizer.toEdgeXContractId('ETH/USD:USD')).toBe('10000002');
      expect(normalizer.toEdgeXContractId('SOL/USD:USD')).toBe('10000003');
    });

    it('should handle contracts with various base currencies', () => {
      const contracts = [
        { contractId: '10000004', contractName: 'ARBUSD' },
        { contractId: '10000005', contractName: 'DOGEUSD' },
        { contractId: '10000006', contractName: 'LINKUSD' },
      ];

      normalizer.initializeMappings(contracts);

      expect(normalizer.toEdgeXContractId('ARB/USD:USD')).toBe('10000004');
      expect(normalizer.toEdgeXContractId('DOGE/USD:USD')).toBe('10000005');
      expect(normalizer.toEdgeXContractId('LINK/USD:USD')).toBe('10000006');
    });

    it('should handle empty contracts array', () => {
      normalizer.initializeMappings([]);
      // Should not throw and fallback should work
      expect(normalizer.toEdgeXContractId('BTC/USD:USD')).toBe('10000001');
    });
  });

  describe('normalizeSymbol', () => {
    it('should convert new API format (BTCUSD) to CCXT format', () => {
      expect(normalizer.normalizeSymbol('BTCUSD')).toBe('BTC/USD:USD');
      expect(normalizer.normalizeSymbol('ETHUSD')).toBe('ETH/USD:USD');
      expect(normalizer.normalizeSymbol('SOLUSD')).toBe('SOL/USD:USD');
    });

    it('should convert legacy PERP format to CCXT format', () => {
      expect(normalizer.normalizeSymbol('BTC-USDC-PERP')).toBe('BTC/USDC:USDC');
      expect(normalizer.normalizeSymbol('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
    });

    it('should convert legacy spot format', () => {
      expect(normalizer.normalizeSymbol('BTC-USDC')).toBe('BTC/USDC');
      expect(normalizer.normalizeSymbol('ETH-USD')).toBe('ETH/USD');
    });

    it('should handle 3-character base symbols', () => {
      expect(normalizer.normalizeSymbol('ARBUSD')).toBe('ARB/USD:USD');
      expect(normalizer.normalizeSymbol('XRPUSD')).toBe('XRP/USD:USD');
    });

    it('should handle 4-character base symbols', () => {
      expect(normalizer.normalizeSymbol('DOGEUSD')).toBe('DOGE/USD:USD');
      expect(normalizer.normalizeSymbol('LINKUSD')).toBe('LINK/USD:USD');
      expect(normalizer.normalizeSymbol('AVAXUSD')).toBe('AVAX/USD:USD');
    });
  });

  describe('toEdgeXSymbol', () => {
    it('should convert CCXT format to new API format', () => {
      expect(normalizer.toEdgeXSymbol('BTC/USD:USD')).toBe('BTCUSD');
      expect(normalizer.toEdgeXSymbol('ETH/USD:USD')).toBe('ETHUSD');
    });

    it('should convert CCXT format to legacy USDC format', () => {
      expect(normalizer.toEdgeXSymbol('BTC/USDC:USDC')).toBe('BTC-USDC-PERP');
      expect(normalizer.toEdgeXSymbol('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    it('should convert spot format without settle', () => {
      expect(normalizer.toEdgeXSymbol('BTC/USDC')).toBe('BTC-USDC');
      expect(normalizer.toEdgeXSymbol('ETH/USDC')).toBe('ETH-USDC');
    });

    it('should handle symbols without quote currency', () => {
      expect(normalizer.toEdgeXSymbol('BTC/')).toBe('BTCUSD');
    });

    it('should handle symbols without both base and quote', () => {
      expect(normalizer.toEdgeXSymbol('/')).toBe('USD');
    });
  });

  describe('toEdgeXContractId', () => {
    it('should return cached contractId after initialization', () => {
      const contracts = [
        { contractId: '99999999', contractName: 'BTCUSD' },
      ];
      normalizer.initializeMappings(contracts);

      // Should return cached value
      expect(normalizer.toEdgeXContractId('BTC/USD:USD')).toBe('99999999');
    });

    it('should return known contractIds for common symbols', () => {
      expect(normalizer.toEdgeXContractId('BTC/USD:USD')).toBe('10000001');
      expect(normalizer.toEdgeXContractId('ETH/USD:USD')).toBe('10000002');
      expect(normalizer.toEdgeXContractId('SOL/USD:USD')).toBe('10000003');
      expect(normalizer.toEdgeXContractId('ARB/USD:USD')).toBe('10000004');
      expect(normalizer.toEdgeXContractId('DOGE/USD:USD')).toBe('10000005');
      expect(normalizer.toEdgeXContractId('XRP/USD:USD')).toBe('10000006');
      expect(normalizer.toEdgeXContractId('BNB/USD:USD')).toBe('10000007');
      expect(normalizer.toEdgeXContractId('AVAX/USD:USD')).toBe('10000008');
      expect(normalizer.toEdgeXContractId('LINK/USD:USD')).toBe('10000009');
      expect(normalizer.toEdgeXContractId('LTC/USD:USD')).toBe('10000010');
    });

    it('should default to BTC contractId for unknown symbols', () => {
      expect(normalizer.toEdgeXContractId('UNKNOWN/USD:USD')).toBe('10000001');
    });
  });

  describe('normalizeMarket', () => {
    it('should normalize new API format contract', () => {
      const contract = {
        contractId: '10000001',
        contractName: 'BTCUSD',
        tickSize: '0.1',
        stepSize: '0.001',
        minOrderSize: '0.001',
        defaultMakerFeeRate: '0.0002',
        defaultTakerFeeRate: '0.0005',
        enableTrade: true,
        riskTierList: [{ maxLeverage: '50' }],
      };

      const market = normalizer.normalizeMarket(contract);

      expect(market.id).toBe('10000001');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.pricePrecision).toBe(1);
      expect(market.amountPrecision).toBe(3);
      expect(market.priceTickSize).toBe(0.1);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.makerFee).toBe(0.0002);
      expect(market.takerFee).toBe(0.0005);
      expect(market.maxLeverage).toBe(50);
      expect(market.fundingIntervalHours).toBe(4);
    });

    it('should handle contract without optional fields', () => {
      const contract = {
        contractId: '10000002',
        contractName: 'ETHUSD',
      };

      const market = normalizer.normalizeMarket(contract);

      expect(market.id).toBe('10000002');
      expect(market.symbol).toBe('ETH/USD:USD');
      expect(market.active).toBe(true); // default
      expect(market.minAmount).toBe(0.001); // default
      expect(market.maxLeverage).toBe(100); // default
    });

    it('should handle contract with empty riskTierList', () => {
      const contract = {
        contractId: '10000001',
        contractName: 'BTCUSD',
        riskTierList: [],
      };

      const market = normalizer.normalizeMarket(contract);
      expect(market.maxLeverage).toBe(100); // default
    });

    it('should normalize legacy format contract', () => {
      const contract = {
        market_id: 'legacy-001',
        symbol: 'BTC-USDC-PERP',
        base_asset: 'BTC',
        quote_asset: 'USDC',
        settlement_asset: 'USDC',
        is_active: true,
        min_order_size: '0.01',
        tick_size: '0.01',
        step_size: '0.001',
        maker_fee: '0.0001',
        taker_fee: '0.0003',
        max_leverage: '100',
      };

      const market = normalizer.normalizeMarket(contract);

      expect(market.id).toBe('legacy-001');
      expect(market.symbol).toBe('BTC/USDC:USDC');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDC');
      expect(market.settle).toBe('USDC');
      expect(market.fundingIntervalHours).toBe(8); // legacy uses 8h
    });
  });

  describe('normalizeOrder', () => {
    it('should normalize a limit order', () => {
      const edgexOrder = {
        order_id: 'order-123',
        client_order_id: 'client-123',
        market: 'BTCUSD',
        type: 'LIMIT',
        side: 'BUY',
        size: '1.5',
        price: '50000',
        filled_size: '0.5',
        average_price: '49500',
        status: 'PARTIALLY_FILLED',
        time_in_force: 'GTC',
        post_only: true,
        reduce_only: false,
        created_at: 1700000000000,
        updated_at: 1700000001000,
      };

      const order = normalizer.normalizeOrder(edgexOrder);

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(1.5);
      expect(order.price).toBe(50000);
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(1);
      expect(order.averagePrice).toBe(49500);
      expect(order.status).toBe('partiallyFilled');
      expect(order.timeInForce).toBe('GTC');
      expect(order.postOnly).toBe(true);
      expect(order.reduceOnly).toBe(false);
      expect(order.timestamp).toBe(1700000000000);
      expect(order.lastUpdateTimestamp).toBe(1700000001000);
      expect(order.info).toEqual(edgexOrder);
    });

    it('should normalize a market order', () => {
      const edgexOrder = {
        order_id: 'order-456',
        client_order_id: 'client-456',
        market: 'ETHUSD',
        type: 'MARKET',
        side: 'SELL',
        size: '2.0',
        price: null,
        filled_size: '2.0',
        average_price: '3000',
        status: 'FILLED',
        time_in_force: 'IOC',
        post_only: false,
        reduce_only: true,
        created_at: 1700000000000,
        updated_at: 1700000000500,
      };

      const order = normalizer.normalizeOrder(edgexOrder);

      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.price).toBeUndefined();
      expect(order.status).toBe('filled');
      expect(order.timeInForce).toBe('IOC');
    });

    it('should handle order without average price', () => {
      const edgexOrder = {
        order_id: 'order-789',
        client_order_id: 'client-789',
        market: 'SOLUSD',
        type: 'LIMIT',
        side: 'BUY',
        size: '10',
        price: '100',
        filled_size: '0',
        average_price: null,
        status: 'OPEN',
        time_in_force: 'FOK',
        post_only: false,
        reduce_only: false,
        created_at: 1700000000000,
        updated_at: 1700000000000,
      };

      const order = normalizer.normalizeOrder(edgexOrder);

      expect(order.averagePrice).toBeUndefined();
      expect(order.status).toBe('open');
      expect(order.timeInForce).toBe('FOK');
    });

    it('should handle unknown order type (defaults to limit)', () => {
      const edgexOrder = {
        order_id: 'order-unknown',
        client_order_id: 'client-unknown',
        market: 'BTCUSD',
        type: 'STOP_LIMIT', // Unknown type
        side: 'BUY',
        size: '1',
        price: '50000',
        filled_size: '0',
        average_price: null,
        status: 'PENDING',
        time_in_force: 'UNKNOWN', // Unknown TIF
        post_only: false,
        reduce_only: false,
        created_at: 1700000000000,
        updated_at: 1700000000000,
      };

      const order = normalizer.normalizeOrder(edgexOrder);

      expect(order.type).toBe('limit'); // Default
      expect(order.timeInForce).toBe('GTC'); // Default
      expect(order.status).toBe('open'); // PENDING maps to open
    });

    it('should handle cancelled and rejected orders', () => {
      const cancelledOrder = {
        order_id: 'order-cancelled',
        client_order_id: 'client-cancelled',
        market: 'BTCUSD',
        type: 'LIMIT',
        side: 'BUY',
        size: '1',
        price: '50000',
        filled_size: '0',
        status: 'CANCELLED',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: 1700000000000,
        updated_at: 1700000000000,
      };

      const rejectedOrder = {
        ...cancelledOrder,
        order_id: 'order-rejected',
        status: 'REJECTED',
      };

      expect(normalizer.normalizeOrder(cancelledOrder).status).toBe('canceled');
      expect(normalizer.normalizeOrder(rejectedOrder).status).toBe('rejected');
    });

    it('should handle unknown order status (defaults to open)', () => {
      const edgexOrder = {
        order_id: 'order-unknown-status',
        client_order_id: 'client-unknown-status',
        market: 'BTCUSD',
        type: 'LIMIT',
        side: 'BUY',
        size: '1',
        price: '50000',
        filled_size: '0',
        status: 'SOME_UNKNOWN_STATUS',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: 1700000000000,
        updated_at: 1700000000000,
      };

      const order = normalizer.normalizeOrder(edgexOrder);
      expect(order.status).toBe('open'); // Default fallback
    });
  });

  describe('normalizePosition', () => {
    it('should normalize a long position', () => {
      const edgexPosition = {
        market: 'BTCUSD',
        side: 'LONG',
        size: '1.5',
        entry_price: '50000',
        mark_price: '51000',
        liquidation_price: '45000',
        unrealized_pnl: '1500',
        realized_pnl: '500',
        margin: '5000',
        leverage: '10',
        timestamp: 1700000000000,
      };

      const position = normalizer.normalizePosition(edgexPosition);

      expect(position.symbol).toBe('BTC/USD:USD');
      expect(position.side).toBe('long');
      expect(position.marginMode).toBe('cross');
      expect(position.size).toBe(1.5);
      expect(position.entryPrice).toBe(50000);
      expect(position.markPrice).toBe(51000);
      expect(position.liquidationPrice).toBe(45000);
      expect(position.unrealizedPnl).toBe(1500);
      expect(position.realizedPnl).toBe(500);
      expect(position.margin).toBe(5000);
      expect(position.leverage).toBe(10);
      expect(position.maintenanceMargin).toBe(200); // 5000 * 0.04
      expect(position.marginRatio).toBe(0);
      expect(position.timestamp).toBe(1700000000000);
    });

    it('should normalize a short position', () => {
      const edgexPosition = {
        market: 'ETHUSD',
        side: 'SHORT',
        size: '-2.0',
        entry_price: '3000',
        mark_price: '2900',
        liquidation_price: '3500',
        unrealized_pnl: '200',
        realized_pnl: '0',
        margin: '600',
        leverage: '5',
        timestamp: 1700000000000,
      };

      const position = normalizer.normalizePosition(edgexPosition);

      expect(position.side).toBe('short');
      expect(position.size).toBe(2); // Absolute value
    });

    it('should handle position without liquidation price', () => {
      const edgexPosition = {
        market: 'SOLUSD',
        side: 'LONG',
        size: '100',
        entry_price: '100',
        mark_price: '105',
        liquidation_price: null,
        unrealized_pnl: '500',
        realized_pnl: '0',
        margin: '1000',
        leverage: '10',
        timestamp: 1700000000000,
      };

      const position = normalizer.normalizePosition(edgexPosition);
      expect(position.liquidationPrice).toBe(0);
    });
  });

  describe('normalizeBalance', () => {
    it('should normalize balance', () => {
      const edgexBalance = {
        asset: 'USDC',
        total: '10000.50',
        available: '8000.25',
        locked: '2000.25',
      };

      const balance = normalizer.normalizeBalance(edgexBalance);

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(10000.5);
      expect(balance.free).toBe(8000.25);
      expect(balance.used).toBe(2000.25);
      expect(balance.info).toEqual(edgexBalance);
    });
  });

  describe('normalizeOrderBook', () => {
    it('should normalize order book', () => {
      const depthData = {
        asks: [
          { price: '50100', size: '1.5' },
          { price: '50200', size: '2.0' },
        ],
        bids: [
          { price: '49900', size: '1.0' },
          { price: '49800', size: '3.0' },
        ],
      };

      const orderBook = normalizer.normalizeOrderBook(depthData, 'BTC/USD:USD');

      expect(orderBook.symbol).toBe('BTC/USD:USD');
      expect(orderBook.exchange).toBe('edgex');
      expect(orderBook.asks).toEqual([
        [50100, 1.5],
        [50200, 2.0],
      ]);
      expect(orderBook.bids).toEqual([
        [49900, 1.0],
        [49800, 3.0],
      ]);
      expect(orderBook.timestamp).toBeDefined();
    });

    it('should handle empty order book', () => {
      const depthData = {};

      const orderBook = normalizer.normalizeOrderBook(depthData, 'BTC/USD:USD');

      expect(orderBook.asks).toEqual([]);
      expect(orderBook.bids).toEqual([]);
    });
  });

  describe('normalizeTrade', () => {
    it('should normalize trade', () => {
      const edgexTrade = {
        trade_id: 'trade-123',
        market: 'BTCUSD',
        side: 'BUY',
        price: '50000',
        size: '0.5',
        timestamp: 1700000000000,
      };

      const trade = normalizer.normalizeTrade(edgexTrade);

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(25000);
      expect(trade.timestamp).toBe(1700000000000);
      expect(trade.info).toEqual(edgexTrade);
    });

    it('should normalize sell trade', () => {
      const edgexTrade = {
        trade_id: 'trade-456',
        market: 'ETHUSD',
        side: 'SELL',
        price: '3000',
        size: '2.0',
        timestamp: 1700000000000,
      };

      const trade = normalizer.normalizeTrade(edgexTrade);

      expect(trade.side).toBe('sell');
      expect(trade.cost).toBe(6000);
    });
  });

  describe('normalizeTicker', () => {
    it('should normalize ticker data', () => {
      const tickerData = {
        contractName: 'BTCUSD',
        lastPrice: '50000',
        open: '49000',
        high: '51000',
        low: '48500',
        priceChange: '1000',
        priceChangePercent: '2.04',
        size: '1000',
        value: '50000000',
        endTime: '1700000000000',
      };

      const ticker = normalizer.normalizeTicker(tickerData);

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50000);
      expect(ticker.open).toBe(49000);
      expect(ticker.close).toBe(50000);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(48500);
      expect(ticker.change).toBe(1000);
      expect(ticker.percentage).toBe(2.04);
      expect(ticker.baseVolume).toBe(1000);
      expect(ticker.quoteVolume).toBe(50000000);
      expect(ticker.timestamp).toBe(1700000000000);
    });

    it('should handle ticker with alternate field names', () => {
      const tickerData = {
        contractName: 'ETHUSD',
        close: '3000',
        volume: '500',
      };

      const ticker = normalizer.normalizeTicker(tickerData);

      expect(ticker.last).toBe(3000);
      expect(ticker.baseVolume).toBe(500);
    });

    it('should handle ticker with missing fields', () => {
      const tickerData = {
        contractName: 'SOLUSD',
      };

      const ticker = normalizer.normalizeTicker(tickerData);

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.last).toBe(0);
      expect(ticker.open).toBe(0);
      expect(ticker.high).toBe(0);
      expect(ticker.low).toBe(0);
      expect(ticker.baseVolume).toBe(0);
      expect(ticker.quoteVolume).toBe(0);
    });

    it('should handle ticker with empty contractName', () => {
      const tickerData = {
        contractName: '',
        lastPrice: '100',
      };

      const ticker = normalizer.normalizeTicker(tickerData);
      expect(ticker.symbol).toBe('/USD:USD');
    });
  });

  describe('normalizeFundingRate', () => {
    it('should normalize funding rate data', () => {
      const fundingData = {
        fundingRate: '0.0001',
        fundingTime: '1700000000000',
        markPrice: '50000',
        indexPrice: '49950',
        nextFundingTime: '1700014400000',
      };

      const fundingRate = normalizer.normalizeFundingRate(fundingData, 'BTC/USD:USD');

      expect(fundingRate.symbol).toBe('BTC/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.fundingTimestamp).toBe(1700000000000);
      expect(fundingRate.markPrice).toBe(50000);
      expect(fundingRate.indexPrice).toBe(49950);
      expect(fundingRate.nextFundingTimestamp).toBe(1700014400000);
      expect(fundingRate.fundingIntervalHours).toBe(4);
      expect(fundingRate.info).toEqual(fundingData);
    });

    it('should handle alternate field names', () => {
      const fundingData = {
        fundingRate: '0.0002',
        fundingTimestamp: '1700000000000', // alternate field
      };

      const fundingRate = normalizer.normalizeFundingRate(fundingData, 'ETH/USD:USD');

      expect(fundingRate.fundingTimestamp).toBe(1700000000000);
    });

    it('should handle missing fields', () => {
      const fundingData = {};

      const fundingRate = normalizer.normalizeFundingRate(fundingData, 'SOL/USD:USD');

      expect(fundingRate.fundingRate).toBe(0);
      expect(fundingRate.fundingTimestamp).toBe(0);
      expect(fundingRate.markPrice).toBe(0);
      expect(fundingRate.indexPrice).toBe(0);
      expect(fundingRate.nextFundingTimestamp).toBe(0);
    });
  });
});
