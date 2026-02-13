/**
 * Ostium Exchange Adapter
 *
 * Implements IExchangeAdapter for Ostium (Arbitrum, RWA perps)
 * Uses: REST metadata + GraphQL subgraph + EVM contracts
 */
import { NotSupportedError, PerpDEXError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { OSTIUM_METADATA_URL, OSTIUM_RPC_URLS, OSTIUM_RATE_LIMITS, OSTIUM_ENDPOINT_WEIGHTS, OSTIUM_PAIRS, } from './constants.js';
import { OstiumAuth } from './OstiumAuth.js';
import { OstiumContracts } from './OstiumContracts.js';
import { OstiumSubgraph } from './OstiumSubgraph.js';
import { OstiumNormalizer } from './OstiumNormalizer.js';
import { toOstiumPairIndex, formatCollateral, formatPrice, toUnifiedSymbol } from './utils.js';
import { mapOstiumError } from './error-codes.js';
export class OstiumAdapter extends BaseAdapter {
    id = 'ostium';
    name = 'Ostium';
    has = {
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: false,
        fetchTrades: true,
        fetchFundingRate: false,
        createOrder: true,
        cancelOrder: true,
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: false,
    };
    metadataUrl;
    auth;
    contracts;
    subgraph;
    rateLimiter;
    normalizer;
    referralAddress;
    builderCodeEnabled;
    constructor(config = {}) {
        super(config);
        this.metadataUrl = config.metadataUrl ?? OSTIUM_METADATA_URL;
        const rpcUrl = config.rpcUrl ?? OSTIUM_RPC_URLS.mainnet;
        if (config.privateKey) {
            this.auth = new OstiumAuth({
                privateKey: config.privateKey,
                rpcUrl,
            });
            this.contracts = new OstiumContracts(rpcUrl, config.privateKey);
        }
        this.subgraph = new OstiumSubgraph(config.subgraphUrl);
        this.normalizer = new OstiumNormalizer();
        this.referralAddress =
            config.referralAddress ?? config.builderCode ?? '0x0000000000000000000000000000000000000000';
        this.builderCodeEnabled = config.builderCodeEnabled ?? true;
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? OSTIUM_RATE_LIMITS.metadata.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? OSTIUM_RATE_LIMITS.metadata.windowMs,
            refillRate: (config.rateLimit?.maxRequests ?? OSTIUM_RATE_LIMITS.metadata.maxRequests) / 60,
            weights: OSTIUM_ENDPOINT_WEIGHTS,
        });
    }
    async initialize() {
        this._isReady = true;
    }
    requireAuth() {
        if (!this.auth?.hasCredentials() || !this.contracts) {
            throw new PerpDEXError('Private key required for trading', 'MISSING_CREDENTIALS', 'ostium');
        }
    }
    async fetchMetadata(path, feature) {
        await this.rateLimiter.acquire(feature);
        try {
            const response = await fetch(`${this.metadataUrl}${path}`);
            if (!response.ok) {
                throw new Error(`Metadata request failed: ${response.status}`);
            }
            return (await response.json());
        }
        catch (error) {
            throw mapOstiumError(error);
        }
    }
    // === Public Market Data ===
    async fetchMarkets(_params) {
        return OSTIUM_PAIRS.map((pair) => this.normalizer.normalizeMarket(pair));
    }
    async fetchTicker(symbol) {
        const pairIndex = toOstiumPairIndex(symbol);
        const pair = OSTIUM_PAIRS.find((p) => p.pairIndex === pairIndex);
        if (!pair) {
            throw new PerpDEXError(`Unknown pair: ${symbol}`, 'PAIR_NOT_FOUND', 'ostium');
        }
        const response = await this.fetchMetadata(`/PricePublish/latest-price?pair=${pair.name}`, 'fetchTicker');
        return this.normalizer.normalizeTicker(response, pair);
    }
    async fetchOrderBook(_symbol, _params) {
        throw new NotSupportedError('Ostium does not have an order book (on-chain DEX)', 'NOT_SUPPORTED', 'ostium');
    }
    async fetchTrades(symbol, params) {
        const pairIndex = toOstiumPairIndex(symbol);
        const limit = params?.limit ?? 100;
        try {
            const trades = await this.subgraph.fetchTrades(pairIndex, limit);
            return trades.map((t) => this.normalizer.normalizeTrade(t));
        }
        catch (error) {
            throw mapOstiumError(error);
        }
    }
    async fetchFundingRate(_symbol) {
        throw new NotSupportedError('Ostium uses rollover fees, not funding rates', 'NOT_SUPPORTED', 'ostium');
    }
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        throw new NotSupportedError('Ostium uses rollover fees, not funding rates', 'NOT_SUPPORTED', 'ostium');
    }
    // === Private Trading ===
    async createOrder(request) {
        this.requireAuth();
        const pairIndex = toOstiumPairIndex(request.symbol);
        try {
            const effectiveReferral = this.builderCodeEnabled
                ? (request.builderCode ?? this.referralAddress)
                : '0x0000000000000000000000000000000000000000';
            const result = await this.contracts.openTrade({
                pairIndex,
                positionSizeDai: formatCollateral(request.amount),
                openPrice: formatPrice(request.price ?? 0),
                buy: request.side === 'buy',
                leverage: request.leverage ?? 10,
                tp: '0',
                sl: '0',
                referral: effectiveReferral,
            });
            return {
                id: result.hash,
                symbol: request.symbol,
                type: request.type,
                side: request.side,
                amount: request.amount,
                price: request.price,
                status: 'open',
                filled: 0,
                remaining: request.amount,
                reduceOnly: request.reduceOnly ?? false,
                postOnly: false,
                timestamp: Date.now(),
                info: { txHash: result.hash },
            };
        }
        catch (error) {
            throw mapOstiumError(error);
        }
    }
    async cancelOrder(orderId, _symbol) {
        this.requireAuth();
        const parts = orderId.split('-');
        const pairIndexStr = parts[0] ?? '';
        const indexStr = parts[1] ?? '';
        const pairIndex = parseInt(pairIndexStr, 10);
        const index = parseInt(indexStr, 10);
        if (isNaN(pairIndex) || isNaN(index)) {
            throw new PerpDEXError(`Invalid order ID format: ${orderId}`, 'INVALID_ORDER_ID', 'ostium');
        }
        try {
            const result = await this.contracts.cancelOrder(pairIndex, index);
            return {
                id: orderId,
                symbol: toUnifiedSymbol(pairIndex),
                type: 'limit',
                side: 'buy',
                amount: 0,
                status: 'canceled',
                filled: 0,
                remaining: 0,
                reduceOnly: false,
                postOnly: false,
                timestamp: Date.now(),
                info: { txHash: result.hash },
            };
        }
        catch (error) {
            throw mapOstiumError(error);
        }
    }
    async cancelAllOrders(_symbol) {
        throw new NotSupportedError('Ostium does not support batch cancel', 'NOT_SUPPORTED', 'ostium');
    }
    // === Private Account ===
    async fetchPositions(_symbols) {
        this.requireAuth();
        try {
            const trader = this.contracts.getTraderAddress();
            const positions = await this.subgraph.fetchPositions(trader);
            return positions.map((p) => this.normalizer.normalizePosition(p));
        }
        catch (error) {
            throw mapOstiumError(error);
        }
    }
    async fetchBalance() {
        this.requireAuth();
        try {
            const address = this.contracts.getTraderAddress();
            const rawBalance = await this.contracts.getCollateralBalance(address);
            return [this.normalizer.normalizeBalance(rawBalance)];
        }
        catch (error) {
            throw mapOstiumError(error);
        }
    }
    async setLeverage(_symbol, _leverage) {
        throw new NotSupportedError('Ostium sets leverage per-trade, not per-symbol', 'NOT_SUPPORTED', 'ostium');
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        throw new NotSupportedError('Ostium order history not available via REST', 'NOT_SUPPORTED', 'ostium');
    }
    async fetchMyTrades(_symbol, _since, _limit) {
        throw new NotSupportedError('Ostium user trades not available via REST', 'NOT_SUPPORTED', 'ostium');
    }
    // === Symbol Conversion ===
    symbolToExchange(symbol) {
        return String(toOstiumPairIndex(symbol));
    }
    symbolFromExchange(exchangeSymbol) {
        const pairIndex = parseInt(exchangeSymbol, 10);
        const pair = OSTIUM_PAIRS.find((p) => p.pairIndex === pairIndex);
        return pair ? `${pair.from}/${pair.to}:${pair.to}` : exchangeSymbol;
    }
}
//# sourceMappingURL=OstiumAdapter.js.map