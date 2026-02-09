/**
 * Ostium Subgraph Queries
 */
import type { OstiumSubgraphTrade, OstiumSubgraphPosition } from './types.js';
export declare class OstiumSubgraph {
    private readonly url;
    constructor(url?: string);
    private query;
    fetchTrades(pairIndex?: number, limit?: number): Promise<OstiumSubgraphTrade[]>;
    fetchPositions(trader: string): Promise<OstiumSubgraphPosition[]>;
}
//# sourceMappingURL=OstiumSubgraph.d.ts.map