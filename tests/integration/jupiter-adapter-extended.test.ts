/**
 * Jupiter Adapter Integration Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JupiterAdapter } from '../../src/adapters/jupiter/JupiterAdapter.js';
import { NotSupportedError, NetworkError } from '../../src/types/errors.js';

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 123456,
    }),
    sendRawTransaction: jest.fn().mockResolvedValue('test-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    getTokenAccountsByOwner: jest.fn().mockResolvedValue({
      value: [
        {
          pubkey: { toBase58: () => 'test-token-account' },
          account: {
            data: Buffer.concat([
              Buffer.alloc(64), // mint (32) + owner (32)
              Buffer.from([0, 0, 0, 0, 0, 0, 0, 100]), // amount (8 bytes LE)
            ]),
          },
        },
      ],
    }),
  })),
  Keypair: {
    fromSecretKey: jest.fn((bytes: Uint8Array) => ({
      publicKey: {
        toBase58: jest.fn(() => 'test-public-key'),
        toBuffer: jest.fn(() => Buffer.alloc(32)),
      },
      secretKey: bytes,
      sign: jest.fn(() => Buffer.alloc(64)),
    })),
  },
  PublicKey: jest.fn().mockImplementation((str: string) => ({
    toBase58: jest.fn(() => str),
    toBuffer: jest.fn(() => Buffer.alloc(32)),
    findProgramAddress: jest.fn().mockResolvedValue([
      { toBase58: () => 'test-pda' },
      255,
    ]),
  })),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    sign: jest.fn(),
    serialize: jest.fn(() => Buffer.alloc(256)),
    feePayer: undefined,
  })),
  SystemProgram: {
    transfer: jest.fn(),
  },
}));

// Mock @noble/ed25519
jest.mock('@noble/ed25519', () => ({
  sign: jest.fn().mockResolvedValue(new Uint8Array(64)),
}));

// Mock HTTP requests for Pyth Network Hermes API (price source)
global.fetch = jest.fn((url: string) => {
  if (url.includes('hermes.pyth.network')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          parsed: [
            {
              id: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
              price: { price: '10050000000', expo: -8, conf: '1000000', publish_time: Math.floor(Date.now() / 1000) },
              ema_price: { price: '10050000000', expo: -8, conf: '1000000', publish_time: Math.floor(Date.now() / 1000) },
            },
          ],
        }),
    } as Response);
  }
  return Promise.reject(new Error('Not found'));
}) as jest.Mock;

describe('JupiterAdapter Integration', () => {
  let adapter: JupiterAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    adapter = new JupiterAdapter({
      privateKey: new Uint8Array(64).fill(1),
      rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    });
    await adapter.initialize();
  });

  afterEach(() => {
    if (adapter) {
      adapter.disconnect();
    }
  });

  test('should fetch markets (token pairs)', async () => {
    const markets = await adapter.fetchMarkets();

    expect(markets).toBeDefined();
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);

    const solMarket = markets.find(m => m.symbol === 'SOL/USD:USD');
    expect(solMarket).toBeDefined();
    expect(solMarket?.base).toBe('SOL');
    expect(solMarket?.quote).toBe('USD');
    expect(solMarket?.settle).toBe('USD');
    expect(solMarket?.active).toBe(true);
  });

  test('should create swap order', async () => {
    // Mock instruction builder methods
    const mockInstructionBuilder = {
      initialize: jest.fn().mockResolvedValue(undefined),
      resolvePositionAccounts: jest.fn().mockResolvedValue({
        pool: 'test-pool',
        custody: 'test-custody',
        collateralCustody: 'test-collateral-custody',
        ownerTokenAccount: 'test-token-account',
      }),
      buildOpenPositionInstruction: jest.fn().mockResolvedValue({
        keys: [],
        programId: 'test-program',
        data: Buffer.alloc(32),
      }),
    };

    // Mock SolanaClient methods
    const { Transaction } = await import('@solana/web3.js');
    const mockTransaction = new Transaction();

    const mockSolanaClient = {
      initialize: jest.fn().mockResolvedValue(undefined),
      createTransaction: jest.fn().mockResolvedValue(mockTransaction),
      addInstructions: jest.fn().mockResolvedValue(undefined),
      sendTransaction: jest.fn().mockResolvedValue({
        signature: 'test-tx-signature',
        slot: 123456,
      }),
    };

    // Inject mocks
    (adapter as any).instructionBuilder = mockInstructionBuilder;
    (adapter as any).solanaClient = mockSolanaClient;

    // Mock auth.getAssociatedTokenAddress
    const mockAuth = (adapter as any).auth;
    if (mockAuth) {
      mockAuth.getAssociatedTokenAddress = jest.fn().mockResolvedValue('test-token-account');
      mockAuth.getKeypair = jest.fn().mockReturnValue({
        publicKey: { toBase58: () => 'test-public-key' },
        secretKey: new Uint8Array(64),
      });
    }

    const order = await adapter.createOrder({
      symbol: 'SOL/USD:USD',
      side: 'buy',
      type: 'market',
      amount: 1.0,
      leverage: 5,
    });

    expect(order).toBeDefined();
    expect(order.symbol).toBe('SOL/USD:USD');
    expect(order.side).toBe('buy');
    expect(order.type).toBe('market');
    expect(order.status).toBe('closed');
    expect(order.filled).toBe(1.0);
    expect(order.info?.txSignature).toBe('test-tx-signature');
  });

  test('should cancel order (not supported)', async () => {
    await expect(adapter.cancelOrder('test-order-id')).rejects.toThrow(
      'Jupiter uses instant execution'
    );
  });

  test('should fetch balances', async () => {
    const balances = await adapter.fetchBalance();

    expect(balances).toBeDefined();
    expect(Array.isArray(balances)).toBe(true);

    const solBalance = balances.find(b => b.currency === 'SOL');
    expect(solBalance).toBeDefined();
    expect(solBalance?.total).toBe(1); // 1 SOL from mock

    const usdcBalance = balances.find(b => b.currency === 'USDC');
    expect(usdcBalance).toBeDefined();
  });

  test('should handle Solana RPC errors', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('RPC unavailable'))
    );

    const errorAdapter = new JupiterAdapter({
      rpcEndpoint: 'https://broken-rpc.example.com',
    });

    await expect(errorAdapter.initialize()).rejects.toThrow();
  });

  test('should handle Jupiter API rate limits', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Rate limit exceeded'))
    );

    const testAdapter = new JupiterAdapter();

    await expect(testAdapter.initialize()).rejects.toThrow();
  });

  test('should normalize Jupiter quote response', async () => {
    const ticker = await adapter.fetchTicker('SOL/USD:USD');

    expect(ticker).toBeDefined();
    expect(ticker.symbol).toBe('SOL/USD:USD');
    expect(ticker.last).toBe(100.5);
    expect(typeof ticker.timestamp).toBe('number');
  });

  test('should handle fetchOpenOrders (not supported)', async () => {
    const orders = await adapter.fetchOpenOrders();
    expect(orders).toEqual([]);
  });
});
