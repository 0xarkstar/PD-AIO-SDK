/**
 * Ostium Exchange-Specific Types
 */

import type { ExchangeConfig } from '../../types/adapter.js';

export interface OstiumConfig extends ExchangeConfig {
  /** Arbitrum RPC URL */
  rpcUrl?: string;
  /** EVM private key for signing transactions */
  privateKey?: string;
  /** Subgraph URL */
  subgraphUrl?: string;
  /** Metadata API URL */
  metadataUrl?: string;
}

// --- Market Types ---

export interface OstiumPairInfo {
  pairIndex: number;
  name: string;
  from: string;
  to: string;
  groupIndex: number;
  groupName: string;
  spreadP: string;
  maxLeverage: number;
  minLeverage: number;
  maxPositionSize: string;
  minPositionSize: string;
  feedId: string;
}

export interface OstiumPriceResponse {
  pair: string;
  price: string;
  timestamp: number;
  source: string;
}

// --- Contract Types ---

export interface OstiumTradeParams {
  pairIndex: number;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: number;
  tp: string;
  sl: string;
  referral: string;
}

export interface OstiumOpenTrade {
  trader: string;
  pairIndex: number;
  index: number;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: number;
  tp: string;
  sl: string;
  timestamp: number;
}

// --- Subgraph Types ---

export interface OstiumSubgraphTrade {
  id: string;
  trader: string;
  pairIndex: string;
  action: string;
  price: string;
  size: string;
  buy: boolean;
  leverage: string;
  pnl: string;
  timestamp: string;
  txHash: string;
}

export interface OstiumSubgraphPosition {
  id: string;
  trader: string;
  pairIndex: string;
  index: string;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: string;
  tp: string;
  sl: string;
  timestamp: string;
}

// --- Contract ABI Fragment Types ---

export interface OstiumContractAddresses {
  trading: string;
  storage: string;
  pairInfo: string;
  nftRewards: string;
  vault: string;
  collateral: string;
}
