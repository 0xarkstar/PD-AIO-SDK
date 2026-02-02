/**
 * Drift Protocol Authentication Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  DriftAuth,
  isValidSolanaAddress,
  isValidSolanaPrivateKey,
} from '../../src/adapters/drift/DriftAuth.js';

describe('Drift Auth', () => {
  describe('DriftAuth class', () => {
    test('should create instance with wallet address (read-only mode)', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      expect(auth.getWalletAddress()).toBe('DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK');
      expect(auth.canRead()).toBe(true);
      expect(auth.canSign()).toBe(false);
    });

    test('should throw when signing in read-only mode', async () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      await expect(auth.signMessage('test')).rejects.toThrow();
    });

    test('should get default subaccount ID of 0', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      expect(auth.getSubAccountId()).toBe(0);
    });

    test('should get empty headers (Drift uses on-chain auth)', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      const headers = auth.getHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('isValidSolanaAddress', () => {
    test('should accept valid Solana addresses', () => {
      // Standard base58 public keys
      expect(isValidSolanaAddress('DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK')).toBe(true);
      expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true); // System program
      expect(isValidSolanaAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(true); // Token program
      expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true); // Wrapped SOL
    });

    test('should reject invalid Solana addresses', () => {
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('short')).toBe(false);
      expect(isValidSolanaAddress('0x1234567890abcdef')).toBe(false); // Ethereum format
      expect(isValidSolanaAddress('a'.repeat(100))).toBe(false); // Too long
    });

    test('should reject addresses with invalid base58 characters', () => {
      // 0, O, I, l are not valid base58 characters
      expect(isValidSolanaAddress('0Yw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSK0')).toBe(false);
      expect(isValidSolanaAddress('OYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK')).toBe(false);
      expect(isValidSolanaAddress('IYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK')).toBe(false);
      expect(isValidSolanaAddress('lYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK')).toBe(false);
    });
  });

  describe('isValidSolanaPrivateKey', () => {
    test('should accept valid private key formats', () => {
      // 64-byte Uint8Array
      const uint8Array = new Uint8Array(64);
      expect(isValidSolanaPrivateKey(uint8Array)).toBe(true);

      // JSON array format
      const jsonArray = JSON.stringify(Array(64).fill(0));
      expect(isValidSolanaPrivateKey(jsonArray)).toBe(true);

      // 128-char hex format
      const hex64 = '0'.repeat(128);
      expect(isValidSolanaPrivateKey(hex64)).toBe(true);

      // Base58 format (87-88 chars)
      const validBase58 = '5'.repeat(87);
      expect(isValidSolanaPrivateKey(validBase58)).toBe(true);
    });

    test('should reject invalid private key formats', () => {
      expect(isValidSolanaPrivateKey('')).toBe(false);
      expect(isValidSolanaPrivateKey('short')).toBe(false);
      expect(isValidSolanaPrivateKey('0x1234567890abcdef')).toBe(false); // Ethereum format

      // Wrong length Uint8Array
      expect(isValidSolanaPrivateKey(new Uint8Array(32))).toBe(false);

      // Invalid JSON array length
      expect(isValidSolanaPrivateKey(JSON.stringify(Array(32).fill(0)))).toBe(false);
    });
  });

  describe('Auth configuration', () => {
    test('should accept empty config (no wallet, no key)', () => {
      const auth = new DriftAuth({});
      expect(auth.getWalletAddress()).toBeUndefined();
      expect(auth.canSign()).toBe(false);
      expect(auth.canRead()).toBe(false);
    });

    test('should support custom subaccount', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        subAccountId: 1,
      });

      expect(auth.getSubAccountId()).toBe(1);
    });

    test('should support custom RPC endpoint', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        rpcEndpoint: 'https://my-custom-rpc.com',
      });

      expect(auth.getRpcEndpoint()).toBe('https://my-custom-rpc.com');
    });

    test('should have default RPC endpoint', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      expect(auth.getRpcEndpoint()).toContain('mainnet-beta');
    });
  });

  describe('User account info', () => {
    test('should return user account info when wallet is set', () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        subAccountId: 2,
      });

      const info = auth.getUserAccountInfo();
      expect(info).toEqual({
        authority: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        subAccountId: 2,
      });
    });

    test('should return undefined when no wallet', () => {
      const auth = new DriftAuth({});
      expect(auth.getUserAccountInfo()).toBeUndefined();
    });
  });

  describe('Sign method', () => {
    test('should sign request (returns empty headers for Drift)', async () => {
      const auth = new DriftAuth({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      const result = await auth.sign({
        method: 'GET',
        url: 'https://example.com',
      });

      expect(result.headers).toEqual({});
    });
  });
});
