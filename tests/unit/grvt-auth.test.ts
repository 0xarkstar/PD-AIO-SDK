/**
 * Unit Tests for GRVTAuth (cookie-session + delegated EIP-712 signing).
 *
 * GRVT auth is cookie-session (gravity cookie + X-Grvt-Account-Id), NOT per-request
 * message signing. Order signing is delegated to signing.ts (leg-based EIP-712);
 * the sign->recover roundtrip lives in grvt-signing.test.ts, but we assert here
 * that GRVTAuth.signOrder produces a recoverable signature for the wallet.
 */

import { Wallet } from 'ethers';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTAuth } from '../../src/adapters/grvt/GRVTAuth.js';
import { recoverOrderSigner, GRVT_CHAIN_IDS } from '../../src/adapters/grvt/signing.js';
import type { GRVTSession } from '../../src/adapters/grvt/types.js';
import type { RequestParams } from '../../src/types/adapter.js';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function makeSession(overrides: Partial<GRVTSession> = {}): GRVTSession {
  return {
    cookie: 'gravity-cookie-value',
    accountId: 'acct-123',
    subAccountId: '987654321',
    fundingAccountAddress: '0xfund',
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe('GRVTAuth', () => {
  let wallet: Wallet;
  let auth: GRVTAuth;

  beforeEach(() => {
    wallet = new Wallet(TEST_PRIVATE_KEY);
    auth = new GRVTAuth({ apiKey: 'test-api-key', wallet, testnet: true });
  });

  describe('constructor / credentials', () => {
    it('reports credentials when an apiKey is set', () => {
      expect(auth.hasCredentials()).toBe(true);
      expect(new GRVTAuth({}).hasCredentials()).toBe(false);
    });

    it('reports wallet presence', () => {
      expect(auth.hasWallet()).toBe(true);
      expect(new GRVTAuth({ apiKey: 'k' }).hasWallet()).toBe(false);
    });

    it('requireAuth throws without credentials', () => {
      const noCreds = new GRVTAuth({});
      expect(() => noCreds.requireAuth()).toThrow('Authentication required. Provide apiKey in config.');
    });

    it('exposes the testnet chainId (326)', () => {
      expect(auth.chainId).toBe(GRVT_CHAIN_IDS.testnet);
      expect(new GRVTAuth({ apiKey: 'k', testnet: false }).chainId).toBe(GRVT_CHAIN_IDS.mainnet);
    });
  });

  describe('getHeaders (cookie-session)', () => {
    it('returns only Content-Type before a session is set', () => {
      const headers = auth.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Cookie']).toBeUndefined();
      expect(headers['X-Grvt-Account-Id']).toBeUndefined();
    });

    it('adds gravity cookie + X-Grvt-Account-Id once a session is set', () => {
      auth.setSession(makeSession());
      const headers = auth.getHeaders();
      expect(headers['Cookie']).toBe('gravity=gravity-cookie-value');
      expect(headers['X-Grvt-Account-Id']).toBe('acct-123');
    });

    it('omits cookie headers when the session is within the 5s refresh buffer', () => {
      auth.setSession(makeSession({ expiresAt: Date.now() + 1000 }));
      const headers = auth.getHeaders();
      expect(headers['Cookie']).toBeUndefined();
    });

    it('does NOT use per-request message-signing headers', () => {
      auth.setSession(makeSession());
      const headers = auth.getHeaders();
      expect(headers['X-Signature']).toBeUndefined();
      expect(headers['X-Timestamp']).toBeUndefined();
      expect(headers['X-API-KEY']).toBeUndefined();
    });
  });

  describe('sign (IAuthStrategy)', () => {
    it('attaches cookie-session headers to the request', async () => {
      auth.setSession(makeSession());
      const request: RequestParams = { method: 'POST', path: 'full/v1/create_order' };
      const signed = await auth.sign(request);
      expect(signed.headers?.['Cookie']).toBe('gravity=gravity-cookie-value');
      expect(signed.headers?.['X-Grvt-Account-Id']).toBe('acct-123');
    });
  });

  describe('session management', () => {
    it('stores, returns, and clears the session', () => {
      const session = makeSession();
      auth.setSession(session);
      expect(auth.getSession()).toBe(session);
      auth.clearSession();
      expect(auth.getSession()).toBeUndefined();
    });
  });

  describe('verify', () => {
    it('returns true with a valid API key', async () => {
      expect(await auth.verify()).toBe(true);
    });

    it('returns true with a wallet only', async () => {
      expect(await new GRVTAuth({ wallet }).verify()).toBe(true);
    });

    it('returns false when the wallet getAddress throws', async () => {
      const brokenWallet = {
        getAddress: async () => {
          throw new Error('wallet error');
        },
      } as unknown as Wallet;
      expect(await new GRVTAuth({ wallet: brokenWallet }).verify()).toBe(false);
    });

    it('returns false with empty apiKey and no wallet', async () => {
      expect(await new GRVTAuth({ apiKey: '' }).verify()).toBe(false);
    });
  });

  describe('nonce / expiration generators (delegated to signing.ts)', () => {
    it('generateNonce stays within [0, 1e9)', () => {
      for (let i = 0; i < 100; i += 1) {
        const n = auth.generateNonce();
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1e9);
      }
    });

    it('generateExpiration returns future nanoseconds', () => {
      const nowNs = BigInt(Date.now()) * 1_000_000n;
      expect(BigInt(auth.generateExpiration())).toBeGreaterThan(nowNs);
    });
  });

  describe('signOrder (delegated leg-based EIP-712)', () => {
    it('produces a signature that recovers the wallet address', async () => {
      const input = {
        subAccountId: '987654321',
        isMarket: false,
        timeInForce: 'GOOD_TILL_TIME' as const,
        postOnly: true,
        reduceOnly: false,
        nonce: 12345,
        expiration: '1900000000000000000',
        legs: [
          {
            instrumentHash: '0x030501',
            baseDecimals: 9,
            size: '0.001',
            limitPrice: '50000.0',
            isBuyingAsset: true,
          },
        ],
      };

      const sig = await auth.signOrder(input);

      expect(sig.signer).toBe(wallet.address);
      expect(sig.r).toMatch(/^0x[0-9a-f]{64}$/);
      expect(sig.s).toMatch(/^0x[0-9a-f]{64}$/);
      expect([27, 28]).toContain(sig.v);
      expect(sig.nonce).toBe(12345);
      // Auth defaults to testnet chainId 326 when caller omits it.
      expect(sig.chainId).toBe(GRVT_CHAIN_IDS.testnet);

      const recovered = recoverOrderSigner(
        { ...input, chainId: GRVT_CHAIN_IDS.testnet },
        sig
      );
      expect(recovered).toBe(wallet.address);
    });

    it('throws when no wallet is configured', async () => {
      const noWallet = new GRVTAuth({ apiKey: 'k' });
      await expect(
        noWallet.signOrder({
          subAccountId: '1',
          isMarket: false,
          timeInForce: 'GOOD_TILL_TIME',
          postOnly: true,
          reduceOnly: false,
          legs: [
            { instrumentHash: '0x030501', baseDecimals: 9, size: '0.001', limitPrice: '50000', isBuyingAsset: true },
          ],
        })
      ).rejects.toThrow('Wallet required for signing orders');
    });
  });

  describe('getAddress', () => {
    it('returns the wallet address when present', () => {
      expect(auth.getAddress()).toBe(wallet.address);
    });

    it('returns undefined without a wallet', () => {
      expect(new GRVTAuth({ apiKey: 'k' }).getAddress()).toBeUndefined();
    });
  });
});
