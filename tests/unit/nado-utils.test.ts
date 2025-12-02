/**
 * Nado Utilities Unit Tests
 */

import { ethers } from 'ethers';
import {
  nadoSymbolToCCXT,
  ccxtSymbolToNado,
  productIdToVerifyingContract,
  normalizeNadoProduct,
  normalizeNadoOrder,
  normalizeNadoPosition,
  normalizeNadoBalance,
  normalizeNadoTrade,
  normalizeNadoTicker,
  normalizeNadoOrderBook,
  toX18,
  fromX18,
  createNadoEIP712Domain,
  signNadoOrder,
} from '../../src/adapters/nado/utils.js';
import { NADO_ORDER_SIDES, NADO_EIP712_DOMAIN } from '../../src/adapters/nado/constants.js';
import type {
  NadoProduct,
  NadoOrder,
  NadoPosition,
  NadoBalance,
  NadoTrade,
  NadoTicker,
  NadoOrderBook,
  NadoEIP712Order,
  ProductMapping,
} from '../../src/adapters/nado/types.js';

describe('Symbol Conversion', () => {
  test('converts Nado perpetual symbol to CCXT format', () => {
    expect(nadoSymbolToCCXT('BTC-PERP')).toBe('BTC/USDT:USDT');
    expect(nadoSymbolToCCXT('ETH-PERP')).toBe('ETH/USDT:USDT');
    expect(nadoSymbolToCCXT('SOL-PERP')).toBe('SOL/USDT:USDT');
  });

  test('converts Nado spot symbol to CCXT format', () => {
    expect(nadoSymbolToCCXT('BTC-USDT')).toBe('BTC/USDT');
    expect(nadoSymbolToCCXT('ETH-USDC')).toBe('ETH/USDC');
  });

  test('handles fallback for unknown format', () => {
    expect(nadoSymbolToCCXT('BTC')).toBe('BTC/USDT:USDT');
  });

  test('converts CCXT perpetual symbol to Nado format', () => {
    expect(ccxtSymbolToNado('BTC/USDT:USDT')).toBe('BTC-PERP');
    expect(ccxtSymbolToNado('ETH/USDC:USDC')).toBe('ETH-PERP');
  });

  test('converts CCXT spot symbol to Nado format', () => {
    expect(ccxtSymbolToNado('BTC/USDT')).toBe('BTC-USDT');
    expect(ccxtSymbolToNado('ETH/USDC')).toBe('ETH-USDC');
  });
});

describe('Product ID to Verifying Contract', () => {
  test('converts product ID 1 to verifying contract address', () => {
    const address = productIdToVerifyingContract(1);
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(address).toBe('0x0000000000000000000000000000000000000001');
  });

  test('converts product ID 1000 to verifying contract address', () => {
    const address = productIdToVerifyingContract(1000);
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(address).toBe('0x00000000000000000000000000000000000003e8');
  });

  test('converts large product ID', () => {
    const address = productIdToVerifyingContract(999999);
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(address.toLowerCase()).toBe('0x00000000000000000000000000000000000f423f');
  });
});

describe('X18 Conversion', () => {
  test('converts number to x18 format', () => {
    expect(toX18(1)).toBe('1000000000000000000');
    expect(toX18(0.1)).toBe('100000000000000000');
    expect(toX18(50000)).toBe('50000000000000000000000');
  });

  test('converts string to x18 format', () => {
    expect(toX18('1')).toBe('1000000000000000000');
    expect(toX18('0.5')).toBe('500000000000000000');
  });

  test('converts from x18 format', () => {
    expect(fromX18('1000000000000000000')).toBe(1);
    expect(fromX18('100000000000000000')).toBe(0.1);
    expect(fromX18('50000000000000000000000')).toBe(50000);
  });

  test('round-trip conversion', () => {
    const original = 123.456;
    const x18 = toX18(original);
    const converted = fromX18(x18);
    expect(converted).toBeCloseTo(original, 6);
  });
});

describe('EIP712 Domain', () => {
  test('creates correct EIP712 domain', () => {
    const chainId = 57073;
    const verifyingContract = '0x0000000000000000000000000000000000000001';
    const domain = createNadoEIP712Domain(chainId, verifyingContract);

    expect(domain).toEqual({
      name: NADO_EIP712_DOMAIN.name,
      version: NADO_EIP712_DOMAIN.version,
      chainId,
      verifyingContract,
    });
  });

  test('creates domain with testnet chain ID', () => {
    const chainId = 763373;
    const verifyingContract = '0x1234567890123456789012345678901234567890';
    const domain = createNadoEIP712Domain(chainId, verifyingContract);

    expect(domain.chainId).toBe(chainId);
    expect(domain.verifyingContract).toBe(verifyingContract);
  });
});

describe('Product Normalization', () => {
  test('normalizes Nado perpetual product', () => {
    const product: NadoProduct = {
      product_id: 1,
      symbol: 'BTC-PERP',
      base_currency: 'BTC',
      quote_currency: 'USDT',
      contract_size: '1',
      tick_size: '0.01',
      min_size: '0.001',
      max_position_size: '100',
      maker_fee: '0.0002',
      taker_fee: '0.0005',
      is_active: true,
      product_type: 'perpetual',
    };

    const normalized = normalizeNadoProduct(product);

    expect(normalized).toMatchObject({
      id: '1',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      active: true,
      minAmount: 0.001,
      maxAmount: 100,
      priceTickSize: 0.01,
      amountStepSize: 0.001,
      makerFee: 0.0002,
      takerFee: 0.0005,
      maxLeverage: 50,
      fundingIntervalHours: 8,
    });
  });

  test('normalizes spot product', () => {
    const product: NadoProduct = {
      product_id: 2,
      symbol: 'BTC-USDT',
      base_currency: 'BTC',
      quote_currency: 'USDT',
      contract_size: '1',
      tick_size: '0.01',
      min_size: '0.001',
      maker_fee: '0.0001',
      taker_fee: '0.0002',
      is_active: true,
      product_type: 'spot',
    };

    const normalized = normalizeNadoProduct(product);

    expect(normalized.symbol).toBe('BTC/USDT');
    expect(normalized.maxAmount).toBeUndefined();
  });
});

describe('Order Normalization', () => {
  const productMapping: ProductMapping = {
    productId: 1,
    nadoSymbol: 'BTC-PERP',
    ccxtSymbol: 'BTC/USDT:USDT',
  };

  test('normalizes open limit order', () => {
    const order: NadoOrder = {
      order_id: 'order-123',
      digest: '0xabc...def',
      sender: '0x1234567890123456789012345678901234567890',
      price_x18: toX18(50000),
      amount: toX18(0.1),
      filled_amount: toX18(0.05),
      remaining_amount: toX18(0.05),
      side: NADO_ORDER_SIDES.BUY,
      post_only: true,
      is_reduce_only: false,
      time_in_force: 'gtc',
      status: 'open',
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoOrder(order, productMapping);

    expect(normalized).toMatchObject({
      id: 'order-123',
      clientOrderId: '0xabc...def',
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      price: 50000,
      amount: 0.1,
      filled: 0.05,
      remaining: 0.05,
      status: 'open',
      postOnly: true,
      reduceOnly: false,
      timeInForce: 'GTC',
    });
  });

  test('normalizes sell order', () => {
    const order: NadoOrder = {
      order_id: 'order-456',
      digest: '0x123...456',
      sender: '0x1234567890123456789012345678901234567890',
      price_x18: toX18(49000),
      amount: toX18(0.2),
      filled_amount: toX18(0.2),
      remaining_amount: toX18(0),
      side: NADO_ORDER_SIDES.SELL,
      post_only: false,
      is_reduce_only: true,
      time_in_force: 'ioc',
      status: 'filled',
      timestamp: 1234567890000,
      avg_fill_price: toX18(49100),
    };

    const normalized = normalizeNadoOrder(order, productMapping);

    expect(normalized).toMatchObject({
      side: 'sell',
      status: 'closed',
      reduceOnly: true,
      timeInForce: 'IOC',
    });
  });

  test('normalizes cancelled order', () => {
    const order: NadoOrder = {
      order_id: 'order-789',
      digest: '0x789...abc',
      sender: '0x1234567890123456789012345678901234567890',
      price_x18: toX18(51000),
      amount: toX18(0.3),
      filled_amount: toX18(0.1),
      remaining_amount: toX18(0.2),
      side: NADO_ORDER_SIDES.BUY,
      post_only: false,
      is_reduce_only: false,
      time_in_force: 'gtc',
      status: 'cancelled',
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoOrder(order, productMapping);

    expect(normalized.status).toBe('canceled');
  });
});

describe('Position Normalization', () => {
  const productMapping: ProductMapping = {
    productId: 1,
    nadoSymbol: 'BTC-PERP',
    ccxtSymbol: 'BTC/USDT:USDT',
  };

  test('normalizes long position', () => {
    const position: NadoPosition = {
      product_id: 1,
      size: toX18(0.5),
      entry_price: toX18(50000),
      mark_price: toX18(51000),
      liquidation_price: toX18(40000),
      unrealized_pnl: toX18(500),
      realized_pnl: toX18(100),
      margin: toX18(5000),
      leverage: '10',
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoPosition(position, productMapping);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      side: 'long',
      size: 0.5,
      unrealizedPnl: 500,
      realizedPnl: 100,
      leverage: 10,
      margin: 5000,
      marginMode: 'cross',
      markPrice: 51000,
      entryPrice: 50000,
      liquidationPrice: 40000,
    });
  });

  test('normalizes short position', () => {
    const position: NadoPosition = {
      product_id: 1,
      size: toX18(-0.3),
      entry_price: toX18(50000),
      mark_price: toX18(49000),
      unrealized_pnl: toX18(300),
      realized_pnl: toX18(-50),
      margin: toX18(3000),
      leverage: '15',
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoPosition(position, productMapping);

    expect(normalized).toMatchObject({
      side: 'short',
      size: 0.3,
      leverage: 15,
    });
  });

  test('returns null for zero position', () => {
    const position: NadoPosition = {
      product_id: 1,
      size: toX18(0),
      entry_price: toX18(50000),
      mark_price: toX18(50000),
      unrealized_pnl: toX18(0),
      realized_pnl: toX18(0),
      margin: toX18(0),
      leverage: '10',
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoPosition(position, productMapping);

    expect(normalized).toBeNull();
  });
});

describe('Balance Normalization', () => {
  test('normalizes Nado balance', () => {
    const balance: NadoBalance = {
      free_margin: toX18(10000),
      used_margin: toX18(5000),
      total_equity: toX18(15000),
    };

    const normalized = normalizeNadoBalance(balance);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      currency: 'USDT',
      free: 10000,
      used: 5000,
      total: 15000,
    });
  });

  test('normalizes zero balance', () => {
    const balance: NadoBalance = {
      free_margin: toX18(0),
      used_margin: toX18(0),
      total_equity: toX18(0),
    };

    const normalized = normalizeNadoBalance(balance);

    expect(normalized[0]).toMatchObject({
      currency: 'USDT',
      free: 0,
      used: 0,
      total: 0,
    });
  });
});

describe('Trade Normalization', () => {
  const productMapping: ProductMapping = {
    productId: 1,
    nadoSymbol: 'BTC-PERP',
    ccxtSymbol: 'BTC/USDT:USDT',
  };

  test('normalizes buy trade', () => {
    const trade: NadoTrade = {
      trade_id: 'trade-123',
      product_id: 1,
      price: toX18(50000),
      size: toX18(0.1),
      side: NADO_ORDER_SIDES.BUY,
      is_maker: true,
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoTrade(trade, productMapping);

    expect(normalized).toMatchObject({
      id: 'trade-123',
      symbol: 'BTC/USDT:USDT',
      side: 'buy',
      price: 50000,
      amount: 0.1,
      cost: 5000,
    });
  });

  test('normalizes sell trade', () => {
    const trade: NadoTrade = {
      trade_id: 'trade-456',
      product_id: 1,
      price: toX18(49000),
      size: toX18(0.2),
      side: NADO_ORDER_SIDES.SELL,
      is_maker: false,
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoTrade(trade, productMapping);

    expect(normalized).toMatchObject({
      side: 'sell',
      price: 49000,
      amount: 0.2,
      cost: 9800,
    });
  });
});

describe('Ticker Normalization', () => {
  test('normalizes Nado ticker', () => {
    const ticker: NadoTicker = {
      symbol: 'BTC-PERP',
      last_price: toX18(50000),
      mark_price: toX18(50010),
      index_price: toX18(50005),
      high_24h: toX18(51000),
      low_24h: toX18(49000),
      volume_24h: toX18(1000),
      funding_rate: '0.0001',
      next_funding_time: 1234567890000,
      open_interest: '10000',
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoTicker(ticker);

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      last: 50000,
      high: 51000,
      low: 49000,
      baseVolume: 1000,
      timestamp: 1234567890000,
    });

    expect(normalized.info).toMatchObject({
      markPrice: 50010,
      indexPrice: 50005,
      fundingRate: '0.0001',
      nextFundingTime: 1234567890000,
    });
  });
});

describe('OrderBook Normalization', () => {
  test('normalizes Nado order book', () => {
    const orderBook: NadoOrderBook = {
      bids: [
        [toX18(50000), toX18(1.5)],
        [toX18(49900), toX18(2.0)],
      ],
      asks: [
        [toX18(50100), toX18(1.0)],
        [toX18(50200), toX18(1.5)],
      ],
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoOrderBook(orderBook, 'BTC/USDT:USDT');

    expect(normalized).toMatchObject({
      symbol: 'BTC/USDT:USDT',
      exchange: 'nado',
      timestamp: 1234567890000,
    });

    expect(normalized.bids).toHaveLength(2);
    expect(normalized.asks).toHaveLength(2);

    expect(normalized.bids[0]).toEqual([50000, 1.5]);
    expect(normalized.asks[0]).toEqual([50100, 1.0]);
  });

  test('normalizes empty order book', () => {
    const orderBook: NadoOrderBook = {
      bids: [],
      asks: [],
      timestamp: 1234567890000,
    };

    const normalized = normalizeNadoOrderBook(orderBook, 'BTC/USDT:USDT');

    expect(normalized.bids).toHaveLength(0);
    expect(normalized.asks).toHaveLength(0);
  });
});

describe('EIP712 Signing', () => {
  test('signs Nado order with wallet', async () => {
    const wallet = ethers.Wallet.createRandom();
    const order: NadoEIP712Order = {
      sender: wallet.address,
      priceX18: toX18(50000),
      amount: toX18(0.1),
      expiration: Math.floor(Date.now() / 1000) + 86400,
      nonce: 1,
      appendix: {
        productId: 1,
        side: NADO_ORDER_SIDES.BUY,
        reduceOnly: false,
        postOnly: true,
      },
    };

    const signature = await signNadoOrder(wallet, order, 57073, 1);

    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
  });

  test('different orders produce different signatures', async () => {
    const wallet = ethers.Wallet.createRandom();
    const baseOrder: NadoEIP712Order = {
      sender: wallet.address,
      priceX18: toX18(50000),
      amount: toX18(0.1),
      expiration: Math.floor(Date.now() / 1000) + 86400,
      nonce: 1,
      appendix: {
        productId: 1,
        side: NADO_ORDER_SIDES.BUY,
        reduceOnly: false,
        postOnly: true,
      },
    };

    const order2: NadoEIP712Order = {
      ...baseOrder,
      priceX18: toX18(51000),
    };

    const sig1 = await signNadoOrder(wallet, baseOrder, 57073, 1);
    const sig2 = await signNadoOrder(wallet, order2, 57073, 1);

    expect(sig1).not.toBe(sig2);
  });
});
