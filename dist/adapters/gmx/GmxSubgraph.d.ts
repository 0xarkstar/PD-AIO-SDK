/**
 * GMX v2 Subgraph Client
 *
 * GraphQL client for querying GMX v2 positions, orders, and trades from the subgraph.
 */
import type { GmxChain } from './GmxAdapter.js';
import type { GmxPosition, GmxOrder } from './types.js';
/**
 * GraphQL client for GMX v2 subgraph queries
 */
export declare class GmxSubgraph {
    private readonly subgraphUrl;
    private readonly chain;
    constructor(chain: GmxChain);
    /**
     * Fetch all positions for an account
     */
    fetchPositions(account: string): Promise<GmxPosition[]>;
    /**
     * Fetch open orders for an account
     */
    fetchOpenOrders(account: string): Promise<GmxOrder[]>;
    /**
     * Fetch all orders (including filled/cancelled) for an account
     */
    fetchOrderHistory(account: string, since?: number): Promise<GmxOrder[]>;
    /**
     * Fetch trades for an account
     */
    fetchAccountTrades(account: string, since?: number, limit?: number): Promise<SubgraphTradeAction[]>;
    /**
     * Fetch trades for a specific market
     */
    fetchMarketTrades(marketAddress: string, since?: number, limit?: number): Promise<SubgraphTradeAction[]>;
    /**
     * Execute a GraphQL query
     */
    private query;
    /**
     * Convert subgraph position to normalized format
     */
    normalizePosition(position: GmxPosition, markPrice: number): NormalizedGmxPosition;
    /**
     * Convert subgraph order to normalized format
     */
    normalizeOrder(order: GmxOrder): NormalizedGmxOrder;
    /**
     * Convert subgraph trade to normalized format
     */
    normalizeTrade(trade: SubgraphTradeAction): NormalizedGmxTrade;
}
/**
 * Trade action from subgraph
 */
interface SubgraphTradeAction {
    id: string;
    account: string;
    marketAddress: string;
    collateralTokenAddress: string;
    sizeDeltaUsd: string;
    collateralDeltaAmount: string;
    orderType: number;
    isLong: boolean;
    executionPrice: string;
    priceImpactUsd: string;
    pnlUsd?: string;
    timestamp: string;
    transactionHash: string;
}
/**
 * Normalized position data
 */
export interface NormalizedGmxPosition {
    symbol: string;
    marketAddress: string;
    side: 'long' | 'short';
    size: number;
    sizeUsd: number;
    collateral: number;
    collateralToken: string;
    entryPrice: number;
    markPrice: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    leverage: number;
    isLong: boolean;
}
/**
 * Normalized order data
 */
export interface NormalizedGmxOrder {
    id: string;
    symbol: string;
    marketAddress: string;
    type: 'market' | 'limit' | 'stopMarket' | 'stopLimit';
    side: 'buy' | 'sell';
    isLong: boolean;
    amount: number;
    price: number;
    triggerPrice?: number;
    status: 'open' | 'filled' | 'cancelled' | 'expired';
    createdTxn?: string;
    executedTxn?: string;
    cancelledTxn?: string;
}
/**
 * Normalized trade data
 */
export interface NormalizedGmxTrade {
    id: string;
    symbol: string;
    marketAddress: string;
    side: 'buy' | 'sell';
    isLong: boolean;
    amount: number;
    price: number;
    cost: number;
    pnl: number;
    priceImpact: number;
    timestamp: number;
    transactionHash: string;
}
export {};
//# sourceMappingURL=GmxSubgraph.d.ts.map