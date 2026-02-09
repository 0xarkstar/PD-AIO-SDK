/**
 * Aster Exchange-Specific Types
 */
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
export interface AsterOrderBookResponse {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
    T: number;
}
export interface AsterTradeResponse {
    id: number;
    price: string;
    qty: string;
    quoteQty: string;
    time: number;
    isBuyerMaker: boolean;
}
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
//# sourceMappingURL=types.d.ts.map