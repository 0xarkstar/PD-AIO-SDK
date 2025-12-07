/**
 * Unit tests for GRVTSDKWrapper
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GRVTSDKWrapper } from '../../src/adapters/grvt/GRVTSDKWrapper.js';

// Mock @grvt/client SDK
const mockMDGInstance = {
  axios: { defaults: {} },
  instrument: jest.fn(),
  instruments: jest.fn(),
  allInstruments: jest.fn(),
  miniTicker: jest.fn(),
  ticker: jest.fn(),
  orderBook: jest.fn(),
  trade: jest.fn(),
  tradesHistory: jest.fn(),
  settlement: jest.fn(),
  funding: jest.fn(),
  candlestick: jest.fn(),
  marginRules: jest.fn(),
};

const mockTDGInstance = {
  axios: { defaults: {} },
  createOrder: jest.fn(),
  createBulkOrders: jest.fn(),
  cancelOrder: jest.fn(),
  cancelAllOrders: jest.fn(),
  order: jest.fn(),
  openOrders: jest.fn(),
  orderHistory: jest.fn(),
  orderGroup: jest.fn(),
  replaceOrders: jest.fn(),
  preOrderCheck: jest.fn(),
  getPriceProtectionBands: jest.fn(),
  positions: jest.fn(),
  subAccountSummary: jest.fn(),
  subAccountHistory: jest.fn(),
  fillHistory: jest.fn(),
  aggregatedAccountSummary: jest.fn(),
  fundingAccountSummary: jest.fn(),
  fundingPaymentHistory: jest.fn(),
  preDepositCheck: jest.fn(),
  depositHistory: jest.fn(),
  transfer: jest.fn(),
  transferHistory: jest.fn(),
  withdrawal: jest.fn(),
  withdrawalHistory: jest.fn(),
  getAllInitialLeverage: jest.fn(),
  setInitialLeverage: jest.fn(),
  getMarginTiers: jest.fn(),
};

jest.mock('@grvt/client', () => ({
  MDG: jest.fn(() => mockMDGInstance),
  TDG: jest.fn(() => mockTDGInstance),
}));

describe('GRVTSDKWrapper', () => {
  let wrapper: GRVTSDKWrapper;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create wrapper
    wrapper = new GRVTSDKWrapper({
      host: 'https://api-testnet.grvt.io/v1',
    });
  });

  describe('constructor', () => {
    it('should create instance with testnet config', () => {
      expect(wrapper).toBeInstanceOf(GRVTSDKWrapper);
    });

    it('should create instance with custom config', () => {
      const customWrapper = new GRVTSDKWrapper({
        host: 'https://custom.api.com',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        timeout: 60000,
      });

      expect(customWrapper).toBeInstanceOf(GRVTSDKWrapper);
    });
  });

  describe('axios accessors', () => {
    it('should expose mdgAxios', () => {
      expect(wrapper.mdgAxios).toBeDefined();
    });

    it('should expose tdgAxios', () => {
      expect(wrapper.tdgAxios).toBeDefined();
    });
  });

  describe('Market Data Methods', () => {
    describe('getInstrument', () => {
      it('should call MDG.instrument with correct params', async () => {
        const mockResponse = { result: { instrument_id: 'BTC-PERP' } };
        (mockMDGInstance.instrument as jest.Mock).mockResolvedValue(mockResponse);

        const result = await wrapper.getInstrument('BTC-PERP');

        expect(mockMDGInstance.instrument).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });

      it('should pass through axios config', async () => {
        const config = { timeout: 5000 };
        (mockMDGInstance.instrument as jest.Mock).mockResolvedValue({});

        await wrapper.getInstrument('ETH-PERP', config);

        expect(mockMDGInstance.instrument).toHaveBeenCalledWith(
          { instrument: 'ETH-PERP' },
          config
        );
      });
    });

    describe('getInstruments', () => {
      it('should call MDG.instruments', async () => {
        const mockResponse = { result: [] };
        mockMDGInstance.instruments.mockResolvedValue(mockResponse);

        const result = await wrapper.getInstruments();

        expect(mockMDGInstance.instruments).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(mockResponse);
      });

      it('should pass filter params', async () => {
        const params = { is_active: true };
        mockMDGInstance.instruments.mockResolvedValue({});

        await wrapper.getInstruments(params);

        expect(mockMDGInstance.instruments).toHaveBeenCalledWith(params, undefined);
      });
    });

    describe('getAllInstruments', () => {
      it('should call MDG.allInstruments', async () => {
        const mockResponse = { result: [] };
        mockMDGInstance.allInstruments.mockResolvedValue(mockResponse);

        const result = await wrapper.getAllInstruments();

        expect(mockMDGInstance.allInstruments).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getMiniTicker', () => {
      it('should call MDG.miniTicker', async () => {
        const mockResponse = { result: {} };
        mockMDGInstance.miniTicker.mockResolvedValue(mockResponse);

        const result = await wrapper.getMiniTicker('BTC-PERP');

        expect(mockMDGInstance.miniTicker).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getTicker', () => {
      it('should call MDG.ticker', async () => {
        const mockResponse = { result: {} };
        mockMDGInstance.ticker.mockResolvedValue(mockResponse);

        const result = await wrapper.getTicker('BTC-PERP');

        expect(mockMDGInstance.ticker).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getOrderBook', () => {
      it('should call MDG.orderBook with depth', async () => {
        const mockResponse = { result: { bids: [], asks: [] } };
        mockMDGInstance.orderBook.mockResolvedValue(mockResponse);

        const result = await wrapper.getOrderBook('BTC-PERP', 50);

        expect(mockMDGInstance.orderBook).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP', depth: 50 },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getTrade', () => {
      it('should call MDG.trade', async () => {
        const mockResponse = { result: {} };
        mockMDGInstance.trade.mockResolvedValue(mockResponse);

        const result = await wrapper.getTrade('BTC-PERP');

        expect(mockMDGInstance.trade).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getTradeHistory', () => {
      it('should call MDG.tradesHistory', async () => {
        const mockResponse = { result: [] };
        mockMDGInstance.tradesHistory.mockResolvedValue(mockResponse);

        const result = await wrapper.getTradeHistory({ instrument: 'BTC-PERP' });

        expect(mockMDGInstance.tradesHistory).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getSettlement', () => {
      it('should call MDG.settlement', async () => {
        const mockResponse = { result: [] };
        mockMDGInstance.settlement.mockResolvedValue(mockResponse);

        const result = await wrapper.getSettlement({ base: 'BTC', quote: 'USD' });

        expect(mockMDGInstance.settlement).toHaveBeenCalledWith(
          { base: 'BTC', quote: 'USD' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getFunding', () => {
      it('should call MDG.funding', async () => {
        const mockResponse = { result: {} };
        mockMDGInstance.funding.mockResolvedValue(mockResponse);

        const result = await wrapper.getFunding('BTC-PERP');

        expect(mockMDGInstance.funding).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getCandlestick', () => {
      it('should call MDG.candlestick', async () => {
        const mockResponse = { result: [] };
        mockMDGInstance.candlestick.mockResolvedValue(mockResponse);

        const params = { instrument: 'BTC-PERP', interval: '1m' };
        const result = await wrapper.getCandlestick(params);

        expect(mockMDGInstance.candlestick).toHaveBeenCalledWith(params, undefined);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getMarginRules', () => {
      it('should call MDG.marginRules', async () => {
        const mockResponse = { result: {} };
        mockMDGInstance.marginRules.mockResolvedValue(mockResponse);

        const result = await wrapper.getMarginRules();

        expect(mockMDGInstance.marginRules).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Trading Methods', () => {
    describe('createOrder', () => {
      it('should call TDG.createOrder and extract session cookie', async () => {
        const mockResponse = {
          data: { order_id: '123' },
          headers: {
            'set-cookie': ['session=abc123; Path=/; HttpOnly'],
          },
        };
        mockTDGInstance.createOrder.mockResolvedValue(mockResponse);

        const order = { instrument: 'BTC-PERP', side: 'BUY', size: '0.1' };
        const result = await wrapper.createOrder(order);

        expect(mockTDGInstance.createOrder).toHaveBeenCalledWith(order, undefined);
        expect(result).toEqual(mockResponse);
        expect(wrapper.getSessionCookie()).toBe('session=abc123');
      });
    });

    describe('cancelOrder', () => {
      it('should call TDG.cancelOrder', async () => {
        const mockResponse = { data: {} };
        mockTDGInstance.cancelOrder.mockResolvedValue(mockResponse);

        const result = await wrapper.cancelOrder({ order_id: '123' });

        expect(mockTDGInstance.cancelOrder).toHaveBeenCalledWith(
          { order_id: '123' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('cancelAllOrders', () => {
      it('should call TDG.cancelAllOrders', async () => {
        const mockResponse = { data: {} };
        mockTDGInstance.cancelAllOrders.mockResolvedValue(mockResponse);

        const result = await wrapper.cancelAllOrders({ instrument: 'BTC-PERP' });

        expect(mockTDGInstance.cancelAllOrders).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getOrder', () => {
      it('should call TDG.order', async () => {
        const mockResponse = { result: {} };
        mockTDGInstance.order.mockResolvedValue(mockResponse);

        const result = await wrapper.getOrder({ order_id: '123' });

        expect(mockTDGInstance.order).toHaveBeenCalledWith({ order_id: '123' }, undefined);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getOpenOrders', () => {
      it('should call TDG.openOrders', async () => {
        const mockResponse = { result: [] };
        mockTDGInstance.openOrders.mockResolvedValue(mockResponse);

        const result = await wrapper.getOpenOrders();

        expect(mockTDGInstance.openOrders).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getOrderHistory', () => {
      it('should call TDG.orderHistory (fixes unimplemented)', async () => {
        const mockResponse = { result: [] };
        mockTDGInstance.orderHistory.mockResolvedValue(mockResponse);

        const result = await wrapper.getOrderHistory({ instrument: 'BTC-PERP' });

        expect(mockTDGInstance.orderHistory).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getOrderGroup', () => {
      it('should call TDG.orderGroup', async () => {
        const mockResponse = { result: {} };
        mockTDGInstance.orderGroup.mockResolvedValue(mockResponse);

        const result = await wrapper.getOrderGroup({ sub_account_id: 'sub123' });

        expect(mockTDGInstance.orderGroup).toHaveBeenCalledWith(
          { sub_account_id: 'sub123' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Account Methods', () => {
    describe('getPositions', () => {
      it('should call TDG.positions', async () => {
        const mockResponse = { result: [] };
        mockTDGInstance.positions.mockResolvedValue(mockResponse);

        const result = await wrapper.getPositions();

        expect(mockTDGInstance.positions).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getSubAccountSummary', () => {
      it('should call TDG.subAccountSummary', async () => {
        const mockResponse = { result: {} };
        mockTDGInstance.subAccountSummary.mockResolvedValue(mockResponse);

        const result = await wrapper.getSubAccountSummary();

        expect(mockTDGInstance.subAccountSummary).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getFillHistory', () => {
      it('should call TDG.fillHistory (fixes unimplemented)', async () => {
        const mockResponse = { result: [] };
        mockTDGInstance.fillHistory.mockResolvedValue(mockResponse);

        const result = await wrapper.getFillHistory({ instrument: 'BTC-PERP' });

        expect(mockTDGInstance.fillHistory).toHaveBeenCalledWith(
          { instrument: 'BTC-PERP' },
          undefined
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Session Management', () => {
    describe('extractSessionCookieFromResponse', () => {
      it('should extract session cookie from Set-Cookie header', async () => {
        const mockResponse = {
          data: {},
          headers: {
            'set-cookie': ['session=xyz789; Path=/; HttpOnly', 'other=value'],
          },
        };
        mockTDGInstance.createOrder.mockResolvedValue(mockResponse);

        await wrapper.createOrder({});

        expect(wrapper.getSessionCookie()).toBe('session=xyz789');
      });

      it('should handle multiple cookies and find session', async () => {
        const mockResponse = {
          data: {},
          headers: {
            'set-cookie': [
              'csrf=abc123',
              'SESSION_TOKEN=mysession; Secure',
              'other=val',
            ],
          },
        };
        mockTDGInstance.transfer.mockResolvedValue(mockResponse);

        await wrapper.transfer({});

        expect(wrapper.getSessionCookie()).toBe('SESSION_TOKEN=mysession');
      });

      it('should not crash if no headers', async () => {
        const mockResponse = { data: {} };
        mockTDGInstance.createOrder.mockResolvedValue(mockResponse);

        await wrapper.createOrder({});

        expect(wrapper.getSessionCookie()).toBeUndefined();
      });

      it('should not crash if no Set-Cookie header', async () => {
        const mockResponse = {
          data: {},
          headers: { 'content-type': 'application/json' },
        };
        mockTDGInstance.createOrder.mockResolvedValue(mockResponse);

        await wrapper.createOrder({});

        expect(wrapper.getSessionCookie()).toBeUndefined();
      });
    });

    describe('getSessionCookie', () => {
      it('should return undefined initially', () => {
        expect(wrapper.getSessionCookie()).toBeUndefined();
      });

      it('should return cookie after extraction', async () => {
        const mockResponse = {
          headers: { 'set-cookie': ['session=test123'] },
        };
        mockTDGInstance.createOrder.mockResolvedValue(mockResponse);

        await wrapper.createOrder({});

        expect(wrapper.getSessionCookie()).toBe('session=test123');
      });
    });

    describe('setSessionCookie', () => {
      it('should set cookie manually', () => {
        wrapper.setSessionCookie('manual=cookie123');
        expect(wrapper.getSessionCookie()).toBe('manual=cookie123');
      });
    });

    describe('hasSession', () => {
      it('should return false initially', () => {
        expect(wrapper.hasSession()).toBe(false);
      });

      it('should return true after setting cookie', () => {
        wrapper.setSessionCookie('session=abc');
        expect(wrapper.hasSession()).toBe(true);
      });
    });

    describe('clearSession', () => {
      it('should clear session cookie', () => {
        wrapper.setSessionCookie('session=test');
        expect(wrapper.hasSession()).toBe(true);

        wrapper.clearSession();

        expect(wrapper.hasSession()).toBe(false);
        expect(wrapper.getSessionCookie()).toBeUndefined();
      });
    });
  });

  describe('Transfer Methods', () => {
    describe('transfer', () => {
      it('should call TDG.transfer and extract session', async () => {
        const mockResponse = {
          data: {},
          headers: { 'set-cookie': ['session=transfer123'] },
        };
        mockTDGInstance.transfer.mockResolvedValue(mockResponse);

        const result = await wrapper.transfer({ amount: '100' });

        expect(mockTDGInstance.transfer).toHaveBeenCalledWith({ amount: '100' }, undefined);
        expect(wrapper.getSessionCookie()).toBe('session=transfer123');
      });
    });

    describe('withdrawal', () => {
      it('should call TDG.withdrawal', async () => {
        const mockResponse = { data: {} };
        mockTDGInstance.withdrawal.mockResolvedValue(mockResponse);

        const result = await wrapper.withdrawal({ amount: '50' });

        expect(mockTDGInstance.withdrawal).toHaveBeenCalledWith({ amount: '50' }, undefined);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Leverage Methods', () => {
    describe('setInitialLeverage', () => {
      it('should call TDG.setInitialLeverage and extract session', async () => {
        const mockResponse = {
          data: {},
          headers: { 'set-cookie': ['session=leverage123'] },
        };
        mockTDGInstance.setInitialLeverage.mockResolvedValue(mockResponse);

        const params = { instrument: 'BTC-PERP', leverage: '10' };
        const result = await wrapper.setInitialLeverage(params);

        expect(mockTDGInstance.setInitialLeverage).toHaveBeenCalledWith(params, undefined);
        expect(wrapper.getSessionCookie()).toBe('session=leverage123');
      });
    });

    describe('getMarginTiers', () => {
      it('should call TDG.getMarginTiers', async () => {
        const mockResponse = { result: [] };
        mockTDGInstance.getMarginTiers.mockResolvedValue(mockResponse);

        const result = await wrapper.getMarginTiers();

        expect(mockTDGInstance.getMarginTiers).toHaveBeenCalledWith(undefined);
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
