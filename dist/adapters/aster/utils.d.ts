/**
 * Aster Utility Functions
 */
import type { OrderRequest } from '../../types/common.js';
export declare function toAsterSymbol(unified: string): string;
export declare function toUnifiedSymbol(_asterSymbol: string, baseAsset: string, quoteAsset: string): string;
export declare function toAsterOrderSide(side: string): string;
export declare function toAsterOrderType(type: string): string;
export declare function toAsterTimeInForce(tif?: string, postOnly?: boolean): string;
export declare function buildOrderParams(request: OrderRequest, asterSymbol: string, referralCode?: string): Record<string, string | number | boolean>;
export declare function parsePrecision(tickSize: string): number;
//# sourceMappingURL=utils.d.ts.map