/**
 * Paradex Data Normalizer
 *
 * Transforms Paradex API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.paradex.trade
 */
import { PARADEX_ORDER_TYPES, PARADEX_ORDER_SIDES, PARADEX_TIME_IN_FORCE } from './constants.js';
import { ParadexAPIMarketSchema, ParadexOrderSchema, ParadexPositionSchema, ParadexBalanceSchema, ParadexOrderBookSchema, ParadexTradeSchema, ParadexTickerSchema, ParadexFundingRateSchema, } from './types.js';
/**
 * Paradex Data Normalizer
 *
 * Provides data transformation between Paradex and unified formats with:
 * - Precision-safe numeric conversions
 * - Batch processing optimization
 * - Symbol format conversions (bidirectional)
 * - Enum mappings
 *
 * @example
 * ```typescript
 * const normalizer = new ParadexNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(paradexMarket);
 *
 * // Batch processing
 * const orders = normalizer.normalizeOrders(paradexOrders);
 *
 * // Reverse conversion
 * const paradexSymbol = normalizer.symbolFromCCXT('BTC/USD:USD');
 * ```
 */
export class ParadexNormalizer {
    // ===========================================================================
    // Symbol Conversion
    // ===========================================================================
    /**
     * Convert Paradex symbol to CCXT format
     *
     * @param paradexSymbol - Paradex symbol (e.g., "BTC-USD-PERP", "ETH-USDC-PERP")
     * @returns CCXT formatted symbol (e.g., "BTC/USD:USD")
     *
     * @example
     * ```typescript
     * normalizer.symbolToCCXT('BTC-USD-PERP');  // "BTC/USD:USD"
     * normalizer.symbolToCCXT('ETH-USDC-PERP'); // "ETH/USDC:USDC"
     * normalizer.symbolToCCXT('BTC-USD');       // "BTC/USD" (spot)
     * ```
     */
    symbolToCCXT(paradexSymbol) {
        // Paradex format: BTC-USD-PERP, ETH-USDC-PERP
        const parts = paradexSymbol.split('-');
        if (parts.length === 3 && parts[2] === 'PERP') {
            const base = parts[0];
            const quote = parts[1];
            return `${base}/${quote}:${quote}`;
        }
        // Fallback for spot markets
        return paradexSymbol.replace('-', '/');
    }
    /**
     * Convert CCXT symbol to Paradex format
     *
     * @param ccxtSymbol - CCXT formatted symbol (e.g., "BTC/USD:USD")
     * @returns Paradex symbol (e.g., "BTC-USD-PERP")
     *
     * @example
     * ```typescript
     * normalizer.symbolFromCCXT('BTC/USD:USD');    // "BTC-USD-PERP"
     * normalizer.symbolFromCCXT('ETH/USDC:USDC');  // "ETH-USDC-PERP"
     * normalizer.symbolFromCCXT('BTC/USD');        // "BTC-USD" (spot)
     * ```
     */
    symbolFromCCXT(ccxtSymbol) {
        const parts = ccxtSymbol.split(':');
        if (parts.length === 2) {
            // Perpetual format
            const [pair = ''] = parts;
            const [base = '', quote = ''] = pair.split('/');
            return `${base}-${quote}-PERP`;
        }
        // Spot format
        return ccxtSymbol.replace('/', '-');
    }
    // ===========================================================================
    // Precision-Safe Numeric Conversions
    // ===========================================================================
    /**
     * Count decimal places in a string number
     *
     * @param value - String number (e.g., "0.001")
     * @returns Number of decimal places (e.g., 3)
     */
    countDecimals(value) {
        const parts = value.split('.');
        return parts.length === 2 && parts[1] ? parts[1].length : 0;
    }
    // ===========================================================================
    // Market Normalization
    // ===========================================================================
    /**
     * Normalize Paradex market to unified format
     *
     * Handles both old SDK type format and actual API response format:
     * - API uses: order_size_increment, price_tick_size, min_notional, fee_config, delta1_cross_margin_params
     * - SDK type uses: step_size, tick_size, min_order_size, maker_fee_rate, taker_fee_rate, max_leverage
     *
     * @param paradexMarket - Paradex market data from API
     * @returns Unified market
     */
    normalizeMarket(paradexMarket) {
        const validated = ParadexAPIMarketSchema.parse(paradexMarket);
        const symbol = this.symbolToCCXT(validated.symbol);
        // Handle both actual API format and legacy type format
        const tickSize = validated.price_tick_size || validated.tick_size || '0.01';
        const stepSize = validated.order_size_increment || validated.step_size || '0.001';
        const minOrderSize = validated.min_notional || validated.min_order_size || '100';
        // Extract maker/taker fees from fee_config or legacy fields
        let makerFee = 0.00003; // Default
        let takerFee = 0.0002; // Default
        if (validated.fee_config?.api_fee) {
            makerFee = parseFloat(validated.fee_config.api_fee.maker_fee?.fee || '0.00003');
            takerFee = parseFloat(validated.fee_config.api_fee.taker_fee?.fee || '0.0002');
        }
        else if (validated.maker_fee_rate) {
            makerFee = parseFloat(validated.maker_fee_rate);
            takerFee = parseFloat(validated.taker_fee_rate || '0.0002');
        }
        // Extract max leverage from delta1_cross_margin_params or legacy field
        let maxLeverage = 50; // Default
        if (validated.delta1_cross_margin_params?.imf_base) {
            const imfBase = parseFloat(validated.delta1_cross_margin_params.imf_base);
            if (imfBase > 0) {
                maxLeverage = Math.round(1 / imfBase);
            }
        }
        else if (validated.max_leverage) {
            maxLeverage = parseFloat(validated.max_leverage);
        }
        // Determine if market is active
        const isActive = validated.is_active ?? (validated.open_at ? validated.open_at <= Date.now() : true);
        return {
            id: validated.symbol,
            symbol,
            base: validated.base_currency,
            quote: validated.quote_currency,
            settle: validated.settlement_currency,
            active: isActive,
            minAmount: parseFloat(minOrderSize),
            pricePrecision: this.countDecimals(tickSize),
            amountPrecision: this.countDecimals(stepSize),
            priceTickSize: parseFloat(tickSize),
            amountStepSize: parseFloat(stepSize),
            makerFee,
            takerFee,
            maxLeverage,
            fundingIntervalHours: validated.funding_period_hours || 8,
            info: validated,
        };
    }
    /**
     * Batch normalize markets
     */
    normalizeMarkets(paradexMarkets) {
        return paradexMarkets.map((m) => this.normalizeMarket(m));
    }
    // ===========================================================================
    // Order Normalization
    // ===========================================================================
    /**
     * Map Paradex order type to unified
     */
    normalizeOrderType(paradexType) {
        switch (paradexType) {
            case 'MARKET':
                return 'market';
            case 'LIMIT':
            case 'LIMIT_MAKER':
                return 'limit';
            default:
                return 'limit';
        }
    }
    /**
     * Map Paradex order side to unified
     */
    normalizeOrderSide(paradexSide) {
        return paradexSide === 'BUY' ? 'buy' : 'sell';
    }
    /**
     * Map Paradex order status to unified
     */
    normalizeOrderStatus(paradexStatus) {
        const statusMap = {
            PENDING: 'open',
            OPEN: 'open',
            PARTIAL: 'partiallyFilled',
            FILLED: 'filled',
            CANCELLED: 'canceled',
            REJECTED: 'rejected',
        };
        return statusMap[paradexStatus] ?? 'open';
    }
    /**
     * Map Paradex time in force to unified
     */
    normalizeTimeInForce(paradexTif) {
        switch (paradexTif) {
            case 'GTC':
                return 'GTC';
            case 'IOC':
                return 'IOC';
            case 'FOK':
                return 'FOK';
            case 'POST_ONLY':
                return 'PO';
            default:
                return 'GTC';
        }
    }
    /**
     * Normalize Paradex order to unified format
     */
    normalizeOrder(paradexOrder) {
        const validated = ParadexOrderSchema.parse(paradexOrder);
        const symbol = this.symbolToCCXT(validated.market);
        return {
            id: validated.id,
            clientOrderId: validated.client_id,
            symbol,
            type: this.normalizeOrderType(validated.type),
            side: this.normalizeOrderSide(validated.side),
            amount: parseFloat(validated.size),
            price: validated.price ? parseFloat(validated.price) : undefined,
            filled: parseFloat(validated.filled_size),
            remaining: parseFloat(validated.size) - parseFloat(validated.filled_size),
            averagePrice: validated.avg_fill_price ? parseFloat(validated.avg_fill_price) : undefined,
            status: this.normalizeOrderStatus(validated.status),
            timeInForce: this.normalizeTimeInForce(validated.time_in_force),
            postOnly: validated.post_only,
            reduceOnly: validated.reduce_only,
            timestamp: validated.created_at,
            lastUpdateTimestamp: validated.updated_at,
            info: validated,
        };
    }
    /**
     * Batch normalize orders
     */
    normalizeOrders(paradexOrders) {
        return paradexOrders.map((o) => this.normalizeOrder(o));
    }
    // ===========================================================================
    // Position Normalization
    // ===========================================================================
    /**
     * Normalize Paradex position to unified format
     */
    normalizePosition(paradexPosition) {
        const validated = ParadexPositionSchema.parse(paradexPosition);
        const symbol = this.symbolToCCXT(validated.market);
        const size = parseFloat(validated.size);
        const side = validated.side === 'LONG' ? 'long' : 'short';
        const absSize = Math.abs(size);
        const markPrice = parseFloat(validated.mark_price);
        const maintenanceMargin = parseFloat(validated.margin) * 0.025;
        const notional = absSize * markPrice;
        return {
            symbol,
            side,
            marginMode: 'cross', // Paradex uses cross margin
            size: absSize,
            entryPrice: parseFloat(validated.entry_price),
            markPrice,
            liquidationPrice: validated.liquidation_price ? parseFloat(validated.liquidation_price) : 0,
            unrealizedPnl: parseFloat(validated.unrealized_pnl),
            realizedPnl: parseFloat(validated.realized_pnl),
            margin: parseFloat(validated.margin),
            leverage: parseFloat(validated.leverage),
            maintenanceMargin,
            marginRatio: notional > 0 ? maintenanceMargin / notional : 0,
            timestamp: validated.last_updated,
            info: validated,
        };
    }
    /**
     * Batch normalize positions
     */
    normalizePositions(paradexPositions) {
        return paradexPositions.map((p) => this.normalizePosition(p));
    }
    // ===========================================================================
    // Balance Normalization
    // ===========================================================================
    /**
     * Normalize Paradex balance to unified format
     */
    normalizeBalance(paradexBalance) {
        const validated = ParadexBalanceSchema.parse(paradexBalance);
        return {
            currency: validated.asset,
            total: parseFloat(validated.total),
            free: parseFloat(validated.available),
            used: parseFloat(validated.locked),
            info: validated,
        };
    }
    /**
     * Batch normalize balances
     */
    normalizeBalances(paradexBalances) {
        return paradexBalances.map((b) => this.normalizeBalance(b));
    }
    // ===========================================================================
    // Order Book Normalization
    // ===========================================================================
    /**
     * Normalize Paradex order book to unified format
     */
    normalizeOrderBook(paradexOrderBook) {
        const validated = ParadexOrderBookSchema.parse(paradexOrderBook);
        return {
            symbol: this.symbolToCCXT(validated.market),
            exchange: 'paradex',
            bids: validated.bids.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
            asks: validated.asks.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
            timestamp: validated.timestamp,
        };
    }
    // ===========================================================================
    // Trade Normalization
    // ===========================================================================
    /**
     * Normalize Paradex trade to unified format
     */
    normalizeTrade(paradexTrade) {
        const validated = ParadexTradeSchema.parse(paradexTrade);
        const price = parseFloat(validated.price);
        const amount = parseFloat(validated.size);
        // API returns created_at instead of timestamp
        const timestamp = validated.timestamp || validated.created_at || 0;
        return {
            id: validated.id,
            symbol: this.symbolToCCXT(validated.market),
            side: this.normalizeOrderSide(validated.side),
            price,
            amount,
            cost: price * amount,
            timestamp,
            info: validated,
        };
    }
    /**
     * Batch normalize trades
     */
    normalizeTrades(paradexTrades) {
        return paradexTrades.map((t) => this.normalizeTrade(t));
    }
    // ===========================================================================
    // Ticker Normalization
    // ===========================================================================
    /**
     * Normalize Paradex ticker to unified format
     */
    normalizeTicker(paradexTicker) {
        const validated = ParadexTickerSchema.parse(paradexTicker);
        const last = parseFloat(validated.last_price);
        const change = parseFloat(validated.price_change_24h);
        const percentage = parseFloat(validated.price_change_percent_24h);
        return {
            symbol: this.symbolToCCXT(validated.market),
            last,
            open: last - change,
            close: last,
            bid: parseFloat(validated.bid),
            ask: parseFloat(validated.ask),
            high: parseFloat(validated.high_24h),
            low: parseFloat(validated.low_24h),
            change,
            percentage,
            baseVolume: parseFloat(validated.volume_24h),
            quoteVolume: 0, // Not provided by Paradex
            timestamp: validated.timestamp,
            info: {
                ...validated,
                _bidAskSource: 'orderbook',
            },
        };
    }
    /**
     * Batch normalize tickers
     */
    normalizeTickers(paradexTickers) {
        return paradexTickers.map((t) => this.normalizeTicker(t));
    }
    // ===========================================================================
    // Funding Rate Normalization
    // ===========================================================================
    /**
     * Normalize Paradex funding rate to unified format
     */
    normalizeFundingRate(paradexFunding) {
        const validated = ParadexFundingRateSchema.parse(paradexFunding);
        return {
            symbol: this.symbolToCCXT(validated.market),
            fundingRate: parseFloat(validated.rate),
            fundingTimestamp: validated.timestamp,
            markPrice: parseFloat(validated.mark_price),
            indexPrice: parseFloat(validated.index_price),
            nextFundingTimestamp: validated.next_funding_time,
            fundingIntervalHours: 8,
            info: validated,
        };
    }
    /**
     * Batch normalize funding rates
     */
    normalizeFundingRates(paradexFundingRates) {
        return paradexFundingRates.map((f) => this.normalizeFundingRate(f));
    }
    // ===========================================================================
    // Reverse Conversion (To Paradex Format)
    // ===========================================================================
    /**
     * Convert unified order type to Paradex format
     *
     * @param type - Unified order type
     * @param postOnly - Post-only flag
     * @returns Paradex order type
     */
    toParadexOrderType(type, postOnly) {
        if (type === 'market') {
            return PARADEX_ORDER_TYPES.market;
        }
        if (postOnly) {
            return PARADEX_ORDER_TYPES.limitMaker;
        }
        return PARADEX_ORDER_TYPES.limit;
    }
    /**
     * Convert unified order side to Paradex format
     *
     * @param side - Unified order side
     * @returns Paradex order side
     */
    toParadexOrderSide(side) {
        return side === 'buy' ? PARADEX_ORDER_SIDES.buy : PARADEX_ORDER_SIDES.sell;
    }
    /**
     * Convert unified time in force to Paradex format
     *
     * @param tif - Unified time in force
     * @param postOnly - Post-only flag
     * @returns Paradex time in force
     */
    toParadexTimeInForce(tif, postOnly) {
        if (postOnly) {
            return PARADEX_TIME_IN_FORCE.POST_ONLY;
        }
        switch (tif) {
            case 'IOC':
                return PARADEX_TIME_IN_FORCE.IOC;
            case 'FOK':
                return PARADEX_TIME_IN_FORCE.FOK;
            case 'PO':
                return PARADEX_TIME_IN_FORCE.POST_ONLY;
            case 'GTC':
            default:
                return PARADEX_TIME_IN_FORCE.GTC;
        }
    }
}
//# sourceMappingURL=ParadexNormalizer.js.map