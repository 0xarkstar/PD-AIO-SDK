/**
 * Hyperliquid Exchange-Specific Types
 */

// =============================================================================
// API Response Types
// =============================================================================

export interface HyperliquidMeta {
  universe: HyperliquidAsset[];
}

export interface HyperliquidAsset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

export interface HyperliquidOrderResponse {
  status: 'ok' | 'err';
  response: {
    type: 'order';
    data: {
      statuses: HyperliquidOrderStatus[];
    };
  };
}

export type HyperliquidOrderStatus =
  | { resting: { oid: number } }
  | { filled: { totalSz: string; avgPx: string; oid: number } }
  | { error: string };

export interface HyperliquidOpenOrder {
  coin: string;
  side: 'B' | 'A';
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  origSz: string;
  cloid?: string;
}

export interface HyperliquidUserState {
  assetPositions: HyperliquidPosition[];
  crossMarginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalMarginUsed: string;
  };
  withdrawable: string;
}

export interface HyperliquidPosition {
  position: {
    coin: string;
    entryPx: string;
    leverage: {
      type: 'cross' | 'isolated';
      value: number;
    };
    liquidationPx: string | null;
    marginUsed: string;
    positionValue: string;
    returnOnEquity: string;
    szi: string;
    unrealizedPnl: string;
  };
  type: 'oneWay';
}

/**
 * Hyperliquid L2 orderbook level entry
 * Each level has price (px), size (sz), and number of orders (n)
 */
export interface HyperliquidL2Level {
  px: string;
  sz: string;
  n: number;
}

/**
 * Hyperliquid L2 orderbook response
 * levels[0] = bids, levels[1] = asks
 */
export interface HyperliquidL2Book {
  coin: string;
  levels: [HyperliquidL2Level[], HyperliquidL2Level[]];
  time: number;
}

/**
 * Hyperliquid allMids REST API response
 * REST API returns: { "BTC": "82789.5", "ETH": "2720.8", ... }
 */
export type HyperliquidAllMids = Record<string, string>;

/**
 * Hyperliquid allMids WebSocket message
 * WebSocket returns: { mids: { "BTC": "82789.5", ... } }
 */
export interface HyperliquidAllMidsWsMessage {
  mids: Record<string, string>;
}

export interface HyperliquidFundingRate {
  coin: string;
  fundingRate: string;
  premium: string;
  time: number;
}

// =============================================================================
// WebSocket Message Types
// =============================================================================

export interface HyperliquidWsSubscription {
  method: 'subscribe' | 'unsubscribe';
  subscription: {
    type: 'l2Book' | 'trades' | 'allMids' | 'user' | 'userEvents' | 'userFills';
    coin?: string;
    user?: string;
  };
}

export interface HyperliquidWsMessage {
  channel: string;
  data: unknown;
}

export interface HyperliquidWsL2BookUpdate {
  coin: string;
  levels: [HyperliquidL2Level[], HyperliquidL2Level[]];
  time: number;
}

export interface HyperliquidWsTrade {
  coin: string;
  side: 'B' | 'A';
  px: string;
  sz: string;
  time: number;
  hash: string;
}

export interface HyperliquidWsUserEvent {
  user: string;
  fills?: HyperliquidFill[];
  liquidations?: unknown[];
}

export interface HyperliquidFill {
  coin: string;
  px: string;
  sz: string;
  side: 'B' | 'A';
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
}

export interface HyperliquidHistoricalOrder {
  order: {
    coin: string;
    side: 'B' | 'A';
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    origSz: string;
    cloid?: string;
    orderType?: string;
  };
  status: 'filled' | 'canceled' | 'open' | 'rejected';
  statusTimestamp: number;
}

export interface HyperliquidUserFill {
  coin: string;
  px: string;
  sz: string;
  side: 'B' | 'A';
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
}

// =============================================================================
// Request Types
// =============================================================================

export interface HyperliquidOrderRequest {
  coin: string;
  is_buy: boolean;
  sz: number;
  limit_px: number;
  order_type: { limit: { tif: 'Gtc' | 'Ioc' | 'Alo' } } | { market: Record<string, never> };
  reduce_only: boolean;
  cloid?: string;
}

export interface HyperliquidCancelRequest {
  coin: string;
  oid: number;
}

export interface HyperliquidAction {
  type: 'order' | 'cancel' | 'cancelByCloid' | 'batchModify';
  orders?: HyperliquidOrderRequest[];
  cancels?: HyperliquidCancelRequest[];
  grouping?: 'na';
  builder?: { b: string; f: number };
}

export interface HyperliquidSignedAction {
  action: HyperliquidAction;
  nonce: number;
  signature: {
    r: string;
    s: string;
    v: number;
  };
  vaultAddress?: string;
}

export interface HyperliquidUserFees {
  userCrossRate: string; // Taker fee
  userAddRate: string; // Maker fee
  userSpotCrossRate: string;
  userSpotAddRate: string;
  activeReferralDiscount: string;
  dailyUserVlm: Array<{
    date: string;
    userCross: string;
    userAdd: string;
    exchange: string;
  }>;
  feeSchedule: {
    cross: string;
    add: string;
    spotCross: string;
    spotAdd: string;
    tiers: Array<{
      tier: number;
      vlm: string;
      crossRate: string;
      addRate: string;
    }>;
  };
}

export type PortfolioPeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'allTime'
  | 'perpDay'
  | 'perpWeek'
  | 'perpMonth'
  | 'perpAllTime';

export interface HyperliquidPortfolioPeriodData {
  accountValueHistory: Array<[number, string]>;
  pnlHistory: Array<[number, string]>;
  vlm: string;
}

export type HyperliquidPortfolio = Array<[PortfolioPeriod, HyperliquidPortfolioPeriodData]>;

export interface HyperliquidUserRateLimit {
  cumVlm: string;
  nRequestsUsed: number;
  nRequestsCap: number;
  nRequestsSurplus?: number;
}
