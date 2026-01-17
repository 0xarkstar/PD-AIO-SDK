/**
 * GRVT API Contract Specification
 *
 * Defines the expected API contract for GRVT exchange endpoints.
 * GRVT uses official @grvt/client SDK with MDG and TDG gateways.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { GRVT_API_URLS } from '../../../src/adapters/grvt/constants.js';

/**
 * GRVT Instrument Schema (Market)
 */
const GRVTInstrumentSchema = z.object({
  instrument: z.string(),
  instrument_hash: z.string(),
  base: z.string(),
  quote: z.string(),
  kind: z.enum(['PERPETUAL', 'FUTURE', 'CALL', 'PUT']),
  venue: z.string(),
  settlement_period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  base_decimals: z.number(),
  quote_decimals: z.number(),
  tick_size: z.string(),
  min_size: z.string(),
  max_size: z.string().optional(),
  is_active: z.boolean(),
});

/**
 * GRVT Ticker Schema
 */
const GRVTTickerSchema = z.object({
  instrument: z.string(),
  mark_price: z.string().optional(),
  index_price: z.string().optional(),
  last_price: z.string().optional(),
  mid_price: z.string().optional(),
  best_bid_price: z.string().optional(),
  best_ask_price: z.string().optional(),
  best_bid_size: z.string().optional(),
  best_ask_size: z.string().optional(),
  open_interest: z.string().optional(),
  funding_rate: z.string().optional(),
  next_funding_time: z.number().optional(),
  volume_24h: z.string().optional(),
  high_24h: z.string().optional(),
  low_24h: z.string().optional(),
  timestamp: z.number(),
});

/**
 * GRVT Order Book Schema
 */
const GRVTOrderBookSchema = z.object({
  instrument: z.string(),
  bids: z.array(
    z.array(z.string()) // [price, size]
  ),
  asks: z.array(
    z.array(z.string()) // [price, size]
  ),
  timestamp: z.number(),
  checksum: z.number().optional(),
});

/**
 * GRVT Trade Schema
 */
const GRVTTradeSchema = z.object({
  trade_id: z.string(),
  instrument: z.string(),
  is_buyer_maker: z.boolean(),
  price: z.string(),
  size: z.string(),
  created_at: z.number(),
});

/**
 * GRVT Position Schema
 */
const GRVTPositionSchema = z.object({
  sub_account_id: z.string(),
  instrument: z.string(),
  size: z.string(),
  notional: z.string().optional(),
  entry_price: z.string().optional(),
  mark_price: z.string().optional(),
  unrealized_pnl: z.string().optional(),
  realized_pnl: z.string().optional(),
  liquidation_price: z.string().optional(),
  leverage: z.string().optional(),
  margin_type: z.enum(['CROSS', 'ISOLATED']).optional(),
});

/**
 * GRVT Funding Rate Schema
 */
const GRVTFundingSchema = z.object({
  instrument: z.string(),
  funding_rate: z.string(),
  mark_price: z.string().optional(),
  index_price: z.string().optional(),
  next_funding_time: z.number(),
  timestamp: z.number(),
});

/**
 * GRVT Balance Schema
 */
const GRVTBalanceSchema = z.object({
  sub_account_id: z.string(),
  currency: z.string(),
  total: z.string(),
  available: z.string(),
  reserved: z.string().optional(),
});

/**
 * GRVT Order Schema
 */
const GRVTOrderSchema = z.object({
  order_id: z.string(),
  sub_account_id: z.string(),
  client_order_id: z.string().optional(),
  instrument: z.string(),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['LIMIT', 'MARKET']),
  time_in_force: z.enum(['GTC', 'IOC', 'FOK']),
  price: z.string().optional(),
  size: z.string(),
  filled_size: z.string().optional(),
  average_fill_price: z.string().optional(),
  status: z.enum(['OPEN', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED']),
  created_at: z.number(),
  updated_at: z.number().optional(),
});

/**
 * GRVT Order Response Schema
 */
const GRVTOrderResponseSchema = z.object({
  result: z.object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    status: z.string(),
  }),
});

/**
 * GRVT API Specification
 */
export const grvtSpec: APISpecification = {
  exchange: 'grvt',
  baseUrl: GRVT_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    // Market Data Gateway (MDG) Endpoints
    {
      id: 'grvt.fetchMarkets',
      path: '/full/v1/all_instruments',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({}),
      responseSchema: z.object({
        result: z.array(GRVTInstrumentSchema),
      }),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all available markets',
    },
    {
      id: 'grvt.fetchTicker',
      path: '/full/v1/ticker',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        instrument: z.string().optional(),
      }),
      responseSchema: z.object({
        result: GRVTTickerSchema,
      }),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker for a specific symbol',
    },
    {
      id: 'grvt.fetchOrderBook',
      path: '/full/v1/order_book',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        instrument: z.string(),
        depth: z.number().optional(),
      }),
      responseSchema: z.object({
        result: GRVTOrderBookSchema,
      }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book for a specific symbol',
    },
    {
      id: 'grvt.fetchTrades',
      path: '/full/v1/trades_history',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        instrument: z.string().optional(),
        limit: z.number().optional(),
      }),
      responseSchema: z.object({
        result: z.array(GRVTTradeSchema),
      }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch recent trades for a specific symbol',
    },
    {
      id: 'grvt.fetchFundingRate',
      path: '/full/v1/funding',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        instrument: z.string().optional(),
      }),
      responseSchema: z.object({
        result: GRVTFundingSchema,
      }),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch funding rate for a specific symbol',
    },

    // Trading Data Gateway (TDG) Endpoints - Require Authentication
    {
      id: 'grvt.fetchPositions',
      path: '/trade/v1/positions',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        sub_account_id: z.string().optional(),
      }),
      responseSchema: z.object({
        result: z.array(GRVTPositionSchema),
      }),
      rateLimit: 2,
      expectedResponseTime: 500,
      description: 'Fetch user positions',
    },
    {
      id: 'grvt.fetchBalance',
      path: '/trade/v1/account_summary',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        sub_account_id: z.string().optional(),
      }),
      responseSchema: z.object({
        result: z.object({
          balances: z.array(GRVTBalanceSchema),
        }),
      }),
      rateLimit: 2,
      expectedResponseTime: 500,
      description: 'Fetch account balance',
    },
    {
      id: 'grvt.fetchOpenOrders',
      path: '/trade/v1/open_orders',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        sub_account_id: z.string().optional(),
        instrument: z.string().optional(),
      }),
      responseSchema: z.object({
        result: z.array(GRVTOrderSchema),
      }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch open orders',
    },
    {
      id: 'grvt.createOrder',
      path: '/trade/v1/create_order',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        sub_account_id: z.string(),
        instrument: z.string(),
        side: z.enum(['BUY', 'SELL']),
        type: z.enum(['LIMIT', 'MARKET']),
        size: z.string(),
        price: z.string().optional(),
        time_in_force: z.enum(['GTC', 'IOC', 'FOK']).optional(),
        client_order_id: z.string().optional(),
        post_only: z.boolean().optional(),
        reduce_only: z.boolean().optional(),
      }),
      responseSchema: GRVTOrderResponseSchema,
      rateLimit: 5,
      expectedResponseTime: 800,
      description: 'Create new order',
    },
    {
      id: 'grvt.cancelOrder',
      path: '/trade/v1/cancel_order',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        order_id: z.string().optional(),
        client_order_id: z.string().optional(),
      }),
      responseSchema: z.object({
        result: z.object({
          order_id: z.string(),
          status: z.string(),
        }),
      }),
      rateLimit: 3,
      expectedResponseTime: 600,
      description: 'Cancel order',
    },
  ],
};

/**
 * GRVT Testnet API Specification
 */
export const grvtTestnetSpec: APISpecification = {
  ...grvtSpec,
  baseUrl: GRVT_API_URLS.testnet.rest,
  exchange: 'grvt-testnet',
};
