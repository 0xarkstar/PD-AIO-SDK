/**
 * Nado Utility Functions
 *
 * Helper functions for symbol conversion, data normalization,
 * and EIP712 signing for Nado adapter.
 *
 * @see https://docs.nado.xyz
 */
import { ethers } from 'ethers';
import type { NadoProduct, NadoOrder, NadoPosition, NadoBalance, NadoTrade, NadoTicker, NadoOrderBook, NadoEIP712Order, NadoEIP712Cancellation, NadoEIP712StreamAuth, ProductMapping } from './types.js';
import type { Market, Order, Position, Balance, Trade, Ticker, OrderBook } from '../../types/common.js';
/**
 * Convert product ID to verifying contract address
 * Used for EIP712 order signing
 *
 * @param productId - Nado product ID
 * @returns Verifying contract address (0x-prefixed hex)
 */
export declare function productIdToVerifyingContract(productId: number): string;
/**
 * Convert Nado symbol to CCXT format
 * Example: "BTC-PERP" → "BTC/USDT:USDT"
 *
 * @param nadoSymbol - Nado symbol
 * @param quoteAsset - Quote asset (default: USDT)
 * @returns CCXT formatted symbol
 */
export declare function nadoSymbolToCCXT(nadoSymbol: string, quoteAsset?: string): string;
/**
 * Convert CCXT symbol to Nado format
 * Example: "BTC/USDT:USDT" → "BTC-PERP"
 *
 * @param ccxtSymbol - CCXT formatted symbol
 * @returns Nado symbol
 */
export declare function ccxtSymbolToNado(ccxtSymbol: string): string;
/**
 * Normalize Nado product to unified Market format
 */
export declare function normalizeNadoProduct(product: NadoProduct): Market;
/**
 * Normalize Nado order to unified Order format
 */
export declare function normalizeNadoOrder(order: NadoOrder, productMapping: ProductMapping): Order;
/**
 * Normalize Nado position to unified Position format
 */
export declare function normalizeNadoPosition(position: NadoPosition, productMapping: ProductMapping): Position | null;
/**
 * Normalize Nado balance to unified Balance format
 */
export declare function normalizeNadoBalance(balance: NadoBalance): Balance[];
/**
 * Normalize Nado trade to unified Trade format
 */
export declare function normalizeNadoTrade(trade: NadoTrade, productMapping: ProductMapping): Trade;
/**
 * Normalize Nado ticker to unified Ticker format
 */
export declare function normalizeNadoTicker(ticker: NadoTicker): Ticker;
/**
 * Normalize Nado order book to unified OrderBook format
 */
export declare function normalizeNadoOrderBook(orderBook: NadoOrderBook, symbol: string): OrderBook;
/**
 * Create EIP712 domain for Nado
 */
export declare function createNadoEIP712Domain(chainId: number, verifyingContract: string): {
    name: "Nado";
    version: "0.0.1";
    chainId: number;
    verifyingContract: string;
};
/**
 * EIP712 type definitions for Order
 */
export declare const NADO_EIP712_ORDER_TYPES: {
    Order: {
        name: string;
        type: string;
    }[];
    OrderAppendix: {
        name: string;
        type: string;
    }[];
};
/**
 * EIP712 type definitions for Cancellation
 */
export declare const NADO_EIP712_CANCELLATION_TYPES: {
    Cancellation: {
        name: string;
        type: string;
    }[];
};
/**
 * EIP712 type definitions for Stream Authentication
 */
export declare const NADO_EIP712_STREAM_AUTH_TYPES: {
    StreamAuthentication: {
        name: string;
        type: string;
    }[];
};
/**
 * Sign EIP712 order for Nado
 */
export declare function signNadoOrder(wallet: ethers.Wallet, order: NadoEIP712Order, chainId: number, productId: number): Promise<string>;
/**
 * Sign EIP712 cancellation for Nado
 */
export declare function signNadoCancellation(wallet: ethers.Wallet, cancellation: NadoEIP712Cancellation, chainId: number, endpointAddress: string): Promise<string>;
/**
 * Sign EIP712 stream authentication for Nado
 */
export declare function signNadoStreamAuth(wallet: ethers.Wallet, streamAuth: NadoEIP712StreamAuth, chainId: number, endpointAddress: string): Promise<string>;
/**
 * Convert amount to x18 format (Nado uses 18 decimals)
 */
export declare function toX18(value: number | string): string;
/**
 * Convert from x18 format to number
 */
export declare function fromX18(value: string): number;
//# sourceMappingURL=utils.d.ts.map