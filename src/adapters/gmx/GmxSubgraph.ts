/**
 * GMX v2 Subgraph Client
 *
 * GraphQL client for querying GMX v2 positions, orders, and trades from the subgraph.
 */

import { GMX_API_URLS, GMX_PRECISION, getMarketByAddress } from './constants.js';
import type { GmxChain } from './GmxAdapter.js';
import type { GmxPosition, GmxOrder } from './types.js';

// =============================================================================
// GraphQL Queries
// =============================================================================

const POSITIONS_QUERY = `
  query GetPositions($account: String!) {
    positions(
      where: { account: $account }
      orderBy: increasedAtBlock
      orderDirection: desc
    ) {
      id
      account
      market
      collateralToken
      sizeInUsd
      sizeInTokens
      collateralAmount
      borrowingFactor
      fundingFeeAmountPerSize
      longTokenClaimableFundingAmountPerSize
      shortTokenClaimableFundingAmountPerSize
      increasedAtBlock
      decreasedAtBlock
      isLong
    }
  }
`;

const ORDERS_QUERY = `
  query GetOrders($account: String!, $status: String) {
    orders(
      where: {
        account: $account
        status: $status
      }
      orderBy: updatedAtBlock
      orderDirection: desc
      first: 100
    ) {
      key
      account
      receiver
      callbackContract
      uiFeeReceiver
      market
      initialCollateralToken
      swapPath
      orderType
      decreasePositionSwapType
      sizeDeltaUsd
      initialCollateralDeltaAmount
      triggerPrice
      acceptablePrice
      executionFee
      callbackGasLimit
      minOutputAmount
      updatedAtBlock
      isLong
      isFrozen
      status
      createdTxn
      cancelledTxn
      executedTxn
    }
  }
`;

const ORDER_HISTORY_QUERY = `
  query GetOrderHistory($account: String!, $since: BigInt) {
    orders(
      where: {
        account: $account
        updatedAtBlock_gte: $since
      }
      orderBy: updatedAtBlock
      orderDirection: desc
      first: 100
    ) {
      key
      account
      receiver
      callbackContract
      uiFeeReceiver
      market
      initialCollateralToken
      swapPath
      orderType
      decreasePositionSwapType
      sizeDeltaUsd
      initialCollateralDeltaAmount
      triggerPrice
      acceptablePrice
      executionFee
      callbackGasLimit
      minOutputAmount
      updatedAtBlock
      isLong
      isFrozen
      status
      createdTxn
      cancelledTxn
      executedTxn
    }
  }
`;

const TRADES_QUERY = `
  query GetTrades($account: String!, $since: BigInt, $limit: Int) {
    tradeActions(
      where: {
        account: $account
        timestamp_gte: $since
      }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
    ) {
      id
      account
      marketAddress
      collateralTokenAddress
      sizeDeltaUsd
      collateralDeltaAmount
      orderType
      isLong
      executionPrice
      priceImpactUsd
      pnlUsd
      timestamp
      transactionHash
    }
  }
`;

const MARKET_TRADES_QUERY = `
  query GetMarketTrades($market: String!, $since: BigInt, $limit: Int) {
    tradeActions(
      where: {
        marketAddress: $market
        timestamp_gte: $since
      }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
    ) {
      id
      account
      marketAddress
      collateralTokenAddress
      sizeDeltaUsd
      collateralDeltaAmount
      orderType
      isLong
      executionPrice
      priceImpactUsd
      pnlUsd
      timestamp
      transactionHash
    }
  }
`;

// =============================================================================
// Subgraph Client
// =============================================================================

/**
 * GraphQL client for GMX v2 subgraph queries
 */
export class GmxSubgraph {
  private readonly subgraphUrl: string;

  constructor(chain: GmxChain) {
    this.subgraphUrl = GMX_API_URLS[chain].subgraph;
  }

  // ==========================================================================
  // Position Queries
  // ==========================================================================

  /**
   * Fetch all positions for an account
   */
  async fetchPositions(account: string): Promise<GmxPosition[]> {
    const response = await this.query<{ positions: GmxPosition[] }>(POSITIONS_QUERY, {
      account: account.toLowerCase(),
    });

    return response.positions.filter(
      (p) =>
        // Filter out closed positions (size = 0)
        parseFloat(p.sizeInUsd) > 0
    );
  }

  // ==========================================================================
  // Order Queries
  // ==========================================================================

  /**
   * Fetch open orders for an account
   */
  async fetchOpenOrders(account: string): Promise<GmxOrder[]> {
    const response = await this.query<{ orders: GmxOrder[] }>(ORDERS_QUERY, {
      account: account.toLowerCase(),
      status: 'Created',
    });

    return response.orders;
  }

  /**
   * Fetch all orders (including filled/cancelled) for an account
   */
  async fetchOrderHistory(account: string, since?: number): Promise<GmxOrder[]> {
    const sinceBlock = since ? Math.floor(since / 1000) : 0;

    const response = await this.query<{ orders: GmxOrder[] }>(ORDER_HISTORY_QUERY, {
      account: account.toLowerCase(),
      since: sinceBlock.toString(),
    });

    return response.orders;
  }

  // ==========================================================================
  // Trade Queries
  // ==========================================================================

  /**
   * Fetch trades for an account
   */
  async fetchAccountTrades(
    account: string,
    since?: number,
    limit = 50
  ): Promise<SubgraphTradeAction[]> {
    const sinceTimestamp = since ? Math.floor(since / 1000) : 0;

    const response = await this.query<{ tradeActions: SubgraphTradeAction[] }>(TRADES_QUERY, {
      account: account.toLowerCase(),
      since: sinceTimestamp.toString(),
      limit,
    });

    return response.tradeActions;
  }

  /**
   * Fetch trades for a specific market
   */
  async fetchMarketTrades(
    marketAddress: string,
    since?: number,
    limit = 50
  ): Promise<SubgraphTradeAction[]> {
    const sinceTimestamp = since ? Math.floor(since / 1000) : 0;

    const response = await this.query<{ tradeActions: SubgraphTradeAction[] }>(
      MARKET_TRADES_QUERY,
      {
        market: marketAddress.toLowerCase(),
        since: sinceTimestamp.toString(),
        limit,
      }
    );

    return response.tradeActions;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Execute a GraphQL query
   */
  private async query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors && json.errors.length > 0) {
      throw new Error(`Subgraph query error: ${json.errors[0]?.message || 'Unknown error'}`);
    }

    if (!json.data) {
      throw new Error('No data returned from subgraph');
    }

    return json.data;
  }

  /**
   * Convert subgraph position to normalized format
   */
  normalizePosition(position: GmxPosition, markPrice: number): NormalizedGmxPosition {
    const sizeUsd = parseFloat(position.sizeInUsd) / GMX_PRECISION.USD;
    const sizeInTokens = parseFloat(position.sizeInTokens);
    const collateralAmount = parseFloat(position.collateralAmount);

    // Calculate entry price from size
    const entryPrice = sizeInTokens > 0 ? sizeUsd / sizeInTokens : 0;

    // Calculate unrealized PnL
    const priceDiff = position.isLong ? markPrice - entryPrice : entryPrice - markPrice;
    const unrealizedPnl = sizeInTokens * priceDiff;
    const unrealizedPnlPercent =
      collateralAmount > 0 ? (unrealizedPnl / collateralAmount) * 100 : 0;

    // Get market config
    const marketConfig = getMarketByAddress(position.market);

    return {
      symbol: marketConfig?.symbol || position.market,
      marketAddress: position.market,
      side: position.isLong ? 'long' : 'short',
      size: sizeInTokens,
      sizeUsd,
      collateral: collateralAmount,
      collateralToken: position.collateralToken,
      entryPrice,
      markPrice,
      unrealizedPnl,
      unrealizedPnlPercent,
      leverage: collateralAmount > 0 ? sizeUsd / collateralAmount : 0,
      isLong: position.isLong,
    };
  }

  /**
   * Convert subgraph order to normalized format
   */
  normalizeOrder(order: GmxOrder): NormalizedGmxOrder {
    const sizeDeltaUsd = parseFloat(order.sizeDeltaUsd) / GMX_PRECISION.USD;
    const triggerPrice = parseFloat(order.triggerPrice) / GMX_PRECISION.PRICE;
    const acceptablePrice = parseFloat(order.acceptablePrice) / GMX_PRECISION.PRICE;

    // Get market config
    const marketConfig = getMarketByAddress(order.market);

    // Map order type
    const orderTypeMap: Record<number, 'market' | 'limit' | 'stopMarket' | 'stopLimit'> = {
      0: 'market', // MarketIncrease
      1: 'market', // MarketDecrease
      2: 'limit', // LimitIncrease
      3: 'limit', // LimitDecrease
      4: 'stopMarket', // StopLossDecrease
      5: 'market', // Liquidation
    };

    // Map status
    const statusMap: Record<string, 'open' | 'filled' | 'cancelled' | 'expired'> = {
      Created: 'open',
      Executed: 'filled',
      Cancelled: 'cancelled',
      Frozen: 'open',
      Expired: 'expired',
    };

    // Determine side based on order type and position direction
    // For increase orders: buy = going long, sell = going short
    // For decrease orders: buy = closing short, sell = closing long
    const isIncrease = order.orderType === 0 || order.orderType === 2;
    const side = isIncrease ? (order.isLong ? 'buy' : 'sell') : order.isLong ? 'sell' : 'buy';

    return {
      id: order.key,
      symbol: marketConfig?.symbol || order.market,
      marketAddress: order.market,
      type: orderTypeMap[order.orderType] || 'limit',
      side,
      isLong: order.isLong,
      amount: sizeDeltaUsd,
      price: triggerPrice || acceptablePrice,
      triggerPrice: triggerPrice > 0 ? triggerPrice : undefined,
      status: statusMap[order.status] || 'open',
      createdTxn: order.createdTxn,
      executedTxn: order.executedTxn,
      cancelledTxn: order.cancelledTxn,
    };
  }

  /**
   * Convert subgraph trade to normalized format
   */
  normalizeTrade(trade: SubgraphTradeAction): NormalizedGmxTrade {
    const sizeDeltaUsd = parseFloat(trade.sizeDeltaUsd) / GMX_PRECISION.USD;
    const executionPrice = parseFloat(trade.executionPrice) / GMX_PRECISION.PRICE;
    const pnlUsd = parseFloat(trade.pnlUsd || '0') / GMX_PRECISION.USD;
    const priceImpactUsd = parseFloat(trade.priceImpactUsd || '0') / GMX_PRECISION.USD;

    // Get market config
    const marketConfig = getMarketByAddress(trade.marketAddress);

    // Determine side
    const isIncrease = trade.orderType === 0 || trade.orderType === 2;
    const side = isIncrease ? (trade.isLong ? 'buy' : 'sell') : trade.isLong ? 'sell' : 'buy';

    return {
      id: trade.id,
      symbol: marketConfig?.symbol || trade.marketAddress,
      marketAddress: trade.marketAddress,
      side,
      isLong: trade.isLong,
      amount: executionPrice > 0 ? sizeDeltaUsd / executionPrice : 0,
      price: executionPrice,
      cost: sizeDeltaUsd,
      pnl: pnlUsd,
      priceImpact: priceImpactUsd,
      timestamp: parseInt(trade.timestamp) * 1000,
      transactionHash: trade.transactionHash,
    };
  }
}

// =============================================================================
// Type Definitions
// =============================================================================

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
