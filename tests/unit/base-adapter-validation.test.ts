/**
 * BaseAdapter Validation & Correlation ID Tests
 *
 * Tests for the new validation and correlation ID functionality in BaseAdapter
 */

import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import { BadRequestError, PerpDEXError, InvalidOrderError } from '../../src/types/errors.js';
import type {
  FeatureMap,
  Market,
  Ticker,
  OrderBook,
  Trade,
  FundingRate,
  Position,
  Balance,
  Order,
  OrderRequest,
} from '../../src/types/index.js';

// Create a concrete test adapter to test protected methods
class TestAdapter extends BaseAdapter {
  readonly id = 'test';
  readonly name = 'Test Adapter';
  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
  };

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  // Expose protected methods for testing
  public testValidateOrder(request: OrderRequest, correlationId?: string): OrderRequest {
    return this.validateOrder(request, correlationId);
  }

  public testAttachCorrelationId(error: unknown, correlationId: string): Error {
    return this.attachCorrelationId(error, correlationId);
  }

  public testGetValidator() {
    return this.getValidator();
  }

  async fetchMarkets(): Promise<Market[]> {
    return [];
  }

  protected async _fetchTicker(symbol: string): Promise<Ticker> {
    return {
      symbol,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      high: 0,
      low: 0,
      bid: 0,
      ask: 0,
      last: 0,
      close: 0,
      baseVolume: 0,
      quoteVolume: 0,
      info: {},
    };
  }

  protected async _fetchOrderBook(symbol: string): Promise<OrderBook> {
    return { symbol, bids: [], asks: [], timestamp: Date.now() };
  }

  protected async _fetchTrades(symbol: string): Promise<Trade[]> {
    return [];
  }

  protected async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    return {
      symbol,
      fundingRate: 0,
      fundingTimestamp: Date.now(),
      nextFundingTimestamp: Date.now() + 3600000,
      info: {},
    };
  }

  async fetchFundingRateHistory(): Promise<FundingRate[]> {
    return [];
  }

  async fetchPositions(): Promise<Position[]> {
    return [];
  }

  async fetchBalance(): Promise<Balance[]> {
    return [];
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    // Use validation
    const validated = this.validateOrder(request);
    throw new Error('Not implemented');
  }

  async cancelOrder(orderId: string): Promise<Order> {
    throw new Error('Not implemented');
  }

  async cancelAllOrders(): Promise<Order[]> {
    return [];
  }

  async fetchOrderHistory(): Promise<Order[]> {
    return [];
  }

  async fetchMyTrades(): Promise<Trade[]> {
    return [];
  }

  protected async _setLeverage(symbol: string, leverage: number): Promise<void> {
    // No-op
  }

  protected symbolToExchange(symbol: string): string {
    return symbol;
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return exchangeSymbol;
  }
}

describe('BaseAdapter.validateOrder', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  test('validates a valid limit order', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
    };

    const result = adapter.testValidateOrder(request);

    expect(result.symbol).toBe('BTC/USDT:USDT');
    expect(result.type).toBe('limit');
    expect(result.side).toBe('buy');
    expect(result.amount).toBe(0.1);
    expect(result.price).toBe(50000);
  });

  test('validates a valid market order', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USDT:USDT',
      type: 'market',
      side: 'sell',
      amount: 1.5,
    };

    const result = adapter.testValidateOrder(request);

    expect(result.symbol).toBe('ETH/USDT:USDT');
    expect(result.type).toBe('market');
    expect(result.side).toBe('sell');
    expect(result.amount).toBe(1.5);
  });

  test('throws for missing symbol', () => {
    const request = {
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
    } as OrderRequest;

    expect(() => adapter.testValidateOrder(request)).toThrow();
  });

  test('throws for invalid order type', () => {
    const request = {
      symbol: 'BTC/USDT:USDT',
      type: 'invalid' as any,
      side: 'buy',
      amount: 0.1,
    } as OrderRequest;

    expect(() => adapter.testValidateOrder(request)).toThrow();
  });

  test('throws for limit order without price', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      // Missing price
    };

    expect(() => adapter.testValidateOrder(request)).toThrow(/price/i);
  });

  test('throws for negative amount', () => {
    const request = {
      symbol: 'BTC/USDT:USDT',
      type: 'market',
      side: 'buy',
      amount: -0.1,
    } as OrderRequest;

    expect(() => adapter.testValidateOrder(request)).toThrow();
  });

  test('throws for zero amount', () => {
    const request = {
      symbol: 'BTC/USDT:USDT',
      type: 'market',
      side: 'buy',
      amount: 0,
    } as OrderRequest;

    expect(() => adapter.testValidateOrder(request)).toThrow();
  });

  test('throws InvalidOrderError on validation failure', () => {
    const request = {
      symbol: '',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
    } as OrderRequest;

    expect(() => adapter.testValidateOrder(request)).toThrow(InvalidOrderError);
  });
});

describe('BaseAdapter.attachCorrelationId', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  test('attaches correlation ID to PerpDEXError', () => {
    const originalError = new PerpDEXError('Test error', 'TEST_CODE', 'test');
    const correlationId = 'corr-123-abc';

    const result = adapter.testAttachCorrelationId(originalError, correlationId);

    expect(result).toBe(originalError);
    expect((result as PerpDEXError).correlationId).toBe(correlationId);
  });

  test('wraps non-PerpDEXError in PerpDEXError', () => {
    const originalError = new Error('Regular error');
    const correlationId = 'corr-456-def';

    const result = adapter.testAttachCorrelationId(originalError, correlationId);

    expect(result).toBeInstanceOf(PerpDEXError);
    expect((result as PerpDEXError).correlationId).toBe(correlationId);
    expect((result as PerpDEXError).code).toBe('REQUEST_ERROR');
    expect((result as PerpDEXError).exchange).toBe('test');
    expect(result.message).toBe('Regular error');
  });

  test('wraps string error', () => {
    const correlationId = 'corr-789-ghi';

    const result = adapter.testAttachCorrelationId('String error', correlationId);

    expect(result).toBeInstanceOf(PerpDEXError);
    expect((result as PerpDEXError).correlationId).toBe(correlationId);
    expect(result.message).toBe('String error');
  });

  test('preserves original error in wrapped PerpDEXError', () => {
    const originalError = new TypeError('Type error');
    const correlationId = 'corr-abc-123';

    const result = adapter.testAttachCorrelationId(originalError, correlationId);

    expect(result).toBeInstanceOf(PerpDEXError);
    expect((result as PerpDEXError).originalError).toBe(originalError);
  });
});

describe('BaseAdapter.getValidator', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  test('returns a validator object', () => {
    const validator = adapter.testGetValidator();

    expect(validator).toBeDefined();
    expect(typeof validator.validate).toBe('function');
    expect(typeof validator.orderRequest).toBe('function');
    expect(typeof validator.orderBookParams).toBe('function');
    expect(typeof validator.tradeParams).toBe('function');
  });

  test('validator.orderRequest validates orders', () => {
    const validator = adapter.testGetValidator();

    const validOrder: OrderRequest = {
      symbol: 'BTC/USDT:USDT',
      type: 'market',
      side: 'buy',
      amount: 1,
    };

    const result = validator.orderRequest(validOrder);
    expect(result.symbol).toBe('BTC/USDT:USDT');
  });

  test('validator throws for invalid data', () => {
    const validator = adapter.testGetValidator();

    expect(() => validator.orderRequest({ invalid: 'data' })).toThrow();
  });
});

describe('BaseAdapter Symbol Validation', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('fetchTicker symbol validation', () => {
    test('accepts valid symbol formats', async () => {
      const validSymbols = [
        'BTC/USD',
        'BTC/USD:USD',
        'ETH/USDT',
        '1000PEPE/USDT:USDT',
        'btc/usd', // Case-insensitive
      ];

      for (const symbol of validSymbols) {
        await expect(adapter.fetchTicker(symbol)).resolves.toBeDefined();
      }
    });

    test('throws BadRequestError for empty symbol', async () => {
      await expect(adapter.fetchTicker('')).rejects.toThrow(BadRequestError);
      await expect(adapter.fetchTicker('')).rejects.toThrow('Symbol is required');
    });

    test('throws BadRequestError for invalid symbol format', async () => {
      const invalidSymbols = [
        'BTCUSD', // Missing separator
        'BTC-USD', // Wrong separator
        'BTC/', // Incomplete
        '/USD', // Incomplete
        'BTC/USD/EUR', // Too many parts
      ];

      for (const symbol of invalidSymbols) {
        await expect(adapter.fetchTicker(symbol)).rejects.toThrow(BadRequestError);
        await expect(adapter.fetchTicker(symbol)).rejects.toThrow('Invalid symbol format');
      }
    });

    test('throws BadRequestError for non-string symbol', async () => {
      await expect(adapter.fetchTicker(null as any)).rejects.toThrow(BadRequestError);
      await expect(adapter.fetchTicker(undefined as any)).rejects.toThrow(BadRequestError);
      await expect(adapter.fetchTicker(123 as any)).rejects.toThrow(BadRequestError);
    });
  });

  describe('fetchOrderBook symbol validation', () => {
    test('validates symbol before fetching', async () => {
      await expect(adapter.fetchOrderBook('BTC/USD')).resolves.toBeDefined();
      await expect(adapter.fetchOrderBook('')).rejects.toThrow(BadRequestError);
      await expect(adapter.fetchOrderBook('INVALID')).rejects.toThrow(BadRequestError);
    });
  });

  describe('fetchTrades symbol validation', () => {
    test('validates symbol before fetching', async () => {
      await expect(adapter.fetchTrades('ETH/USDT:USDT')).resolves.toBeDefined();
      await expect(adapter.fetchTrades('')).rejects.toThrow(BadRequestError);
    });
  });

  describe('fetchFundingRate symbol validation', () => {
    test('validates symbol before fetching', async () => {
      await expect(adapter.fetchFundingRate('SOL/USD')).resolves.toBeDefined();
      await expect(adapter.fetchFundingRate('INVALID-FORMAT')).rejects.toThrow(BadRequestError);
    });
  });
});

describe('BaseAdapter Leverage Validation', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  test('accepts valid leverage values', async () => {
    const validLeverages = [1, 2, 5, 10, 20, 50, 100, 200];

    for (const leverage of validLeverages) {
      await expect(adapter.setLeverage('BTC/USD', leverage)).resolves.toBeUndefined();
    }
  });

  test('throws InvalidOrderError for leverage = 0', async () => {
    await expect(adapter.setLeverage('BTC/USD', 0)).rejects.toThrow(InvalidOrderError);
    await expect(adapter.setLeverage('BTC/USD', 0)).rejects.toThrow('Invalid leverage');
  });

  test('throws InvalidOrderError for negative leverage', async () => {
    await expect(adapter.setLeverage('BTC/USD', -5)).rejects.toThrow(InvalidOrderError);
    await expect(adapter.setLeverage('BTC/USD', -10)).rejects.toThrow(InvalidOrderError);
  });

  test('throws InvalidOrderError for leverage > 200', async () => {
    await expect(adapter.setLeverage('BTC/USD', 201)).rejects.toThrow(InvalidOrderError);
    await expect(adapter.setLeverage('BTC/USD', 500)).rejects.toThrow(InvalidOrderError);
    await expect(adapter.setLeverage('BTC/USD', 1000)).rejects.toThrow(InvalidOrderError);
  });

  test('throws InvalidOrderError for NaN leverage', async () => {
    await expect(adapter.setLeverage('BTC/USD', NaN)).rejects.toThrow(InvalidOrderError);
  });

  test('throws InvalidOrderError for non-number leverage', async () => {
    await expect(adapter.setLeverage('BTC/USD', '10' as any)).rejects.toThrow(InvalidOrderError);
    await expect(adapter.setLeverage('BTC/USD', null as any)).rejects.toThrow(InvalidOrderError);
    await expect(adapter.setLeverage('BTC/USD', undefined as any)).rejects.toThrow(InvalidOrderError);
  });

  test('validates symbol in addition to leverage', async () => {
    await expect(adapter.setLeverage('', 10)).rejects.toThrow(BadRequestError);
    await expect(adapter.setLeverage('INVALID', 10)).rejects.toThrow(BadRequestError);
  });

  test('error message includes leverage value and range', async () => {
    await expect(adapter.setLeverage('BTC/USD', 500)).rejects.toThrow(/500/);
    await expect(adapter.setLeverage('BTC/USD', 500)).rejects.toThrow(/between 0 and 200/);
  });
});
