/**
 * Avantis Auth Unit Tests
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockAddress = '0xMockWalletAddress1234567890';
const mockGetTransactionCount = jest.fn<() => Promise<number>>().mockResolvedValue(5);

jest.mock('ethers', () => {
  const addr = '0xMockWalletAddress1234567890';
  const mockProvider = {
    getTransactionCount: jest.fn<() => Promise<number>>().mockResolvedValue(5),
  };
  const MockJsonRpcProvider = jest.fn(() => mockProvider);
  const MockWallet = jest.fn(() => ({
    address: addr,
  }));

  return {
    Wallet: MockWallet,
    JsonRpcProvider: MockJsonRpcProvider,
    Contract: jest.fn(),
    ethers: {
      Wallet: MockWallet,
      JsonRpcProvider: MockJsonRpcProvider,
      Contract: jest.fn(),
    },
  };
});

import { AvantisAuth } from '../../../src/adapters/avantis/AvantisAuth.js';

describe('AvantisAuth', () => {
  const testPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const testRpcUrl = 'https://mainnet.base.org';
  let auth: AvantisAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    auth = new AvantisAuth(testPrivateKey, testRpcUrl);
  });

  describe('constructor', () => {
    test('should create auth with privateKey and rpcUrl', () => {
      expect(auth).toBeDefined();
    });
  });

  describe('getWallet', () => {
    test('should return wallet instance', () => {
      const wallet = auth.getWallet();
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
    });
  });

  describe('getProvider', () => {
    test('should return provider instance', () => {
      const provider = auth.getProvider();
      expect(provider).toBeDefined();
    });
  });

  describe('getAddress', () => {
    test('should return wallet address', () => {
      const address = auth.getAddress();
      expect(address).toBe(mockAddress);
    });
  });

  describe('sign', () => {
    test('should return request with empty headers (no-op for on-chain)', async () => {
      const request = { method: 'GET' as const, path: '/test' };
      const result = await auth.sign(request);
      expect(result).toEqual({
        ...request,
        headers: {},
      });
    });
  });

  describe('getHeaders', () => {
    test('should return empty headers', () => {
      expect(auth.getHeaders()).toEqual({});
    });
  });

  describe('getNonce', () => {
    test('should return nonce from provider', async () => {
      const nonce = await auth.getNonce();
      expect(nonce).toBe(5);
    });
  });
});
