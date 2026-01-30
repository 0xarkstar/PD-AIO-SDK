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
        { px: '50200.0', sz: '0.8', n: 2 },
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

  // Order response (for createOrder tests)
  orderResponse: {
    statuses: [
      {
        resting: {
          oid: 12345,
        },
      },
    ],
  },

  // Market order response
  marketOrderResponse: {
    statuses: [
      {
        filled: {
          oid: 12346,
          totalSz: '0.05',
          avgPx: '50005.0',
        },
      },
    ],
  },

  // Post-only order response
  postOnlyOrderResponse: {
    statuses: [
      {
        resting: {
          oid: 12347,
        },
      },
    ],
  },

  // Reduce-only order response
  reduceOnlyOrderResponse: {
    statuses: [
      {
        resting: {
          oid: 12348,
        },
      },
    ],
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

  // User fees (Phase 0 Bug Fix #1)
  userFees: {
    userCrossRate: '0.000315', // Taker fee
    userAddRate: '0.000105', // Maker fee
    userSpotCrossRate: '0.0002',
    userSpotAddRate: '0.0001',
    activeReferralDiscount: '0',
    dailyUserVlm: [
      {
        date: '2025-12-01',
        userCross: '1000.0',
        userAdd: '500.0',
        exchange: 'Hyperliquid',
      },
    ],
    feeSchedule: {
      cross: '0.00035',
      add: '0.00015',
      spotCross: '0.0002',
      spotAdd: '0.0001',
      tiers: [
        {
          tier: 1,
          vlm: '0',
          crossRate: '0.00035',
          addRate: '0.00015',
        },
      ],
    },
  },

  // Portfolio (Phase 0 Bug Fix #2)
  portfolio: [
    [
      'day',
      {
        accountValueHistory: [
          [1733097600000, '10000.0'],
          [1733184000000, '10250.5'],
        ],
        pnlHistory: [
          [1733097600000, '0'],
          [1733184000000, '250.5'],
        ],
        vlm: '5000.0',
      },
    ],
    [
      'week',
      {
        accountValueHistory: [[1733097600000, '10000.0']],
        pnlHistory: [[1733097600000, '500.0']],
        vlm: '25000.0',
      },
    ],
    [
      'month',
      {
        accountValueHistory: [[1733097600000, '10000.0']],
        pnlHistory: [[1733097600000, '1000.0']],
        vlm: '100000.0',
      },
    ],
  ],

  // Portfolio value alias (for tests)
  get portfolioValue() {
    return this.portfolio;
  },

  // User rate limit (Phase 0 Bug Fix #3)
  userRateLimit: {
    cumVlm: '2854574.593578',
    nRequestsUsed: 2890,
    nRequestsCap: 2864574,
  },

  // Rate limit status alias (for tests)
  get rateLimitStatus() {
    return this.userRateLimit;
  },

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
          { px: '50200.0', sz: '0.8', n: 2 },
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
