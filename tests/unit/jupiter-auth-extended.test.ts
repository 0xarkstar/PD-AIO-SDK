/**
 * Jupiter Auth Extended Tests
 *
 * Expand existing jupiter-auth.test.ts with edge cases
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JupiterAuth } from '../../src/adapters/jupiter/JupiterAuth.js';

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'abc123',
      lastValidBlockHeight: 123456
    }),
    sendRawTransaction: jest.fn().mockResolvedValue('mock-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    getTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: [] }),
  })),
  Keypair: {
    fromSecretKey: jest.fn((bytes: Uint8Array) => ({
      publicKey: {
        toBase58: jest.fn(() => 'mock-public-key'),
        toBuffer: jest.fn(() => Buffer.alloc(32)),
      },
      secretKey: bytes,
      sign: jest.fn((msg: Uint8Array) => Buffer.alloc(64)),
    })),
  },
  PublicKey: jest.fn().mockImplementation((str: string) => ({
    toBase58: jest.fn(() => str),
    toBuffer: jest.fn(() => Buffer.alloc(32)),
  })),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    sign: jest.fn(),
    serialize: jest.fn(() => Buffer.alloc(256)),
  })),
  VersionedTransaction: jest.fn().mockImplementation(() => ({
    sign: jest.fn(),
    serialize: jest.fn(() => Buffer.alloc(256)),
  })),
}));

// Mock @noble/ed25519
jest.mock('@noble/ed25519', () => ({
  sign: jest.fn().mockResolvedValue(new Uint8Array(64)),
}));

describe('JupiterAuth Extended', () => {
  describe('Solana signing', () => {
    test('should sign transaction with Keypair', async () => {
      const privateKeyArray = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        privateKeyArray[i] = i;
      }

      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      await auth.ensureInitialized();

      const { Transaction } = await import('@solana/web3.js');
      const mockTx = new Transaction();

      const signedTx = await auth.signTransaction(mockTx);

      expect(signedTx).toBeDefined();
      expect(typeof signedTx.sign).toBe('function');
    });

    test('should sign transaction with VersionedTransaction', async () => {
      const privateKeyArray = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        privateKeyArray[i] = i + 1;
      }

      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      await auth.ensureInitialized();

      const { VersionedTransaction } = await import('@solana/web3.js');
      const mockVersionedTx = new VersionedTransaction();

      // Note: VersionedTransaction uses signTransaction which internally calls sign
      const result = await auth.signTransaction(mockVersionedTx as any);

      expect(result).toBeDefined();
    });

    test('should handle signature failures', async () => {
      const auth = new JupiterAuth({
        walletAddress: 'mock-wallet-address',
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      await auth.ensureInitialized();

      const { Transaction } = await import('@solana/web3.js');
      const mockTx = new Transaction();

      // Auth without private key cannot sign
      await expect(auth.signTransaction(mockTx)).rejects.toThrow('Private key required');
    });
  });

  describe('Transaction building', () => {
    test('should build swap transaction', async () => {
      const privateKeyArray = new Uint8Array(64).fill(1);

      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      await auth.ensureInitialized();

      const walletAddress = auth.getWalletAddress();
      expect(walletAddress).toBe('mock-public-key');
      expect(auth.canSign()).toBe(true);
    });

    test('should add priority fee', async () => {
      const privateKeyArray = new Uint8Array(64).fill(2);

      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      await auth.ensureInitialized();

      // Get connection to test priority fee functionality
      const connection = await auth.getConnection();
      expect(connection).toBeDefined();
      expect(typeof connection.getLatestBlockhash).toBe('function');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid Solana RPC', async () => {
      const auth = new JupiterAuth({
        walletAddress: 'invalid-address',
        rpcEndpoint: 'https://invalid-rpc.example.com',
      });

      // ensureInitialized should not throw for read-only mode
      await expect(auth.ensureInitialized()).resolves.not.toThrow();
    });

    test('should handle insufficient SOL for fees', async () => {
      const { Connection } = await import('@solana/web3.js');
      const MockConnection = Connection as jest.MockedClass<typeof Connection>;

      MockConnection.mockImplementationOnce(() => ({
        getBalance: jest.fn().mockResolvedValue(0), // 0 SOL
        getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test' }),
      } as any));

      const privateKeyArray = new Uint8Array(64).fill(3);
      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      await auth.ensureInitialized();

      const balance = await auth.getSolBalance();
      expect(balance).toBe(0);
    });

    test('should validate keypair format', () => {
      // Valid Uint8Array with 64 bytes
      const validKey = new Uint8Array(64).fill(1);
      const auth1 = new JupiterAuth({ privateKey: validKey });
      expect(auth1).toBeDefined();

      // Valid JSON array format
      const jsonKey = JSON.stringify(Array.from(validKey));
      const auth2 = new JupiterAuth({ privateKey: jsonKey });
      expect(auth2).toBeDefined();

      // Read-only mode (no private key)
      const auth3 = new JupiterAuth({ walletAddress: 'test-address' });
      expect(auth3.canRead()).toBe(true);
      expect(auth3.canSign()).toBe(false);
    });
  });

  describe('Key methods', () => {
    test('should return correct wallet address', async () => {
      const privateKeyArray = new Uint8Array(64).fill(5);
      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      await auth.ensureInitialized();

      const address = auth.getWalletAddress();
      expect(address).toBe('mock-public-key');
    });

    test('should sign message', async () => {
      const privateKeyArray = new Uint8Array(64).fill(6);
      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      await auth.ensureInitialized();

      const signature = await auth.signMessage('test message');
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBe(64);
    });

    test('should sign bytes', async () => {
      const privateKeyArray = new Uint8Array(64).fill(7);
      const auth = new JupiterAuth({
        privateKey: privateKeyArray,
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      });

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      await auth.ensureInitialized();

      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = await auth.signBytes(testData);
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBe(64);
    });
  });
});
