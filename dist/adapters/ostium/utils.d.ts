/**
 * Ostium Utility Functions
 */
import type { OstiumPairInfo } from './types.js';
export declare function toOstiumPairIndex(unified: string): number;
export declare function toUnifiedSymbol(pairIndex: number): string;
export declare function toUnifiedSymbolFromName(name: string): string;
export declare function getPairInfo(pairIndex: number): OstiumPairInfo | undefined;
export declare function formatCollateral(amount: number): string;
export declare function parseCollateral(raw: string): number;
export declare function formatPrice(price: number): string;
export declare function parsePrice(raw: string): number;
//# sourceMappingURL=utils.d.ts.map