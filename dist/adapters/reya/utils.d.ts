/**
 * Reya Utility Functions
 */
import type { OrderRequest } from '../../types/common.js';
import type { ReyaCreateOrderRequest } from './types.js';
/**
 * Convert SDK order request to Reya API format
 */
export declare function buildOrderRequest(request: OrderRequest, accountId: number, exchangeId: number, signature: string, nonce: string, signerWallet: string): ReyaCreateOrderRequest;
/**
 * Map Reya order status to unified status
 */
export declare function mapOrderStatus(reyaStatus: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED'): 'open' | 'closed' | 'canceled' | 'rejected' | 'filled';
/**
 * Parse Reya symbol to extract base and quote
 * @example "BTCRUSDPERP" -> { base: "BTC", quote: "USD" }
 */
export declare function parseReyaSymbol(symbol: string): {
    base: string;
    quote: string;
};
/**
 * Map OHLCV timeframe to Reya candle resolution
 */
export declare function mapTimeframeToResolution(timeframe: string): '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
//# sourceMappingURL=utils.d.ts.map