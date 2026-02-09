/**
 * Ostium Contract Interactions
 */
import type { OstiumContractAddresses, OstiumTradeParams, OstiumOpenTrade } from './types.js';
export declare class OstiumContracts {
    private readonly addresses;
    private readonly rpcUrl;
    private readonly privateKey;
    constructor(rpcUrl: string, privateKey: string, addresses?: OstiumContractAddresses);
    private getProvider;
    private getSigner;
    private getTradingContract;
    private getStorageContract;
    openTrade(params: OstiumTradeParams): Promise<{
        hash: string;
    }>;
    closeTrade(pairIndex: number, index: number): Promise<{
        hash: string;
    }>;
    cancelOrder(pairIndex: number, index: number): Promise<{
        hash: string;
    }>;
    getOpenTrade(trader: string, pairIndex: number, index: number): Promise<OstiumOpenTrade>;
    getOpenTradeCount(trader: string, pairIndex: number): Promise<number>;
    getCollateralBalance(address: string): Promise<string>;
    getTraderAddress(): string;
}
//# sourceMappingURL=OstiumContracts.d.ts.map