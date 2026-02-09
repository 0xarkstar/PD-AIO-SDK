/**
 * Pacifica Utility Functions
 */
import type { OrderRequest } from '../../types/common.js';
export declare function toPacificaSymbol(unified: string): string;
export declare function toUnifiedSymbol(pacificaSymbol: string): string;
export declare function buildOrderBody(request: OrderRequest, pacificaSymbol: string, builderCode?: string): Record<string, unknown>;
//# sourceMappingURL=utils.d.ts.map