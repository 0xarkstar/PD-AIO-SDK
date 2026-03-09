/**
 * Reya Utility Functions
 */

import type { OrderRequest } from '../../types/common.js';
import type { ReyaCreateOrderRequest } from './types.js';
import { REYA_EXCHANGE_ID } from './constants.js';
import { unifiedToReya } from './constants.js';

/**
 * Convert SDK order request to Reya API format
 */
export function buildOrderRequest(
  request: OrderRequest,
  accountId: number,
  exchangeId: number,
  signature: string,
  nonce: string,
  signerWallet: string
): ReyaCreateOrderRequest {
  const reyaSymbol = unifiedToReya(request.symbol);
  const isBuy = request.side === 'buy';

  // Determine order type
  let orderType: 'LIMIT' | 'TP' | 'SL' = 'LIMIT';
  const typeStr = request.type as string;
  if (typeStr === 'stopMarket' || typeStr === 'stopLimit') {
    orderType = 'SL';
  } else if (
    typeStr === 'takeProfit' ||
    typeStr === 'takeProfitMarket' ||
    typeStr === 'takeProfitLimit'
  ) {
    orderType = 'TP';
  }

  // Determine time in force
  let timeInForce: 'IOC' | 'GTC' = 'GTC';
  if (request.type === 'market') {
    timeInForce = 'IOC';
  } else if (request.postOnly) {
    timeInForce = 'GTC';
  }

  // For market orders, use a very high/low limit price to simulate market
  let limitPx: string;
  if (request.type === 'market') {
    limitPx = isBuy ? '999999999' : '0.000001';
  } else {
    limitPx = request.price?.toString() ?? '0';
  }

  const orderReq: ReyaCreateOrderRequest = {
    exchangeId: exchangeId ?? REYA_EXCHANGE_ID,
    symbol: reyaSymbol,
    accountId,
    isBuy,
    limitPx,
    qty: request.amount.toString(),
    orderType,
    timeInForce,
    reduceOnly: request.reduceOnly,
    signature,
    nonce,
    signerWallet,
  };

  if (request.stopPrice) {
    orderReq.triggerPx = request.stopPrice.toString();
  }

  if (request.clientOrderId) {
    orderReq.clientOrderId = parseInt(request.clientOrderId, 10);
  }

  return orderReq;
}

/**
 * Map Reya order status to unified status
 */
export function mapOrderStatus(
  reyaStatus: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED'
): 'open' | 'closed' | 'canceled' | 'rejected' | 'filled' {
  switch (reyaStatus) {
    case 'OPEN':
      return 'open';
    case 'FILLED':
      return 'filled';
    case 'CANCELLED':
      return 'canceled';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'open';
  }
}

/**
 * Parse Reya symbol to extract base and quote
 * @example "BTCRUSDPERP" -> { base: "BTC", quote: "USD" }
 */
export function parseReyaSymbol(symbol: string): { base: string; quote: string } {
  const perpIdx = symbol.indexOf('PERP');
  const marketPart = perpIdx !== -1 ? symbol.slice(0, perpIdx) : symbol;

  const rIdx = marketPart.indexOf('RUSD');
  if (rIdx !== -1) {
    return { base: marketPart.slice(0, rIdx), quote: 'USD' };
  }

  return { base: marketPart, quote: 'USD' };
}

/**
 * Map OHLCV timeframe to Reya candle resolution
 */
export function mapTimeframeToResolution(
  timeframe: string
): '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' {
  const mapping: Record<string, '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };

  return mapping[timeframe] ?? '1h';
}
