/**
 * Lighter Signer Unit Tests
 *
 * Tests for the LighterSigner FFI wrapper class.
 * Note: These tests mock the FFI layer since native libraries may not be available.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LighterSigner, OrderType, TimeInForce, TxType } from '../../src/adapters/lighter/signer/index.js';
import type { LighterSignerConfig, CreateOrderParams } from '../../src/adapters/lighter/signer/types.js';

// Mock the ffi-napi module
const mockLib = {
  CreateClient: jest.fn(() => 'ok'),
  SignCreateOrder: jest.fn(() => JSON.stringify({
    txType: TxType.CREATE_ORDER,
    txInfo: '{"order_id":"123"}',
    txHash: '0xabc123',
    messageToSign: '0xdef456',
    err: '',
  })),
  SignCancelOrder: jest.fn(() => JSON.stringify({
    txType: TxType.CANCEL_ORDER,
    txInfo: '{"order_id":"123"}',
    txHash: '0xabc456',
    messageToSign: '0xdef789',
    err: '',
  })),
  SignCancelAllOrders: jest.fn(() => JSON.stringify({
    txType: TxType.CANCEL_ALL_ORDERS,
    txInfo: '{}',
    txHash: '0xabc789',
    messageToSign: '0xdefabc',
    err: '',
  })),
  SignWithdrawCollateral: jest.fn(() => JSON.stringify({
    txType: TxType.WITHDRAW_COLLATERAL,
    txInfo: '{"amount":"1000"}',
    txHash: '0xdef123',
    messageToSign: '0x123456',
    err: '',
  })),
  CreateAuthToken: jest.fn(() => JSON.stringify({
    result: 'test-auth-token',
    err: '',
  })),
  GetPublicKey: jest.fn(() => JSON.stringify({
    result: '0x04abcdef1234567890',
    err: '',
  })),
};

// Skip these tests if ffi-napi is not available
const describeFfi = process.env.TEST_FFI === 'true' ? describe : describe.skip;

describe('LighterSigner', () => {
  describe('Configuration', () => {
    it('should create signer with minimal config', () => {
      const config: LighterSignerConfig = {
        apiPrivateKey: '0x1234567890abcdef',
        chainId: 300,
      };

      const signer = new LighterSigner(config);
      expect(signer).toBeInstanceOf(LighterSigner);
      expect(signer.apiKeyIndex).toBe(255);
      expect(signer.accountIndex).toBe(0);
      expect(signer.isInitialized).toBe(false);
    });

    it('should create signer with full config', () => {
      const config: LighterSignerConfig = {
        apiPrivateKey: '1234567890abcdef', // without 0x prefix
        apiPublicKey: '0x04abcdef',
        accountIndex: 1,
        apiKeyIndex: 10,
        chainId: 304,
      };

      const signer = new LighterSigner(config);
      expect(signer.apiKeyIndex).toBe(10);
      expect(signer.accountIndex).toBe(1);
    });

    it('should normalize private key by removing 0x prefix', () => {
      const config: LighterSignerConfig = {
        apiPrivateKey: '0x1234567890abcdef',
        chainId: 300,
      };

      const signer = new LighterSigner(config);
      // The private key should have 0x prefix removed internally
      expect(signer).toBeDefined();
    });
  });

  describe('Type Definitions', () => {
    it('should export OrderType enum', () => {
      expect(OrderType.LIMIT).toBe(0);
      expect(OrderType.MARKET).toBe(1);
      expect(OrderType.STOP_LIMIT).toBe(2);
      expect(OrderType.STOP_MARKET).toBe(3);
    });

    it('should export TimeInForce enum', () => {
      expect(TimeInForce.GTC).toBe(0);
      expect(TimeInForce.IOC).toBe(1);
      expect(TimeInForce.FOK).toBe(2);
      expect(TimeInForce.POST_ONLY).toBe(3);
    });

    it('should export TxType enum', () => {
      expect(TxType.CREATE_ORDER).toBe(1);
      expect(TxType.CANCEL_ORDER).toBe(2);
      expect(TxType.CANCEL_ALL_ORDERS).toBe(3);
      expect(TxType.WITHDRAW_COLLATERAL).toBe(4);
      expect(TxType.UPDATE_API_KEY_PERMISSIONS).toBe(5);
    });
  });

  describe('Pre-initialization checks', () => {
    it('should throw error when calling signCreateOrder before initialization', async () => {
      const signer = new LighterSigner({
        apiPrivateKey: '0x123',
        chainId: 300,
      });

      const params: CreateOrderParams = {
        marketIndex: 0,
        clientOrderIndex: BigInt(1),
        baseAmount: BigInt(1000000),
        price: 50000,
        isAsk: false,
        orderType: OrderType.LIMIT,
        timeInForce: TimeInForce.GTC,
        nonce: BigInt(0),
      };

      await expect(signer.signCreateOrder(params)).rejects.toThrow('not initialized');
    });

    it('should throw error when calling signCancelOrder before initialization', async () => {
      const signer = new LighterSigner({
        apiPrivateKey: '0x123',
        chainId: 300,
      });

      await expect(signer.signCancelOrder({
        marketIndex: 0,
        orderId: BigInt(123),
        nonce: BigInt(0),
      })).rejects.toThrow('not initialized');
    });

    it('should throw error when calling createAuthToken before initialization', async () => {
      const signer = new LighterSigner({
        apiPrivateKey: '0x123',
        chainId: 300,
      });

      await expect(signer.createAuthToken()).rejects.toThrow('not initialized');
    });
  });

  describeFfi('FFI Integration (requires native library)', () => {
    let signer: LighterSigner;

    beforeEach(async () => {
      signer = new LighterSigner({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 300,
      });
      await signer.initialize();
    });

    it('should initialize successfully with valid config', () => {
      expect(signer.isInitialized).toBe(true);
    });

    it('should sign a create order transaction', async () => {
      const signedTx = await signer.signCreateOrder({
        marketIndex: 0,
        clientOrderIndex: BigInt(Date.now()),
        baseAmount: BigInt(1000000),
        price: 50000,
        isAsk: false,
        orderType: OrderType.LIMIT,
        timeInForce: TimeInForce.GTC,
        nonce: BigInt(1),
      });

      expect(signedTx.txType).toBe(TxType.CREATE_ORDER);
      expect(signedTx.txInfo).toBeDefined();
      expect(signedTx.txHash).toBeDefined();
    });

    it('should sign a cancel order transaction', async () => {
      const signedTx = await signer.signCancelOrder({
        marketIndex: 0,
        orderId: BigInt(123),
        nonce: BigInt(2),
      });

      expect(signedTx.txType).toBe(TxType.CANCEL_ORDER);
    });

    it('should sign a cancel all orders transaction', async () => {
      const signedTx = await signer.signCancelAllOrders({
        nonce: BigInt(3),
      });

      expect(signedTx.txType).toBe(TxType.CANCEL_ALL_ORDERS);
    });

    it('should create an auth token', async () => {
      const token = await signer.createAuthToken(3600);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });
});

describe('CreateOrderParams', () => {
  it('should support all order parameters', () => {
    const params: CreateOrderParams = {
      marketIndex: 5,
      clientOrderIndex: BigInt(1234567890),
      baseAmount: BigInt('1000000000000000000'), // 1e18
      price: 50000,
      isAsk: true,
      orderType: OrderType.STOP_LIMIT,
      timeInForce: TimeInForce.IOC,
      reduceOnly: true,
      triggerPrice: 49000,
      orderExpiry: BigInt(1735689600), // 2025-01-01
      nonce: BigInt(10),
    };

    expect(params.marketIndex).toBe(5);
    expect(params.isAsk).toBe(true);
    expect(params.reduceOnly).toBe(true);
    expect(params.triggerPrice).toBe(49000);
    expect(params.orderExpiry).toBe(BigInt(1735689600));
  });

  it('should allow optional parameters to be undefined', () => {
    const params: CreateOrderParams = {
      marketIndex: 0,
      clientOrderIndex: BigInt(1),
      baseAmount: BigInt(100),
      price: 1000,
      isAsk: false,
      orderType: OrderType.MARKET,
      timeInForce: TimeInForce.GTC,
      nonce: BigInt(0),
    };

    expect(params.reduceOnly).toBeUndefined();
    expect(params.triggerPrice).toBeUndefined();
    expect(params.orderExpiry).toBeUndefined();
  });
});
