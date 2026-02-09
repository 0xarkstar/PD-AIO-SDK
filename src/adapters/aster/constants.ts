/**
 * Aster Constants
 */

export const ASTER_API_URLS = {
  mainnet: {
    rest: 'https://fapi.asterdex.com',
    websocket: 'wss://fstream.asterdex.com',
  },
  testnet: {
    rest: 'https://testnet-fapi.asterdex.com',
    websocket: 'wss://testnet-fstream.asterdex.com',
  },
};

export const ASTER_RATE_LIMITS = {
  rest: {
    maxRequests: 1200,
    windowMs: 60000,
  },
  order: {
    maxRequests: 300,
    windowMs: 60000,
  },
};

export const ASTER_ENDPOINT_WEIGHTS: Record<string, number> = {
  fetchMarkets: 40,
  fetchTicker: 1,
  fetchOrderBook: 5,
  fetchTrades: 5,
  fetchFundingRate: 1,
  fetchOHLCV: 5,
  createOrder: 1,
  cancelOrder: 1,
  cancelAllOrders: 1,
  fetchPositions: 5,
  fetchBalance: 5,
  setLeverage: 1,
};

export const ASTER_ORDER_TYPES: Record<string, string> = {
  market: 'MARKET',
  limit: 'LIMIT',
  stopMarket: 'STOP_MARKET',
  stopLimit: 'STOP',
  takeProfit: 'TAKE_PROFIT_MARKET',
};

export const ASTER_ORDER_SIDES: Record<string, string> = {
  buy: 'BUY',
  sell: 'SELL',
};

export const ASTER_TIME_IN_FORCE: Record<string, string> = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
  PO: 'GTX',
};

export const ASTER_ORDER_STATUS: Record<string, string> = {
  NEW: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const ASTER_KLINE_INTERVALS: Record<string, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '8h': '8h',
  '12h': '12h',
  '1d': '1d',
  '3d': '3d',
  '1w': '1w',
  '1M': '1M',
};

export const ASTER_DEFAULT_RECV_WINDOW = 5000;
