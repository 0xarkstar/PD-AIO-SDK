/**
 * Aster Error Code Mapping (Binance-style)
 */
import { PerpDEXError } from '../../types/errors.js';
export declare const ASTER_ERROR_CODES: Record<number, string>;
export declare function isRetryableError(code: number): boolean;
export declare function mapAsterError(code: number, message: string): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map