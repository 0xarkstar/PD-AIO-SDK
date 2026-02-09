/**
 * Jupiter Perps Exchange Adapter
 *
 * Adapter for Jupiter Perpetuals on Solana.
 * Jupiter Perps uses on-chain positions and the JLP pool for liquidity.
 *
 * Key characteristics:
 * - On-chain positions via Solana program
 * - Borrow fees instead of funding rates
 * - Supports SOL, ETH, BTC perpetuals
 * - Up to 250x leverage
 *
 * @see https://jup.ag/perps
 * @see https://dev.jup.ag/docs/perps
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import { NotSupportedError } from '../../types/errors.js';
import { JupiterNormalizer } from './JupiterNormalizer.js';
import { JupiterAuth } from './JupiterAuth.js';
import { SolanaClient } from './solana.js';
import { JupiterInstructionBuilder } from './instructions.js';
import { JUPITER_MARKETS, JUPITER_TOKEN_MINTS, unifiedToJupiter, jupiterToUnified, } from './constants.js';
import { mapJupiterError } from './error-codes.js';
import { isValidMarket, buildPriceApiUrl, validateOrderParams, calculateLiquidationPrice, parseOnChainTimestamp, } from './utils.js';
/**
 * Jupiter Perpetuals Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const jupiter = new JupiterAdapter();
 * await jupiter.initialize();
 *
 * // Fetch ticker
 * const ticker = await jupiter.fetchTicker('SOL/USD:USD');
 *
 * // With wallet for trading
 * const jupiter = new JupiterAdapter({
 *   privateKey: 'your-solana-private-key',
 *   rpcEndpoint: 'https://your-rpc-endpoint.com',
 * });
 * await jupiter.initialize();
 *
 * // Create order
 * const order = await jupiter.createOrder({
 *   symbol: 'SOL/USD:USD',
 *   side: 'buy',
 *   type: 'market',
 *   amount: 1.0,
 *   leverage: 10,
 * });
 * ```
 */
export class JupiterAdapter extends BaseAdapter {
    id = 'jupiter';
    name = 'Jupiter Perps';
    has = {
        // Market data
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true, // Synthetic orderbook from pool liquidity
        fetchTrades: false, // No public trade feed
        fetchFundingRate: true, // Returns borrow fee as funding rate
        fetchFundingRateHistory: false, // No historical borrow fees API
        fetchOHLCV: false, // No candle data API
        // Trading (now supported via Solana transactions)
        createOrder: true,
        cancelOrder: false, // Jupiter uses instant execution
        cancelAllOrders: false,
        createBatchOrders: false,
        cancelBatchOrders: false,
        // Account data
        fetchPositions: true,
        fetchBalance: true,
        fetchOpenOrders: false, // Jupiter uses instant execution
        fetchOrderHistory: false,
        fetchMyTrades: false,
        // Position management
        setLeverage: false, // Leverage set per-trade
        setMarginMode: false, // Always isolated margin
        // WebSocket (not supported yet)
        watchOrderBook: false,
        watchTrades: false,
        watchTicker: false,
        watchPositions: false,
        watchOrders: false,
        watchBalance: false,
    };
    normalizer;
    auth;
    solanaClient;
    instructionBuilder;
    priceCache = new Map();
    priceCacheTTL = 5000; // 5 second cache for prices
    adapterConfig;
    constructor(config = {}) {
        super({
            timeout: 30000,
            ...config,
        });
        this.adapterConfig = config;
        this.normalizer = new JupiterNormalizer();
        // Initialize auth if credentials provided
        if (config.privateKey || config.walletAddress) {
            this.auth = new JupiterAuth({
                privateKey: config.privateKey,
                walletAddress: config.walletAddress,
                rpcEndpoint: config.rpcEndpoint,
            });
        }
    }
    // ==========================================================================
    // Connection Management
    // ==========================================================================
    async initialize() {
        if (this._isReady) {
            this.debug('Already initialized');
            return;
        }
        this.debug('Initializing Jupiter adapter...');
        try {
            // Validate API connectivity by fetching prices
            await this.fetchPrices(['SOL']);
            // Initialize Solana client for on-chain operations
            if (this.auth) {
                await this.auth.ensureInitialized();
                this.solanaClient = new SolanaClient({
                    rpcEndpoint: this.adapterConfig.rpcEndpoint,
                    commitment: 'confirmed',
                });
                await this.solanaClient.initialize();
                // Initialize instruction builder
                this.instructionBuilder = new JupiterInstructionBuilder();
                await this.instructionBuilder.initialize();
            }
            this._isReady = true;
            this.info('Jupiter adapter initialized successfully');
        }
        catch (error) {
            const mappedError = mapJupiterError(error);
            this.error('Failed to initialize Jupiter adapter', mappedError);
            throw mappedError;
        }
    }
    // ==========================================================================
    // Symbol Conversion
    // ==========================================================================
    symbolToExchange(symbol) {
        return unifiedToJupiter(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return jupiterToUnified(exchangeSymbol);
    }
    // ==========================================================================
    // Market Data
    // ==========================================================================
    async fetchMarkets(params) {
        this.ensureInitialized();
        // Check cache first
        const cached = this.getPreloadedMarkets();
        if (cached) {
            return this.filterMarkets(cached, params);
        }
        try {
            // Jupiter has fixed markets - return hardcoded market data
            const markets = Object.entries(JUPITER_MARKETS).map(([key, config]) => ({
                id: key,
                symbol: jupiterToUnified(key),
                base: config.baseToken,
                quote: 'USD',
                settle: 'USD',
                active: true,
                minAmount: config.minPositionSize,
                maxAmount: 10000000, // $10M max position
                minCost: 10,
                pricePrecision: Math.max(0, -Math.floor(Math.log10(config.tickSize))),
                amountPrecision: Math.max(0, -Math.floor(Math.log10(config.stepSize))),
                priceTickSize: config.tickSize,
                amountStepSize: config.stepSize,
                makerFee: 0.0006, // 0.06% fee
                takerFee: 0.0006,
                maxLeverage: config.maxLeverage,
                fundingIntervalHours: 1, // Jupiter uses hourly borrow fees
                contractSize: 1,
                info: {
                    tokenMint: JUPITER_TOKEN_MINTS[config.baseToken],
                    marginMode: 'isolated',
                    positionMode: 'one-way',
                },
            }));
            return this.filterMarkets(markets, params);
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchTicker(symbol) {
        this.ensureInitialized();
        const jupiterSymbol = this.symbolToExchange(symbol);
        if (!isValidMarket(jupiterSymbol)) {
            throw new Error(`Invalid market: ${symbol}`);
        }
        try {
            const baseToken = jupiterSymbol.replace('-PERP', '');
            const mint = JUPITER_TOKEN_MINTS[baseToken];
            if (!mint) {
                throw new Error(`Unknown token: ${baseToken}`);
            }
            const priceData = await this.fetchPrice(mint);
            return this.normalizer.normalizeTicker(jupiterSymbol, priceData);
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchOrderBook(symbol, _params) {
        this.ensureInitialized();
        const jupiterSymbol = this.symbolToExchange(symbol);
        if (!isValidMarket(jupiterSymbol)) {
            throw new Error(`Invalid market: ${symbol}`);
        }
        try {
            // Get current price
            const baseToken = jupiterSymbol.replace('-PERP', '');
            const mint = JUPITER_TOKEN_MINTS[baseToken];
            if (!mint) {
                throw new Error(`Unknown token: ${baseToken}`);
            }
            const priceData = await this.fetchPrice(mint);
            const currentPrice = parseFloat(priceData.price);
            // Return synthetic orderbook
            return this.normalizer.normalizeOrderBook(jupiterSymbol, currentPrice);
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchTrades(_symbol, _params) {
        throw new NotSupportedError('fetchTrades is not supported. Jupiter Perps trades are on-chain only.', 'NOT_SUPPORTED', 'jupiter');
    }
    async fetchFundingRate(symbol) {
        this.ensureInitialized();
        const jupiterSymbol = this.symbolToExchange(symbol);
        if (!isValidMarket(jupiterSymbol)) {
            throw new Error(`Invalid market: ${symbol}`);
        }
        try {
            // Get current price
            const baseToken = jupiterSymbol.replace('-PERP', '');
            const mint = JUPITER_TOKEN_MINTS[baseToken];
            if (!mint) {
                throw new Error(`Unknown token: ${baseToken}`);
            }
            const priceData = await this.fetchPrice(mint);
            const currentPrice = parseFloat(priceData.price);
            // Create a mock custody account with estimated borrow rate
            const mockCustody = this.createMockCustodyForFunding();
            return this.normalizer.normalizeFundingRate(jupiterSymbol, mockCustody, currentPrice);
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        // Jupiter doesn't provide historical borrow fee data via API
        this.warn('Jupiter Perps does not provide historical funding rate data');
        return [];
    }
    // ==========================================================================
    // Account Data
    // ==========================================================================
    async fetchPositions(symbols) {
        this.ensureInitialized();
        if (!this.auth?.canRead()) {
            throw new Error('Wallet address required to fetch positions');
        }
        if (!this.solanaClient) {
            throw new Error('Solana client not initialized');
        }
        const walletAddress = this.auth.getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address not configured');
        }
        try {
            // Fetch position accounts from on-chain
            const positionAccounts = await this.solanaClient.getJupiterPositions(walletAddress);
            const positions = [];
            for (const { pubkey, account } of positionAccounts) {
                try {
                    // Parse position account data
                    const positionData = this.parsePositionAccount(account.data);
                    // Get current price for the market
                    const symbol = this.getSymbolFromCustody(positionData.custody);
                    if (!symbol)
                        continue;
                    const jupiterSymbol = unifiedToJupiter(symbol);
                    const baseToken = jupiterSymbol.replace('-PERP', '');
                    const mint = JUPITER_TOKEN_MINTS[baseToken];
                    if (!mint)
                        continue;
                    const priceData = await this.fetchPrice(mint);
                    const markPrice = parseFloat(priceData.price);
                    // Normalize to SDK Position type
                    positions.push(this.normalizePosition(pubkey, positionData, markPrice, symbol));
                }
                catch (error) {
                    this.warn(`Failed to parse position ${pubkey}: ${String(error)}`);
                }
            }
            // Filter by symbols if specified
            if (symbols && symbols.length > 0) {
                return positions.filter((p) => symbols.includes(p.symbol));
            }
            return positions;
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchBalance() {
        this.ensureInitialized();
        if (!this.auth?.canRead()) {
            throw new Error('Wallet address required to fetch balance');
        }
        const walletAddress = this.auth.getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address not configured');
        }
        try {
            const balances = [];
            // Get SOL balance
            const solBalance = await this.auth.getSolBalance();
            balances.push({
                currency: 'SOL',
                total: solBalance,
                free: solBalance,
                used: 0,
            });
            // Get USDC balance
            try {
                const usdcBalance = await this.auth.getTokenBalance(JUPITER_TOKEN_MINTS.USDC);
                const usdcAmount = usdcBalance / 1e6; // USDC has 6 decimals
                balances.push({
                    currency: 'USDC',
                    total: usdcAmount,
                    free: usdcAmount,
                    used: 0,
                });
            }
            catch {
                // No USDC account
                balances.push({
                    currency: 'USDC',
                    total: 0,
                    free: 0,
                    used: 0,
                });
            }
            // Get USDT balance
            try {
                const usdtBalance = await this.auth.getTokenBalance(JUPITER_TOKEN_MINTS.USDT);
                const usdtAmount = usdtBalance / 1e6; // USDT has 6 decimals
                balances.push({
                    currency: 'USDT',
                    total: usdtAmount,
                    free: usdtAmount,
                    used: 0,
                });
            }
            catch {
                // No USDT account
                balances.push({
                    currency: 'USDT',
                    total: 0,
                    free: 0,
                    used: 0,
                });
            }
            return balances;
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchOpenOrders(_symbol) {
        // Jupiter uses instant execution, no pending orders
        return [];
    }
    // ==========================================================================
    // Trading Operations
    // ==========================================================================
    async createOrder(request) {
        this.ensureInitialized();
        if (!this.auth?.canSign()) {
            throw new Error('Private key required for trading');
        }
        if (!this.solanaClient || !this.instructionBuilder) {
            throw new Error('Solana client not initialized');
        }
        const walletAddress = this.auth.getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address not configured');
        }
        // Validate order
        const jupiterSymbol = this.symbolToExchange(request.symbol);
        if (!isValidMarket(jupiterSymbol)) {
            throw new Error(`Invalid market: ${request.symbol}`);
        }
        const leverage = request.leverage || 1;
        const validation = validateOrderParams({
            symbol: request.symbol,
            side: request.side === 'buy' ? 'long' : 'short',
            sizeUsd: request.amount * (request.price || (await this.getCurrentPrice(request.symbol))),
            leverage,
        });
        if (!validation.valid) {
            throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
        }
        try {
            // Get current price
            const currentPrice = request.price || (await this.getCurrentPrice(request.symbol));
            const sizeUsd = request.amount * currentPrice;
            const collateralUsd = sizeUsd / leverage;
            // Resolve accounts
            const side = request.side === 'buy' ? 'long' : 'short';
            const accounts = await this.instructionBuilder.resolvePositionAccounts(walletAddress, request.symbol, side);
            // Get owner's USDC token account
            accounts.ownerTokenAccount = await this.auth.getAssociatedTokenAddress(JUPITER_TOKEN_MINTS.USDC);
            // Build open position instruction
            const instruction = await this.instructionBuilder.buildOpenPositionInstruction({
                owner: walletAddress,
                side,
                symbol: request.symbol,
                sizeUsd,
                collateralAmount: collateralUsd,
                priceLimit: request.price,
            }, accounts);
            // Build and send transaction
            const transaction = await this.solanaClient.createTransaction();
            await this.solanaClient.addInstructions(transaction, [instruction]);
            // Set fee payer
            const { PublicKey } = await import('@solana/web3.js');
            transaction.feePayer = new PublicKey(walletAddress);
            // Sign and send
            const signedTx = await this.auth.signTransaction(transaction);
            const keypair = this.auth.getKeypair();
            if (!keypair) {
                throw new Error('Keypair not available');
            }
            const result = await this.solanaClient.sendTransaction(signedTx, [keypair]);
            // Return normalized order
            const orderId = result.signature;
            const timestamp = Date.now();
            return {
                id: orderId,
                clientOrderId: request.clientOrderId,
                timestamp,
                symbol: request.symbol,
                type: 'market', // Jupiter uses instant execution
                side: request.side,
                price: currentPrice,
                amount: request.amount,
                filled: request.amount, // Instant execution
                remaining: 0,
                status: 'closed',
                averagePrice: currentPrice,
                reduceOnly: request.reduceOnly || false,
                postOnly: false,
                info: {
                    txSignature: result.signature,
                    slot: result.slot,
                    leverage,
                    collateralUsd,
                    cost: sizeUsd,
                    fee: sizeUsd * 0.0006, // 0.06% fee
                },
            };
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async cancelOrder(_orderId, _symbol) {
        throw new Error('Jupiter uses instant execution - no orders to cancel');
    }
    async cancelAllOrders(_symbol) {
        throw new Error('Jupiter uses instant execution - no orders to cancel');
    }
    /**
     * Close a position
     */
    async closePosition(positionId, params) {
        this.ensureInitialized();
        if (!this.auth?.canSign()) {
            throw new Error('Private key required for trading');
        }
        if (!this.solanaClient || !this.instructionBuilder) {
            throw new Error('Solana client not initialized');
        }
        const walletAddress = this.auth.getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address not configured');
        }
        try {
            // Fetch position to get details
            const positions = await this.fetchPositions();
            const position = positions.find((p) => p.info?.id === positionId);
            if (!position) {
                throw new Error(`Position not found: ${positionId}`);
            }
            // Resolve accounts
            const side = position.side === 'long' ? 'long' : 'short';
            const accounts = await this.instructionBuilder.resolvePositionAccounts(walletAddress, position.symbol, side);
            accounts.ownerTokenAccount = await this.auth.getAssociatedTokenAddress(JUPITER_TOKEN_MINTS.USDC);
            // Build close position instruction
            const instruction = await this.instructionBuilder.buildClosePositionInstruction({
                owner: walletAddress,
                position: positionId,
                sizeUsd: params?.sizeUsd,
                priceLimit: params?.priceLimit,
            }, accounts);
            // Build and send transaction
            const transaction = await this.solanaClient.createTransaction();
            await this.solanaClient.addInstructions(transaction, [instruction]);
            const { PublicKey } = await import('@solana/web3.js');
            transaction.feePayer = new PublicKey(walletAddress);
            const signedTx = await this.auth.signTransaction(transaction);
            const keypair = this.auth.getKeypair();
            if (!keypair) {
                throw new Error('Keypair not available');
            }
            const result = await this.solanaClient.sendTransaction(signedTx, [keypair]);
            const timestamp = Date.now();
            const positionSize = Math.abs(position.size);
            const notional = positionSize * position.markPrice;
            return {
                id: result.signature,
                timestamp,
                symbol: position.symbol,
                type: 'market',
                side: position.side === 'long' ? 'sell' : 'buy',
                price: position.markPrice,
                amount: positionSize,
                filled: positionSize,
                remaining: 0,
                status: 'closed',
                averagePrice: position.markPrice,
                reduceOnly: true,
                postOnly: false,
                info: {
                    txSignature: result.signature,
                    slot: result.slot,
                    closedPositionId: positionId,
                    cost: notional,
                    fee: notional * 0.0006,
                },
            };
        }
        catch (error) {
            throw mapJupiterError(error);
        }
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        // Jupiter doesn't have a traditional order history
        this.warn('Jupiter Perps does not maintain order history - trades are instant');
        return [];
    }
    async fetchMyTrades(_symbol, _since, _limit) {
        // Would require indexing on-chain transactions
        this.warn('Trade history requires indexing on-chain transactions');
        return [];
    }
    async setLeverage(_symbol, _leverage) {
        throw new Error('Jupiter leverage is set per-trade, not globally');
    }
    // ==========================================================================
    // Health Check
    // ==========================================================================
    async performApiHealthCheck() {
        // Check price API connectivity
        await this.fetchPrices(['SOL']);
    }
    // ==========================================================================
    // Helper Methods
    // ==========================================================================
    /**
     * Get current price for a symbol
     */
    async getCurrentPrice(symbol) {
        const jupiterSymbol = this.symbolToExchange(symbol);
        const baseToken = jupiterSymbol.replace('-PERP', '');
        const mint = JUPITER_TOKEN_MINTS[baseToken];
        if (!mint) {
            throw new Error(`Unknown token for market: ${symbol}`);
        }
        const priceData = await this.fetchPrice(mint);
        return parseFloat(priceData.price);
    }
    /**
     * Fetch price from Jupiter Price API
     */
    async fetchPrice(tokenMint) {
        // Check cache
        const cached = this.priceCache.get(tokenMint);
        if (cached && Date.now() - cached.timestamp < this.priceCacheTTL) {
            return cached.price;
        }
        const prices = await this.fetchPrices([tokenMint]);
        const price = prices[tokenMint];
        if (!price) {
            throw new Error(`Price not available for ${tokenMint}`);
        }
        return price;
    }
    /**
     * Fetch prices for multiple tokens
     */
    async fetchPrices(tokenMints) {
        // Map token symbols to mints if needed
        const mints = tokenMints.map((t) => {
            if (t in JUPITER_TOKEN_MINTS) {
                return JUPITER_TOKEN_MINTS[t];
            }
            return t;
        });
        const url = buildPriceApiUrl(mints);
        const response = await this.request('GET', url);
        // Cache results
        for (const [id, data] of Object.entries(response.data)) {
            this.priceCache.set(id, { price: data, timestamp: Date.now() });
        }
        return response.data;
    }
    /**
     * Filter markets by params
     */
    filterMarkets(markets, params) {
        if (!params)
            return markets;
        let filtered = markets;
        if (params.active !== undefined) {
            filtered = filtered.filter((m) => m.active === params.active);
        }
        if (params.ids && params.ids.length > 0) {
            filtered = filtered.filter((m) => params.ids.includes(m.id));
        }
        return filtered;
    }
    /**
     * Create mock custody account for funding rate calculation
     */
    createMockCustodyForFunding() {
        return {
            pool: '',
            mint: '',
            tokenAccount: '',
            decimals: 6,
            isStable: false,
            oracle: {
                oracleType: 'Pyth',
                oracleAccount: '',
                maxPriceAge: 60,
                maxPriceDeviation: 100,
            },
            pricing: {
                useEma: true,
                tradeSpread: 10,
                swapSpread: 10,
                minInitialLeverage: 1,
                maxInitialLeverage: 250,
                maxLeverage: 250,
                maxPositionLockedUsd: 10000000,
                maxUtilization: 0.8,
            },
            trading: {
                tradingEnabled: true,
                allowOpenPosition: true,
                allowClosePosition: true,
                allowAddCollateral: true,
                allowRemoveCollateral: true,
                allowIncreaseSize: true,
                allowDecreaseSize: true,
            },
            fundingRateState: {
                cumulativeInterestRate: '0',
                lastUpdate: Math.floor(Date.now() / 1000),
                hourlyBorrowRate: '0.0001', // 0.01% per hour
            },
            assets: {
                owned: '0',
                locked: '0',
                guaranteedUsd: '0',
                globalShortSizes: '0',
                globalShortAveragePrices: '0',
            },
            bump: 0,
        };
    }
    /**
     * Parse position account data from buffer
     */
    parsePositionAccount(data) {
        // Skip 8 byte discriminator
        let offset = 8;
        // Parse fields (simplified - actual implementation depends on IDL)
        const owner = data.slice(offset, offset + 32).toString('hex');
        offset += 32;
        const pool = data.slice(offset, offset + 32).toString('hex');
        offset += 32;
        const custody = data.slice(offset, offset + 32).toString('hex');
        offset += 32;
        const collateralCustody = data.slice(offset, offset + 32).toString('hex');
        offset += 32;
        const openTime = Number(data.readBigUInt64LE(offset));
        offset += 8;
        const updateTime = Number(data.readBigUInt64LE(offset));
        offset += 8;
        const sideValue = data.readUInt8(offset);
        offset += 1;
        const side = sideValue === 0 ? 'Long' : 'Short';
        const priceValue = data.readBigUInt64LE(offset);
        offset += 8;
        const price = (Number(priceValue) / 1e6).toString();
        const sizeUsdValue = data.readBigUInt64LE(offset);
        offset += 8;
        const sizeUsd = (Number(sizeUsdValue) / 1e6).toString();
        const sizeTokensValue = data.readBigUInt64LE(offset);
        offset += 8;
        const sizeTokens = (Number(sizeTokensValue) / 1e9).toString();
        const collateralUsdValue = data.readBigUInt64LE(offset);
        offset += 8;
        const collateralUsd = (Number(collateralUsdValue) / 1e6).toString();
        const unrealizedPnlValue = data.readBigInt64LE(offset);
        offset += 8;
        const unrealizedPnl = (Number(unrealizedPnlValue) / 1e6).toString();
        const realizedPnlValue = data.readBigInt64LE(offset);
        offset += 8;
        const realizedPnl = (Number(realizedPnlValue) / 1e6).toString();
        return {
            owner,
            pool,
            custody,
            collateralCustody,
            openTime,
            updateTime,
            side,
            price,
            sizeUsd,
            sizeTokens,
            collateralUsd,
            unrealizedPnl,
            realizedPnl,
            cumulativeInterestSnapshot: '0',
            lockedAmount: '0',
            bump: 0,
        };
    }
    /**
     * Get symbol from custody address
     */
    getSymbolFromCustody(_custody) {
        // In a real implementation, we would look up the custody to determine the market
        // For now, we'll return a default
        return 'SOL/USD:USD';
    }
    /**
     * Normalize position to SDK format
     */
    normalizePosition(pubkey, data, markPrice, symbol) {
        const side = data.side === 'Long' ? 'long' : 'short';
        const entryPrice = parseFloat(data.price);
        const sizeUsd = parseFloat(data.sizeUsd);
        const sizeTokens = parseFloat(data.sizeTokens);
        const collateralUsd = parseFloat(data.collateralUsd);
        const unrealizedPnl = parseFloat(data.unrealizedPnl);
        const leverage = sizeUsd / collateralUsd;
        // Calculate liquidation price
        const liquidationPrice = calculateLiquidationPrice(side, entryPrice, collateralUsd, sizeUsd);
        return {
            symbol,
            side,
            size: sizeTokens,
            entryPrice,
            markPrice,
            leverage,
            unrealizedPnl,
            realizedPnl: parseFloat(data.realizedPnl),
            liquidationPrice,
            marginMode: 'isolated',
            marginRatio: collateralUsd / sizeUsd,
            margin: collateralUsd,
            maintenanceMargin: sizeUsd * 0.01, // 1% maintenance margin
            timestamp: parseOnChainTimestamp(data.updateTime),
            info: {
                id: pubkey,
                owner: data.owner,
                openTime: data.openTime,
                notional: sizeUsd,
                percentage: (unrealizedPnl / collateralUsd) * 100,
            },
        };
    }
    /**
     * Get wallet address (for position queries)
     */
    async getAddress() {
        return this.auth?.getWalletAddress();
    }
}
//# sourceMappingURL=JupiterAdapter.js.map