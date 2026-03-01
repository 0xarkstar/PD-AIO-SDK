/**
 * Ostium Subgraph Queries
 */
import { OSTIUM_SUBGRAPH_URL } from './constants.js';
import { NetworkError } from '../../types/errors.js';
export class OstiumSubgraph {
    url;
    constructor(url) {
        this.url = url ?? OSTIUM_SUBGRAPH_URL;
    }
    async query(graphqlQuery, variables) {
        // Add 30s timeout with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: graphqlQuery, variables }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Subgraph query failed: ${response.status}`);
            }
            const json = (await response.json());
            if (json.errors?.length) {
                throw new Error(`Subgraph error: ${json.errors[0]?.message ?? 'Unknown error'}`);
            }
            return json.data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            // Map AbortError to NetworkError
            if (error instanceof Error && error.name === 'AbortError') {
                throw new NetworkError('GraphQL request timed out after 30s', 'GRAPHQL_TIMEOUT', 'ostium', error);
            }
            throw error;
        }
    }
    async fetchTrades(pairIndex, limit = 100) {
        const query = pairIndex !== undefined
            ? `query($first: Int!, $pairIndex: String!) {
          trades(first: $first, orderBy: timestamp, orderDirection: desc, where: { pairIndex: $pairIndex }) {
            id trader pairIndex action price size buy leverage pnl timestamp txHash
          }
        }`
            : `query($first: Int!) {
          trades(first: $first, orderBy: timestamp, orderDirection: desc) {
            id trader pairIndex action price size buy leverage pnl timestamp txHash
          }
        }`;
        const variables = { first: limit };
        if (pairIndex !== undefined) {
            variables.pairIndex = String(pairIndex);
        }
        const result = await this.query(query, variables);
        return result.trades;
    }
    async fetchPositions(trader) {
        const query = `query($trader: String!) {
      positions(where: { trader: $trader }) {
        id trader pairIndex index positionSizeDai openPrice buy leverage tp sl timestamp
      }
    }`;
        const result = await this.query(query, {
            trader: trader.toLowerCase(),
        });
        return result.positions;
    }
}
//# sourceMappingURL=OstiumSubgraph.js.map