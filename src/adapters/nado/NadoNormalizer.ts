/**
 * Nado Data Normalizer
 *
 * Transforms Nado API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.nado.xyz
 */

import { ethers } from 'ethers';
import type {
  NadoProduct,
  NadoSymbol,
  NadoOrder,
  NadoPosition,
  NadoBalance,
  NadoTrade,
  NadoTicker,
  NadoOrderBook,
  ProductMapping,
} from './types.js';
import type {
  Market,
  Order,
  Position,
  Balance,
  Trade,
  Ticker,
  OrderBook,
} from '../../types/common.js';
import {
  NadoProductSchema,
  NadoSymbolSchema,
  NadoOrderSchema,
  NadoPositionSchema,
  NadoBalanceSchema,
  NadoTradeSchema,
  NadoTickerSchema,
  NadoOrderBookSchema,
} from './types.js';
import { NADO_ORDER_SIDES } from './constants.js';
import { PerpDEXError } from '../../types/errors.js';

/**
 * Nado Data Normalizer
 *
 * Provides data transformation between Nado and unified formats with:
 * - Precision-safe numeric conversions
 * - Batch processing optimization
 * - Runtime validation with Zod
 * - Symbol format conversions
 *
 * @example
 * ```typescript
 * const normalizer = new NadoNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeProduct(nadoProduct);
 *
 * // Batch processing
 * const orders = normalizer.normalizeOrders(nadoOrders, mappings);
 * ```
 */
export class NadoNormalizer {
  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  /**
   * Convert Nado symbol to CCXT format
   *
   * @param nadoSymbol - Nado symbol (e.g., "BTC-PERP", "BTC-USDT")
   * @param quoteAsset - Quote asset (default: USDT)
   * @returns CCXT formatted symbol (e.g., "BTC/USDT:USDT")
   *
   * @example
   * ```typescript
   * normalizer.symbolToCCXT('BTC-PERP');        // "BTC/USDT:USDT"
   * normalizer.symbolToCCXT('ETH-PERP');        // "ETH/USDT:USDT"
   * normalizer.symbolToCCXT('BTC-USDC', 'USDC'); // "BTC/USDC"
   * ```
   */
  symbolToCCXT(nadoSymbol: string, quoteAsset: string = 'USDT'): string {
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
   *
   * @param ccxtSymbol - CCXT formatted symbol (e.g., "BTC/USDT:USDT")
   * @returns Nado symbol (e.g., "BTC-PERP")
   *
   * @example
   * ```typescript
   * normalizer.symbolFromCCXT('BTC/USDT:USDT'); // "BTC-PERP"
   * normalizer.symbolFromCCXT('ETH/USDT:USDT'); // "ETH-PERP"
   * normalizer.symbolFromCCXT('BTC/USDC');      // "BTC-USDC"
   * ```
   */
  symbolFromCCXT(ccxtSymbol: string): string {
    // Handle perpetual: BTC/USDT:USDT → BTC-PERP
    if (ccxtSymbol.includes(':')) {
      const base = ccxtSymbol.split('/')[0];
      return `${base}-PERP`;
    }

    // Handle spot: BTC/USDT → BTC-USDT
    const [base, quote] = ccxtSymbol.split('/');
    return `${base}-${quote}`;
  }

  // ===========================================================================
  // Precision-Safe Numeric Conversions
  // ===========================================================================

  /**
   * Convert number to x18 format (18 decimals) with validation
   *
   * @param value - Number or string to convert
   * @returns x18 formatted string
   *
   * @throws {PerpDEXError} If value is not finite
   */
  private toX18Safe(value: number | string): string {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new PerpDEXError(
        `Invalid number for x18 conversion: ${value}`,
        'INVALID_NUMBER',
        'nado'
      );
    }

    try {
      return ethers.parseUnits(value.toString(), 18).toString();
    } catch (error) {
      throw new PerpDEXError(
        `Failed to convert to x18: ${value}`,
        'CONVERSION_ERROR',
        'nado',
        error
      );
    }
  }

  /**
   * Convert from x18 format to number with precision safety
   *
   * @param value - x18 formatted string
   * @returns Parsed number
   *
   * @throws {PerpDEXError} If value is invalid or results in NaN
   */
  private fromX18Safe(value: string): number {
    try {
      const formatted = ethers.formatUnits(value, 18);
      const parsed = parseFloat(formatted);

      if (!Number.isFinite(parsed)) {
        throw new PerpDEXError(
          `Invalid x18 value resulted in non-finite number: ${value}`,
          'INVALID_NUMBER',
          'nado'
        );
      }

      // Warn on precision loss (values exceeding safe integer range)
      if (Math.abs(parsed) > Number.MAX_SAFE_INTEGER) {
        console.warn(`[Nado] Precision loss detected for value: ${value}`);
      }

      return parsed;
    } catch (error) {
      if (error instanceof PerpDEXError) {
        throw error;
      }
      throw new PerpDEXError(
        `Failed to convert from x18: ${value}`,
        'CONVERSION_ERROR',
        'nado',
        error
      );
    }
  }

  // ===========================================================================
  // Single Entity Normalization
  // ===========================================================================

  /**
   * Normalize Nado symbol (from /query?type=symbols) to unified Market format
   *
   * @param symbolData - Nado symbol data from symbols endpoint
   * @returns Normalized market
   */
  normalizeSymbol(symbolData: NadoSymbol): Market {
    // Validate with Zod
    const validated = NadoSymbolSchema.parse(symbolData);

    // Parse symbol to extract base/quote (e.g., "BTC-PERP" -> BTC, USDC)
    // Nado uses "-PERP" suffix for perpetuals, spot symbols are just the token name
    const isPerp = validated.type === 'perp';
    let base: string;
    let quote: string;

    if (isPerp && validated.symbol.endsWith('-PERP')) {
      base = validated.symbol.replace('-PERP', '');
      quote = 'USDC'; // Nado uses USDC as quote currency
    } else {
      // Spot tokens (e.g., "WETH", "KBTC", "USDC")
      base = validated.symbol;
      quote = 'USDC';
    }

    // Convert x18 values to normal decimals
    const priceIncrement = this.fromX18Safe(validated.price_increment_x18);
    const sizeIncrement = this.fromX18Safe(validated.size_increment);
    const minSize = this.fromX18Safe(validated.min_size);
    const makerFee = this.fromX18Safe(validated.maker_fee_rate_x18);
    const takerFee = this.fromX18Safe(validated.taker_fee_rate_x18);

    // Calculate precision from increment
    const pricePrecision = this.getPrecisionFromIncrement(priceIncrement);
    const amountPrecision = this.getPrecisionFromIncrement(sizeIncrement);

    // Build CCXT-style symbol
    const symbol = isPerp
      ? `${base}/${quote}:${quote}`
      : `${base}/${quote}`;

    return {
      id: validated.product_id.toString(),
      symbol,
      base,
      quote,
      settle: quote,
      active: true, // Nado doesn't have an is_active field in symbols
      minAmount: minSize,
      pricePrecision,
      amountPrecision,
      priceTickSize: priceIncrement,
      amountStepSize: sizeIncrement,
      makerFee,
      takerFee,
      maxLeverage: 50, // Nado typical max leverage
      fundingIntervalHours: 8,
    };
  }

  /**
   * Calculate decimal precision from increment value
   */
  private getPrecisionFromIncrement(increment: number): number {
    if (increment >= 1) return 0;
    const str = increment.toString();
    const decimalPart = str.split('.')[1];
    return decimalPart ? decimalPart.replace(/0+$/, '').length : 0;
  }

  /**
   * Normalize Nado product to unified Market format
   *
   * @deprecated Use normalizeSymbol instead
   * @param product - Nado product data
   * @returns Normalized market
   */
  normalizeProduct(product: NadoProduct): Market {
    // Validate with Zod
    const validated = NadoProductSchema.parse(product);

    const symbol = this.symbolToCCXT(validated.symbol, validated.quote_currency);

    return {
      id: validated.product_id.toString(),
      symbol,
      base: validated.base_currency,
      quote: validated.quote_currency,
      settle: validated.quote_currency,
      active: validated.is_active,
      minAmount: parseFloat(validated.min_size),
      maxAmount: validated.max_position_size
        ? parseFloat(validated.max_position_size)
        : undefined,
      pricePrecision: 8,
      amountPrecision: 8,
      priceTickSize: parseFloat(validated.tick_size),
      amountStepSize: parseFloat(validated.min_size),
      makerFee: parseFloat(validated.maker_fee),
      takerFee: parseFloat(validated.taker_fee),
      maxLeverage: 50, // Nado typical max leverage
      fundingIntervalHours: 8,
    };
  }

  /**
   * Normalize Nado order to unified Order format
   *
   * @param order - Nado order data
   * @param productMapping - Product mapping for symbol resolution
   * @returns Normalized order
   */
  normalizeOrder(order: NadoOrder, productMapping: ProductMapping): Order {
    // Validate with Zod
    const validated = NadoOrderSchema.parse(order);

    const price = this.fromX18Safe(validated.price_x18);
    const amount = this.fromX18Safe(validated.amount);
    const filled = this.fromX18Safe(validated.filled_amount);
    const remaining = this.fromX18Safe(validated.remaining_amount);

    return {
      id: validated.order_id,
      clientOrderId: validated.digest,
      timestamp: validated.timestamp,
      lastUpdateTimestamp: undefined,
      symbol: productMapping.ccxtSymbol,
      type: price > 0 ? 'limit' : 'market',
      timeInForce: validated.time_in_force?.toUpperCase() as 'GTC' | 'IOC' | 'FOK' | undefined,
      postOnly: validated.post_only || false,
      reduceOnly: validated.is_reduce_only || false,
      side: validated.side === NADO_ORDER_SIDES.BUY ? 'buy' : 'sell',
      price,
      amount,
      remaining,
      filled,
      status: this.mapOrderStatus(validated.status),
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Nado position to unified Position format
   *
   * @param position - Nado position data
   * @param productMapping - Product mapping for symbol resolution
   * @returns Normalized position or null if size is zero
   */
  normalizePosition(
    position: NadoPosition,
    productMapping: ProductMapping
  ): Position | null {
    // Validate with Zod
    const validated = NadoPositionSchema.parse(position);

    const size = this.fromX18Safe(validated.size);

    // Skip positions with zero size
    if (size === 0) {
      return null;
    }

    const entryPrice = this.fromX18Safe(validated.entry_price);
    const markPrice = this.fromX18Safe(validated.mark_price);
    const unrealizedPnl = this.fromX18Safe(validated.unrealized_pnl);
    const realizedPnl = this.fromX18Safe(validated.realized_pnl);
    const margin = this.fromX18Safe(validated.margin);

    const side: 'long' | 'short' = size > 0 ? 'long' : 'short';

    return {
      symbol: productMapping.ccxtSymbol,
      side,
      size: Math.abs(size),
      unrealizedPnl,
      realizedPnl,
      leverage: parseFloat(validated.leverage),
      marginMode: 'cross',
      margin,
      maintenanceMargin: margin * 0.05, // Typical 5% maintenance margin
      marginRatio: margin > 0 ? (margin / (Math.abs(size) * markPrice)) : 0,
      markPrice,
      entryPrice,
      liquidationPrice: validated.liquidation_price
        ? this.fromX18Safe(validated.liquidation_price)
        : 0,
      timestamp: validated.timestamp,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Nado balance to unified Balance format
   *
   * @param balance - Nado balance data
   * @returns Array of normalized balances
   */
  normalizeBalance(balance: NadoBalance): Balance[] {
    // Validate with Zod
    const validated = NadoBalanceSchema.parse(balance);

    const free = this.fromX18Safe(validated.free_margin);
    const used = this.fromX18Safe(validated.used_margin);
    const total = this.fromX18Safe(validated.total_equity);

    return [
      {
        currency: 'USDT', // Nado uses USDT as main collateral
        free,
        used,
        total,
        info: validated as unknown as Record<string, unknown>,
      },
    ];
  }

  /**
   * Normalize Nado trade to unified Trade format
   *
   * @param trade - Nado trade data
   * @param productMapping - Product mapping for symbol resolution
   * @returns Normalized trade
   */
  normalizeTrade(trade: NadoTrade, productMapping: ProductMapping): Trade {
    // Validate with Zod
    const validated = NadoTradeSchema.parse(trade);

    const price = this.fromX18Safe(validated.price);
    const amount = this.fromX18Safe(validated.size);

    return {
      id: validated.trade_id,
      orderId: undefined,
      timestamp: validated.timestamp,
      symbol: productMapping.ccxtSymbol,
      side: validated.side === NADO_ORDER_SIDES.BUY ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Nado ticker to unified Ticker format
   *
   * @param ticker - Nado ticker data (bid/ask from market_prices endpoint)
   * @param symbol - CCXT symbol (required since API doesn't return symbol)
   * @returns Normalized ticker
   */
  normalizeTicker(ticker: NadoTicker, symbol: string): Ticker {
    // Validate with Zod
    const validated = NadoTickerSchema.parse(ticker);

    const bid = this.fromX18Safe(validated.bid_x18);
    const ask = this.fromX18Safe(validated.ask_x18);
    const last = (bid + ask) / 2; // Midpoint as last price

    return {
      symbol,
      timestamp: Date.now(),
      high: 0,
      low: 0,
      bid,
      bidVolume: 0,
      ask,
      askVolume: 0,
      open: 0,
      close: last,
      last,
      change: 0,
      percentage: 0,
      baseVolume: 0,
      quoteVolume: 0,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Nado order book to unified OrderBook format
   *
   * @param orderBook - Nado order book data
   * @param symbol - CCXT formatted symbol
   * @returns Normalized order book
   */
  normalizeOrderBook(orderBook: NadoOrderBook, symbol: string): OrderBook {
    // Validate with Zod
    const validated = NadoOrderBookSchema.parse(orderBook);

    return {
      symbol,
      bids: validated.bids.map(([price, size]) => [
        this.fromX18Safe(price),
        this.fromX18Safe(size),
      ]),
      asks: validated.asks.map(([price, size]) => [
        this.fromX18Safe(price),
        this.fromX18Safe(size),
      ]),
      timestamp: Date.now(),
      exchange: 'nado',
    };
  }

  // ===========================================================================
  // Batch Processing Optimization
  // ===========================================================================

  /**
   * Normalize multiple orders in batch
   *
   * More efficient than calling normalizeOrder() multiple times.
   * Filters out orders without valid product mappings.
   *
   * @param orders - Array of Nado orders
   * @param mappings - Map of product ID to ProductMapping
   * @returns Array of normalized orders
   *
   * @example
   * ```typescript
   * const orders = await apiClient.query('orders', {...});
   * const normalized = normalizer.normalizeOrders(orders, productMappings);
   * ```
   */
  normalizeOrders(
    orders: NadoOrder[],
    mappings: Map<string, ProductMapping>
  ): Order[] {
    return orders
      .map(order => {
        const mapping = mappings.get(order.product_id.toString());
        if (!mapping) {
          console.warn(`[Nado] No mapping found for product ID: ${order.product_id}`);
          return null;
        }
        try {
          return this.normalizeOrder(order, mapping);
        } catch (error) {
          console.error(`[Nado] Failed to normalize order ${order.order_id}:`, error);
          return null;
        }
      })
      .filter((o): o is Order => o !== null);
  }

  /**
   * Normalize multiple positions in batch
   *
   * More efficient than calling normalizePosition() multiple times.
   * Filters out positions with zero size and invalid mappings.
   *
   * @param positions - Array of Nado positions
   * @param mappings - Map of product ID to ProductMapping
   * @returns Array of normalized positions
   *
   * @example
   * ```typescript
   * const positions = await apiClient.query('isolated_positions', {...});
   * const normalized = normalizer.normalizePositions(positions, productMappings);
   * ```
   */
  normalizePositions(
    positions: NadoPosition[],
    mappings: Map<string, ProductMapping>
  ): Position[] {
    return positions
      .map(position => {
        const mapping = mappings.get(position.product_id.toString());
        if (!mapping) {
          console.warn(`[Nado] No mapping found for product ID: ${position.product_id}`);
          return null;
        }
        try {
          return this.normalizePosition(position, mapping);
        } catch (error) {
          console.error(`[Nado] Failed to normalize position for product ${position.product_id}:`, error);
          return null;
        }
      })
      .filter((p): p is Position => p !== null);
  }

  /**
   * Normalize multiple trades in batch
   *
   * @param trades - Array of Nado trades
   * @param mappings - Map of product ID to ProductMapping
   * @returns Array of normalized trades
   */
  normalizeTrades(
    trades: NadoTrade[],
    mappings: Map<string, ProductMapping>
  ): Trade[] {
    return trades
      .map(trade => {
        const mapping = mappings.get(trade.product_id.toString());
        if (!mapping) {
          console.warn(`[Nado] No mapping found for product ID: ${trade.product_id}`);
          return null;
        }
        try {
          return this.normalizeTrade(trade, mapping);
        } catch (error) {
          console.error(`[Nado] Failed to normalize trade ${trade.trade_id}:`, error);
          return null;
        }
      })
      .filter((t): t is Trade => t !== null);
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Map Nado order status to unified format
   *
   * @param status - Nado order status
   * @returns Unified order status
   */
  private mapOrderStatus(
    status: 'open' | 'filled' | 'cancelled' | 'expired' | 'rejected'
  ): 'open' | 'closed' | 'canceled' | 'expired' | 'rejected' {
    switch (status) {
      case 'open':
        return 'open';
      case 'filled':
        return 'closed';
      case 'cancelled':
        return 'canceled'; // Note: CCXT uses 'canceled' not 'cancelled'
      case 'expired':
        return 'expired';
      case 'rejected':
        return 'rejected';
      default:
        return 'rejected';
    }
  }
}
