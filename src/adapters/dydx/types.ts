/**
 * dYdX v4 Exchange-Specific Types
 *
 * Type definitions for dYdX v4 Indexer API responses and WebSocket messages
 */

// =============================================================================
// Market Types
// =============================================================================

export interface DydxPerpetualMarket {
  /** Market ticker (e.g., "BTC-USD") */
  ticker: string;
  /** Market status */
  status: 'ACTIVE' | 'PAUSED' | 'CANCEL_ONLY' | 'POST_ONLY' | 'INITIALIZING' | 'FINAL_SETTLEMENT';
  /** Base asset */
  baseAsset: string;
  /** Quote asset (USD) */
  quoteAsset: string;
  /** Oracle price */
  oraclePrice: string;
  /** Price change over 24h */
  priceChange24H: string;
  /** 24h trading volume */
  volume24H: string;
  /** Number of trades in 24h */
  trades24H: number;
  /** Open interest */
  openInterest: string;
  /** Open interest in USD */
  openInterestUSDC: string;
  /** Next funding rate */
  nextFundingRate: string;
  /** Next funding at timestamp */
  nextFundingAt: string;
  /** Initial margin fraction */
  initialMarginFraction: string;
  /** Maintenance margin fraction */
  maintenanceMarginFraction: string;
  /** Step size for order amounts */
  stepSize: string;
  /** Step base quantums */
  stepBaseQuantums: number;
  /** Subticks per tick */
  subticksPerTick: number;
  /** Tick size for prices */
  tickSize: string;
  /** Atomic resolution */
  atomicResolution: number;
  /** Quantum conversion exponent */
  quantumConversionExponent: number;
  /** Base position notional */
  basePositionNotional?: string;
}

export interface DydxPerpetualMarketsResponse {
  markets: Record<string, DydxPerpetualMarket>;
}

// =============================================================================
// Order Book Types
// =============================================================================

export interface DydxOrderBookLevel {
  price: string;
  size: string;
}

export interface DydxOrderBookResponse {
  bids: DydxOrderBookLevel[];
  asks: DydxOrderBookLevel[];
}

// =============================================================================
// Trade Types
// =============================================================================

export interface DydxTrade {
  id: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
  createdAt: string;
  createdAtHeight: string;
}

export interface DydxTradesResponse {
  trades: DydxTrade[];
}

// =============================================================================
// Order Types
// =============================================================================

export interface DydxOrder {
  id: string;
  subaccountId: string;
  clientId: string;
  clobPairId: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  totalFilled: string;
  goodTilBlock?: string;
  goodTilBlockTime?: string;
  status: 'OPEN' | 'FILLED' | 'CANCELED' | 'BEST_EFFORT_CANCELED' | 'UNTRIGGERED' | 'PENDING';
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
  timeInForce: 'GTT' | 'FOK' | 'IOC';
  postOnly: boolean;
  reduceOnly: boolean;
  ticker: string;
  orderFlags: string;
  triggerPrice?: string;
  createdAtHeight?: string;
  updatedAt?: string;
  updatedAtHeight?: string;
  clientMetadata: string;
  removalReason?: string;
}

export interface DydxOrdersResponse {
  orders?: DydxOrder[];
}

export interface DydxFill {
  id: string;
  side: 'BUY' | 'SELL';
  liquidity: 'TAKER' | 'MAKER';
  type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
  market: string;
  marketType: 'PERPETUAL';
  price: string;
  size: string;
  fee: string;
  createdAt: string;
  createdAtHeight: string;
  orderId?: string;
  clientMetadata?: string;
  subaccountNumber: number;
}

export interface DydxFillsResponse {
  fills: DydxFill[];
}

// =============================================================================
// Position Types
// =============================================================================

export interface DydxPerpetualPosition {
  market: string;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  side: 'LONG' | 'SHORT';
  size: string;
  maxSize: string;
  entryPrice: string;
  exitPrice?: string;
  realizedPnl: string;
  unrealizedPnl: string;
  createdAt: string;
  createdAtHeight: string;
  closedAt?: string;
  sumOpen: string;
  sumClose: string;
  netFunding: string;
  subaccountNumber: number;
}

export interface DydxAssetPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: string;
  assetId: string;
  subaccountNumber: number;
}

// =============================================================================
// Subaccount Types
// =============================================================================

export interface DydxSubaccount {
  address: string;
  subaccountNumber: number;
  equity: string;
  freeCollateral: string;
  pendingDeposits: string;
  pendingWithdrawals: string;
  marginEnabled: boolean;
  updatedAtHeight: string;
  latestProcessedBlockHeight: string;
  openPerpetualPositions: Record<string, DydxPerpetualPosition>;
  assetPositions: Record<string, DydxAssetPosition>;
}

export interface DydxSubaccountResponse {
  subaccount: DydxSubaccount;
}

export interface DydxSubaccountsResponse {
  subaccounts: DydxSubaccount[];
}

// =============================================================================
// Funding Types
// =============================================================================

export interface DydxHistoricalFunding {
  ticker: string;
  rate: string;
  price: string;
  effectiveAt: string;
  effectiveAtHeight: string;
}

export interface DydxHistoricalFundingResponse {
  historicalFunding: DydxHistoricalFunding[];
}

// =============================================================================
// Candles (OHLCV) Types
// =============================================================================

export interface DydxCandle {
  startedAt: string;
  ticker: string;
  resolution: string;
  low: string;
  high: string;
  open: string;
  close: string;
  baseTokenVolume: string;
  usdVolume: string;
  trades: number;
  startingOpenInterest: string;
}

export interface DydxCandlesResponse {
  candles: DydxCandle[];
}

// =============================================================================
// Sparklines Types
// =============================================================================

export interface DydxSparklineResponse {
  [ticker: string]: string[];
}

// =============================================================================
// WebSocket Types
// =============================================================================

export interface DydxWsSubscription {
  type: 'subscribe' | 'unsubscribe';
  channel: string;
  id?: string;
  batched?: boolean;
}

export interface DydxWsMessage {
  type: 'connected' | 'subscribed' | 'unsubscribed' | 'channel_data' | 'channel_batch_data' | 'error';
  connection_id?: string;
  message_id?: number;
  channel?: string;
  id?: string;
  contents?: unknown;
  version?: string;
}

export interface DydxWsMarketsContent {
  trading: Record<string, DydxPerpetualMarket>;
}

export interface DydxWsTradesContent {
  trades: DydxTrade[];
}

export interface DydxWsOrderBookContent {
  bids: DydxOrderBookLevel[];
  asks: DydxOrderBookLevel[];
}

export interface DydxWsOrderBookUpdateContent {
  bids?: DydxOrderBookLevel[];
  asks?: DydxOrderBookLevel[];
}

export interface DydxWsSubaccountContent {
  subaccount?: DydxSubaccount;
  orders?: DydxOrder[];
  fills?: DydxFill[];
  perpetualPositions?: DydxPerpetualPosition[];
  assetPositions?: DydxAssetPosition[];
  tradingReward?: {
    tradingReward: string;
    createdAt: string;
    createdAtHeight: string;
  };
}

export interface DydxWsCandleContent {
  candle: DydxCandle;
}

// =============================================================================
// Order Placement Types (for sending orders)
// =============================================================================

export interface DydxPlaceOrderParams {
  subaccountNumber: number;
  marketId: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
  timeInForce: 'GTT' | 'FOK' | 'IOC';
  price: string;
  size: string;
  postOnly?: boolean;
  reduceOnly?: boolean;
  triggerPrice?: string;
  clientId?: number;
  goodTilTimeInSeconds?: number;
  goodTilBlock?: number;
  execution?: 'DEFAULT' | 'POST_ONLY' | 'FOK' | 'IOC';
}

export interface DydxCancelOrderParams {
  subaccountNumber: number;
  orderId: string;
  orderFlags: string;
  clobPairId: number;
  goodTilBlock?: number;
  goodTilBlockTime?: number;
}

// =============================================================================
// Height/Block Types
// =============================================================================

export interface DydxHeightResponse {
  height: string;
  time: string;
}

// =============================================================================
// Transfer Types
// =============================================================================

export interface DydxTransfer {
  id: string;
  sender: {
    address: string;
    subaccountNumber?: number;
  };
  recipient: {
    address: string;
    subaccountNumber?: number;
  };
  size: string;
  createdAt: string;
  createdAtHeight: string;
  symbol: string;
  type: 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEPOSIT' | 'WITHDRAWAL';
  transactionHash?: string;
}

export interface DydxTransfersResponse {
  transfers: DydxTransfer[];
}

// =============================================================================
// PnL Types
// =============================================================================

export interface DydxHistoricalPnl {
  id: string;
  subaccountId: string;
  equity: string;
  totalPnl: string;
  netTransfers: string;
  createdAt: string;
  blockHeight: string;
  blockTime: string;
}

export interface DydxHistoricalPnlResponse {
  historicalPnl: DydxHistoricalPnl[];
}
