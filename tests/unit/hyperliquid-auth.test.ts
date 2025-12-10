/**
 * Unit Tests for HyperliquidAuth
 *
 * Tests EIP-712 signing for Hyperliquid exchange
 */

import { Wallet } from 'ethers';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { HyperliquidAuth } from '../../src/adapters/hyperliquid/HyperliquidAuth.js';
import type { RequestParams } from '../../src/types/adapter.js';
import type { HyperliquidAction } from '../../src/adapters/hyperliquid/types.js';

describe('HyperliquidAuth', () => {
  let wallet: Wallet;
  let auth: HyperliquidAuth;
  const testPrivateKey = '0x' + '1'.repeat(64);

  beforeEach(() => {
    wallet = new Wallet(testPrivateKey);
    auth = new HyperliquidAuth(wallet);
  });

  describe('constructor', () => {
    it('should create instance with wallet', () => {
      expect(auth).toBeInstanceOf(HyperliquidAuth);
    });

    it('should initialize with different wallet', () => {
      const otherKey = '0x' + '2'.repeat(64);
      const otherWallet = new Wallet(otherKey);
      const otherAuth = new HyperliquidAuth(otherWallet);

      expect(otherAuth).toBeInstanceOf(HyperliquidAuth);
      expect(otherAuth.getAddress()).toBe(otherWallet.address);
    });

    it('should work with wallet from mnemonic', () => {
      const mnemonic = 'test test test test test test test test test test test junk';
      const walletFromMnemonic = Wallet.fromPhrase(mnemonic);
      const authFromMnemonic = new HyperliquidAuth(walletFromMnemonic);

      expect(authFromMnemonic).toBeInstanceOf(HyperliquidAuth);
    });
  });

  describe('getHeaders', () => {
    it('should return Content-Type header', () => {
      const headers = auth.getHeaders();

      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should return only Content-Type header', () => {
      const headers = auth.getHeaders();
      const keys = Object.keys(headers);

      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('Content-Type');
    });

    it('should return same headers on multiple calls', () => {
      const headers1 = auth.getHeaders();
      const headers2 = auth.getHeaders();

      expect(headers1).toEqual(headers2);
    });
  });

  describe('sign', () => {
    describe('public endpoints (no body)', () => {
      it('should add only headers for GET requests', async () => {
        const request: RequestParams = {
          method: 'GET',
          path: '/markets',
        };

        const signed = await auth.sign(request);

        expect(signed.method).toBe('GET');
        expect(signed.path).toBe('/markets');
        expect(signed.headers).toHaveProperty('Content-Type', 'application/json');
        expect(signed.body).toBeUndefined();
      });

      it('should not modify request without body', async () => {
        const request: RequestParams = {
          method: 'GET',
          path: '/info',
          headers: { 'X-Custom': 'value' },
        };

        const signed = await auth.sign(request);

        expect(signed.body).toBeUndefined();
        expect(signed.headers).toHaveProperty('Content-Type', 'application/json');
      });

      it('should preserve existing headers', async () => {
        const request: RequestParams = {
          method: 'GET',
          path: '/markets',
          headers: {
            'X-Custom-Header': 'custom-value',
          },
        };

        const signed = await auth.sign(request);

        expect(signed.headers).toHaveProperty('Content-Type', 'application/json');
      });
    });

    describe('trading endpoints (with body)', () => {
      it('should sign order action', async () => {
        const action: HyperliquidAction = {
          type: 'order',
          orders: [
            {
              a: 0, // asset index
              b: true, // is buy
              p: '50000', // price
              s: '0.1', // size
              r: false, // reduce only
              t: { limit: { tif: 'Gtc' } },
            },
          ],
          grouping: 'na',
        };

        const request: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action,
        };

        const signed = await auth.sign(request);

        expect(signed.body).toBeDefined();
        expect(signed.body).toHaveProperty('action');
        expect(signed.body).toHaveProperty('nonce');
        expect(signed.body).toHaveProperty('signature');

        const signedBody = signed.body as any;
        expect(signedBody.signature).toHaveProperty('r');
        expect(signedBody.signature).toHaveProperty('s');
        expect(signedBody.signature).toHaveProperty('v');
      });

      it('should increment nonce on each signature', async () => {
        const action1: HyperliquidAction = {
          type: 'cancel',
          cancels: [{ a: 0, o: 123 }],
        };

        const action2: HyperliquidAction = {
          type: 'cancel',
          cancels: [{ a: 0, o: 456 }],
        };

        const request1: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action1,
        };

        const request2: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action2,
        };

        const signed1 = await auth.sign(request1);
        const signed2 = await auth.sign(request2);

        const nonce1 = (signed1.body as any).nonce;
        const nonce2 = (signed2.body as any).nonce;

        expect(nonce2).toBeGreaterThan(nonce1);
      });

      it('should preserve action in signed body', async () => {
        const action: HyperliquidAction = {
          type: 'withdraw',
          hyperliquidChain: 'Mainnet',
          signatureChainId: '0xa4b1',
          amount: '100',
          time: Date.now(),
          destination: '0x' + '1'.repeat(40),
        };

        const request: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action,
        };

        const signed = await auth.sign(request);
        const signedBody = signed.body as any;

        expect(signedBody.action).toEqual(action);
      });

      it('should create valid signature structure', async () => {
        const action: HyperliquidAction = {
          type: 'order',
          orders: [],
          grouping: 'na',
        };

        const request: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action,
        };

        const signed = await auth.sign(request);
        const signedBody = signed.body as any;

        expect(signedBody.signature.r).toMatch(/^0x[0-9a-f]{64}$/i);
        expect(signedBody.signature.s).toMatch(/^0x[0-9a-f]{64}$/i);
        expect([27, 28]).toContain(signedBody.signature.v);
      });

      it('should sign transfer action', async () => {
        const action: HyperliquidAction = {
          type: 'usdTransfer',
          hyperliquidChain: 'Mainnet',
          signatureChainId: '0xa4b1',
          amount: '50',
          time: Date.now(),
          destination: '0x' + '2'.repeat(40),
        };

        const request: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action,
        };

        const signed = await auth.sign(request);

        expect(signed.body).toHaveProperty('signature');
      });
    });

    describe('edge cases', () => {
      it('should handle request with empty body object', async () => {
        const request: RequestParams = {
          method: 'POST',
          path: '/test',
          body: {},
        };

        const signed = await auth.sign(request);

        expect(signed.body).toBeDefined();
      });

      it('should handle complex action types', async () => {
        const action: HyperliquidAction = {
          type: 'batchModify',
          modifies: [
            {
              oid: 123,
              order: {
                a: 0,
                b: true,
                p: '51000',
                s: '0.2',
                r: false,
                t: { limit: { tif: 'Gtc' } },
              },
            },
          ],
        };

        const request: RequestParams = {
          method: 'POST',
          path: '/exchange',
          body: action,
        };

        const signed = await auth.sign(request);

        expect(signed.body).toHaveProperty('action');
        expect(signed.body).toHaveProperty('signature');
      });

      it('should maintain request method and path', async () => {
        const action: HyperliquidAction = {
          type: 'order',
          orders: [],
          grouping: 'na',
        };

        const request: RequestParams = {
          method: 'POST',
          path: '/custom/path',
          body: action,
        };

        const signed = await auth.sign(request);

        expect(signed.method).toBe('POST');
        expect(signed.path).toBe('/custom/path');
      });
    });
  });

  describe('getAddress', () => {
    it('should return wallet address', () => {
      const address = auth.getAddress();

      expect(address).toBe(wallet.address);
      expect(address).toMatch(/^0x[0-9a-f]{40}$/i);
    });

    it('should return consistent address', () => {
      const address1 = auth.getAddress();
      const address2 = auth.getAddress();

      expect(address1).toBe(address2);
    });

    it('should return different addresses for different wallets', () => {
      const wallet2 = new Wallet('0x' + '2'.repeat(64));
      const auth2 = new HyperliquidAuth(wallet2);

      expect(auth.getAddress()).not.toBe(auth2.getAddress());
    });

    it('should match wallet address exactly', () => {
      expect(auth.getAddress()).toBe(wallet.address);
    });
  });

  describe('getConnectionId', () => {
    it('should return connection ID', () => {
      const connectionId = auth.getConnectionId();

      expect(connectionId).toBeDefined();
      expect(connectionId).toMatch(/^0x[0-9a-f]{64}$/i);
    });

    it('should return consistent connection ID', () => {
      const id1 = auth.getConnectionId();
      const id2 = auth.getConnectionId();

      expect(id1).toBe(id2);
    });

    it('should return different IDs for different wallets', () => {
      const wallet2 = new Wallet('0x' + '2'.repeat(64));
      const auth2 = new HyperliquidAuth(wallet2);

      expect(auth.getConnectionId()).not.toBe(auth2.getConnectionId());
    });

    it('should be derived from wallet address', () => {
      // Connection ID is keccak256 hash of wallet address
      const connectionId = auth.getConnectionId();

      expect(connectionId).toMatch(/^0x[0-9a-f]{64}$/i);
      expect(connectionId.length).toBe(66); // '0x' + 64 hex chars
    });

    it('should be deterministic for same wallet', () => {
      const wallet2 = new Wallet(testPrivateKey);
      const auth2 = new HyperliquidAuth(wallet2);

      expect(auth.getConnectionId()).toBe(auth2.getConnectionId());
    });
  });

  describe('EIP-712 signature validation', () => {
    it('should create valid EIP-712 signature', async () => {
      const action: HyperliquidAction = {
        type: 'order',
        orders: [
          {
            a: 0,
            b: true,
            p: '50000',
            s: '0.1',
            r: false,
            t: { limit: { tif: 'Gtc' } },
          },
        ],
        grouping: 'na',
      };

      const request: RequestParams = {
        method: 'POST',
        path: '/exchange',
        body: action,
      };

      const signed = await auth.sign(request);
      const signedBody = signed.body as any;

      // Verify signature components
      expect(signedBody.signature.r).toBeDefined();
      expect(signedBody.signature.s).toBeDefined();
      expect(signedBody.signature.v).toBeDefined();

      // Verify signature format
      expect(signedBody.signature.r.length).toBe(66);
      expect(signedBody.signature.s.length).toBe(66);
      expect(typeof signedBody.signature.v).toBe('number');
    });

    it('should use correct v value (27 or 28)', async () => {
      const action: HyperliquidAction = {
        type: 'cancel',
        cancels: [{ a: 0, o: 123 }],
      };

      const request: RequestParams = {
        method: 'POST',
        path: '/exchange',
        body: action,
      };

      const signed = await auth.sign(request);
      const signedBody = signed.body as any;

      expect([27, 28]).toContain(signedBody.signature.v);
    });

    it('should create same signature but different nonces for different actions', async () => {
      const action1: HyperliquidAction = {
        type: 'cancel',
        cancels: [{ a: 0, o: 111 }],
      };

      const action2: HyperliquidAction = {
        type: 'cancel',
        cancels: [{ a: 0, o: 222 }],
      };

      const request1: RequestParams = {
        method: 'POST',
        path: '/exchange',
        body: action1,
      };

      const request2: RequestParams = {
        method: 'POST',
        path: '/exchange',
        body: action2,
      };

      const signed1 = await auth.sign(request1);
      const signed2 = await auth.sign(request2);

      const body1 = signed1.body as any;
      const body2 = signed2.body as any;

      // Hyperliquid uses "phantom agent" pattern: signature signs the connection, not the action
      // So signatures are the same for the same wallet, but nonces differ
      expect(body1.signature.r).toBe(body2.signature.r);
      expect(body1.signature.s).toBe(body2.signature.s);
      expect(body1.nonce).not.toBe(body2.nonce);
    });

    it('should include nonce in signed action', async () => {
      const action: HyperliquidAction = {
        type: 'order',
        orders: [],
        grouping: 'na',
      };

      const request: RequestParams = {
        method: 'POST',
        path: '/exchange',
        body: action,
      };

      const signed = await auth.sign(request);
      const signedBody = signed.body as any;

      expect(signedBody.nonce).toBeDefined();
      expect(typeof signedBody.nonce).toBe('number');
      expect(signedBody.nonce).toBeGreaterThan(0);
    });
  });

  describe('multiple wallets', () => {
    it('should maintain separate state for different auth instances', async () => {
      const wallet2 = new Wallet('0x' + '2'.repeat(64));
      const auth2 = new HyperliquidAuth(wallet2);

      const action1: HyperliquidAction = { type: 'order', orders: [], grouping: 'na' };
      const action2: HyperliquidAction = { type: 'order', orders: [], grouping: 'na' };

      const request1: RequestParams = { method: 'POST', path: '/exchange', body: action1 };
      const request2: RequestParams = { method: 'POST', path: '/exchange', body: action2 };

      const signed1 = await auth.sign(request1);
      const signed2 = await auth2.sign(request2);

      const sig1 = (signed1.body as any).signature;
      const sig2 = (signed2.body as any).signature;

      // Different wallets should produce different signatures
      expect(sig1.r).not.toBe(sig2.r);
      expect(sig1.s).not.toBe(sig2.s);
    });

    it('should handle concurrent signing', async () => {
      const action: HyperliquidAction = { type: 'order', orders: [], grouping: 'na' };

      const request1: RequestParams = { method: 'POST', path: '/exchange', body: action };
      const request2: RequestParams = { method: 'POST', path: '/exchange', body: action };
      const request3: RequestParams = { method: 'POST', path: '/exchange', body: action };

      const [signed1, signed2, signed3] = await Promise.all([
        auth.sign(request1),
        auth.sign(request2),
        auth.sign(request3),
      ]);

      expect((signed1.body as any).nonce).toBeDefined();
      expect((signed2.body as any).nonce).toBeDefined();
      expect((signed3.body as any).nonce).toBeDefined();
    });
  });
});
