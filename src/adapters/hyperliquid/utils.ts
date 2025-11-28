/**
 * Hyperliquid Utility Functions
 */

import {
  ExchangeUnavailableError,
  InsufficientMarginError,
  InvalidOrderError,
  InvalidSignatureError,
  OrderNotFoundError,
  PerpDEXError,
  PositionNotFoundError,
  RateLimitError,
} from '../../types/errors.js';
import type {
  Balance,
  FundingRate,
  Market,
  Order,
  OrderBook,
  OrderRequest,
  Position,
  Ticker,
  Trade,
} from '../../types/index.js';
import {
  HYPERLIQUID_DEFAULT_PRECISION,
  HYPERLIQUID_ERROR_MESSAGES,
  HYPERLIQUID_FUNDING_INTERVAL_HOURS,
  hyperliquidToUnified,
} from './constants.js';
import type {
  HyperliquidAsset,
  HyperliquidFill,
  HyperliquidFundingRate,
  HyperliquidL2Book,
  HyperliquidOpenOrder,
  HyperliquidOrderRequest,
  HyperliquidPosition,
  HyperliquidUserState,
  HyperliquidWsTrade,
} from './types.js';

// =============================================================================
// Order Normalization
// =============================================================================

/**
 * Normalize Hyperliquid open order to unified format
 */
export function normalizeOrder(order: HyperliquidOpenOrder, symbol: string): Order {
  const unifiedSymbol = hyperliquidToUnified(order.coin);
  const isBuy = order.side === 'B';

  return {
    id: order.oid.toString(),
    symbol: unifiedSymbol,
    type: 'limit', // Hyperliquid open orders are always limit orders
    side: isBuy ? 'buy' : 'sell',
    amount: parseFloat(order.origSz),
    price: parseFloat(order.limitPx),
    status: 'open',
    filled: parseFloat(order.origSz) - parseFloat(order.sz),
    remaining: parseFloat(order.sz),
    reduceOnly: false,
    postOnly: false,
    clientOrderId: order.cloid,
    timestamp: order.timestamp,
  };
}

/**
 * Convert unified order request to Hyperliquid format
 */
export function convertOrderRequest(
  request: OrderRequest,
  exchangeSymbol: string
): HyperliquidOrderRequest {
  const isBuy = request.side === 'buy';

  // Determine order type
  let orderType: HyperliquidOrderRequest['order_type'];

  if (request.type === 'market') {
    orderType = { market: {} };
  } else {
    // Default to GTC for limit orders
    let tif: 'Gtc' | 'Ioc' | 'Alo' = 'Gtc';

    if (request.timeInForce === 'IOC') {
      tif = 'Ioc';
    } else if (request.postOnly) {
      tif = 'Alo'; // Post-only = Add Liquidity Only
    }

    orderType = { limit: { tif } };
  }

  return {
    coin: exchangeSymbol,
    is_buy: isBuy,
    sz: request.amount,
    limit_px: request.price ?? 0,
    order_type: orderType,
    reduce_only: request.reduceOnly ?? false,
    cloid: request.clientOrderId,
  };
}

// =============================================================================
// Position Normalization
// =============================================================================

/**
 * Normalize Hyperliquid position to unified format
 */
export function normalizePosition(hlPosition: HyperliquidPosition): Position {
  const pos = hlPosition.position;
  const unifiedSymbol = hyperliquidToUnified(pos.coin);
  const size = Math.abs(parseFloat(pos.szi));
  const isLong = parseFloat(pos.szi) > 0;

  return {
    symbol: unifiedSymbol,
    side: isLong ? 'long' : 'short',
    size,
    entryPrice: parseFloat(pos.entryPx),
    markPrice: 0, // Need to fetch separately
    liquidationPrice: pos.liquidationPx ? parseFloat(pos.liquidationPx) : 0,
    unrealizedPnl: parseFloat(pos.unrealizedPnl),
    realizedPnl: 0, // Not provided in position data
    leverage: pos.leverage.value,
    marginMode: pos.leverage.type,
    margin: parseFloat(pos.marginUsed),
    maintenanceMargin: 0, // Not directly provided
    marginRatio: 0, // Calculate if needed
    timestamp: Date.now(),
  };
}

// =============================================================================
// Market Normalization
// =============================================================================

/**
 * Normalize Hyperliquid asset to unified market format
 */
export function normalizeMarket(asset: HyperliquidAsset, index: number): Market {
  const unifiedSymbol = hyperliquidToUnified(asset.name);
  const [base = "", rest = ""] = unifiedSymbol.split("/");
  const [quote = "", settle = ""] = rest.split(":");

  return {
    id: index.toString(),
    symbol: unifiedSymbol,
    base,
    quote,
    settle,
    active: true,
    minAmount: Math.pow(10, -asset.szDecimals),
    pricePrecision: HYPERLIQUID_DEFAULT_PRECISION.price,
    amountPrecision: asset.szDecimals,
    priceTickSize: Math.pow(10, -HYPERLIQUID_DEFAULT_PRECISION.price),
    amountStepSize: Math.pow(10, -asset.szDecimals),
    makerFee: 0.0002, // 0.02%
    takerFee: 0.0005, // 0.05%
    maxLeverage: asset.maxLeverage,
    fundingIntervalHours: HYPERLIQUID_FUNDING_INTERVAL_HOURS,
  };
}

// =============================================================================
// Order Book Normalization
// =============================================================================

/**
 * Normalize Hyperliquid L2 book to unified format
 */
export function normalizeOrderBook(book: HyperliquidL2Book): OrderBook {
  const unifiedSymbol = hyperliquidToUnified(book.coin);

  return {
    symbol: unifiedSymbol,
    timestamp: book.time,
    bids: book.levels[0]?.map((level) => [parseFloat(level[0]), parseFloat(level[1])]) ?? [],
    asks: book.levels[1]?.map((level) => [parseFloat(level[0]), parseFloat(level[1])]) ?? [],
    exchange: 'hyperliquid',
  };
}

// =============================================================================
// Trade Normalization
// =============================================================================

/**
 * Normalize Hyperliquid trade to unified format
 */
export function normalizeTrade(trade: HyperliquidWsTrade): Trade {
  const unifiedSymbol = hyperliquidToUnified(trade.coin);
  const isBuy = trade.side === 'B';
  const price = parseFloat(trade.px);
  const amount = parseFloat(trade.sz);

  return {
    id: trade.hash,
    symbol: unifiedSymbol,
    side: isBuy ? 'buy' : 'sell',
    price,
    amount,
    cost: price * amount,
    timestamp: trade.time,
  };
}

/**
 * Normalize Hyperliquid fill to unified trade format
 */
export function normalizeFill(fill: HyperliquidFill): Trade {
  const unifiedSymbol = hyperliquidToUnified(fill.coin);
  const isBuy = fill.side === 'B';
  const price = parseFloat(fill.px);
  const amount = parseFloat(fill.sz);

  return {
    id: fill.hash,
    symbol: unifiedSymbol,
    orderId: fill.oid.toString(),
    side: isBuy ? 'buy' : 'sell',
    price,
    amount,
    cost: price * amount,
    timestamp: fill.time,
    info: {
      fee: fill.fee,
      closedPnl: fill.closedPnl,
      tid: fill.tid,
    },
  };
}

// =============================================================================
// Funding Rate Normalization
// =============================================================================

/**
 * Normalize Hyperliquid funding rate to unified format
 */
export function normalizeFundingRate(
  fundingData: HyperliquidFundingRate,
  markPrice: number
): FundingRate {
  const unifiedSymbol = hyperliquidToUnified(fundingData.coin);

  return {
    symbol: unifiedSymbol,
    fundingRate: parseFloat(fundingData.fundingRate),
    fundingTimestamp: fundingData.time,
    nextFundingTimestamp: fundingData.time + HYPERLIQUID_FUNDING_INTERVAL_HOURS * 3600 * 1000,
    markPrice,
    indexPrice: markPrice, // Hyperliquid doesn't separate index price
    fundingIntervalHours: HYPERLIQUID_FUNDING_INTERVAL_HOURS,
  };
}

// =============================================================================
// Balance Normalization
// =============================================================================

/**
 * Normalize Hyperliquid user state to unified balance format
 */
export function normalizeBalance(userState: HyperliquidUserState): Balance[] {
  const accountValue = parseFloat(userState.marginSummary.accountValue);
  const totalMarginUsed = parseFloat(userState.marginSummary.totalMarginUsed);
  const withdrawable = parseFloat(userState.withdrawable);

  return [
    {
      currency: 'USDT',
      total: accountValue,
      free: withdrawable,
      used: totalMarginUsed,
      usdValue: accountValue,
    },
  ];
}

// =============================================================================
// Ticker Normalization (placeholder - needs implementation)
// =============================================================================

/**
 * Normalize ticker data
 */
export function normalizeTicker(
  coin: string,
  data: { mid: string; [key: string]: unknown }
): Ticker {
  const unifiedSymbol = hyperliquidToUnified(coin);
  const mid = parseFloat(data.mid);

  return {
    symbol: unifiedSymbol,
    last: mid,
    bid: mid,
    ask: mid,
    high: mid,
    low: mid,
    open: mid,
    close: mid,
    change: 0,
    percentage: 0,
    baseVolume: 0,
    quoteVolume: 0,
    timestamp: Date.now(),
  };
}

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Map Hyperliquid errors to unified error types
 */
export function mapError(error: unknown): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check known error patterns
    for (const [pattern, code] of Object.entries(HYPERLIQUID_ERROR_MESSAGES)) {
      if (message.includes(pattern)) {
        switch (code) {
          case 'INSUFFICIENT_MARGIN':
            return new InsufficientMarginError(error.message, code, 'hyperliquid', error);
          case 'INVALID_SIGNATURE':
            return new InvalidSignatureError(error.message, code, 'hyperliquid', error);
          case 'ORDER_WOULD_MATCH':
            return new InvalidOrderError(error.message, code, 'hyperliquid', error);
          case 'POSITION_NOT_FOUND':
            return new PositionNotFoundError(error.message, code, 'hyperliquid', error);
          case 'ORDER_NOT_FOUND':
            return new OrderNotFoundError(error.message, code, 'hyperliquid', error);
          case 'RATE_LIMIT_EXCEEDED':
            return new RateLimitError(error.message, code, 'hyperliquid', undefined, error);
        }
      }
    }

    // HTTP status code errors
    if (message.includes('429')) {
      return new RateLimitError('Rate limit exceeded', 'RATE_LIMIT', 'hyperliquid', undefined, error);
    }

    if (message.includes('503') || message.includes('502')) {
      return new ExchangeUnavailableError(
        'Exchange temporarily unavailable',
        'EXCHANGE_DOWN',
        'hyperliquid',
        error
      );
    }
  }

  // Default to generic exchange error
  return new ExchangeUnavailableError(
    'Unknown exchange error',
    'UNKNOWN_ERROR',
    'hyperliquid',
    error
  );
}
