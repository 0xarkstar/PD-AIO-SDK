/**
 * EdgeX-specific type definitions
 */
import { z } from 'zod';
export const EdgeXMarketSchema = z
    .object({
    market_id: z.string(),
    symbol: z.string(),
    base_asset: z.string(),
    quote_asset: z.string(),
    settlement_asset: z.string(),
    status: z.string(),
    min_order_size: z.string(),
    max_order_size: z.string(),
    tick_size: z.string(),
    step_size: z.string(),
    maker_fee: z.string(),
    taker_fee: z.string(),
    max_leverage: z.string(),
    is_active: z.boolean(),
})
    .passthrough();
export const EdgeXOrderSchema = z
    .object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    market: z.string(),
    side: z.string(),
    type: z.string(),
    size: z.string(),
    price: z.union([z.string(), z.null()]).optional(),
    filled_size: z.string(),
    average_price: z.union([z.string(), z.null()]).optional(),
    status: z.string(),
    time_in_force: z.string(),
    post_only: z.boolean(),
    reduce_only: z.boolean(),
    created_at: z.number(),
    updated_at: z.number(),
})
    .passthrough();
export const EdgeXPositionSchema = z
    .object({
    market: z.string(),
    side: z.string(),
    size: z.string(),
    entry_price: z.string(),
    mark_price: z.string(),
    liquidation_price: z.union([z.string(), z.null()]).optional(),
    unrealized_pnl: z.string(),
    realized_pnl: z.string(),
    margin: z.string(),
    leverage: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const EdgeXBalanceSchema = z
    .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
})
    .passthrough();
export const EdgeXOrderBookSchema = z
    .object({
    market: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
})
    .passthrough();
export const EdgeXTradeSchema = z
    .object({
    trade_id: z.string(),
    market: z.string(),
    side: z.string(),
    price: z.string(),
    size: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const EdgeXTickerSchema = z
    .object({
    market: z.string(),
    last_price: z.string(),
    bid: z.string(),
    ask: z.string(),
    high_24h: z.string(),
    low_24h: z.string(),
    volume_24h: z.string(),
    price_change_24h: z.string(),
    price_change_percent_24h: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const EdgeXFundingRateSchema = z
    .object({
    market: z.string(),
    rate: z.string(),
    timestamp: z.number(),
    next_funding_time: z.number(),
    mark_price: z.string(),
    index_price: z.string(),
})
    .passthrough();
export const EdgeXAPIContractSchema = z
    .object({
    contractId: z.string(),
    contractName: z.string(),
    enableTrade: z.boolean().optional(),
    minOrderSize: z.string().optional(),
    tickSize: z.string().optional(),
    stepSize: z.string().optional(),
    defaultMakerFeeRate: z.string().optional(),
    defaultTakerFeeRate: z.string().optional(),
    riskTierList: z
        .array(z
        .object({
        maxLeverage: z.string().optional(),
    })
        .passthrough())
        .optional(),
})
    .passthrough();
export const EdgeXDepthDataSchema = z
    .object({
    bids: z
        .array(z
        .object({
        price: z.string(),
        size: z.string(),
    })
        .passthrough()),
    asks: z
        .array(z
        .object({
        price: z.string(),
        size: z.string(),
    })
        .passthrough()),
})
    .passthrough();
export const EdgeXAPITickerSchema = z
    .object({
    contractName: z.string().optional(),
    lastPrice: z.string().optional(),
    close: z.string().optional(),
    open: z.string().optional(),
    high: z.string().optional(),
    low: z.string().optional(),
    priceChange: z.string().optional(),
    priceChangePercent: z.string().optional(),
    size: z.string().optional(),
    volume: z.string().optional(),
    value: z.string().optional(),
    endTime: z.string().optional(),
})
    .passthrough();
export const EdgeXAPIFundingDataSchema = z
    .object({
    fundingRate: z.string().optional(),
    fundingTime: z.coerce.string().optional(),
    fundingTimestamp: z.coerce.string().optional(),
    markPrice: z.string().optional(),
    indexPrice: z.string().optional(),
    nextFundingTime: z.coerce.string().optional(),
})
    .passthrough();
//# sourceMappingURL=types.js.map