/**
 * Ostium Subgraph Queries
 */

import type { OstiumSubgraphTrade, OstiumSubgraphPosition } from './types.js';
import { OSTIUM_SUBGRAPH_URL } from './constants.js';

export class OstiumSubgraph {
  private readonly url: string;

  constructor(url?: string) {
    this.url = url ?? OSTIUM_SUBGRAPH_URL;
  }

  private async query<T>(graphqlQuery: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph query failed: ${response.status}`);
    }

    const json = (await response.json()) as { data: T; errors?: Array<{ message: string }> };

    if (json.errors?.length) {
      throw new Error(`Subgraph error: ${json.errors[0]?.message ?? 'Unknown error'}`);
    }

    return json.data;
  }

  async fetchTrades(pairIndex?: number, limit = 100): Promise<OstiumSubgraphTrade[]> {
    const where = pairIndex !== undefined ? `where: { pairIndex: "${pairIndex}" }` : '';
    const result = await this.query<{ trades: OstiumSubgraphTrade[] }>(`
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

  async fetchPositions(trader: string): Promise<OstiumSubgraphPosition[]> {
    const result = await this.query<{ positions: OstiumSubgraphPosition[] }>(`
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
