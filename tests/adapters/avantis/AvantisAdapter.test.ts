/**
 * Avantis Adapter Unit Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock contract getFunction calls
const mockGetFunction = jest.fn();
const mockContractInstance = {
  getFunction: mockGetFunction,
};

jest.mock('ethers', () => {
  const addr = '0xTestWalletAddress';
  const MockJsonRpcProvider = jest.fn(() => ({
    getTransactionCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
  }));
  const MockWallet = jest.fn(() => ({
    address: addr,
  }));
  const MockContract = jest.fn(() => ({
    getFunction: jest.fn(),
  }));

  return {
    Wallet: MockWallet,
    JsonRpcProvider: MockJsonRpcProvider,
    Contract: MockContract,
    ethers: {
      Wallet: MockWallet,
      JsonRpcProvider: MockJsonRpcProvider,
      Contract: MockContract,
    },
  };
});

import { AvantisAdapter } from '../../../src/adapters/avantis/AvantisAdapter.js';
import { NotSupportedError, PerpDEXError } from '../../../src/types/errors.js';
import { ethers } from 'ethers';

describe('AvantisAdapter', () => {
  describe('Constructor & Identity', () => {
    test('should create adapter with default config', () => {
      const adapter = new AvantisAdapter();
      expect(adapter.id).toBe('avantis');
      expect(adapter.name).toBe('Avantis');
    });

    test('should create adapter with testnet config', () => {
      const adapter = new AvantisAdapter({ testnet: true });
      expect(adapter.id).toBe('avantis');
    });

    test('should create adapter with custom RPC URL', () => {
      const adapter = new AvantisAdapter({ rpcUrl: 'https://custom-rpc.example.com' });
      expect(adapter.id).toBe('avantis');
    });

    test('should create adapter with privateKey for auth', () => {
      const adapter = new AvantisAdapter({
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      expect(adapter.id).toBe('avantis');
    });
  });

  describe('Feature Map', () => {
    let adapter: AvantisAdapter;

    beforeEach(() => {
      adapter = new AvantisAdapter();
    });

    test('should support fetchMarkets', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
    });

    test('should support fetchTicker', () => {
      expect(adapter.has.fetchTicker).toBe(true);
    });

    test('should support fetchFundingRate', () => {
      expect(adapter.has.fetchFundingRate).toBe(true);
    });

    test('should NOT support fetchOrderBook (oracle-based)', () => {
      expect(adapter.has.fetchOrderBook).toBe(false);
    });

    test('should NOT support fetchTrades', () => {
      expect(adapter.has.fetchTrades).toBe(false);
    });

    test('should NOT support fetchOHLCV', () => {
      expect(adapter.has.fetchOHLCV).toBe(false);
    });

    test('should support createOrder', () => {
      expect(adapter.has.createOrder).toBe(true);
    });

    test('should support cancelOrder', () => {
      expect(adapter.has.cancelOrder).toBe(true);
    });

    test('should support fetchPositions', () => {
      expect(adapter.has.fetchPositions).toBe(true);
    });

    test('should support fetchBalance', () => {
      expect(adapter.has.fetchBalance).toBe(true);
    });

    test('should NOT support setLeverage', () => {
      expect(adapter.has.setLeverage).toBe(false);
    });
  });

  describe('Not Supported Operations', () => {
    let adapter: AvantisAdapter;

    beforeEach(() => {
      adapter = new AvantisAdapter();
    });

    test('_fetchOrderBook should throw NotSupportedError', async () => {
      await expect(adapter._fetchOrderBook('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('_fetchTrades should throw NotSupportedError', async () => {
      await expect(adapter._fetchTrades('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('fetchOHLCV should throw NotSupportedError', async () => {
      await expect(adapter.fetchOHLCV('BTC/USD:USD', '1h')).rejects.toThrow(NotSupportedError);
    });

    test('fetchFundingRateHistory should throw NotSupportedError', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('cancelAllOrders should throw NotSupportedError', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow(NotSupportedError);
    });

    test('fetchOpenOrders should throw NotSupportedError', async () => {
      await expect(adapter.fetchOpenOrders()).rejects.toThrow(NotSupportedError);
    });

    test('fetchOrderHistory should throw NotSupportedError', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(NotSupportedError);
    });

    test('fetchMyTrades should throw NotSupportedError', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow(NotSupportedError);
    });

    test('_setLeverage should throw NotSupportedError', async () => {
      await expect(adapter._setLeverage('BTC/USD:USD', 10)).rejects.toThrow(NotSupportedError);
    });
  });

  describe('Auth Requirements', () => {
    test('fetchBalance should throw if no privateKey', async () => {
      const adapter = new AvantisAdapter();
      await adapter.initialize();
      await expect(adapter.fetchBalance()).rejects.toThrow('Private key required');
    });

    test('fetchPositions should throw if no privateKey', async () => {
      const adapter = new AvantisAdapter();
      await adapter.initialize();
      await expect(adapter.fetchPositions()).rejects.toThrow('Private key required');
    });

    test('createOrder should throw if no privateKey', async () => {
      const adapter = new AvantisAdapter();
      await adapter.initialize();
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USD:USD',
          type: 'market',
          side: 'buy',
          amount: 100,
        })
      ).rejects.toThrow('Private key required');
    });

    test('cancelOrder should throw if no privateKey', async () => {
      const adapter = new AvantisAdapter();
      await adapter.initialize();
      await expect(adapter.cancelOrder('0-0')).rejects.toThrow('Private key required');
    });
  });

  describe('initialize', () => {
    test('should be idempotent (second call is no-op)', async () => {
      const adapter = new AvantisAdapter();
      await adapter.initialize();
      // Second call should not throw
      await adapter.initialize();
    });

    test('should initialize with auth when privateKey provided', async () => {
      const adapter = new AvantisAdapter({
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      await adapter.initialize();
      // No error means success
    });
  });
});
