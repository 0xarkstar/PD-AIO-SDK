/**
 * Unit Tests for KatanaAuth
 *
 * Tests HMAC-SHA256 signing, EIP-712 signing, nonce generation,
 * credential checks, and server time offset management.
 */

import { Wallet } from 'ethers';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { KatanaAuth } from '../../src/adapters/katana/KatanaAuth.js';
import type { KatanaOrderSignPayload, KatanaCancelSignPayload } from '../../src/adapters/katana/types.js';
import type { RequestParams } from '../../src/types/adapter.js';
import {
  KATANA_EIP712_DOMAIN,
  KATANA_EIP712_ORDER_TYPE,
  KATANA_EIP712_CANCEL_TYPE,
  KATANA_AUTH_HEADERS,
} from '../../src/adapters/katana/constants.js';

const TEST_PRIVATE_KEY = '0x' + '1'.repeat(64);
const TEST_API_KEY = 'test-api-key';
const TEST_API_SECRET = 'test-api-secret';

/** Minimal order payload for EIP-712 signing tests */
const makeOrderPayload = (): KatanaOrderSignPayload => ({
  nonce: 'abc-def-123',
  wallet: '0x1234567890123456789012345678901234567890',
  market: 'BTC-USD',
  type: 1,
  side: 0,
  quantity: '0.10000000',
  limitPrice: '50000.00000000',
  triggerPrice: '0.00000000',
  triggerType: 0,
  callbackRate: '0.00000000',
  conditionalOrderId: 0,
  isReduceOnly: false,
  timeInForce: 0,
  selfTradePrevention: 0,
  isLiquidationAcquisitionOnly: false,
  delegatedPublicKey: '0x0000000000000000000000000000000000000000',
  clientOrderId: 'client-order-1',
});

/** Minimal cancel payload for EIP-712 signing tests */
const makeCancelPayload = (): KatanaCancelSignPayload => ({
  nonce: 'xyz-456',
  wallet: '0x1234567890123456789012345678901234567890',
  orderId: 'order-789',
  market: 'BTC-USD',
});

describe('KatanaAuth', () => {
  let wallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet(TEST_PRIVATE_KEY);
  });

  // ---------------------------------------------------------------------------
  // 1. Constructor
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    test('creates with apiKey and apiSecret only', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
      expect(auth).toBeInstanceOf(KatanaAuth);
      expect(auth.hasCredentials()).toBe(true);
      expect(auth.hasWallet()).toBe(false);
    });

    test('creates with wallet only', () => {
      const auth = new KatanaAuth({ wallet });
      expect(auth).toBeInstanceOf(KatanaAuth);
      expect(auth.hasCredentials()).toBe(false);
      expect(auth.hasWallet()).toBe(true);
    });

    test('creates with all credentials', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET, wallet });
      expect(auth).toBeInstanceOf(KatanaAuth);
      expect(auth.hasCredentials()).toBe(true);
      expect(auth.hasWallet()).toBe(true);
    });

    test('creates without credentials for public access', () => {
      const auth = new KatanaAuth({});
      expect(auth).toBeInstanceOf(KatanaAuth);
      expect(auth.hasCredentials()).toBe(false);
      expect(auth.hasWallet()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Credential checks
  // ---------------------------------------------------------------------------

  describe('credential checks', () => {
    test('hasCredentials() returns true when apiKey and apiSecret are set', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
      expect(auth.hasCredentials()).toBe(true);
    });

    test('hasCredentials() returns false when credentials are missing', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY }); // no apiSecret
      expect(auth.hasCredentials()).toBe(false);
    });

    test('hasWallet() returns true when wallet is set', () => {
      const auth = new KatanaAuth({ wallet });
      expect(auth.hasWallet()).toBe(true);
    });

    test('hasWallet() returns false when wallet is absent', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
      expect(auth.hasWallet()).toBe(false);
    });

    test('requireAuth() throws when credentials are missing', () => {
      const auth = new KatanaAuth({});
      expect(() => auth.requireAuth()).toThrow(
        'Authentication required. Provide apiKey and apiSecret in config.'
      );
    });

    test('requireAuth() does not throw when credentials are present', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
      expect(() => auth.requireAuth()).not.toThrow();
    });

    test('requireWallet() throws when wallet is absent', () => {
      const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
      expect(() => auth.requireWallet()).toThrow(
        'Wallet required for trading operations. Provide wallet in config.'
      );
    });

    test('requireWallet() does not throw when wallet is present', () => {
      const auth = new KatanaAuth({ wallet });
      expect(() => auth.requireWallet()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. HMAC signing
  // ---------------------------------------------------------------------------

  describe('sign()', () => {
    let auth: KatanaAuth;

    beforeEach(() => {
      auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
    });

    test('adds KP-API-KEY header when credentials are present', async () => {
      const request: RequestParams = { method: 'GET', path: '/v1/markets' };
      const signed = await auth.sign(request);
      expect(signed.headers).toHaveProperty(KATANA_AUTH_HEADERS.apiKey, TEST_API_KEY);
    });

    test('adds KP-HMAC-SIGNATURE header when credentials are present', async () => {
      const request: RequestParams = { method: 'GET', path: '/v1/markets' };
      const signed = await auth.sign(request);
      expect(signed.headers).toHaveProperty(KATANA_AUTH_HEADERS.hmacSignature);
      expect(typeof signed.headers![KATANA_AUTH_HEADERS.hmacSignature]).toBe('string');
      expect(signed.headers![KATANA_AUTH_HEADERS.hmacSignature].length).toBeGreaterThan(0);
    });

    test('GET request signs query params', async () => {
      const params = { market: 'BTC-USD', limit: '10' };
      const request: RequestParams = { method: 'GET', path: '/v1/trades', params };
      const signed = await auth.sign(request);

      // Signature should be present and non-empty
      expect(signed.headers![KATANA_AUTH_HEADERS.hmacSignature]).toBeTruthy();

      // A GET with no params should produce a different signature than one with params
      const requestNoParams: RequestParams = { method: 'GET', path: '/v1/trades' };
      const signedNoParams = await auth.sign(requestNoParams);
      expect(signed.headers![KATANA_AUTH_HEADERS.hmacSignature]).not.toBe(
        signedNoParams.headers![KATANA_AUTH_HEADERS.hmacSignature]
      );
    });

    test('POST request signs JSON body', async () => {
      const body = { market: 'BTC-USD', side: 0, quantity: '0.1' };
      const request: RequestParams = { method: 'POST', path: '/v1/orders', body };
      const signed = await auth.sign(request);

      expect(signed.headers![KATANA_AUTH_HEADERS.hmacSignature]).toBeTruthy();

      // Different body should produce different signature
      const body2 = { market: 'ETH-USD', side: 1, quantity: '1.0' };
      const request2: RequestParams = { method: 'POST', path: '/v1/orders', body: body2 };
      const signed2 = await auth.sign(request2);
      expect(signed.headers![KATANA_AUTH_HEADERS.hmacSignature]).not.toBe(
        signed2.headers![KATANA_AUTH_HEADERS.hmacSignature]
      );
    });

    test('returns Content-Type only when no credentials', async () => {
      const publicAuth = new KatanaAuth({});
      const request: RequestParams = { method: 'GET', path: '/v1/markets' };
      const signed = await publicAuth.sign(request);

      expect(signed.headers).toHaveProperty('Content-Type', 'application/json');
      expect(signed.headers).not.toHaveProperty(KATANA_AUTH_HEADERS.apiKey);
      expect(signed.headers).not.toHaveProperty(KATANA_AUTH_HEADERS.hmacSignature);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. EIP-712 signing
  // ---------------------------------------------------------------------------

  describe('EIP-712 signing', () => {
    describe('signOrder()', () => {
      test('calls wallet.signTypedData with correct domain (mainnet by default)', async () => {
        const signTypedDataSpy = jest.spyOn(wallet, 'signTypedData');
        const auth = new KatanaAuth({ wallet, testnet: false });
        const payload = makeOrderPayload();

        await auth.signOrder(payload);

        expect(signTypedDataSpy).toHaveBeenCalledWith(
          KATANA_EIP712_DOMAIN.mainnet,
          KATANA_EIP712_ORDER_TYPE,
          payload
        );
        signTypedDataSpy.mockRestore();
      });

      test('uses sandbox chainId when testnet=true', async () => {
        const signTypedDataSpy = jest.spyOn(wallet, 'signTypedData');
        const auth = new KatanaAuth({ wallet, testnet: true });
        const payload = makeOrderPayload();

        await auth.signOrder(payload);

        const domainArg = signTypedDataSpy.mock.calls[0][0] as typeof KATANA_EIP712_DOMAIN.sandbox;
        expect(domainArg.chainId).toBe(KATANA_EIP712_DOMAIN.sandbox.chainId); // 737373
        signTypedDataSpy.mockRestore();
      });

      test('throws without wallet', async () => {
        const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
        await expect(auth.signOrder(makeOrderPayload())).rejects.toThrow(
          'Wallet required for trading operations. Provide wallet in config.'
        );
      });

      test('returns a valid EIP-712 signature string', async () => {
        const auth = new KatanaAuth({ wallet, testnet: true });
        const signature = await auth.signOrder(makeOrderPayload());

        expect(typeof signature).toBe('string');
        expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
      });
    });

    describe('signCancel()', () => {
      test('produces a signature for cancel payload', async () => {
        const auth = new KatanaAuth({ wallet, testnet: true });
        const signature = await auth.signCancel(makeCancelPayload());

        expect(typeof signature).toBe('string');
        expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
      });

      test('calls wallet.signTypedData with CANCEL_TYPE', async () => {
        const signTypedDataSpy = jest.spyOn(wallet, 'signTypedData');
        const auth = new KatanaAuth({ wallet, testnet: false });
        const payload = makeCancelPayload();

        await auth.signCancel(payload);

        expect(signTypedDataSpy).toHaveBeenCalledWith(
          KATANA_EIP712_DOMAIN.mainnet,
          KATANA_EIP712_CANCEL_TYPE,
          payload
        );
        signTypedDataSpy.mockRestore();
      });

      test('throws without wallet', async () => {
        const auth = new KatanaAuth({ apiKey: TEST_API_KEY, apiSecret: TEST_API_SECRET });
        await expect(auth.signCancel(makeCancelPayload())).rejects.toThrow(
          'Wallet required for trading operations. Provide wallet in config.'
        );
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Nonce & time
  // ---------------------------------------------------------------------------

  describe('nonce & time', () => {
    test('generateNonce() returns a valid UUID v1 format', () => {
      const auth = new KatanaAuth({});
      const nonce = auth.generateNonce();

      // UUID v1: xxxxxxxx-xxxx-1xxx-yxxx-xxxxxxxxxxxx
      expect(nonce).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    test('generateNonce() returns unique values on successive calls', () => {
      const auth = new KatanaAuth({});
      const nonces = new Set(Array.from({ length: 10 }, () => auth.generateNonce()));
      expect(nonces.size).toBe(10);
    });

    test('setServerTimeOffset / getServerTimeOffset round-trip', () => {
      const auth = new KatanaAuth({});
      expect(auth.getServerTimeOffset()).toBe(0);

      auth.setServerTimeOffset(500);
      expect(auth.getServerTimeOffset()).toBe(500);

      auth.setServerTimeOffset(-200);
      expect(auth.getServerTimeOffset()).toBe(-200);

      auth.setServerTimeOffset(0);
      expect(auth.getServerTimeOffset()).toBe(0);
    });
  });
});
