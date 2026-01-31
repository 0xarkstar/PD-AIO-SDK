/**
 * Lighter Auth Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LighterAuth } from '../../src/adapters/lighter/auth.js';
import type { HTTPClient } from '../../src/core/http/HTTPClient.js';

// Create a mock HTTPClient
function createMockHttpClient(): jest.Mocked<HTTPClient> {
  return {
    get: jest.fn().mockResolvedValue({ code: 0, nonce: '100' }),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    request: jest.fn().mockResolvedValue({}),
  } as unknown as jest.Mocked<HTTPClient>;
}

describe('LighterAuth', () => {
  describe('Configuration', () => {
    it('should detect FFI mode when apiPrivateKey is provided', () => {
      const auth = new LighterAuth({
        apiPrivateKey: '0x1234567890abcdef',
        chainId: 300,
      });

      expect(auth.mode).toBe('ffi');
      expect(auth.isConfigured).toBe(true);
    });

    it('should detect HMAC mode when apiKey and apiSecret are provided', () => {
      const auth = new LighterAuth({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(auth.mode).toBe('hmac');
      expect(auth.isConfigured).toBe(true);
    });

    it('should detect no auth when no credentials provided', () => {
      const auth = new LighterAuth({});

      expect(auth.mode).toBe('none');
      expect(auth.isConfigured).toBe(false);
    });

    it('should prefer FFI mode when both apiPrivateKey and apiKey are provided', () => {
      const auth = new LighterAuth({
        apiPrivateKey: '0x1234567890abcdef',
        chainId: 300,
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(auth.mode).toBe('ffi');
    });

    it('should use default values for apiKeyIndex and accountIndex', () => {
      const auth = new LighterAuth({
        apiPrivateKey: '0x1234567890abcdef',
        chainId: 300,
      });

      expect(auth.apiKeyIndex).toBe(255);
      expect(auth.accountIndex).toBe(0);
    });

    it('should use custom values for apiKeyIndex and accountIndex', () => {
      const auth = new LighterAuth({
        apiPrivateKey: '0x1234567890abcdef',
        chainId: 300,
        apiKeyIndex: 10,
        accountIndex: 5,
      });

      expect(auth.apiKeyIndex).toBe(10);
      expect(auth.accountIndex).toBe(5);
    });
  });

  describe('HMAC Authentication', () => {
    let auth: LighterAuth;

    beforeEach(async () => {
      auth = new LighterAuth({
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      });
      await auth.initialize();
    });

    it('should sign request with HMAC headers', async () => {
      const request = {
        method: 'GET' as const,
        path: '/api/v1/account',
        timestamp: 1700000000000,
      };

      const signedRequest = await auth.sign(request);

      expect(signedRequest.headers).toBeDefined();
      expect(signedRequest.headers!['X-API-KEY']).toBe('test-api-key');
      expect(signedRequest.headers!['X-TIMESTAMP']).toBe('1700000000000');
      expect(signedRequest.headers!['X-SIGNATURE']).toBeDefined();
      expect(signedRequest.headers!['X-SIGNATURE'].length).toBe(64); // SHA256 hex = 64 chars
    });

    it('should include body in signature for POST requests', async () => {
      const request = {
        method: 'POST' as const,
        path: '/api/v1/orders',
        body: { symbol: 'BTC', side: 'buy' },
        timestamp: 1700000000000,
      };

      const signedRequest = await auth.sign(request);

      expect(signedRequest.headers!['X-SIGNATURE']).toBeDefined();
    });

    it('should generate consistent signatures for same input', async () => {
      const request = {
        method: 'GET' as const,
        path: '/api/v1/account',
        timestamp: 1700000000000,
      };

      const signed1 = await auth.sign(request);
      const signed2 = await auth.sign(request);

      expect(signed1.headers!['X-SIGNATURE']).toBe(signed2.headers!['X-SIGNATURE']);
    });

    it('should generate different signatures for different timestamps', async () => {
      const request1 = {
        method: 'GET' as const,
        path: '/api/v1/account',
        timestamp: 1700000000000,
      };
      const request2 = {
        method: 'GET' as const,
        path: '/api/v1/account',
        timestamp: 1700000001000,
      };

      const signed1 = await auth.sign(request1);
      const signed2 = await auth.sign(request2);

      expect(signed1.headers!['X-SIGNATURE']).not.toBe(signed2.headers!['X-SIGNATURE']);
    });

    it('should return API key in getHeaders', () => {
      const headers = auth.getHeaders();

      expect(headers['X-API-KEY']).toBe('test-api-key');
    });
  });

  describe('No Authentication', () => {
    let auth: LighterAuth;

    beforeEach(async () => {
      auth = new LighterAuth({});
      await auth.initialize();
    });

    it('should not add headers when no auth configured', async () => {
      const request = {
        method: 'GET' as const,
        path: '/api/v1/markets',
      };

      const signedRequest = await auth.sign(request);

      expect(signedRequest.headers).toEqual({});
    });

    it('should return empty headers from getHeaders', () => {
      const headers = auth.getHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('FFI Mode (without native library)', () => {
    let auth: LighterAuth;
    let mockHttpClient: jest.Mocked<HTTPClient>;

    beforeEach(async () => {
      mockHttpClient = createMockHttpClient();
      auth = new LighterAuth({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 300,
        httpClient: mockHttpClient,
      });
    });

    it('should initialize without error when native library is missing', async () => {
      // Should not throw, just warn and disable FFI mode
      await expect(auth.initialize()).resolves.not.toThrow();
    });

    it('should have hasFFISigning = false when native library is unavailable', async () => {
      await auth.initialize();
      // Native library won't be available in test environment
      expect(auth.hasFFISigning).toBe(false);
    });

    it('should throw when getting nonce without HTTP client', async () => {
      const authWithoutClient = new LighterAuth({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 300,
      });
      await authWithoutClient.initialize();

      await expect(authWithoutClient.getNextNonce()).rejects.toThrow('Nonce manager not initialized');
    });
  });

  describe('Nonce Management', () => {
    let auth: LighterAuth;
    let mockHttpClient: jest.Mocked<HTTPClient>;

    beforeEach(async () => {
      mockHttpClient = createMockHttpClient();
      auth = new LighterAuth({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 300,
        httpClient: mockHttpClient,
      });
      await auth.initialize();
    });

    it('should get nonce from server', async () => {
      const nonce = await auth.getNextNonce();

      expect(nonce).toBe(BigInt(100));
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/nextNonce?api_key_index=255'
      );
    });

    it('should increment nonce on subsequent calls', async () => {
      const nonce1 = await auth.getNextNonce();
      const nonce2 = await auth.getNextNonce();
      const nonce3 = await auth.getNextNonce();

      expect(nonce1).toBe(BigInt(100));
      expect(nonce2).toBe(BigInt(101));
      expect(nonce3).toBe(BigInt(102));
    });

    it('should reset nonce', async () => {
      await auth.getNextNonce();
      auth.resetNonce();

      // Mock new server response
      (mockHttpClient.get as jest.Mock).mockResolvedValueOnce({
        code: 0,
        nonce: '200'
      });

      const nonce = await auth.getNextNonce();
      expect(nonce).toBe(BigInt(200));
    });

    it('should rollback nonce', async () => {
      await auth.getNextNonce(); // 100
      await auth.getNextNonce(); // 101
      auth.rollbackNonce();

      const nonce = await auth.getNextNonce();
      expect(nonce).toBe(BigInt(101)); // rolled back from 102 to 101
    });
  });

  describe('Refresh', () => {
    it('should not throw when refreshing HMAC auth', async () => {
      const auth = new LighterAuth({
        apiKey: 'test',
        apiSecret: 'secret',
      });
      await auth.initialize();

      await expect(auth.refresh()).resolves.not.toThrow();
    });

    it('should not throw when refreshing no auth', async () => {
      const auth = new LighterAuth({});
      await auth.initialize();

      await expect(auth.refresh()).resolves.not.toThrow();
    });
  });

  describe('Signer and NonceManager Access', () => {
    it('should return null signer for HMAC mode', async () => {
      const auth = new LighterAuth({
        apiKey: 'test',
        apiSecret: 'secret',
      });
      await auth.initialize();

      expect(auth.getSigner()).toBeNull();
    });

    it('should return null nonceManager when httpClient not provided', async () => {
      const auth = new LighterAuth({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 300,
      });
      await auth.initialize();

      expect(auth.getNonceManager()).toBeNull();
    });

    it('should return nonceManager when httpClient is provided', async () => {
      const auth = new LighterAuth({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 300,
        httpClient: createMockHttpClient(),
      });
      await auth.initialize();

      expect(auth.getNonceManager()).not.toBeNull();
    });
  });
});
