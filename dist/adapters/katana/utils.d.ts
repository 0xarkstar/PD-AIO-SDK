/**
 * Katana utility functions
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest } from '../../types/common.js';
import type { KatanaMarket, KatanaOrder, KatanaPosition, KatanaWallet, KatanaOrderBook, KatanaTrade, KatanaTicker, KatanaFundingRate, KatanaFill, KatanaOrderSignPayload } from './types.js';
import { PerpDEXError } from '../../types/errors.js';
/**
 * Format number as Katana 8-decimal zero-padded string
 *
 * @example formatDecimal(1850) // "1850.00000000"
 * @example formatDecimal(0.5) // "0.50000000"
 */
export declare function formatDecimal(value: number): string;
/**
 * Parse Katana decimal string to number
 *
 * @example parseDecimal("1850.00000000") // 1850
 * @example parseDecimal("0.50000000") // 0.5
 */
export declare function parseDecimal(value: string): number;
/**
 * Convert Katana symbol to unified CCXT format
 *
 * @example normalizeSymbol("ETH-USD") // "ETH/USD:USD"
 * @example normalizeSymbol("BTC-USD") // "BTC/USD:USD"
 */
export declare function normalizeSymbol(katanaSymbol: string): string;
/**
 * Convert unified CCXT symbol to Katana format
 *
 * @example toKatanaSymbol("ETH/USD:USD") // "ETH-USD"
 * @example toKatanaSymbol("BTC/USD:USD") // "BTC-USD"
 */
export declare function toKatanaSymbol(symbol: string): string;
/**
 * Normalize Katana market to unified format
 */
export declare function normalizeMarket(raw: KatanaMarket): Market;
/**
 * Normalize Katana order to unified format
 */
export declare function normalizeOrder(raw: KatanaOrder): Order;
/**
 * Normalize Katana position to unified format
 */
export declare function normalizePosition(raw: KatanaPosition): Position;
/**
 * Normalize Katana wallet to unified balance
 */
export declare function normalizeBalance(raw: KatanaWallet): Balance;
/**
 * Normalize Katana orderbook to unified format
 */
export declare function normalizeOrderBook(raw: KatanaOrderBook, market: string): OrderBook;
/**
 * Normalize Katana public trade to unified format
 */
export declare function normalizeTrade(raw: KatanaTrade): Trade;
/**
 * Normalize Katana fill (private trade) to unified format
 */
export declare function normalizeFill(raw: KatanaFill): Trade;
/**
 * Normalize Katana ticker to unified format
 */
export declare function normalizeTicker(raw: KatanaTicker): Ticker;
/**
 * Normalize Katana funding rate to unified format
 */
export declare function normalizeFundingRate(raw: KatanaFundingRate): FundingRate;
/**
 * Convert unified OrderRequest to Katana EIP-712 sign payload
 */
export declare function convertOrderRequest(request: OrderRequest, walletAddress: string, nonce: string): KatanaOrderSignPayload;
/**
 * Map Katana error to unified SDK error
 */
export declare function mapError(error: unknown): PerpDEXError;
//# sourceMappingURL=utils.d.ts.map