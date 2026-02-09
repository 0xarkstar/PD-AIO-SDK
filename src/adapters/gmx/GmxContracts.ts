/**
 * GMX v2 Contract Interfaces
 *
 * Provides typed interfaces for GMX v2 smart contracts on Arbitrum and Avalanche.
 * Uses ethers.js for contract interactions.
 */

import { ethers, type Provider, type Signer, type TransactionResponse } from 'ethers';
import { GMX_CONTRACTS, GMX_API_URLS } from './constants.js';
import type { GmxChain } from './GmxAdapter.js';
import type { GmxCreateOrderParams } from './types.js';

// =============================================================================
// ABI Definitions
// =============================================================================

/**
 * ExchangeRouter ABI - Main contract for creating and canceling orders
 */
const EXCHANGE_ROUTER_ABI = [
  // Create order
  'function createOrder(tuple(address[] addresses, uint256[] numbers, bytes32 orderType, bytes32 decreasePositionSwapType, bool isLong, bool shouldUnwrapNativeToken, bytes32 referralCode) params) payable returns (bytes32)',
  // Cancel order
  'function cancelOrder(bytes32 key) external',
  // Multicall for batch operations
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)',
  // Send tokens to WNT
  'function sendWnt(address receiver, uint256 amount) external payable',
  // Send tokens
  'function sendTokens(address token, address receiver, uint256 amount) external payable',
];

/**
 * Reader ABI - For reading contract state
 */
const READER_ABI = [
  // Get market info
  'function getMarket(address dataStore, address marketKey) external view returns (tuple(address marketToken, address indexToken, address longToken, address shortToken))',
  // Get market prices
  'function getMarketTokenPrice(address dataStore, tuple(address marketToken, address indexToken, address longToken, address shortToken) market, tuple(uint256 min, uint256 max) indexTokenPrice, tuple(uint256 min, uint256 max) longTokenPrice, tuple(uint256 min, uint256 max) shortTokenPrice, bytes32 pnlFactorType, bool maximize) external view returns (int256, tuple(int256 poolValue, int256 longPnl, int256 shortPnl, int256 netPnl, int256 longTokenAmount, int256 shortTokenAmount, int256 longTokenUsd, int256 shortTokenUsd, int256 totalBorrowingFees, int256 borrowingFeePoolFactor, int256 impactPoolAmount))',
  // Get position
  'function getPosition(address dataStore, bytes32 positionKey) external view returns (tuple(address account, address market, address collateralToken, bool isLong, uint256 sizeInUsd, uint256 sizeInTokens, uint256 collateralAmount, uint256 borrowingFactor, uint256 fundingFeeAmountPerSize, uint256 longTokenClaimableFundingAmountPerSize, uint256 shortTokenClaimableFundingAmountPerSize, uint256 increasedAtBlock, uint256 decreasedAtBlock))',
  // Get positions
  'function getAccountPositions(address dataStore, address account, uint256 start, uint256 end) external view returns (tuple(address account, address market, address collateralToken, bool isLong, uint256 sizeInUsd, uint256 sizeInTokens, uint256 collateralAmount, uint256 borrowingFactor, uint256 fundingFeeAmountPerSize, uint256 longTokenClaimableFundingAmountPerSize, uint256 shortTokenClaimableFundingAmountPerSize, uint256 increasedAtBlock, uint256 decreasedAtBlock)[])',
  // Get orders
  'function getAccountOrders(address dataStore, address account, uint256 start, uint256 end) external view returns (tuple(bytes32 key, address account, address receiver, address callbackContract, address uiFeeReceiver, address market, address initialCollateralToken, address[] swapPath, uint8 orderType, uint8 decreasePositionSwapType, uint256 sizeDeltaUsd, uint256 initialCollateralDeltaAmount, uint256 triggerPrice, uint256 acceptablePrice, uint256 executionFee, uint256 callbackGasLimit, uint256 minOutputAmount, uint256 updatedAtBlock, bool isLong, bool isFrozen)[])',
];

/**
 * DataStore ABI - For reading stored data
 */
const DATA_STORE_ABI = [
  'function getUint(bytes32 key) external view returns (uint256)',
  'function getInt(bytes32 key) external view returns (int256)',
  'function getAddress(bytes32 key) external view returns (address)',
  'function getBool(bytes32 key) external view returns (bool)',
  'function getBytes32(bytes32 key) external view returns (bytes32)',
  'function getBytes32Count(bytes32 setKey) external view returns (uint256)',
  'function getBytes32ValuesAt(bytes32 setKey, uint256 start, uint256 end) external view returns (bytes32[])',
];

/**
 * OrderVault ABI
 */
const ORDER_VAULT_ABI = ['function recordTransferIn(address token) external returns (uint256)'];

// =============================================================================
// GMX Contract Manager
// =============================================================================

/**
 * Manages GMX v2 contract instances and interactions
 */
export class GmxContracts {
  private readonly chain: GmxChain;
  private readonly provider: Provider;
  private readonly signer?: Signer;
  private readonly addresses: (typeof GMX_CONTRACTS)[GmxChain];

  private exchangeRouter?: ethers.Contract;
  private reader?: ethers.Contract;
  private dataStore?: ethers.Contract;
  private orderVault?: ethers.Contract;

  constructor(chain: GmxChain, provider: Provider, signer?: Signer) {
    this.chain = chain;
    this.provider = provider;
    this.signer = signer;
    this.addresses = GMX_CONTRACTS[chain];
  }

  // ==========================================================================
  // Contract Getters
  // ==========================================================================

  /**
   * Get ExchangeRouter contract instance
   */
  getExchangeRouter(): ethers.Contract {
    if (!this.exchangeRouter) {
      this.exchangeRouter = new ethers.Contract(
        this.addresses.exchangeRouter,
        EXCHANGE_ROUTER_ABI,
        this.signer || this.provider
      );
    }
    return this.exchangeRouter;
  }

  /**
   * Get Reader contract instance
   */
  getReader(): ethers.Contract {
    if (!this.reader) {
      this.reader = new ethers.Contract(this.addresses.reader, READER_ABI, this.provider);
    }
    return this.reader;
  }

  /**
   * Get DataStore contract instance
   */
  getDataStore(): ethers.Contract {
    if (!this.dataStore) {
      this.dataStore = new ethers.Contract(this.addresses.dataStore, DATA_STORE_ABI, this.provider);
    }
    return this.dataStore;
  }

  /**
   * Get OrderVault contract instance
   */
  getOrderVault(): ethers.Contract {
    if (!this.orderVault) {
      this.orderVault = new ethers.Contract(
        this.addresses.orderVault,
        ORDER_VAULT_ABI,
        this.signer || this.provider
      );
    }
    return this.orderVault;
  }

  // ==========================================================================
  // Trading Operations
  // ==========================================================================

  /**
   * Create a new order
   */
  async createOrder(
    params: GmxCreateOrderParams,
    executionFee: bigint
  ): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for trading operations');
    }

    const exchangeRouter = this.getExchangeRouter();

    // Encode order params for the contract
    const orderParams = {
      addresses: [
        params.receiver,
        params.callbackContract,
        params.uiFeeReceiver,
        params.market,
        params.initialCollateralToken,
        ...params.swapPath,
      ],
      numbers: [
        params.sizeDeltaUsd,
        params.initialCollateralDeltaAmount,
        params.triggerPrice,
        params.acceptablePrice,
        params.executionFee,
        params.callbackGasLimit,
        params.minOutputAmount,
      ],
      orderType: this.encodeOrderType(params.orderType),
      decreasePositionSwapType: this.encodeDecreaseSwapType(params.decreasePositionSwapType),
      isLong: params.isLong,
      shouldUnwrapNativeToken: params.shouldUnwrapNativeToken,
      referralCode: params.referralCode || ethers.ZeroHash,
    };

    return exchangeRouter.createOrder!(orderParams, {
      value: executionFee,
    }) as Promise<TransactionResponse>;
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderKey: string): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for trading operations');
    }

    const exchangeRouter = this.getExchangeRouter();
    return exchangeRouter.cancelOrder!(orderKey) as Promise<TransactionResponse>;
  }

  /**
   * Send WETH/WAVAX for order execution fee
   */
  async sendWnt(receiver: string, amount: bigint): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for trading operations');
    }

    const exchangeRouter = this.getExchangeRouter();
    return exchangeRouter.sendWnt!(receiver, amount, {
      value: amount,
    }) as Promise<TransactionResponse>;
  }

  /**
   * Send tokens to a receiver
   */
  async sendTokens(token: string, receiver: string, amount: bigint): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for trading operations');
    }

    const exchangeRouter = this.getExchangeRouter();
    return exchangeRouter.sendTokens!(token, receiver, amount) as Promise<TransactionResponse>;
  }

  // ==========================================================================
  // Read Operations
  // ==========================================================================

  /**
   * Get account positions
   */
  async getAccountPositions(account: string, start = 0, end = 100): Promise<GmxPositionData[]> {
    const reader = this.getReader();
    const positions = (await reader.getAccountPositions!(
      this.addresses.dataStore,
      account,
      start,
      end
    )) as GmxPositionData[];
    return positions;
  }

  /**
   * Get account orders
   */
  async getAccountOrders(account: string, start = 0, end = 100): Promise<GmxOrderData[]> {
    const reader = this.getReader();
    const orders = (await reader.getAccountOrders!(
      this.addresses.dataStore,
      account,
      start,
      end
    )) as GmxOrderData[];
    return orders;
  }

  /**
   * Get a specific position
   */
  async getPosition(positionKey: string): Promise<GmxPositionData | null> {
    const reader = this.getReader();
    try {
      const position = (await reader.getPosition!(
        this.addresses.dataStore,
        positionKey
      )) as GmxPositionData;
      return position;
    } catch {
      return null;
    }
  }

  /**
   * Calculate position key
   */
  getPositionKey(
    account: string,
    market: string,
    collateralToken: string,
    isLong: boolean
  ): string {
    return ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'address', 'address', 'bool'],
        [account, market, collateralToken, isLong]
      )
    );
  }

  // ==========================================================================
  // DataStore Operations
  // ==========================================================================

  /**
   * Get a uint value from DataStore
   */
  async getDataStoreUint(key: string): Promise<bigint> {
    const dataStore = this.getDataStore();
    return dataStore.getUint!(key) as Promise<bigint>;
  }

  /**
   * Get execution fee for a given gas limit
   */
  async getExecutionFee(gasLimit: bigint): Promise<bigint> {
    const gasPrice = await this.provider.getFeeData();
    const baseGasLimit = 500000n; // Base gas for keeper execution
    const totalGasLimit = baseGasLimit + gasLimit;
    const executionFee = totalGasLimit * (gasPrice.gasPrice || 0n);
    // Add 20% buffer for gas price fluctuations
    return (executionFee * 120n) / 100n;
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Encode order type to bytes32
   */
  private encodeOrderType(orderType: number): string {
    const orderTypes: Record<number, string> = {
      0: ethers.encodeBytes32String('MarketIncrease'),
      1: ethers.encodeBytes32String('MarketDecrease'),
      2: ethers.encodeBytes32String('LimitIncrease'),
      3: ethers.encodeBytes32String('LimitDecrease'),
      4: ethers.encodeBytes32String('StopLossDecrease'),
      5: ethers.encodeBytes32String('Liquidation'),
    };
    return orderTypes[orderType] || ethers.encodeBytes32String('MarketIncrease');
  }

  /**
   * Encode decrease position swap type
   */
  private encodeDecreaseSwapType(swapType: number): string {
    const swapTypes: Record<number, string> = {
      0: ethers.encodeBytes32String('NoSwap'),
      1: ethers.encodeBytes32String('SwapPnlTokenToCollateralToken'),
      2: ethers.encodeBytes32String('SwapCollateralTokenToPnlToken'),
    };
    return swapTypes[swapType] || ethers.encodeBytes32String('NoSwap');
  }

  /**
   * Get contract addresses
   */
  getAddresses(): (typeof GMX_CONTRACTS)[GmxChain] {
    return this.addresses;
  }

  /**
   * Get chain ID
   */
  getChainId(): number {
    return GMX_API_URLS[this.chain].chainId;
  }
}

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Position data from contract
 */
export interface GmxPositionData {
  account: string;
  market: string;
  collateralToken: string;
  isLong: boolean;
  sizeInUsd: bigint;
  sizeInTokens: bigint;
  collateralAmount: bigint;
  borrowingFactor: bigint;
  fundingFeeAmountPerSize: bigint;
  longTokenClaimableFundingAmountPerSize: bigint;
  shortTokenClaimableFundingAmountPerSize: bigint;
  increasedAtBlock: bigint;
  decreasedAtBlock: bigint;
}

/**
 * Order data from contract
 */
export interface GmxOrderData {
  key: string;
  account: string;
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  initialCollateralToken: string;
  swapPath: string[];
  orderType: number;
  decreasePositionSwapType: number;
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  callbackGasLimit: bigint;
  minOutputAmount: bigint;
  updatedAtBlock: bigint;
  isLong: boolean;
  isFrozen: boolean;
}
