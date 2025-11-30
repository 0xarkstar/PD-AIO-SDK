/**
 * Mock API responses for Hyperliquid integration tests
 */

export const mockHyperliquidResponses = {
  // Meta endpoint response
  meta: {
    universe: [
      {
        name: 'BTC',
        szDecimals: 5,
        maxLeverage: 50,
        onlyIsolated: false,
      },
      {
        name: 'ETH',
        szDecimals: 4,
        maxLeverage: 50,
        onlyIsolated: false,
      },
    ],
  },

  // All mids response
  allMids: {
    BTC: '50000.0',
    ETH: '3000.0',
  },

  // User state response
  userState: {
    assetPositions: [
      {
        position: {
          coin: 'BTC',
          entryPx: '48000.0',
          leverage: {
            type: 'cross',
            value: 10,
          },
          liquidationPx: '40000.0',
          marginUsed: '2400.0',
          maxLeverage: 50,
          positionValue: '24000.0',
          returnOnEquity: '0.04166',
          szi: '0.5',
          unrealizedPnl: '1000.0',
        },
        type: 'oneWay',
      },
    ],
    marginSummary: {
      accountValue: '100000.0',
      totalMarginUsed: '2400.0',
      totalNtlPos: '24000.0',
      totalRawUsd: '98600.0',
    },
    crossMarginSummary: {
      accountValue: '100000.0',
      totalMarginUsed: '2400.0',
      totalNtlPos: '24000.0',
      totalRawUsd: '98600.0',
    },
    withdrawable: '95600.0',
  },

  // L2 snapshot (order book)
  l2Snapshot: {
    coin: 'BTC',
    levels: [
      [
        { px: '50000.0', sz: '0.5', n: 1 },
        { px: '49900.0', sz: '1.0', n: 2 },
      ],
      [
        { px: '50100.0', sz: '0.3', n: 1 },
        { px: '50200.0', sz: '0.8', n: 3 },
      ],
    ],
    time: 1234567890000,
  },

  // Recent trades
  recentTrades: [
    {
      coin: 'BTC',
      side: 'B',
      px: '50000.0',
      sz: '0.1',
      time: 1234567890000,
      hash: '0x123',
    },
    {
      coin: 'BTC',
      side: 'A',
      px: '49995.0',
      sz: '0.05',
      time: 1234567889000,
      hash: '0x124',
    },
  ],

  // Order placement response
  orderPlaced: {
    status: 'ok',
    response: {
      type: 'order',
      data: {
        statuses: [
          {
            resting: {
              oid: 12345,
            },
          },
        ],
      },
    },
  },

  // Open orders response
  openOrders: [
    {
      coin: 'BTC',
      limitPx: '50000.0',
      oid: 12345,
      side: 'B',
      sz: '0.1',
      timestamp: 1234567890000,
      origSz: '0.1',
    },
  ],

  // User fills (trades)
  userFills: [
    {
      coin: 'BTC',
      px: '49995.0',
      sz: '0.02',
      side: 'B',
      time: 1234567890000,
      startPosition: '0.0',
      dir: 'Open Long',
      closedPnl: '0.0',
      hash: '0x123',
      oid: 12345,
      crossed: false,
      fee: '0.5',
      tid: 67890,
    },
  ],

  // Funding rates
  fundingHistory: [
    {
      coin: 'BTC',
      fundingRate: '0.0001',
      premium: '0.00005',
      time: 1234567890000,
    },
  ],

  // Cancel order response
  orderCancelled: {
    status: 'ok',
    response: {
      type: 'cancel',
      data: {
        statuses: ['success'],
      },
    },
  },

  // Error responses
  errors: {
    invalidOrder: {
      status: 'err',
      response: 'Invalid order parameters',
    },
    insufficientMargin: {
      status: 'err',
      response: 'Insufficient margin',
    },
    orderNotFound: {
      status: 'err',
      response: 'Order not found',
    },
    rateLimitExceeded: {
      status: 'err',
      response: 'Rate limit exceeded',
    },
  },
};

export const mockHyperliquidWebSocketMessages = {
  // Subscription confirmation
  subscribed: {
    channel: 'orderUpdates',
    data: {
      type: 'subscribed',
    },
  },

  // Order book update
  l2Book: {
    channel: 'l2Book',
    data: {
      coin: 'BTC',
      levels: [
        [
          { px: '50000.0', sz: '0.5', n: 1 },
          { px: '49900.0', sz: '1.0', n: 2 },
        ],
        [
          { px: '50100.0', sz: '0.3', n: 1 },
          { px: '50200.0', sz: '0.8', n: 3 },
        ],
      ],
      time: 1234567890000,
    },
  },

  // Position update
  userEvents: {
    channel: 'userEvents',
    data: {
      fills: [
        {
          coin: 'BTC',
          px: '50000.0',
          sz: '0.1',
          side: 'B',
          time: 1234567890000,
          oid: 12345,
        },
      ],
    },
  },
};
