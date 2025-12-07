/**
 * Unit Tests for ParadexParaclearWrapper
 *
 * Tests Paraclear SDK integration with mocked SDK functions
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ParadexParaclearWrapper } from '../../src/adapters/paradex/ParadexParaclearWrapper.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock @paradex/sdk
jest.mock('@paradex/sdk', () => ({
  Config: {
    fetchConfig: jest.fn(),
  },
  Account: {
    fromEthSigner: jest.fn(),
  },
  Signer: {
    ethersSignerAdapter: jest.fn(),
  },
  ParaclearProvider: {
    DefaultProvider: jest.fn(),
  },
  Paraclear: {
    getTokenBalance: jest.fn(),
    getSocializedLossFactor: jest.fn(),
    getReceivableAmount: jest.fn(),
    withdraw: jest.fn(),
  },
}));

import { Config, Account, Signer, ParaclearProvider, Paraclear } from '@paradex/sdk';

describe('ParadexParaclearWrapper', () => {
  let wrapper: ParadexParaclearWrapper;
  let mockEthersSigner: any;
  let mockAccount: any;
  let mockConfig: any;
  let mockProvider: any;

  beforeEach(() => {
    wrapper = new ParadexParaclearWrapper({ testnet: true });

    mockAccount = {
      address: '0x123...',
    };

    mockConfig = {
      paradexFullNodeRpcUrl: 'https://testnet.paradex.trade/rpc',
      paradexChainId: 'PARADEX_TESTNET',
      bridgedTokens: {
        USDC: {
          symbol: 'USDC',
          decimals: 6,
          l2BridgeAddress: '0xbridge...',
        },
        ETH: {
          symbol: 'ETH',
          decimals: 18,
          l2BridgeAddress: '0xbridge2...',
        },
      },
    };

    mockProvider = {};

    mockEthersSigner = {
      getAddress: jest.fn().mockResolvedValue('0xeth...'),
    };

    // Setup default mocks
    (Config.fetchConfig as jest.Mock).mockResolvedValue(mockConfig);
    (Signer.ethersSignerAdapter as jest.Mock).mockReturnValue({});
    (ParaclearProvider.DefaultProvider as any).mockImplementation(() => mockProvider);
    (Account.fromEthSigner as jest.Mock).mockResolvedValue(mockAccount);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize account successfully', async () => {
      await wrapper.initializeAccount(mockEthersSigner);

      expect(Config.fetchConfig).toHaveBeenCalledWith('testnet');
      expect(Signer.ethersSignerAdapter).toHaveBeenCalledWith(mockEthersSigner);
      expect(Account.fromEthSigner).toHaveBeenCalledWith({
        provider: mockConfig.paradexFullNodeRpcUrl,
        config: mockConfig,
        signer: {},
      });
      expect(wrapper.isInitialized()).toBe(true);
    });

    it('should use prod environment for mainnet', async () => {
      const mainnetWrapper = new ParadexParaclearWrapper({ testnet: false });

      await mainnetWrapper.initializeAccount(mockEthersSigner);

      expect(Config.fetchConfig).toHaveBeenCalledWith('prod');
    });

    it('should handle initialization failure', async () => {
      (Config.fetchConfig as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(wrapper.initializeAccount(mockEthersSigner)).rejects.toThrow(PerpDEXError);
      await expect(wrapper.initializeAccount(mockEthersSigner)).rejects.toThrow(
        /Failed to initialize Paraclear account/
      );
    });

    it('should expose account after initialization', async () => {
      await wrapper.initializeAccount(mockEthersSigner);

      expect(wrapper.getAccount()).toBe(mockAccount);
    });

    it('should expose config after initialization', async () => {
      await wrapper.initializeAccount(mockEthersSigner);

      expect(wrapper.getConfig()).toBe(mockConfig);
    });
  });

  describe('Token Balance', () => {
    beforeEach(async () => {
      await wrapper.initializeAccount(mockEthersSigner);
    });

    it('should get token balance', async () => {
      (Paraclear.getTokenBalance as jest.Mock).mockResolvedValue({
        size: '1000.45',
      });

      const balance = await wrapper.getTokenBalance('USDC');

      expect(balance).toBe('1000.45');
      expect(Paraclear.getTokenBalance).toHaveBeenCalledWith({
        config: mockConfig,
        provider: mockProvider,
        account: mockAccount,
        token: 'USDC',
      });
    });

    it('should get all token balances', async () => {
      (Paraclear.getTokenBalance as jest.Mock)
        .mockResolvedValueOnce({ size: '1000.45' }) // USDC
        .mockResolvedValueOnce({ size: '0.5' }); // ETH

      const balances = await wrapper.getAllBalances();

      expect(balances).toEqual({
        USDC: '1000.45',
        ETH: '0.5',
      });
      expect(Paraclear.getTokenBalance).toHaveBeenCalledTimes(2);
    });

    it('should throw if not initialized', async () => {
      const uninitWrapper = new ParadexParaclearWrapper();

      await expect(uninitWrapper.getTokenBalance('USDC')).rejects.toThrow(PerpDEXError);
      await expect(uninitWrapper.getTokenBalance('USDC')).rejects.toThrow(
        /not initialized/
      );
    });

    it('should handle balance query failure', async () => {
      (Paraclear.getTokenBalance as jest.Mock).mockRejectedValue(
        new Error('Token not found')
      );

      await expect(wrapper.getTokenBalance('INVALID')).rejects.toThrow(PerpDEXError);
      await expect(wrapper.getTokenBalance('INVALID')).rejects.toThrow(
        /Failed to get token balance/
      );
    });
  });

  describe('Socialized Loss', () => {
    beforeEach(async () => {
      await wrapper.initializeAccount(mockEthersSigner);
    });

    it('should check socialized loss when inactive', async () => {
      (Paraclear.getSocializedLossFactor as jest.Mock).mockResolvedValue({
        socializedLossFactor: '0',
      });

      const result = await wrapper.checkSocializedLoss();

      expect(result).toEqual({
        active: false,
        factor: '0',
      });
      expect(Paraclear.getSocializedLossFactor).toHaveBeenCalledWith({
        config: mockConfig,
        provider: mockProvider,
      });
    });

    it('should check socialized loss when active', async () => {
      (Paraclear.getSocializedLossFactor as jest.Mock).mockResolvedValue({
        socializedLossFactor: '0.05', // 5% loss
      });

      const result = await wrapper.checkSocializedLoss();

      expect(result).toEqual({
        active: true,
        factor: '0.05',
      });
    });

    it('should handle socialized loss query failure', async () => {
      (Paraclear.getSocializedLossFactor as jest.Mock).mockRejectedValue(
        new Error('RPC error')
      );

      await expect(wrapper.checkSocializedLoss()).rejects.toThrow(PerpDEXError);
      await expect(wrapper.checkSocializedLoss()).rejects.toThrow(
        /Failed to check socialized loss/
      );
    });
  });

  describe('Receivable Amount Calculation', () => {
    beforeEach(async () => {
      await wrapper.initializeAccount(mockEthersSigner);
    });

    it('should calculate receivable amount without loss', async () => {
      (Paraclear.getReceivableAmount as jest.Mock).mockResolvedValue({
        receivableAmount: '100.0',
        receivableAmountChain: '100000000', // 100 * 10^6 for USDC
        socializedLossFactor: '0',
      });

      const result = await wrapper.calculateReceivableAmount('USDC', '100.0');

      expect(result).toEqual({
        receivableAmount: '100.0',
        receivableAmountChain: '100000000',
        socializedLoss: '0',
      });
      expect(Paraclear.getReceivableAmount).toHaveBeenCalledWith({
        config: mockConfig,
        provider: mockProvider,
        token: 'USDC',
        amount: '100.0',
      });
    });

    it('should calculate receivable amount with loss', async () => {
      (Paraclear.getReceivableAmount as jest.Mock).mockResolvedValue({
        receivableAmount: '95.0', // 5% loss
        receivableAmountChain: '95000000',
        socializedLossFactor: '0.05',
      });

      const result = await wrapper.calculateReceivableAmount('USDC', '100.0');

      expect(result).toEqual({
        receivableAmount: '95.0',
        receivableAmountChain: '95000000',
        socializedLoss: '0.05',
      });
    });

    it('should handle calculation failure', async () => {
      (Paraclear.getReceivableAmount as jest.Mock).mockRejectedValue(
        new Error('Invalid amount')
      );

      await expect(wrapper.calculateReceivableAmount('USDC', '999999')).rejects.toThrow(
        PerpDEXError
      );
      await expect(wrapper.calculateReceivableAmount('USDC', '999999')).rejects.toThrow(
        /Failed to calculate receivable amount/
      );
    });
  });

  describe('Withdrawal', () => {
    beforeEach(async () => {
      await wrapper.initializeAccount(mockEthersSigner);
    });

    it('should execute withdrawal successfully', async () => {
      (Paraclear.getReceivableAmount as jest.Mock).mockResolvedValue({
        receivableAmount: '100.0',
        receivableAmountChain: '100000000',
        socializedLossFactor: '0',
      });

      (Paraclear.withdraw as jest.Mock).mockResolvedValue({
        hash: '0xtxhash...',
      });

      const bridgeCall = {
        contractAddress: '0xbridge...',
        entrypoint: 'initiate_withdraw',
        calldata: ['0xrecipient...', '100000000', '0'],
      };

      const result = await wrapper.withdraw('USDC', '100.0', bridgeCall);

      expect(result).toEqual({
        transactionHash: '0xtxhash...',
        receivableAmount: '100.0',
      });
      expect(Paraclear.withdraw).toHaveBeenCalledWith({
        config: mockConfig,
        account: mockAccount,
        token: 'USDC',
        amount: '100.0',
        bridgeCall,
      });
    });

    it('should calculate receivable amount before withdrawal', async () => {
      (Paraclear.getReceivableAmount as jest.Mock).mockResolvedValue({
        receivableAmount: '95.0',
        receivableAmountChain: '95000000',
        socializedLossFactor: '0.05',
      });

      (Paraclear.withdraw as jest.Mock).mockResolvedValue({
        hash: '0xtxhash...',
      });

      const result = await wrapper.withdraw('USDC', '100.0', {});

      expect(result.receivableAmount).toBe('95.0');
      expect(Paraclear.getReceivableAmount).toHaveBeenCalled();
    });

    it('should handle withdrawal failure', async () => {
      (Paraclear.getReceivableAmount as jest.Mock).mockResolvedValue({
        receivableAmount: '100.0',
        receivableAmountChain: '100000000',
        socializedLossFactor: '0',
      });

      (Paraclear.withdraw as jest.Mock).mockRejectedValue(
        new Error('Insufficient balance')
      );

      await expect(wrapper.withdraw('USDC', '100.0', {})).rejects.toThrow(PerpDEXError);
      await expect(wrapper.withdraw('USDC', '100.0', {})).rejects.toThrow(
        /Failed to withdraw/
      );
    });

    it('should throw if not initialized', async () => {
      const uninitWrapper = new ParadexParaclearWrapper();

      await expect(uninitWrapper.withdraw('USDC', '100.0', {})).rejects.toThrow(
        PerpDEXError
      );
      await expect(uninitWrapper.withdraw('USDC', '100.0', {})).rejects.toThrow(
        /not initialized/
      );
    });
  });

  describe('State Management', () => {
    it('should report not initialized before initializeAccount', () => {
      expect(wrapper.isInitialized()).toBe(false);
      expect(wrapper.getAccount()).toBeUndefined();
      expect(wrapper.getConfig()).toBeUndefined();
    });

    it('should report initialized after initializeAccount', async () => {
      await wrapper.initializeAccount(mockEthersSigner);

      expect(wrapper.isInitialized()).toBe(true);
      expect(wrapper.getAccount()).toBeDefined();
      expect(wrapper.getConfig()).toBeDefined();
    });

    it('should throw helpful error when calling methods before init', async () => {
      const error = /not initialized/i;

      await expect(wrapper.getTokenBalance('USDC')).rejects.toThrow(error);
      await expect(wrapper.getAllBalances()).rejects.toThrow(error);
      await expect(wrapper.checkSocializedLoss()).rejects.toThrow(error);
      await expect(wrapper.calculateReceivableAmount('USDC', '100')).rejects.toThrow(
        error
      );
      await expect(wrapper.withdraw('USDC', '100', {})).rejects.toThrow(error);
    });
  });
});
