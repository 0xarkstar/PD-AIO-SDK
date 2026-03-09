/**
 * Reya Auth Tests
 *
 * Tests EIP-712 signing: signOrderAction, signCancelAction,
 * getAddress, getHeaders, nonce incrementing.
 */

import { Wallet } from 'ethers';
import { ReyaAuth } from '../../../src/adapters/reya/ReyaAuth.js';

// Deterministic test private key (do NOT use in production)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('ReyaAuth', () => {
  let auth: ReyaAuth;
  let wallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet(TEST_PRIVATE_KEY);
    auth = new ReyaAuth(wallet);
  });

  // =========================================================================
  // getAddress
  // =========================================================================

  describe('getAddress', () => {
    test('returns wallet address', () => {
      const address = auth.getAddress();
      expect(address).toBe(wallet.address);
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  // =========================================================================
  // getHeaders
  // =========================================================================

  describe('getHeaders', () => {
    test('returns Content-Type header', () => {
      const headers = auth.getHeaders();
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });
  });

  // =========================================================================
  // sign
  // =========================================================================

  describe('sign', () => {
    test('returns request with headers when no body', async () => {
      const result = await auth.sign({ method: 'GET', path: '/test' });
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/test');
    });

    test('returns request with headers when body is present', async () => {
      const result = await auth.sign({
        method: 'POST',
        path: '/test',
        body: { key: 'value' },
      });
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    });
  });

  // =========================================================================
  // signOrderAction
  // =========================================================================

  describe('signOrderAction', () => {
    test('returns signature and nonce', async () => {
      const result = await auth.signOrderAction({ accountId: 123 });

      expect(result.signature).toBeDefined();
      expect(typeof result.signature).toBe('string');
      expect(result.signature).toMatch(/^0x/);
      expect(result.nonce).toBeDefined();
      expect(typeof result.nonce).toBe('string');
    });

    test('produces valid EIP-712 signature', async () => {
      const result = await auth.signOrderAction({ accountId: 1 });

      // EIP-712 signatures are 65 bytes = 130 hex chars + 0x prefix
      expect(result.signature.length).toBe(132);
    });

    test('increments nonce on each call', async () => {
      const r1 = await auth.signOrderAction({ accountId: 1 });
      const r2 = await auth.signOrderAction({ accountId: 1 });

      expect(BigInt(r2.nonce)).toBeGreaterThan(BigInt(r1.nonce));
    });

    test('accepts subAccountId in action', async () => {
      const result = await auth.signOrderAction({ accountId: 1, subAccountId: 2 });

      expect(result.signature).toBeDefined();
    });

    test('accepts deadline in action', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const result = await auth.signOrderAction({ accountId: 1, deadline });

      expect(result.signature).toBeDefined();
    });
  });

  // =========================================================================
  // signCancelAction
  // =========================================================================

  describe('signCancelAction', () => {
    test('returns signature and nonce', async () => {
      const result = await auth.signCancelAction(123, 'order-1');

      expect(result.signature).toMatch(/^0x/);
      expect(result.signature.length).toBe(132);
      expect(result.nonce).toBeDefined();
    });

    test('works without orderId for mass cancel', async () => {
      const result = await auth.signCancelAction(123);

      expect(result.signature).toMatch(/^0x/);
    });

    test('increments nonce on each call', async () => {
      const r1 = await auth.signCancelAction(1);
      const r2 = await auth.signCancelAction(1);

      expect(BigInt(r2.nonce)).toBeGreaterThan(BigInt(r1.nonce));
    });
  });

  // =========================================================================
  // getNextNonce
  // =========================================================================

  describe('getNextNonce', () => {
    test('returns incrementing nonce string', () => {
      const n1 = auth.getNextNonce();
      const n2 = auth.getNextNonce();

      expect(typeof n1).toBe('string');
      expect(BigInt(n2)).toBeGreaterThan(BigInt(n1));
    });
  });

  // =========================================================================
  // Nonce consistency across methods
  // =========================================================================

  describe('nonce consistency', () => {
    test('nonces from different methods are monotonically increasing', async () => {
      const r1 = await auth.signOrderAction({ accountId: 1 });
      const n2 = auth.getNextNonce();
      const r3 = await auth.signCancelAction(1);

      expect(BigInt(n2)).toBeGreaterThan(BigInt(r1.nonce));
      expect(BigInt(r3.nonce)).toBeGreaterThan(BigInt(n2));
    });
  });
});
