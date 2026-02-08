/**
 * GMX v2 Order Builder
 *
 * Builds order parameters for GMX v2 ExchangeRouter contract.
 */
import { ethers } from 'ethers';
import { GMX_MARKETS, GMX_PRECISION, GMX_ORDER_TYPES, GMX_DECREASE_POSITION_SWAP_TYPES, unifiedToGmx, } from './constants.js';
/**
 * Builds order parameters for GMX v2 contracts
 */
export class GmxOrderBuilder {
    chain;
    auth;
    config;
    constructor(chain, auth, _contracts, config = {}) {
        this.chain = chain;
        this.auth = auth;
        this.config = {
            slippageTolerance: config.slippageTolerance ?? 0.003,
            callbackGasLimit: config.callbackGasLimit ?? 0n,
            referralCode: config.referralCode ?? '',
        };
    }
    // ==========================================================================
    // Order Building
    // ==========================================================================
    /**
     * Build create order parameters for a new position or position increase
     */
    buildCreateOrderParams(request, prices) {
        // Get market configuration
        const marketKey = unifiedToGmx(request.symbol);
        if (!marketKey) {
            throw new Error(`Invalid market: ${request.symbol}`);
        }
        const marketConfig = GMX_MARKETS[marketKey];
        // Get wallet address
        const walletAddress = this.auth.getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address required');
        }
        // Determine order type and direction
        const isLong = request.side === 'buy';
        const isIncrease = !request.reduceOnly;
        const orderType = this.getOrderType(request.type, isIncrease);
        // Calculate size in USD (scaled to 30 decimals)
        const sizeUsd = request.amount * prices.indexPrice;
        const sizeDeltaUsd = BigInt(Math.floor(sizeUsd * GMX_PRECISION.USD));
        // Calculate collateral (for increase orders)
        // Collateral = size / leverage
        const leverage = request.leverage || 10; // Default 10x leverage
        const collateralUsd = isIncrease ? sizeUsd / leverage : 0;
        // Use the appropriate collateral token (short token for simplicity - USDC)
        const collateralToken = marketConfig.shortToken;
        const collateralDecimals = 6; // USDC has 6 decimals
        const initialCollateralDeltaAmount = BigInt(Math.floor(collateralUsd * Math.pow(10, collateralDecimals)));
        // Calculate acceptable price with slippage
        const acceptablePrice = this.calculateAcceptablePrice(prices.indexPrice, isLong, isIncrease, this.config.slippageTolerance);
        // Calculate trigger price for limit/stop orders
        const triggerPrice = this.calculateTriggerPrice(request, isLong);
        // Build order params
        return {
            receiver: walletAddress,
            callbackContract: ethers.ZeroAddress,
            uiFeeReceiver: ethers.ZeroAddress,
            market: marketConfig.marketAddress,
            initialCollateralToken: collateralToken,
            swapPath: [], // No swap needed when using USDC as collateral
            sizeDeltaUsd,
            initialCollateralDeltaAmount,
            triggerPrice: BigInt(Math.floor(triggerPrice * GMX_PRECISION.PRICE)),
            acceptablePrice: BigInt(Math.floor(acceptablePrice * GMX_PRECISION.PRICE)),
            executionFee: 0n, // Set later
            callbackGasLimit: this.config.callbackGasLimit,
            minOutputAmount: 0n,
            orderType,
            decreasePositionSwapType: GMX_DECREASE_POSITION_SWAP_TYPES.NO_SWAP,
            isLong,
            shouldUnwrapNativeToken: false,
            referralCode: this.config.referralCode
                ? ethers.encodeBytes32String(this.config.referralCode)
                : ethers.ZeroHash,
        };
    }
    /**
     * Build parameters for closing a position
     */
    buildClosePositionParams(symbol, sizeUsd, isLong, prices) {
        // Get market configuration
        const marketKey = unifiedToGmx(symbol);
        if (!marketKey) {
            throw new Error(`Invalid market: ${symbol}`);
        }
        const marketConfig = GMX_MARKETS[marketKey];
        // Get wallet address
        const walletAddress = this.auth.getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address required');
        }
        // Calculate acceptable price with slippage
        const acceptablePrice = this.calculateAcceptablePrice(prices.indexPrice, isLong, false, // decrease
        this.config.slippageTolerance);
        return {
            receiver: walletAddress,
            callbackContract: ethers.ZeroAddress,
            uiFeeReceiver: ethers.ZeroAddress,
            market: marketConfig.marketAddress,
            initialCollateralToken: marketConfig.shortToken,
            swapPath: [],
            sizeDeltaUsd: BigInt(Math.floor(sizeUsd * GMX_PRECISION.USD)),
            initialCollateralDeltaAmount: 0n, // Will receive collateral back
            triggerPrice: 0n,
            acceptablePrice: BigInt(Math.floor(acceptablePrice * GMX_PRECISION.PRICE)),
            executionFee: 0n, // Set later
            callbackGasLimit: this.config.callbackGasLimit,
            minOutputAmount: 0n,
            orderType: GMX_ORDER_TYPES.MARKET_DECREASE,
            decreasePositionSwapType: GMX_DECREASE_POSITION_SWAP_TYPES.NO_SWAP,
            isLong,
            shouldUnwrapNativeToken: false,
            referralCode: ethers.ZeroHash,
        };
    }
    // ==========================================================================
    // Execution Fee Calculation
    // ==========================================================================
    /**
     * Calculate execution fee for order
     */
    async calculateExecutionFee() {
        // Get current gas price
        const gasPrice = await this.auth.getGasPrice();
        // Base gas for keeper execution + buffer
        // GMX recommends ~1.5M gas for order execution
        const gasLimit = 1500000n;
        // Calculate fee with 30% buffer for gas price fluctuations
        const executionFee = gasLimit * gasPrice;
        return (executionFee * 130n) / 100n;
    }
    /**
     * Calculate minimum execution fee based on current network conditions
     */
    async getMinExecutionFee() {
        // GMX has minimum execution fees to ensure keeper profitability
        // This is chain-specific
        const minFees = {
            arbitrum: ethers.parseEther('0.0003'), // ~$0.50
            avalanche: ethers.parseEther('0.01'), // ~$0.30
        };
        const minFee = minFees[this.chain];
        const calculatedFee = await this.calculateExecutionFee();
        return calculatedFee > minFee ? calculatedFee : minFee;
    }
    // ==========================================================================
    // Helper Methods
    // ==========================================================================
    /**
     * Get GMX order type based on request type
     */
    getOrderType(orderType, isIncrease) {
        switch (orderType) {
            case 'market':
                return isIncrease
                    ? GMX_ORDER_TYPES.MARKET_INCREASE
                    : GMX_ORDER_TYPES.MARKET_DECREASE;
            case 'limit':
                return isIncrease
                    ? GMX_ORDER_TYPES.LIMIT_INCREASE
                    : GMX_ORDER_TYPES.LIMIT_DECREASE;
            case 'stopMarket':
            case 'stopLimit':
                return GMX_ORDER_TYPES.STOP_LOSS;
            default:
                return isIncrease
                    ? GMX_ORDER_TYPES.MARKET_INCREASE
                    : GMX_ORDER_TYPES.MARKET_DECREASE;
        }
    }
    /**
     * Calculate acceptable price with slippage
     */
    calculateAcceptablePrice(currentPrice, isLong, isIncrease, slippage) {
        // For longs:
        //   - Increase: pay higher price (1 + slippage)
        //   - Decrease: receive lower price (1 - slippage)
        // For shorts:
        //   - Increase: receive lower price (1 - slippage)
        //   - Decrease: pay higher price (1 + slippage)
        const multiplier = isLong === isIncrease
            ? 1 + slippage
            : 1 - slippage;
        return currentPrice * multiplier;
    }
    /**
     * Calculate trigger price for limit/stop orders
     */
    calculateTriggerPrice(request, _isLong) {
        if (request.type === 'market') {
            return 0;
        }
        // For limit orders, use the specified price
        if (request.price) {
            return request.price;
        }
        // For stop orders, use stop price
        if (request.stopPrice) {
            return request.stopPrice;
        }
        return 0;
    }
    /**
     * Validate order parameters
     */
    validateOrderParams(request) {
        const marketKey = unifiedToGmx(request.symbol);
        if (!marketKey) {
            throw new Error(`Invalid market: ${request.symbol}`);
        }
        const marketConfig = GMX_MARKETS[marketKey];
        // Check minimum order size
        if (request.amount < marketConfig.minOrderSize) {
            throw new Error(`Order size ${request.amount} is below minimum ${marketConfig.minOrderSize} for ${request.symbol}`);
        }
        // Check leverage
        const leverage = request.leverage || 10;
        if (leverage > marketConfig.maxLeverage) {
            throw new Error(`Leverage ${leverage}x exceeds maximum ${marketConfig.maxLeverage}x for ${request.symbol}`);
        }
        // Validate price for limit orders
        if (request.type === 'limit' && !request.price) {
            throw new Error('Price required for limit orders');
        }
        // Validate stop price for stop orders
        if ((request.type === 'stopMarket' || request.type === 'stopLimit') && !request.stopPrice) {
            throw new Error('Stop price required for stop orders');
        }
    }
    /**
     * Get market configuration
     */
    getMarketConfig(symbol) {
        const marketKey = unifiedToGmx(symbol);
        if (!marketKey) {
            throw new Error(`Invalid market: ${symbol}`);
        }
        return GMX_MARKETS[marketKey];
    }
    /**
     * Calculate required collateral for a position
     */
    calculateRequiredCollateral(sizeUsd, leverage, _isLong) {
        const collateralUsd = sizeUsd / leverage;
        // Use USDC as default collateral for both long and short
        // In production, could allow user to choose collateral token
        return {
            collateralUsd,
            collateralToken: 'USDC',
        };
    }
    /**
     * Calculate position's liquidation price
     */
    calculateLiquidationPrice(entryPrice, leverage, isLong, maintenanceMarginRate = 0.01 // 1% maintenance margin
    ) {
        // Liquidation occurs when losses exceed (1 - maintenanceMargin) of collateral
        // For longs: liqPrice = entryPrice * (1 - (1 - maintenanceMargin) / leverage)
        // For shorts: liqPrice = entryPrice * (1 + (1 - maintenanceMargin) / leverage)
        const lossRate = (1 - maintenanceMarginRate) / leverage;
        return isLong
            ? entryPrice * (1 - lossRate)
            : entryPrice * (1 + lossRate);
    }
}
//# sourceMappingURL=GmxOrderBuilder.js.map