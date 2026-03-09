/**
 * EtherealAuth Tests
 *
 * Tests for EIP-712 signing methods.
 */

import { EtherealAuth } from '../../../src/adapters/ethereal/EtherealAuth.js';

// Mock ethers Wallet
const mockSignTypedData = jest.fn().mockResolvedValue('0xmocksignature');
const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';

jest.mock('ethers', () => ({
  ethers: {
    Wallet: jest.fn(),
  },
  Wallet: jest.fn(),
}));

function createMockWallet() {
  return {
    address: mockAddress,
    signTypedData: mockSignTypedData,
  } as unknown as import('ethers').Wallet;
}

describe('EtherealAuth', () => {
  let auth: EtherealAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignTypedData.mockResolvedValue('0xmocksignature');
    auth = new EtherealAuth(createMockWallet());
  });

  // =========================================================================
  // getHeaders
  // =========================================================================

  describe('getHeaders', () => {
    test('returns Content-Type header', () => {
      const headers = auth.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  // =========================================================================
  // sign
  // =========================================================================

  describe('sign', () => {
    test('signs request without body', async () => {
      const request = {
        url: '/test',
        method: 'GET' as const,
      };

      const result = await auth.sign(request);
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    test('signs request with body', async () => {
      const request = {
        url: '/test',
        method: 'POST' as const,
        body: { key: 'value' },
      };

      const result = await auth.sign(request);
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    });
  });

  // =========================================================================
  // signOrderAction
  // =========================================================================

  describe('signOrderAction', () => {
    test('signs order action and returns signature + nonce', async () => {
      const result = await auth.signOrderAction({ accountId: 'acc-123' });

      expect(result.signature).toBe('0xmocksignature');
      expect(result.nonce).toBeDefined();
      expect(typeof result.nonce).toBe('string');
      expect(mockSignTypedData).toHaveBeenCalledTimes(1);
    });

    test('increments nonce on each call', async () => {
      const result1 = await auth.signOrderAction({ accountId: 'acc-123' });
      const result2 = await auth.signOrderAction({ accountId: 'acc-123' });

      expect(BigInt(result2.nonce)).toBeGreaterThan(BigInt(result1.nonce));
    });

    test('uses provided deadline if given', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 600;
      await auth.signOrderAction({ accountId: 'acc-123', deadline });

      const callArgs = mockSignTypedData.mock.calls[0];
      const message = callArgs[2];
      expect(message.deadline).toBe(BigInt(deadline));
    });

    test('sets default deadline when not provided', async () => {
      const before = Math.floor(Date.now() / 1000);
      await auth.signOrderAction({ accountId: 'acc-123' });

      const callArgs = mockSignTypedData.mock.calls[0];
      const message = callArgs[2];
      const deadline = Number(message.deadline);
      // Default deadline is now + 300 seconds
      expect(deadline).toBeGreaterThanOrEqual(before + 290);
      expect(deadline).toBeLessThanOrEqual(before + 310);
    });

    test('passes correct EIP-712 types for Order', async () => {
      await auth.signOrderAction({ accountId: 'acc-123' });

      const callArgs = mockSignTypedData.mock.calls[0];
      const types = callArgs[1];
      expect(types.Order).toEqual([
        { name: 'accountId', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ]);
    });

    test('passes correct domain', async () => {
      await auth.signOrderAction({ accountId: 'acc-123' });

      const callArgs = mockSignTypedData.mock.calls[0];
      const domain = callArgs[0];
      expect(domain.name).toBe('Ethereal');
      expect(domain.version).toBe('1');
    });
  });

  // =========================================================================
  // signCancelAction
  // =========================================================================

  describe('signCancelAction', () => {
    test('signs cancel action and returns signature + nonce', async () => {
      const result = await auth.signCancelAction('acc-123', 'order-456');

      expect(result.signature).toBe('0xmocksignature');
      expect(result.nonce).toBeDefined();
      expect(mockSignTypedData).toHaveBeenCalledTimes(1);
    });

    test('passes correct EIP-712 types for Cancel', async () => {
      await auth.signCancelAction('acc-123');

      const callArgs = mockSignTypedData.mock.calls[0];
      const types = callArgs[1];
      expect(types.Cancel).toEqual([
        { name: 'accountId', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ]);
    });

    test('includes accountId in message', async () => {
      await auth.signCancelAction('acc-999');

      const callArgs = mockSignTypedData.mock.calls[0];
      const message = callArgs[2];
      expect(message.accountId).toBe('acc-999');
    });
  });

  // =========================================================================
  // getAddress
  // =========================================================================

  describe('getAddress', () => {
    test('returns wallet address', () => {
      expect(auth.getAddress()).toBe(mockAddress);
    });
  });

  // =========================================================================
  // getNextNonce
  // =========================================================================

  describe('getNextNonce', () => {
    test('returns incremented nonce as string', () => {
      const nonce1 = auth.getNextNonce();
      const nonce2 = auth.getNextNonce();
      expect(BigInt(nonce2)).toBeGreaterThan(BigInt(nonce1));
    });
  });
});
