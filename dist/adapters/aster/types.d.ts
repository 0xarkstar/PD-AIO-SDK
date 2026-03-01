/**
 * Aster Exchange-Specific Types
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface AsterConfig extends ExchangeConfig {
    apiKey?: string;
    apiSecret?: string;
    testnet?: boolean;
    timeout?: number;
    /** Referral code for fee sharing */
    referralCode?: string;
}
export interface AsterExchangeInfo {
    timezone: string;
    serverTime: number;
    symbols: AsterSymbolInfo[];
}
export interface AsterSymbolInfo {
    symbol: string;
    pair: string;
    contractType: string;
    deliveryDate: number;
    onboardDate: number;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    marginAsset: string;
    pricePrecision: number;
    quantityPrecision: number;
    baseAssetPrecision: number;
    quotePrecision: number;
    underlyingType: string;
    settlePlan: number;
    triggerProtect: string;
    filters: AsterFilter[];
    orderTypes: string[];
    timeInForce: string[];
    liquidationFee: string;
    marketTakeBound: string;
}
export declare const AsterSymbolInfoSchema: z.ZodObject<{
    symbol: z.ZodString;
    pair: z.ZodString;
    contractType: z.ZodString;
    deliveryDate: z.ZodNumber;
    onboardDate: z.ZodNumber;
    status: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    marginAsset: z.ZodString;
    pricePrecision: z.ZodNumber;
    quantityPrecision: z.ZodNumber;
    baseAssetPrecision: z.ZodNumber;
    quotePrecision: z.ZodNumber;
    underlyingType: z.ZodString;
    settlePlan: z.ZodNumber;
    triggerProtect: z.ZodString;
    filters: z.ZodArray<z.ZodAny, "many">;
    orderTypes: z.ZodArray<z.ZodString, "many">;
    timeInForce: z.ZodArray<z.ZodString, "many">;
    liquidationFee: z.ZodString;
    marketTakeBound: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    pair: z.ZodString;
    contractType: z.ZodString;
    deliveryDate: z.ZodNumber;
    onboardDate: z.ZodNumber;
    status: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    marginAsset: z.ZodString;
    pricePrecision: z.ZodNumber;
    quantityPrecision: z.ZodNumber;
    baseAssetPrecision: z.ZodNumber;
    quotePrecision: z.ZodNumber;
    underlyingType: z.ZodString;
    settlePlan: z.ZodNumber;
    triggerProtect: z.ZodString;
    filters: z.ZodArray<z.ZodAny, "many">;
    orderTypes: z.ZodArray<z.ZodString, "many">;
    timeInForce: z.ZodArray<z.ZodString, "many">;
    liquidationFee: z.ZodString;
    marketTakeBound: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    pair: z.ZodString;
    contractType: z.ZodString;
    deliveryDate: z.ZodNumber;
    onboardDate: z.ZodNumber;
    status: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    marginAsset: z.ZodString;
    pricePrecision: z.ZodNumber;
    quantityPrecision: z.ZodNumber;
    baseAssetPrecision: z.ZodNumber;
    quotePrecision: z.ZodNumber;
    underlyingType: z.ZodString;
    settlePlan: z.ZodNumber;
    triggerProtect: z.ZodString;
    filters: z.ZodArray<z.ZodAny, "many">;
    orderTypes: z.ZodArray<z.ZodString, "many">;
    timeInForce: z.ZodArray<z.ZodString, "many">;
    liquidationFee: z.ZodString;
    marketTakeBound: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type AsterFilter = AsterPriceFilter | AsterLotSizeFilter | AsterMinNotionalFilter | AsterMaxOrdersFilter | AsterPercentPriceFilter;
export interface AsterPriceFilter {
    filterType: 'PRICE_FILTER';
    minPrice: string;
    maxPrice: string;
    tickSize: string;
}
export interface AsterLotSizeFilter {
    filterType: 'LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
}
export interface AsterMinNotionalFilter {
    filterType: 'MIN_NOTIONAL';
    notional: string;
}
export interface AsterMaxOrdersFilter {
    filterType: 'MAX_NUM_ORDERS';
    limit: number;
}
export interface AsterPercentPriceFilter {
    filterType: 'PERCENT_PRICE';
    multiplierUp: string;
    multiplierDown: string;
    multiplierDecimal: string;
}
export interface AsterTicker24hr {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    lastPrice: string;
    lastQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
}
export declare const AsterTicker24hrSchema: z.ZodObject<{
    symbol: z.ZodString;
    priceChange: z.ZodString;
    priceChangePercent: z.ZodString;
    weightedAvgPrice: z.ZodString;
    lastPrice: z.ZodString;
    lastQty: z.ZodString;
    openPrice: z.ZodString;
    highPrice: z.ZodString;
    lowPrice: z.ZodString;
    volume: z.ZodString;
    quoteVolume: z.ZodString;
    openTime: z.ZodNumber;
    closeTime: z.ZodNumber;
    firstId: z.ZodNumber;
    lastId: z.ZodNumber;
    count: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    priceChange: z.ZodString;
    priceChangePercent: z.ZodString;
    weightedAvgPrice: z.ZodString;
    lastPrice: z.ZodString;
    lastQty: z.ZodString;
    openPrice: z.ZodString;
    highPrice: z.ZodString;
    lowPrice: z.ZodString;
    volume: z.ZodString;
    quoteVolume: z.ZodString;
    openTime: z.ZodNumber;
    closeTime: z.ZodNumber;
    firstId: z.ZodNumber;
    lastId: z.ZodNumber;
    count: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    priceChange: z.ZodString;
    priceChangePercent: z.ZodString;
    weightedAvgPrice: z.ZodString;
    lastPrice: z.ZodString;
    lastQty: z.ZodString;
    openPrice: z.ZodString;
    highPrice: z.ZodString;
    lowPrice: z.ZodString;
    volume: z.ZodString;
    quoteVolume: z.ZodString;
    openTime: z.ZodNumber;
    closeTime: z.ZodNumber;
    firstId: z.ZodNumber;
    lastId: z.ZodNumber;
    count: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AsterOrderBookResponse {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
    T: number;
}
export declare const AsterOrderBookResponseSchema: z.ZodObject<{
    lastUpdateId: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    T: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    lastUpdateId: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    T: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    lastUpdateId: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    T: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AsterTradeResponse {
    id: number;
    price: string;
    qty: string;
    quoteQty: string;
    time: number;
    isBuyerMaker: boolean;
}
export declare const AsterTradeResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    price: z.ZodString;
    qty: z.ZodString;
    quoteQty: z.ZodString;
    time: z.ZodNumber;
    isBuyerMaker: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodNumber;
    price: z.ZodString;
    qty: z.ZodString;
    quoteQty: z.ZodString;
    time: z.ZodNumber;
    isBuyerMaker: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodNumber;
    price: z.ZodString;
    qty: z.ZodString;
    quoteQty: z.ZodString;
    time: z.ZodNumber;
    isBuyerMaker: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
export interface AsterPremiumIndex {
    symbol: string;
    markPrice: string;
    indexPrice: string;
    estimatedSettlePrice: string;
    lastFundingRate: string;
    nextFundingTime: number;
    interestRate: string;
    time: number;
}
export declare const AsterPremiumIndexSchema: z.ZodObject<{
    symbol: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
    estimatedSettlePrice: z.ZodString;
    lastFundingRate: z.ZodString;
    nextFundingTime: z.ZodNumber;
    interestRate: z.ZodString;
    time: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
    estimatedSettlePrice: z.ZodString;
    lastFundingRate: z.ZodString;
    nextFundingTime: z.ZodNumber;
    interestRate: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodString;
    estimatedSettlePrice: z.ZodString;
    lastFundingRate: z.ZodString;
    nextFundingTime: z.ZodNumber;
    interestRate: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AsterKlineResponse {
    0: number;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: number;
    7: string;
    8: number;
    9: string;
    10: string;
    11: string;
}
export interface AsterOrderResponse {
    orderId: number;
    symbol: string;
    status: string;
    clientOrderId: string;
    price: string;
    avgPrice: string;
    origQty: string;
    executedQty: string;
    cumQuote: string;
    timeInForce: string;
    type: string;
    reduceOnly: boolean;
    closePosition: boolean;
    side: string;
    positionSide: string;
    stopPrice: string;
    workingType: string;
    origType: string;
    updateTime: number;
}
export declare const AsterOrderResponseSchema: z.ZodObject<{
    orderId: z.ZodNumber;
    symbol: z.ZodString;
    status: z.ZodString;
    clientOrderId: z.ZodString;
    price: z.ZodString;
    avgPrice: z.ZodString;
    origQty: z.ZodString;
    executedQty: z.ZodString;
    cumQuote: z.ZodString;
    timeInForce: z.ZodString;
    type: z.ZodString;
    reduceOnly: z.ZodBoolean;
    closePosition: z.ZodBoolean;
    side: z.ZodString;
    positionSide: z.ZodString;
    stopPrice: z.ZodString;
    workingType: z.ZodString;
    origType: z.ZodString;
    updateTime: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    orderId: z.ZodNumber;
    symbol: z.ZodString;
    status: z.ZodString;
    clientOrderId: z.ZodString;
    price: z.ZodString;
    avgPrice: z.ZodString;
    origQty: z.ZodString;
    executedQty: z.ZodString;
    cumQuote: z.ZodString;
    timeInForce: z.ZodString;
    type: z.ZodString;
    reduceOnly: z.ZodBoolean;
    closePosition: z.ZodBoolean;
    side: z.ZodString;
    positionSide: z.ZodString;
    stopPrice: z.ZodString;
    workingType: z.ZodString;
    origType: z.ZodString;
    updateTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    orderId: z.ZodNumber;
    symbol: z.ZodString;
    status: z.ZodString;
    clientOrderId: z.ZodString;
    price: z.ZodString;
    avgPrice: z.ZodString;
    origQty: z.ZodString;
    executedQty: z.ZodString;
    cumQuote: z.ZodString;
    timeInForce: z.ZodString;
    type: z.ZodString;
    reduceOnly: z.ZodBoolean;
    closePosition: z.ZodBoolean;
    side: z.ZodString;
    positionSide: z.ZodString;
    stopPrice: z.ZodString;
    workingType: z.ZodString;
    origType: z.ZodString;
    updateTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AsterPositionRisk {
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    markPrice: string;
    unRealizedProfit: string;
    liquidationPrice: string;
    leverage: string;
    maxNotionalValue: string;
    marginType: string;
    isolatedMargin: string;
    isAutoAddMargin: string;
    positionSide: string;
    notional: string;
    isolatedWallet: string;
    updateTime: number;
}
export declare const AsterPositionRiskSchema: z.ZodObject<{
    symbol: z.ZodString;
    positionAmt: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    unRealizedProfit: z.ZodString;
    liquidationPrice: z.ZodString;
    leverage: z.ZodString;
    maxNotionalValue: z.ZodString;
    marginType: z.ZodString;
    isolatedMargin: z.ZodString;
    isAutoAddMargin: z.ZodString;
    positionSide: z.ZodString;
    notional: z.ZodString;
    isolatedWallet: z.ZodString;
    updateTime: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    positionAmt: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    unRealizedProfit: z.ZodString;
    liquidationPrice: z.ZodString;
    leverage: z.ZodString;
    maxNotionalValue: z.ZodString;
    marginType: z.ZodString;
    isolatedMargin: z.ZodString;
    isAutoAddMargin: z.ZodString;
    positionSide: z.ZodString;
    notional: z.ZodString;
    isolatedWallet: z.ZodString;
    updateTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    positionAmt: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    unRealizedProfit: z.ZodString;
    liquidationPrice: z.ZodString;
    leverage: z.ZodString;
    maxNotionalValue: z.ZodString;
    marginType: z.ZodString;
    isolatedMargin: z.ZodString;
    isAutoAddMargin: z.ZodString;
    positionSide: z.ZodString;
    notional: z.ZodString;
    isolatedWallet: z.ZodString;
    updateTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AsterAccountBalance {
    accountAlias: string;
    asset: string;
    balance: string;
    crossWalletBalance: string;
    crossUnPnl: string;
    availableBalance: string;
    maxWithdrawAmount: string;
    marginAvailable: boolean;
    updateTime: number;
}
export declare const AsterAccountBalanceSchema: z.ZodObject<{
    accountAlias: z.ZodString;
    asset: z.ZodString;
    balance: z.ZodString;
    crossWalletBalance: z.ZodString;
    crossUnPnl: z.ZodString;
    availableBalance: z.ZodString;
    maxWithdrawAmount: z.ZodString;
    marginAvailable: z.ZodBoolean;
    updateTime: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    accountAlias: z.ZodString;
    asset: z.ZodString;
    balance: z.ZodString;
    crossWalletBalance: z.ZodString;
    crossUnPnl: z.ZodString;
    availableBalance: z.ZodString;
    maxWithdrawAmount: z.ZodString;
    marginAvailable: z.ZodBoolean;
    updateTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    accountAlias: z.ZodString;
    asset: z.ZodString;
    balance: z.ZodString;
    crossWalletBalance: z.ZodString;
    crossUnPnl: z.ZodString;
    availableBalance: z.ZodString;
    maxWithdrawAmount: z.ZodString;
    marginAvailable: z.ZodBoolean;
    updateTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map