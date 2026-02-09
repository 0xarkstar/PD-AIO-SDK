/**
 * Ostium Authentication (EVM Wallet)
 */
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
export interface OstiumAuthConfig {
    privateKey: string;
    rpcUrl: string;
}
export declare class OstiumAuth implements IAuthStrategy {
    private readonly privateKey;
    private readonly rpcUrl;
    constructor(config: OstiumAuthConfig);
    getPrivateKey(): string;
    getRpcUrl(): string;
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    getHeaders(): Record<string, string>;
    hasCredentials(): boolean;
    getAddress(): string;
}
//# sourceMappingURL=OstiumAuth.d.ts.map