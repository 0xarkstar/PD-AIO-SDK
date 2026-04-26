/**
 * dYdX v4 Auth Unit Tests
 */

import { DydxAuth, type DydxAuthConfig } from '../../src/adapters/dydx/DydxAuth.js';
import { InvalidParameterError } from '../../src/types/errors.js';

describe('DydxAuth', () => {
  // Standard BIP39 12-word "abandon ... about" test mnemonic (DO NOT USE IN PRODUCTION)
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  // Standard BIP39 24-word "abandon ... art" test mnemonic (DO NOT USE IN PRODUCTION)
  const testMnemonic24 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

  // Expected dYdX bech32 addresses derived via BIP39 → SLIP-10 (m/44'/118'/0'/0/0)
  // → secp256k1 → bech32("dydx") for the test inputs above. Pinned via
  // scripts/_derive-dydx-test-vectors.ts at @cosmjs 0.38.x.
  const expectedAddress12 = 'dydx19rl4cm2hmr8afy4kldpxz3fka4jguq0a4erelz';
  const expectedAddress24 = 'dydx1r5v5srda7xfth3hn2s26txvrcrntldjujjflhg';
  const expectedAddressPrivkey1 = 'dydx1l3e9pgs3mmwuwrh95fecme0s0qtn2880qnulfw';

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
    test('derives correct address for 12-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      await expect(auth.getAddress()).resolves.toBe(expectedAddress12);
    });

    test('derives correct address for valid private key', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      await expect(auth.getAddress()).resolves.toBe(expectedAddressPrivkey1);
    });

    test('caches derived address across repeated calls', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const a = await auth.getAddress();
      const b = await auth.getAddress();
      expect(a).toBe(expectedAddress12);
      expect(b).toBe(expectedAddress12);
    });
  });

  describe('getSubaccountId', () => {
    test('returns address/subaccountNumber for valid mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
        subaccountNumber: 3,
      });

      await expect(auth.getSubaccountId()).resolves.toBe(`${expectedAddress12}/3`);
    });
  });

  describe('verify', () => {
    test('returns true for valid mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      await expect(auth.verify()).resolves.toBe(true);
    });

    test('returns true for valid private key', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      await expect(auth.verify()).resolves.toBe(true);
    });

    test('returns false for malformed mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: 'word1 word2 word3',
      });

      await expect(auth.verify()).resolves.toBe(false);
    });
  });

  describe('sign', () => {
    test('signs request with content-type header for valid mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      const signed = await auth.sign({ method: 'GET', path: '/test' });
      expect(signed.headers['Content-Type']).toBe('application/json');
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

      await expect(auth.getAddress()).rejects.toThrow(InvalidParameterError);
      await expect(auth.getAddress()).rejects.toThrow('Invalid mnemonic');
    });

    test('derives address for valid 12-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic,
      });

      await expect(auth.getAddress()).resolves.toBe(expectedAddress12);
    });

    test('derives address for valid 24-word mnemonic', async () => {
      const auth = new DydxAuth({
        mnemonic: testMnemonic24,
      });

      await expect(auth.getAddress()).resolves.toBe(expectedAddress24);
    });

    test('throws InvalidParameterError for 12-word mnemonic with bad BIP39 checksum', async () => {
      // Constructed by repeating "abandon" 11 times + "abandon" — checksum is wrong
      // because the standard 12-word vector ends in "about" (which encodes the checksum).
      const badChecksum = 'abandon '.repeat(12).trim();
      const auth = new DydxAuth({
        mnemonic: badChecksum,
      });

      // Word count passes, but @cosmjs/crypto rejects the checksum and we wrap it.
      await expect(auth.getAddress()).rejects.toThrow(InvalidParameterError);
      await expect(auth.getAddress()).rejects.toThrow('Failed to derive dYdX address from mnemonic');
    });
  });

  describe('private key validation', () => {
    test('derives address for valid key with 0x prefix', async () => {
      const auth = new DydxAuth({
        privateKey: '0x' + '1'.repeat(64),
      });

      await expect(auth.getAddress()).resolves.toBe(expectedAddressPrivkey1);
    });

    test('derives address for valid key without 0x prefix', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(64),
      });

      await expect(auth.getAddress()).resolves.toBe(expectedAddressPrivkey1);
    });

    test('throws InvalidParameterError on invalid private key length', async () => {
      const auth = new DydxAuth({
        privateKey: '1'.repeat(32), // Too short
      });

      // Validation runs first — bad length yields InvalidParameterError before derivation
      await expect(auth.getAddress()).rejects.toThrow(InvalidParameterError);
      await expect(auth.getAddress()).rejects.toThrow('Invalid private key');
    });
  });
});
