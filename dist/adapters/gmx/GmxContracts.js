/**
 * GMX v2 Contract Interfaces
 *
 * Provides typed interfaces for GMX v2 smart contracts on Arbitrum and Avalanche.
 * Uses ethers.js for contract interactions.
 */
import { ethers } from 'ethers';
import { GMX_CONTRACTS, GMX_API_URLS } from './constants.js';
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
const ORDER_VAULT_ABI = [
    'function recordTransferIn(address token) external returns (uint256)',
];
// =============================================================================
// GMX Contract Manager
// =============================================================================
/**
 * Manages GMX v2 contract instances and interactions
 */
export class GmxContracts {
    chain;
    provider;
    signer;
    addresses;
    exchangeRouter;
    reader;
    dataStore;
    orderVault;
    constructor(chain, provider, signer) {
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
    getExchangeRouter() {
        if (!this.exchangeRouter) {
            this.exchangeRouter = new ethers.Contract(this.addresses.exchangeRouter, EXCHANGE_ROUTER_ABI, this.signer || this.provider);
        }
        return this.exchangeRouter;
    }
    /**
     * Get Reader contract instance
     */
    getReader() {
        if (!this.reader) {
            this.reader = new ethers.Contract(this.addresses.reader, READER_ABI, this.provider);
        }
        return this.reader;
    }
    /**
     * Get DataStore contract instance
     */
    getDataStore() {
        if (!this.dataStore) {
            this.dataStore = new ethers.Contract(this.addresses.dataStore, DATA_STORE_ABI, this.provider);
        }
        return this.dataStore;
    }
    /**
     * Get OrderVault contract instance
     */
    getOrderVault() {
        if (!this.orderVault) {
            this.orderVault = new ethers.Contract(this.addresses.orderVault, ORDER_VAULT_ABI, this.signer || this.provider);
        }
        return this.orderVault;
    }
    // ==========================================================================
    // Trading Operations
    // ==========================================================================
    /**
     * Create a new order
     */
    async createOrder(params, executionFee) {
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
        return exchangeRouter.createOrder(orderParams, { value: executionFee });
    }
    /**
     * Cancel an existing order
     */
    async cancelOrder(orderKey) {
        if (!this.signer) {
            throw new Error('Signer required for trading operations');
        }
        const exchangeRouter = this.getExchangeRouter();
        return exchangeRouter.cancelOrder(orderKey);
    }
    /**
     * Send WETH/WAVAX for order execution fee
     */
    async sendWnt(receiver, amount) {
        if (!this.signer) {
            throw new Error('Signer required for trading operations');
        }
        const exchangeRouter = this.getExchangeRouter();
        return exchangeRouter.sendWnt(receiver, amount, { value: amount });
    }
    /**
     * Send tokens to a receiver
     */
    async sendTokens(token, receiver, amount) {
        if (!this.signer) {
            throw new Error('Signer required for trading operations');
        }
        const exchangeRouter = this.getExchangeRouter();
        return exchangeRouter.sendTokens(token, receiver, amount);
    }
    // ==========================================================================
    // Read Operations
    // ==========================================================================
    /**
     * Get account positions
     */
    async getAccountPositions(account, start = 0, end = 100) {
        const reader = this.getReader();
        const positions = await reader.getAccountPositions(this.addresses.dataStore, account, start, end);
        return positions;
    }
    /**
     * Get account orders
     */
    async getAccountOrders(account, start = 0, end = 100) {
        const reader = this.getReader();
        const orders = await reader.getAccountOrders(this.addresses.dataStore, account, start, end);
        return orders;
    }
    /**
     * Get a specific position
     */
    async getPosition(positionKey) {
        const reader = this.getReader();
        try {
            const position = await reader.getPosition(this.addresses.dataStore, positionKey);
            return position;
        }
        catch {
            return null;
        }
    }
    /**
     * Calculate position key
     */
    getPositionKey(account, market, collateralToken, isLong) {
        return ethers.keccak256(ethers.solidityPacked(['address', 'address', 'address', 'bool'], [account, market, collateralToken, isLong]));
    }
    // ==========================================================================
    // DataStore Operations
    // ==========================================================================
    /**
     * Get a uint value from DataStore
     */
    async getDataStoreUint(key) {
        const dataStore = this.getDataStore();
        return dataStore.getUint(key);
    }
    /**
     * Get execution fee for a given gas limit
     */
    async getExecutionFee(gasLimit) {
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
    encodeOrderType(orderType) {
        const orderTypes = {
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
    encodeDecreaseSwapType(swapType) {
        const swapTypes = {
            0: ethers.encodeBytes32String('NoSwap'),
            1: ethers.encodeBytes32String('SwapPnlTokenToCollateralToken'),
            2: ethers.encodeBytes32String('SwapCollateralTokenToPnlToken'),
        };
        return swapTypes[swapType] || ethers.encodeBytes32String('NoSwap');
    }
    /**
     * Get contract addresses
     */
    getAddresses() {
        return this.addresses;
    }
    /**
     * Get chain ID
     */
    getChainId() {
        return GMX_API_URLS[this.chain].chainId;
    }
}
//# sourceMappingURL=GmxContracts.js.map