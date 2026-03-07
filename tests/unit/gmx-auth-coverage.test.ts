/**
 * GmxAuth Extended Coverage Tests
 *
 * Tests for provider-based methods and token operations
 * to push coverage above 78%.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';
import { GmxAuth } from '../../src/adapters/gmx/GmxAuth.js';

const TEST_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const TEST_WALLET = new ethers.Wallet(TEST_PRIVATE_KEY);
const TEST_ADDRESS = TEST_WALLET.address;

describe('GmxAuth Extended Coverage', () => {
  describe('estimateGas', () => {
    it('should delegate to provider.estimateGas', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const provider = auth.getProvider();
      const mockEstimate = jest.spyOn(provider, 'estimateGas')
        .mockResolvedValue(21000n);

      const result = await auth.estimateGas({ to: TEST_ADDRESS });
      expect(result).toBe(21000n);
      expect(mockEstimate).toHaveBeenCalledWith({ to: TEST_ADDRESS });

      mockEstimate.mockRestore();
    });
  });

  describe('getGasPrice', () => {
    it('should return gas price from provider', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const provider = auth.getProvider();
      const mockFeeData = jest.spyOn(provider, 'getFeeData')
        .mockResolvedValue({
          gasPrice: 100000000n,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          toJSON: () => ({}),
        } as ethers.FeeData);

      const price = await auth.getGasPrice();
      expect(price).toBe(100000000n);

      mockFeeData.mockRestore();
    });

    it('should return 0n when gasPrice is null', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const provider = auth.getProvider();
      const mockFeeData = jest.spyOn(provider, 'getFeeData')
        .mockResolvedValue({
          gasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          toJSON: () => ({}),
        } as ethers.FeeData);

      const price = await auth.getGasPrice();
      expect(price).toBe(0n);

      mockFeeData.mockRestore();
    });
  });

  describe('getBlockNumber', () => {
    it('should return block number from provider', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const provider = auth.getProvider();
      const mockBlock = jest.spyOn(provider, 'getBlockNumber')
        .mockResolvedValue(12345678);

      const blockNum = await auth.getBlockNumber();
      expect(blockNum).toBe(12345678);

      mockBlock.mockRestore();
    });
  });

  describe('waitForTransaction', () => {
    it('should delegate to provider.waitForTransaction', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const mockReceipt = { hash: '0xabc', blockNumber: 100 } as unknown as ethers.TransactionReceipt;
      const provider = auth.getProvider();
      const mockWait = jest.spyOn(provider, 'waitForTransaction')
        .mockResolvedValue(mockReceipt);

      const receipt = await auth.waitForTransaction('0xabc', 2);
      expect(receipt).toBe(mockReceipt);
      expect(mockWait).toHaveBeenCalledWith('0xabc', 2);

      mockWait.mockRestore();
    });

    it('should use default confirmations of 1', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const provider = auth.getProvider();
      const mockWait = jest.spyOn(provider, 'waitForTransaction')
        .mockResolvedValue(null);

      await auth.waitForTransaction('0xdef');
      expect(mockWait).toHaveBeenCalledWith('0xdef', 1);

      mockWait.mockRestore();
    });
  });

  describe('getBalance with wallet configured', () => {
    it('should return balance from provider', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const provider = auth.getProvider();
      const mockBalance = jest.spyOn(provider, 'getBalance')
        .mockResolvedValue(1000000000000000000n);

      const balance = await auth.getBalance();
      expect(balance).toBe(1000000000000000000n);
      expect(mockBalance).toHaveBeenCalledWith(TEST_ADDRESS);

      mockBalance.mockRestore();
    });
  });

  describe('getTokenBalance with wallet configured', () => {
    it('should call ERC20 balanceOf', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      // Mock the Contract constructor to return a mock contract
      const mockBalanceOf = jest.fn().mockResolvedValue(5000000n);
      const originalContract = ethers.Contract;
      const spy = jest.spyOn(ethers, 'Contract').mockImplementation(
        () => ({ balanceOf: mockBalanceOf }) as any
      );

      const balance = await auth.getTokenBalance('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1');
      expect(balance).toBe(5000000n);

      spy.mockRestore();
    });
  });

  describe('getTokenAllowance with wallet configured', () => {
    it('should call ERC20 allowance', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const mockAllowance = jest.fn().mockResolvedValue(100000n);
      const spy = jest.spyOn(ethers, 'Contract').mockImplementation(
        () => ({ allowance: mockAllowance }) as any
      );

      const allowance = await auth.getTokenAllowance(
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
      );
      expect(allowance).toBe(100000n);

      spy.mockRestore();
    });
  });

  describe('approveToken with wallet configured', () => {
    it('should call ERC20 approve with wallet as signer', async () => {
      const auth = new GmxAuth({
        privateKey: TEST_PRIVATE_KEY,
        chain: 'arbitrum',
      });

      const mockTxResponse = { hash: '0xapprove', wait: jest.fn() };
      const mockApprove = jest.fn().mockResolvedValue(mockTxResponse);
      const spy = jest.spyOn(ethers, 'Contract').mockImplementation(
        () => ({ approve: mockApprove }) as any
      );

      const tx = await auth.approveToken(
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        1000000n
      );
      expect(tx).toBe(mockTxResponse);
      expect(mockApprove).toHaveBeenCalledWith(
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        1000000n
      );

      spy.mockRestore();
    });
  });

  describe('no wallet or address configured', () => {
    it('canSign and canRead should both be false', () => {
      const auth = new GmxAuth({ chain: 'arbitrum' });
      expect(auth.canSign()).toBe(false);
      expect(auth.canRead()).toBe(false);
      expect(auth.getWalletAddress()).toBeUndefined();
      expect(auth.getWallet()).toBeUndefined();
      expect(auth.getSigner()).toBeUndefined();
    });
  });
});
