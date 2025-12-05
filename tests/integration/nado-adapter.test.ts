/**
 * Nado Adapter Integration Tests
 * Tests complete request/response cycles with properly mocked API responses
 */

import { Wallet } from 'ethers';
import { NadoAdapter } from '../../src/adapters/nado/NadoAdapter.js';
import { toX18 } from '../../src/adapters/nado/utils.js';
import { NADO_ORDER_SIDES } from '../../src/adapters/nado/constants.js';

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
      };
    }),
  };
});

// Store original fetch
const originalFetch = global.fetch;

// Mock responses
const mockNadoResponses = {
  contracts: {
    chain_id: 763373,
    endpoint_address: '0x1234567890123456789012345678901234567890',
    products: {
      '1': {
        address: '0x1111111111111111111111111111111111111111',
        symbol: 'BTC-PERP',
      },
      '2': {
        address: '0x2222222222222222222222222222222222222222',
        symbol: 'ETH-PERP',
      },
    },
  },
  products: [
    {
      product_id: 1,
      symbol: 'BTC-PERP',
      base_currency: 'BTC',
      quote_currency: 'USDT',
      contract_size: '1',
      tick_size: '0.01',
      min_size: '0.001',
      max_position_size: '100',
      maker_fee: '0.0002',
      taker_fee: '0.0005',
      is_active: true,
      product_type: 'perpetual',
    },
    {
      product_id: 2,
      symbol: 'ETH-PERP',
      base_currency: 'ETH',
      quote_currency: 'USDT',
      contract_size: '1',
      tick_size: '0.01',
      min_size: '0.01',
      max_position_size: '1000',
      maker_fee: '0.0002',
      taker_fee: '0.0005',
      is_active: true,
      product_type: 'perpetual',
    },
  ],
  nonce: {
    nonce: 1,
  },
  balance: {
    subaccount: '0x1234567890123456789012345678901234567890',
    quote_balance: toX18(10000),
    total_equity: toX18(15000),
    used_margin: toX18(5000),
    free_margin: toX18(10000),
    unrealized_pnl: toX18(500),
    health: '0.75',
    timestamp: Date.now(),
  },
  positions: [
    {
      product_id: 1,
      subaccount: '0x1234567890123456789012345678901234567890',
      size: toX18(0.5),
      entry_price: toX18(50000),
      mark_price: toX18(51000),
      liquidation_price: toX18(40000),
      unrealized_pnl: toX18(500),
      realized_pnl: toX18(100),
      margin: toX18(5000),
      leverage: '10',
      timestamp: Date.now(),
    },
  ],
  orders: [
    {
      order_id: 'order-123',
      digest: '0xabc...def',
      product_id: 1,
      sender: '0x1234567890123456789012345678901234567890',
      price_x18: toX18(50000),
      amount: toX18(0.1),
      side: NADO_ORDER_SIDES.BUY,
      expiration: Math.floor(Date.now() / 1000) + 86400,
      nonce: 1,
      status: 'open',
      filled_amount: toX18(0),
      remaining_amount: toX18(0.1),
      timestamp: Date.now(),
      is_reduce_only: false,
      post_only: true,
      time_in_force: 'gtc',
    },
  ],
  orderBook: {
    product_id: 1,
    bids: [
      [toX18(50000), toX18(1.5), Date.now()],
      [toX18(49900), toX18(2.0), Date.now()],
    ],
    asks: [
      [toX18(50100), toX18(1.0), Date.now()],
      [toX18(50200), toX18(1.5), Date.now()],
    ],
    timestamp: Date.now(),
  },
  ticker: {
    product_id: 1,
    symbol: 'BTC-PERP',
    last_price: toX18(50000),
    mark_price: toX18(50010),
    index_price: toX18(50005),
    high_24h: toX18(51000),
    low_24h: toX18(49000),
    volume_24h: toX18(1000),
    funding_rate: '0.0001',
    next_funding_time: Date.now() + 8 * 3600 * 1000,
    open_interest: '10000',
    timestamp: Date.now(),
  },
  orderResponse: {
    order_id: 'order-456',
    digest: '0x123...456',
    product_id: 1,
    sender: '0x1234567890123456789012345678901234567890',
    price_x18: toX18(50000),
    amount: toX18(0.1),
    side: NADO_ORDER_SIDES.BUY,
    expiration: Math.floor(Date.now() / 1000) + 86400,
    nonce: 2,
    status: 'open',
    filled_amount: toX18(0),
    remaining_amount: toX18(0.1),
    timestamp: Date.now(),
    is_reduce_only: false,
    post_only: true,
    time_in_force: 'gtc',
  },
  cancelResponse: {
    order_id: 'order-456',
    digest: '0x123...456',
    product_id: 1,
    sender: '0x1234567890123456789012345678901234567890',
    price_x18: toX18(50000),
    amount: toX18(0.1),
    side: NADO_ORDER_SIDES.BUY,
    expiration: Math.floor(Date.now() / 1000) + 86400,
    nonce: 2,
    status: 'cancelled',
    filled_amount: toX18(0),
    remaining_amount: toX18(0.1),
    timestamp: Date.now(),
    is_reduce_only: false,
    post_only: true,
    time_in_force: 'gtc',
  },
};

describe('NadoAdapter Integration Tests', () => {
  let adapter: NadoAdapter;
  let mockFetch: jest.Mock;
  let wallet: Wallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();

    // Create fresh mock for each test
    mockFetch = jest.fn((url: string, options?: any) => {
      const urlStr = url.toString();
      const method = options?.method || 'GET';

      // Parse request body for /query endpoint
      let requestBody: any = {};
      if (options?.body) {
        try {
          requestBody = JSON.parse(options.body);
        } catch (e) {
          // ignore
        }
      }

      // Query endpoint - return different data based on type
      if (urlStr.includes('/query') && method === 'POST') {
        const { type } = requestBody;

        if (type === 'contracts') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.contracts }),
          } as Response);
        }

        if (type === 'nonces') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.nonce }),
          } as Response);
        }

        if (type === 'all_products') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.products }),
          } as Response);
        }

        if (type === 'market_liquidity') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.orderBook }),
          } as Response);
        }

        if (type === 'market_prices') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.ticker }),
          } as Response);
        }

        if (type === 'subaccount_info') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.balance }),
          } as Response);
        }

        if (type === 'isolated_positions') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.positions }),
          } as Response);
        }

        if (type === 'orders') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.orders }),
          } as Response);
        }

        if (type === 'order') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.orders[0] }),
          } as Response);
        }
      }

      // Contracts endpoint (legacy)
      if (urlStr.includes('/contracts')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.contracts,
        } as Response);
      }

      // Nonce endpoint (legacy)
      if (urlStr.includes('/nonce') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.nonce,
        } as Response);
      }

      // Products endpoint (legacy)
      if (urlStr.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.products,
        } as Response);
      }

      // Order book endpoint
      if (urlStr.includes('/orderbook')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.orderBook,
        } as Response);
      }

      // Ticker endpoint
      if (urlStr.includes('/ticker')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.ticker,
        } as Response);
      }

      // Balance endpoint
      if (urlStr.includes('/balance')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.balance,
        } as Response);
      }

      // Positions endpoint
      if (urlStr.includes('/positions')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.positions,
        } as Response);
      }

      // Orders endpoint
      if (urlStr.includes('/orders') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => mockNadoResponses.orders,
        } as Response);
      }

      // Execute endpoint (create/cancel order)
      if (urlStr.includes('/execute') && method === 'POST') {
        const { type } = requestBody;

        if (type === 'cancel_order' || type === 'cancel_orders') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.cancelResponse }),
          } as Response);
        }

        if (type === 'place_order') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'success', data: mockNadoResponses.orderResponse }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.orderResponse }),
        } as Response);
      }

      // Default response
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      } as Response);
    });

    global.fetch = mockFetch as any;

    adapter = new NadoAdapter({
      testnet: true,
      wallet,
    });
    await adapter.initialize();

    // Clear mock calls from initialization
    mockFetch.mockClear();
  });

  afterEach(async () => {
    await adapter.disconnect();
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('Adapter Initialization', () => {
    test('initializes with correct properties', () => {
      expect(adapter.id).toBe('nado');
      expect(adapter.name).toBe('Nado');
      expect(adapter.isReady).toBe(true);
    });

    test('has correct capabilities', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
    });
  });

  describe('Market Data Operations', () => {
    test('fetchMarkets - returns preloaded markets', async () => {
      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0]).toMatchObject({
        id: '1',
        symbol: 'BTC/USDT:USDT',
        base: 'BTC',
        quote: 'USDT',
        settle: 'USDT',
        active: true,
        maxLeverage: 50,
      });
      expect(markets[1].symbol).toBe('ETH/USDT:USDT');
    });

    test('fetchOrderBook - fetches and normalizes order book', async () => {
      const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.exchange).toBe('nado');
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
      expect(orderBook.bids[0][0]).toBe(50000);
      expect(orderBook.asks[0][0]).toBe(50100);
    });

    test('fetchTicker - fetches and normalizes ticker', async () => {

      const ticker = await adapter.fetchTicker('BTC/USDT:USDT');

      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(ticker.last).toBe(50000);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
      expect(ticker.baseVolume).toBe(1000);
    });

    test('fetchFundingRate - fetches current funding rate', async () => {

      const fundingRate = await adapter.fetchFundingRate('BTC/USDT:USDT');

      expect(fundingRate.symbol).toBe('BTC/USDT:USDT');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(typeof fundingRate.markPrice).toBe('number');
      expect(fundingRate.fundingIntervalHours).toBe(8);
    });
  });

  describe('Account Operations', () => {
    test('fetchBalance - fetches account balance', async () => {

      const balances = await adapter.fetchBalance();

      expect(balances).toHaveLength(1);
      expect(balances[0]).toMatchObject({
        currency: 'USDT',
        free: 10000,
        used: 5000,
        total: 15000,
      });
    });

    test('fetchPositions - fetches open positions', async () => {

      const positions = await adapter.fetchPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        side: 'long',
        size: 0.5,
        unrealizedPnl: 500,
        realizedPnl: 100,
        leverage: 10,
        markPrice: 51000,
        entryPrice: 50000,
      });
    });

    test('fetchOpenOrders - fetches open orders', async () => {

      const orders = await adapter.fetchOpenOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: 'order-123',
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        price: 50000,
        amount: 0.1,
        status: 'open',
        postOnly: true,
      });
    });

    test('fetchOpenOrders with symbol - filters by symbol', async () => {

      const orders = await adapter.fetchOpenOrders('BTC/USDT:USDT');

      expect(orders).toHaveLength(1);
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
    });
  });

  describe('Trading Operations', () => {
    test('createOrder - creates limit buy order', async () => {

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        postOnly: true,
      });

      expect(order).toMatchObject({
        id: 'order-456',
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        price: 50000,
        amount: 0.1,
        status: 'open',
        postOnly: true,
      });

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/execute');
      expect(options.method).toBe('POST');
    });

    test('createOrder - creates limit sell order', async () => {

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'sell',
        amount: 0.1,
        price: 51000,
      });

      expect(order).toMatchObject({
        side: 'sell',
        price: 51000,
      });
    });

    test('createOrder - creates reduce-only order', async () => {

      const order = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        reduceOnly: true,
      });

      expect(order.reduceOnly).toBe(true);
    });

    test('cancelOrder - cancels order by ID', async () => {
      mockFetch
        // First call: fetch order to find digest
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.orders[0] }),
        })
        // Second call: cancel order
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.cancelResponse }),
        });

      const canceledOrder = await adapter.cancelOrder('order-123');

      expect(canceledOrder).toMatchObject({
        id: 'order-123',
        status: 'canceled',
      });
    });

    test('cancelOrder with symbol - cancels order by ID and symbol', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.orders[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.cancelResponse }),
        });

      const canceledOrder = await adapter.cancelOrder('order-123', 'BTC/USDT:USDT');

      expect(canceledOrder.status).toBe('canceled');
    });

    test('cancelAllOrders - cancels all orders', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.orders }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.cancelResponse }),
        });

      const canceledOrders = await adapter.cancelAllOrders();

      expect(canceledOrders).toHaveLength(1);
      expect(canceledOrders[0].status).toBe('canceled');
    });

    test('cancelAllOrders with symbol - cancels all orders for symbol', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.orders }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: mockNadoResponses.cancelResponse }),
        });

      const canceledOrders = await adapter.cancelAllOrders('BTC/USDT:USDT');

      expect(canceledOrders).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {

      await expect(adapter.fetchOrderBook('BTC/USDT:USDT')).rejects.toThrow();
    });

    test('throws error for unsupported symbol', async () => {
      await expect(adapter.fetchOrderBook('INVALID/PAIR:USDT')).rejects.toThrow(
        'Symbol INVALID/PAIR:USDT not found'
      );
    });
  });
});
