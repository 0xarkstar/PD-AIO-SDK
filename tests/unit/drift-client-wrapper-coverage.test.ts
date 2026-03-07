/**
 * DriftClientWrapper Extended Coverage Tests
 *
 * Covers modifyOrder, account data methods, market data methods,
 * deposit/withdraw, and additional error paths to reach 78%+.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DriftClientWrapper } from '../../src/adapters/drift/DriftClientWrapper.js';
import type { DriftClientWrapperConfig } from '../../src/adapters/drift/DriftClientWrapper.js';

// Mock @drift-labs/sdk
const mockUser = {
  getActivePerpPositions: jest.fn(),
  getActiveSpotPositions: jest.fn(),
  getOpenOrders: jest.fn(),
  getFreeCollateral: jest.fn(),
  getTotalCollateral: jest.fn(),
  getLeverage: jest.fn(),
  getUnrealizedPNL: jest.fn(),
};

const mockDriftClient = {
  subscribe: jest.fn().mockResolvedValue(true),
  getUserAccountExists: jest.fn().mockResolvedValue(true),
  addUser: jest.fn().mockResolvedValue(undefined),
  unsubscribe: jest.fn().mockResolvedValue(undefined),
  placePerpOrder: jest.fn(),
  cancelOrder: jest.fn(),
  cancelOrders: jest.fn(),
  getUser: jest.fn().mockReturnValue(mockUser),
  getPerpMarketAccount: jest.fn(),
  getOracleDataForPerpMarket: jest.fn(),
  deposit: jest.fn(),
  withdraw: jest.fn(),
};

jest.mock('@drift-labs/sdk', () => ({
  DriftClient: jest.fn().mockImplementation(() => mockDriftClient),
  Wallet: jest.fn().mockImplementation((kp) => kp),
  BulkAccountLoader: jest.fn().mockImplementation(() => ({ load: jest.fn() })),
  getMarketsAndOraclesForSubscription: jest.fn().mockReturnValue({
    perpMarketIndexes: [0, 1],
    spotMarketIndexes: [0],
    oracleInfos: [],
  }),
  OrderType: { MARKET: 0, LIMIT: 1, TRIGGER_MARKET: 2, TRIGGER_LIMIT: 3, ORACLE: 4 },
  PositionDirection: { LONG: 0, SHORT: 1 },
  MarketType: { PERP: 0, SPOT: 1 },
  OrderTriggerCondition: { ABOVE: 0, BELOW: 1 },
  PostOnlyParams: { NONE: 0, MUST_POST_ONLY: 1, TRY_POST_ONLY: 2, SLIDE: 3 },
  calculateReservePrice: jest.fn().mockReturnValue({ toString: () => '50000000000' }),
}));

const mockConnection = {
  confirmTransaction: jest.fn().mockResolvedValue({ context: { slot: 12345 } }),
};

const mockKeypair = {
  publicKey: { toBase58: () => 'test-public-key' },
  secretKey: new Uint8Array(64),
};

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => mockConnection),
  Keypair: { fromSecretKey: jest.fn(() => mockKeypair) },
  PublicKey: jest.fn().mockImplementation((str) => ({
    toBase58: () => str,
    toString: () => str,
  })),
}));

describe('DriftClientWrapper Extended Coverage', () => {
  let wrapper: DriftClientWrapper;

  beforeEach(() => {
    jest.clearAllMocks();

    const config: DriftClientWrapperConfig = {
      connection: mockConnection as any,
      keypair: mockKeypair as any,
      subAccountId: 0,
      isDevnet: true,
    };

    wrapper = new DriftClientWrapper(config);
  });

  // ============================================================================
  // Initialize edge cases
  // ============================================================================

  test('should skip initialization if already initialized', async () => {
    await wrapper.initialize();
    expect(mockDriftClient.subscribe).toHaveBeenCalledTimes(1);

    // Second call should be a no-op
    await wrapper.initialize();
    expect(mockDriftClient.subscribe).toHaveBeenCalledTimes(1);
  });

  test('should handle non-Error thrown during initialize', async () => {
    mockDriftClient.subscribe.mockRejectedValueOnce('string error');

    await expect(wrapper.initialize()).rejects.toThrow('Failed to initialize Drift client: string error');
  });

  // ============================================================================
  // modifyOrder
  // ============================================================================

  test('should modify order by canceling and re-placing', async () => {
    await wrapper.initialize();

    // Mock cancel
    mockDriftClient.cancelOrder.mockResolvedValueOnce('cancel-tx');

    // Mock getUser for finding original order
    mockUser.getOpenOrders.mockReturnValueOnce([
      {
        orderId: 10,
        orderType: 'limit',
        marketIndex: 0,
        direction: { long: true },
        baseAssetAmount: BigInt(1000000),
        price: BigInt(50000000000),
        triggerPrice: undefined,
        reduceOnly: false,
        postOnly: 'none',
      },
    ]);

    // Mock place
    mockDriftClient.placePerpOrder.mockResolvedValueOnce('new-tx');

    const result = await wrapper.modifyOrder(10, { price: BigInt(51000000000) });

    expect(result.txSig).toBe('new-tx');
    expect(mockDriftClient.cancelOrder).toHaveBeenCalledWith(10);
    expect(mockDriftClient.placePerpOrder).toHaveBeenCalled();
  });

  test('should throw if order not found during modify', async () => {
    await wrapper.initialize();

    mockDriftClient.cancelOrder.mockResolvedValueOnce('cancel-tx');
    mockUser.getOpenOrders.mockReturnValueOnce([]);

    await expect(wrapper.modifyOrder(999, { price: BigInt(51000000000) }))
      .rejects.toThrow('Order 999 not found');
  });

  // ============================================================================
  // Account Data Methods
  // ============================================================================

  test('should get spot positions', async () => {
    await wrapper.initialize();

    const mockSpotPositions = [{ marketIndex: 0, scaledBalance: '1000' }];
    mockUser.getActiveSpotPositions.mockReturnValueOnce(mockSpotPositions);

    const positions = await wrapper.getSpotPositions();
    expect(positions).toEqual(mockSpotPositions);
  });

  test('should get open orders', async () => {
    await wrapper.initialize();

    const mockOrders = [{ orderId: 1, marketIndex: 0 }];
    mockUser.getOpenOrders.mockReturnValueOnce(mockOrders);

    const orders = await wrapper.getOpenOrders();
    expect(orders).toEqual(mockOrders);
  });

  test('should get free collateral', async () => {
    await wrapper.initialize();

    mockUser.getFreeCollateral.mockReturnValueOnce(BigInt(500000));

    const collateral = await wrapper.getFreeCollateral();
    expect(collateral).toBe(BigInt(500000));
  });

  test('should get total collateral', async () => {
    await wrapper.initialize();

    mockUser.getTotalCollateral.mockReturnValueOnce(BigInt(1000000));

    const collateral = await wrapper.getTotalCollateral();
    expect(collateral).toBe(BigInt(1000000));
  });

  test('should get leverage', async () => {
    await wrapper.initialize();

    // Drift returns leverage in basis points (e.g., 20000 = 2x)
    mockUser.getLeverage.mockReturnValueOnce({ toNumber: () => 20000 });

    const leverage = await wrapper.getLeverage();
    expect(leverage).toBe(2);
  });

  // ============================================================================
  // Market Data Methods
  // ============================================================================

  test('should get oracle price', async () => {
    await wrapper.initialize();

    mockDriftClient.getPerpMarketAccount.mockReturnValueOnce({ marketIndex: 0 });
    mockDriftClient.getOracleDataForPerpMarket.mockReturnValueOnce({
      price: BigInt(50000000000),
    });

    const price = await wrapper.getOraclePrice(0);
    expect(price).toBe(BigInt(50000000000));
  });

  test('should throw if perp market not found for oracle price', async () => {
    await wrapper.initialize();

    mockDriftClient.getPerpMarketAccount.mockReturnValueOnce(null);

    await expect(wrapper.getOraclePrice(99)).rejects.toThrow('Perp market 99 not found');
  });

  test('should get mark price', async () => {
    await wrapper.initialize();

    mockDriftClient.getPerpMarketAccount.mockReturnValueOnce({ marketIndex: 0 });
    mockDriftClient.getOracleDataForPerpMarket.mockReturnValueOnce({
      price: BigInt(50000000000),
    });

    const price = await wrapper.getMarkPrice(0);
    expect(price).toBe(BigInt('50000000000'));
  });

  test('should throw if perp market not found for mark price', async () => {
    await wrapper.initialize();

    mockDriftClient.getPerpMarketAccount.mockReturnValueOnce(null);

    await expect(wrapper.getMarkPrice(99)).rejects.toThrow('Perp market 99 not found');
  });

  // ============================================================================
  // Deposit and Withdraw
  // ============================================================================

  test('should deposit collateral', async () => {
    await wrapper.initialize();

    mockDriftClient.deposit.mockResolvedValueOnce('deposit-tx');

    const txSig = await wrapper.deposit(BigInt(1000000), 0);
    expect(txSig).toBe('deposit-tx');
    expect(mockDriftClient.deposit).toHaveBeenCalledWith(BigInt(1000000), 0, undefined);
    expect(mockConnection.confirmTransaction).toHaveBeenCalledWith('deposit-tx', 'confirmed');
  });

  test('should deposit with user token account', async () => {
    await wrapper.initialize();

    mockDriftClient.deposit.mockResolvedValueOnce('deposit-tx-2');
    const mockTokenAccount = { toBase58: () => 'token-account' };

    const txSig = await wrapper.deposit(BigInt(2000000), 0, mockTokenAccount as any);
    expect(txSig).toBe('deposit-tx-2');
  });

  test('should withdraw collateral', async () => {
    await wrapper.initialize();

    mockDriftClient.withdraw.mockResolvedValueOnce('withdraw-tx');

    const txSig = await wrapper.withdraw(BigInt(500000), 0);
    expect(txSig).toBe('withdraw-tx');
    expect(mockDriftClient.withdraw).toHaveBeenCalledWith(BigInt(500000), 0, undefined);
    expect(mockConnection.confirmTransaction).toHaveBeenCalledWith('withdraw-tx', 'confirmed');
  });

  // ============================================================================
  // Cleanup & State Methods
  // ============================================================================

  test('should handle disconnect when not initialized', async () => {
    // Should not throw when disconnecting without initialization
    await wrapper.disconnect();
    expect(mockDriftClient.unsubscribe).not.toHaveBeenCalled();
  });

  test('should return drift client when initialized', async () => {
    await wrapper.initialize();

    const client = wrapper.getDriftClient();
    expect(client).toBe(mockDriftClient);
  });

  test('should throw when getting drift client before init', () => {
    expect(() => wrapper.getDriftClient()).toThrow(/not initialized/);
  });

  // ============================================================================
  // Uninitialized guard for all methods
  // ============================================================================

  test('should throw on cancelOrder when not initialized', async () => {
    await expect(wrapper.cancelOrder(1)).rejects.toThrow(/not initialized/);
  });

  test('should throw on cancelOrdersForMarket when not initialized', async () => {
    await expect(wrapper.cancelOrdersForMarket(0)).rejects.toThrow(/not initialized/);
  });

  test('should throw on cancelAllPerpOrders when not initialized', async () => {
    await expect(wrapper.cancelAllPerpOrders()).rejects.toThrow(/not initialized/);
  });

  test('should throw on modifyOrder when not initialized', async () => {
    await expect(wrapper.modifyOrder(1, {})).rejects.toThrow(/not initialized/);
  });

  test('should throw on getPerpPositions when not initialized', async () => {
    await expect(wrapper.getPerpPositions()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getSpotPositions when not initialized', async () => {
    await expect(wrapper.getSpotPositions()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getOpenOrders when not initialized', async () => {
    await expect(wrapper.getOpenOrders()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getFreeCollateral when not initialized', async () => {
    await expect(wrapper.getFreeCollateral()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getTotalCollateral when not initialized', async () => {
    await expect(wrapper.getTotalCollateral()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getLeverage when not initialized', async () => {
    await expect(wrapper.getLeverage()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getUnrealizedPnL when not initialized', async () => {
    await expect(wrapper.getUnrealizedPnL()).rejects.toThrow(/not initialized/);
  });

  test('should throw on getOraclePrice when not initialized', async () => {
    await expect(wrapper.getOraclePrice(0)).rejects.toThrow(/not initialized/);
  });

  test('should throw on getMarkPrice when not initialized', async () => {
    await expect(wrapper.getMarkPrice(0)).rejects.toThrow(/not initialized/);
  });

  test('should throw on deposit when not initialized', async () => {
    await expect(wrapper.deposit(BigInt(1000), 0)).rejects.toThrow(/not initialized/);
  });

  test('should throw on withdraw when not initialized', async () => {
    await expect(wrapper.withdraw(BigInt(1000), 0)).rejects.toThrow(/not initialized/);
  });

  // ============================================================================
  // Order with builder params
  // ============================================================================

  test('should place order with builder params', async () => {
    await wrapper.initialize();

    mockDriftClient.placePerpOrder.mockResolvedValueOnce('builder-tx');

    const result = await wrapper.placePerpOrder({
      orderType: 'limit',
      marketIndex: 0,
      marketType: 'perp',
      direction: 'long',
      baseAssetAmount: BigInt(1000000),
      price: BigInt(50000000000),
      builderIdx: 1,
      builderFee: 50,
      postOnly: true,
      reduceOnly: true,
      immediateOrCancel: true,
      triggerCondition: 'above',
    });

    expect(result.txSig).toBe('builder-tx');
    const orderParams = mockDriftClient.placePerpOrder.mock.calls[0][0];
    expect(orderParams.builderIdx).toBe(1);
    expect(orderParams.builderFee).toBe(50);
  });

  // ============================================================================
  // Oracle order type mapping
  // ============================================================================

  test('should map oracle order type', async () => {
    await wrapper.initialize();

    mockDriftClient.placePerpOrder.mockResolvedValueOnce('oracle-tx');

    await wrapper.placePerpOrder({
      orderType: 'oracle',
      marketIndex: 0,
      marketType: 'perp',
      direction: 'short',
      baseAssetAmount: BigInt(1000000),
      oraclePriceOffset: 100,
      auctionDuration: 10,
      auctionStartPrice: BigInt(49000),
      auctionEndPrice: BigInt(50000),
      maxTs: BigInt(1700000000),
      userOrderId: 42,
    });

    const orderParams = mockDriftClient.placePerpOrder.mock.calls[0][0];
    expect(orderParams.orderType).toBe(4); // ORACLE
    expect(orderParams.direction).toBe(1); // SHORT
  });
});
