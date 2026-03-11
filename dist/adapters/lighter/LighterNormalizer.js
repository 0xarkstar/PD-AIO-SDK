/**
 * Lighter Normalizer
 *
 * Transforms Lighter-specific data structures to unified SDK format
 */
import { LighterOrderSchema, LighterPositionSchema, LighterBalanceSchema, LighterFundingRateSchema, LighterAPIMarketSchema, LighterAPITickerSchema, } from './types.js';
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
        const validated = LighterAPIMarketSchema.parse(lighterMarket);
        // Real API returns: { symbol: "BTC", market_type: "perp", ... }
        const base = validated.symbol;
        const quote = 'USDC'; // Lighter uses USDC as quote currency
        const symbol = `${base}/${quote}:${quote}`;
        // Extract precision from API response
        const pricePrecision = Number(validated.supported_price_decimals || validated.price_decimals || 2);
        const amountPrecision = Number(validated.supported_size_decimals || validated.size_decimals || 4);
        // Parse min amounts from string values
        const minAmount = parseFloat(validated.min_base_amount || '0');
        // Parse fees
        const makerFee = parseFloat(validated.maker_fee || '0');
        const takerFee = parseFloat(validated.taker_fee || '0');
        return {
            id: validated.symbol,
            symbol,
            base,
            quote,
            settle: quote,
            active: validated.status === 'active',
            minAmount,
            maxAmount: undefined,
            pricePrecision,
            amountPrecision,
            priceTickSize: Math.pow(10, -pricePrecision),
            amountStepSize: Math.pow(10, -amountPrecision),
            makerFee,
            takerFee,
            maxLeverage: validated.default_initial_margin_fraction
                ? Math.floor(10000 / validated.default_initial_margin_fraction)
                : 20,
            fundingIntervalHours: 8,
            info: validated,
        };
    }
    /**
     * Normalize Lighter order to unified format
     */
    normalizeOrder(lighterOrder) {
        const validated = LighterOrderSchema.parse(lighterOrder);
        const size = validated.size ?? 0;
        const filledSize = validated.filledSize ?? 0;
        return {
            id: validated.orderId,
            clientOrderId: validated.clientOrderId,
            symbol: this.normalizeSymbol(validated.symbol),
            type: validated.type ?? 'limit',
            side: validated.side ?? 'buy',
            price: validated.price,
            amount: size,
            filled: filledSize,
            remaining: size - filledSize,
            status: this.mapOrderStatus(validated.status ?? 'open'),
            timestamp: validated.timestamp ?? Date.now(),
            reduceOnly: validated.reduceOnly ?? false,
            postOnly: false,
            info: validated,
        };
    }
    /**
     * Normalize Lighter position to unified format
     */
    normalizePosition(lighterPosition) {
        const validated = LighterPositionSchema.parse(lighterPosition);
        const margin = validated.margin ?? 0;
        const unrealizedPnl = validated.unrealizedPnl ?? 0;
        return {
            symbol: this.normalizeSymbol(validated.symbol),
            side: validated.side ?? 'long',
            size: validated.size ?? 0,
            entryPrice: validated.entryPrice ?? 0,
            markPrice: validated.markPrice ?? 0,
            liquidationPrice: validated.liquidationPrice ?? 0,
            unrealizedPnl,
            realizedPnl: 0,
            margin,
            leverage: validated.leverage ?? 1,
            marginMode: 'cross',
            maintenanceMargin: margin * 0.5,
            marginRatio: margin > 0 ? unrealizedPnl / margin : 0,
            timestamp: Date.now(),
            info: {
                ...validated,
                _realizedPnlSource: 'not_available',
            },
        };
    }
    /**
     * Normalize Lighter balance to unified format
     */
    normalizeBalance(lighterBalance) {
        const validated = LighterBalanceSchema.parse(lighterBalance);
        return {
            currency: validated.currency,
            total: validated.total,
            free: validated.available,
            used: validated.reserved,
            info: validated,
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
        const validated = LighterAPITickerSchema.parse(lighterTicker);
        // Real API format: { symbol, last_trade_price, daily_price_high, daily_price_low, ... }
        const last = Number(validated.last_trade_price ?? 0);
        const high = Number(validated.daily_price_high ?? 0);
        const low = Number(validated.daily_price_low ?? 0);
        const baseVolume = Number(validated.daily_base_token_volume ?? 0);
        const quoteVolume = Number(validated.daily_quote_token_volume ?? 0);
        const change = Number(validated.daily_price_change ?? 0);
        return {
            symbol: this.normalizeSymbol(validated.symbol),
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
            info: {
                ...validated,
                _bidAskSource: 'last_price',
            },
        };
    }
    /**
     * Normalize Lighter funding rate to unified format
     */
    normalizeFundingRate(lighterFundingRate) {
        const validated = LighterFundingRateSchema.parse(lighterFundingRate);
        const markPrice = validated.markPrice ?? 0;
        const nextFundingTime = validated.nextFundingTime ?? Date.now() + 8 * 3600 * 1000;
        return {
            symbol: this.normalizeSymbol(validated.symbol),
            fundingRate: validated.fundingRate,
            fundingTimestamp: nextFundingTime,
            nextFundingTimestamp: nextFundingTime,
            markPrice,
            indexPrice: markPrice, // Not provided by Lighter, use mark price as fallback
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
    toExchangeSymbol(symbol) {
        return this.toLighterSymbol(symbol);
    }
}
//# sourceMappingURL=LighterNormalizer.js.map