/**
 * Jupiter Auth Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  JupiterAuth,
  isValidSolanaAddress,
  isValidSolanaPrivateKey,
} from '../../src/adapters/jupiter/JupiterAuth.js';

describe('JupiterAuth', () => {
  describe('constructor', () => {
    test('creates instance with wallet address only', () => {
      const auth = new JupiterAuth({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      expect(auth.canRead()).toBe(true);
      expect(auth.canSign()).toBe(false);
      expect(auth.getWalletAddress()).toBe('7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs');
    });

    test('creates instance without credentials', () => {
      const auth = new JupiterAuth({});

      expect(auth.canRead()).toBe(false);
      expect(auth.canSign()).toBe(false);
      expect(auth.getWalletAddress()).toBeUndefined();
    });

    test('uses default RPC endpoint', () => {
      const auth = new JupiterAuth({});

      expect(auth.getRpcEndpoint()).toBe('https://api.mainnet-beta.solana.com');
    });

    test('uses custom RPC endpoint', () => {
      const auth = new JupiterAuth({
        rpcEndpoint: 'https://my-custom-rpc.com',
      });

      expect(auth.getRpcEndpoint()).toBe('https://my-custom-rpc.com');
    });
  });

  describe('getHeaders', () => {
    test('returns empty headers (Jupiter uses on-chain auth)', async () => {
      const auth = new JupiterAuth({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      const headers = await auth.getHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('signMessage', () => {
    test('throws without private key', async () => {
      const auth = new JupiterAuth({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      await expect(auth.signMessage('test')).rejects.toThrow(
        'Private key required for signing'
      );
    });
  });

  describe('signBytes', () => {
    test('throws without private key', async () => {
      const auth = new JupiterAuth({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      await expect(auth.signBytes(new Uint8Array([1, 2, 3]))).rejects.toThrow(
        'Private key required for signing'
      );
    });
  });

  describe('Solana transaction support', () => {
    test('canSign returns false when keypair initialization fails', async () => {
      // Invalid keypair will fail to initialize but won't throw
      const invalidKeypair = JSON.stringify(Array(64).fill(1));
      const auth = new JupiterAuth({
        privateKey: invalidKeypair,
      });

      // Wait for async initialization to potentially complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // canSign is false because the invalid keypair fails to load
      expect(auth.canSign()).toBe(false);
    });

    test('canSign returns false without private key', () => {
      const auth = new JupiterAuth({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      expect(auth.canSign()).toBe(false);
      expect(auth.canRead()).toBe(true);
    });

    test('wallet address is accessible', () => {
      const auth = new JupiterAuth({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      expect(auth.getWalletAddress()).toBe('7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs');
    });
  });
});

describe('isValidSolanaAddress', () => {
  test('validates correct addresses', () => {
    // Valid base58 addresses
    expect(isValidSolanaAddress('7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs')).toBe(true);
    expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
    expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
  });

  test('rejects invalid addresses', () => {
    // Too short
    expect(isValidSolanaAddress('short')).toBe(false);
    // Contains invalid characters (0, I, O, l)
    expect(isValidSolanaAddress('0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
    expect(isValidSolanaAddress('Ixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
    expect(isValidSolanaAddress('Oxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
    expect(isValidSolanaAddress('lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
    // Empty string
    expect(isValidSolanaAddress('')).toBe(false);
  });
});

describe('isValidSolanaPrivateKey', () => {
  describe('Uint8Array format', () => {
    test('validates 64-byte key', () => {
      const validKey = new Uint8Array(64);
      expect(isValidSolanaPrivateKey(validKey)).toBe(true);
    });

    test('rejects wrong length', () => {
      const shortKey = new Uint8Array(32);
      expect(isValidSolanaPrivateKey(shortKey)).toBe(false);

      const longKey = new Uint8Array(128);
      expect(isValidSolanaPrivateKey(longKey)).toBe(false);
    });
  });

  describe('JSON array format', () => {
    test('validates 64-element array', () => {
      const array = new Array(64).fill(0);
      const key = JSON.stringify(array);
      expect(isValidSolanaPrivateKey(key)).toBe(true);
    });

    test('rejects wrong length array', () => {
      const shortArray = new Array(32).fill(0);
      const key = JSON.stringify(shortArray);
      expect(isValidSolanaPrivateKey(key)).toBe(false);
    });

    test('rejects invalid JSON', () => {
      expect(isValidSolanaPrivateKey('[invalid json')).toBe(false);
    });
  });

  describe('hex format', () => {
    test('validates 128-character hex string', () => {
      const hex = 'a'.repeat(128);
      expect(isValidSolanaPrivateKey(hex)).toBe(true);
    });

    test('validates hex with 0x prefix', () => {
      const hex = '0x' + 'a'.repeat(128);
      expect(isValidSolanaPrivateKey(hex)).toBe(true);
    });

    test('rejects wrong length hex', () => {
      const shortHex = 'a'.repeat(64);
      expect(isValidSolanaPrivateKey(shortHex)).toBe(false);
    });
  });

  describe('base58 format', () => {
    test('validates base58 key (87-88 chars)', () => {
      // Valid base58 characters only (no 0, I, O, l)
      const key = '5'.repeat(87);
      expect(isValidSolanaPrivateKey(key)).toBe(true);
    });
  });

  describe('invalid formats', () => {
    test('rejects empty string', () => {
      expect(isValidSolanaPrivateKey('')).toBe(false);
    });

    test('rejects random string', () => {
      expect(isValidSolanaPrivateKey('not a valid key')).toBe(false);
    });
  });
});
