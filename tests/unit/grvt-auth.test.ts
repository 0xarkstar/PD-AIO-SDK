/**
 * Unit Tests for GRVTAuth
 *
 * Tests EIP-712 signing, session management, and signature parsing
 */

import { Wallet } from 'ethers';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTAuth } from '../../src/adapters/grvt/GRVTAuth.js';
import type { GRVTOrderSignPayload } from '../../src/adapters/grvt/types.js';
import type { RequestParams } from '../../src/types/adapter.js';

describe('GRVTAuth', () => {
  let wallet: Wallet;
  let auth: GRVTAuth;
  const testPrivateKey = '0x' + '1'.repeat(64);

  beforeEach(() => {
    wallet = new Wallet(testPrivateKey);
    auth = new GRVTAuth({
      apiKey: 'test-api-key',
      wallet,
      testnet: true,
    });
  });

  describe('constructor', () => {
    it('should create instance with API key only', () => {
      const authWithKey = new GRVTAuth({
        apiKey: 'test-key',
      });
      expect(authWithKey).toBeInstanceOf(GRVTAuth);
    });

    it('should create instance with wallet only', () => {
      const authWithWallet = new GRVTAuth({
        wallet,
      });
      expect(authWithWallet).toBeInstanceOf(GRVTAuth);
    });

    it('should create instance with both API key and wallet', () => {
      expect(auth).toBeInstanceOf(GRVTAuth);
    });

    it('should create instance without credentials (for public API access)', () => {
      const authNoCredentials = new GRVTAuth({});
      expect(authNoCredentials).toBeInstanceOf(GRVTAuth);
      expect(authNoCredentials.hasCredentials()).toBe(false);
    });

    it('should throw requireAuth when no credentials and private method called', () => {
      const authNoCredentials = new GRVTAuth({});
      expect(() => authNoCredentials.requireAuth()).toThrow(
        'Authentication required. Provide apiKey or wallet in config.'
      );
    });

    it('should default testnet to false', () => {
      const authMainnet = new GRVTAuth({
        apiKey: 'test-key',
      });
      expect(authMainnet).toBeInstanceOf(GRVTAuth);
    });
  });

  describe('getHeaders', () => {
    it('should return headers with API key', () => {
      const headers = auth.getHeaders();

      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('X-API-KEY', 'test-api-key');
    });

    it('should return headers with session cookie if set', () => {
      auth.setSessionCookie('session-token-123');
      const headers = auth.getHeaders();

      expect(headers).toHaveProperty('Cookie', 'session=session-token-123');
    });

    it('should not include cookie if session expired', () => {
      // Set session with immediate expiry
      auth.setSessionCookie('expired-token', 0);
      const headers = auth.getHeaders();

      expect(headers).not.toHaveProperty('Cookie');
    });

    it('should work without API key', () => {
      const authWalletOnly = new GRVTAuth({ wallet });
      const headers = authWalletOnly.getHeaders();

      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).not.toHaveProperty('X-API-KEY');
    });
  });

  describe('sign', () => {
    it('should add API key to request headers', async () => {
      const request: RequestParams = {
        method: 'GET',
        path: '/markets',
      };

      const signed = await auth.sign(request);

      expect(signed.headers).toHaveProperty('X-API-KEY', 'test-api-key');
    });

    it('should add session cookie if available', async () => {
      auth.setSessionCookie('test-session');

      const request: RequestParams = {
        method: 'GET',
        path: '/markets',
      };

      const signed = await auth.sign(request);

      expect(signed.headers).toHaveProperty('Cookie', 'session=test-session');
    });

    it('should add signature for trading operations', async () => {
      const request: RequestParams = {
        method: 'POST',
        path: '/orders',
        body: { instrument: 'BTC_USDT_Perp' },
      };

      const signed = await auth.sign(request);

      expect(signed.headers).toHaveProperty('X-Signature');
      expect(signed.headers).toHaveProperty('X-Timestamp');
      expect(signed.headers).toHaveProperty('X-Address', wallet.address);
    });

    it('should sign transfer requests', async () => {
      const request: RequestParams = {
        method: 'POST',
        path: '/transfer',
        body: { amount: '100' },
      };

      const signed = await auth.sign(request);

      expect(signed.headers).toHaveProperty('X-Signature');
    });

    it('should not sign market data requests', async () => {
      const request: RequestParams = {
        method: 'GET',
        path: '/markets',
      };

      const signed = await auth.sign(request);

      expect(signed.headers).not.toHaveProperty('X-Signature');
    });
  });

  describe('verify', () => {
    it('should return true with valid API key', async () => {
      const result = await auth.verify();
      expect(result).toBe(true);
    });

    it('should return true with valid wallet', async () => {
      const authWallet = new GRVTAuth({ wallet });
      const result = await authWallet.verify();
      expect(result).toBe(true);
    });

    it('should return false with empty API key and no wallet', async () => {
      // Need to create a mock wallet that returns empty address
      const emptyWallet = {
        getAddress: async () => '',
      } as any;
      const authEmpty = new GRVTAuth({ apiKey: '', wallet: emptyWallet });
      const result = await authEmpty.verify();
      expect(result).toBe(false);
    });
  });

  describe('session management', () => {
    describe('setSessionCookie', () => {
      it('should set session cookie with default duration', () => {
        auth.setSessionCookie('test-token');
        expect(auth.getSessionCookie()).toBe('test-token');
      });

      it('should set session cookie with custom expiration', () => {
        // Use 120 seconds to account for 60-second buffer
        auth.setSessionCookie('test-token', 120000);
        expect(auth.getSessionCookie()).toBe('test-token');
      });
    });

    describe('getSessionCookie', () => {
      it('should return undefined initially', () => {
        const freshAuth = new GRVTAuth({ apiKey: 'test' });
        expect(freshAuth.getSessionCookie()).toBeUndefined();
      });

      it('should return token after setting', () => {
        auth.setSessionCookie('my-token');
        expect(auth.getSessionCookie()).toBe('my-token');
      });

      it('should return undefined for expired session', () => {
        auth.setSessionCookie('expired', 0);
        // Wait a tiny bit
        setTimeout(() => {
          expect(auth.getSessionCookie()).toBeUndefined();
        }, 10);
      });
    });

    describe('clearSessionCookie', () => {
      it('should clear session cookie', () => {
        auth.setSessionCookie('test-token');
        expect(auth.getSessionCookie()).toBe('test-token');

        auth.clearSessionCookie();
        expect(auth.getSessionCookie()).toBeUndefined();
      });
    });
  });

  describe('nonce management', () => {
    describe('getNextNonce', () => {
      it('should start at 1', () => {
        expect(auth.getNextNonce()).toBe(1);
      });

      it('should increment on each call', () => {
        expect(auth.getNextNonce()).toBe(1);
        expect(auth.getNextNonce()).toBe(2);
        expect(auth.getNextNonce()).toBe(3);
      });
    });

    describe('resetNonce', () => {
      it('should reset nonce to 0', () => {
        auth.getNextNonce(); // 1
        auth.getNextNonce(); // 2
        auth.resetNonce();
        expect(auth.getNextNonce()).toBe(1);
      });
    });
  });

  describe('EIP-712 signing', () => {
    describe('signOrder', () => {
      it('should sign order payload with EIP-712', async () => {
        const payload: GRVTOrderSignPayload = {
          instrument: 'BTC_USDT_Perp',
          order_type: 'LIMIT',
          side: 'BUY',
          size: '0.1',
          price: '50000',
          time_in_force: 'GTC',
          reduce_only: false,
          post_only: false,
          nonce: 1,
          expiry: Date.now() + 60000,
        };

        const signature = await auth.signOrder(payload);

        expect(signature).toBeDefined();
        expect(signature).toMatch(/^0x[0-9a-f]{130}$/i);
      });

      it('should throw error if wallet not provided', async () => {
        const authNoWallet = new GRVTAuth({ apiKey: 'test' });

        const payload: GRVTOrderSignPayload = {
          instrument: 'BTC_USDT_Perp',
          order_type: 'LIMIT',
          side: 'BUY',
          size: '0.1',
          price: '50000',
          time_in_force: 'GTC',
          reduce_only: false,
          post_only: false,
          nonce: 1,
          expiry: Date.now() + 60000,
        };

        await expect(authNoWallet.signOrder(payload)).rejects.toThrow(
          'Wallet required for signing orders'
        );
      });

      it('should use testnet chain ID', async () => {
        const payload: GRVTOrderSignPayload = {
          instrument: 'ETH_USDT_Perp',
          order_type: 'MARKET',
          side: 'SELL',
          size: '1.0',
          price: '0',
          time_in_force: 'IOC',
          reduce_only: true,
          post_only: false,
          nonce: 5,
          expiry: Date.now() + 30000,
        };

        const signature = await auth.signOrder(payload);
        expect(signature).toBeDefined();
      });

      it('should use mainnet chain ID when testnet=false', async () => {
        const authMainnet = new GRVTAuth({ wallet, testnet: false });

        const payload: GRVTOrderSignPayload = {
          instrument: 'BTC_USDT_Perp',
          order_type: 'LIMIT',
          side: 'BUY',
          size: '0.5',
          price: '45000',
          time_in_force: 'GTC',
          reduce_only: false,
          post_only: true,
          nonce: 1,
          expiry: Date.now() + 120000,
        };

        const signature = await authMainnet.signOrder(payload);
        expect(signature).toBeDefined();
      });
    });

    describe('parseSignature', () => {
      it('should parse valid signature with 0x prefix', () => {
        const signature =
          '0x' +
          'a'.repeat(64) + // r
          'b'.repeat(64) + // s
          '1b'; // v

        const parsed = auth.parseSignature(signature);

        expect(parsed.r).toBe('0x' + 'a'.repeat(64));
        expect(parsed.s).toBe('0x' + 'b'.repeat(64));
        expect(parsed.v).toBe(27); // 0x1b = 27
      });

      it('should parse valid signature without 0x prefix', () => {
        const signature =
          'c'.repeat(64) + // r
          'd'.repeat(64) + // s
          '1c'; // v

        const parsed = auth.parseSignature(signature);

        expect(parsed.r).toBe('0x' + 'c'.repeat(64));
        expect(parsed.s).toBe('0x' + 'd'.repeat(64));
        expect(parsed.v).toBe(28); // 0x1c = 28
      });

      it('should throw error for invalid signature length', () => {
        const shortSignature = '0x' + 'a'.repeat(100);

        expect(() => auth.parseSignature(shortSignature)).toThrow(
          'Invalid signature length'
        );
      });

      it('should throw error for too long signature', () => {
        const longSignature = '0x' + 'a'.repeat(200);

        expect(() => auth.parseSignature(longSignature)).toThrow(
          'Invalid signature length'
        );
      });
    });

    describe('createSignature', () => {
      it('should create full ISignature object', async () => {
        const payload: GRVTOrderSignPayload = {
          instrument: 'BTC_USDT_Perp',
          order_type: 'LIMIT',
          side: 'BUY',
          size: '0.1',
          price: '50000',
          time_in_force: 'GTC',
          reduce_only: false,
          post_only: false,
          nonce: 1,
          expiry: 1234567890,
        };

        const signature = await auth.createSignature(payload);

        expect(signature).toHaveProperty('signer', wallet.address);
        expect(signature).toHaveProperty('r');
        expect(signature).toHaveProperty('s');
        expect(signature).toHaveProperty('v');
        expect(signature).toHaveProperty('expiration', '1234567890');
        expect(signature).toHaveProperty('nonce', 1);
        expect(signature.r).toMatch(/^0x[0-9a-f]{64}$/i);
        expect(signature.s).toMatch(/^0x[0-9a-f]{64}$/i);
        expect([27, 28]).toContain(signature.v);
      });

      it('should throw error if wallet not provided', async () => {
        const authNoWallet = new GRVTAuth({ apiKey: 'test' });

        const payload: GRVTOrderSignPayload = {
          instrument: 'BTC_USDT_Perp',
          order_type: 'LIMIT',
          side: 'BUY',
          size: '0.1',
          price: '50000',
          time_in_force: 'GTC',
          reduce_only: false,
          post_only: false,
          nonce: 1,
          expiry: Date.now(),
        };

        await expect(authNoWallet.createSignature(payload)).rejects.toThrow(
          'Wallet required for creating signatures'
        );
      });
    });
  });

  describe('getAddress', () => {
    it('should return wallet address when wallet provided', () => {
      expect(auth.getAddress()).toBe(wallet.address);
    });

    it('should return undefined when no wallet', () => {
      const authNoWallet = new GRVTAuth({ apiKey: 'test' });
      expect(authNoWallet.getAddress()).toBeUndefined();
    });
  });
});
