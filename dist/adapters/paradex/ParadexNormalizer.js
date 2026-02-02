/**
 * Paradex Data Normalizer
 *
 * Transforms Paradex API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.paradex.trade
 */
import { PARADEX_ORDER_TYPES, PARADEX_ORDER_SIDES, PARADEX_TIME_IN_FORCE, } from './constants.js';
import { PerpDEXError } from '../../types/errors.js';
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
     * Convert string to number with validation and precision control
     *
     * @param value - String value to convert
     * @param decimals - Number of decimal places (default: 8)
     * @returns Number
     *
     * @throws {PerpDEXError} If value is not a valid number
     */
    toNumberSafe(value, decimals = 8) {
        if (!value || value === '0' || value === '') {
            return 0;
        }
        const num = parseFloat(value);
        if (!Number.isFinite(num)) {
            throw new PerpDEXError(`Invalid number conversion: ${value}`, 'INVALID_NUMBER', 'paradex');
        }
        // Round to specified decimal places to avoid floating point errors
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
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
        const symbol = this.symbolToCCXT(paradexMarket.symbol);
        // Handle both actual API format and legacy type format
        const tickSize = paradexMarket.price_tick_size || paradexMarket.tick_size || '0.01';
        const stepSize = paradexMarket.order_size_increment || paradexMarket.step_size || '0.001';
        const minOrderSize = paradexMarket.min_notional || paradexMarket.min_order_size || '100';
        // Extract maker/taker fees from fee_config or legacy fields
        let makerFee = 0.00003; // Default
        let takerFee = 0.0002; // Default
        if (paradexMarket.fee_config?.api_fee) {
            makerFee = parseFloat(paradexMarket.fee_config.api_fee.maker_fee?.fee || '0.00003');
            takerFee = parseFloat(paradexMarket.fee_config.api_fee.taker_fee?.fee || '0.0002');
        }
        else if (paradexMarket.maker_fee_rate) {
            makerFee = parseFloat(paradexMarket.maker_fee_rate);
            takerFee = parseFloat(paradexMarket.taker_fee_rate);
        }
        // Extract max leverage from delta1_cross_margin_params or legacy field
        let maxLeverage = 50; // Default
        if (paradexMarket.delta1_cross_margin_params?.imf_base) {
            const imfBase = parseFloat(paradexMarket.delta1_cross_margin_params.imf_base);
            if (imfBase > 0) {
                maxLeverage = Math.round(1 / imfBase);
            }
        }
        else if (paradexMarket.max_leverage) {
            maxLeverage = parseFloat(paradexMarket.max_leverage);
        }
        // Determine if market is active
        const isActive = paradexMarket.is_active ??
            (paradexMarket.open_at ? paradexMarket.open_at <= Date.now() : true);
        return {
            id: paradexMarket.symbol,
            symbol,
            base: paradexMarket.base_currency,
            quote: paradexMarket.quote_currency,
            settle: paradexMarket.settlement_currency,
            active: isActive,
            minAmount: parseFloat(minOrderSize),
            pricePrecision: this.countDecimals(tickSize),
            amountPrecision: this.countDecimals(stepSize),
            priceTickSize: parseFloat(tickSize),
            amountStepSize: parseFloat(stepSize),
            makerFee,
            takerFee,
            maxLeverage,
            fundingIntervalHours: paradexMarket.funding_period_hours || 8,
            info: paradexMarket,
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
        const symbol = this.symbolToCCXT(paradexOrder.market);
        return {
            id: paradexOrder.id,
            clientOrderId: paradexOrder.client_id,
            symbol,
            type: this.normalizeOrderType(paradexOrder.type),
            side: this.normalizeOrderSide(paradexOrder.side),
            amount: parseFloat(paradexOrder.size),
            price: paradexOrder.price ? parseFloat(paradexOrder.price) : undefined,
            filled: parseFloat(paradexOrder.filled_size),
            remaining: parseFloat(paradexOrder.size) - parseFloat(paradexOrder.filled_size),
            averagePrice: paradexOrder.avg_fill_price
                ? parseFloat(paradexOrder.avg_fill_price)
                : undefined,
            status: this.normalizeOrderStatus(paradexOrder.status),
            timeInForce: this.normalizeTimeInForce(paradexOrder.time_in_force),
            postOnly: paradexOrder.post_only,
            reduceOnly: paradexOrder.reduce_only,
            timestamp: paradexOrder.created_at,
            lastUpdateTimestamp: paradexOrder.updated_at,
            info: paradexOrder,
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
        const symbol = this.symbolToCCXT(paradexPosition.market);
        const size = parseFloat(paradexPosition.size);
        const side = paradexPosition.side === 'LONG' ? 'long' : 'short';
        return {
            symbol,
            side,
            marginMode: 'cross', // Paradex uses cross margin
            size: Math.abs(size),
            entryPrice: parseFloat(paradexPosition.entry_price),
            markPrice: parseFloat(paradexPosition.mark_price),
            liquidationPrice: paradexPosition.liquidation_price
                ? parseFloat(paradexPosition.liquidation_price)
                : 0,
            unrealizedPnl: parseFloat(paradexPosition.unrealized_pnl),
            realizedPnl: parseFloat(paradexPosition.realized_pnl),
            margin: parseFloat(paradexPosition.margin),
            leverage: parseFloat(paradexPosition.leverage),
            maintenanceMargin: parseFloat(paradexPosition.margin) * 0.025, // Estimate 2.5%
            marginRatio: 0, // Not provided by Paradex
            timestamp: paradexPosition.last_updated,
            info: paradexPosition,
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
        return {
            currency: paradexBalance.asset,
            total: parseFloat(paradexBalance.total),
            free: parseFloat(paradexBalance.available),
            used: parseFloat(paradexBalance.locked),
            info: paradexBalance,
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
        return {
            symbol: this.symbolToCCXT(paradexOrderBook.market),
            exchange: 'paradex',
            bids: paradexOrderBook.bids.map(([price, size]) => [
                parseFloat(price),
                parseFloat(size),
            ]),
            asks: paradexOrderBook.asks.map(([price, size]) => [
                parseFloat(price),
                parseFloat(size),
            ]),
            timestamp: paradexOrderBook.timestamp,
        };
    }
    // ===========================================================================
    // Trade Normalization
    // ===========================================================================
    /**
     * Normalize Paradex trade to unified format
     */
    normalizeTrade(paradexTrade) {
        const price = parseFloat(paradexTrade.price);
        const amount = parseFloat(paradexTrade.size);
        return {
            id: paradexTrade.id,
            symbol: this.symbolToCCXT(paradexTrade.market),
            side: this.normalizeOrderSide(paradexTrade.side),
            price,
            amount,
            cost: price * amount,
            timestamp: paradexTrade.timestamp,
            info: paradexTrade,
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
        const last = parseFloat(paradexTicker.last_price);
        const change = parseFloat(paradexTicker.price_change_24h);
        const percentage = parseFloat(paradexTicker.price_change_percent_24h);
        return {
            symbol: this.symbolToCCXT(paradexTicker.market),
            last,
            open: last - change,
            close: last,
            bid: parseFloat(paradexTicker.bid),
            ask: parseFloat(paradexTicker.ask),
            high: parseFloat(paradexTicker.high_24h),
            low: parseFloat(paradexTicker.low_24h),
            change,
            percentage,
            baseVolume: parseFloat(paradexTicker.volume_24h),
            quoteVolume: 0, // Not provided by Paradex
            timestamp: paradexTicker.timestamp,
            info: paradexTicker,
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
        return {
            symbol: this.symbolToCCXT(paradexFunding.market),
            fundingRate: parseFloat(paradexFunding.rate),
            fundingTimestamp: paradexFunding.timestamp,
            markPrice: parseFloat(paradexFunding.mark_price),
            indexPrice: parseFloat(paradexFunding.index_price),
            nextFundingTimestamp: paradexFunding.next_funding_time,
            fundingIntervalHours: 8,
            info: paradexFunding,
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