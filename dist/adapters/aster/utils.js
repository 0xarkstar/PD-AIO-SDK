/**
 * Aster Utility Functions
 */
import { ASTER_ORDER_SIDES, ASTER_ORDER_TYPES, ASTER_TIME_IN_FORCE } from './constants.js';
export function toAsterSymbol(unified) {
    // "BTC/USDT:USDT" -> "BTCUSDT"
    const parts = unified.split(/[/:]/);
    return `${parts[0]}${parts[1]}`;
}
export function toUnifiedSymbol(_asterSymbol, baseAsset, quoteAsset) {
    // "BTCUSDT" + "BTC" + "USDT" -> "BTC/USDT:USDT"
    return `${baseAsset}/${quoteAsset}:${quoteAsset}`;
}
export function toAsterOrderSide(side) {
    return ASTER_ORDER_SIDES[side] ?? side.toUpperCase();
}
export function toAsterOrderType(type) {
    return ASTER_ORDER_TYPES[type] ?? type.toUpperCase();
}
export function toAsterTimeInForce(tif, postOnly) {
    if (postOnly)
        return 'GTX';
    if (tif)
        return ASTER_TIME_IN_FORCE[tif] ?? tif;
    return 'GTC';
}
export function buildOrderParams(request, asterSymbol, referralCode) {
    const params = {
        symbol: asterSymbol,
        side: toAsterOrderSide(request.side),
        type: toAsterOrderType(request.type),
        quantity: request.amount,
    };
    if (request.price !== undefined) {
        params.price = request.price;
    }
    if (request.stopPrice !== undefined) {
        params.stopPrice = request.stopPrice;
    }
    if (request.type !== 'market') {
        params.timeInForce = toAsterTimeInForce(request.timeInForce, request.postOnly);
    }
    if (request.reduceOnly) {
        params.reduceOnly = 'true';
    }
    if (request.clientOrderId) {
        params.newClientOrderId = request.clientOrderId;
    }
    // Builder/referral code
    const code = request.builderCode ?? referralCode;
    if (code) {
        params.referralCode = code;
    }
    return params;
}
export function parsePrecision(tickSize) {
    if (!tickSize || tickSize === '0')
        return 0;
    const parts = tickSize.split('.');
    const decimal = parts[1];
    if (!decimal)
        return 0;
    return decimal.replace(/0+$/, '').length || 0;
}
//# sourceMappingURL=utils.js.map