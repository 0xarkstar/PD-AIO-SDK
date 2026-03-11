/**
 * Ethereal Utility Functions
 */
import { ETHEREAL_ORDER_SIDES, ETHEREAL_ORDER_TYPES, ETHEREAL_TIME_IN_FORCE, unifiedToEthereal, } from './constants.js';
/**
 * Map unified order side to Ethereal format
 */
export function toEtherealOrderSide(side) {
    return ETHEREAL_ORDER_SIDES[side] ?? side.toUpperCase();
}
/**
 * Map unified order type to Ethereal format
 */
export function toEtherealOrderType(type) {
    return ETHEREAL_ORDER_TYPES[type] ?? type.toUpperCase();
}
/**
 * Map time in force
 */
export function toEtherealTimeInForce(tif, postOnly) {
    if (postOnly)
        return 'POST_ONLY';
    if (tif)
        return ETHEREAL_TIME_IN_FORCE[tif] ?? tif;
    return 'GTC';
}
/**
 * Build order request for Ethereal API
 */
export function buildOrderRequest(request, accountId, signature, nonce) {
    const etherealSymbol = unifiedToEthereal(request.symbol);
    const orderReq = {
        symbol: etherealSymbol,
        side: toEtherealOrderSide(request.side),
        type: toEtherealOrderType(request.type),
        quantity: request.amount.toString(),
        signature,
        nonce,
        accountId,
    };
    if (request.price !== undefined) {
        orderReq.price = request.price.toString();
    }
    if (request.stopPrice !== undefined) {
        orderReq.stopPrice = request.stopPrice.toString();
    }
    if (request.type !== 'market') {
        orderReq.timeInForce = toEtherealTimeInForce(request.timeInForce, request.postOnly);
    }
    if (request.reduceOnly) {
        orderReq.reduceOnly = true;
    }
    if (request.postOnly) {
        orderReq.postOnly = true;
    }
    if (request.clientOrderId) {
        orderReq.clientOrderId = request.clientOrderId;
    }
    return orderReq;
}
/**
 * Map Ethereal order status to unified status
 */
export function mapOrderStatus(status) {
    switch (status.toUpperCase()) {
        case 'NEW':
        case 'OPEN':
            return 'open';
        case 'FILLED':
            return 'filled';
        case 'PARTIALLY_FILLED':
            return 'partiallyFilled';
        case 'CANCELLED':
        case 'CANCELED':
            return 'canceled';
        case 'REJECTED':
            return 'rejected';
        default:
            return 'open';
    }
}
/**
 * Parse Ethereal symbol to extract base and quote
 * @example "ETH-USD" -> { base: "ETH", quote: "USD" }
 */
export function parseEtherealSymbol(symbol) {
    const parts = symbol.split('-');
    return {
        base: parts[0] ?? symbol,
        quote: parts[1] ?? 'USD',
    };
}
/**
 * Map OHLCV timeframe to Ethereal candle interval
 */
export function mapTimeframeToInterval(timeframe) {
    const mapping = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '4h': '4h',
        '1d': '1d',
        '1w': '1w',
    };
    return mapping[timeframe] ?? '1h';
}
//# sourceMappingURL=utils.js.map