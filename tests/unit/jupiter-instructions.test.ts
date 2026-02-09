/**
 * Jupiter Instructions Unit Tests
 *
 * Tests for JupiterInstructionBuilder — instruction building,
 * data encoding, account resolution, and PDA derivation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock @solana/web3.js at module level
const mockFindProgramAddress = jest.fn<() => Promise<any>>().mockResolvedValue([
  {
    toBase58: () => 'DerivedAddress11111111111111111111111111111111',
    toBuffer: () => Buffer.alloc(32),
  },
  255,
]);

const mockPublicKeyInstance = jest.fn().mockImplementation((key: string) => ({
  toBase58: () => key,
  toBuffer: () => Buffer.from(key.padEnd(32, '\0')),
}));

// Attach static methods
(mockPublicKeyInstance as any).findProgramAddress = mockFindProgramAddress;

const mockTransactionInstruction = jest.fn().mockImplementation((args: any) => ({
  keys: args.keys,
  programId: args.programId,
  data: args.data,
}));

jest.mock('@solana/web3.js', () => ({
  PublicKey: mockPublicKeyInstance,
  TransactionInstruction: mockTransactionInstruction,
}));

import {
  JupiterInstructionBuilder,
  createInstructionBuilder,
  type PositionAccounts,
} from '../../src/adapters/jupiter/instructions.js';

describe('JupiterInstructionBuilder', () => {
  let builder: JupiterInstructionBuilder;

  const mockAccounts: PositionAccounts = {
    position: '11111111111111111111111111111111',
    pool: '22222222222222222222222222222222',
    custody: '33333333333333333333333333333333',
    custodyTokenAccount: '44444444444444444444444444444444',
    collateralCustody: '55555555555555555555555555555555',
    collateralTokenAccount: '66666666666666666666666666666666',
    oracle: '77777777777777777777777777777777',
    ownerTokenAccount: '88888888888888888888888888888888',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    builder = new JupiterInstructionBuilder();
  });

  describe('createInstructionBuilder', () => {
    test('should create a new JupiterInstructionBuilder instance', () => {
      const instance = createInstructionBuilder();
      expect(instance).toBeInstanceOf(JupiterInstructionBuilder);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await builder.initialize();
      // Should not throw
    });

    test('should be idempotent', async () => {
      await builder.initialize();
      await builder.initialize();
      // Should not throw
    });
  });

  describe('ensureInitialized', () => {
    test('should throw when not initialized', async () => {
      await expect(
        builder.buildOpenPositionInstruction(
          {
            owner: 'owner123',
            side: 'long',
            symbol: 'SOL-PERP',
            sizeUsd: 1000,
            collateralAmount: 100,
          },
          mockAccounts
        )
      ).rejects.toThrow(/not initialized/i);
    });
  });

  describe('buildOpenPositionInstruction', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should build open long position instruction', async () => {
      const result = await builder.buildOpenPositionInstruction(
        {
          owner: 'ownerPubkey',
          side: 'long',
          symbol: 'SOL-PERP',
          sizeUsd: 1000,
          collateralAmount: 100,
        },
        mockAccounts
      );

      expect(result).toBeDefined();
      expect(mockTransactionInstruction).toHaveBeenCalled();
      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.keys).toHaveLength(11);
      expect(callArgs.data).toBeInstanceOf(Buffer);
      // Long side = 0
      expect(callArgs.data.readUInt8(8)).toBe(0);
    });

    test('should build open short position instruction', async () => {
      await builder.buildOpenPositionInstruction(
        {
          owner: 'ownerPubkey',
          side: 'short',
          symbol: 'SOL-PERP',
          sizeUsd: 500,
          collateralAmount: 50,
        },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      // Short side = 1
      expect(callArgs.data.readUInt8(8)).toBe(1);
    });

    test('should encode price limit when provided', async () => {
      await builder.buildOpenPositionInstruction(
        {
          owner: 'ownerPubkey',
          side: 'long',
          symbol: 'SOL-PERP',
          sizeUsd: 1000,
          collateralAmount: 100,
          priceLimit: 150.5,
        },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      const priceLimitOffset = 8 + 1 + 8 + 8; // discriminator + side + sizeUsd + collateral
      const priceLimitScaled = callArgs.data.readBigUInt64LE(priceLimitOffset);
      expect(priceLimitScaled).toBe(BigInt(Math.floor(150.5 * 1e6)));
    });

    test('should set price limit to 0 when not provided', async () => {
      await builder.buildOpenPositionInstruction(
        {
          owner: 'ownerPubkey',
          side: 'long',
          symbol: 'SOL-PERP',
          sizeUsd: 1000,
          collateralAmount: 100,
        },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      const priceLimitOffset = 8 + 1 + 8 + 8;
      expect(callArgs.data.readBigUInt64LE(priceLimitOffset)).toBe(0n);
    });

    test('should correctly scale sizeUsd to 6 decimals', async () => {
      await builder.buildOpenPositionInstruction(
        {
          owner: 'ownerPubkey',
          side: 'long',
          symbol: 'SOL-PERP',
          sizeUsd: 1234.56,
          collateralAmount: 100,
        },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      const sizeUsdOffset = 8 + 1; // discriminator + side
      expect(callArgs.data.readBigUInt64LE(sizeUsdOffset)).toBe(
        BigInt(Math.floor(1234.56 * 1e6))
      );
    });
  });

  describe('buildClosePositionInstruction', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should build full close instruction (no sizeUsd)', async () => {
      const result = await builder.buildClosePositionInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey' },
        mockAccounts
      );

      expect(result).toBeDefined();
      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.keys).toHaveLength(10);
      expect(callArgs.data.readBigUInt64LE(8)).toBe(0n); // sizeUsd = 0 for full close
    });

    test('should build partial close with sizeUsd', async () => {
      await builder.buildClosePositionInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', sizeUsd: 500 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(8)).toBe(BigInt(Math.floor(500 * 1e6)));
    });

    test('should encode price limit when provided', async () => {
      await builder.buildClosePositionInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', priceLimit: 200.0 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(16)).toBe(BigInt(Math.floor(200 * 1e6)));
    });

    test('should set price limit to 0 when not provided', async () => {
      await builder.buildClosePositionInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey' },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(16)).toBe(0n);
    });
  });

  describe('buildIncreaseSizeInstruction', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should build increase size instruction', async () => {
      const result = await builder.buildIncreaseSizeInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', sizeDeltaUsd: 500 },
        mockAccounts
      );

      expect(result).toBeDefined();
      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.keys).toHaveLength(5);
    });

    test('should encode price limit when provided', async () => {
      await builder.buildIncreaseSizeInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', sizeDeltaUsd: 500, priceLimit: 100 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(16)).toBe(BigInt(Math.floor(100 * 1e6)));
    });

    test('should set price limit to 0 when not provided', async () => {
      await builder.buildIncreaseSizeInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', sizeDeltaUsd: 500 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(16)).toBe(0n);
    });
  });

  describe('buildDecreaseSizeInstruction', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should build decrease size instruction', async () => {
      const result = await builder.buildDecreaseSizeInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', sizeDeltaUsd: 250 },
        mockAccounts
      );

      expect(result).toBeDefined();
      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.keys).toHaveLength(9);
    });

    test('should encode sizeDeltaUsd correctly', async () => {
      await builder.buildDecreaseSizeInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', sizeDeltaUsd: 750.25 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(8)).toBe(BigInt(Math.floor(750.25 * 1e6)));
    });
  });

  describe('buildAddCollateralInstruction', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should build add collateral instruction', async () => {
      const result = await builder.buildAddCollateralInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', collateralAmount: 50 },
        mockAccounts
      );

      expect(result).toBeDefined();
      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      // owner, position, pool, collateralCustody, collateralTokenAccount, ownerTokenAccount, tokenProgram
      expect(callArgs.keys.length).toBeGreaterThanOrEqual(7);
    });

    test('should set sizeUsd to 0 (collateral-only)', async () => {
      await builder.buildAddCollateralInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', collateralAmount: 50 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      // side(1) is at offset 8, sizeUsd at offset 9
      expect(callArgs.data.readBigUInt64LE(9)).toBe(0n);
    });
  });

  describe('buildRemoveCollateralInstruction', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should build remove collateral instruction', async () => {
      const result = await builder.buildRemoveCollateralInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', collateralAmount: 25 },
        mockAccounts
      );

      expect(result).toBeDefined();
      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      // owner, position, pool, collateralCustody, collateralTokenAccount, oracle, ownerTokenAccount, tokenProgram
      expect(callArgs.keys.length).toBeGreaterThanOrEqual(7);
    });

    test('should set sizeUsd to 0 (collateral-only)', async () => {
      await builder.buildRemoveCollateralInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', collateralAmount: 25 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(8)).toBe(0n);
    });

    test('should encode collateral amount correctly', async () => {
      await builder.buildRemoveCollateralInstruction(
        { owner: 'ownerPubkey', position: 'positionPubkey', collateralAmount: 123.456 },
        mockAccounts
      );

      const callArgs = mockTransactionInstruction.mock.calls[0]![0] as any;
      expect(callArgs.data.readBigUInt64LE(16)).toBe(BigInt(Math.floor(123.456 * 1e6)));
    });
  });

  describe('resolvePositionAccounts', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should resolve accounts for SOL/USD long', async () => {
      // unifiedToJupiter("SOL/USD:USD") → "SOL-PERP" → baseToken = "SOL" → JUPITER_TOKEN_MINTS["SOL"]
      const accounts = await builder.resolvePositionAccounts('ownerPubkey', 'SOL/USD:USD', 'long');

      expect(accounts).toBeDefined();
      expect(accounts.position).toBeDefined();
      expect(accounts.pool).toBeDefined();
      expect(accounts.custody).toBeDefined();
      expect(accounts.collateralCustody).toBeDefined();
      expect(accounts.oracle).toBeDefined();
      expect(accounts.ownerTokenAccount).toBe('');
    });

    test('should resolve accounts for short side', async () => {
      const accounts = await builder.resolvePositionAccounts('ownerPubkey', 'ETH/USD:USD', 'short');
      expect(accounts).toBeDefined();
      expect(accounts.position).toBeDefined();
    });

    test('should throw for unknown market', async () => {
      await expect(
        builder.resolvePositionAccounts('ownerPubkey', 'INVALID/USD:USD', 'long')
      ).rejects.toThrow(/unknown token/i);
    });

    test('should call findProgramAddress for PDA derivation', async () => {
      await builder.resolvePositionAccounts('ownerPubkey', 'SOL/USD:USD', 'long');
      // Multiple PDAs derived: pool, custody, collateralCustody, position, custodyToken, collateralToken, oracle
      expect(mockFindProgramAddress).toHaveBeenCalled();
      expect(mockFindProgramAddress.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getAssociatedTokenAddress', () => {
    beforeEach(async () => {
      await builder.initialize();
    });

    test('should derive associated token address', async () => {
      const result = await builder.getAssociatedTokenAddress('ownerPubkey', 'mintPubkey');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should call findProgramAddress', async () => {
      await builder.getAssociatedTokenAddress('owner123', 'mint456');
      expect(mockFindProgramAddress).toHaveBeenCalled();
    });
  });
});
