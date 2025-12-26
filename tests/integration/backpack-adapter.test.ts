/**
 * Backpack Adapter Integration Tests
 * Tests complete request/response cycles with properly mocked API responses
 */

import { BackpackAdapter } from '../../src/adapters/backpack/BackpackAdapter.js';
import * as ed from '@noble/ed25519';

// Mock ED25519 signature
jest.mock('@noble/ed25519', () => ({
  signAsync: jest.fn(),
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

describe('BackpackAdapter Integration Tests', () => {
  let adapter: BackpackAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockSignAsync: jest.MockedFunction<typeof ed.signAsync>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockSignAsync = ed.signAsync as jest.MockedFunction<typeof ed.signAsync>;

    // Mock ED25519 signature to return deterministic value
    mockSignAsync.mockResolvedValue(
      new Uint8Array(64).fill(0xab) // Mock 64-byte signature
    );

    adapter = new BackpackAdapter({
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

      expect(adapter.id).toBe('backpack');
      expect(adapter.name).toBe('Backpack');
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
      const adapterNoKey = new BackpackAdapter({
        testnet: true,
      });

      await expect(adapterNoKey.initialize()).rejects.toThrow(
        'API key is required for Backpack'
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
            symbol: 'BTCUSDT_PERP',
            base_currency: 'BTC',
            quote_currency: 'USDT',
            settlement_currency: 'USDT',
            status: 'ACTIVE',
            min_order_size: '0.001',
            max_order_size: '100',
            tick_size: '0.5',
            step_size: '0.001',
            maker_fee: '0.0002',
            taker_fee: '0.0005',
            max_leverage: '10',
            is_active: true,
          },
          {
            symbol: 'ETHUSDT_PERP',
            base_currency: 'ETH',
            quote_currency: 'USDT',
            settlement_currency: 'USDT',
            status: 'ACTIVE',
            min_order_size: '0.01',
            max_order_size: '1000',
            tick_size: '0.1',
            step_size: '0.01',
            maker_fee: '0.0002',
            taker_fee: '0.0005',
            max_leverage: '10',
            is_active: true,
          },
        ],
      });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        base: 'BTC',
        quote: 'USDT',
        settle: 'USDT',
        active: true,
        maxLeverage: 10,
      });
      expect(markets[1].symbol).toBe('ETH/USDT:USDT');
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
        market: 'BTCUSDT_PERP',
        bids: [
          ['50000', '1.5'],
          ['49999', '2.0'],
        ],
        asks: [
          ['50100', '1.2'],
          ['50101', '1.8'],
        ],
        timestamp: Date.now(),
        last_update_id: 123456,
      });

      const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.exchange).toBe('backpack');
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
      expect(orderBook.bids[0][0]).toBe(50000);
      expect(orderBook.asks[0][0]).toBe(50100);
    });

    test('fetchOrderBook - supports depth parameter', async () => {
      mockSuccessResponse({
        market: 'BTCUSDT_PERP',
        bids: [['50000', '1.5']],
        asks: [['50100', '1.2']],
        timestamp: Date.now(),
        last_update_id: 123456,
      });

      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?depth=10'),
        expect.any(Object)
      );
    });

    test('fetchTrades - fetches and normalizes recent trades', async () => {
      mockSuccessResponse({
        trades: [
          {
            id: '12345',
            market: 'BTCUSDT_PERP',
            side: 'BUY',
            price: '50000',
            size: '0.5',
            timestamp: Date.now(),
          },
          {
            id: '12346',
            market: 'BTCUSDT_PERP',
            side: 'SELL',
            price: '49999',
            size: '0.3',
            timestamp: Date.now(),
          },
        ],
      });

      const trades = await adapter.fetchTrades('BTC/USDT:USDT');

      expect(Array.isArray(trades)).toBe(true);
      expect(trades).toHaveLength(2);
      expect(trades[0].symbol).toBe('BTC/USDT:USDT');
      expect(trades[0].side).toBe('buy');
      expect(trades[0].price).toBe(50000);
      expect(trades[0].amount).toBe(0.5);
    });

    test('fetchTrades - supports limit parameter', async () => {
      mockSuccessResponse({ trades: [] });

      await adapter.fetchTrades('BTC/USDT:USDT', { limit: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?limit=50'),
        expect.any(Object)
      );
    });

    test('fetchTrades - throws error on invalid response', async () => {
      mockSuccessResponse({ invalid: 'response' });

      await expect(adapter.fetchTrades('BTC/USDT:USDT')).rejects.toThrow(
        'Invalid trades response'
      );
    });

    test('fetchTicker - fetches and normalizes ticker', async () => {
      mockSuccessResponse({
        market: 'BTCUSDT_PERP',
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

      const ticker = await adapter.fetchTicker('BTC/USDT:USDT');

      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(ticker.last).toBe(50000);
      expect(ticker.bid).toBe(49999);
      expect(ticker.ask).toBe(50001);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
    });

    test('fetchFundingRate - fetches current funding rate', async () => {
      const now = Date.now();
      mockSuccessResponse({
        market: 'BTCUSDT_PERP',
        rate: '0.0001',
        timestamp: now,
        next_funding_time: now + 28800000, // 8 hours
        mark_price: '50000',
        index_price: '49995',
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USDT:USDT');

      expect(fundingRate.symbol).toBe('BTC/USDT:USDT');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(50000);
      expect(fundingRate.indexPrice).toBe(49995);
      expect(fundingRate.fundingIntervalHours).toBe(8);
    });

    test('fetchFundingRate - handles negative funding rate', async () => {
      const now = Date.now();
      mockSuccessResponse({
        market: 'BTCUSDT_PERP',
        rate: '-0.0002',
        timestamp: now,
        next_funding_time: now + 28800000,
        mark_price: '50000',
        index_price: '50010',
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USDT:USDT');

      expect(fundingRate.fundingRate).toBe(-0.0002);
    });

    test('fetchFundingRateHistory - throws not supported error', async () => {
      await expect(
        adapter.fetchFundingRateHistory('BTC/USDT:USDT')
      ).rejects.toThrow('Backpack does not support funding rate history');
    });

    test('fetchMarkets - validates market data structure', async () => {
      mockSuccessResponse({
        markets: [
          {
            symbol: 'BTCUSDT_PERP',
            base_currency: 'BTC',
            quote_currency: 'USDT',
            settlement_currency: 'USDT',
            status: 'ACTIVE',
            min_order_size: '0.001',
            max_order_size: '100',
            tick_size: '0.5',
            step_size: '0.001',
            maker_fee: '0.0002',
            taker_fee: '0.0005',
            max_leverage: '10',
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

    test('fetchOrderBook - handles empty order book', async () => {
      mockSuccessResponse({
        market: 'BTCUSDT_PERP',
        bids: [],
        asks: [],
        timestamp: Date.now(),
        last_update_id: 123456,
      });

      const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });
  });

  // ============================================================================
  // 3. Account Operations (10 tests)
  // ============================================================================

  describe('Account Operations', () => {
    test('fetchPositions - fetches and normalizes all positions', async () => {
      mockSuccessResponse({
        positions: [
          {
            market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
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
            market: 'BTCUSDT_PERP',
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
            market: 'ETHUSDT_PERP',
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

      const positions = await adapter.fetchPositions(['BTC/USDT:USDT']);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USDT:USDT');
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
            asset: 'USDT',
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
        currency: 'USDT',
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

      await adapter.setLeverage('BTC/USDT:USDT', 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/account/leverage'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            market: 'BTCUSDT_PERP',
            leverage: '5',
          }),
        })
      );
    });

    test('fetchPositions - handles short positions', async () => {
      mockSuccessResponse({
        positions: [
          {
            market: 'ETHUSDT_PERP',
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

    test('fetchPositions - handles positions without liquidation price', async () => {
      mockSuccessResponse({
        positions: [
          {
            market: 'BTCUSDT_PERP',
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
        ],
      });

      const positions = await adapter.fetchPositions();

      expect(positions[0].liquidationPrice).toBe(0);
    });

    test('fetchBalance - handles zero balance', async () => {
      mockSuccessResponse({
        balances: [
          {
            asset: 'USDT',
            total: '0',
            available: '0',
            locked: '0',
          },
        ],
      });

      const balances = await adapter.fetchBalance();

      expect(balances[0].total).toBe(0);
      expect(balances[0].free).toBe(0);
      expect(balances[0].used).toBe(0);
    });
  });

  // ============================================================================
  // 4. Trading Operations (20 tests)
  // ============================================================================

  describe('Trading Operations', () => {
    test('createOrder - creates limit buy order', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(order).toMatchObject({
        symbol: 'BTC/USDT:USDT',
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
        market: 'BTCUSDT_PERP',
        side: 'SELL',
        type: 'MARKET',
        size: '0.05',
        filled_size: '0.05',
        avg_price: '50000',
        status: 'FILLED',
        time_in_force: 'IOC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'sell',
        amount: 0.05,
      });

      expect(order).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'sell',
        amount: 0.05,
        status: 'filled',
      });
    });

    test('createOrder - creates post-only order', async () => {
      mockSuccessResponse({
        order_id: '123458',
        market: 'BTCUSDT_PERP',
        side: 'BUY',
        type: 'POST_ONLY',
        size: '0.1',
        price: '49000',
        filled_size: '0',
        status: 'OPEN',
        time_in_force: 'POST_ONLY',
        post_only: true,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
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
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'sell',
        amount: 0.5,
        price: 52000,
        reduceOnly: true,
      });

      expect(order.reduceOnly).toBe(true);
    });

    test('createOrder - creates order with client order ID', async () => {
      mockSuccessResponse({
        order_id: '123460',
        client_order_id: 'my-order-123',
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        clientOrderId: 'my-order-123',
      });

      expect(order.clientOrderId).toBe('my-order-123');
    });

    test('createOrder - creates IOC order', async () => {
      mockSuccessResponse({
        order_id: '123461',
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
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
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
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
        market: 'BTCUSDT_PERP',
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
            market: 'BTCUSDT_PERP',
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
            market: 'BTCUSDT_PERP',
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

      const orders = await adapter.cancelAllOrders('BTC/USDT:USDT');

      expect(orders).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ market: 'BTCUSDT_PERP' }),
        })
      );
    });

    test('cancelAllOrders - throws error on invalid response', async () => {
      mockSuccessResponse({ invalid: 'response' });

      await expect(adapter.cancelAllOrders()).rejects.toThrow(
        'Invalid cancel all orders response'
      );
    });

    test('fetchOrder - fetches a specific order', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTCUSDT_PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0.05',
        status: 'PARTIAL',
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
            market: 'BTCUSDT_PERP',
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
            market: 'BTCUSDT_PERP',
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

      await adapter.fetchOpenOrders('BTC/USDT:USDT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?market=BTCUSDT_PERP'),
        expect.any(Object)
      );
    });

    test('fetchOrderHistory - fetches order history', async () => {
      mockSuccessResponse([
        {
          order_id: '123456',
          market: 'BTCUSDT_PERP',
          side: 'BUY',
          type: 'LIMIT',
          size: '0.1',
          price: '50000',
          filled_size: '0.1',
          status: 'FILLED',
          time_in_force: 'GTC',
          post_only: false,
          reduce_only: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ]);

      const orders = await adapter.fetchOrderHistory('BTC/USDT:USDT');

      expect(Array.isArray(orders)).toBe(true);
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('filled');
    });

    test('fetchOrderHistory - supports pagination parameters', async () => {
      mockSuccessResponse([]);

      await adapter.fetchOrderHistory('BTC/USDT:USDT', Date.now() - 86400000, 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('symbol=BTCUSDT_PERP'),
        expect.any(Object)
      );
    });

    test('fetchMyTrades - fetches user trade history', async () => {
      mockSuccessResponse([
        {
          id: '12345',
          market: 'BTCUSDT_PERP',
          side: 'BUY',
          price: '50000',
          size: '0.1',
          timestamp: Date.now(),
        },
      ]);

      const trades = await adapter.fetchMyTrades('BTC/USDT:USDT');

      expect(Array.isArray(trades)).toBe(true);
      expect(trades).toHaveLength(1);
      expect(trades[0].symbol).toBe('BTC/USDT:USDT');
    });

    test('createOrder - handles partially filled order', async () => {
      mockSuccessResponse({
        order_id: '123463',
        market: 'BTCUSDT_PERP',
        side: 'BUY',
        type: 'LIMIT',
        size: '0.1',
        price: '50000',
        filled_size: '0.05',
        status: 'PARTIAL',
        time_in_force: 'GTC',
        post_only: false,
        reduce_only: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
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
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(order.status).toBe('rejected');
    });
  });

  // ============================================================================
  // 5. ED25519 Signature (8 tests)
  // ============================================================================

  describe('ED25519 Signature', () => {
    test('generates valid ED25519 signature', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      expect(mockSignAsync).toHaveBeenCalled();
      const signatureCall = mockSignAsync.mock.calls[0];
      expect(signatureCall[0]).toBeInstanceOf(Uint8Array); // message bytes
      expect(signatureCall[1]).toBeInstanceOf(Uint8Array); // private key
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

    test('signature format is hex string', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      const call = mockFetch.mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      const signature = headers['X-Signature'];

      expect(signature).toMatch(/^[0-9a-f]+$/);
      expect(signature).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    test('signature includes method in message', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      const messageBytes = mockSignAsync.mock.calls[0][0] as Uint8Array;
      const message = new TextDecoder().decode(messageBytes);

      expect(message).toContain('GET');
    });

    test('signature includes path in message', async () => {
      mockSuccessResponse({ markets: [] });

      await adapter.fetchMarkets();

      const messageBytes = mockSignAsync.mock.calls[0][0] as Uint8Array;
      const message = new TextDecoder().decode(messageBytes);

      expect(message).toContain('/markets');
    });

    test('signature includes body in message for POST requests', async () => {
      mockSuccessResponse({
        order_id: '123456',
        market: 'BTCUSDT_PERP',
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
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      const messageBytes = mockSignAsync.mock.calls[0][0] as Uint8Array;
      const message = new TextDecoder().decode(messageBytes);

      expect(message).toContain('POST');
      expect(message).toContain('BTCUSDT_PERP');
    });
  });

  // ============================================================================
  // 6. Error Handling (10 tests)
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

    test('handles insufficient margin error', async () => {
      mockFailedResponse(400, { error: 'Insufficient margin' });

      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 100,
          price: 50000,
        })
      ).rejects.toThrow();
    });

    test('handles invalid symbol error', async () => {
      mockFailedResponse(400, { error: 'Invalid symbol' });

      await expect(adapter.fetchTicker('INVALID/USDT:USDT')).rejects.toThrow();
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

    test('handles missing required fields in response', async () => {
      mockSuccessResponse({
        markets: [
          {
            // Missing required fields
            symbol: 'BTCUSDT_PERP',
          },
        ],
      });

      const markets = await adapter.fetchMarkets();

      // Should handle gracefully with defaults
      expect(markets).toHaveLength(1);
    });
  });

  // ============================================================================
  // 7. Symbol Normalization (2 tests)
  // ============================================================================

  describe('Symbol Normalization', () => {
    test('converts unified symbol to Backpack format', () => {
      expect(adapter.symbolToExchange('BTC/USDT:USDT')).toBe('BTCUSDT_PERP');
      expect(adapter.symbolToExchange('ETH/USDT:USDT')).toBe('ETHUSDT_PERP');
      expect(adapter.symbolToExchange('SOL/USDT:USDT')).toBe('SOLUSDT_PERP');
    });

    test('converts Backpack symbol to unified format', () => {
      expect(adapter.symbolFromExchange('BTCUSDT_PERP')).toBe('BTC/USDT:USDT');
      expect(adapter.symbolFromExchange('ETHUSDT_PERP')).toBe('ETH/USDT:USDT');
      expect(adapter.symbolFromExchange('SOLUSDT_PERP')).toBe('SOL/USDT:USDT');
    });
  });

  // ============================================================================
  // 8. Rate Limiting (3 tests)
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
