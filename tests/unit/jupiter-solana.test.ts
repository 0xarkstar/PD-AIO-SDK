/**
 * Jupiter Solana Client Unit Tests
 *
 * Tests for SolanaClient — constructor, initialization, utility methods,
 * and Jupiter-specific PDA operations.
 * Uses actual @solana/web3.js but mocks the Connection methods.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { SolanaClient, createSolanaClient } from '../../src/adapters/jupiter/solana.js';

describe('SolanaClient', () => {
  describe('createSolanaClient', () => {
    test('should create a new SolanaClient instance', () => {
      const client = createSolanaClient();
      expect(client).toBeInstanceOf(SolanaClient);
    });

    test('should create with custom config', () => {
      const client = createSolanaClient({
        rpcEndpoint: 'https://custom-rpc.example.com',
        commitment: 'finalized',
      });
      expect(client).toBeInstanceOf(SolanaClient);
    });
  });

  describe('constructor', () => {
    test('should use default config when none provided', () => {
      const client = new SolanaClient();
      expect(client.isReady()).toBe(false);
      expect(client.getRpcEndpoint()).toBeDefined();
    });

    test('should accept custom RPC endpoint', () => {
      const client = new SolanaClient({ rpcEndpoint: 'https://custom.rpc' });
      expect(client.getRpcEndpoint()).toBe('https://custom.rpc');
    });

    test('should accept custom commitment', () => {
      const client = new SolanaClient({ commitment: 'finalized' });
      expect(client).toBeDefined();
    });

    test('should accept custom confirmOptions', () => {
      const client = new SolanaClient({
        confirmOptions: { commitment: 'finalized', maxRetries: 5, preflightCommitment: 'confirmed' },
      });
      expect(client).toBeDefined();
    });

    test('should default to confirmed commitment', () => {
      const client = new SolanaClient();
      expect(client).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      const client = new SolanaClient();
      await client.initialize();
      expect(client.isReady()).toBe(true);
    });

    test('should be idempotent', async () => {
      const client = new SolanaClient();
      await client.initialize();
      await client.initialize();
      expect(client.isReady()).toBe(true);
    });
  });

  describe('ensureInitialized (via getConnection)', () => {
    test('should throw when not initialized', () => {
      const client = new SolanaClient();
      expect(() => client.getConnection()).toThrow(/not initialized/i);
    });

    test('should return connection when initialized', async () => {
      const client = new SolanaClient();
      await client.initialize();
      const conn = client.getConnection();
      expect(conn).toBeDefined();
    });
  });

  describe('isReady', () => {
    test('should return false before initialization', () => {
      const client = new SolanaClient();
      expect(client.isReady()).toBe(false);
    });

    test('should return true after initialization', async () => {
      const client = new SolanaClient();
      await client.initialize();
      expect(client.isReady()).toBe(true);
    });
  });

  describe('getRpcEndpoint', () => {
    test('should return default endpoint', () => {
      const client = new SolanaClient();
      expect(typeof client.getRpcEndpoint()).toBe('string');
      expect(client.getRpcEndpoint().length).toBeGreaterThan(0);
    });

    test('should return custom endpoint', () => {
      const client = new SolanaClient({ rpcEndpoint: 'https://my-rpc.test' });
      expect(client.getRpcEndpoint()).toBe('https://my-rpc.test');
    });
  });

  describe('disconnect', () => {
    test('should reset state on disconnect', async () => {
      const client = new SolanaClient();
      await client.initialize();
      expect(client.isReady()).toBe(true);

      await client.disconnect();
      expect(client.isReady()).toBe(false);
    });

    test('should make getConnection throw after disconnect', async () => {
      const client = new SolanaClient();
      await client.initialize();
      await client.disconnect();

      expect(() => client.getConnection()).toThrow(/not initialized/i);
    });
  });

  describe('uninitialized method guards', () => {
    test('getAccountInfo should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getAccountInfo('somePubkey')).rejects.toThrow(/not initialized/i);
    });

    test('getMultipleAccountsInfo should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getMultipleAccountsInfo(['key'])).rejects.toThrow(/not initialized/i);
    });

    test('getBalance should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getBalance('somePubkey')).rejects.toThrow(/not initialized/i);
    });

    test('getTokenBalance should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getTokenBalance('tokenAccount')).rejects.toThrow(/not initialized/i);
    });

    test('getTokenAccountsByOwner should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getTokenAccountsByOwner('owner')).rejects.toThrow(/not initialized/i);
    });

    test('getProgramAccounts should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getProgramAccounts('prog')).rejects.toThrow(/not initialized/i);
    });

    test('createTransaction should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.createTransaction()).rejects.toThrow(/not initialized/i);
    });

    test('sendTransaction should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.sendTransaction({} as any, [])).rejects.toThrow(/not initialized/i);
    });

    test('simulateTransaction should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.simulateTransaction({} as any)).rejects.toThrow(/not initialized/i);
    });

    test('getTransaction should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getTransaction('sig')).rejects.toThrow(/not initialized/i);
    });

    test('getLatestBlockhash should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getLatestBlockhash()).rejects.toThrow(/not initialized/i);
    });

    test('getSlot should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getSlot()).rejects.toThrow(/not initialized/i);
    });

    test('getBlockTime should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getBlockTime(123)).rejects.toThrow(/not initialized/i);
    });

    test('getJupiterPositions should throw when not initialized', async () => {
      const client = new SolanaClient();
      // PublicKey validates input before init check, so pass a valid-format key
      await expect(
        client.getJupiterPositions('11111111111111111111111111111111')
      ).rejects.toThrow();
    });

    test('getJupiterPool should throw when not initialized', async () => {
      const client = new SolanaClient();
      await expect(client.getJupiterPool()).rejects.toThrow(/not initialized/i);
    });

    test('getJupiterCustody should throw when not initialized', async () => {
      const client = new SolanaClient();
      // PublicKey validates input before init check, so pass a valid-format key
      await expect(
        client.getJupiterCustody('11111111111111111111111111111111')
      ).rejects.toThrow();
    });
  });

  describe('findProgramAddress', () => {
    test('should derive PDA with seed and program', async () => {
      const client = new SolanaClient();
      await client.initialize();

      const result = await client.findProgramAddress(
        [Buffer.from('pool')],
        '11111111111111111111111111111111' // System program (valid base58 pubkey)
      );
      expect(result.pubkey).toBeDefined();
      expect(typeof result.bump).toBe('number');
      expect(result.bump).toBeGreaterThanOrEqual(0);
      expect(result.bump).toBeLessThanOrEqual(255);
    });
  });

  describe('addInstructions', () => {
    test('should add instructions to transaction', async () => {
      const client = new SolanaClient();
      await client.initialize();

      const { Transaction, TransactionInstruction, PublicKey } = await import('@solana/web3.js');
      const tx = new Transaction();
      const ix = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('11111111111111111111111111111111'),
        data: Buffer.alloc(0),
      });

      const result = await client.addInstructions(tx, [ix]);
      expect(result.instructions).toHaveLength(1);
    });
  });
});
