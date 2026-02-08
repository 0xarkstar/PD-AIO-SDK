/**
 * Drift Auth Integration Tests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DriftAuth } from '../../src/adapters/drift/DriftAuth.js';
import type { DriftAuthConfig } from '../../src/adapters/drift/DriftAuth.js';

// Mock @solana/web3.js
const mockConnection = {
  getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL in lamports
  getTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: [] }),
  confirmTransaction: jest.fn().mockResolvedValue({ context: { slot: 12345 } }),
};

const mockKeypair = {
  publicKey: {
    toBase58: () => 'TestPublicKey123',
    toString: () => 'TestPublicKey123',
  },
  secretKey: new Uint8Array(64).fill(1),
};

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => mockConnection),
  Keypair: {
    fromSecretKey: jest.fn(() => mockKeypair),
  },
  PublicKey: jest.fn().mockImplementation((str) => ({
    toBase58: () => str,
    toString: () => str,
  })),
}));

// Mock @noble/ed25519
jest.mock('@noble/ed25519', () => ({
  sign: jest.fn().mockResolvedValue(new Uint8Array(64)),
}));

describe('DriftAuth Integration', () => {
  let auth: DriftAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  test('should connect with Solana keypair', async () => {
    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);
    await auth.ensureInitialized();

    // Wait a bit for async keypair initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(auth.getWalletAddress()).toBeDefined();
    expect(auth.canSign()).toBe(true);
  });

  test('should initialize with wallet address only (read-only)', () => {
    const config: DriftAuthConfig = {
      walletAddress: 'TestPublicKey123',
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    expect(auth.getWalletAddress()).toBe('TestPublicKey123');
    expect(auth.canRead()).toBe(true);
    expect(auth.canSign()).toBe(false);
  });

  test('should handle devnet vs mainnet RPC endpoints', () => {
    const devnetAuth = new DriftAuth({
      walletAddress: 'test',
      isDevnet: true,
    });

    const mainnetAuth = new DriftAuth({
      walletAddress: 'test',
      isDevnet: false,
    });

    expect(devnetAuth.getRpcEndpoint()).toContain('devnet');
    expect(mainnetAuth.getRpcEndpoint()).not.toContain('devnet');
  });

  // ============================================================================
  // Signing
  // ============================================================================

  test('should sign transaction', async () => {
    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);
    await auth.ensureInitialized();

    // Wait a bit for async keypair initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    const message = 'test message';
    const signature = await auth.signMessage(message);

    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);
  });

  test('should sign bytes', async () => {
    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);
    await auth.ensureInitialized();

    // Wait a bit for async initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    const bytes = new Uint8Array([1, 2, 3, 4]);
    const signature = await auth.signBytes(bytes);

    expect(signature).toBeInstanceOf(Uint8Array);
  });

  test('should throw error when signing without private key', async () => {
    const config: DriftAuthConfig = {
      walletAddress: 'TestPublicKey123',
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    await expect(auth.signMessage('test')).rejects.toThrow(/Private key required/);
  });

  // ============================================================================
  // Account Management
  // ============================================================================

  test('should manage sub-account IDs', () => {
    const config: DriftAuthConfig = {
      walletAddress: 'TestPublicKey123',
      subAccountId: 2,
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    expect(auth.getSubAccountId()).toBe(2);
  });

  test('should default to sub-account 0', () => {
    const config: DriftAuthConfig = {
      walletAddress: 'TestPublicKey123',
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    expect(auth.getSubAccountId()).toBe(0);
  });

  test('should provide user account info', () => {
    const config: DriftAuthConfig = {
      walletAddress: 'TestPublicKey123',
      subAccountId: 1,
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    const accountInfo = auth.getUserAccountInfo();

    expect(accountInfo).toBeDefined();
    expect(accountInfo?.authority).toBe('TestPublicKey123');
    expect(accountInfo?.subAccountId).toBe(1);
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  test('should handle connection errors', async () => {
    mockConnection.getBalance.mockRejectedValueOnce(new Error('RPC error'));

    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);
    await auth.ensureInitialized();

    await expect(auth.getSolBalance()).rejects.toThrow('RPC error');
  });

  test('should handle invalid keypair format', () => {
    const config: DriftAuthConfig = {
      privateKey: 'invalid-format',
      subAccountId: 0,
      isDevnet: true,
    };

    // DriftAuth handles invalid private keys gracefully - logs warning but doesn't throw
    auth = new DriftAuth(config);

    expect(auth.canSign()).toBe(false);
  });

  test('should handle missing wallet address for read operations', () => {
    const config: DriftAuthConfig = {
      // No privateKey or walletAddress
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    expect(auth.canRead()).toBe(false);
    expect(auth.getWalletAddress()).toBeUndefined();
  });

  // ============================================================================
  // Balance Queries
  // ============================================================================

  test('should fetch SOL balance', async () => {
    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);
    await auth.ensureInitialized();

    // Wait a bit for async keypair initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    const balance = await auth.getSolBalance();

    expect(balance).toBe(1); // 1000000000 lamports = 1 SOL
    expect(mockConnection.getBalance).toHaveBeenCalled();
  });

  test('should fetch token balance', async () => {
    mockConnection.getTokenAccountsByOwner.mockResolvedValueOnce({
      value: [
        {
          account: {
            data: Buffer.concat([
              Buffer.alloc(64), // mint
              Buffer.from([0, 0, 0, 0, 0, 0, 0, 10]), // amount (10 in little-endian)
            ]),
          },
        },
      ],
    });

    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);
    await auth.ensureInitialized();

    const balance = await auth.getTokenBalance('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    expect(balance).toBeGreaterThan(0);
  });

  // ============================================================================
  // HTTP Request Signing (Drift uses on-chain, not HTTP)
  // ============================================================================

  test('should return empty headers for Drift (on-chain signing)', () => {
    const config: DriftAuthConfig = {
      privateKey: JSON.stringify(Array(64).fill(1)),
      subAccountId: 0,
      isDevnet: true,
    };

    auth = new DriftAuth(config);

    const headers = auth.getHeaders();

    expect(headers).toEqual({}); // Drift doesn't use HTTP headers for auth
  });
});
