/**
 * Pacifica Constants
 */

export const PACIFICA_API_URLS = {
  mainnet: {
    rest: 'https://api.pacifica.fi/api/v1',
    websocket: 'wss://ws.pacifica.fi/ws',
  },
  testnet: {
    rest: 'https://testnet-api.pacifica.fi/api/v1',
    websocket: 'wss://testnet-ws.pacifica.fi/ws',
  },
} as const;

export const PACIFICA_RATE_LIMITS = {
  rest: {
    maxRequests: 600,
    windowMs: 60000,
  },
  order: {
    maxRequests: 100,
    windowMs: 10000,
  },
} as const;

export const PACIFICA_ENDPOINT_WEIGHTS: Record<string, number> = {
  fetchMarkets: 5,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 2,
  fetchFundingRate: 1,
  createOrder: 3,
  cancelOrder: 2,
  fetchPositions: 3,
  fetchBalance: 3,
  registerBuilderCode: 5,
  setLeverage: 2,
};

export const PACIFICA_ORDER_STATUS: Record<string, string> = {
  open: 'open',
  filled: 'filled',
  partially_filled: 'partiallyFilled',
  cancelled: 'canceled',
  rejected: 'rejected',
};

export const PACIFICA_AUTH_WINDOW = 5000;
