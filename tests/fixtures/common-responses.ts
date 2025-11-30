/**
 * Common mock API responses shared across adapters
 */

export const commonMockData = {
  // Generic market data
  markets: {
    btcPerp: {
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      minAmount: 0.001,
      maxLeverage: 50,
      makerFee: 0.0002,
      takerFee: 0.0005,
    },
    ethPerp: {
      symbol: 'ETH/USDT:USDT',
      base: 'ETH',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      minAmount: 0.01,
      maxLeverage: 50,
      makerFee: 0.0002,
      takerFee: 0.0005,
    },
  },

  // Generic order book
  orderBook: {
    bids: [
      [50000, 0.5],
      [49900, 1.0],
      [49800, 1.5],
    ],
    asks: [
      [50100, 0.3],
      [50200, 0.8],
      [50300, 1.2],
    ],
    timestamp: Date.now(),
  },

  // Generic position
  position: {
    long: {
      symbol: 'BTC/USDT:USDT',
      side: 'long' as const,
      size: 0.5,
      entryPrice: 48000,
      markPrice: 50000,
      liquidationPrice: 40000,
      unrealizedPnl: 1000,
      realizedPnl: 500,
      margin: 2400,
      leverage: 20,
      marginMode: 'cross' as const,
    },
    short: {
      symbol: 'ETH/USDT:USDT',
      side: 'short' as const,
      size: 2.0,
      entryPrice: 3100,
      markPrice: 3000,
      liquidationPrice: 3500,
      unrealizedPnl: 200,
      realizedPnl: 50,
      margin: 310,
      leverage: 20,
      marginMode: 'cross' as const,
    },
  },

  // Generic order
  order: {
    limit: {
      symbol: 'BTC/USDT:USDT',
      type: 'limit' as const,
      side: 'buy' as const,
      amount: 0.1,
      price: 50000,
      filled: 0,
      remaining: 0.1,
      status: 'open' as const,
      postOnly: false,
      reduceOnly: false,
    },
    market: {
      symbol: 'BTC/USDT:USDT',
      type: 'market' as const,
      side: 'sell' as const,
      amount: 0.1,
      filled: 0.1,
      remaining: 0,
      status: 'filled' as const,
      postOnly: false,
      reduceOnly: false,
    },
  },

  // Generic balance
  balance: {
    currency: 'USDT',
    total: 100000,
    free: 95000,
    used: 5000,
  },

  // Generic trades
  trades: [
    {
      symbol: 'BTC/USDT:USDT',
      side: 'buy' as const,
      price: 50000,
      amount: 0.1,
      cost: 5000,
      timestamp: Date.now() - 1000,
    },
    {
      symbol: 'BTC/USDT:USDT',
      side: 'sell' as const,
      price: 49995,
      amount: 0.05,
      cost: 2499.75,
      timestamp: Date.now() - 2000,
    },
  ],

  // Generic funding rate
  fundingRate: {
    symbol: 'BTC/USDT:USDT',
    fundingRate: 0.0001,
    fundingIntervalHours: 8,
    timestamp: Date.now(),
  },
};

/**
 * Helper to create mock fetch response
 */
export function createMockResponse<T>(data: T, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

/**
 * Helper to create error response
 */
export function createErrorResponse(
  code: number,
  message: string,
  status = 400
) {
  return createMockResponse(
    {
      code,
      message,
      error: message,
    },
    false,
    status
  );
}
