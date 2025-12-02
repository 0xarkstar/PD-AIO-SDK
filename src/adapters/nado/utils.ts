/**
 * Nado Utility Functions
 *
 * Helper functions for symbol conversion, data normalization,
 * and EIP712 signing for Nado adapter.
 *
 * @see https://docs.nado.xyz
 */

import { ethers } from 'ethers';
import type {
  NadoProduct,
  NadoOrder,
  NadoPosition,
  NadoBalance,
  NadoTrade,
  NadoTicker,
  NadoOrderBook,
  NadoEIP712Order,
  NadoEIP712Cancellation,
  NadoEIP712StreamAuth,
  ProductMapping,
} from './types.js';
import type { Market, Order, Position, Balance, Trade, Ticker, OrderBook } from '../../types/common.js';
import { NADO_EIP712_DOMAIN, NADO_ORDER_SIDES } from './constants.js';

/**
 * Convert product ID to verifying contract address
 * Used for EIP712 order signing
 *
 * @param productId - Nado product ID
 * @returns Verifying contract address (0x-prefixed hex)
 */
export function productIdToVerifyingContract(productId: number): string {
  const bytes = Buffer.alloc(20);
  bytes.writeBigUInt64BE(BigInt(productId), 12); // Write to last 8 bytes
  return '0x' + bytes.toString('hex');
}

/**
 * Convert Nado symbol to CCXT format
 * Example: "BTC-PERP" → "BTC/USDT:USDT"
 *
 * @param nadoSymbol - Nado symbol
 * @param quoteAsset - Quote asset (default: USDT)
 * @returns CCXT formatted symbol
 */
export function nadoSymbolToCCXT(nadoSymbol: string, quoteAsset: string = 'USDT'): string {
  // Handle perpetual format: BTC-PERP, ETH-PERP
  if (nadoSymbol.endsWith('-PERP')) {
    const base = nadoSymbol.replace('-PERP', '');
    return `${base}/${quoteAsset}:${quoteAsset}`;
  }

  // Handle spot format: BTC-USDT
  if (nadoSymbol.includes('-')) {
    const [base, quote] = nadoSymbol.split('-');
    return `${base}/${quote}`;
  }

  // Fallback: assume perpetual
  return `${nadoSymbol}/${quoteAsset}:${quoteAsset}`;
}

/**
 * Convert CCXT symbol to Nado format
 * Example: "BTC/USDT:USDT" → "BTC-PERP"
 *
 * @param ccxtSymbol - CCXT formatted symbol
 * @returns Nado symbol
 */
export function ccxtSymbolToNado(ccxtSymbol: string): string {
  // Handle perpetual: BTC/USDT:USDT → BTC-PERP
  if (ccxtSymbol.includes(':')) {
    const base = ccxtSymbol.split('/')[0];
    return `${base}-PERP`;
  }

  // Handle spot: BTC/USDT → BTC-USDT
  const [base, quote] = ccxtSymbol.split('/');
  return `${base}-${quote}`;
}

/**
 * Normalize Nado product to unified Market format
 */
export function normalizeNadoProduct(product: NadoProduct): Market {
  const symbol = nadoSymbolToCCXT(product.symbol, product.quote_currency);
  const isPerpetual = product.product_type === 'perpetual';

  return {
    id: product.product_id.toString(),
    symbol,
    base: product.base_currency,
    quote: product.quote_currency,
    settle: product.quote_currency,
    active: product.is_active,
    minAmount: parseFloat(product.min_size),
    maxAmount: product.max_position_size ? parseFloat(product.max_position_size) : undefined,
    pricePrecision: 8,
    amountPrecision: 8,
    priceTickSize: parseFloat(product.tick_size),
    amountStepSize: parseFloat(product.min_size),
    makerFee: parseFloat(product.maker_fee),
    takerFee: parseFloat(product.taker_fee),
    maxLeverage: 50,
    fundingIntervalHours: 8,
  };
}

/**
 * Normalize Nado order to unified Order format
 */
export function normalizeNadoOrder(
  order: NadoOrder,
  productMapping: ProductMapping
): Order {
  const symbol = productMapping.ccxtSymbol;
  const price = parseFloat(ethers.formatUnits(order.price_x18, 18));
  const amount = parseFloat(ethers.formatUnits(order.amount, 18));
  const filled = parseFloat(ethers.formatUnits(order.filled_amount, 18));
  const remaining = parseFloat(ethers.formatUnits(order.remaining_amount, 18));

  return {
    id: order.order_id,
    clientOrderId: order.digest,
    timestamp: order.timestamp,
    lastUpdateTimestamp: undefined,
    symbol,
    type: price > 0 ? 'limit' : 'market',
    timeInForce: order.time_in_force?.toUpperCase() as 'GTC' | 'IOC' | 'FOK',
    postOnly: order.post_only || false,
    reduceOnly: order.is_reduce_only || false,
    side: order.side === NADO_ORDER_SIDES.BUY ? 'buy' : 'sell',
    price,
    amount,
    remaining,
    filled,
    status: order.status === 'open'
      ? 'open'
      : order.status === 'filled'
      ? 'closed'
      : order.status === 'cancelled'
      ? 'canceled'
      : order.status === 'expired'
      ? 'expired'
      : 'rejected',
    info: order as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Nado position to unified Position format
 */
export function normalizeNadoPosition(
  position: NadoPosition,
  productMapping: ProductMapping
): Position | null {
  const size = parseFloat(ethers.formatUnits(position.size, 18));
  const entryPrice = parseFloat(ethers.formatUnits(position.entry_price, 18));
  const markPrice = parseFloat(ethers.formatUnits(position.mark_price, 18));
  const unrealizedPnl = parseFloat(ethers.formatUnits(position.unrealized_pnl, 18));
  const realizedPnl = parseFloat(ethers.formatUnits(position.realized_pnl, 18));
  const margin = parseFloat(ethers.formatUnits(position.margin, 18));

  // Skip positions with zero size
  if (size === 0) {
    return null;
  }

  const side: 'long' | 'short' = size > 0 ? 'long' : 'short';

  return {
    symbol: productMapping.ccxtSymbol,
    side,
    size: Math.abs(size),
    unrealizedPnl,
    realizedPnl,
    leverage: parseFloat(position.leverage),
    marginMode: 'cross',
    margin,
    maintenanceMargin: margin * 0.05,
    marginRatio: margin > 0 ? (margin / (Math.abs(size) * markPrice)) : 0,
    markPrice,
    entryPrice,
    liquidationPrice: position.liquidation_price
      ? parseFloat(ethers.formatUnits(position.liquidation_price, 18))
      : 0,
    timestamp: position.timestamp,
    info: position as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Nado balance to unified Balance format
 */
export function normalizeNadoBalance(balance: NadoBalance): Balance[] {
  const free = parseFloat(ethers.formatUnits(balance.free_margin, 18));
  const used = parseFloat(ethers.formatUnits(balance.used_margin, 18));
  const total = parseFloat(ethers.formatUnits(balance.total_equity, 18));

  return [
    {
      currency: 'USDT', // Nado uses USDT as main collateral
      free,
      used,
      total,
      info: balance as unknown as Record<string, unknown>,
    },
  ];
}

/**
 * Normalize Nado trade to unified Trade format
 */
export function normalizeNadoTrade(
  trade: NadoTrade,
  productMapping: ProductMapping
): Trade {
  const price = parseFloat(ethers.formatUnits(trade.price, 18));
  const amount = parseFloat(ethers.formatUnits(trade.size, 18));

  return {
    id: trade.trade_id,
    orderId: undefined,
    timestamp: trade.timestamp,
    symbol: productMapping.ccxtSymbol,
    side: trade.side === NADO_ORDER_SIDES.BUY ? 'buy' : 'sell',
    price,
    amount,
    cost: price * amount,
    info: trade as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Nado ticker to unified Ticker format
 */
export function normalizeNadoTicker(ticker: NadoTicker): Ticker {
  const last = parseFloat(ethers.formatUnits(ticker.last_price, 18));
  const high = parseFloat(ethers.formatUnits(ticker.high_24h, 18));
  const low = parseFloat(ethers.formatUnits(ticker.low_24h, 18));
  const volume = parseFloat(ethers.formatUnits(ticker.volume_24h, 18));
  const markPrice = parseFloat(ethers.formatUnits(ticker.mark_price, 18));
  const indexPrice = parseFloat(ethers.formatUnits(ticker.index_price, 18));

  return {
    symbol: nadoSymbolToCCXT(ticker.symbol),
    timestamp: ticker.timestamp,
    high,
    low,
    bid: 0,
    bidVolume: 0,
    ask: 0,
    askVolume: 0,
    open: 0,
    close: last,
    last,
    change: 0,
    percentage: 0,
    baseVolume: volume,
    quoteVolume: 0,
    info: {
      ...ticker,
      markPrice,
      indexPrice,
      fundingRate: ticker.funding_rate,
      nextFundingTime: ticker.next_funding_time,
      openInterest: ticker.open_interest,
    } as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Nado order book to unified OrderBook format
 */
export function normalizeNadoOrderBook(orderBook: NadoOrderBook, symbol: string): OrderBook {
  return {
    symbol,
    bids: orderBook.bids.map(([price, size]) => [
      parseFloat(ethers.formatUnits(price, 18)),
      parseFloat(ethers.formatUnits(size, 18)),
    ]),
    asks: orderBook.asks.map(([price, size]) => [
      parseFloat(ethers.formatUnits(price, 18)),
      parseFloat(ethers.formatUnits(size, 18)),
    ]),
    timestamp: orderBook.timestamp,
    exchange: 'nado',
  };
}

/**
 * Create EIP712 domain for Nado
 */
export function createNadoEIP712Domain(chainId: number, verifyingContract: string) {
  return {
    name: NADO_EIP712_DOMAIN.name,
    version: NADO_EIP712_DOMAIN.version,
    chainId,
    verifyingContract,
  };
}

/**
 * EIP712 type definitions for Order
 */
export const NADO_EIP712_ORDER_TYPES = {
  Order: [
    { name: 'sender', type: 'address' },
    { name: 'priceX18', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'expiration', type: 'uint64' },
    { name: 'nonce', type: 'uint64' },
    { name: 'appendix', type: 'OrderAppendix' },
  ],
  OrderAppendix: [
    { name: 'productId', type: 'uint32' },
    { name: 'side', type: 'uint8' },
    { name: 'reduceOnly', type: 'bool' },
    { name: 'postOnly', type: 'bool' },
  ],
};

/**
 * EIP712 type definitions for Cancellation
 */
export const NADO_EIP712_CANCELLATION_TYPES = {
  Cancellation: [
    { name: 'sender', type: 'address' },
    { name: 'productIds', type: 'uint32[]' },
    { name: 'digests', type: 'bytes32[]' },
    { name: 'nonce', type: 'uint64' },
  ],
};

/**
 * EIP712 type definitions for Stream Authentication
 */
export const NADO_EIP712_STREAM_AUTH_TYPES = {
  StreamAuthentication: [
    { name: 'sender', type: 'address' },
    { name: 'expiration', type: 'uint64' },
  ],
};

/**
 * Sign EIP712 order for Nado
 */
export async function signNadoOrder(
  wallet: ethers.Wallet,
  order: NadoEIP712Order,
  chainId: number,
  productId: number
): Promise<string> {
  const verifyingContract = productIdToVerifyingContract(productId);
  const domain = createNadoEIP712Domain(chainId, verifyingContract);

  return wallet.signTypedData(domain, NADO_EIP712_ORDER_TYPES, order);
}

/**
 * Sign EIP712 cancellation for Nado
 */
export async function signNadoCancellation(
  wallet: ethers.Wallet,
  cancellation: NadoEIP712Cancellation,
  chainId: number,
  endpointAddress: string
): Promise<string> {
  const domain = createNadoEIP712Domain(chainId, endpointAddress);

  return wallet.signTypedData(domain, NADO_EIP712_CANCELLATION_TYPES, cancellation);
}

/**
 * Sign EIP712 stream authentication for Nado
 */
export async function signNadoStreamAuth(
  wallet: ethers.Wallet,
  streamAuth: NadoEIP712StreamAuth,
  chainId: number,
  endpointAddress: string
): Promise<string> {
  const domain = createNadoEIP712Domain(chainId, endpointAddress);

  return wallet.signTypedData(domain, NADO_EIP712_STREAM_AUTH_TYPES, streamAuth);
}

/**
 * Convert amount to x18 format (Nado uses 18 decimals)
 */
export function toX18(value: number | string): string {
  return ethers.parseUnits(value.toString(), 18).toString();
}

/**
 * Convert from x18 format to number
 */
export function fromX18(value: string): number {
  return parseFloat(ethers.formatUnits(value, 18));
}
