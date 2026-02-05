/**
 * Validation Schema Unit Tests
 */

import {
  OrderRequestSchema,
  OrderSchema,
  PositionSchema,
  MarketSchema,
  OrderBookSchema,
  validateData,
  validateArray,
} from '../../src/core/validation/schemas.js';

describe('OrderRequestSchema', () => {
  test('validates valid limit order', () => {
    const validOrder = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit' as const,
      side: 'buy' as const,
      amount: 0.1,
      price: 50000,
      reduceOnly: false,
      postOnly: false,
    };

    expect(() => OrderRequestSchema.parse(validOrder)).not.toThrow();
  });

  test('validates valid market order', () => {
    const validOrder = {
      symbol: 'BTC/USDT:USDT',
      type: 'market' as const,
      side: 'sell' as const,
      amount: 0.1,
      reduceOnly: false,
      postOnly: false,
    };

    expect(() => OrderRequestSchema.parse(validOrder)).not.toThrow();
  });

  test('rejects limit order without price', () => {
    const invalidOrder = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit' as const,
      side: 'buy' as const,
      amount: 0.1,
      reduceOnly: false,
      postOnly: false,
    };

    expect(() => OrderRequestSchema.parse(invalidOrder)).toThrow();
  });

  test('rejects negative amount', () => {
    const invalidOrder = {
      symbol: 'BTC/USDT:USDT',
      type: 'market' as const,
      side: 'buy' as const,
      amount: -0.1,
      reduceOnly: false,
      postOnly: false,
    };

    expect(() => OrderRequestSchema.parse(invalidOrder)).toThrow();
  });

  test('rejects empty symbol', () => {
    const invalidOrder = {
      symbol: '',
      type: 'market' as const,
      side: 'buy' as const,
      amount: 0.1,
      reduceOnly: false,
      postOnly: false,
    };

    expect(() => OrderRequestSchema.parse(invalidOrder)).toThrow();
  });

  test('applies default values', () => {
    const order = {
      symbol: 'BTC/USDT:USDT',
      type: 'market' as const,
      side: 'buy' as const,
      amount: 0.1,
    };

    const parsed = OrderRequestSchema.parse(order);

    expect(parsed.reduceOnly).toBe(false);
    expect(parsed.postOnly).toBe(false);
  });

  test('validates stop order requires stopPrice (line 70)', () => {
    const stopOrderWithoutPrice = {
      symbol: 'BTC/USDT:USDT',
      type: 'stopMarket' as const,
      side: 'buy' as const,
      amount: 0.1,
      // Missing stopPrice
    };

    expect(() => OrderRequestSchema.parse(stopOrderWithoutPrice)).toThrow(
      /Stop orders require a valid stopPrice/
    );
  });

  test('validates stop order with valid stopPrice', () => {
    const validStopOrder = {
      symbol: 'BTC/USDT:USDT',
      type: 'stopMarket' as const,
      side: 'buy' as const,
      amount: 0.1,
      stopPrice: 45000,
    };

    expect(() => OrderRequestSchema.parse(validStopOrder)).not.toThrow();
  });

  test('validates stopLimit order requires both price and stopPrice', () => {
    const stopLimitWithoutStopPrice = {
      symbol: 'BTC/USDT:USDT',
      type: 'stopLimit' as const,
      side: 'buy' as const,
      amount: 0.1,
      price: 50000,
      // Missing stopPrice
    };

    expect(() => OrderRequestSchema.parse(stopLimitWithoutStopPrice)).toThrow(
      /Stop orders require a valid stopPrice/
    );
  });
});

describe('OrderSchema', () => {
  test('validates complete order', () => {
    const validOrder = {
      id: '12345',
      symbol: 'BTC/USDT:USDT',
      type: 'limit' as const,
      side: 'buy' as const,
      amount: 0.1,
      price: 50000,
      status: 'open' as const,
      filled: 0,
      remaining: 0.1,
      reduceOnly: false,
      postOnly: false,
      timestamp: Date.now(),
    };

    expect(() => OrderSchema.parse(validOrder)).not.toThrow();
  });
});

describe('PositionSchema', () => {
  test('validates long position', () => {
    const validPosition = {
      symbol: 'BTC/USDT:USDT',
      side: 'long' as const,
      size: 0.5,
      entryPrice: 50000,
      markPrice: 51000,
      liquidationPrice: 45000,
      unrealizedPnl: 500,
      realizedPnl: 0,
      leverage: 10,
      marginMode: 'cross' as const,
      margin: 2500,
      maintenanceMargin: 250,
      marginRatio: 0.1,
      timestamp: Date.now(),
    };

    expect(() => PositionSchema.parse(validPosition)).not.toThrow();
  });

  test('rejects negative size', () => {
    const invalidPosition = {
      symbol: 'BTC/USDT:USDT',
      side: 'long' as const,
      size: -0.5,
      entryPrice: 50000,
      markPrice: 51000,
      liquidationPrice: 45000,
      unrealizedPnl: 500,
      realizedPnl: 0,
      leverage: 10,
      marginMode: 'cross' as const,
      margin: 2500,
      maintenanceMargin: 250,
      marginRatio: 0.1,
      timestamp: Date.now(),
    };

    expect(() => PositionSchema.parse(invalidPosition)).toThrow();
  });
});

describe('MarketSchema', () => {
  test('validates complete market', () => {
    const validMarket = {
      id: '1',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      minAmount: 0.001,
      pricePrecision: 2,
      amountPrecision: 3,
      priceTickSize: 0.01,
      amountStepSize: 0.001,
      makerFee: 0.0002,
      takerFee: 0.0005,
      maxLeverage: 50,
      fundingIntervalHours: 8,
    };

    expect(() => MarketSchema.parse(validMarket)).not.toThrow();
  });
});

describe('OrderBookSchema', () => {
  test('validates order book with bids and asks', () => {
    const validOrderBook = {
      symbol: 'BTC/USDT:USDT',
      timestamp: Date.now(),
      bids: [
        [50000, 1.5],
        [49999, 2.0],
      ],
      asks: [
        [50001, 1.2],
        [50002, 1.8],
      ],
      exchange: 'hyperliquid',
    };

    expect(() => OrderBookSchema.parse(validOrderBook)).not.toThrow();
  });

  test('rejects negative prices', () => {
    const invalidOrderBook = {
      symbol: 'BTC/USDT:USDT',
      timestamp: Date.now(),
      bids: [[-50000, 1.5]],
      asks: [[50001, 1.2]],
      exchange: 'hyperliquid',
    };

    expect(() => OrderBookSchema.parse(invalidOrderBook)).toThrow();
  });
});

describe('Validation Helpers', () => {
  test('validateData returns parsed data on success', () => {
    const data = {
      symbol: 'BTC/USDT:USDT',
      timestamp: Date.now(),
      bids: [[50000, 1.5]],
      asks: [[50001, 1.2]],
      exchange: 'hyperliquid',
    };

    const result = validateData(OrderBookSchema, data);

    expect(result).toEqual(data);
  });

  test('validateData throws on validation error', () => {
    const invalidData = {
      symbol: '',
      timestamp: Date.now(),
      bids: [],
      asks: [],
      exchange: 'hyperliquid',
    };

    expect(() => validateData(OrderBookSchema, invalidData)).toThrow();
  });

  test('validateData includes context in error message', () => {
    const invalidData = {
      symbol: '',
      timestamp: Date.now(),
      bids: [],
      asks: [],
      exchange: 'hyperliquid',
    };

    expect(() => validateData(OrderBookSchema, invalidData, 'TestContext')).toThrow(/TestContext/);
  });

  test('validateArray validates array of items', () => {
    const data = [
      {
        symbol: 'BTC/USDT:USDT',
        timestamp: Date.now(),
        bids: [[50000, 1.5]],
        asks: [[50001, 1.2]],
        exchange: 'hyperliquid',
      },
      {
        symbol: 'ETH/USDT:USDT',
        timestamp: Date.now(),
        bids: [[3000, 10]],
        asks: [[3001, 12]],
        exchange: 'hyperliquid',
      },
    ];

    const result = validateArray(OrderBookSchema, data);

    expect(result).toHaveLength(2);
    expect(result[0]?.symbol).toBe('BTC/USDT:USDT');
  });
});
