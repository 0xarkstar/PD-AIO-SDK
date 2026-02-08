/**
 * Drift Client Wrapper Unit Tests
 *
 * Tests DriftClientWrapper without real SDK
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DriftClientWrapper } from '../../src/adapters/drift/DriftClientWrapper.js';
import type { DriftClientWrapperConfig } from '../../src/adapters/drift/DriftClientWrapper.js';

// Mock @drift-labs/sdk
const mockDriftClient = {
  subscribe: jest.fn().mockResolvedValue(true),
  getUserAccountExists: jest.fn().mockResolvedValue(true),
  addUser: jest.fn().mockResolvedValue(undefined),
  unsubscribe: jest.fn().mockResolvedValue(undefined),
  placePerpOrder: jest.fn(),
  cancelOrder: jest.fn(),
  cancelOrders: jest.fn(),
  getUser: jest.fn(),
  getPerpMarketAccount: jest.fn(),
  getOracleDataForPerpMarket: jest.fn(),
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
  OrderType: {
    MARKET: 0,
    LIMIT: 1,
    TRIGGER_MARKET: 2,
    TRIGGER_LIMIT: 3,
    ORACLE: 4,
  },
  PositionDirection: {
    LONG: 0,
    SHORT: 1,
  },
  MarketType: {
    PERP: 0,
    SPOT: 1,
  },
  OrderTriggerCondition: {
    ABOVE: 0,
    BELOW: 1,
  },
  PostOnlyParams: {
    NONE: 0,
    MUST_POST_ONLY: 1,
    TRY_POST_ONLY: 2,
    SLIDE: 3,
  },
}));

// Mock @solana/web3.js
const mockConnection = {
  confirmTransaction: jest.fn().mockResolvedValue({ context: { slot: 12345 } }),
  getBalance: jest.fn().mockResolvedValue(1000000000),
  getTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: [] }),
};

const mockKeypair = {
  publicKey: { toBase58: () => 'test-public-key' },
  secretKey: new Uint8Array(64),
};

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => mockConnection),
  Keypair: {
    fromSecretKey: jest.fn(() => mockKeypair),
  },
  PublicKey: jest.fn().mockImplementation((str) => ({
    toBase58: () => str,
    toString: () => str,
  })),
}));

describe('DriftClientWrapper', () => {
  let wrapper: DriftClientWrapper;
  let config: DriftClientWrapperConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      connection: mockConnection as any,
      keypair: mockKeypair as any,
      subAccountId: 0,
      isDevnet: true,
    };

    wrapper = new DriftClientWrapper(config);
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  test('should initialize with connection and keypair', async () => {
    await wrapper.initialize();

    expect(wrapper.getIsInitialized()).toBe(true);
    expect(mockDriftClient.subscribe).toHaveBeenCalled();
  });

  test('should handle devnet vs mainnet', async () => {
    const mainnetConfig = {
      ...config,
      isDevnet: false,
    };

    const mainnetWrapper = new DriftClientWrapper(mainnetConfig);
    await mainnetWrapper.initialize();

    expect(mainnetWrapper.getIsInitialized()).toBe(true);
  });

  test('should handle user account initialization', async () => {
    mockDriftClient.getUserAccountExists.mockResolvedValueOnce(false);

    await wrapper.initialize();

    // Should still initialize but not call addUser
    expect(wrapper.getIsInitialized()).toBe(true);
    expect(mockDriftClient.addUser).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Order Placement
  // ============================================================================

  test('should place MARKET order', async () => {
    await wrapper.initialize();

    mockDriftClient.placePerpOrder.mockResolvedValueOnce('tx-signature-123');

    const result = await wrapper.placePerpOrder({
      orderType: 'market',
      marketIndex: 0,
      marketType: 'perp',
      direction: 'long',
      baseAssetAmount: BigInt(1000000),
    });

    expect(result.txSig).toBe('tx-signature-123');
    expect(result.slot).toBe(12345);
    expect(mockDriftClient.placePerpOrder).toHaveBeenCalled();
  });

  test('should place LIMIT order', async () => {
    await wrapper.initialize();

    mockDriftClient.placePerpOrder.mockResolvedValueOnce('tx-signature-456');

    const result = await wrapper.placePerpOrder({
      orderType: 'limit',
      marketIndex: 1,
      marketType: 'perp',
      direction: 'short',
      baseAssetAmount: BigInt(2000000),
      price: BigInt(50000000000),
    });

    expect(result.txSig).toBe('tx-signature-456');
    expect(mockDriftClient.placePerpOrder).toHaveBeenCalled();
  });

  test('should place STOP order', async () => {
    await wrapper.initialize();

    mockDriftClient.placePerpOrder.mockResolvedValueOnce('tx-signature-789');

    const result = await wrapper.placePerpOrder({
      orderType: 'triggerMarket',
      marketIndex: 0,
      marketType: 'perp',
      direction: 'long',
      baseAssetAmount: BigInt(1000000),
      triggerPrice: BigInt(48000000000),
      triggerCondition: 'below',
    });

    expect(result.txSig).toBe('tx-signature-789');
    expect(mockDriftClient.placePerpOrder).toHaveBeenCalled();
  });

  // ============================================================================
  // Order Cancellation
  // ============================================================================

  test('should cancel order by ID', async () => {
    await wrapper.initialize();

    mockDriftClient.cancelOrder.mockResolvedValueOnce('cancel-tx-123');

    const result = await wrapper.cancelOrder(42);

    expect(result.txSig).toBe('cancel-tx-123');
    expect(result.orderId).toBe(42);
    expect(mockDriftClient.cancelOrder).toHaveBeenCalledWith(42);
  });

  test('should cancel orders for market', async () => {
    await wrapper.initialize();

    mockDriftClient.cancelOrders.mockResolvedValueOnce('cancel-market-tx');
    mockDriftClient.getUser.mockReturnValueOnce({
      getOpenOrders: jest.fn().mockReturnValue([
        { orderId: 1, marketIndex: 0 },
        { orderId: 2, marketIndex: 0 },
      ]),
    });

    const results = await wrapper.cancelOrdersForMarket(0);

    expect(results).toHaveLength(2);
    expect(results[0].orderId).toBe(1);
    expect(mockDriftClient.cancelOrders).toHaveBeenCalled();
  });

  test('should cancel all perp orders', async () => {
    await wrapper.initialize();

    mockDriftClient.cancelOrders.mockResolvedValueOnce('cancel-all-tx');

    const txSig = await wrapper.cancelAllPerpOrders();

    expect(txSig).toBe('cancel-all-tx');
    expect(mockDriftClient.cancelOrders).toHaveBeenCalled();
  });

  // ============================================================================
  // Position Tracking
  // ============================================================================

  test('should fetch positions', async () => {
    await wrapper.initialize();

    const mockPositions = [
      { marketIndex: 0, baseAssetAmount: BigInt(1000000) },
      { marketIndex: 1, baseAssetAmount: BigInt(-500000) },
    ];

    mockDriftClient.getUser.mockReturnValueOnce({
      getActivePerpPositions: jest.fn().mockReturnValue(mockPositions),
    });

    const positions = await wrapper.getPerpPositions();

    expect(positions).toHaveLength(2);
    expect(positions[0].marketIndex).toBe(0);
  });

  test('should calculate unrealized PnL', async () => {
    await wrapper.initialize();

    mockDriftClient.getUser.mockReturnValueOnce({
      getUnrealizedPNL: jest.fn().mockReturnValue(BigInt(150000)),
    });

    const pnl = await wrapper.getUnrealizedPnL();

    expect(pnl).toBe(BigInt(150000));
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  test('should handle uninitialized client', async () => {
    // Don't initialize wrapper
    await expect(wrapper.placePerpOrder({
      orderType: 'market',
      marketIndex: 0,
      marketType: 'perp',
      direction: 'long',
      baseAssetAmount: BigInt(1000000),
    })).rejects.toThrow(/not initialized/);
  });

  test('should handle transaction failures', async () => {
    await wrapper.initialize();

    mockDriftClient.placePerpOrder.mockRejectedValueOnce(new Error('Insufficient funds'));

    await expect(wrapper.placePerpOrder({
      orderType: 'market',
      marketIndex: 0,
      marketType: 'perp',
      direction: 'long',
      baseAssetAmount: BigInt(1000000),
    })).rejects.toThrow('Insufficient funds');
  });

  test('should handle SDK initialization failure', async () => {
    mockDriftClient.subscribe.mockRejectedValueOnce(new Error('Connection failed'));

    await expect(wrapper.initialize()).rejects.toThrow(/Failed to initialize/);
  });

  // ============================================================================
  // Cleanup
  // ============================================================================

  test('should disconnect properly', async () => {
    await wrapper.initialize();
    await wrapper.disconnect();

    expect(mockDriftClient.unsubscribe).toHaveBeenCalled();
    expect(wrapper.getIsInitialized()).toBe(false);
  });
});
