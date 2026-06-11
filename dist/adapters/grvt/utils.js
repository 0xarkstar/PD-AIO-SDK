/**
 * GRVT utility functions for data normalization (pure, standalone).
 *
 * These mirror the `GRVTNormalizer` methods but as free functions over the REAL
 * GRVT shapes in `types.ts`. Kept for the public adapter surface + ergonomic
 * one-off conversions. GRVT numeric fields are STRINGS on the wire.
 */
import { GRVT_ORDER_SIDES, GRVT_TIME_IN_FORCE, GRVT_ORDER_STATUS, GRVT_MAX_LEVERAGE, } from './constants.js';
/**
 * Normalize a GRVT instrument string to a unified CCXT symbol.
 *
 * @example
 * normalizeSymbol('BTC_USDT_Perp') // 'BTC/USDT:USDT'
 */
export function normalizeSymbol(grvtSymbol) {
    if (grvtSymbol.endsWith('_Perp')) {
        const parts = grvtSymbol.replace('_Perp', '').split('_');
        const base = parts[0];
        const quote = parts[1] || 'USDT';
        return `${base}/${quote}:${quote}`;
    }
    if (grvtSymbol.endsWith('-PERP')) {
        const base = grvtSymbol.replace('-PERP', '');
        return `${base}/USDT:USDT`;
    }
    if (grvtSymbol.includes('_')) {
        const [base, quote] = grvtSymbol.split('_');
        return `${base}/${quote || 'USDT'}`;
    }
    return `${grvtSymbol}/USDT:USDT`;
}
/**
 * Convert a unified CCXT symbol to a GRVT instrument string.
 *
 * @example
 * toGRVTSymbol('BTC/USDT:USDT') // 'BTC_USDT_Perp'
 */
export function toGRVTSymbol(symbol) {
    if (symbol.includes(':')) {
        const parts = symbol.split(':');
        const pair = parts[0] || '';
        const settle = parts[1] || 'USDT';
        const pairParts = pair.split('/');
        const base = pairParts[0] || '';
        const quote = pairParts[1] || settle;
        return `${base}_${quote}_Perp`;
    }
    const parts = symbol.split('/');
    const base = parts[0] || '';
    const quote = parts[1] || 'USDT';
    return `${base}_${quote}`;
}
/**
 * Parse a GRVT string number into a finite number (0 for empty/undefined).
 */
function num(value) {
    if (!value)
        return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
/**
 * Convert a GRVT unix NANOSECOND timestamp string to epoch milliseconds.
 *
 * GRVT timestamps are ns strings EVERYWHERE on the wire (19 digits — e.g.
 * book/trade/ticker `event_time`, ticker `next_funding_time`, funding
 * `funding_time`, order `create_time`/`update_time`). 19-digit ns exceeds
 * `Number.MAX_SAFE_INTEGER`, so this string-slices the last 6 digits (exact)
 * instead of `parseInt(s)/1e6` (lossy float). Live-verified 2026-06-11.
 */
export function nsToMs(value) {
    return Number(value.slice(0, -6));
}
/**
 * Count decimal places in a tick/step string.
 */
function countDecimals(value) {
    if (!value)
        return 0;
    const parts = value.split('.');
    return parts.length === 2 && parts[1] ? parts[1].length : 0;
}
/**
 * Normalize a GRVT instrument into a unified Market (fees are per-fill on GRVT).
 */
export function normalizeMarket(grvtMarket) {
    const instrument = grvtMarket.instrument;
    return {
        id: instrument,
        symbol: normalizeSymbol(instrument),
        base: grvtMarket.base,
        quote: grvtMarket.quote,
        settle: grvtMarket.quote,
        active: grvtMarket.is_active ?? true,
        minAmount: num(grvtMarket.min_size),
        maxAmount: grvtMarket.max_size ? num(grvtMarket.max_size) : undefined,
        minCost: grvtMarket.min_notional ? num(grvtMarket.min_notional) : undefined,
        pricePrecision: countDecimals(grvtMarket.tick_size),
        amountPrecision: countDecimals(grvtMarket.min_size),
        priceTickSize: num(grvtMarket.tick_size),
        amountStepSize: num(grvtMarket.min_size),
        makerFee: 0,
        takerFee: 0,
        maxLeverage: GRVT_MAX_LEVERAGE,
        fundingIntervalHours: grvtMarket.funding_interval_hours ?? 8,
        info: grvtMarket,
    };
}
/**
 * Normalize a GRVT account order (leg-based) into a unified Order.
 */
export function normalizeOrder(grvtOrder) {
    const leg = grvtOrder.legs?.[0];
    const amount = num(leg?.size);
    const traded = num(grvtOrder.state?.traded_size?.[0]);
    const book = num(grvtOrder.state?.book_size?.[0]);
    return {
        id: grvtOrder.order_id || '',
        clientOrderId: grvtOrder.metadata?.client_order_id,
        symbol: normalizeSymbol(leg?.instrument || ''),
        type: (grvtOrder.is_market ? 'market' : 'limit'),
        side: leg?.is_buying_asset ? 'buy' : 'sell',
        amount,
        price: leg?.limit_price ? num(leg.limit_price) : undefined,
        filled: traded,
        remaining: book,
        averagePrice: grvtOrder.state?.avg_fill_price?.[0]
            ? num(grvtOrder.state.avg_fill_price[0])
            : undefined,
        status: normalizeOrderStatus(grvtOrder.state?.status || ''),
        timeInForce: normalizeTimeInForce(grvtOrder.time_in_force || ''),
        postOnly: grvtOrder.post_only || false,
        reduceOnly: grvtOrder.reduce_only || false,
        timestamp: grvtOrder.metadata?.create_time ? nsToMs(grvtOrder.metadata.create_time) : Date.now(),
        lastUpdateTimestamp: grvtOrder.state?.update_time
            ? nsToMs(grvtOrder.state.update_time)
            : undefined,
        info: grvtOrder,
    };
}
/**
 * Normalize a GRVT position into a unified Position.
 */
export function normalizePosition(grvtPosition) {
    const size = num(grvtPosition.size);
    const leverage = num(grvtPosition.leverage);
    const notional = num(grvtPosition.notional);
    const margin = leverage > 0 ? notional / leverage : 0;
    return {
        symbol: normalizeSymbol(grvtPosition.instrument || ''),
        side: size >= 0 ? 'long' : 'short',
        marginMode: 'cross',
        size: Math.abs(size),
        entryPrice: num(grvtPosition.entry_price),
        markPrice: num(grvtPosition.mark_price),
        liquidationPrice: grvtPosition.est_liquidation_price ? num(grvtPosition.est_liquidation_price) : 0,
        unrealizedPnl: num(grvtPosition.unrealized_pnl),
        realizedPnl: num(grvtPosition.realized_pnl),
        margin,
        leverage,
        maintenanceMargin: margin * 0.5,
        marginRatio: margin > 0 && notional > 0 ? (margin / notional) * 100 : 0,
        timestamp: grvtPosition.event_time ? nsToMs(grvtPosition.event_time) : Date.now(),
        info: grvtPosition,
    };
}
/**
 * Normalize a GRVT spot balance into a unified Balance.
 */
export function normalizeBalance(grvtBalance) {
    const total = num(grvtBalance.balance);
    return {
        currency: grvtBalance.currency || '',
        total,
        free: total,
        used: 0,
        info: grvtBalance,
    };
}
/**
 * Normalize a GRVT FULL order-book snapshot into a unified OrderBook.
 */
export function normalizeOrderBook(grvtOrderBook) {
    return {
        symbol: normalizeSymbol(grvtOrderBook.instrument || ''),
        exchange: 'grvt',
        bids: (grvtOrderBook.bids || []).map((lvl) => [num(lvl.price), num(lvl.size)]),
        asks: (grvtOrderBook.asks || []).map((lvl) => [num(lvl.price), num(lvl.size)]),
        timestamp: grvtOrderBook.event_time ? nsToMs(grvtOrderBook.event_time) : Date.now(),
    };
}
/**
 * Normalize a GRVT public trade into a unified Trade.
 */
export function normalizeTrade(grvtTrade) {
    const price = num(grvtTrade.price);
    const amount = num(grvtTrade.size);
    return {
        id: grvtTrade.trade_id,
        symbol: normalizeSymbol(grvtTrade.instrument || ''),
        side: grvtTrade.is_taker_buyer ? 'buy' : 'sell',
        price,
        amount,
        cost: price * amount,
        timestamp: grvtTrade.event_time ? nsToMs(grvtTrade.event_time) : Date.now(),
        info: grvtTrade,
    };
}
/**
 * Normalize a GRVT ticker into a unified Ticker.
 */
export function normalizeTicker(grvtTicker) {
    const last = num(grvtTicker.last_price ?? grvtTicker.mark_price);
    const buyVolume = num(grvtTicker.buy_volume_24h_q);
    const sellVolume = num(grvtTicker.sell_volume_24h_q);
    return {
        symbol: normalizeSymbol(grvtTicker.instrument || ''),
        last,
        open: last,
        close: last,
        bid: num(grvtTicker.best_bid_price),
        bidVolume: num(grvtTicker.best_bid_size),
        ask: num(grvtTicker.best_ask_price),
        askVolume: num(grvtTicker.best_ask_size),
        high: last,
        low: last,
        change: 0,
        percentage: 0,
        baseVolume: 0,
        quoteVolume: buyVolume + sellVolume,
        timestamp: grvtTicker.event_time ? nsToMs(grvtTicker.event_time) : Date.now(),
        info: grvtTicker,
    };
}
/**
 * Map a GRVT order status to the unified OrderStatus.
 */
function normalizeOrderStatus(grvtStatus) {
    const mapped = GRVT_ORDER_STATUS[grvtStatus];
    return mapped ?? 'open';
}
/**
 * Map a GRVT API TIF string to the unified TimeInForce.
 */
function normalizeTimeInForce(grvtTif) {
    switch (grvtTif) {
        case 'IMMEDIATE_OR_CANCEL':
            return 'IOC';
        case 'FILL_OR_KILL':
            return 'FOK';
        case 'GOOD_TILL_TIME':
        default:
            return 'GTC';
    }
}
/**
 * Convert a unified order side to the GRVT wire side.
 */
export function toGRVTOrderSide(side) {
    return side === 'buy' ? GRVT_ORDER_SIDES.buy : GRVT_ORDER_SIDES.sell;
}
/**
 * Convert a unified TimeInForce (+ postOnly) to the GRVT API TIF string.
 * Maker quotes (post_only) require GOOD_TILL_TIME.
 */
export function toGRVTTimeInForce(tif, postOnly) {
    if (postOnly) {
        return GRVT_TIME_IN_FORCE.GOOD_TILL_TIME;
    }
    switch (tif) {
        case 'IOC':
            return GRVT_TIME_IN_FORCE.IMMEDIATE_OR_CANCEL;
        case 'FOK':
            return GRVT_TIME_IN_FORCE.FILL_OR_KILL;
        case 'PO':
            return GRVT_TIME_IN_FORCE.GOOD_TILL_TIME;
        case 'GTC':
        default:
            return GRVT_TIME_IN_FORCE.GOOD_TILL_TIME;
    }
}
/**
 * Map a GRVT API error code/message to a unified error descriptor.
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
                return { code: 'UNKNOWN_ERROR', message: err.message ?? 'Unknown error occurred' };
        }
    }
    return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
}
//# sourceMappingURL=utils.js.map