/**
 * Integration Tests for GRVT WebSocket Wrapper
 *
 * Tests WebSocket streaming with mocked SDK WS class
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GRVTWebSocketWrapper } from '../../src/adapters/grvt/GRVTWebSocketWrapper.js';
import { WS, EStream } from '@grvt/client/ws';
import type {
  IOrderbookLevels,
  ITrade,
  IPositions,
  IOrder,
} from '@grvt/client/interfaces';

// Mock the GRVT SDK WS class
jest.mock('@grvt/client/ws');

describe('GRVT WebSocket Wrapper Tests', () => {
  let wrapper: GRVTWebSocketWrapper;
  let mockWS: jest.Mocked<WS>;
  let connectCallback: () => void;
  let closeCallback: () => void;
  let errorCallback: (error: Error) => void;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock WS class
    (WS as jest.MockedClass<typeof WS>).mockImplementation(() => {
      const mock = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        ready: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockReturnValue('sub-key-1'),
        unsubscribe: jest.fn(),
        onConnect: jest.fn((cb) => { connectCallback = cb; }),
        onClose: jest.fn((cb) => { closeCallback = cb; }),
        onError: jest.fn((cb) => { errorCallback = cb; }),
      } as any;
      return mock;
    });

    wrapper = new GRVTWebSocketWrapper({ testnet: true });
    mockWS = (wrapper as any).ws as jest.Mocked<WS>;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      expect(wrapper.connected).toBe(false);
    });

    it('should connect successfully', async () => {
      await wrapper.connect();

      expect(mockWS.connect).toHaveBeenCalled();
      expect(mockWS.ready).toHaveBeenCalledWith(5000);
    });

    it('should disconnect properly', () => {
      wrapper.disconnect();

      expect(mockWS.disconnect).toHaveBeenCalled();
      expect(wrapper.connected).toBe(false);
    });

    it('should update connection state on connect', () => {
      connectCallback();

      expect(wrapper.connected).toBe(true);
    });

    it('should update connection state on disconnect', () => {
      connectCallback(); // First connect
      closeCallback(); // Then disconnect

      expect(wrapper.connected).toBe(false);
    });
  });

  describe('watchOrderBook', () => {
    it('should subscribe to order book stream', async () => {
      const mockOrderBook: IOrderbookLevels = {
        instrument: 'BTC-PERP',
        bids: [
          { price: '50000', size: '1.5', num_orders: 3 },
          { price: '49990', size: '2.0', num_orders: 5 },
        ],
        asks: [
          { price: '50010', size: '1.0', num_orders: 2 },
          { price: '50020', size: '1.5', num_orders: 4 },
        ],
        event_time: '1234567890000',
      };

      let onDataCallback: (data: IOrderbookLevels) => void;

      mockWS.subscribe.mockImplementation((request: any) => {
        onDataCallback = request.onData;
        // Simulate receiving data
        setTimeout(() => onDataCallback(mockOrderBook), 50);
        return 'sub-key-1';
      });

      const generator = wrapper.watchOrderBook('BTC/USDT:USDT', 50);
      const { value } = await generator.next();
      await generator.return(undefined);

      expect(mockWS.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: EStream.RPI_BOOK_SNAP,
          params: {
            instrument: 'BTC-PERP',
            depth: 50,
          },
        })
      );
      expect(value?.symbol).toBe('BTC/USDT:USDT');
      expect(value?.bids).toHaveLength(2);
      expect(value?.asks).toHaveLength(2);
      expect(value?.bids[0]).toEqual([50000, 1.5]);
      expect(mockWS.unsubscribe).toHaveBeenCalledWith('sub-key-1');
    });

    it('should handle custom depth parameter', async () => {
      let subscribeCallParams: any;

      mockWS.subscribe.mockImplementation((request: any) => {
        subscribeCallParams = request;
        // Provide data to prevent hanging
        setTimeout(() => {
          if (request.onData) {
            request.onData({
              instrument: 'ETH-PERP',
              bids: [],
              asks: [],
              event_time: '123',
            });
          }
        }, 10);
        return 'sub-key-1';
      });

      const generator = wrapper.watchOrderBook('ETH/USDT:USDT', 100);

      // Start the generator (subscribe happens here)
      const nextPromise = generator.next();

      // Give it a moment to call subscribe
      await new Promise(resolve => setTimeout(resolve, 100));

      await generator.return(undefined);

      expect(subscribeCallParams).toBeDefined();
      expect(subscribeCallParams.stream).toBe(EStream.RPI_BOOK_SNAP);
      expect(subscribeCallParams.params).toEqual({
        instrument: 'ETH-PERP',
        depth: 100,
      });
    });

    it('should unsubscribe when generator is closed', async () => {
      mockWS.subscribe.mockImplementation((request: any) => {
        // Provide data to prevent hanging
        setTimeout(() => {
          if (request.onData) {
            request.onData({
              instrument: 'BTC-PERP',
              bids: [],
              asks: [],
              event_time: '123',
            });
          }
        }, 10);
        return 'sub-key-123';
      });

      const generator = wrapper.watchOrderBook('BTC/USDT:USDT');

      // Start the generator
      const nextPromise = generator.next();

      // Give it a moment to subscribe
      await new Promise(resolve => setTimeout(resolve, 100));

      await generator.return(undefined);

      expect(mockWS.unsubscribe).toHaveBeenCalledWith('sub-key-123');
    });

    it('should throw error from stream', async () => {
      let onErrorCallback: (error: Error) => void;

      mockWS.subscribe.mockImplementation((request: any) => {
        onErrorCallback = request.onError;
        setTimeout(() => onErrorCallback(new Error('Stream error')), 50);
        return 'sub-key-1';
      });

      const generator = wrapper.watchOrderBook('BTC/USDT:USDT');

      await expect(generator.next()).rejects.toThrow('Stream error');
    });
  });

  describe('watchTrades', () => {
    it('should subscribe to trades stream', async () => {
      const mockTrade: ITrade = {
        trade_id: 'trade-123',
        instrument: 'BTC-PERP',
        price: '50000',
        size: '0.5',
        is_taker_buyer: true,
        event_time: '1234567890000',
      };

      let onDataCallback: (data: ITrade) => void;

      mockWS.subscribe.mockImplementation((request: any) => {
        onDataCallback = request.onData;
        setTimeout(() => onDataCallback(mockTrade), 50);
        return 'sub-key-1';
      });

      const generator = wrapper.watchTrades('BTC/USDT:USDT');
      const { value } = await generator.next();
      await generator.return(undefined);

      expect(mockWS.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: EStream.TRADE,
          params: {
            instrument: 'BTC-PERP',
          },
        })
      );
      expect(value?.symbol).toBe('BTC/USDT:USDT');
      expect(value?.price).toBe(50000);
      expect(value?.amount).toBe(0.5);
      expect(value?.side).toBe('buy');
    });
  });

  describe('watchPositions', () => {
    it('should throw error without subAccountId', async () => {
      const wrapperWithoutSubAccount = new GRVTWebSocketWrapper({ testnet: true });

      const generator = wrapperWithoutSubAccount.watchPositions();

      await expect(generator.next()).rejects.toThrow('Sub-account ID required');
    });

    it('should subscribe to positions stream', async () => {
      const wrapperWithSubAccount = new GRVTWebSocketWrapper({
        testnet: true,
        subAccountId: 'sub-123',
      });

      const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

      const mockPosition: IPositions = {
        instrument: 'BTC-PERP',
        size: '2.5',
        entry_price: '48000',
        mark_price: '50000',
        notional: '125000',
        unrealized_pnl: '5000',
        realized_pnl: '1000',
        leverage: '10',
      };

      let onDataCallback: (data: IPositions) => void;

      mockWS2.subscribe.mockImplementation((request: any) => {
        onDataCallback = request.onData;
        setTimeout(() => onDataCallback(mockPosition), 50);
        return 'sub-key-1';
      });

      const generator = wrapperWithSubAccount.watchPositions();
      const { value } = await generator.next();
      await generator.return(undefined);

      expect(mockWS2.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: EStream.POSITION,
          params: {
            sub_account_id: 'sub-123',
          },
        })
      );
      expect(value?.symbol).toBe('BTC/USDT:USDT');
      expect(value?.side).toBe('long');
      expect(value?.size).toBe(2.5);
      expect(value?.unrealizedPnl).toBe(5000);
    });

    it('should filter by symbol', async () => {
      const wrapperWithSubAccount = new GRVTWebSocketWrapper({
        testnet: true,
        subAccountId: 'sub-123',
      });

      const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

      let subscribeCallParams: any;

      mockWS2.subscribe.mockImplementation((request: any) => {
        subscribeCallParams = request;
        // Provide data to prevent hanging
        setTimeout(() => {
          if (request.onData) {
            request.onData({
              instrument: 'BTC-PERP',
              size: '1',
              entry_price: '50000',
              mark_price: '51000',
              notional: '51000',
              unrealized_pnl: '1000',
              realized_pnl: '0',
              leverage: '10',
            });
          }
        }, 10);
        return 'sub-key-1';
      });

      const generator = wrapperWithSubAccount.watchPositions('BTC/USDT:USDT');

      // Start the generator
      const nextPromise = generator.next();

      // Give it a moment to call subscribe
      await new Promise(resolve => setTimeout(resolve, 100));

      await generator.return(undefined);

      expect(subscribeCallParams).toBeDefined();
      expect(subscribeCallParams.stream).toBe(EStream.POSITION);
      expect(subscribeCallParams.params).toEqual({
        sub_account_id: 'sub-123',
        instrument: 'BTC-PERP',
      });
    });
  });

  describe('watchOrders', () => {
    it('should throw error without subAccountId', async () => {
      const wrapperWithoutSubAccount = new GRVTWebSocketWrapper({ testnet: true });

      const generator = wrapperWithoutSubAccount.watchOrders();

      await expect(generator.next()).rejects.toThrow('Sub-account ID required');
    });

    it('should subscribe to orders stream', async () => {
      const wrapperWithSubAccount = new GRVTWebSocketWrapper({
        testnet: true,
        subAccountId: 'sub-123',
      });

      const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

      const mockOrder: IOrder = {
        order_id: 'order-123',
        is_market: false,
        legs: [
          {
            instrument: 'BTC-PERP',
            size: '1.5',
            limit_price: '50000',
            is_buying_asset: true,
          },
        ],
        state: {
          status: 'OPEN',
          traded_size: ['0'],
          book_size: ['1.5'],
        },
      };

      let onDataCallback: (data: IOrder) => void;

      mockWS2.subscribe.mockImplementation((request: any) => {
        onDataCallback = request.onData;
        setTimeout(() => onDataCallback(mockOrder), 50);
        return 'sub-key-1';
      });

      const generator = wrapperWithSubAccount.watchOrders();
      const { value } = await generator.next();
      await generator.return(undefined);

      expect(mockWS2.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: EStream.ORDER,
          params: {
            sub_account_id: 'sub-123',
          },
        })
      );
      expect(value?.symbol).toBe('BTC/USDT:USDT');
      expect(value?.type).toBe('limit');
      expect(value?.side).toBe('buy');
      expect(value?.amount).toBe(1.5);
      expect(value?.status).toBe('open');
    });

    it('should filter by symbol', async () => {
      const wrapperWithSubAccount = new GRVTWebSocketWrapper({
        testnet: true,
        subAccountId: 'sub-123',
      });

      const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

      let subscribeCallParams: any;

      mockWS2.subscribe.mockImplementation((request: any) => {
        subscribeCallParams = request;
        // Immediately provide some data to prevent hanging
        setTimeout(() => {
          if (request.onData) {
            request.onData({
              order_id: 'test',
              is_market: false,
              legs: [{ instrument: 'ETH-PERP', size: '1', is_buying_asset: true }],
              state: { status: 'OPEN', traded_size: ['0'], book_size: ['1'] },
            });
          }
        }, 10);
        return 'sub-key-1';
      });

      const generator = wrapperWithSubAccount.watchOrders('ETH/USDT:USDT');

      // Start the generator (this will call subscribe)
      const nextPromise = generator.next();

      // Wait for data
      await new Promise(resolve => setTimeout(resolve, 100));

      await generator.return(undefined);

      expect(subscribeCallParams).toBeDefined();
      expect(subscribeCallParams.stream).toBe(EStream.ORDER);
      expect(subscribeCallParams.params).toEqual({
        sub_account_id: 'sub-123',
        instrument: 'ETH-PERP',
      });
    });
  });

  describe('Reconnection Strategy', () => {
    it('should use exponential backoff for reconnection', () => {
      const config = {
        testnet: true,
        timeout: 30000,
      };

      const testWrapper = new GRVTWebSocketWrapper(config);
      const mockWS3 = (testWrapper as any).ws as jest.Mocked<WS>;

      // Verify WS was created with reconnect strategy
      expect(WS).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
          reconnectStrategy: expect.any(Function),
        })
      );

      // Test the reconnect strategy
      const wsCall = (WS as jest.Mock).mock.calls[0][0];
      const reconnectStrategy = wsCall.reconnectStrategy;

      expect(reconnectStrategy(0)).toBe(1000); // 1s
      expect(reconnectStrategy(1)).toBe(2000); // 2s
      expect(reconnectStrategy(2)).toBe(4000); // 4s
      expect(reconnectStrategy(3)).toBe(8000); // 8s
      expect(reconnectStrategy(4)).toBe(16000); // 16s
      expect(reconnectStrategy(5)).toBe(30000); // Max 30s
      expect(reconnectStrategy(10)).toBe(30000); // Still max 30s
    });
  });

  describe('Queue Management', () => {
    it('should handle multiple rapid updates', async () => {
      const mockTrades: ITrade[] = [
        {
          trade_id: 'trade-1',
          instrument: 'BTC-PERP',
          price: '50000',
          size: '0.5',
          is_taker_buyer: true,
          event_time: '1234567890000',
        },
        {
          trade_id: 'trade-2',
          instrument: 'BTC-PERP',
          price: '50010',
          size: '1.0',
          is_taker_buyer: false,
          event_time: '1234567891000',
        },
        {
          trade_id: 'trade-3',
          instrument: 'BTC-PERP',
          price: '50005',
          size: '0.3',
          is_taker_buyer: true,
          event_time: '1234567892000',
        },
      ];

      let onDataCallback: (data: ITrade) => void;

      mockWS.subscribe.mockImplementation((request: any) => {
        onDataCallback = request.onData;
        // Simulate rapid updates
        setTimeout(() => {
          mockTrades.forEach((trade) => onDataCallback(trade));
        }, 50);
        return 'sub-key-1';
      });

      const generator = wrapper.watchTrades('BTC/USDT:USDT');

      const results: any[] = [];
      for (let i = 0; i < 3; i++) {
        const { value, done } = await generator.next();
        if (done) break;
        results.push(value);
      }
      await generator.return(undefined);

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('trade-1');
      expect(results[1].id).toBe('trade-2');
      expect(results[2].id).toBe('trade-3');
    });
  });
});
