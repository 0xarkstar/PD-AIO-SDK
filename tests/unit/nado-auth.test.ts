/**
 * Unit Tests for NadoAuth
 *
 * Tests EIP-712 signing, nonce management, and helper methods.
 */

import { Wallet, ethers } from 'ethers';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NadoAuth } from '../../src/adapters/nado/NadoAuth.js';
import type { NadoEIP712Order, NadoEIP712Cancellation, NadoEIP712StreamAuth } from '../../src/adapters/nado/types.js';
import { PerpDEXError } from '../../src/types/errors.js';

describe('NadoAuth', () => {
  let wallet: Wallet;
  let auth: NadoAuth;
  const testChainId = 763373; // Ink testnet
  const testPrivateKey = '0x' + '1'.repeat(64); // Test private key

  beforeEach(() => {
    wallet = new Wallet(testPrivateKey);
    auth = new NadoAuth(wallet, testChainId);
  });

  // ===========================================================================
  // Constructor & Basic Methods
  // ===========================================================================

  describe('constructor', () => {
    it('should initialize with wallet and chain ID', () => {
      expect(auth.getAddress()).toBe(wallet.address);
      expect(auth.getChainId()).toBe(testChainId);
      expect(auth.getCurrentNonce()).toBe(0);
    });
  });

  describe('getAddress', () => {
    it('should return wallet address', () => {
      expect(auth.getAddress()).toBe(wallet.address);
      expect(auth.getAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('getChainId', () => {
    it('should return chain ID', () => {
      expect(auth.getChainId()).toBe(testChainId);
    });
  });

  // ===========================================================================
  // Nonce Management
  // ===========================================================================

  describe('nonce management', () => {
    describe('getCurrentNonce', () => {
      it('should return current nonce without incrementing', () => {
        expect(auth.getCurrentNonce()).toBe(0);
        expect(auth.getCurrentNonce()).toBe(0); // Should not increment
      });
    });

    describe('getNextNonce', () => {
      it('should return current nonce and increment', () => {
        expect(auth.getNextNonce()).toBe(0);
        expect(auth.getNextNonce()).toBe(1);
        expect(auth.getNextNonce()).toBe(2);
      });

      it('should properly increment over multiple calls', () => {
        const nonces = [0, 1, 2, 3, 4].map(() => auth.getNextNonce());
        expect(nonces).toEqual([0, 1, 2, 3, 4]);
        expect(auth.getCurrentNonce()).toBe(5);
      });
    });

    describe('setNonce', () => {
      it('should set nonce to specified value', () => {
        auth.setNonce(100);
        expect(auth.getCurrentNonce()).toBe(100);
      });

      it('should allow setting nonce to 0', () => {
        auth.getNextNonce(); // Increment to 1
        auth.setNonce(0);
        expect(auth.getCurrentNonce()).toBe(0);
      });

      it('should throw on negative nonce', () => {
        expect(() => auth.setNonce(-1)).toThrow(PerpDEXError);
        expect(() => auth.setNonce(-1)).toThrow('Nonce must be a non-negative integer');
      });

      it('should throw on non-integer nonce', () => {
        expect(() => auth.setNonce(1.5)).toThrow(PerpDEXError);
        expect(() => auth.setNonce(1.5)).toThrow('Nonce must be a non-negative integer');
      });
    });

    describe('incrementNonce', () => {
      it('should increment nonce by 1 by default', () => {
        auth.setNonce(10);
        auth.incrementNonce();
        expect(auth.getCurrentNonce()).toBe(11);
      });

      it('should increment nonce by specified amount', () => {
        auth.setNonce(10);
        auth.incrementNonce(5);
        expect(auth.getCurrentNonce()).toBe(15);
      });

      it('should throw on negative increment', () => {
        expect(() => auth.incrementNonce(-1)).toThrow(PerpDEXError);
        expect(() => auth.incrementNonce(-1)).toThrow('Increment amount must be a non-negative integer');
      });

      it('should throw on non-integer increment', () => {
        expect(() => auth.incrementNonce(1.5)).toThrow(PerpDEXError);
      });
    });
  });

  // ===========================================================================
  // EIP-712 Signing
  // ===========================================================================

  describe('signOrder', () => {
    it('should generate valid EIP-712 signature for order', async () => {
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.01', 18).toString(),
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: auth.getNextNonce(),
        appendix: {
          productId: 2,
          side: 0, // buy
          reduceOnly: false,
          postOnly: true,
        },
      };

      const signature = await auth.signOrder(order, 2);

      // Signature should be 0x-prefixed hex of 132 chars (65 bytes)
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(signature.length).toBe(132);
    });

    it('should use correct domain for product ID', async () => {
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: '1000000000000000000',
        amount: '100000000000000000',
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: 0,
        appendix: {
          productId: 5,
          side: 1,
          reduceOnly: false,
          postOnly: false,
        },
      };

      // Should not throw
      const signature = await auth.signOrder(order, 5);
      expect(signature).toBeDefined();
    });

    it('should throw on invalid product ID', async () => {
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: '1000000000000000000',
        amount: '100000000000000000',
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: 0,
        appendix: {
          productId: -1,
          side: 0,
          reduceOnly: false,
          postOnly: false,
        },
      };

      await expect(auth.signOrder(order, -1)).rejects.toThrow(PerpDEXError);
      await expect(auth.signOrder(order, -1)).rejects.toThrow('Invalid product ID');
    });

    it('should throw on non-integer product ID', async () => {
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: '1000000000000000000',
        amount: '100000000000000000',
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: 0,
        appendix: {
          productId: 1.5,
          side: 0,
          reduceOnly: false,
          postOnly: false,
        },
      };

      await expect(auth.signOrder(order, 1.5)).rejects.toThrow(PerpDEXError);
    });
  });

  describe('signCancellation', () => {
    const endpointAddress = '0x' + '2'.repeat(40);

    it('should generate valid EIP-712 signature for cancellation', async () => {
      const cancellation: NadoEIP712Cancellation = {
        sender: wallet.address,
        productIds: [2, 3],
        digests: [
          '0x' + '1'.repeat(64),
          '0x' + '2'.repeat(64),
        ],
        nonce: auth.getNextNonce(),
      };

      const signature = await auth.signCancellation(cancellation, endpointAddress);

      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(signature.length).toBe(132);
    });

    it('should handle empty product IDs and digests', async () => {
      const cancellation: NadoEIP712Cancellation = {
        sender: wallet.address,
        productIds: [],
        digests: [],
        nonce: auth.getNextNonce(),
      };

      const signature = await auth.signCancellation(cancellation, endpointAddress);
      expect(signature).toBeDefined();
    });
  });

  describe('signStreamAuth', () => {
    const endpointAddress = '0x' + '3'.repeat(40);

    it('should generate valid EIP-712 signature for stream auth', async () => {
      const streamAuth: NadoEIP712StreamAuth = {
        sender: wallet.address,
        expiration: Math.floor(Date.now() / 1000) + 3600,
      };

      const signature = await auth.signStreamAuth(streamAuth, endpointAddress);

      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(signature.length).toBe(132);
    });

    it('should handle different expiration times', async () => {
      const now = Math.floor(Date.now() / 1000);
      const streamAuth1: NadoEIP712StreamAuth = {
        sender: wallet.address,
        expiration: now + 60,
      };
      const streamAuth2: NadoEIP712StreamAuth = {
        sender: wallet.address,
        expiration: now + 3600,
      };

      const sig1 = await auth.signStreamAuth(streamAuth1, endpointAddress);
      const sig2 = await auth.signStreamAuth(streamAuth2, endpointAddress);

      // Different expiration should produce different signatures
      expect(sig1).not.toBe(sig2);
    });
  });

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  describe('productIdToVerifyingContract', () => {
    it('should convert product ID 0 to correct address', async () => {
      // Test by signing an order with product ID 0
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: '1000000000000000000',
        amount: '100000000000000000',
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: 0,
        appendix: {
          productId: 0,
          side: 0,
          reduceOnly: false,
          postOnly: false,
        },
      };

      const signature = await auth.signOrder(order, 0);
      expect(signature).toBeDefined();
    });

    it('should convert product ID 2 to correct address', async () => {
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: '1000000000000000000',
        amount: '100000000000000000',
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: 0,
        appendix: {
          productId: 2,
          side: 0,
          reduceOnly: false,
          postOnly: false,
        },
      };

      const signature = await auth.signOrder(order, 2);
      expect(signature).toBeDefined();
    });

    it('should convert large product ID correctly', async () => {
      const largeProductId = 999999;
      const order: NadoEIP712Order = {
        sender: wallet.address,
        priceX18: '1000000000000000000',
        amount: '100000000000000000',
        expiration: Math.floor(Date.now() / 1000) + 3600,
        nonce: 0,
        appendix: {
          productId: largeProductId,
          side: 0,
          reduceOnly: false,
          postOnly: false,
        },
      };

      const signature = await auth.signOrder(order, largeProductId);
      expect(signature).toBeDefined();
    });
  });

  // ===========================================================================
  // Integration-style Tests
  // ===========================================================================

  describe('full order lifecycle', () => {
    it('should sign multiple orders with incrementing nonces', async () => {
      const orders: NadoEIP712Order[] = [];
      const signatures: string[] = [];

      for (let i = 0; i < 5; i++) {
        const order: NadoEIP712Order = {
          sender: wallet.address,
          priceX18: ethers.parseUnits((80000 + i * 100).toString(), 18).toString(),
          amount: ethers.parseUnits('0.01', 18).toString(),
          expiration: Math.floor(Date.now() / 1000) + 3600,
          nonce: auth.getNextNonce(),
          appendix: {
            productId: 2,
            side: i % 2, // Alternate buy/sell
            reduceOnly: false,
            postOnly: true,
          },
        };

        orders.push(order);
        signatures.push(await auth.signOrder(order, 2));
      }

      // All signatures should be unique
      const uniqueSignatures = new Set(signatures);
      expect(uniqueSignatures.size).toBe(5);

      // Nonces should be 0, 1, 2, 3, 4
      expect(orders.map(o => o.nonce)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('nonce synchronization scenario', () => {
    it('should allow resetting nonce after fetching from API', () => {
      // Simulate local nonce getting out of sync
      auth.getNextNonce(); // 0
      auth.getNextNonce(); // 1
      auth.getNextNonce(); // 2

      // Simulate fetching nonce from API
      const onChainNonce = 10;
      auth.setNonce(onChainNonce);

      // Next nonce should be 10
      expect(auth.getNextNonce()).toBe(10);
      expect(auth.getNextNonce()).toBe(11);
    });
  });
});
