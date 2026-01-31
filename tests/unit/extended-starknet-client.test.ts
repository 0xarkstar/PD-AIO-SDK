/**
 * ExtendedStarkNetClient Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExtendedStarkNetClient } from '../../src/adapters/extended/ExtendedStarkNetClient.js';

// Mock starknet library
jest.mock('starknet', () => {
  const mockAccount = {
    address: '0x123',
    execute: jest.fn().mockResolvedValue({ transaction_hash: '0xabc' }),
    estimateInvokeFee: jest.fn().mockResolvedValue({ overall_fee: '1000000' }),
  };

  // Mock the receipt response with starknet.js v8 helper methods
  const mockSuccessReceipt = {
    execution_status: 'SUCCEEDED',
    type: 'INVOKE',
    block_number: 12340,
    statusReceipt: 'SUCCEEDED',
    isSuccess: () => true,
    isReverted: () => false,
    isError: () => false,
  };

  return {
    Account: jest.fn().mockImplementation(() => mockAccount),
    RpcProvider: jest.fn().mockImplementation(() => ({
      getBlock: jest.fn().mockResolvedValue({ block_number: 12345 }),
      getNonceForAddress: jest.fn().mockResolvedValue('0x5'),
      getTransactionReceipt: jest.fn().mockResolvedValue(mockSuccessReceipt),
      callContract: jest.fn().mockResolvedValue(['1000000000000000000']),
      getClassHashAt: jest.fn().mockResolvedValue('0xclasshash'),
    })),
    Contract: jest.fn(),
    CallData: {
      compile: jest.fn((data) => Object.values(data).map(String)),
    },
  };
});

describe('ExtendedStarkNetClient', () => {
  describe('constructor', () => {
    it('should initialize without account credentials', () => {
      const client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });

      expect(client.isAccountInitialized()).toBe(false);
      expect(client.getAccountAddress()).toBeUndefined();
    });

    it('should initialize with account credentials', () => {
      const client = new ExtendedStarkNetClient({
        network: 'mainnet',
        privateKey: '0xprivatekey',
        accountAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      });

      expect(client.isAccountInitialized()).toBe(true);
    });

    it('should use default RPC URL for mainnet', () => {
      const client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });

      expect(client).toBeDefined();
    });

    it('should use default RPC URL for testnet', () => {
      const client = new ExtendedStarkNetClient({
        network: 'testnet',
      });

      expect(client).toBeDefined();
    });

    it('should use custom RPC URL when provided', () => {
      const client = new ExtendedStarkNetClient({
        network: 'mainnet',
        rpcUrl: 'https://custom-rpc.example.com',
      });

      expect(client).toBeDefined();
    });
  });

  describe('getBlockNumber', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });
    });

    it('should return current block number', async () => {
      const blockNumber = await client.getBlockNumber();

      expect(blockNumber).toBe(12345);
    });
  });

  describe('getAccountState', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
        privateKey: '0xprivatekey',
        accountAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      });
    });

    it('should return account state with balance and nonce', async () => {
      const state = await client.getAccountState();

      expect(state).toBeDefined();
      expect(state.address).toBeDefined();
      expect(state.balance).toBeDefined();
      expect(state.nonce).toBe(5);
    });

    it('should accept custom address', async () => {
      const state = await client.getAccountState('0x123456789');

      expect(state).toBeDefined();
      expect(state.address).toBeDefined();
    });

    it('should throw error when no address provided and no account initialized', async () => {
      const clientNoAccount = new ExtendedStarkNetClient({
        network: 'mainnet',
      });

      await expect(clientNoAccount.getAccountState()).rejects.toThrow('No account address provided');
    });
  });

  describe('getTransaction', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });
    });

    it('should return transaction status', async () => {
      const tx = await client.getTransaction('0xtxhash');

      expect(tx).toBeDefined();
      expect(tx.txHash).toBe('0xtxhash');
      expect(tx.status).toBe('accepted');
      expect(tx.type).toBe('INVOKE');
      expect(tx.blockNumber).toBe(12340);
    });
  });

  describe('callContract', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });
    });

    it('should call contract with array calldata', async () => {
      const result = await client.callContract(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        'balanceOf',
        ['0x123']
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should call contract with object calldata', async () => {
      const result = await client.callContract(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        'balanceOf',
        { account: '0x123' }
      );

      expect(result).toBeDefined();
    });

    it('should call contract with empty calldata', async () => {
      const result = await client.callContract(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        'name'
      );

      expect(result).toBeDefined();
    });
  });

  describe('executeContract', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
        privateKey: '0xprivatekey',
        accountAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      });
    });

    it('should execute contract and return tx hash', async () => {
      const txHash = await client.executeContract(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        'transfer',
        { recipient: '0x456', amount: '1000' }
      );

      expect(txHash).toBe('0xabc');
    });

    it('should throw error when account not initialized', async () => {
      const clientNoAccount = new ExtendedStarkNetClient({
        network: 'mainnet',
      });

      await expect(
        clientNoAccount.executeContract(
          '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
          'transfer',
          { recipient: '0x456', amount: '1000' }
        )
      ).rejects.toThrow('Account not initialized');
    });
  });

  describe('estimateFee', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
        privateKey: '0xprivatekey',
        accountAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      });
    });

    it('should estimate fee for contract execution', async () => {
      const fee = await client.estimateFee(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        'transfer',
        { recipient: '0x456', amount: '1000' }
      );

      expect(fee).toBe(BigInt(1000000));
    });

    it('should throw error when account not initialized', async () => {
      const clientNoAccount = new ExtendedStarkNetClient({
        network: 'mainnet',
      });

      await expect(
        clientNoAccount.estimateFee(
          '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
          'transfer',
          {}
        )
      ).rejects.toThrow('Account not initialized');
    });
  });

  describe('getContractInfo', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });
    });

    it('should return contract info', async () => {
      const info = await client.getContractInfo(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
      );

      expect(info).toBeDefined();
      expect(info.address).toBeDefined();
      expect(info.classHash).toBe('0xclasshash');
    });
  });

  describe('waitForTransaction', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
      });
    });

    it('should return when transaction is confirmed', async () => {
      const tx = await client.waitForTransaction('0xtxhash', 1, 5000);

      expect(tx).toBeDefined();
      expect(tx.status).toBe('accepted');
    });
  });

  describe('disconnect', () => {
    let client: ExtendedStarkNetClient;

    beforeEach(() => {
      client = new ExtendedStarkNetClient({
        network: 'mainnet',
        privateKey: '0xprivatekey',
        accountAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      });
    });

    it('should disconnect cleanly', async () => {
      await client.disconnect();

      expect(client.isAccountInitialized()).toBe(false);
    });
  });
});
