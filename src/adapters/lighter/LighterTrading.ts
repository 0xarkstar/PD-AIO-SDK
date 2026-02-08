/**
 * Lighter Trading Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains WASM and HMAC order creation, cancellation, and collateral management.
 */

import type { Order, OrderRequest } from '../../types/common.js';
import { PerpDEXError, InvalidOrderError } from '../../types/errors.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
import type { LighterWasmSigner } from './signer/index.js';
import type { NonceManager } from './NonceManager.js';
import type { LighterOrder } from './types.js';
import { mapError } from './utils.js';
import {
  toBaseUnits,
  toPriceUnits,
  mapOrderType,
  mapTimeInForce,
  convertOrderRequest,
} from './LighterOrderUtils.js';

/** Market metadata required for order building */
export interface MarketMetadata {
  baseDecimals: number;
  quoteDecimals: number;
  tickSize: number;
  stepSize: number;
}

/** Dependencies injected from the adapter */
export interface TradingDeps {
  normalizer: LighterNormalizer;
  signer: LighterWasmSigner | null;
  nonceManager: NonceManager | null;
  apiKey?: string;
  apiSecret?: string;
  marketIdCache: Map<string, number>;
  marketMetadataCache: Map<string, MarketMetadata>;
  fetchMarkets: () => Promise<unknown>;
  request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) => Promise<T>;
  handleTransactionError: (code: number) => Promise<void>;
}

/**
 * Create order using WASM signing
 */
export async function createOrderWasm(
  deps: TradingDeps,
  request: OrderRequest
): Promise<Order> {
  const lighterSymbol = deps.normalizer.toLighterSymbol(request.symbol);

  // Ensure market metadata is loaded
  let marketId = deps.marketIdCache.get(lighterSymbol);
  if (marketId === undefined) {
    await deps.fetchMarkets();
    marketId = deps.marketIdCache.get(lighterSymbol);
    if (marketId === undefined) {
      throw new InvalidOrderError(`Market not found: ${request.symbol}`, 'INVALID_SYMBOL', 'lighter');
    }
  }

  const metadata = deps.marketMetadataCache.get(lighterSymbol);
  if (!metadata) {
    throw new InvalidOrderError(`Market metadata not found: ${request.symbol}`, 'INVALID_SYMBOL', 'lighter');
  }

  // Get nonce
  const nonce = await deps.nonceManager!.getNextNonce();

  try {
    // Convert to base units
    const baseAmount = toBaseUnits(request.amount, metadata.baseDecimals);
    const price = toPriceUnits(request.price || 0, metadata.tickSize);

    // Map order type
    const orderType = mapOrderType(request.type);
    const timeInForce = mapTimeInForce(request.timeInForce, request.postOnly);

    // Sign the order
    const signedTx = await deps.signer!.signCreateOrder({
      marketIndex: marketId,
      clientOrderIndex: BigInt(request.clientOrderId || Date.now()),
      baseAmount,
      price,
      isAsk: request.side === 'sell',
      orderType,
      timeInForce,
      reduceOnly: request.reduceOnly ?? false,
      triggerPrice: request.stopPrice ? toPriceUnits(request.stopPrice, metadata.tickSize) : 0,
      orderExpiry: BigInt(0), // No expiry
      nonce,
    });

    // Send the transaction
    const response = await deps.request<{ code: number; order: any }>('POST', '/api/v1/sendTx', {
      tx_type: signedTx.txType,
      tx_info: signedTx.txInfo,
    });

    if (response.code !== 0) {
      // Check for nonce errors and auto-resync
      await deps.handleTransactionError(response.code);
      throw new InvalidOrderError(`Order creation failed: code ${response.code}`, 'ORDER_REJECTED', 'lighter');
    }

    return deps.normalizer.normalizeOrder(response.order);
  } catch (error) {
    // Rollback nonce on pre-submission errors (signing failed, etc.)
    const errorMsg = error instanceof Error ? error.message : '';
    if (!errorMsg.includes('code')) {
      deps.nonceManager!.rollback();
    }
    throw mapError(error);
  }
}

/**
 * Create order using HMAC signing (legacy)
 */
export async function createOrderHMAC(
  deps: TradingDeps,
  request: OrderRequest
): Promise<Order> {
  const lighterSymbol = deps.normalizer.toLighterSymbol(request.symbol);
  const orderRequest = convertOrderRequest(request, lighterSymbol);

  const response = await deps.request<LighterOrder>('POST', '/orders', orderRequest);

  return deps.normalizer.normalizeOrder(response);
}

/**
 * Cancel order using WASM signing
 */
export async function cancelOrderWasm(
  deps: TradingDeps,
  orderId: string,
  symbol?: string
): Promise<Order> {
  // Get market index
  let marketIndex = 0;
  if (symbol) {
    const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);
    const cached = deps.marketIdCache.get(lighterSymbol);
    if (cached === undefined) {
      await deps.fetchMarkets();
      marketIndex = deps.marketIdCache.get(lighterSymbol) ?? 0;
    } else {
      marketIndex = cached;
    }
  }

  const nonce = await deps.nonceManager!.getNextNonce();

  try {
    const signedTx = await deps.signer!.signCancelOrder({
      marketIndex,
      orderId: BigInt(orderId),
      nonce,
    });

    const response = await deps.request<{ code: number; order: any }>('POST', '/api/v1/sendTx', {
      tx_type: signedTx.txType,
      tx_info: signedTx.txInfo,
    });

    if (response.code !== 0) {
      await deps.handleTransactionError(response.code);
      throw new InvalidOrderError(`Cancel failed: code ${response.code}`, 'CANCEL_REJECTED', 'lighter');
    }

    return deps.normalizer.normalizeOrder(response.order);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '';
    if (!errorMsg.includes('code')) {
      deps.nonceManager!.rollback();
    }
    throw mapError(error);
  }
}

/**
 * Cancel order using HMAC signing (legacy)
 */
export async function cancelOrderHMAC(
  deps: TradingDeps,
  orderId: string
): Promise<Order> {
  const response = await deps.request<LighterOrder>('DELETE', `/orders/${orderId}`);
  return deps.normalizer.normalizeOrder(response);
}

/**
 * Cancel all orders using WASM signing
 */
export async function cancelAllOrdersWasm(
  deps: TradingDeps,
  symbol?: string
): Promise<Order[]> {
  // Get market index (-1 for all markets)
  let marketIndex = -1;
  if (symbol) {
    const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);
    const cached = deps.marketIdCache.get(lighterSymbol);
    if (cached !== undefined) {
      marketIndex = cached;
    } else {
      await deps.fetchMarkets();
      marketIndex = deps.marketIdCache.get(lighterSymbol) ?? -1;
    }
  }

  const nonce = await deps.nonceManager!.getNextNonce();

  try {
    const signedTx = await deps.signer!.signCancelAllOrders({
      marketIndex: marketIndex >= 0 ? marketIndex : undefined,
      nonce,
    });

    const response = await deps.request<{ code: number; orders: any[] }>('POST', '/api/v1/sendTx', {
      tx_type: signedTx.txType,
      tx_info: signedTx.txInfo,
    });

    if (response.code !== 0) {
      await deps.handleTransactionError(response.code);
      throw new InvalidOrderError(`Cancel all failed: code ${response.code}`, 'CANCEL_REJECTED', 'lighter');
    }

    return (response.orders || []).map((order: any) => deps.normalizer.normalizeOrder(order));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '';
    if (!errorMsg.includes('code')) {
      deps.nonceManager!.rollback();
    }
    throw mapError(error);
  }
}

/**
 * Cancel all orders using HMAC signing (legacy)
 */
export async function cancelAllOrdersHMAC(
  deps: TradingDeps,
  symbol?: string
): Promise<Order[]> {
  const path = symbol ? `/orders?symbol=${deps.normalizer.toLighterSymbol(symbol)}` : '/orders';
  const response = await deps.request<LighterOrder[]>('DELETE', path);

  if (!Array.isArray(response)) {
    return [];
  }

  return response.map((order: any) => deps.normalizer.normalizeOrder(order));
}

/**
 * Withdraw collateral from trading account
 *
 * Requires WASM signing - HMAC mode does not support withdrawals.
 */
export async function withdrawCollateral(
  deps: TradingDeps,
  collateralIndex: number,
  amount: bigint,
  destinationAddress: string
): Promise<string> {
  if (!deps.signer?.isInitialized || !deps.nonceManager) {
    throw new PerpDEXError(
      'Withdrawals require WASM signing. Configure apiPrivateKey and install @oraichain/lighter-ts-sdk.',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  // Validate address format
  if (!destinationAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new InvalidOrderError(
      'Invalid destination address format',
      'INVALID_ADDRESS',
      'lighter'
    );
  }

  const nonce = await deps.nonceManager.getNextNonce();

  try {
    const signedTx = await deps.signer.signWithdrawCollateral({
      collateralIndex,
      amount,
      destinationAddress,
      nonce,
    });

    const response = await deps.request<{ code: number; tx_hash: string }>('POST', '/api/v1/sendTx', {
      tx_type: signedTx.txType,
      tx_info: signedTx.txInfo,
    });

    if (response.code !== 0) {
      // Check for nonce errors and resync
      await deps.handleTransactionError(response.code);
      throw new PerpDEXError(
        `Withdrawal failed: code ${response.code}`,
        'WITHDRAWAL_FAILED',
        'lighter'
      );
    }

    return response.tx_hash || signedTx.txHash;
  } catch (error) {
    deps.nonceManager.rollback();
    throw mapError(error);
  }
}
