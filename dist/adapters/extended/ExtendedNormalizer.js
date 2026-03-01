/**
 * Extended Normalizer
 *
 * Data transformation layer for Extended exchange
 * Converts Extended-specific formats to unified SDK format
 */
import { ExtendedOrderSchema, ExtendedPositionSchema, ExtendedBalanceSchema, ExtendedTickerSchema, ExtendedOrderBookSchema, ExtendedTradeSchema, ExtendedFundingRateSchema, } from './types.js';
import { safeParseFloat } from './utils.js';
/**
 * Type guard: Check if market data is in API format
 */
function isApiFormat(market) {
    return 'name' in market && 'assetName' in market;
}
export class ExtendedNormalizer {
    /**
     * Convert Extended symbol to unified CCXT format
     * Handles multiple Extended formats:
     * "BTC-USD-PERP" → "BTC/USD:USD"
     * "BTCUSD" → "BTC/USD:USD"
     */
    symbolToCCXT(extendedSymbol) {
        // Guard: return as-is if symbol is null/undefined/empty
        if (!extendedSymbol) {
            return extendedSymbol ?? '';
        }
        // Handle "BTC-USD-PERP" format
        if (extendedSymbol.includes('-')) {
            const parts = extendedSymbol.split('-');
            if (parts.length >= 2) {
                const [base, quote] = parts;
                return `${base}/${quote}:${quote}`;
            }
        }
        // Handle "BTCUSD" format
        const match = extendedSymbol.match(/^([A-Z]+)(USD|USDT|USDC)$/);
        if (match) {
            const [, base, quote] = match;
            return `${base}/${quote}:${quote}`;
        }
        // Fallback: return as-is
        return extendedSymbol;
    }
    /**
     * Convert unified CCXT symbol to Extended format
     * "BTC/USD:USD" → "BTC-USD"
     */
    symbolFromCCXT(ccxtSymbol) {
        const [pair] = ccxtSymbol.split(':');
        if (!pair) {
            return ccxtSymbol;
        }
        const [base, quote] = pair.split('/');
        if (!base || !quote) {
            return ccxtSymbol;
        }
        // Extended uses "BTC-USD" format (no -PERP suffix)
        return `${base}-${quote}`;
    }
    /**
     * Normalize market data
     *
     * Handles both legacy SDK type format and actual API response format:
     * - API returns: {name, assetName, collateralAssetName, tradingConfig, active, ...}
     * - Legacy type: {symbol, marketId, baseAsset, quoteAsset, ...}
     */
    normalizeMarket(market) {
        // Handle actual API format vs legacy format
        const rawSymbol = isApiFormat(market) ? market.name : market.symbol;
        const unifiedSymbol = this.symbolToCCXT(rawSymbol);
        // Extract base/quote from API or legacy format
        const base = isApiFormat(market) ? market.assetName : market.baseAsset;
        const quote = isApiFormat(market)
            ? market.collateralAssetName
            : market.quoteAsset || 'USD';
        const settle = isApiFormat(market) ? quote : market.settleAsset || quote;
        // Handle active flag from API or legacy
        const isActive = isApiFormat(market) ? market.active : market.isActive ?? true;
        // Extract trading config from actual API response or legacy format
        const tradingConfig = isApiFormat(market) ? market.tradingConfig : undefined;
        const minOrderSize = tradingConfig?.minOrderSize ||
            (isApiFormat(market) ? '0' : market.minOrderQuantity || '0');
        const maxLeverage = tradingConfig?.maxLeverage ||
            (isApiFormat(market) ? '1' : market.maxLeverage || '1');
        const minPriceChange = tradingConfig?.minPriceChange ||
            (isApiFormat(market) ? '0.01' : market.minPrice || '0.01');
        // Extract precision from API or legacy
        const pricePrecision = isApiFormat(market)
            ? market.collateralAssetPrecision ?? 2
            : market.pricePrecision ?? 2;
        const amountPrecision = isApiFormat(market)
            ? market.assetPrecision ?? 0
            : market.quantityPrecision ?? 0;
        // Market ID: prefer name (API) or marketId (legacy) over symbol
        const id = isApiFormat(market) ? market.name : market.marketId;
        return {
            id,
            symbol: unifiedSymbol,
            base,
            quote,
            settle,
            contractSize: safeParseFloat(market.contractMultiplier) || 1,
            active: isActive,
            minAmount: safeParseFloat(minOrderSize),
            maxAmount: tradingConfig
                ? safeParseFloat(tradingConfig.maxPositionValue)
                : safeParseFloat(isApiFormat(market) ? '0' : market.maxOrderQuantity || '0'),
            pricePrecision,
            amountPrecision,
            priceTickSize: safeParseFloat(minPriceChange),
            amountStepSize: safeParseFloat(tradingConfig?.minOrderSizeChange || minOrderSize),
            makerFee: 0.0002,
            takerFee: 0.0005,
            maxLeverage: safeParseFloat(maxLeverage),
            fundingIntervalHours: 8,
            info: market,
        };
    }
    /**
     * Normalize ticker data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {lastPrice, bidPrice, askPrice, dailyHigh, dailyLow, dailyVolume, dailyPriceChange, ...}
     * - Legacy type: {lastPrice, bidPrice, askPrice, high24h, low24h, volume24h, priceChange24h, ...}
     */
    normalizeTicker(ticker) {
        const validated = ExtendedTickerSchema.parse(ticker);
        const raw = validated;
        const unifiedSymbol = this.symbolToCCXT(raw.symbol || raw.market || '');
        return {
            symbol: unifiedSymbol,
            timestamp: raw.timestamp || Date.now(),
            high: safeParseFloat(raw.dailyHigh || raw.high24h),
            low: safeParseFloat(raw.dailyLow || raw.low24h),
            bid: safeParseFloat(raw.bidPrice),
            ask: safeParseFloat(raw.askPrice),
            last: safeParseFloat(raw.lastPrice),
            open: safeParseFloat(raw.lastPrice),
            close: safeParseFloat(raw.lastPrice),
            baseVolume: safeParseFloat(raw.dailyVolumeBase || raw.volume24h),
            quoteVolume: safeParseFloat(raw.dailyVolume || raw.quoteVolume24h),
            change: safeParseFloat(raw.dailyPriceChange || raw.priceChange24h),
            percentage: safeParseFloat(raw.dailyPriceChangePercentage || raw.priceChangePercent24h),
            info: {
                ...validated,
                _bidAskSource: 'orderbook',
            },
        };
    }
    /**
     * Normalize order book data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {market, bid: [{qty, price}], ask: [{qty, price}]}
     * - Legacy type: {symbol, bids: [[price, size]], asks: [[price, size]]}
     */
    normalizeOrderBook(orderbook) {
        const validated = ExtendedOrderBookSchema.parse(orderbook);
        const raw = validated;
        const unifiedSymbol = this.symbolToCCXT(raw.symbol || raw.market || '');
        // API uses "bid"/"ask" with object arrays; legacy uses "bids"/"asks" with tuples
        const rawBids = raw.bid || raw.bids || [];
        const rawAsks = raw.ask || raw.asks || [];
        const parseSide = (entries) => entries.map((entry) => {
            if (Array.isArray(entry)) {
                return [safeParseFloat(entry[0]), safeParseFloat(entry[1])];
            }
            return [safeParseFloat(entry.price), safeParseFloat(entry.qty)];
        });
        return {
            exchange: 'extended',
            symbol: unifiedSymbol,
            bids: parseSide(rawBids),
            asks: parseSide(rawAsks),
            timestamp: raw.timestamp || Date.now(),
        };
    }
    /**
     * Normalize trade data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {i (id), m (market), S (side), tT (tradeType), T (timestamp), p (price), q (qty)}
     * - Legacy type: {id, symbol, side, price, quantity, timestamp}
     */
    normalizeTrade(trade) {
        const validated = ExtendedTradeSchema.parse(trade);
        const raw = validated;
        const symbol = raw.symbol || raw.m || '';
        const unifiedSymbol = this.symbolToCCXT(symbol);
        const rawSide = raw.side || (raw.S === 'BUY' ? 'buy' : raw.S === 'SELL' ? 'sell' : raw.S?.toLowerCase());
        const side = rawSide;
        const price = safeParseFloat(raw.price || raw.p);
        const amount = safeParseFloat(raw.quantity || raw.q);
        return {
            id: String(raw.id || raw.i || ''),
            orderId: undefined,
            symbol: unifiedSymbol,
            side,
            price,
            amount,
            cost: price * amount,
            timestamp: raw.timestamp || raw.T,
            info: validated,
        };
    }
    /**
     * Normalize funding rate data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {m (market), f (fundingRate), T (timestamp)}
     * - Legacy type: {symbol, fundingRate, fundingTime, markPrice, indexPrice}
     */
    normalizeFundingRate(fundingRate) {
        const validated = ExtendedFundingRateSchema.parse(fundingRate);
        const raw = validated;
        const symbol = raw.symbol || raw.m || '';
        const unifiedSymbol = this.symbolToCCXT(symbol);
        return {
            symbol: unifiedSymbol,
            fundingRate: safeParseFloat(raw.fundingRate || raw.f),
            fundingTimestamp: raw.fundingTime || raw.T || 0,
            nextFundingTimestamp: raw.nextFundingTime || 0,
            markPrice: safeParseFloat(raw.markPrice),
            indexPrice: safeParseFloat(raw.indexPrice),
            fundingIntervalHours: 1,
            info: validated,
        };
    }
    /**
     * Normalize order data
     */
    normalizeOrder(order) {
        const validated = ExtendedOrderSchema.parse(order);
        const unifiedSymbol = this.symbolToCCXT(validated.symbol);
        const filled = safeParseFloat(validated.filledQuantity || '0');
        const amount = safeParseFloat(validated.quantity);
        const remaining = safeParseFloat(validated.remainingQuantity || String(amount - filled));
        return {
            id: validated.orderId,
            clientOrderId: validated.clientOrderId,
            symbol: unifiedSymbol,
            type: this.normalizeOrderType(validated.type),
            side: validated.side,
            price: validated.price ? safeParseFloat(validated.price) : undefined,
            stopPrice: validated.stopPrice ? safeParseFloat(validated.stopPrice) : undefined,
            amount: amount,
            filled: filled,
            remaining: remaining,
            reduceOnly: false,
            postOnly: false,
            status: this.normalizeOrderStatus(validated.status),
            timestamp: validated.timestamp,
            lastUpdateTimestamp: validated.updateTime,
            info: validated,
        };
    }
    /**
     * Normalize order type
     */
    normalizeOrderType(type) {
        switch (type) {
            case 'market':
                return 'market';
            case 'limit':
            case 'stop':
            case 'stop_limit':
                return 'limit';
            default:
                return 'limit';
        }
    }
    /**
     * Normalize order status
     */
    normalizeOrderStatus(status) {
        switch (status) {
            case 'pending':
            case 'open':
                return 'open';
            case 'filled':
                return 'closed';
            case 'cancelled':
                return 'canceled';
            case 'expired':
                return 'expired';
            case 'rejected':
                return 'rejected';
            case 'partially_filled':
                return 'open';
            default:
                return 'open';
        }
    }
    /**
     * Normalize position data
     */
    normalizePosition(position) {
        const validated = ExtendedPositionSchema.parse(position);
        const unifiedSymbol = this.symbolToCCXT(validated.symbol);
        const size = safeParseFloat(validated.size);
        const markPrice = safeParseFloat(validated.markPrice);
        return {
            symbol: unifiedSymbol,
            side: validated.side,
            size: size,
            entryPrice: safeParseFloat(validated.entryPrice),
            markPrice: markPrice,
            leverage: safeParseFloat(validated.leverage),
            liquidationPrice: safeParseFloat(validated.liquidationPrice),
            unrealizedPnl: safeParseFloat(validated.unrealizedPnl),
            realizedPnl: 0,
            margin: safeParseFloat(validated.initialMargin),
            maintenanceMargin: safeParseFloat(validated.maintenanceMargin),
            marginRatio: size * markPrice > 0
                ? safeParseFloat(validated.maintenanceMargin) / (size * markPrice)
                : 0,
            marginMode: validated.marginMode,
            timestamp: validated.timestamp,
            info: {
                ...validated,
                _realizedPnlSource: 'not_available',
            },
        };
    }
    /**
     * Normalize balance data
     */
    normalizeBalance(balance) {
        const validated = ExtendedBalanceSchema.parse(balance);
        return {
            currency: validated.asset,
            free: safeParseFloat(validated.free),
            used: safeParseFloat(validated.locked),
            total: safeParseFloat(validated.total),
        };
    }
    /**
     * Batch normalize markets
     */
    normalizeMarkets(markets) {
        return markets.map((market) => this.normalizeMarket(market));
    }
    /**
     * Batch normalize orders
     */
    normalizeOrders(orders) {
        return orders.map((order) => this.normalizeOrder(order));
    }
    /**
     * Batch normalize positions
     */
    normalizePositions(positions) {
        return positions.map((position) => this.normalizePosition(position));
    }
    /**
     * Batch normalize balances
     */
    normalizeBalances(balances) {
        return balances.map((balance) => this.normalizeBalance(balance));
    }
    /**
     * Batch normalize trades
     */
    normalizeTrades(trades) {
        return trades.map((trade) => this.normalizeTrade(trade));
    }
    /**
     * Batch normalize funding rates
     */
    normalizeFundingRates(rates) {
        return rates.map((rate) => this.normalizeFundingRate(rate));
    }
}
//# sourceMappingURL=ExtendedNormalizer.js.map