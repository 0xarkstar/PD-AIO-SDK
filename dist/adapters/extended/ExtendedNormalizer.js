/**
 * Extended Normalizer
 *
 * Data transformation layer for Extended exchange
 * Converts Extended-specific formats to unified SDK format
 */
import { safeParseFloat } from './utils.js';
export class ExtendedNormalizer {
    /**
     * Convert Extended symbol to unified CCXT format
     * Handles multiple Extended formats:
     * "BTC-USD-PERP" → "BTC/USD:USD"
     * "BTCUSD" → "BTC/USD:USD"
     */
    symbolToCCXT(extendedSymbol) {
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
     * "BTC/USD:USD" → "BTC-USD-PERP"
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
        // Extended uses "BTC-USD-PERP" format
        return `${base}-${quote}-PERP`;
    }
    /**
     * Normalize market data
     */
    normalizeMarket(market) {
        const unifiedSymbol = this.symbolToCCXT(market.symbol);
        return {
            id: market.marketId,
            symbol: unifiedSymbol,
            base: market.baseAsset,
            quote: market.quoteAsset,
            settle: market.settleAsset,
            contractSize: safeParseFloat(market.contractMultiplier) || 1,
            active: market.isActive,
            minAmount: safeParseFloat(market.minOrderQuantity),
            maxAmount: safeParseFloat(market.maxOrderQuantity),
            pricePrecision: market.pricePrecision,
            amountPrecision: market.quantityPrecision,
            priceTickSize: safeParseFloat(market.minPrice),
            amountStepSize: safeParseFloat(market.minOrderQuantity),
            makerFee: 0.0002,
            takerFee: 0.0005,
            maxLeverage: market.maxLeverage ? safeParseFloat(market.maxLeverage) : 1,
            fundingIntervalHours: 8,
            info: market,
        };
    }
    /**
     * Normalize ticker data
     */
    normalizeTicker(ticker) {
        const unifiedSymbol = this.symbolToCCXT(ticker.symbol);
        return {
            symbol: unifiedSymbol,
            timestamp: ticker.timestamp,
            high: safeParseFloat(ticker.high24h),
            low: safeParseFloat(ticker.low24h),
            bid: safeParseFloat(ticker.bidPrice),
            ask: safeParseFloat(ticker.askPrice),
            last: safeParseFloat(ticker.lastPrice),
            open: safeParseFloat(ticker.lastPrice),
            close: safeParseFloat(ticker.lastPrice),
            baseVolume: safeParseFloat(ticker.volume24h),
            quoteVolume: safeParseFloat(ticker.quoteVolume24h),
            change: safeParseFloat(ticker.priceChange24h),
            percentage: safeParseFloat(ticker.priceChangePercent24h),
            info: ticker,
        };
    }
    /**
     * Normalize order book data
     */
    normalizeOrderBook(orderbook) {
        const unifiedSymbol = this.symbolToCCXT(orderbook.symbol);
        return {
            exchange: 'extended',
            symbol: unifiedSymbol,
            bids: orderbook.bids.map(([price, amount]) => [
                safeParseFloat(price),
                safeParseFloat(amount),
            ]),
            asks: orderbook.asks.map(([price, amount]) => [
                safeParseFloat(price),
                safeParseFloat(amount),
            ]),
            timestamp: orderbook.timestamp,
        };
    }
    /**
     * Normalize trade data
     */
    normalizeTrade(trade) {
        const unifiedSymbol = this.symbolToCCXT(trade.symbol);
        return {
            id: trade.id,
            orderId: undefined,
            symbol: unifiedSymbol,
            side: trade.side,
            price: safeParseFloat(trade.price),
            amount: safeParseFloat(trade.quantity),
            cost: safeParseFloat(trade.price) * safeParseFloat(trade.quantity),
            timestamp: trade.timestamp,
            info: trade,
        };
    }
    /**
     * Normalize funding rate data
     */
    normalizeFundingRate(fundingRate) {
        const unifiedSymbol = this.symbolToCCXT(fundingRate.symbol);
        return {
            symbol: unifiedSymbol,
            fundingRate: safeParseFloat(fundingRate.fundingRate),
            fundingTimestamp: fundingRate.fundingTime,
            nextFundingTimestamp: fundingRate.nextFundingTime || 0,
            markPrice: safeParseFloat(fundingRate.markPrice),
            indexPrice: safeParseFloat(fundingRate.indexPrice),
            fundingIntervalHours: 8,
            info: fundingRate,
        };
    }
    /**
     * Normalize order data
     */
    normalizeOrder(order) {
        const unifiedSymbol = this.symbolToCCXT(order.symbol);
        const filled = safeParseFloat(order.filledQuantity || '0');
        const amount = safeParseFloat(order.quantity);
        const remaining = safeParseFloat(order.remainingQuantity || String(amount - filled));
        return {
            id: order.orderId,
            clientOrderId: order.clientOrderId,
            symbol: unifiedSymbol,
            type: this.normalizeOrderType(order.type),
            side: order.side,
            price: order.price ? safeParseFloat(order.price) : undefined,
            stopPrice: order.stopPrice ? safeParseFloat(order.stopPrice) : undefined,
            amount: amount,
            filled: filled,
            remaining: remaining,
            reduceOnly: false,
            postOnly: false,
            status: this.normalizeOrderStatus(order.status),
            timestamp: order.timestamp,
            lastUpdateTimestamp: order.updateTime,
            info: order,
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
        const unifiedSymbol = this.symbolToCCXT(position.symbol);
        const size = safeParseFloat(position.size);
        const markPrice = safeParseFloat(position.markPrice);
        return {
            symbol: unifiedSymbol,
            side: position.side,
            size: size,
            entryPrice: safeParseFloat(position.entryPrice),
            markPrice: markPrice,
            leverage: safeParseFloat(position.leverage),
            liquidationPrice: safeParseFloat(position.liquidationPrice),
            unrealizedPnl: safeParseFloat(position.unrealizedPnl),
            realizedPnl: 0,
            margin: safeParseFloat(position.initialMargin),
            maintenanceMargin: safeParseFloat(position.maintenanceMargin),
            marginRatio: safeParseFloat(position.maintenanceMargin) / (size * markPrice),
            marginMode: position.marginMode,
            timestamp: position.timestamp,
            info: position,
        };
    }
    /**
     * Normalize balance data
     */
    normalizeBalance(balance) {
        return {
            currency: balance.asset,
            free: safeParseFloat(balance.free),
            used: safeParseFloat(balance.locked),
            total: safeParseFloat(balance.total),
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