/**
 * Katana-specific type definitions and Zod schemas
 */
import { z } from 'zod';
/**
 * Katana market from GET /v1/markets
 */
export interface KatanaMarket {
    market: string;
    type: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    stepSize: string;
    tickSize: string;
    indexPrice: string;
    indexPrice24h: string;
    indexPricePercentChange: string;
    lastFundingRate: string;
    currentFundingRate: string;
    nextFundingTime: number;
    makerOrderMinimum: string;
    takerOrderMinimum: string;
    marketOrderExecutionPriceLimit: string;
    limitOrderExecutionPriceLimit: string;
    minimumPositionSize: string;
    maximumPositionSize: string;
    initialMarginFraction: string;
    maintenanceMarginFraction: string;
    basePositionSize: string;
    incrementalPositionSize: string;
    incrementalInitialMarginFraction: string;
    makerFeeRate: string;
    takerFeeRate: string;
    volume24h: string;
    trades24h: number;
    openInterest: string;
}
export declare const KatanaMarketSchema: z.ZodObject<{
    market: z.ZodString;
    type: z.ZodString;
    status: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    stepSize: z.ZodString;
    tickSize: z.ZodString;
    indexPrice: z.ZodString;
    lastFundingRate: z.ZodString;
    currentFundingRate: z.ZodString;
    nextFundingTime: z.ZodNumber;
    makerOrderMinimum: z.ZodString;
    takerOrderMinimum: z.ZodString;
    minimumPositionSize: z.ZodString;
    maximumPositionSize: z.ZodString;
    initialMarginFraction: z.ZodString;
    maintenanceMarginFraction: z.ZodString;
    makerFeeRate: z.ZodString;
    takerFeeRate: z.ZodString;
    volume24h: z.ZodString;
    openInterest: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    type: z.ZodString;
    status: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    stepSize: z.ZodString;
    tickSize: z.ZodString;
    indexPrice: z.ZodString;
    lastFundingRate: z.ZodString;
    currentFundingRate: z.ZodString;
    nextFundingTime: z.ZodNumber;
    makerOrderMinimum: z.ZodString;
    takerOrderMinimum: z.ZodString;
    minimumPositionSize: z.ZodString;
    maximumPositionSize: z.ZodString;
    initialMarginFraction: z.ZodString;
    maintenanceMarginFraction: z.ZodString;
    makerFeeRate: z.ZodString;
    takerFeeRate: z.ZodString;
    volume24h: z.ZodString;
    openInterest: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    type: z.ZodString;
    status: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    stepSize: z.ZodString;
    tickSize: z.ZodString;
    indexPrice: z.ZodString;
    lastFundingRate: z.ZodString;
    currentFundingRate: z.ZodString;
    nextFundingTime: z.ZodNumber;
    makerOrderMinimum: z.ZodString;
    takerOrderMinimum: z.ZodString;
    minimumPositionSize: z.ZodString;
    maximumPositionSize: z.ZodString;
    initialMarginFraction: z.ZodString;
    maintenanceMarginFraction: z.ZodString;
    makerFeeRate: z.ZodString;
    takerFeeRate: z.ZodString;
    volume24h: z.ZodString;
    openInterest: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana ticker from GET /v1/tickers
 */
export interface KatanaTicker {
    market: string;
    time: number;
    open: string;
    high: string;
    low: string;
    close: string;
    closeQuantity: string;
    baseVolume: string;
    quoteVolume: string;
    percentChange: string;
    trades: number;
    ask: string;
    bid: string;
    markPrice: string;
    indexPrice: string;
    indexPrice24h: string;
    indexPricePercentChange: string;
    lastFundingRate: string;
    currentFundingRate: string;
    nextFundingTime: number;
    openInterest: string;
    sequence: number;
}
export declare const KatanaTickerSchema: z.ZodObject<{
    market: z.ZodString;
    time: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    baseVolume: z.ZodString;
    quoteVolume: z.ZodString;
    percentChange: z.ZodString;
    ask: z.ZodString;
    bid: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    time: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    baseVolume: z.ZodString;
    quoteVolume: z.ZodString;
    percentChange: z.ZodString;
    ask: z.ZodString;
    bid: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    time: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    baseVolume: z.ZodString;
    quoteVolume: z.ZodString;
    percentChange: z.ZodString;
    ask: z.ZodString;
    bid: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana orderbook from GET /v1/orderbook
 */
export interface KatanaOrderBook {
    sequence: number;
    bids: Array<[string, string, number]>;
    asks: Array<[string, string, number]>;
    lastPrice: string;
    markPrice: string;
    indexPrice: string;
}
export declare const KatanaOrderBookSchema: z.ZodObject<{
    sequence: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString, z.ZodNumber], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString, z.ZodNumber], null>, "many">;
    lastPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    sequence: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString, z.ZodNumber], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString, z.ZodNumber], null>, "many">;
    lastPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    sequence: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString, z.ZodNumber], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString, z.ZodNumber], null>, "many">;
    lastPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana trade from GET /v1/trades
 */
export interface KatanaTrade {
    fillId: string;
    market: string;
    price: string;
    quantity: string;
    quoteQuantity: string;
    time: number;
    side: string;
    sequence: number;
}
export declare const KatanaTradeSchema: z.ZodObject<{
    fillId: z.ZodString;
    market: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodString;
    time: z.ZodNumber;
    side: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    fillId: z.ZodString;
    market: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodString;
    time: z.ZodNumber;
    side: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    fillId: z.ZodString;
    market: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodString;
    time: z.ZodNumber;
    side: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana OHLCV candle from GET /v1/candles
 */
export interface KatanaCandle {
    start: number;
    open: string;
    high: string;
    low: string;
    close: string;
    baseVolume: string;
    quoteVolume: string;
    trades: number;
    sequence: number;
}
export declare const KatanaCandleSchema: z.ZodObject<{
    start: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    baseVolume: z.ZodString;
    quoteVolume: z.ZodString;
    trades: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    start: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    baseVolume: z.ZodString;
    quoteVolume: z.ZodString;
    trades: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    start: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    baseVolume: z.ZodString;
    quoteVolume: z.ZodString;
    trades: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana funding rate from GET /v1/fundingRates
 */
export interface KatanaFundingRate {
    market: string;
    rate: string;
    time: number;
}
export declare const KatanaFundingRateSchema: z.ZodObject<{
    market: z.ZodString;
    rate: z.ZodString;
    time: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    rate: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    rate: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana order from GET /v1/orders
 */
export interface KatanaOrder {
    orderId: string;
    clientOrderId: string;
    market: string;
    type: number;
    side: number;
    state: string;
    quantity: string;
    filledQuantity: string;
    limitPrice: string;
    triggerPrice: string;
    time: number;
    expirationTime?: number;
    fees: string;
    createdAt: number;
}
export declare const KatanaOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
    clientOrderId: z.ZodString;
    market: z.ZodString;
    type: z.ZodNumber;
    side: z.ZodNumber;
    state: z.ZodString;
    quantity: z.ZodString;
    filledQuantity: z.ZodString;
    limitPrice: z.ZodString;
    triggerPrice: z.ZodString;
    time: z.ZodNumber;
    fees: z.ZodString;
    createdAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    orderId: z.ZodString;
    clientOrderId: z.ZodString;
    market: z.ZodString;
    type: z.ZodNumber;
    side: z.ZodNumber;
    state: z.ZodString;
    quantity: z.ZodString;
    filledQuantity: z.ZodString;
    limitPrice: z.ZodString;
    triggerPrice: z.ZodString;
    time: z.ZodNumber;
    fees: z.ZodString;
    createdAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    orderId: z.ZodString;
    clientOrderId: z.ZodString;
    market: z.ZodString;
    type: z.ZodNumber;
    side: z.ZodNumber;
    state: z.ZodString;
    quantity: z.ZodString;
    filledQuantity: z.ZodString;
    limitPrice: z.ZodString;
    triggerPrice: z.ZodString;
    time: z.ZodNumber;
    fees: z.ZodString;
    createdAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana position from GET /v1/positions
 */
export interface KatanaPosition {
    market: string;
    quantity: string;
    maximumQuantity: string;
    entryPrice: string;
    exitPrice: string;
    markPrice: string;
    indexPrice: string;
    liquidationPrice: string;
    value: string;
    realizedPnL: string;
    unrealizedPnL: string;
    marginRequirement: string;
    leverage: string;
    totalFunding: string;
    totalOpen: string;
    totalClose: string;
    adlQuintile: number;
    openedByFillId: string;
    lastFillId: string;
    time: number;
}
export declare const KatanaPositionSchema: z.ZodObject<{
    market: z.ZodString;
    quantity: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
    liquidationPrice: z.ZodString;
    realizedPnL: z.ZodString;
    unrealizedPnL: z.ZodString;
    marginRequirement: z.ZodString;
    leverage: z.ZodString;
    adlQuintile: z.ZodNumber;
    time: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    quantity: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
    liquidationPrice: z.ZodString;
    realizedPnL: z.ZodString;
    unrealizedPnL: z.ZodString;
    marginRequirement: z.ZodString;
    leverage: z.ZodString;
    adlQuintile: z.ZodNumber;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    quantity: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
    liquidationPrice: z.ZodString;
    realizedPnL: z.ZodString;
    unrealizedPnL: z.ZodString;
    marginRequirement: z.ZodString;
    leverage: z.ZodString;
    adlQuintile: z.ZodNumber;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana wallet/balance from GET /v1/wallets
 */
export interface KatanaWallet {
    wallet: string;
    equity: string;
    freeCollateral: string;
    heldCollateral: string;
    availableCollateral: string;
    buyingPower: string;
    leverage: string;
    marginRatio: string;
    quoteBalance: string;
    unrealizedPnL: string;
    makerFeeRate: string;
    takerFeeRate: string;
}
export declare const KatanaWalletSchema: z.ZodObject<{
    wallet: z.ZodString;
    equity: z.ZodString;
    freeCollateral: z.ZodString;
    heldCollateral: z.ZodString;
    availableCollateral: z.ZodString;
    quoteBalance: z.ZodString;
    unrealizedPnL: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    wallet: z.ZodString;
    equity: z.ZodString;
    freeCollateral: z.ZodString;
    heldCollateral: z.ZodString;
    availableCollateral: z.ZodString;
    quoteBalance: z.ZodString;
    unrealizedPnL: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    wallet: z.ZodString;
    equity: z.ZodString;
    freeCollateral: z.ZodString;
    heldCollateral: z.ZodString;
    availableCollateral: z.ZodString;
    quoteBalance: z.ZodString;
    unrealizedPnL: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana fill from GET /v1/fills
 */
export interface KatanaFill {
    fillId: string;
    orderId: string;
    market: string;
    price: string;
    quantity: string;
    quoteQuantity: string;
    side: string;
    time: number;
    fee: string;
    feeAsset: string;
    liquidity: string;
    sequence: number;
}
export declare const KatanaFillSchema: z.ZodObject<{
    fillId: z.ZodString;
    orderId: z.ZodString;
    market: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    fee: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    fillId: z.ZodString;
    orderId: z.ZodString;
    market: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    fee: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    fillId: z.ZodString;
    orderId: z.ZodString;
    market: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    fee: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Katana server time from GET /v1/time
 */
export interface KatanaServerTime {
    serverTime: number;
}
/**
 * Katana order request payload for POST /v1/orders
 */
export interface KatanaOrderRequest {
    nonce: string;
    wallet: string;
    market: string;
    type: number;
    side: number;
    quantity: string;
    limitPrice: string;
    triggerPrice: string;
    triggerType: number;
    callbackRate: string;
    conditionalOrderId: number;
    isReduceOnly: boolean;
    timeInForce: number;
    selfTradePrevention: number;
    isLiquidationAcquisitionOnly: boolean;
    delegatedPublicKey: string;
    clientOrderId: string;
    signature: string;
}
/**
 * Katana cancel request payload for DELETE /v1/orders
 */
export interface KatanaCancelRequest {
    nonce: string;
    wallet: string;
    orderId?: string;
    market?: string;
    signature: string;
}
/**
 * Katana WebSocket subscription message
 */
export interface KatanaWsSubscription {
    type: 'subscribe' | 'unsubscribe';
    channel: string;
    market?: string;
    interval?: string;
}
/**
 * Katana WebSocket message envelope
 */
export interface KatanaWsMessage {
    type: string;
    channel: string;
    market?: string;
    data: unknown;
}
/**
 * EIP-712 order signing payload
 */
export interface KatanaOrderSignPayload {
    nonce: string;
    wallet: string;
    market: string;
    type: number;
    side: number;
    quantity: string;
    limitPrice: string;
    triggerPrice: string;
    triggerType: number;
    callbackRate: string;
    conditionalOrderId: number;
    isReduceOnly: boolean;
    timeInForce: number;
    selfTradePrevention: number;
    isLiquidationAcquisitionOnly: boolean;
    delegatedPublicKey: string;
    clientOrderId: string;
}
/**
 * EIP-712 cancel signing payload
 */
export interface KatanaCancelSignPayload {
    nonce: string;
    wallet: string;
    orderId: string;
    market: string;
}
//# sourceMappingURL=types.d.ts.map