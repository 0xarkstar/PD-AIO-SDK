/**
 * Variational Exchange Types
 *
 * TypeScript types and Zod schemas for Variational API responses
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const VariationalMarketSchema = z.object({
    symbol: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    status: z.enum(['active', 'inactive', 'delisted']),
    minOrderSize: z.string(),
    maxOrderSize: z.string().optional(),
    tickSize: z.string(),
    contractSize: z.string().optional(),
    maxLeverage: z.string().optional(),
    fundingInterval: z.number().optional(),
    settlementTime: z.number().optional(),
});
export const VariationalTickerSchema = z.object({
    symbol: z.string(),
    lastPrice: z.string(),
    bidPrice: z.string(),
    askPrice: z.string(),
    volume24h: z.string(),
    high24h: z.string(),
    low24h: z.string(),
    priceChange24h: z.string(),
    priceChangePercent24h: z.string(),
    timestamp: z.number(),
});
export const VariationalOrderBookSchema = z.object({
    symbol: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
    sequence: z.number().optional(),
});
export const VariationalTradeSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    price: z.string(),
    amount: z.string(),
    side: z.enum(['buy', 'sell']),
    timestamp: z.number(),
    isMaker: z.boolean().optional(),
});
export const VariationalQuoteSchema = z.object({
    quoteId: z.string(),
    symbol: z.string(),
    side: z.enum(['buy', 'sell']),
    price: z.string(),
    amount: z.string(),
    expiresAt: z.number(),
    marketMaker: z.string(),
    spread: z.string().optional(),
    timestamp: z.number(),
});
export const VariationalOrderSchema = z.object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    type: z.enum(['market', 'limit', 'rfq']),
    side: z.enum(['buy', 'sell']),
    status: z.enum(['pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected', 'expired']),
    price: z.string().optional(),
    amount: z.string(),
    filledAmount: z.string().optional(),
    remainingAmount: z.string().optional(),
    averagePrice: z.string().optional(),
    timestamp: z.number(),
    updateTime: z.number().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    quoteId: z.string().optional(),
    fees: z.object({
        asset: z.string(),
        amount: z.string(),
    }).optional(),
});
export const VariationalPositionSchema = z.object({
    symbol: z.string(),
    side: z.enum(['long', 'short']),
    size: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    liquidationPrice: z.string().optional(),
    margin: z.string(),
    leverage: z.string(),
    unrealizedPnl: z.string(),
    realizedPnl: z.string().optional(),
    timestamp: z.number(),
});
export const VariationalBalanceSchema = z.object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
    total: z.string(),
    availableMargin: z.string().optional(),
    usedMargin: z.string().optional(),
    timestamp: z.number().optional(),
});
//# sourceMappingURL=types.js.map