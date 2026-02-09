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
        const where = pairIndex !== undefined ? `where: { pairIndex: "${pairIndex}" }` : '';
        const result = await this.query(`
      {
        trades(first: ${limit}, orderBy: timestamp, orderDirection: desc, ${where}) {
          id
          trader
          pairIndex
          action
          price
          size
          buy
          leverage
          pnl
          timestamp
          txHash
        }
      }
    `);
        return result.trades;
    }
    async fetchPositions(trader) {
        const result = await this.query(`
      {
        positions(where: { trader: "${trader.toLowerCase()}" }) {
          id
          trader
          pairIndex
          index
          positionSizeDai
          openPrice
          buy
          leverage
          tp
          sl
          timestamp
        }
      }
    `);
        return result.positions;
    }
}
//# sourceMappingURL=OstiumSubgraph.js.map