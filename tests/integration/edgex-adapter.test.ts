/**
 * EdgeX Adapter Integration Tests
 * Tests complete request/response cycles with properly mocked API responses
 * EdgeX uses StarkEx with Pedersen hash + ECDSA signatures
 */

import { EdgeXAdapter } from '../../src/adapters/edgex/EdgeXAdapter.js';
import { ec, hash } from 'starknet';

// Mock starknet library
jest.mock('starknet', () => ({
  ec: {
    starkCurve: {
      sign: jest.fn(),
    },
  },
  hash: {
    computeHashOnElements: jest.fn(),
  },
}));

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => {
  return {
    WebSocketManager: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        send: jest.fn(),
        isConnected: true,
        on: jest.fn(),
      };
    }),
  };
});

describe('EdgeXAdapter Integration Tests', () => {
  let adapter: EdgeXAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockSign: jest.MockedFunction<typeof ec.starkCurve.sign>;
  let mockHash: jest.MockedFunction<typeof hash.computeHashOnElements>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create mock fetch function
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
    mockSign = ec.starkCurve.sign as jest.MockedFunction<typeof ec.starkCurve.sign>;
    mockHash = hash.computeHashOnElements as jest.MockedFunction<typeof hash.computeHashOnElements>;

    // Mock Pedersen hash
    mockHash.mockReturnValue('0x1234567890abcdef');

    // Mock StarkEx ECDSA signature
    mockSign.mockReturnValue({
      r: BigInt('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      s: BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
    } as any);

    adapter = new EdgeXAdapter({
      apiKey: 'test-api-key',
      apiSecret: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      testnet: true,
    });
  });

  const mockSuccessResponse = (data: any) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    } as Response);
  };

  const mockFailedResponse = (status: number, error: any = {}) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => error,
    } as Response);
  };

  // ============================================================================
  // 1. Initialization (3 tests)
  // ============================================================================

  describe('Adapter Initialization', () => {
    test('initializes with correct properties', async () => {
      await adapter.initialize();

      expect(adapter.id).toBe('edgex');
      expect(adapter.name).toBe('EdgeX');
      expect(adapter.isReady).toBe(true);
    });

    test('has correct capabilities', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.setLeverage).toBe(true);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchTicker).toBe(true);
    });

    test('throws error when initialized without API key', async () => {
      const adapterNoKey = new EdgeXAdapter({
        testnet: true,
      });

      await expect(adapterNoKey.initialize()).rejects.toThrow(
        'API key is required for EdgeX'
      );
    });
  });

  // ============================================================================
  // 2. Market Data Methods (15 tests)
  // ============================================================================

  describe('Market Data Methods', () => {
    test('fetchMarkets - fetches and normalizes all markets', async () => {
      mockSuccessResponse({
        markets: [
          {
            market_id: '1',
            symbol: 'BTC-USDC-PERP',
            base_asset: 'BTC',
            quote_asset: 'USDC',
            settlement_asset: 'USDC',
            status: 'ACTIVE',
            min_order_size: '0.001',
            max_order_size: '100',
            tick_size: '0.5',
            step_size: '0.001',
            maker_fee: '0.0002',
            taker_fee: '0.0005',
            max_leverage: '25',
            is_active: true,
          },
          {
            market_id: '2',
            symbol: 'ETH-USDC-PERP',
            base_asset: 'ETH',
            quote_asset: 'USDC',
            settlement_asset: 'USDC',
            status: 'ACTIVE',
            min_order_size: '0.01',
            max_order_size: '1000',
            tick_size: '0.1',
            step_size: '0.01',
            maker_fee: '0.0002',
            taker_fee: '0.0005',
            max_leverage: '25',
            is_active: true,
          },
        ],
      });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0]).toMatchObject({
        symbol: 'BTC/USDC:USDC',
        base: 'BTC',
        quote: 'USDC',
        settle: 'USDC',
        active: true,
        maxLeverage: 25,
      });
      expect(markets[1].symbol).toBe('ETH/USDC:USDC');
    });

    test('fetchMarkets - handles empty markets array', async () => {
      mockSuccessResponse({ markets: [] });

      const markets = await adapter.fetchMarkets();

      expect(Array.isArray(markets)).toBe(true);
      expect(markets).toHaveLength(0);
    });

    test('fetchMarkets - throws error on invalid response', async () => {
      mockSuccessResponse({ invalid: 'response' });

      await expect(adapter.fetchMarkets()).rejects.toThrow('Invalid markets response');
    });

    test('fetchOrderBook - fetches and normalizes order book', async () => {
      mockSuccessResponse({
        market: 'BTC-USDC-PERP',
        bids: [
          ['50000', '1.5'],
          ['49999', '2.0'],
        ],
        asks: [
          ['50100', '1.2'],
          ['50101', '1.8'],
        ],
        timestamp: Date.now(),
      });

      const orderBook = await adapter.fetchOrderBook('BTC/USDC:USDC');

      expect(orderBook.symbol).toBe('BTC/USDC:USDC');
      expect(orderBook.exchange).toBe('edgex');
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
      expect(orderBook.bids[0][0]).toBe(50000);
      expect(orderBook.asks[0][0]).toBe(50100);
    });

    test('fetchOrderBook - supports depth parameter', async () => {
      mockSuccessResponse({
        market: 'BTC-USDC-PERP',
        bids: [['50000', '1.5']],
        asks: [['50100', '1.2']],
        timestamp: Date.now(),
      });

      await adapter.fetchOrderBook('BTC/USDC:USDC', { limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?depth=10'),
        expect.any(Object)
      );
    });

    test('fetchOrderBook - handles empty order book', async () => {
      mockSuccessResponse({
        market: 'BTC-USDC-PERP',
        bids: [],
        asks: [],
        timestamp: Date.now(),
      });

      const orderBook = await adapter.fetchOrderBook('BTC/USDC:USDC');

      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });

    test('fetchTrades - fetches and normalizes recent trades', async () => {
      mockSuccessResponse({
        trades: [
          {
            trade_id: '12345',
            market: 'BTC-USDC-PERP',
            side: 'BUY',
            price: '50000',
            size: '0.5',
            timestamp: Date.now(),
          },
          {
            trade_id: '12346',
            market: 'BTC-USDC-PERP',
            side: 'SELL',
            price: '49999',
            size: '0.3',
            timestamp: Date.now(),
          },
        ],
      });

      const trades = await adapter.fetchTrades('BTC/USDC:USDC');

      expect(Array.isArray(trades)).toBe(true);
      expect(trades).toHaveLength(2);
      expect(trades[0].symbol).toBe('BTC/USDC:USDC');
      expect(trades[0].side).toBe('buy');
      expect(trades[0].price).toBe(50000);
      expect(trades[0].amount).toBe(0.5);
    });

    test('fetchTrades - supports limit parameter', async () => {
      mockSuccessResponse({ trades: [] });

      await adapter.fetchTrades('BTC/USDC:USDC', { limit: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?limit=50'),
        expect.any(Object)
      );
    });

    test('fetchTrades - throws error on invalid response', async () => {
      mockSuccessResponse({ invalid: 'response' });

      await expect(adapter.fetchTrades('BTC/USDC:USDC')).rejects.toThrow(
        'Invalid trades response'
      );
    });

    test('fetchTicker - fetches and normalizes ticker', async () => {
      mockSuccessResponse({
        market: 'BTC-USDC-PERP',
        last_price: '50000',
        bid: '49999',
        ask: '50001',
        high_24h: '51000',
        low_24h: '49000',
        volume_24h: '1000',
        price_change_24h: '500',
        price_change_percent_24h: '1.0',
        timestamp: Date.now(),
      });

      const ticker = await adapter.fetchTicker('BTC/USDC:USDC');

      expect(ticker.symbol).toBe('BTC/USDC:USDC');
      expect(ticker.last).toBe(50000);
      expect(ticker.bid).toBe(49999);
      expect(ticker.ask).toBe(50001);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
    });

    test('fetchFundingRate - fetches current funding rate', async () => {
      const now = Date.now();
      mockSuccessResponse({
        market: 'BTC-USDC-PERP',
        rate: '0.0001',
        timestamp: now,
        next_funding_time: now + 28800000, // 8 hours
        mark_price: '50000',
        index_price: '49995',
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USDC:USDC');

      expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(50000);
      expect(fundingRate.indexPrice).toBe(49995);
      expect(fundingRate.fundingIntervalHours).toBe(8);
    });

    test('fetchFundingRate - handles negative funding rate', async () => {
      const now = Date.now();
      mockSuccessResponse({
        market: 'BTC-USDC-PERP',
        rate: '-0.0002',
        timestamp: now,
        next_funding_time: now + 28800000,
        mark_price: '50000',
        index_price: '50010',
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USDC:USDC');

      expect(fundingRate.fundingRate).toBe(-0.0002);
    });

    test('fetchFundingRateHistory - throws not supported error', async () => {
      await expect(
        adapter.fetchFundingRateHistory('BTC/USDC:USDC')
      ).rejects.toThrow('EdgeX does not support funding rate history');
    });

    test('fetchMarkets - validates market data structure', async () => {
      mockSuccessResponse({
        markets: [
          {
            market_id: '1',
            symbol: 'BTC-USDC-PERP',
            base_asset: 'BTC',
            quote_asset: 'USDC',
            settlement_asset: 'USDC',
            status: 'ACTIVE',
            min_order_size: '0.001',
            max_order_size: '100',
            tick_size: '0.5',
            step_size: '0.001',
            maker_fee: '0.0002',
            taker_fee: '0.0005',
            max_leverage: '25',
            is_active: true,
          },
        ],
      });

      const markets = await adapter.fetchMarkets();

      expect(markets[0].pricePrecision).toBe(1); // tick_size: '0.5'
      expect(markets[0].amountPrecision).toBe(3); // step_size: '0.001'
      expect(markets[0].minAmount).toBe(0.001);
      expect(markets[0].makerFee).toBe(0.0002);
      expect(markets[0].takerFee).toBe(0.0005);
    });

    test('fetchTrades - handles empty trades array', async () => {
      mockSuccessResponse({ trades: [] });

      const trades = await adapter.fetchTrades('BTC/USDC:USDC');

      expect(Array.isArray(trades)).toBe(true);
      expect(trades).toHaveLength(0);
    });
  });

  // ============================================================================
  // 3. Account Operations (8 tests)
  // ============================================================================

  describe('Account Operations', () => {
    test('fetchPositions - fetches and normalizes all positions', async () => {
      mockSuccessResponse({
        positions: [
          {
            market: 'BTC-USDC-PERP',
            side: 'LONG',
            size: '0.5',
            entry_price: '48000',
            mark_price: '50000',
            liquidation_price: '42000',
            unrealized_pnl: '1000',
            realized_pnl: '500',
            margin: '4800',
            leverage: '10',
            timestamp: Date.now(),
          },
        ],
      });

      const positions = await adapter.fetchPositions();

      expect(Array.isArray(positions)).toBe(true);
      expect(positions).toHaveLength(1);
      expect(positions[0]).toMatchObject({
        symbol: 'BTC/USDC:USDC',
        side: 'long',
        size: 0.5,
        entryPrice: 48000,
        markPrice: 50000,
        leverage: 10,
      });
    });

    test('fetchPositions - filters positions by symbols', async () => {
      mockSuccessResponse({
        positions: [
          {
            market: 'BTC-USDC-PERP',
            side: 'LONG',
            size: '0.5',
            entry_price: '48000',
            mark_price: '50000',
            unrealized_pnl: '1000',
            realized_pnl: '500',
            margin: '4800',
            leverage: '10',
            timestamp: Date.now(),
          },
          {
            market: 'ETH-USDC-PERP',
            side: 'SHORT',
            size: '5.0',
            entry_price: '3000',
            mark_price: '2950',
            unrealized_pnl: '250',
            realized_pnl: '100',
            margin: '1500',
            leverage: '10',
            timestamp: Date.now(),
          },
        ],
      });

      const positions = await adapter.fetchPositions(['BTC/USDC:USDC']);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USDC:USDC');
    });

    test('fetchPositions - handles empty positions', async () => {
      mockSuccessResponse({ positions: [] });

      const positions = await adapter.fetchPositions();

      expect(Array.isArray(positions)).toBe(true);
      expect(positions).toHaveLength(0);
    });

    test('fetchPositions - throws error on invalid response', async () => {
      mockSuccessResponse({ invalid: 'response' });

      await expect(adapter.fetchPositions()).rejects.toThrow(
        'Invalid positions response'
      );
    });

    test('fetchBalance - fetches and normalizes account balance', async () => {
      mockSuccessResponse({
        balances: [
          {
            asset: 'USDC',
            total: '100000',
            available: '95000',
            locked: '5000',
          },
          {
            asset: 'BTC',
            total: '1.5',
            available: '1.0',
            locked: '0.5',
          },
        ],
      });

      const balances = await adapter.fetchBalance();

      expect(Array.isArray(balances)).toBe(true);
      expect(balances).toHaveLength(2);
      expect(balances[0]).toMatchObject({
        currency: 'USDC',
        total: 100000,
        free: 95000,
        used: 5000,
      });
    });

    test('fetchBalance - throws error on invalid response', async () => {
      mockSuccessResponse({ invalid: 'response' });

      await expect(adapter.fetchBalance()).rejects.toThrow('Invalid balance response');
    });

    test('setLeverage - sets leverage for a symbol', async () => {
      mockSuccessResponse({ success: true });

      await adapter.setLeverage('BTC/USDC:USDC', 15);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/account/leverage'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            market: 'BTC-USDC-PERP',
            leverage: '15',
          }),
        })
      );
    });

    test('fetchPositions - handles short positions', async () => {
      mockSuccessResponse({
        positions: [
          {
            market: 'ETH-USDC-PERP',
            side: 'SHORT',
            size: '5.0',
            entry_price: '3000',
            mark_price: '2950',
            unrealized_pnl: '250',
            realized_pnl: '100',
            margin: '1500',
            leverage: '10',
            timestamp: Date.now(),
          },
        ],
      });

      const positions = await adapter.fetchPositions();

      expect(positions[0].side).toBe('short');
      expect(positions[0].size).toBe(5.0);
    });
  });

  // ============================================================================
  // 4. Trading Operations (15 tests)
  // ============================================================================

  describe('Trading Operations', () => {
    test('createOrder - creates limit buy order', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0',
        status: 'OPEN',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(order).toMatchObject({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        status: 'open',
      });
    });

    test('createOrder - creates market sell order', async () => {
      mockSuccessResponse({
        order_id: '123457',
        market: 'BTC-USDC-PERP',
        side: 'SELL',
        type: 'MARKET',
        size: '0.05',
        filled_size: '0.05',
        average_price: '50000',
        status: 'FILLED',
        time_in_force: 'IOC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'market',
        side: 'sell',
        amount: 0.05,
      });

      expect(order).toMatchObject({
        symbol: 'BTC/USDC:USDC',
        type: 'market',
        side: 'sell',
        amount: 0.05,
        status: 'filled',
      });
    });

    test('createOrder - creates post-only order', async () => {
      mockSuccessResponse({
        order_id: '123458',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '49000',
        filled_size: '0',
        status: 'OPEN',
        time_in_force: 'GTC',
        post_only: true,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 49000,
        postOnly: true,
      });

      expect(order.postOnly).toBe(true);
    });

    test('createOrder - creates reduce-only order', async () => {
      mockSuccessResponse({
        order_id: '123459',
        market: 'BTC-USDC-PERP',
        side: 'SELL',
        type: 'LIMIT',
        size: '0.5',
        price: '52000',
        filled_size: '0',
        status: 'OPEN',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'sell',
        amount: 0.5,
        price: 52000,
        reduceOnly: true,
      });

      expect(order.reduceOnly).toBe(true);
    });

    test('createOrder - creates IOC order', async () => {
      mockSuccessResponse({
        order_id: '123461',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0.1',
        status: 'FILLED',
        time_in_force: 'IOC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        timeInForce: 'IOC',
      });

      expect(order.timeInForce).toBe('IOC');
      expect(order.status).toBe('filled');
    });

    test('createOrder - creates FOK order', async () => {
      mockSuccessResponse({
        order_id: '123462',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0.1',
        status: 'FILLED',
        time_in_force: 'FOK',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        timeInForce: 'FOK',
      });

      expect(order.timeInForce).toBe('FOK');
    });

    test('cancelOrder - cancels an existing order', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0',
        status: 'CANCELLED',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.cancelOrder('123456');

      expect(order.status).toBe('canceled');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/123456'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    test('cancelAllOrders - cancels all orders', async () => {
      mockSuccessResponse({
        orders: [
          {
            order_id: '123456',
            market: 'BTC-USDC-PERP',
            side: 'BUY',
            type: 'LIMIT',
            size: '0.1',
            price: '50000',
            filled_size: '0',
            status: 'CANCELLED',
            time_in_force: 'GTC',
            post_only: false,
            reduce_only: false,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      });

      const orders = await adapter.cancelAllOrders();

      expect(Array.isArray(orders)).toBe(true);
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('canceled');
    });

    test('cancelAllOrders - cancels all orders for a symbol', async () => {
      mockSuccessResponse({
        orders: [
          {
            order_id: '123456',
            market: 'BTC-USDC-PERP',
            side: 'BUY',
            type: 'LIMIT',
            size: '0.1',
            price: '50000',
            filled_size: '0',
            status: 'CANCELLED',
            time_in_force: 'GTC',
            post_only: false,
            reduce_only: false,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      });

      const orders = await adapter.cancelAllOrders('BTC/USDC:USDC');

      expect(orders).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ market: 'BTC-USDC-PERP' }),
        })
      );
    });

    test('fetchOrder - fetches a specific order', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0.05',
        status: 'PARTIALLY_FILLED',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.fetchOrder('123456');

      expect(order.id).toBe('123456');
      expect(order.status).toBe('partiallyFilled');
      expect(order.filled).toBe(0.05);
    });

    test('fetchOpenOrders - fetches all open orders', async () => {
      mockSuccessResponse({
        orders: [
          {
            order_id: '123456',
            market: 'BTC-USDC-PERP',
            side: 'BUY',
            type: 'LIMIT',
            size: '0.1',
            price: '50000',
            filled_size: '0',
            status: 'OPEN',
            time_in_force: 'GTC',
            post_only: false,
            reduce_only: false,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      });

      const orders = await adapter.fetchOpenOrders();

      expect(Array.isArray(orders)).toBe(true);
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('open');
    });

    test('fetchOpenOrders - filters by symbol', async () => {
      mockSuccessResponse({
        orders: [
          {
            order_id: '123456',
            market: 'BTC-USDC-PERP',
            side: 'BUY',
            type: 'LIMIT',
            size: '0.1',
            price: '50000',
            filled_size: '0',
            status: 'OPEN',
            time_in_force: 'GTC',
            post_only: false,
            reduce_only: false,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      });

      await adapter.fetchOpenOrders('BTC/USDC:USDC');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?market=BTC-USDC-PERP'),
        expect.any(Object)
      );
    });

    test('createOrder - handles partially filled order', async () => {
      mockSuccessResponse({
        order_id: '123463',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0.05',
        status: 'PARTIALLY_FILLED',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(order.status).toBe('partiallyFilled');
      expect(order.filled).toBe(0.05);
      expect(order.remaining).toBe(0.05);
    });

    test('createOrder - handles rejected order', async () => {
      mockSuccessResponse({
        order_id: '123464',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0',
        status: 'REJECTED',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(order.status).toBe('rejected');
    });
  });

  // ============================================================================
  // 5. StarkEx Signature (10 tests)
  // ============================================================================

  describe('StarkEx Signature', () => {
    test('generates Pedersen hash for message', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      expect(mockHash).toHaveBeenCalled();
      const hashCall = mockHash.mock.calls[0];
      expect(hashCall[0]).toBeInstanceOf(Array);
    });

    test('signs hash with StarkEx ECDSA', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      expect(mockSign).toHaveBeenCalled();
      const signCall = mockSign.mock.calls[0];
      expect(signCall[0]).toBe('0x1234567890abcdef'); // mocked hash result
      expect(signCall[1]).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      ); // apiSecret
    });

    test('includes timestamp in signature', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Timestamp': expect.any(String),
          }),
        })
      );
    });

    test('includes API key in headers', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-KEY': 'test-api-key',
          }),
        })
      );
    });

    test('includes signature in headers', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Signature': expect.any(String),
          }),
        })
      );
    });

    test('signature format is r,s in hex', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      const call = mockFetch.mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      const signature = headers['X-Signature'];

      expect(signature).toContain('0x');
      expect(signature).toContain(',0x');
    });

    test('signature includes method in message', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      // Hash is called with message array
      const hashCall = mockHash.mock.calls[0];
      const message = hashCall[0][0] as string;

      expect(message).toContain('GET');
    });

    test('signature includes path in message', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      const hashCall = mockHash.mock.calls[0];
      const message = hashCall[0][0] as string;

      expect(message).toContain('/markets');
    });

    test('signature includes body in message for POST requests', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTC-USDC-PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0',
        status: 'OPEN',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      await adapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      const hashCall = mockHash.mock.calls[0];
      const message = hashCall[0][0] as string;

      expect(message).toContain('POST');
      expect(message).toContain('BTC-USDC-PERP');
    });

    test('signature uses Pedersen hash instead of SHA256', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      // Verify Pedersen hash was called (not SHA256)
      expect(mockHash).toHaveBeenCalled();
      expect(mockHash.mock.calls[0][0]).toBeInstanceOf(Array);
    });
  });

  // ============================================================================
  // 6. NOT_IMPLEMENTED Methods (5 tests)
  // ============================================================================

  describe('NOT_IMPLEMENTED Methods', () => {
    test('fetchOrderHistory - throws NOT_IMPLEMENTED error', async () => {
      await expect(adapter.fetchOrderHistory('BTC/USDC:USDC')).rejects.toThrow(
        'fetchOrderHistory not yet implemented for EdgeX - API documentation required'
      );
    });

    test('fetchOrderHistory - error has NOT_IMPLEMENTED code', async () => {
      try {
        await adapter.fetchOrderHistory('BTC/USDC:USDC');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('NOT_IMPLEMENTED');
        expect(error.exchange).toBe('edgex');
      }
    });

    test('fetchMyTrades - throws NOT_IMPLEMENTED error', async () => {
      await expect(adapter.fetchMyTrades('BTC/USDC:USDC')).rejects.toThrow(
        'fetchMyTrades not yet implemented for EdgeX'
      );
    });

    test('fetchMyTrades - error has NOT_IMPLEMENTED code', async () => {
      try {
        await adapter.fetchMyTrades('BTC/USDC:USDC');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('NOT_IMPLEMENTED');
        expect(error.exchange).toBe('edgex');
      }
    });

    test('fetchOrderHistory with parameters - still throws error', async () => {
      await expect(
        adapter.fetchOrderHistory('BTC/USDC:USDC', Date.now() - 86400000, 50)
      ).rejects.toThrow('NOT_IMPLEMENTED');
    });
  });

  // ============================================================================
  // 7. Error Handling (8 tests)
  // ============================================================================

  describe('Error Handling', () => {
    test('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles 401 unauthorized error', async () => {
      mockFailedResponse(401, { error: 'Unauthorized' });

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles 429 rate limit error', async () => {
      mockFailedResponse(429, { error: 'Rate limit exceeded' });

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles 500 server error', async () => {
      mockFailedResponse(500, { error: 'Internal server error' });

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles invalid symbol error', async () => {
      mockFailedResponse(400, { error: 'Invalid symbol' });

      await expect(adapter.fetchTicker('INVALID/USDC:USDC')).rejects.toThrow();
    });

    test('handles order not found error', async () => {
      mockFailedResponse(404, { error: 'Order not found' });

      await expect(adapter.cancelOrder('99999')).rejects.toThrow();
    });

    test('handles malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles timeout error', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });
  });

  // ============================================================================
  // 8. Symbol Normalization (2 tests)
  // ============================================================================

  describe('Symbol Normalization', () => {
    test('converts unified symbol to EdgeX format', () => {
      expect(adapter.symbolToExchange('BTC/USDC:USDC')).toBe('BTC-USDC-PERP');
      expect(adapter.symbolToExchange('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
      expect(adapter.symbolToExchange('SOL/USDC:USDC')).toBe('SOL-USDC-PERP');
    });

    test('converts EdgeX symbol to unified format', () => {
      expect(adapter.symbolFromExchange('BTC-USDC-PERP')).toBe('BTC/USDC:USDC');
      expect(adapter.symbolFromExchange('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
      expect(adapter.symbolFromExchange('SOL-USDC-PERP')).toBe('SOL/USDC:USDC');
    });
  });

  // ============================================================================
  // 9. Rate Limiting (3 tests)
  // ============================================================================

  describe('Rate Limiting', () => {
    test('respects endpoint weights', async () => {
      // fetchMarkets has weight of 1
      mockSuccessResponse({ markets: [] });
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();
      await adapter.fetchMarkets();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('tracks higher weight endpoints', async () => {
      // cancelAllOrders has weight of 10
      mockSuccessResponse({ orders: [] });

      await adapter.cancelAllOrders();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('allows concurrent requests within limits', async () => {
      mockSuccessResponse({ markets: [] });
      mockSuccessResponse({ markets: [] });
      mockSuccessResponse({ markets: [] });

      await Promise.all([
        adapter.fetchMarkets(),
        adapter.fetchMarkets(),
        adapter.fetchMarkets(),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
