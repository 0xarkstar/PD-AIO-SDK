/**
 * Ethereal Utility Functions
 */
import type { OrderRequest } from '../../types/common.js';
import type { EtherealCreateOrderRequest } from './types.js';
/**
 * Map unified order side to Ethereal format
 */
export declare function toEtherealOrderSide(side: string): string;
/**
 * Map unified order type to Ethereal format
 */
export declare function toEtherealOrderType(type: string): string;
/**
 * Map time in force
 */
export declare function toEtherealTimeInForce(tif?: string, postOnly?: boolean): string;
/**
 * Build order request for Ethereal API
 */
export declare function buildOrderRequest(request: OrderRequest, accountId: string, signature: string, nonce: string): EtherealCreateOrderRequest;
/**
 * Map Ethereal order status to unified status
 */
export declare function mapOrderStatus(status: string): 'open' | 'closed' | 'canceled' | 'rejected' | 'filled' | 'partiallyFilled';
/**
 * Parse Ethereal symbol to extract base and quote
 * @example "ETH-USD" -> { base: "ETH", quote: "USD" }
 */
export declare function parseEtherealSymbol(symbol: string): {
    base: string;
    quote: string;
};
/**
 * Map OHLCV timeframe to Ethereal candle interval
 */
export declare function mapTimeframeToInterval(timeframe: string): string;
//# sourceMappingURL=utils.d.ts.map