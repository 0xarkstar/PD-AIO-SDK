/**
 * Katana utility functions
 */
import { KATANA_ORDER_TYPES, KATANA_ORDER_SIDES, KATANA_TIME_IN_FORCE, KATANA_ORDER_TYPE_REVERSE, KATANA_ORDER_STATUS, KATANA_TRIGGER_TYPES, KATANA_SELF_TRADE_PREVENTION, KATANA_PRECISION, KATANA_FUNDING_INTERVAL_HOURS, KATANA_NULL_ADDRESS, KATANA_ZERO_DECIMAL, } from './constants.js';
import { InsufficientMarginError, InvalidOrderError, InvalidSignatureError, OrderNotFoundError, RateLimitError, ExchangeUnavailableError, PerpDEXError, } from '../../types/errors.js';
// -- Number formatting --
/**
 * Format number as Katana 8-decimal zero-padded string
 *
 * @example formatDecimal(1850) // "1850.00000000"
 * @example formatDecimal(0.5) // "0.50000000"
 */
export function formatDecimal(value) {
    return value.toFixed(KATANA_PRECISION.price);
}
/**
 * Parse Katana decimal string to number
 *
 * @example parseDecimal("1850.00000000") // 1850
 * @example parseDecimal("0.50000000") // 0.5
 */
export function parseDecimal(value) {
    if (!value || value === KATANA_ZERO_DECIMAL)
        return 0;
    return parseFloat(value);
}
/**
 * Count decimal places in a string number
 */
function countDecimals(value) {
    const parts = value.split('.');
    return parts.length === 2 && parts[1] ? parts[1].replace(/0+$/, '').length || 1 : 0;
}
// -- Symbol conversion --
/**
 * Convert Katana symbol to unified CCXT format
 *
 * @example normalizeSymbol("ETH-USD") // "ETH/USD:USD"
 * @example normalizeSymbol("BTC-USD") // "BTC/USD:USD"
 */
export function normalizeSymbol(katanaSymbol) {
    const [base, quote] = katanaSymbol.split('-');
    return `${base}/${quote}:${quote}`;
}
/**
 * Convert unified CCXT symbol to Katana format
 *
 * @example toKatanaSymbol("ETH/USD:USD") // "ETH-USD"
 * @example toKatanaSymbol("BTC/USD:USD") // "BTC-USD"
 */
export function toKatanaSymbol(symbol) {
    const pair = symbol.split(':')[0] ?? '';
    const [base, quote] = pair.split('/');
    return `${base}-${quote}`;
}
// -- Normalization functions --
/**
 * Normalize Katana market to unified format
 */
export function normalizeMarket(raw) {
    const symbol = normalizeSymbol(raw.market);
    const [base, quote] = raw.market.split('-');
    const initialMargin = parseDecimal(raw.initialMarginFraction);
    const maxLeverage = initialMargin > 0 ? Math.round(1 / initialMargin) : 20;
    return {
        id: raw.market,
        symbol,
        base: base ?? '',
        quote: quote ?? '',
        settle: quote ?? '',
        active: raw.status === 'active',
        minAmount: parseDecimal(raw.takerOrderMinimum),
        pricePrecision: countDecimals(raw.tickSize),
        amountPrecision: countDecimals(raw.stepSize),
        priceTickSize: parseDecimal(raw.tickSize),
        amountStepSize: parseDecimal(raw.stepSize),
        makerFee: parseDecimal(raw.makerFeeRate),
        takerFee: parseDecimal(raw.takerFeeRate),
        maxLeverage,
        fundingIntervalHours: KATANA_FUNDING_INTERVAL_HOURS,
    };
}
/**
 * Normalize Katana order to unified format
 */
export function normalizeOrder(raw) {
    const symbol = normalizeSymbol(raw.market);
    const quantity = parseDecimal(raw.quantity);
    const filledQty = parseDecimal(raw.filledQuantity);
    return {
        id: raw.orderId,
        clientOrderId: raw.clientOrderId || undefined,
        symbol,
        type: normalizeOrderType(raw.type),
        side: normalizeOrderSide(raw.side),
        amount: quantity,
        price: raw.limitPrice !== KATANA_ZERO_DECIMAL ? parseDecimal(raw.limitPrice) : undefined,
        filled: filledQty,
        remaining: quantity - filledQty,
        status: normalizeOrderStatus(raw.state),
        reduceOnly: false,
        postOnly: false,
        timestamp: raw.createdAt,
        lastUpdateTimestamp: raw.time,
        info: raw,
    };
}
/**
 * Normalize Katana position to unified format
 */
export function normalizePosition(raw) {
    const symbol = normalizeSymbol(raw.market);
    const qty = parseDecimal(raw.quantity);
    const side = qty >= 0 ? 'long' : 'short';
    return {
        symbol,
        side,
        marginMode: 'cross',
        size: Math.abs(qty),
        entryPrice: parseDecimal(raw.entryPrice),
        markPrice: parseDecimal(raw.markPrice),
        liquidationPrice: parseDecimal(raw.liquidationPrice),
        unrealizedPnl: parseDecimal(raw.unrealizedPnL),
        realizedPnl: parseDecimal(raw.realizedPnL),
        margin: parseDecimal(raw.marginRequirement),
        leverage: parseDecimal(raw.leverage),
        maintenanceMargin: 0,
        marginRatio: 0,
        timestamp: raw.time,
        info: {
            ...raw,
            adlQuintile: raw.adlQuintile,
        },
    };
}
/**
 * Normalize Katana wallet to unified balance
 */
export function normalizeBalance(raw) {
    return {
        currency: 'USDC', // vbUSDC → USDC
        total: parseDecimal(raw.equity),
        free: parseDecimal(raw.freeCollateral),
        used: parseDecimal(raw.heldCollateral),
        info: raw,
    };
}
/**
 * Normalize Katana orderbook to unified format
 */
export function normalizeOrderBook(raw, market) {
    return {
        symbol: normalizeSymbol(market),
        exchange: 'katana',
        bids: raw.bids.map(([price, qty]) => [parseDecimal(price), parseDecimal(qty)]),
        asks: raw.asks.map(([price, qty]) => [parseDecimal(price), parseDecimal(qty)]),
        timestamp: Date.now(),
    };
}
/**
 * Normalize Katana public trade to unified format
 */
export function normalizeTrade(raw) {
    const price = parseDecimal(raw.price);
    const amount = parseDecimal(raw.quantity);
    return {
        id: raw.fillId,
        symbol: normalizeSymbol(raw.market),
        side: raw.side === 'buy' ? 'buy' : 'sell',
        price,
        amount,
        cost: price * amount,
        timestamp: raw.time,
        info: raw,
    };
}
/**
 * Normalize Katana fill (private trade) to unified format
 */
export function normalizeFill(raw) {
    const price = parseDecimal(raw.price);
    const amount = parseDecimal(raw.quantity);
    return {
        id: raw.fillId,
        orderId: raw.orderId,
        symbol: normalizeSymbol(raw.market),
        side: raw.side === 'buy' ? 'buy' : 'sell',
        price,
        amount,
        cost: price * amount,
        fee: {
            cost: parseDecimal(raw.fee),
            currency: raw.feeAsset || 'USDC',
        },
        timestamp: raw.time,
        info: raw,
    };
}
/**
 * Normalize Katana ticker to unified format
 */
export function normalizeTicker(raw) {
    return {
        symbol: normalizeSymbol(raw.market),
        last: parseDecimal(raw.close),
        open: parseDecimal(raw.open),
        close: parseDecimal(raw.close),
        bid: parseDecimal(raw.bid),
        ask: parseDecimal(raw.ask),
        high: parseDecimal(raw.high),
        low: parseDecimal(raw.low),
        change: 0,
        percentage: parseDecimal(raw.percentChange),
        baseVolume: parseDecimal(raw.baseVolume),
        quoteVolume: parseDecimal(raw.quoteVolume),
        timestamp: raw.time,
        info: raw,
    };
}
/**
 * Normalize Katana funding rate to unified format
 */
export function normalizeFundingRate(raw) {
    return {
        symbol: normalizeSymbol(raw.market),
        fundingRate: parseDecimal(raw.rate),
        fundingTimestamp: raw.time,
        nextFundingTimestamp: raw.time + KATANA_FUNDING_INTERVAL_HOURS * 3600000,
        markPrice: 0,
        indexPrice: 0,
        fundingIntervalHours: KATANA_FUNDING_INTERVAL_HOURS,
        info: raw,
    };
}
// -- Order conversion (unified → Katana) --
/**
 * Convert unified OrderRequest to Katana EIP-712 sign payload
 */
export function convertOrderRequest(request, walletAddress, nonce) {
    const katanaMarket = toKatanaSymbol(request.symbol);
    return {
        nonce,
        wallet: walletAddress,
        market: katanaMarket,
        type: toKatanaOrderType(request.type, request.price),
        side: KATANA_ORDER_SIDES[request.side] ?? 0,
        quantity: formatDecimal(request.amount),
        limitPrice: request.price != null ? formatDecimal(request.price) : KATANA_ZERO_DECIMAL,
        triggerPrice: request.stopPrice != null
            ? formatDecimal(request.stopPrice)
            : KATANA_ZERO_DECIMAL,
        triggerType: request.stopPrice != null ? KATANA_TRIGGER_TYPES.index : KATANA_TRIGGER_TYPES.none,
        callbackRate: KATANA_ZERO_DECIMAL,
        conditionalOrderId: 0,
        isReduceOnly: request.reduceOnly ?? false,
        timeInForce: toKatanaTimeInForce(request.timeInForce, request.postOnly),
        selfTradePrevention: KATANA_SELF_TRADE_PREVENTION.decrementAndCancel,
        isLiquidationAcquisitionOnly: false,
        delegatedPublicKey: KATANA_NULL_ADDRESS,
        clientOrderId: request.clientOrderId ?? '',
    };
}
// -- Enum conversion helpers --
function toKatanaOrderType(type, price) {
    switch (type) {
        case 'market':
            return KATANA_ORDER_TYPES.market;
        case 'limit':
            return KATANA_ORDER_TYPES.limit;
        case 'stopMarket':
            return KATANA_ORDER_TYPES.stopMarket;
        case 'stopLimit':
            return KATANA_ORDER_TYPES.stopLimit;
        case 'takeProfit':
            return price != null ? KATANA_ORDER_TYPES.takeProfitLimit : KATANA_ORDER_TYPES.takeProfitMarket;
        default:
            return KATANA_ORDER_TYPES.limit;
    }
}
function toKatanaTimeInForce(tif, postOnly) {
    if (postOnly)
        return KATANA_TIME_IN_FORCE.PO;
    switch (tif) {
        case 'IOC':
            return KATANA_TIME_IN_FORCE.IOC;
        case 'FOK':
            return KATANA_TIME_IN_FORCE.FOK;
        case 'PO':
            return KATANA_TIME_IN_FORCE.PO;
        case 'GTC':
        default:
            return KATANA_TIME_IN_FORCE.GTC;
    }
}
function normalizeOrderType(katanaType) {
    const mapped = KATANA_ORDER_TYPE_REVERSE[katanaType];
    return mapped ?? 'limit';
}
function normalizeOrderSide(katanaSide) {
    return katanaSide === 0 ? 'buy' : 'sell';
}
function normalizeOrderStatus(katanaState) {
    return KATANA_ORDER_STATUS[katanaState] ?? 'open';
}
// -- Error mapping --
/**
 * Map Katana error to unified SDK error
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    if (typeof error !== 'object' || error === null) {
        return new PerpDEXError('Unknown Katana error', 'UNKNOWN', 'katana', error);
    }
    const err = error;
    const message = err.message ?? 'Unknown error';
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('insufficient') && lowerMsg.includes('margin')) {
        return new InsufficientMarginError(message, 'INSUFFICIENT_MARGIN', 'katana', error);
    }
    if (lowerMsg.includes('invalid order') || lowerMsg.includes('invalid parameter')) {
        return new InvalidOrderError(message, 'INVALID_ORDER', 'katana', error);
    }
    if (lowerMsg.includes('signature') || lowerMsg.includes('unauthorized')) {
        return new InvalidSignatureError(message, 'INVALID_SIGNATURE', 'katana', error);
    }
    if (lowerMsg.includes('not found') && lowerMsg.includes('order')) {
        return new OrderNotFoundError(message, 'ORDER_NOT_FOUND', 'katana', error);
    }
    if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many')) {
        return new RateLimitError(message, 'RATE_LIMIT_EXCEEDED', 'katana', undefined, error);
    }
    if (lowerMsg.includes('unavailable') || lowerMsg.includes('maintenance')) {
        return new ExchangeUnavailableError(message, 'EXCHANGE_UNAVAILABLE', 'katana', error);
    }
    return new PerpDEXError(message, err.code ?? 'UNKNOWN', 'katana', error);
}
//# sourceMappingURL=utils.js.map