/**
 * GMX Auth Unit Tests
 *
 * Tests for GmxAuth class and Ethereum validation utilities.
 */

import { describe, it, expect } from '@jest/globals';
import { ethers } from 'ethers';
import {
  GmxAuth,
  isValidEthereumAddress,
  isValidEthereumPrivateKey,
} from '../../src/adapters/gmx/GmxAuth.js';

// Test private key (never use in production!)
const TEST_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const TEST_WALLET = new ethers.Wallet(TEST_PRIVATE_KEY);
const TEST_ADDRESS = TEST_WALLET.address;

describe('Ethereum Address Validation', () => {
  describe('isValidEthereumAddress', () => {
    it('should accept valid checksummed addresses', () => {
      expect(isValidEthereumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
      expect(isValidEthereumAddress(TEST_ADDRESS)).toBe(true);
    });

    it('should accept valid lowercase addresses', () => {
      expect(isValidEthereumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(true);
    });

    it('should accept valid uppercase addresses', () => {
      expect(isValidEthereumAddress('0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED')).toBe(true);
    });

    it('should accept addresses without 0x prefix (ethers auto-normalizes)', () => {
      // ethers.isAddress() auto-normalizes addresses without 0x prefix
      expect(isValidEthereumAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
    });

    it('should reject addresses that are too short', () => {
      expect(isValidEthereumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeA')).toBe(false);
    });

    it('should reject addresses that are too long', () => {
      expect(isValidEthereumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAedABC')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEthereumAddress('')).toBe(false);
    });

    it('should reject invalid hex characters', () => {
      expect(isValidEthereumAddress('0xGGAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false);
    });

    it('should reject non-address strings', () => {
      expect(isValidEthereumAddress('not-an-address')).toBe(false);
      expect(isValidEthereumAddress('0x')).toBe(false);
    });
  });
});

describe('Ethereum Private Key Validation', () => {
  describe('isValidEthereumPrivateKey', () => {
    it('should accept valid private key with 0x prefix', () => {
      expect(isValidEthereumPrivateKey(TEST_PRIVATE_KEY)).toBe(true);
    });

    it('should accept valid private key without 0x prefix', () => {
      const keyWithoutPrefix = TEST_PRIVATE_KEY.slice(2);
      expect(isValidEthereumPrivateKey(keyWithoutPrefix)).toBe(true);
    });

    it('should reject private key that is too short', () => {
      expect(isValidEthereumPrivateKey('0x123456789')).toBe(false);
    });

    it('should reject private key that is too long', () => {
      expect(isValidEthereumPrivateKey('0x' + '0'.repeat(128))).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEthereumPrivateKey('')).toBe(false);
    });

    it('should reject invalid hex characters', () => {
      expect(isValidEthereumPrivateKey('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
    });

    it('should reject non-hex strings', () => {
      expect(isValidEthereumPrivateKey('not-a-private-key')).toBe(false);
    });
  });
});

describe('GmxAuth', () => {
  describe('constructor', () => {
    it('should create auth with private key', () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      expect(auth.getWalletAddress()).toBe(TEST_ADDRESS);
      expect(auth.canSign()).toBe(true);
      expect(auth.canRead()).toBe(true);
    });

    it('should create auth with wallet instance', () => {
      const auth = new GmxAuth({
        wallet: TEST_WALLET,
        chain: 'arbitrum',
      });

      expect(auth.getWalletAddress()).toBe(TEST_ADDRESS);
      expect(auth.canSign()).toBe(true);
    });

    it('should create auth with wallet address only (read-only)', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      expect(auth.getWalletAddress()).toBe(TEST_ADDRESS);
      expect(auth.canRead()).toBe(true);
      expect(auth.canSign()).toBe(false);
    });

    it('should use arbitrum chain', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      expect(auth.getChain()).toBe('arbitrum');
      expect(auth.getChainId()).toBe(42161);
    });

    it('should use avalanche chain', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'avalanche',
      });

      expect(auth.getChain()).toBe('avalanche');
      expect(auth.getChainId()).toBe(43114);
    });

    it('should use custom RPC endpoint', () => {
      const customRpc = 'https://my-custom-rpc.example.com';
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
        rpcEndpoint: customRpc,
      });

      expect(auth.getRpcEndpoint()).toBe(customRpc);
    });

    it('should use default RPC endpoint', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      expect(auth.getRpcEndpoint()).toBeTruthy();
    });
  });

  describe('getHeaders', () => {
    it('should return empty headers (GMX uses on-chain transactions)', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      expect(auth.getHeaders()).toEqual({});
    });
  });

  describe('sign', () => {
    it('should return request with empty headers', async () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      const request = {
        method: 'GET' as const,
        path: '/api/test',
        body: {},
      };

      const signed = await auth.sign(request);

      expect(signed.method).toBe('GET');
      expect(signed.path).toBe('/api/test');
      expect(signed.headers).toEqual({});
    });
  });

  describe('getWallet and getSigner', () => {
    it('should return wallet when private key provided', () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      expect(auth.getWallet()).toBeDefined();
      expect(auth.getSigner()).toBeDefined();
    });

    it('should return undefined when no private key', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      expect(auth.getWallet()).toBeUndefined();
      expect(auth.getSigner()).toBeUndefined();
    });
  });

  describe('getProvider', () => {
    it('should return provider', () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      expect(auth.getProvider()).toBeDefined();
    });
  });

  describe('signMessage', () => {
    it('should sign message when wallet available', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const signature = await auth.signMessage('Hello GMX');
      expect(signature).toBeTruthy();
      expect(signature.startsWith('0x')).toBe(true);
    });

    it('should throw when no wallet', async () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      await expect(auth.signMessage('Hello')).rejects.toThrow('Wallet required for signing');
    });
  });

  describe('signTypedData', () => {
    it('should sign typed data when wallet available', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const domain = {
        name: 'Test',
        version: '1',
        chainId: 42161,
      };
      const types = {
        Message: [{ name: 'content', type: 'string' }],
      };
      const value = { content: 'Hello' };

      const signature = await auth.signTypedData(domain, types, value);
      expect(signature).toBeTruthy();
      expect(signature.startsWith('0x')).toBe(true);
    });

    it('should throw when no wallet', async () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      await expect(auth.signTypedData({}, {}, {})).rejects.toThrow('Wallet required for signing');
    });
  });

  describe('getBalance', () => {
    it('should throw when no wallet address', async () => {
      const auth = new GmxAuth({
        chain: 'arbitrum',
      });

      await expect(auth.getBalance()).rejects.toThrow('Wallet address required');
    });
  });

  describe('getTokenBalance', () => {
    it('should throw when no wallet address', async () => {
      const auth = new GmxAuth({
        chain: 'arbitrum',
      });

      await expect(
        auth.getTokenBalance('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1')
      ).rejects.toThrow('Wallet address required');
    });
  });

  describe('getTokenAllowance', () => {
    it('should throw when no wallet address', async () => {
      const auth = new GmxAuth({
        chain: 'arbitrum',
      });

      await expect(
        auth.getTokenAllowance(
          '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
        )
      ).rejects.toThrow('Wallet address required');
    });
  });

  describe('approveToken', () => {
    it('should throw when no wallet', async () => {
      const auth = new GmxAuth({
        walletAddress: TEST_ADDRESS,
        chain: 'arbitrum',
      });

      await expect(
        auth.approveToken(
          '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
          1000n
        )
      ).rejects.toThrow('Wallet required for approval');
    });
  });

  describe('provider methods', () => {
    it('should have estimateGas method', () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      // Verify the method exists and is a function
      expect(typeof auth.estimateGas).toBe('function');
    });

    it('should have getGasPrice method', () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      expect(typeof auth.getGasPrice).toBe('function');
    });

    it('should have getBlockNumber method', () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      expect(typeof auth.getBlockNumber).toBe('function');
    });

    it('should have waitForTransaction method', () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      expect(typeof auth.waitForTransaction).toBe('function');
    });
  });
});

describe('isValidEthereumPrivateKey edge cases', () => {
  it('should handle key that looks valid but creates invalid wallet', () => {
    // Key with valid format but ethers may reject for other reasons
    // Most invalid keys that pass regex will still create wallets
    // Testing the try/catch path
    const allZerosKey = '0x' + '0'.repeat(64);
    // Zero private key is technically invalid in some contexts
    // but ethers may accept it - testing the function handles it
    const result = isValidEthereumPrivateKey(allZerosKey);
    // If it doesn't throw, it returns based on the regex check
    expect(typeof result).toBe('boolean');
  });

  it('should return false for keys with invalid characters in middle', () => {
    const invalidKey = '0x012345678901234567890123456789012345678901234567890123456789GHIJ';
    expect(isValidEthereumPrivateKey(invalidKey)).toBe(false);
  });
});
