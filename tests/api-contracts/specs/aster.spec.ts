/**
 * Aster API Contract Specification
 *
 * Defines the expected API contract for Aster exchange endpoints.
 * Aster uses a Binance-compatible futures API.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { ASTER_API_URLS } from '../../../src/adapters/aster/constants.js';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Aster Filter Schema (union of filter types)
 */
const AsterFilterSchema = z.object({
  filterType: z.string(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  tickSize: z.string().optional(),
  minQty: z.string().optional(),
  maxQty: z.string().optional(),
  stepSize: z.string().optional(),
  notional: z.string().optional(),
  limit: z.number().optional(),
  multiplierUp: z.string().optional(),
  multiplierDown: z.string().optional(),
  multiplierDecimal: z.string().optional(),
});

/**
 * Aster Exchange Info Response Schema
 */
const AsterExchangeInfoSchema = z.object({
  timezone: z.string(),
  serverTime: z.number(),
  symbols: z.array(
    z.object({
      symbol: z.string(),
      pair: z.string(),
      contractType: z.string(),
      deliveryDate: z.number(),
      onboardDate: z.number(),
      status: z.string(),
      baseAsset: z.string(),
      quoteAsset: z.string(),
      marginAsset: z.string(),
      pricePrecision: z.number(),
      quantityPrecision: z.number(),
      baseAssetPrecision: z.number(),
      quotePrecision: z.number(),
      underlyingType: z.string(),
      settlePlan: z.number(),
      triggerProtect: z.string(),
      filters: z.array(AsterFilterSchema),
      orderTypes: z.array(z.string()),
      timeInForce: z.array(z.string()),
      liquidationFee: z.string(),
      marketTakeBound: z.string(),
    })
  ),
});

/**
 * Aster 24hr Ticker Response Schema
 */
const AsterTicker24hrSchema = z.object({
  symbol: z.string(),
  priceChange: z.string(),
  priceChangePercent: z.string(),
  weightedAvgPrice: z.string(),
  lastPrice: z.string(),
  lastQty: z.string(),
  openPrice: z.string(),
  highPrice: z.string(),
  lowPrice: z.string(),
  volume: z.string(),
  quoteVolume: z.string(),
  openTime: z.number(),
  closeTime: z.number(),
  firstId: z.number(),
  lastId: z.number(),
  count: z.number(),
});

/**
 * Aster Order Book Response Schema
 */
const AsterOrderBookSchema = z.object({
  lastUpdateId: z.number(),
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()])),
  T: z.number(),
});

/**
 * Aster Trade Response Schema
 */
const AsterTradeSchema = z.object({
  id: z.number(),
  price: z.string(),
  qty: z.string(),
  quoteQty: z.string(),
  time: z.number(),
  isBuyerMaker: z.boolean(),
});

/**
 * Aster Premium Index (Funding) Response Schema
 */
const AsterPremiumIndexSchema = z.object({
  symbol: z.string(),
  markPrice: z.string(),
  indexPrice: z.string(),
  estimatedSettlePrice: z.string(),
  lastFundingRate: z.string(),
  nextFundingTime: z.number(),
  interestRate: z.string(),
  time: z.number(),
});

/**
 * Aster Kline Response Schema (array of arrays)
 */
const AsterKlineSchema = z.tuple([
  z.number(),  // Open time
  z.string(),  // Open
  z.string(),  // High
  z.string(),  // Low
  z.string(),  // Close
  z.string(),  // Volume
  z.number(),  // Close time
  z.string(),  // Quote asset volume
  z.number(),  // Number of trades
  z.string(),  // Taker buy base volume
  z.string(),  // Taker buy quote volume
  z.string(),  // Ignore
]);

// =============================================================================
// API Specification
// =============================================================================

/**
 * Aster API Specification
 */
export const asterSpec: APISpecification = {
  exchange: 'aster',
  baseUrl: ASTER_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'aster.fetchMarkets',
      path: '/fapi/v1/exchangeInfo',
      method: 'GET',
      requiresAuth: false,
      responseSchema: AsterExchangeInfoSchema,
      rateLimit: 40,
      expectedResponseTime: 500,
      description: 'Fetch exchange info and all markets',
    },
    {
      id: 'aster.fetchTicker',
      path: '/fapi/v1/ticker/24hr?symbol={symbol}',
      method: 'GET',
      requiresAuth: false,
      responseSchema: AsterTicker24hrSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch 24hr ticker for a symbol',
    },
    {
      id: 'aster.fetchOrderBook',
      path: '/fapi/v1/depth?symbol={symbol}&limit=20',
      method: 'GET',
      requiresAuth: false,
      responseSchema: AsterOrderBookSchema,
      rateLimit: 5,
      expectedResponseTime: 400,
      description: 'Fetch order book for a symbol',
    },
    {
      id: 'aster.fetchTrades',
      path: '/fapi/v1/trades?symbol={symbol}&limit=20',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(AsterTradeSchema),
      rateLimit: 5,
      expectedResponseTime: 400,
      description: 'Fetch recent trades for a symbol',
    },
    {
      id: 'aster.fetchFundingRate',
      path: '/fapi/v1/premiumIndex?symbol={symbol}',
      method: 'GET',
      requiresAuth: false,
      responseSchema: AsterPremiumIndexSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch funding rate and premium index for a symbol',
    },
    {
      id: 'aster.fetchOHLCV',
      path: '/fapi/v1/klines?symbol={symbol}&interval=1h&limit=100',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(AsterKlineSchema),
      rateLimit: 5,
      expectedResponseTime: 500,
      description: 'Fetch OHLCV candles for a symbol',
    },
  ],
};

/**
 * Aster Testnet API Specification
 */
export const asterTestnetSpec: APISpecification = {
  ...asterSpec,
  baseUrl: ASTER_API_URLS.testnet.rest,
  exchange: 'aster-testnet',
};
