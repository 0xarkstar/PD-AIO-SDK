/**
 * Lighter NonceManager Unit Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NonceManager } from '../../src/adapters/lighter/NonceManager.js';
import type { HTTPClient } from '../../src/core/http/HTTPClient.js';

// Create a mock HTTPClient
function createMockHttpClient(nonce: number = 100): jest.Mocked<HTTPClient> {
  return {
    get: jest.fn().mockImplementation((path: string) => {
      if (path.includes('/api/v1/nextNonce')) {
        return Promise.resolve({ code: 0, nonce: nonce.toString() });
      }
      return Promise.resolve({});
    }),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    request: jest.fn().mockResolvedValue({}),
  } as unknown as jest.Mocked<HTTPClient>;
}

describe('NonceManager', () => {
  let mockHttpClient: jest.Mocked<HTTPClient>;
  let nonceManager: NonceManager;

  beforeEach(() => {
    mockHttpClient = createMockHttpClient(100);
    nonceManager = new NonceManager({
      httpClient: mockHttpClient,
      apiKeyIndex: 255,
      autoSync: true,
    });
  });

  describe('Initialization', () => {
    it('should create NonceManager with config', () => {
      expect(nonceManager).toBeInstanceOf(NonceManager);
      expect(nonceManager.isInitialized).toBe(false);
    });

    it('should not be initialized before first getNextNonce call', () => {
      expect(nonceManager.isInitialized).toBe(false);
    });
  });

  describe('getNextNonce', () => {
    it('should fetch initial nonce from server', async () => {
      const nonce = await nonceManager.getNextNonce();

      expect(nonce).toBe(BigInt(100));
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/nextNonce?api_key_index=255'
      );
    });

    it('should increment nonce on subsequent calls', async () => {
      const nonce1 = await nonceManager.getNextNonce();
      const nonce2 = await nonceManager.getNextNonce();
      const nonce3 = await nonceManager.getNextNonce();

      expect(nonce1).toBe(BigInt(100));
      expect(nonce2).toBe(BigInt(101));
      expect(nonce3).toBe(BigInt(102));
    });

    it('should only call server once for initial sync', async () => {
      await nonceManager.getNextNonce();
      await nonceManager.getNextNonce();
      await nonceManager.getNextNonce();

      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should be initialized after first getNextNonce', async () => {
      await nonceManager.getNextNonce();
      expect(nonceManager.isInitialized).toBe(true);
    });
  });

  describe('peekNonce', () => {
    it('should return -1 before initialization', () => {
      expect(nonceManager.peekNonce()).toBe(BigInt(-1));
    });

    it('should return current nonce without incrementing', async () => {
      await nonceManager.getNextNonce(); // consumes 100

      expect(nonceManager.peekNonce()).toBe(BigInt(101));
      expect(nonceManager.peekNonce()).toBe(BigInt(101)); // still 101
    });
  });

  describe('sync', () => {
    it('should sync nonce from server', async () => {
      await nonceManager.sync();

      expect(nonceManager.isInitialized).toBe(true);
      expect(nonceManager.peekNonce()).toBe(BigInt(100));
    });

    it('should update nonce on resync', async () => {
      // Initial sync
      await nonceManager.getNextNonce(); // 100
      await nonceManager.getNextNonce(); // 101

      // Server has advanced
      (mockHttpClient.get as jest.Mock).mockResolvedValueOnce({
        code: 0,
        nonce: '200'
      });

      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, 1100));

      await nonceManager.sync();

      expect(nonceManager.peekNonce()).toBe(BigInt(200));
    });
  });

  describe('reset', () => {
    it('should reset nonce to uninitialized state', async () => {
      await nonceManager.getNextNonce();
      expect(nonceManager.isInitialized).toBe(true);

      nonceManager.reset();

      expect(nonceManager.isInitialized).toBe(false);
      expect(nonceManager.peekNonce()).toBe(BigInt(-1));
    });

    it('should fetch from server again after reset', async () => {
      await nonceManager.getNextNonce();
      nonceManager.reset();

      // Server has advanced
      (mockHttpClient.get as jest.Mock).mockResolvedValueOnce({
        code: 0,
        nonce: '500'
      });

      const nonce = await nonceManager.getNextNonce();

      expect(nonce).toBe(BigInt(500));
    });
  });

  describe('setNonce', () => {
    it('should manually set nonce value', () => {
      nonceManager.setNonce(BigInt(50));

      expect(nonceManager.isInitialized).toBe(true);
      expect(nonceManager.peekNonce()).toBe(BigInt(50));
    });

    it('should throw for negative nonce', () => {
      expect(() => nonceManager.setNonce(BigInt(-1))).toThrow('cannot be negative');
    });

    it('should allow setting nonce to 0', () => {
      nonceManager.setNonce(BigInt(0));
      expect(nonceManager.peekNonce()).toBe(BigInt(0));
    });
  });

  describe('rollback', () => {
    it('should decrement nonce by one', async () => {
      await nonceManager.getNextNonce(); // 100
      await nonceManager.getNextNonce(); // 101

      expect(nonceManager.peekNonce()).toBe(BigInt(102));

      nonceManager.rollback();

      expect(nonceManager.peekNonce()).toBe(BigInt(101));
    });

    it('should not go below 0', async () => {
      nonceManager.setNonce(BigInt(0));
      nonceManager.rollback();

      expect(nonceManager.peekNonce()).toBe(BigInt(0));
    });
  });

  describe('timeSinceSync', () => {
    it('should return Infinity before first sync', () => {
      expect(nonceManager.timeSinceSync()).toBe(Infinity);
    });

    it('should return time since last sync', async () => {
      await nonceManager.sync();

      const time = nonceManager.timeSinceSync();
      expect(time).toBeLessThan(1000);
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('autoSync disabled', () => {
    it('should throw when getting nonce without prior sync', async () => {
      const manager = new NonceManager({
        httpClient: mockHttpClient,
        apiKeyIndex: 0,
        autoSync: false,
      });

      await expect(manager.getNextNonce()).rejects.toThrow('not initialized');
    });

    it('should work after manual sync', async () => {
      const manager = new NonceManager({
        httpClient: mockHttpClient,
        apiKeyIndex: 0,
        autoSync: false,
      });

      await manager.sync();
      const nonce = await manager.getNextNonce();

      expect(nonce).toBe(BigInt(100));
    });
  });

  describe('Error handling', () => {
    it('should throw on server error during initial sync', async () => {
      (mockHttpClient.get as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(nonceManager.getNextNonce()).rejects.toThrow('Network error');
    });

    it('should continue with local nonce on resync error', async () => {
      // First sync succeeds
      await nonceManager.getNextNonce(); // 100
      await nonceManager.getNextNonce(); // 101

      // Server error on resync
      (mockHttpClient.get as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should not throw, just warn
      await nonceManager.sync();

      // Should still have local nonce
      expect(nonceManager.peekNonce()).toBe(BigInt(102));
    });

    it('should handle invalid server response', async () => {
      (mockHttpClient.get as jest.Mock).mockResolvedValueOnce({
        code: 1,
        error: 'Invalid API key'
      });

      await expect(nonceManager.getNextNonce()).rejects.toThrow('Invalid nonce response');
    });
  });

  describe('Concurrent sync prevention', () => {
    it('should not make concurrent API calls', async () => {
      // Start multiple syncs simultaneously
      const syncPromises = [
        nonceManager.sync(),
        nonceManager.sync(),
        nonceManager.sync(),
      ];

      await Promise.all(syncPromises);

      // Should only have made one API call
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different API key indices', () => {
    it('should use correct API key index in query', async () => {
      const manager = new NonceManager({
        httpClient: mockHttpClient,
        apiKeyIndex: 10,
      });

      await manager.getNextNonce();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/nextNonce?api_key_index=10'
      );
    });
  });
});
