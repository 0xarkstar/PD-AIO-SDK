/**
 * Pacifica Authentication (Ed25519)
 *
 * Similar to Backpack auth pattern: method + path + timestamp + window + body signing
 */
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
export interface PacificaAuthConfig {
    apiKey: string;
    apiSecret: string;
}
export declare class PacificaAuth implements IAuthStrategy {
    private readonly apiKey;
    private readonly apiSecret;
    constructor(config: PacificaAuthConfig);
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    private signMessage;
    getHeaders(): Record<string, string>;
    hasCredentials(): boolean;
}
//# sourceMappingURL=PacificaAuth.d.ts.map