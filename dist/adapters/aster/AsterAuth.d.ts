/**
 * Aster Authentication (HMAC-SHA256)
 */
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
export interface AsterAuthConfig {
    apiKey: string;
    apiSecret: string;
    recvWindow?: number;
}
export declare class AsterAuth implements IAuthStrategy {
    private readonly apiKey;
    private readonly apiSecret;
    private readonly recvWindow;
    constructor(config: AsterAuthConfig);
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    private buildQueryString;
    getHeaders(): Record<string, string>;
    hasCredentials(): boolean;
}
//# sourceMappingURL=AsterAuth.d.ts.map