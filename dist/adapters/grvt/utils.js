/**
 * GRVT utility functions for data normalization
 */
import { GRVT_ORDER_TYPES, GRVT_ORDER_SIDES, GRVT_TIME_IN_FORCE } from './constants.js';
/**
 * Normalize GRVT symbol to unified format
 *
 * @example
 * normalizeSymbol('BTC_USDT_Perp') // 'BTC/USDT:USDT'
 * normalizeSymbol('ETH_USDT_Perp') // 'ETH/USDT:USDT'
 */
export function normalizeSymbol(grvtSymbol) {
    // GRVT API format: BTC_USDT_Perp, ETH_USDT_Perp
    if (grvtSymbol.endsWith('_Perp')) {
        const parts = grvtSymbol.replace('_Perp', '').split('_');
        const base = parts[0];
        const quote = parts[1] || 'USDT';
        return `${base}/${quote}:${quote}`;
    }
    // Handle legacy format: BTC-PERP, ETH-PERP
    if (grvtSymbol.endsWith('-PERP')) {
        const base = grvtSymbol.replace('-PERP', '');
        return `${base}/USDT:USDT`;
    }
    // Handle spot: BTC_USDT
    if (grvtSymbol.includes('_')) {
        const [base, quote] = grvtSymbol.split('_');
        return `${base}/${quote || 'USDT'}`;
    }
    // Fallback
    return grvtSymbol.replace('-', '/');
}
/**
 * Convert unified symbol to GRVT format
 *
 * @example
 * toGRVTSymbol('BTC/USDT:USDT') // 'BTC_USDT_Perp'
 * toGRVTSymbol('ETH/USDT:USDT') // 'ETH_USDT_Perp'
 */
export function toGRVTSymbol(symbol) {
    // Handle perpetual: BTC/USDT:USDT → BTC_USDT_Perp
    if (symbol.includes(':')) {
        const parts = symbol.split(':');
        const pair = parts[0] || '';
        const settle = parts[1] || 'USDT';
        const pairParts = pair.split('/');
        const base = pairParts[0] || '';
        const quote = pairParts[1] || settle;
        return `${base}_${quote}_Perp`;
    }
    // Handle spot: BTC/USDT → BTC_USDT
    const parts = symbol.split('/');
    const base = parts[0] || '';
    const quote = parts[1] || 'USDT';
    return `${base}_${quote}`;
}
/**
 * Normalize GRVT market to unified format
 */
export function normalizeMarket(grvtMarket) {
    const symbol = normalizeSymbol(grvtMarket.instrument);
    return {
        id: grvtMarket.instrument_id,
        symbol,
        base: grvtMarket.base_currency,
        quote: grvtMarket.quote_currency,
        settle: grvtMarket.settlement_currency,
        active: grvtMarket.is_active,
        minAmount: parseFloat(grvtMarket.min_size),
        pricePrecision: countDecimals(grvtMarket.tick_size),
        amountPrecision: countDecimals(grvtMarket.step_size),
        priceTickSize: parseFloat(grvtMarket.tick_size),
        amountStepSize: parseFloat(grvtMarket.step_size),
        makerFee: parseFloat(grvtMarket.maker_fee),
        takerFee: parseFloat(grvtMarket.taker_fee),
        maxLeverage: parseFloat(grvtMarket.max_leverage),
        fundingIntervalHours: 8,
    };
}
/**
 * Normalize GRVT order to unified format
 */
export function normalizeOrder(grvtOrder) {
    const symbol = normalizeSymbol(grvtOrder.instrument);
    return {
        id: grvtOrder.order_id,
        clientOrderId: grvtOrder.client_order_id,
        symbol,
        type: normalizeOrderType(grvtOrder.order_type),
        side: normalizeOrderSide(grvtOrder.side),
        amount: parseFloat(grvtOrder.size),
        price: grvtOrder.price ? parseFloat(grvtOrder.price) : undefined,
        filled: parseFloat(grvtOrder.filled_size),
        remaining: parseFloat(grvtOrder.size) - parseFloat(grvtOrder.filled_size),
        averagePrice: grvtOrder.average_fill_price
            ? parseFloat(grvtOrder.average_fill_price)
            : undefined,
        status: normalizeOrderStatus(grvtOrder.status),
        timeInForce: normalizeTimeInForce(grvtOrder.time_in_force),
        postOnly: grvtOrder.post_only,
        reduceOnly: grvtOrder.reduce_only,
        timestamp: grvtOrder.created_at,
        lastUpdateTimestamp: grvtOrder.updated_at,
        info: grvtOrder,
    };
}
/**
 * Normalize GRVT position to unified format
 */
export function normalizePosition(grvtPosition) {
    const symbol = normalizeSymbol(grvtPosition.instrument);
    const size = parseFloat(grvtPosition.size);
    const side = grvtPosition.side === 'LONG' ? 'long' : 'short';
    return {
        symbol,
        side,
        marginMode: 'cross',
        size: Math.abs(size),
        entryPrice: parseFloat(grvtPosition.entry_price),
        markPrice: parseFloat(grvtPosition.mark_price),
        liquidationPrice: grvtPosition.liquidation_price
            ? parseFloat(grvtPosition.liquidation_price)
            : 0,
        unrealizedPnl: parseFloat(grvtPosition.unrealized_pnl),
        realizedPnl: parseFloat(grvtPosition.realized_pnl),
        margin: parseFloat(grvtPosition.margin),
        leverage: parseFloat(grvtPosition.leverage),
        maintenanceMargin: parseFloat(grvtPosition.margin) * 0.005,
        marginRatio: 0,
        timestamp: grvtPosition.timestamp,
        info: grvtPosition,
    };
}
/**
 * Normalize GRVT balance to unified format
 */
export function normalizeBalance(grvtBalance) {
    return {
        currency: grvtBalance.currency,
        total: parseFloat(grvtBalance.total),
        free: parseFloat(grvtBalance.available),
        used: parseFloat(grvtBalance.reserved),
        info: grvtBalance,
    };
}
/**
 * Normalize GRVT order book to unified format
 */
export function normalizeOrderBook(grvtOrderBook) {
    return {
        symbol: normalizeSymbol(grvtOrderBook.instrument),
        exchange: 'grvt',
        bids: grvtOrderBook.bids.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
        asks: grvtOrderBook.asks.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
        timestamp: grvtOrderBook.timestamp,
        // nonce: grvtOrderBook.sequence,
    };
}
/**
 * Normalize GRVT trade to unified format
 */
export function normalizeTrade(grvtTrade) {
    const price = parseFloat(grvtTrade.price);
    const amount = parseFloat(grvtTrade.size);
    return {
        id: grvtTrade.trade_id,
        symbol: normalizeSymbol(grvtTrade.instrument),
        side: normalizeOrderSide(grvtTrade.side),
        price,
        amount,
        cost: price * amount,
        timestamp: grvtTrade.timestamp,
        info: grvtTrade,
    };
}
/**
 * Normalize GRVT ticker to unified format
 */
export function normalizeTicker(grvtTicker) {
    const last = parseFloat(grvtTicker.last_price);
    return {
        symbol: normalizeSymbol(grvtTicker.instrument),
        last,
        open: last,
        close: last,
        bid: parseFloat(grvtTicker.best_bid),
        ask: parseFloat(grvtTicker.best_ask),
        high: parseFloat(grvtTicker.high_24h),
        low: parseFloat(grvtTicker.low_24h),
        change: 0,
        percentage: 0,
        baseVolume: parseFloat(grvtTicker.volume_24h),
        quoteVolume: 0,
        timestamp: grvtTicker.timestamp,
        info: grvtTicker,
    };
}
/**
 * Normalize GRVT order type to unified format
 */
function normalizeOrderType(grvtType) {
    switch (grvtType) {
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
 * Normalize GRVT order side to unified format
 */
function normalizeOrderSide(grvtSide) {
    return grvtSide === 'BUY' ? 'buy' : 'sell';
}
/**
 * Normalize GRVT order status to unified format
 */
function normalizeOrderStatus(grvtStatus) {
    const statusMap = {
        PENDING: 'open',
        OPEN: 'open',
        PARTIALLY_FILLED: 'partiallyFilled',
        FILLED: 'filled',
        CANCELLED: 'canceled',
        REJECTED: 'rejected',
    };
    return statusMap[grvtStatus] ?? 'open';
}
/**
 * Normalize GRVT time in force to unified format
 */
function normalizeTimeInForce(grvtTif) {
    switch (grvtTif) {
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
 * Convert unified order type to GRVT format
 */
export function toGRVTOrderType(type, postOnly) {
    if (type === 'market') {
        return GRVT_ORDER_TYPES.market;
    }
    if (postOnly) {
        return GRVT_ORDER_TYPES.limitMaker;
    }
    return GRVT_ORDER_TYPES.limit;
}
/**
 * Convert unified order side to GRVT format
 */
export function toGRVTOrderSide(side) {
    return side === 'buy' ? GRVT_ORDER_SIDES.buy : GRVT_ORDER_SIDES.sell;
}
/**
 * Convert unified time in force to GRVT format
 */
export function toGRVTTimeInForce(tif, postOnly) {
    if (postOnly) {
        return GRVT_TIME_IN_FORCE.POST_ONLY;
    }
    switch (tif) {
        case 'IOC':
            return GRVT_TIME_IN_FORCE.IOC;
        case 'FOK':
            return GRVT_TIME_IN_FORCE.FOK;
        case 'PO':
            return GRVT_TIME_IN_FORCE.POST_ONLY;
        case 'GTC':
        default:
            return GRVT_TIME_IN_FORCE.GTC;
    }
}
/**
 * Count decimal places in a string number
 */
function countDecimals(value) {
    const parts = value.split('.');
    return parts.length === 2 && parts[1] ? parts[1].length : 0;
}
/**
 * Map GRVT error to unified error code
 */
export function mapGRVTError(error) {
    if (typeof error === 'object' && error !== null) {
        const err = error;
        switch (err.code) {
            case 1001:
                return { code: 'INVALID_ORDER', message: 'Invalid order parameters' };
            case 1002:
                return { code: 'INSUFFICIENT_MARGIN', message: 'Insufficient margin' };
            case 1003:
                return { code: 'ORDER_NOT_FOUND', message: 'Order not found' };
            case 1004:
                return { code: 'POSITION_NOT_FOUND', message: 'Position not found' };
            case 2001:
                return { code: 'INVALID_SIGNATURE', message: 'Invalid signature' };
            case 2002:
                return { code: 'EXPIRED_AUTH', message: 'Authentication expired' };
            case 2003:
                return { code: 'INVALID_API_KEY', message: 'Invalid API key' };
            case 4001:
                return { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' };
            case 5001:
                return { code: 'EXCHANGE_UNAVAILABLE', message: 'Exchange unavailable' };
            default:
                return {
                    code: 'UNKNOWN_ERROR',
                    message: err.message ?? 'Unknown error occurred',
                };
        }
    }
    return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
}
//# sourceMappingURL=utils.js.map