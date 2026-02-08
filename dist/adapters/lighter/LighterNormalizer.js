/**
 * Lighter Normalizer
 *
 * Transforms Lighter-specific data structures to unified SDK format
 */
export class LighterNormalizer {
    /**
     * Convert unified symbol to Lighter format
     * BTC/USDC:USDC -> BTC (Lighter uses simple symbol names for perps)
     */
    toLighterSymbol(symbol) {
        const [baseQuote] = symbol.split(':');
        const [base] = (baseQuote || '').split('/');
        return base || symbol;
    }
    /**
     * Convert Lighter symbol to unified format
     * BTC -> BTC/USDC:USDC (Lighter perps use USDC as quote/settle)
     */
    normalizeSymbol(lighterSymbol) {
        // Lighter perp markets use simple symbols like "BTC", "ETH"
        // Quote currency is USDC
        return `${lighterSymbol}/USDC:USDC`;
    }
    /**
     * Normalize Lighter market to unified format
     * Handles real Lighter API response format from /api/v1/orderBookDetails
     */
    normalizeMarket(lighterMarket) {
        // Real API returns: { symbol: "BTC", market_type: "perp", ... }
        const base = lighterMarket.symbol;
        const quote = 'USDC'; // Lighter uses USDC as quote currency
        const symbol = `${base}/${quote}:${quote}`;
        // Extract precision from API response
        const pricePrecision = lighterMarket.supported_price_decimals || lighterMarket.price_decimals || 2;
        const amountPrecision = lighterMarket.supported_size_decimals || lighterMarket.size_decimals || 4;
        // Parse min amounts from string values
        const minAmount = parseFloat(lighterMarket.min_base_amount || '0');
        // Parse fees
        const makerFee = parseFloat(lighterMarket.maker_fee || '0');
        const takerFee = parseFloat(lighterMarket.taker_fee || '0');
        return {
            id: lighterMarket.symbol,
            symbol,
            base,
            quote,
            settle: quote,
            active: lighterMarket.status === 'active',
            minAmount,
            maxAmount: undefined,
            pricePrecision,
            amountPrecision,
            priceTickSize: Math.pow(10, -pricePrecision),
            amountStepSize: Math.pow(10, -amountPrecision),
            makerFee,
            takerFee,
            maxLeverage: lighterMarket.default_initial_margin_fraction
                ? Math.floor(10000 / lighterMarket.default_initial_margin_fraction)
                : 20,
            fundingIntervalHours: 8,
            info: lighterMarket,
        };
    }
    /**
     * Normalize Lighter order to unified format
     */
    normalizeOrder(lighterOrder) {
        return {
            id: lighterOrder.orderId,
            clientOrderId: lighterOrder.clientOrderId,
            symbol: this.normalizeSymbol(lighterOrder.symbol),
            type: lighterOrder.type,
            side: lighterOrder.side,
            price: lighterOrder.price,
            amount: lighterOrder.size,
            filled: lighterOrder.filledSize,
            remaining: lighterOrder.size - lighterOrder.filledSize,
            status: this.mapOrderStatus(lighterOrder.status),
            timestamp: lighterOrder.timestamp,
            reduceOnly: lighterOrder.reduceOnly,
            postOnly: false,
            info: lighterOrder,
        };
    }
    /**
     * Normalize Lighter position to unified format
     */
    normalizePosition(lighterPosition) {
        return {
            symbol: this.normalizeSymbol(lighterPosition.symbol),
            side: lighterPosition.side,
            size: lighterPosition.size,
            entryPrice: lighterPosition.entryPrice,
            markPrice: lighterPosition.markPrice,
            liquidationPrice: lighterPosition.liquidationPrice,
            unrealizedPnl: lighterPosition.unrealizedPnl,
            realizedPnl: 0, // Not provided by Lighter
            margin: lighterPosition.margin,
            leverage: lighterPosition.leverage,
            marginMode: 'cross', // Not provided by Lighter, default to cross
            maintenanceMargin: lighterPosition.margin * 0.5, // Estimate as 50% of margin
            marginRatio: lighterPosition.unrealizedPnl / lighterPosition.margin, // Calculate from available data
            timestamp: Date.now(),
            info: lighterPosition,
        };
    }
    /**
     * Normalize Lighter balance to unified format
     */
    normalizeBalance(lighterBalance) {
        return {
            currency: lighterBalance.currency,
            total: lighterBalance.total,
            free: lighterBalance.available,
            used: lighterBalance.reserved,
            info: lighterBalance,
        };
    }
    /**
     * Normalize Lighter order book to unified format
     */
    normalizeOrderBook(lighterOrderBook) {
        return {
            symbol: this.normalizeSymbol(lighterOrderBook.symbol),
            exchange: 'lighter',
            bids: lighterOrderBook.bids,
            asks: lighterOrderBook.asks,
            timestamp: lighterOrderBook.timestamp,
        };
    }
    /**
     * Normalize Lighter trade to unified format
     */
    normalizeTrade(lighterTrade) {
        return {
            id: lighterTrade.id,
            symbol: this.normalizeSymbol(lighterTrade.symbol),
            side: lighterTrade.side,
            price: lighterTrade.price,
            amount: lighterTrade.amount,
            cost: lighterTrade.price * lighterTrade.amount,
            timestamp: lighterTrade.timestamp,
            info: lighterTrade,
        };
    }
    /**
     * Normalize Lighter ticker to unified format
     * Handles real API response from /api/v1/orderBookDetails
     */
    normalizeTicker(lighterTicker) {
        // Real API format: { symbol, last_trade_price, daily_price_high, daily_price_low, ... }
        const last = parseFloat(lighterTicker.last_trade_price || '0');
        const high = parseFloat(lighterTicker.daily_price_high || '0');
        const low = parseFloat(lighterTicker.daily_price_low || '0');
        const baseVolume = parseFloat(lighterTicker.daily_base_token_volume || '0');
        const quoteVolume = parseFloat(lighterTicker.daily_quote_token_volume || '0');
        const change = parseFloat(lighterTicker.daily_price_change || '0');
        return {
            symbol: this.normalizeSymbol(lighterTicker.symbol),
            last,
            bid: last, // Not directly provided, use last as approximation
            ask: last, // Not directly provided, use last as approximation
            high,
            low,
            open: high > 0 ? last / (1 + change / 100) : 0, // Calculate from change percentage
            close: last,
            change: change,
            percentage: change,
            baseVolume,
            quoteVolume,
            timestamp: Date.now(),
            info: lighterTicker,
        };
    }
    /**
     * Normalize Lighter funding rate to unified format
     */
    normalizeFundingRate(lighterFundingRate) {
        return {
            symbol: this.normalizeSymbol(lighterFundingRate.symbol),
            fundingRate: lighterFundingRate.fundingRate,
            fundingTimestamp: lighterFundingRate.nextFundingTime,
            nextFundingTimestamp: lighterFundingRate.nextFundingTime,
            markPrice: lighterFundingRate.markPrice,
            indexPrice: lighterFundingRate.markPrice, // Not provided by Lighter, use mark price as fallback
            fundingIntervalHours: 8,
            info: lighterFundingRate,
        };
    }
    /**
     * Map Lighter order status to unified status
     */
    mapOrderStatus(status) {
        switch (status) {
            case 'open':
            case 'partially_filled':
                return 'open';
            case 'filled':
                return 'closed';
            case 'cancelled':
                return 'canceled';
            default:
                return 'open';
        }
    }
}
//# sourceMappingURL=LighterNormalizer.js.map