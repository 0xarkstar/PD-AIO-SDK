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

  describe('Edge Cases', () => {
    describe('Connection Errors', () => {
      it('should handle connection timeout', async () => {
        mockWS.ready.mockRejectedValue(new Error('Connection timeout'));

        await expect(wrapper.connect()).rejects.toThrow('Connection timeout');
      });

      it('should handle connection refused', async () => {
        mockWS.connect.mockImplementation(() => {
          throw new Error('ECONNREFUSED');
        });

        await expect(wrapper.connect()).rejects.toThrow('ECONNREFUSED');
      });

      it('should handle error callback during streaming', () => {
        const testError = new Error('WebSocket connection lost');
        errorCallback(testError);

        // Error should be logged but not crash
        expect(wrapper.connected).toBe(false);
      });
    });

    describe('Malformed Data Handling', () => {
      it('should handle malformed order book data', async () => {
        const malformedOrderBook = {
          instrument: 'BTC-PERP',
          // Missing required fields (bids, asks)
          event_time: '123',
        };

        let onDataCallback: (data: any) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(malformedOrderBook), 50);
          return 'sub-key-1';
        });

        const generator = wrapper.watchOrderBook('BTC/USDT:USDT');
        const { value } = await generator.next();
        await generator.return(undefined);

        // Should handle gracefully with empty arrays
        expect(value?.bids).toHaveLength(0);
        expect(value?.asks).toHaveLength(0);
      });

      it('should handle invalid price in trade data', async () => {
        const invalidTrade: ITrade = {
          trade_id: 'trade-123',
          instrument: 'BTC-PERP',
          price: 'invalid', // Invalid number
          size: '1.0',
          is_taker_buyer: true,
          event_time: '123',
        };

        let onDataCallback: (data: ITrade) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(invalidTrade), 50);
          return 'sub-key-1';
        });

        const generator = wrapper.watchTrades('BTC/USDT:USDT');

        // Should throw validation error for invalid data
        await expect(generator.next()).rejects.toThrow('Invalid number conversion');
      });
    });

    describe('Symbol Normalization Edge Cases', () => {
      it('should handle symbols with special characters', async () => {
        mockWS.subscribe.mockImplementation((request: any) => {
          expect(request.params.instrument).toBe('1INCH-PERP');
          setTimeout(() => {
            request.onData({
              instrument: '1INCH-PERP',
              bids: [],
              asks: [],
              event_time: '123',
            });
          }, 10);
          return 'sub-key-1';
        });

        const generator = wrapper.watchOrderBook('1INCH/USDT:USDT');
        const nextPromise = generator.next();
        await new Promise(resolve => setTimeout(resolve, 100));
        await generator.return(undefined);

        expect(mockWS.subscribe).toHaveBeenCalled();
      });

      it('should normalize symbols with hyphens', async () => {
        mockWS.subscribe.mockImplementation((request: any) => {
          // BTC-USD should become BTC-PERP
          setTimeout(() => {
            request.onData({
              instrument: request.params.instrument,
              bids: [],
              asks: [],
              event_time: '123',
            });
          }, 10);
          return 'sub-key-1';
        });

        const generator = wrapper.watchOrderBook('BTC/USDT:USDT');

        // Start the generator to trigger subscribe
        const nextPromise = generator.next();
        await new Promise(resolve => setTimeout(resolve, 100));
        await generator.return(undefined);

        // Verify subscribe was called with correct instrument
        expect(mockWS.subscribe).toHaveBeenCalled();
        const callArgs = (mockWS.subscribe as jest.Mock).mock.calls;
        if (callArgs.length > 0) {
          expect(callArgs[0][0].params.instrument).toBe('BTC-PERP');
        }
      });
    });

    describe('Position Edge Cases', () => {
      it('should handle short positions', async () => {
        const wrapperWithSubAccount = new GRVTWebSocketWrapper({
          testnet: true,
          subAccountId: 'sub-123',
        });

        const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

        const shortPosition: IPositions = {
          instrument: 'ETH-PERP',
          size: '-3.5', // Negative = short
          entry_price: '3000',
          mark_price: '2900',
          notional: '-10150',
          unrealized_pnl: '350', // Profit on short
          realized_pnl: '100',
          leverage: '5',
        };

        let onDataCallback: (data: IPositions) => void;

        mockWS2.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(shortPosition), 50);
          return 'sub-key-1';
        });

        const generator = wrapperWithSubAccount.watchPositions();
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.side).toBe('short');
        expect(value?.size).toBe(3.5); // Absolute value
        expect(value?.unrealizedPnl).toBe(350);
      });

      it('should handle zero/closed positions', async () => {
        const wrapperWithSubAccount = new GRVTWebSocketWrapper({
          testnet: true,
          subAccountId: 'sub-123',
        });

        const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

        const closedPosition: IPositions = {
          instrument: 'BTC-PERP',
          size: '0', // Closed position
          entry_price: '0',
          mark_price: '50000',
          notional: '0',
          unrealized_pnl: '0',
          realized_pnl: '1500', // Total realized
          leverage: '0',
        };

        let onDataCallback: (data: IPositions) => void;

        mockWS2.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(closedPosition), 50);
          return 'sub-key-1';
        });

        const generator = wrapperWithSubAccount.watchPositions();
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.size).toBe(0);
        // When size is 0, side is determined by entry_price (0 defaults to short)
        expect(['long', 'short']).toContain(value?.side);
      });
    });

    describe('Order Status Edge Cases', () => {
      it('should handle partially filled orders', async () => {
        const wrapperWithSubAccount = new GRVTWebSocketWrapper({
          testnet: true,
          subAccountId: 'sub-123',
        });

        const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

        const partialOrder: IOrder = {
          order_id: 'order-456',
          is_market: false,
          legs: [
            {
              instrument: 'ETH-PERP',
              size: '10.0',
              limit_price: '3000',
              is_buying_asset: false,
            },
          ],
          state: {
            status: 'PARTIAL',
            traded_size: ['3.5'], // 3.5/10 filled
            book_size: ['6.5'], // 6.5 remaining
          },
        };

        let onDataCallback: (data: IOrder) => void;

        mockWS2.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(partialOrder), 50);
          return 'sub-key-1';
        });

        const generator = wrapperWithSubAccount.watchOrders();
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.status).toBe('open'); // PARTIAL mapped to open
        expect(value?.side).toBe('sell');
        expect(value?.amount).toBe(10.0);
      });

      it('should handle cancelled orders', async () => {
        const wrapperWithSubAccount = new GRVTWebSocketWrapper({
          testnet: true,
          subAccountId: 'sub-123',
        });

        const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

        const cancelledOrder: IOrder = {
          order_id: 'order-789',
          is_market: false,
          legs: [
            {
              instrument: 'BTC-PERP',
              size: '2.0',
              limit_price: '49000',
              is_buying_asset: true,
            },
          ],
          state: {
            status: 'CANCELLED',
            traded_size: ['0'],
            book_size: ['0'],
          },
        };

        let onDataCallback: (data: IOrder) => void;

        mockWS2.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(cancelledOrder), 50);
          return 'sub-key-1';
        });

        const generator = wrapperWithSubAccount.watchOrders();
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.status).toBe('canceled');
      });

      it('should handle rejected orders', async () => {
        const wrapperWithSubAccount = new GRVTWebSocketWrapper({
          testnet: true,
          subAccountId: 'sub-123',
        });

        const mockWS2 = (wrapperWithSubAccount as any).ws as jest.Mocked<WS>;

        const rejectedOrder: IOrder = {
          order_id: 'order-999',
          is_market: true,
          legs: [
            {
              instrument: 'SOL-PERP',
              size: '100.0',
              is_buying_asset: true,
            },
          ],
          state: {
            status: 'REJECTED',
            traded_size: ['0'],
            book_size: ['0'],
          },
        };

        let onDataCallback: (data: IOrder) => void;

        mockWS2.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(rejectedOrder), 50);
          return 'sub-key-1';
        });

        const generator = wrapperWithSubAccount.watchOrders();
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.status).toBe('rejected');
        expect(value?.type).toBe('market');
      });
    });

    describe('OrderBook Edge Cases', () => {
      it('should handle empty order book', async () => {
        const emptyOrderBook: IOrderbookLevels = {
          instrument: 'BTC-PERP',
          bids: [],
          asks: [],
          event_time: '123',
        };

        let onDataCallback: (data: IOrderbookLevels) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(emptyOrderBook), 50);
          return 'sub-key-1';
        });

        const generator = wrapper.watchOrderBook('BTC/USDT:USDT');
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.bids).toHaveLength(0);
        expect(value?.asks).toHaveLength(0);
      });

      it('should handle order book with only bids', async () => {
        const bidsOnlyOrderBook: IOrderbookLevels = {
          instrument: 'ETH-PERP',
          bids: [
            { price: '3000', size: '5.0', num_orders: 2 },
          ],
          asks: [],
          event_time: '123',
        };

        let onDataCallback: (data: IOrderbookLevels) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(bidsOnlyOrderBook), 50);
          return 'sub-key-1';
        });

        const generator = wrapper.watchOrderBook('ETH/USDT:USDT');
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.bids).toHaveLength(1);
        expect(value?.asks).toHaveLength(0);
      });
    });

    describe('Trade Side Edge Cases', () => {
      it('should handle sell-side trades', async () => {
        const sellTrade: ITrade = {
          trade_id: 'trade-sell',
          instrument: 'ETH-PERP',
          price: '3000',
          size: '2.5',
          is_taker_buyer: false, // Taker is seller
          event_time: '123',
        };

        let onDataCallback: (data: ITrade) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(sellTrade), 50);
          return 'sub-key-1';
        });

        const generator = wrapper.watchTrades('ETH/USDT:USDT');
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.side).toBe('sell');
      });

      it('should handle zero-size trades', async () => {
        const zeroTrade: ITrade = {
          trade_id: 'trade-zero',
          instrument: 'BTC-PERP',
          price: '50000',
          size: '0',
          is_taker_buyer: true,
          event_time: '123',
        };

        let onDataCallback: (data: ITrade) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onDataCallback = request.onData;
          setTimeout(() => onDataCallback(zeroTrade), 50);
          return 'sub-key-1';
        });

        const generator = wrapper.watchTrades('BTC/USDT:USDT');
        const { value } = await generator.next();
        await generator.return(undefined);

        expect(value?.amount).toBe(0);
      });
    });

    describe('Resource Cleanup', () => {
      it('should cleanup multiple concurrent streams', async () => {
        let subscriptionCount = 0;

        mockWS.subscribe.mockImplementation((request: any) => {
          subscriptionCount++;
          const subKey = `sub-${subscriptionCount}`;
          setTimeout(() => {
            request.onData({
              instrument: request.params.instrument,
              bids: [],
              asks: [],
              event_time: '123',
            });
          }, 10);
          return subKey;
        });

        // Start 3 concurrent streams
        const gen1 = wrapper.watchOrderBook('BTC/USDT:USDT');
        const gen2 = wrapper.watchOrderBook('ETH/USDT:USDT');
        const gen3 = wrapper.watchOrderBook('SOL/USDT:USDT');

        // Consume one value from each to start subscriptions
        const promises = [gen1.next(), gen2.next(), gen3.next()];
        await Promise.all(promises);

        // Close all streams
        await gen1.return(undefined);
        await gen2.return(undefined);
        await gen3.return(undefined);

        // All subscriptions should be cleaned up
        expect(mockWS.unsubscribe).toHaveBeenCalledTimes(3);
        expect(mockWS.unsubscribe).toHaveBeenCalledWith('sub-1');
        expect(mockWS.unsubscribe).toHaveBeenCalledWith('sub-2');
        expect(mockWS.unsubscribe).toHaveBeenCalledWith('sub-3');
      });

      it('should cleanup on error', async () => {
        let onErrorCallback: (error: Error) => void;

        mockWS.subscribe.mockImplementation((request: any) => {
          onErrorCallback = request.onError;
          setTimeout(() => onErrorCallback(new Error('Fatal error')), 50);
          return 'sub-error';
        });

        const generator = wrapper.watchOrderBook('BTC/USDT:USDT');

        await expect(generator.next()).rejects.toThrow('Fatal error');

        // Should still unsubscribe on error
        expect(mockWS.unsubscribe).toHaveBeenCalledWith('sub-error');
      });
    });
  });
});
