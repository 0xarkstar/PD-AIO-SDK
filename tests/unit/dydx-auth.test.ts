/**
 * dYdX v4 Auth Unit Tests
 */

import { DydxAuth, type DydxAuthConfig } from '../../src/adapters/dydx/DydxAuth.js';
import { NotSupportedError, InvalidParameterError } from '../../src/types/errors.js';

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
    // Address derivation is unsupported until Cosmos SDK libraries are integrated.
    // Valid credentials pass validation but then hit NotSupportedError.
    test('throws NotSupportedError for valid mnemonic (Cosmos SDK not integrated)', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });

    test('throws NotSupportedError for valid private key (Cosmos SDK not integrated)', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });

    test('throws NotSupportedError on repeated calls (no caching of unsupported result)', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      // Both calls should consistently throw NotSupportedError
      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });
  });

  describe('getSubaccountId', () => {
    test('throws NotSupportedError (depends on getAddress which is unsupported)', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
        subaccountNumber: 3,
      });

      await expect(auth.getSubaccountId()).rejects.toThrow(NotSupportedError);
    });
  });

  describe('verify', () => {
    test('returns false for valid mnemonic (NotSupportedError is caught)', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      // verify() catches all errors and returns false
      const isValid = await auth.verify();
      expect(isValid).toBe(false);
    });

    test('returns false for valid private key (NotSupportedError is caught)', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      const isValid = await auth.verify();
      expect(isValid).toBe(false);
    });
  });

  describe('sign', () => {
    test('throws NotSupportedError (sign calls initialize which requires address derivation)', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      // sign() calls initialize() which throws NotSupportedError for valid credentials
      await expect(
        auth.sign({ method: 'GET', path: '/test' })
      ).rejects.toThrow(NotSupportedError);
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
    test('throws InvalidParameterError on invalid mnemonic word count', async () => {
      const auth = new DydxAuth({
        mnemonic: 'word1 word2 word3', // Only 3 words
      });

      // Validation runs before NotSupportedError — bad word count yields InvalidParameterError
      await expect(auth.getAddress()).rejects.toThrow(InvalidParameterError);
      await expect(auth.getAddress()).rejects.toThrow('Invalid mnemonic');
    });

    test('throws NotSupportedError (not InvalidParameterError) for valid 12-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic, // 12 words — passes validation
      });

      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });

    test('throws NotSupportedError (not InvalidParameterError) for valid 24-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic + ' ' + testMnemonic, // 24 words — passes validation
      });

      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });
  });

  describe('private key validation', () => {
    test('throws NotSupportedError for valid key with 0x prefix (passes validation)', async () => {
      const auth = new DydxAuth({
        privateKey: '0x' + '1'.repeat(64),
      });

      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });

    test('throws NotSupportedError for valid key without 0x prefix (passes validation)', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      await expect(auth.getAddress()).rejects.toThrow(NotSupportedError);
    });

    test('throws InvalidParameterError on invalid private key length', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(32), // Too short
      });

      // Validation runs before NotSupportedError — bad length yields InvalidParameterError
      await expect(auth.getAddress()).rejects.toThrow(InvalidParameterError);
      await expect(auth.getAddress()).rejects.toThrow('Invalid private key');
    });
  });
});
