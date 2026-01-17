/**
 * API Contract Specifications for Remaining Exchanges
 * Simplified specs for Paradex, EdgeX, Backpack, and Nado
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';

// ==================== Paradex ====================

const ParadexMarketSchema = z.object({
  symbol: z.string(),
  base_currency: z.string(),
  quote_currency: z.string(),
  price_precision: z.number().optional(),
  size_precision: z.number().optional(),
});

export const paradexSpec: APISpecification = {
  exchange: 'paradex',
  baseUrl: 'https://api.prod.paradex.trade/v1',
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    {
      id: 'paradex.fetchMarkets',
      path: '/markets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.object({
        results: z.array(ParadexMarketSchema),
      }),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all markets',
    },
    {
      id: 'paradex.fetchOrderBook',
      path: '/orderbook',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.object({
        bids: z.array(z.array(z.string())),
        asks: z.array(z.array(z.string())),
      }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book',
    },
  ],
};

export const paradexTestnetSpec: APISpecification = {
  ...paradexSpec,
  baseUrl: 'https://api.testnet.paradex.trade/v1',
  exchange: 'paradex-testnet',
};

// ==================== EdgeX ====================

const EdgeXMarketSchema = z.object({
  symbol: z.string(),
  baseCurrency: z.string(),
  quoteCurrency: z.string(),
});

export const edgexSpec: APISpecification = {
  exchange: 'edgex',
  baseUrl: 'https://api.edgex.exchange/v1',
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    {
      id: 'edgex.fetchMarkets',
      path: '/markets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(EdgeXMarketSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all markets',
    },
    {
      id: 'edgex.fetchTicker',
      path: '/ticker',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.object({
        symbol: z.string(),
        last: z.string().optional(),
        bid: z.string().optional(),
        ask: z.string().optional(),
      }),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker',
    },
  ],
};

export const edgexTestnetSpec: APISpecification = {
  ...edgexSpec,
  baseUrl: 'https://api-testnet.edgex.exchange/v1',
  exchange: 'edgex-testnet',
};

// ==================== Backpack ====================

const BackpackMarketSchema = z.object({
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
});

export const backpackSpec: APISpecification = {
  exchange: 'backpack',
  baseUrl: 'https://api.backpack.exchange/api/v1',
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    {
      id: 'backpack.fetchMarkets',
      path: '/markets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(BackpackMarketSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all markets',
    },
    {
      id: 'backpack.fetchOrderBook',
      path: '/depth',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.object({
        bids: z.array(z.tuple([z.string(), z.string()])),
        asks: z.array(z.tuple([z.string(), z.string()])),
      }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book',
    },
  ],
};

// ==================== Nado ====================

const NadoMarketSchema = z.object({
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
});

export const nadoSpec: APISpecification = {
  exchange: 'nado',
  baseUrl: 'https://api.nado.finance/v1',
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    {
      id: 'nado.fetchMarkets',
      path: '/markets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(NadoMarketSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all markets',
    },
    {
      id: 'nado.fetchTicker',
      path: '/ticker',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.object({
        symbol: z.string(),
        price: z.string().optional(),
      }),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker',
    },
  ],
};

export const nadoTestnetSpec: APISpecification = {
  ...nadoSpec,
  baseUrl: 'https://api-testnet.nado.finance/v1',
  exchange: 'nado-testnet',
};
