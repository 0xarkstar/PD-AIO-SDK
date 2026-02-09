/**
 * Backpack Auth Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { BackpackAuth } from '../../src/adapters/backpack/BackpackAuth.js';

// Test API key
const TEST_API_KEY = 'test-api-key';
// Test private key in hex format (32 bytes = 64 hex chars)
const TEST_HEX_SECRET = 'a'.repeat(64);
// Test private key in hex format with 0x prefix
const TEST_HEX_0X_SECRET = '0x' + 'b'.repeat(64);
// Test private key in base64 format (32 bytes encoded)
const TEST_BASE64_SECRET = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

describe('BackpackAuth', () => {
  describe('constructor', () => {
    it('should create instance with API key and secret', () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      expect(auth.getApiKey()).toBe(TEST_API_KEY);
      expect(auth.hasCredentials()).toBe(true);
    });
  });

  describe('getHeaders', () => {
    it('should return Content-Type and API key headers', () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const headers = auth.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-API-KEY']).toBe(TEST_API_KEY);
    });
  });

  describe('hasCredentials', () => {
    it('should return true when both apiKey and apiSecret are present', () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      expect(auth.hasCredentials()).toBe(true);
    });

    it('should return false when apiKey is empty', () => {
      const auth = new BackpackAuth({
        apiKey: '',
        apiSecret: TEST_HEX_SECRET,
      });

      expect(auth.hasCredentials()).toBe(false);
    });

    it('should return false when apiSecret is empty', () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: '',
      });

      expect(auth.hasCredentials()).toBe(false);
    });
  });

  describe('signRequest', () => {
    it('should sign request with hex format secret (no 0x prefix)', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const signature = await auth.signRequest('balanceQuery', '1700000000000');

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      // Base64 signature should not be empty
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should sign request with hex format secret (with 0x prefix)', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_0X_SECRET,
      });

      const signature = await auth.signRequest('orderExecute', '1700000000000', { symbol: 'BTC' });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should sign request with base64 format secret', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_BASE64_SECRET,
      });

      const signature = await auth.signRequest('balanceQuery', '1700000000000');

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should generate different signatures for different instructions', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const sig1 = await auth.signRequest('balanceQuery', '1700000000000');
      const sig2 = await auth.signRequest('orderExecute', '1700000000000');

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different timestamps', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const sig1 = await auth.signRequest('balanceQuery', '1700000000000');
      const sig2 = await auth.signRequest('balanceQuery', '1700000001000');

      expect(sig1).not.toBe(sig2);
    });

    it('should include body in signature', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const sigWithoutBody = await auth.signRequest('orderExecute', '1700000000000');
      const sigWithBody = await auth.signRequest('orderExecute', '1700000000000', { symbol: 'BTC' });

      expect(sigWithoutBody).not.toBe(sigWithBody);
    });

    it('should create alphabetically sorted params string', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      // The signature should be deterministic for same inputs
      const sig1 = await auth.signRequest('orderExecute', '1700000000000', { symbol: 'BTC_USDC_PERP', side: 'Bid' });
      const sig2 = await auth.signRequest('orderExecute', '1700000000000', { side: 'Bid', symbol: 'BTC_USDC_PERP' });

      // Same params in different order should produce same signature (sorted alphabetically)
      expect(sig1).toBe(sig2);
    });

    it('should throw PerpDEXError on invalid secret', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: 'invalid-secret-format!@#$',
      });

      await expect(
        auth.signRequest('balanceQuery', '1700000000000')
      ).rejects.toThrow('Failed to sign request');
    });
  });

  describe('sign', () => {
    it('should add signature headers to request including X-Window', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const request = {
        method: 'GET' as const,
        path: '/api/v1/account',
      };

      const signed = await auth.sign(request);

      expect(signed.headers).toBeDefined();
      expect(signed.headers!['X-API-KEY']).toBe(TEST_API_KEY);
      expect(signed.headers!['X-Timestamp']).toBeDefined();
      expect(signed.headers!['X-Window']).toBe('5000');
      expect(signed.headers!['X-Signature']).toBeDefined();
      expect(signed.headers!['Content-Type']).toBe('application/json');
    });

    it('should sign request with body', async () => {
      const auth = new BackpackAuth({
        apiKey: TEST_API_KEY,
        apiSecret: TEST_HEX_SECRET,
      });

      const request = {
        method: 'POST' as const,
        path: '/api/v1/orders',
        body: { symbol: 'BTC-PERP', side: 'buy', size: 0.1 },
      };

      const signed = await auth.sign(request);

      expect(signed.headers!['X-Signature']).toBeDefined();
      expect(signed.headers!['X-Window']).toBe('5000');
      expect(signed.body).toEqual(request.body);
    });
  });

  describe('getApiKey', () => {
    it('should return the API key', () => {
      const auth = new BackpackAuth({
        apiKey: 'my-api-key',
        apiSecret: TEST_HEX_SECRET,
      });

      expect(auth.getApiKey()).toBe('my-api-key');
    });
  });
});
