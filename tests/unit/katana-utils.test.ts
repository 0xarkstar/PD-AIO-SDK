/**
 * Katana Utilities Unit Tests
 */

import {
  normalizeSymbol,
  toKatanaSymbol,
  formatDecimal,
  parseDecimal,
  normalizeMarket,
  normalizeOrder,
  normalizePosition,
  normalizeBalance,
  normalizeOrderBook,
  normalizeTrade,
  normalizeFill,
  normalizeTicker,
  normalizeFundingRate,
  convertOrderRequest,
  mapError,
} from '../../src/adapters/katana/utils.js';
import type {
  KatanaMarket,
  KatanaOrder,
  KatanaPosition,
  KatanaWallet,
  KatanaOrderBook,
  KatanaTrade,
  KatanaFill,
  KatanaTicker,
  KatanaFundingRate,
} from '../../src/adapters/katana/types.js';
import { KATANA_FUNDING_INTERVAL_HOURS, KATANA_NULL_ADDRESS, KATANA_ZERO_DECIMAL } from '../../src/adapters/katana/constants.js';
import {
  InsufficientMarginError,
  InvalidOrderError,
  InvalidSignatureError,
  RateLimitError,
  PerpDEXError,
} from '../../src/types/errors.js';
import type { OrderRequest } from '../../src/types/common.js';

// -- Symbol conversion --

describe('normalizeSymbol', () => {
  test('converts ETH-USD to ETH/USD:USD', () => {
    expect(normalizeSymbol('ETH-USD')).toBe('ETH/USD:USD');
  });

  test('converts BTC-USD to BTC/USD:USD', () => {
    expect(normalizeSymbol('BTC-USD')).toBe('BTC/USD:USD');
  });

  test('converts SOL-USD to SOL/USD:USD', () => {
    expect(normalizeSymbol('SOL-USD')).toBe('SOL/USD:USD');
  });
});

describe('toKatanaSymbol', () => {
  test('converts ETH/USD:USD to ETH-USD', () => {
    expect(toKatanaSymbol('ETH/USD:USD')).toBe('ETH-USD');
  });

  test('converts BTC/USD:USD to BTC-USD', () => {
    expect(toKatanaSymbol('BTC/USD:USD')).toBe('BTC-USD');
  });

  test('converts SOL/USD:USD to SOL-USD', () => {
    expect(toKatanaSymbol('SOL/USD:USD')).toBe('SOL-USD');
  });
});

describe('Symbol round-trip', () => {
  test('normalizeSymbol(toKatanaSymbol(x)) === x for ETH/USD:USD', () => {
    const unified = 'ETH/USD:USD';
    expect(normalizeSymbol(toKatanaSymbol(unified))).toBe(unified);
  });

  test('normalizeSymbol(toKatanaSymbol(x)) === x for BTC/USD:USD', () => {
    const unified = 'BTC/USD:USD';
    expect(normalizeSymbol(toKatanaSymbol(unified))).toBe(unified);
  });

  test('toKatanaSymbol(normalizeSymbol(x)) === x for ETH-USD', () => {
    const katana = 'ETH-USD';
    expect(toKatanaSymbol(normalizeSymbol(katana))).toBe(katana);
  });
});

// -- Number formatting --

describe('formatDecimal', () => {
  test('formats integer price with 8 decimal zeros', () => {
    expect(formatDecimal(1850)).toBe('1850.00000000');
  });

  test('formats 0.5 with 8 decimal places', () => {
    expect(formatDecimal(0.5)).toBe('0.50000000');
  });

  test('formats zero as 0.00000000', () => {
    expect(formatDecimal(0)).toBe('0.00000000');
  });

  test('formats dust value 1e-8 correctly', () => {
    expect(formatDecimal(0.00000001)).toBe('0.00000001');
  });

  test('formats large price with 8 decimals', () => {
    expect(formatDecimal(100000)).toBe('100000.00000000');
  });
});

describe('parseDecimal', () => {
  test('parses "1850.00000000" to 1850', () => {
    expect(parseDecimal('1850.00000000')).toBe(1850);
  });

  test('parses "0.00000000" to 0', () => {
    expect(parseDecimal('0.00000000')).toBe(0);
  });

  test('parses "0.00000001" to 1e-8', () => {
    expect(parseDecimal('0.00000001')).toBe(1e-8);
  });

  test('returns 0 for empty string', () => {
    expect(parseDecimal('')).toBe(0);
  });

  test('parses "0.50000000" to 0.5', () => {
    expect(parseDecimal('0.50000000')).toBe(0.5);
  });
});

describe('Number round-trip', () => {
  test('formatDecimal(parseDecimal(x)) preserves value for price string', () => {
    const original = '1850.12345678';
    expect(formatDecimal(parseDecimal(original))).toBe(original);
  });

  test('formatDecimal(parseDecimal("0.00000001")) preserves dust value', () => {
    const original = '0.00000001';
    expect(formatDecimal(parseDecimal(original))).toBe(original);
  });

  test('formatDecimal(parseDecimal("0.00000000")) is KATANA_ZERO_DECIMAL', () => {
    expect(formatDecimal(parseDecimal(KATANA_ZERO_DECIMAL))).toBe(KATANA_ZERO_DECIMAL);
  });
});

// -- normalizeMarket --

describe('normalizeMarket', () => {
  const rawMarket: KatanaMarket = {
    market: 'ETH-USD',
    type: 'perpetual',
    status: 'active',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    stepSize: '0.00100000',
    tickSize: '0.10000000',
    indexPrice: '1850.00000000',
    indexPrice24h: '1820.00000000',
    indexPricePercentChange: '0.01644756',
    lastFundingRate: '0.00001000',
    currentFundingRate: '0.00001100',
    nextFundingTime: 1700000000000,
    makerOrderMinimum: '1.00000000',
    takerOrderMinimum: '1.00000000',
    marketOrderExecutionPriceLimit: '0.05000000',
    limitOrderExecutionPriceLimit: '0.10000000',
    minimumPositionSize: '0.00100000',
    maximumPositionSize: '1000.00000000',
    initialMarginFraction: '0.05000000',
    maintenanceMarginFraction: '0.03000000',
    basePositionSize: '100.00000000',
    incrementalPositionSize: '50.00000000',
    incrementalInitialMarginFraction: '0.01000000',
    makerFeeRate: '0.00010000',
    takerFeeRate: '0.00040000',
    volume24h: '500000.00000000',
    trades24h: 1200,
    openInterest: '10000.00000000',
  };

  test('sets id to raw market string', () => {
    expect(normalizeMarket(rawMarket).id).toBe('ETH-USD');
  });

  test('converts symbol to unified format', () => {
    expect(normalizeMarket(rawMarket).symbol).toBe('ETH/USD:USD');
  });

  test('sets base and quote correctly', () => {
    const market = normalizeMarket(rawMarket);
    expect(market.base).toBe('ETH');
    expect(market.quote).toBe('USD');
    expect(market.settle).toBe('USD');
  });

  test('active is true when status is active', () => {
    expect(normalizeMarket(rawMarket).active).toBe(true);
  });

  test('active is false when status is not active', () => {
    const inactive = { ...rawMarket, status: 'inactive' };
    expect(normalizeMarket(inactive).active).toBe(false);
  });

  test('computes maxLeverage from initialMarginFraction', () => {
    // 1 / 0.05 = 20
    expect(normalizeMarket(rawMarket).maxLeverage).toBe(20);
  });

  test('minAmount parsed from takerOrderMinimum', () => {
    expect(normalizeMarket(rawMarket).minAmount).toBe(1);
  });

  test('makerFee and takerFee parsed correctly', () => {
    const market = normalizeMarket(rawMarket);
    expect(market.makerFee).toBeCloseTo(0.0001, 6);
    expect(market.takerFee).toBeCloseTo(0.0004, 6);
  });

  test('fundingIntervalHours matches constant', () => {
    expect(normalizeMarket(rawMarket).fundingIntervalHours).toBe(KATANA_FUNDING_INTERVAL_HOURS);
  });

  test('pricePrecision from tickSize decimal places', () => {
    // tickSize "0.10000000" → 1 significant decimal
    expect(normalizeMarket(rawMarket).pricePrecision).toBe(1);
  });

  test('amountPrecision from stepSize decimal places', () => {
    // stepSize "0.00100000" → 3 significant decimals
    expect(normalizeMarket(rawMarket).amountPrecision).toBe(3);
  });
});

// -- normalizeOrder --

describe('normalizeOrder', () => {
  const rawOrder: KatanaOrder = {
    orderId: 'order-abc-123',
    clientOrderId: 'client-xyz',
    market: 'ETH-USD',
    type: 1, // limit
    side: 0, // buy
    state: 'active',
    quantity: '1.00000000',
    filledQuantity: '0.50000000',
    limitPrice: '1850.00000000',
    triggerPrice: KATANA_ZERO_DECIMAL,
    time: 1700000000000,
    fees: '0.00074000',
    createdAt: 1699999990000,
  };

  test('sets id from orderId', () => {
    expect(normalizeOrder(rawOrder).id).toBe('order-abc-123');
  });

  test('sets clientOrderId', () => {
    expect(normalizeOrder(rawOrder).clientOrderId).toBe('client-xyz');
  });

  test('converts symbol to unified format', () => {
    expect(normalizeOrder(rawOrder).symbol).toBe('ETH/USD:USD');
  });

  test('type 1 maps to limit', () => {
    expect(normalizeOrder(rawOrder).type).toBe('limit');
  });

  test('side 0 maps to buy', () => {
    expect(normalizeOrder(rawOrder).side).toBe('buy');
  });

  test('side 1 maps to sell', () => {
    const sellOrder = { ...rawOrder, side: 1 };
    expect(normalizeOrder(sellOrder).side).toBe('sell');
  });

  test('type 0 maps to market', () => {
    const marketOrder = { ...rawOrder, type: 0 };
    expect(normalizeOrder(marketOrder).type).toBe('market');
  });

  test('amount parsed from quantity', () => {
    expect(normalizeOrder(rawOrder).amount).toBe(1);
  });

  test('filled parsed from filledQuantity', () => {
    expect(normalizeOrder(rawOrder).filled).toBe(0.5);
  });

  test('remaining is amount minus filled', () => {
    expect(normalizeOrder(rawOrder).remaining).toBe(0.5);
  });

  test('status active maps to open', () => {
    expect(normalizeOrder(rawOrder).status).toBe('open');
  });

  test('status filled maps to closed', () => {
    const filledOrder = { ...rawOrder, state: 'filled' };
    expect(normalizeOrder(filledOrder).status).toBe('closed');
  });

  test('status canceled maps to canceled', () => {
    const canceledOrder = { ...rawOrder, state: 'canceled' };
    expect(normalizeOrder(canceledOrder).status).toBe('canceled');
  });

  test('reduceOnly and postOnly default to false', () => {
    const order = normalizeOrder(rawOrder);
    expect(order.reduceOnly).toBe(false);
    expect(order.postOnly).toBe(false);
  });

  test('limitPrice set to undefined when zero decimal', () => {
    const marketOrder = { ...rawOrder, type: 0, limitPrice: KATANA_ZERO_DECIMAL };
    expect(normalizeOrder(marketOrder).price).toBeUndefined();
  });

  test('limitPrice parsed when non-zero', () => {
    expect(normalizeOrder(rawOrder).price).toBe(1850);
  });
});

// -- normalizePosition --

describe('normalizePosition', () => {
  const rawPosition: KatanaPosition = {
    market: 'ETH-USD',
    quantity: '2.00000000',
    maximumQuantity: '100.00000000',
    entryPrice: '1800.00000000',
    exitPrice: KATANA_ZERO_DECIMAL,
    markPrice: '1850.00000000',
    indexPrice: '1849.00000000',
    liquidationPrice: '1500.00000000',
    value: '3700.00000000',
    realizedPnL: '50.00000000',
    unrealizedPnL: '100.00000000',
    marginRequirement: '185.00000000',
    leverage: '10.00000000',
    totalFunding: '0.10000000',
    totalOpen: '1800.00000000',
    totalClose: KATANA_ZERO_DECIMAL,
    adlQuintile: 2,
    openedByFillId: 'fill-001',
    lastFillId: 'fill-002',
    time: 1700000000000,
  };

  test('positive quantity produces long side', () => {
    expect(normalizePosition(rawPosition).side).toBe('long');
  });

  test('negative quantity produces short side', () => {
    const shortPos = { ...rawPosition, quantity: '-2.00000000' };
    expect(normalizePosition(shortPos).side).toBe('short');
  });

  test('size is absolute value of quantity', () => {
    const shortPos = { ...rawPosition, quantity: '-2.00000000' };
    expect(normalizePosition(shortPos).size).toBe(2);
  });

  test('entryPrice parsed correctly', () => {
    expect(normalizePosition(rawPosition).entryPrice).toBe(1800);
  });

  test('markPrice parsed correctly', () => {
    expect(normalizePosition(rawPosition).markPrice).toBe(1850);
  });

  test('liquidationPrice parsed correctly', () => {
    expect(normalizePosition(rawPosition).liquidationPrice).toBe(1500);
  });

  test('unrealizedPnl parsed correctly', () => {
    expect(normalizePosition(rawPosition).unrealizedPnl).toBe(100);
  });

  test('symbol converted to unified format', () => {
    expect(normalizePosition(rawPosition).symbol).toBe('ETH/USD:USD');
  });

  test('marginMode is cross', () => {
    expect(normalizePosition(rawPosition).marginMode).toBe('cross');
  });

  test('leverage parsed correctly', () => {
    expect(normalizePosition(rawPosition).leverage).toBe(10);
  });
});

// -- normalizeBalance --

describe('normalizeBalance', () => {
  const rawWallet: KatanaWallet = {
    wallet: '0xABCDEF1234567890',
    equity: '10000.00000000',
    freeCollateral: '8000.00000000',
    heldCollateral: '2000.00000000',
    availableCollateral: '8000.00000000',
    buyingPower: '80000.00000000',
    leverage: '10.00000000',
    marginRatio: '0.20000000',
    quoteBalance: '10000.00000000',
    unrealizedPnL: '0.00000000',
    makerFeeRate: '0.00010000',
    takerFeeRate: '0.00040000',
  };

  test('currency is always USDC (vbUSDC → USDC)', () => {
    expect(normalizeBalance(rawWallet).currency).toBe('USDC');
  });

  test('total parsed from equity', () => {
    expect(normalizeBalance(rawWallet).total).toBe(10000);
  });

  test('free parsed from freeCollateral', () => {
    expect(normalizeBalance(rawWallet).free).toBe(8000);
  });

  test('used parsed from heldCollateral', () => {
    expect(normalizeBalance(rawWallet).used).toBe(2000);
  });

  test('info contains raw wallet object', () => {
    expect(normalizeBalance(rawWallet).info).toBeDefined();
  });
});

// -- normalizeOrderBook --

describe('normalizeOrderBook', () => {
  const rawOrderBook: KatanaOrderBook = {
    sequence: 42,
    bids: [
      ['1849.50000000', '1.50000000', 2],
      ['1849.00000000', '3.00000000', 1],
    ],
    asks: [
      ['1850.00000000', '2.00000000', 1],
      ['1850.50000000', '0.50000000', 3],
    ],
    lastPrice: '1849.75000000',
    markPrice: '1849.80000000',
    indexPrice: '1849.70000000',
  };

  test('symbol converted to unified format', () => {
    expect(normalizeOrderBook(rawOrderBook, 'ETH-USD').symbol).toBe('ETH/USD:USD');
  });

  test('exchange is katana', () => {
    expect(normalizeOrderBook(rawOrderBook, 'ETH-USD').exchange).toBe('katana');
  });

  test('bids parsed as [price, qty] tuples', () => {
    const ob = normalizeOrderBook(rawOrderBook, 'ETH-USD');
    expect(ob.bids[0]).toEqual([1849.5, 1.5]);
    expect(ob.bids[1]).toEqual([1849, 3]);
  });

  test('asks parsed as [price, qty] tuples', () => {
    const ob = normalizeOrderBook(rawOrderBook, 'ETH-USD');
    expect(ob.asks[0]).toEqual([1850, 2]);
    expect(ob.asks[1]).toEqual([1850.5, 0.5]);
  });

  test('timestamp is set', () => {
    expect(normalizeOrderBook(rawOrderBook, 'ETH-USD').timestamp).toBeGreaterThan(0);
  });
});

// -- normalizeTrade --

describe('normalizeTrade', () => {
  const rawTrade: KatanaTrade = {
    fillId: 'fill-trade-001',
    market: 'ETH-USD',
    price: '1850.00000000',
    quantity: '0.50000000',
    quoteQuantity: '925.00000000',
    time: 1700000000000,
    side: 'buy',
    sequence: 100,
  };

  test('id from fillId', () => {
    expect(normalizeTrade(rawTrade).id).toBe('fill-trade-001');
  });

  test('symbol converted to unified format', () => {
    expect(normalizeTrade(rawTrade).symbol).toBe('ETH/USD:USD');
  });

  test('side buy preserved', () => {
    expect(normalizeTrade(rawTrade).side).toBe('buy');
  });

  test('side sell preserved', () => {
    const sellTrade = { ...rawTrade, side: 'sell' };
    expect(normalizeTrade(sellTrade).side).toBe('sell');
  });

  test('price parsed correctly', () => {
    expect(normalizeTrade(rawTrade).price).toBe(1850);
  });

  test('amount parsed correctly', () => {
    expect(normalizeTrade(rawTrade).amount).toBe(0.5);
  });

  test('cost is price * amount', () => {
    expect(normalizeTrade(rawTrade).cost).toBeCloseTo(925, 8);
  });

  test('timestamp set from raw.time', () => {
    expect(normalizeTrade(rawTrade).timestamp).toBe(1700000000000);
  });
});

// -- normalizeFill --

describe('normalizeFill', () => {
  const rawFill: KatanaFill = {
    fillId: 'fill-private-001',
    orderId: 'order-abc-123',
    market: 'BTC-USD',
    price: '43000.00000000',
    quantity: '0.10000000',
    quoteQuantity: '4300.00000000',
    side: 'sell',
    time: 1700000001000,
    fee: '1.72000000',
    feeAsset: 'USDC',
    liquidity: 'taker',
    sequence: 200,
  };

  test('id from fillId', () => {
    expect(normalizeFill(rawFill).id).toBe('fill-private-001');
  });

  test('orderId set', () => {
    expect(normalizeFill(rawFill).orderId).toBe('order-abc-123');
  });

  test('symbol converted to unified format', () => {
    expect(normalizeFill(rawFill).symbol).toBe('BTC/USD:USD');
  });

  test('fee cost parsed correctly', () => {
    expect(normalizeFill(rawFill).fee?.cost).toBe(1.72);
  });

  test('fee currency from feeAsset', () => {
    expect(normalizeFill(rawFill).fee?.currency).toBe('USDC');
  });

  test('fee currency defaults to USDC when feeAsset empty', () => {
    const fillNoAsset = { ...rawFill, feeAsset: '' };
    expect(normalizeFill(fillNoAsset).fee?.currency).toBe('USDC');
  });

  test('cost is price * amount', () => {
    expect(normalizeFill(rawFill).cost).toBeCloseTo(4300, 8);
  });
});

// -- normalizeTicker --

describe('normalizeTicker', () => {
  const rawTicker: KatanaTicker = {
    market: 'ETH-USD',
    time: 1700000000000,
    open: '1800.00000000',
    high: '1900.00000000',
    low: '1780.00000000',
    close: '1850.00000000',
    closeQuantity: '0.50000000',
    baseVolume: '10000.00000000',
    quoteVolume: '18500000.00000000',
    percentChange: '0.02777778',
    trades: 5000,
    ask: '1850.50000000',
    bid: '1849.50000000',
    markPrice: '1850.00000000',
    indexPrice: '1849.80000000',
    indexPrice24h: '1800.00000000',
    indexPricePercentChange: '0.02777778',
    lastFundingRate: '0.00001000',
    currentFundingRate: '0.00001100',
    nextFundingTime: 1700028800000,
    openInterest: '50000.00000000',
    sequence: 9999,
  };

  test('symbol converted to unified format', () => {
    expect(normalizeTicker(rawTicker).symbol).toBe('ETH/USD:USD');
  });

  test('last equals close', () => {
    expect(normalizeTicker(rawTicker).last).toBe(1850);
  });

  test('open parsed correctly', () => {
    expect(normalizeTicker(rawTicker).open).toBe(1800);
  });

  test('high parsed correctly', () => {
    expect(normalizeTicker(rawTicker).high).toBe(1900);
  });

  test('low parsed correctly', () => {
    expect(normalizeTicker(rawTicker).low).toBe(1780);
  });

  test('bid parsed correctly', () => {
    expect(normalizeTicker(rawTicker).bid).toBe(1849.5);
  });

  test('ask parsed correctly', () => {
    expect(normalizeTicker(rawTicker).ask).toBe(1850.5);
  });

  test('percentage parsed from percentChange', () => {
    expect(normalizeTicker(rawTicker).percentage).toBeCloseTo(0.027777, 5);
  });

  test('baseVolume parsed correctly', () => {
    expect(normalizeTicker(rawTicker).baseVolume).toBe(10000);
  });

  test('quoteVolume parsed correctly', () => {
    expect(normalizeTicker(rawTicker).quoteVolume).toBe(18500000);
  });

  test('timestamp set from raw.time', () => {
    expect(normalizeTicker(rawTicker).timestamp).toBe(1700000000000);
  });
});

// -- normalizeFundingRate --

describe('normalizeFundingRate', () => {
  const rawFundingRate: KatanaFundingRate = {
    market: 'ETH-USD',
    rate: '0.00001000',
    time: 1700000000000,
  };

  test('symbol converted to unified format', () => {
    expect(normalizeFundingRate(rawFundingRate).symbol).toBe('ETH/USD:USD');
  });

  test('fundingRate parsed from rate', () => {
    expect(normalizeFundingRate(rawFundingRate).fundingRate).toBe(0.00001);
  });

  test('fundingTimestamp equals raw.time', () => {
    expect(normalizeFundingRate(rawFundingRate).fundingTimestamp).toBe(1700000000000);
  });

  test('nextFundingTimestamp is time + 8 hours in ms', () => {
    const expectedNext = 1700000000000 + 8 * 3600000;
    expect(normalizeFundingRate(rawFundingRate).nextFundingTimestamp).toBe(expectedNext);
  });

  test('fundingIntervalHours matches KATANA_FUNDING_INTERVAL_HOURS constant', () => {
    expect(normalizeFundingRate(rawFundingRate).fundingIntervalHours).toBe(KATANA_FUNDING_INTERVAL_HOURS);
  });
});

// -- convertOrderRequest --

describe('convertOrderRequest', () => {
  const wallet = '0xDeAdBeEf1234567890AbCdEf1234567890AbCdEf';
  const nonce = 'nonce-uuid-v1-001';

  test('market buy order: type=0, side=0', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'market',
      side: 'buy',
      amount: 1,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.type).toBe(0); // market
    expect(payload.side).toBe(0); // buy
  });

  test('limit sell order: type=1, side=1', () => {
    const request: OrderRequest = {
      symbol: 'BTC/USD:USD',
      type: 'limit',
      side: 'sell',
      amount: 0.5,
      price: 43000,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.type).toBe(1); // limit
    expect(payload.side).toBe(1); // sell
  });

  test('limit order: market converted to katana format', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'limit',
      side: 'buy',
      amount: 2,
      price: 1850,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.market).toBe('ETH-USD');
  });

  test('quantity is zero-padded 8-decimal string', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'market',
      side: 'buy',
      amount: 0.5,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.quantity).toBe('0.50000000');
  });

  test('limitPrice is zero decimal for market orders', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'market',
      side: 'buy',
      amount: 1,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.limitPrice).toBe(KATANA_ZERO_DECIMAL);
  });

  test('stop market order sets triggerPrice and triggerType=1', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'stopMarket',
      side: 'sell',
      amount: 1,
      stopPrice: 1700,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.triggerPrice).toBe('1700.00000000');
    expect(payload.triggerType).toBe(1); // index
    expect(payload.type).toBe(2); // stopMarket
  });

  test('reduceOnly flag propagated', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'market',
      side: 'sell',
      amount: 1,
      reduceOnly: true,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.isReduceOnly).toBe(true);
  });

  test('delegatedPublicKey is null address when not set', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'market',
      side: 'buy',
      amount: 1,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.delegatedPublicKey).toBe(KATANA_NULL_ADDRESS);
  });

  test('wallet and nonce set in payload', () => {
    const request: OrderRequest = {
      symbol: 'ETH/USD:USD',
      type: 'limit',
      side: 'buy',
      amount: 1,
      price: 1850,
    };
    const payload = convertOrderRequest(request, wallet, nonce);
    expect(payload.wallet).toBe(wallet);
    expect(payload.nonce).toBe(nonce);
  });
});

// -- mapError --

describe('mapError', () => {
  test('"insufficient margin" maps to InsufficientMarginError', () => {
    const err = mapError({ message: 'insufficient margin for this order' });
    expect(err).toBeInstanceOf(InsufficientMarginError);
  });

  test('"invalid order" maps to InvalidOrderError', () => {
    const err = mapError({ message: 'invalid order parameters provided' });
    expect(err).toBeInstanceOf(InvalidOrderError);
  });

  test('"invalid parameter" maps to InvalidOrderError', () => {
    const err = mapError({ message: 'invalid parameter: quantity' });
    expect(err).toBeInstanceOf(InvalidOrderError);
  });

  test('"signature" maps to InvalidSignatureError', () => {
    const err = mapError({ message: 'signature verification failed' });
    expect(err).toBeInstanceOf(InvalidSignatureError);
  });

  test('"unauthorized" maps to InvalidSignatureError', () => {
    const err = mapError({ message: 'unauthorized request' });
    expect(err).toBeInstanceOf(InvalidSignatureError);
  });

  test('"rate limit" maps to RateLimitError', () => {
    const err = mapError({ message: 'rate limit exceeded' });
    expect(err).toBeInstanceOf(RateLimitError);
  });

  test('"too many" maps to RateLimitError', () => {
    const err = mapError({ message: 'too many requests' });
    expect(err).toBeInstanceOf(RateLimitError);
  });

  test('PerpDEXError instance is passed through unchanged', () => {
    const original = new PerpDEXError('custom error', 'CUSTOM', 'katana', undefined);
    const result = mapError(original);
    expect(result).toBe(original);
  });

  test('unknown error object maps to PerpDEXError', () => {
    const err = mapError({ message: 'something completely unexpected' });
    expect(err).toBeInstanceOf(PerpDEXError);
  });

  test('non-object error maps to PerpDEXError', () => {
    const err = mapError('raw string error');
    expect(err).toBeInstanceOf(PerpDEXError);
  });
});
