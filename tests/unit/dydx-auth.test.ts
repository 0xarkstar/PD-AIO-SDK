/**
 * dYdX v4 Auth Unit Tests
 */

import { DydxAuth, type DydxAuthConfig } from '../../src/adapters/dydx/DydxAuth.js';

describe('DydxAuth', () => {
  // Test mnemonic (DO NOT USE IN PRODUCTION - this is a test mnemonic)
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  describe('constructor', () => {
    test('creates auth instance with mnemonic', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      expect(auth).toBeInstanceOf(DydxAuth);
      expect(auth.hasMnemonic()).toBe(true);
    });

    test('creates auth instance with private key', () => {
      const auth = new DydxAuth({
        privateKey: '0x' + '1'.repeat(64),
      });

      expect(auth).toBeInstanceOf(DydxAuth);
      expect(auth.hasMnemonic()).toBe(false);
    });

    test('throws error when neither mnemonic nor private key provided', () => {
      expect(() => new DydxAuth({})).toThrow('Either mnemonic or privateKey must be provided');
    });

    test('accepts custom subaccount number', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
        subaccountNumber: 5,
      });

      expect(auth.getSubaccountNumber()).toBe(5);
    });

    test('defaults to subaccount 0', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      expect(auth.getSubaccountNumber()).toBe(0);
    });

    test('accepts testnet flag', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
        testnet: true,
      });

      expect(auth.isTestnet()).toBe(true);
    });

    test('defaults to mainnet', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      expect(auth.isTestnet()).toBe(false);
    });
  });

  describe('getAddress', () => {
    test('derives address from mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const address = await auth.getAddress();

      expect(address).toBeDefined();
      expect(address.startsWith('dydx')).toBe(true);
    });

    test('derives address from private key', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      const address = await auth.getAddress();

      expect(address).toBeDefined();
      expect(address.startsWith('dydx')).toBe(true);
    });

    test('caches derived address', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const address1 = await auth.getAddress();
      const address2 = await auth.getAddress();

      expect(address1).toBe(address2);
    });
  });

  describe('getSubaccountId', () => {
    test('returns correct subaccount ID format', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
        subaccountNumber: 3,
      });

      const subaccountId = await auth.getSubaccountId();
      const address = await auth.getAddress();

      expect(subaccountId).toBe(`${address}/3`);
    });
  });

  describe('verify', () => {
    test('returns true for valid mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const isValid = await auth.verify();

      expect(isValid).toBe(true);
    });

    test('returns true for valid private key', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      const isValid = await auth.verify();

      expect(isValid).toBe(true);
    });
  });

  describe('sign', () => {
    test('returns request with content-type header', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const signedRequest = await auth.sign({
        method: 'GET',
        path: '/test',
      });

      expect(signedRequest.headers).toBeDefined();
      expect(signedRequest.headers?.['Content-Type']).toBe('application/json');
    });

    test('preserves original request properties', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const signedRequest = await auth.sign({
        method: 'POST',
        path: '/orders',
        body: { test: 'data' },
      });

      expect(signedRequest.method).toBe('POST');
      expect(signedRequest.path).toBe('/orders');
      expect(signedRequest.body).toEqual({ test: 'data' });
    });
  });

  describe('getHeaders', () => {
    test('returns content-type header', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const headers = auth.getHeaders();

      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('refresh', () => {
    test('refresh is a no-op for dYdX', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      // Should not throw
      await expect(auth.refresh()).resolves.toBeUndefined();
    });
  });

  describe('getMnemonic', () => {
    test('returns mnemonic when available', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      expect(auth.getMnemonic()).toBe(testMnemonic);
    });

    test('returns undefined when using private key', () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      expect(auth.getMnemonic()).toBeUndefined();
    });
  });

  describe('hasMnemonic', () => {
    test('returns true when mnemonic is provided', () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      expect(auth.hasMnemonic()).toBe(true);
    });

    test('returns false when only private key is provided', () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      expect(auth.hasMnemonic()).toBe(false);
    });
  });

  describe('mnemonic validation', () => {
    test('throws on invalid mnemonic word count', async () => {
      const auth = new DydxAuth({
        mnemonic: 'word1 word2 word3', // Only 3 words
      });

      await expect(auth.getAddress()).rejects.toThrow('Invalid mnemonic');
    });

    test('accepts 12-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic, // 12 words
      });

      const address = await auth.getAddress();
      expect(address).toBeDefined();
    });

    test('accepts 24-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic + ' ' + testMnemonic, // 24 words
      });

      const address = await auth.getAddress();
      expect(address).toBeDefined();
    });
  });

  describe('private key validation', () => {
    test('accepts private key with 0x prefix', async () => {
      const auth = new DydxAuth({
        privateKey: '0x' + '1'.repeat(64),
      });

      const address = await auth.getAddress();
      expect(address).toBeDefined();
    });

    test('accepts private key without 0x prefix', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      const address = await auth.getAddress();
      expect(address).toBeDefined();
    });

    test('throws on invalid private key length', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(32), // Too short
      });

      await expect(auth.getAddress()).rejects.toThrow('Invalid private key');
    });
  });
});
