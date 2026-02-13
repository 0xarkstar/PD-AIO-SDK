/**
 * Ostium Subgraph Queries
 */
import { OSTIUM_SUBGRAPH_URL } from './constants.js';
export class OstiumSubgraph {
    url;
    constructor(url) {
        this.url = url ?? OSTIUM_SUBGRAPH_URL;
    }
    async query(graphqlQuery, variables) {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: graphqlQuery, variables }),
        });
        if (!response.ok) {
            throw new Error(`Subgraph query failed: ${response.status}`);
        }
        const json = (await response.json());
        if (json.errors?.length) {
            throw new Error(`Subgraph error: ${json.errors[0]?.message ?? 'Unknown error'}`);
        }
        return json.data;
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