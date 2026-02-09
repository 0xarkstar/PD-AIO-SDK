/**
 * Pacifica Error Code Mapping
 */
import { PerpDEXError } from '../../types/errors.js';
export declare const PACIFICA_ERROR_CODES: Record<string, string>;
export declare function isRetryableError(code: string): boolean;
export declare function mapPacificaError(code: string, message: string): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map