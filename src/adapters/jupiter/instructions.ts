/**
 * Jupiter Perps Program Instructions
 *
 * Builds Solana program instructions for Jupiter Perpetuals trading.
 * Handles position opening, closing, and modification.
 */

// Dynamic imports for @solana/web3.js types
type PublicKey = import('@solana/web3.js').PublicKey;
type TransactionInstruction = import('@solana/web3.js').TransactionInstruction;

import {
  JUPITER_PERPS_PROGRAM_ID,
  JUPITER_TOKEN_MINTS,
  JUPITER_MARKETS,
  unifiedToJupiter,
} from './constants.js';
import type { JupiterPositionSide } from './types.js';

// =============================================================================
// Instruction Discriminators (from Anchor IDL)
// =============================================================================

/**
 * Instruction discriminators for Jupiter Perps program
 * Calculated from sha256("global:<instruction_name>")[0..8]
 * Based on actual Jupiter Perpetuals IDL instruction names
 *
 * @see https://github.com/monakki/jup-perps-client/blob/main/generator/idl/jupiter-perpetuals.json
 */
const INSTRUCTION_DISCRIMINATORS = {
  // Position creation/modification (market orders)
  createIncreasePositionMarketRequest: Buffer.from([0xb7, 0xc6, 0x61, 0xa9, 0x23, 0x01, 0xe1, 0x39]),
  createDecreasePositionMarketRequest: Buffer.from([0x93, 0xee, 0x4c, 0x5b, 0x30, 0x56, 0xa7, 0xfd]),
  createDecreasePositionRequest2: Buffer.from([0x37, 0x27, 0x0c, 0x16, 0xd8, 0x73, 0x35, 0x65]),

  // Request management
  closePositionRequest: Buffer.from([0x4b, 0xcf, 0x46, 0xad, 0x76, 0x7c, 0xda, 0xb3]),

  // Position execution (called by keepers)
  increasePosition4: Buffer.from([0x66, 0x77, 0x3c, 0x79, 0x00, 0xe7, 0xa7, 0x84]),
  decreasePosition4: Buffer.from([0xad, 0xc4, 0x52, 0x5d, 0x3d, 0x5e, 0x90, 0x26]),

  // Instant operations (atomic open/close)
  instantIncreasePosition: Buffer.from([0x6f, 0x5a, 0xc5, 0xc4, 0xfd, 0xdc, 0x7d, 0x0f]),
  instantDecreasePosition: Buffer.from([0x0f, 0x49, 0x76, 0xb1, 0xcf, 0x06, 0x19, 0x3e]),

  // TP/SL management
  instantCreateTpsl: Buffer.from([0x1e, 0x65, 0xb3, 0xb8, 0xfa, 0xba, 0xc5, 0xc8]),
  instantUpdateTpsl: Buffer.from([0x3f, 0x28, 0x9e, 0x63, 0xc8, 0x9e, 0x89, 0xe9]),

  // Liquidation
  liquidateFullPosition4: Buffer.from([0x7a, 0x21, 0x6c, 0x7d, 0xd6, 0x8f, 0x62, 0x43]),
} as const;

// =============================================================================
// Instruction Parameters
// =============================================================================

/**
 * Open position instruction parameters
 */
export interface OpenPositionParams {
  /** Owner wallet public key */
  owner: string;
  /** Position side: long or short */
  side: 'long' | 'short';
  /** Market symbol (unified format) */
  symbol: string;
  /** Size in USD */
  sizeUsd: number;
  /** Collateral in tokens (USDC/USDT) */
  collateralAmount: number;
  /** Price limit (max for long, min for short) */
  priceLimit?: number;
  /** Take profit price */
  takeProfit?: number;
  /** Stop loss price */
  stopLoss?: number;
}

/**
 * Close position instruction parameters
 */
export interface ClosePositionParams {
  /** Owner wallet public key */
  owner: string;
  /** Position public key */
  position: string;
  /** Size to close in USD (null for full close) */
  sizeUsd?: number;
  /** Price limit */
  priceLimit?: number;
}

/**
 * Increase size instruction parameters
 */
export interface IncreaseSizeParams {
  /** Owner wallet public key */
  owner: string;
  /** Position public key */
  position: string;
  /** Additional size in USD */
  sizeDeltaUsd: number;
  /** Price limit */
  priceLimit?: number;
}

/**
 * Decrease size instruction parameters
 */
export interface DecreaseSizeParams {
  /** Owner wallet public key */
  owner: string;
  /** Position public key */
  position: string;
  /** Size to reduce in USD */
  sizeDeltaUsd: number;
  /** Price limit */
  priceLimit?: number;
}

/**
 * Add collateral instruction parameters
 */
export interface AddCollateralParams {
  /** Owner wallet public key */
  owner: string;
  /** Position public key */
  position: string;
  /** Collateral amount to add (in tokens) */
  collateralAmount: number;
}

/**
 * Remove collateral instruction parameters
 */
export interface RemoveCollateralParams {
  /** Owner wallet public key */
  owner: string;
  /** Position public key */
  position: string;
  /** Collateral amount to remove (in tokens) */
  collateralAmount: number;
}

// =============================================================================
// Account Resolution
// =============================================================================

/**
 * Account addresses for position operations
 */
export interface PositionAccounts {
  /** Position PDA */
  position: string;
  /** Pool account */
  pool: string;
  /** Custody for the trading asset */
  custody: string;
  /** Custody token account */
  custodyTokenAccount: string;
  /** Collateral custody (usually USDC) */
  collateralCustody: string;
  /** Collateral token account */
  collateralTokenAccount: string;
  /** Oracle account */
  oracle: string;
  /** Owner token account (for collateral) */
  ownerTokenAccount: string;
}

/**
 * Jupiter Perps Instruction Builder
 *
 * Builds Solana instructions for Jupiter Perpetuals operations.
 */
export class JupiterInstructionBuilder {
  private programId?: PublicKey;
  private isInitialized = false;

  /**
   * Initialize the instruction builder
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const { PublicKey } = await import('@solana/web3.js');
    this.programId = new PublicKey(JUPITER_PERPS_PROGRAM_ID);
    this.isInitialized = true;
  }

  /**
   * Ensure builder is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.programId) {
      throw new Error('JupiterInstructionBuilder not initialized. Call initialize() first.');
    }
  }

  // ==========================================================================
  // Position Instructions
  // ==========================================================================

  /**
   * Build open position instruction
   */
  async buildOpenPositionInstruction(
    params: OpenPositionParams,
    accounts: PositionAccounts
  ): Promise<TransactionInstruction> {
    this.ensureInitialized();
    const { PublicKey, TransactionInstruction } = await import('@solana/web3.js');

    // Encode instruction data
    const data = this.encodeOpenPositionData(params);

    // Build account metas
    const keys = [
      { pubkey: new PublicKey(params.owner), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.position), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.pool), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.custody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.custodyTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralCustody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.oracle), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(accounts.ownerTokenAccount), isSigner: false, isWritable: true },
      // System accounts
      { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false }, // Token Program
      { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false }, // System Program
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId!,
      data,
    });
  }

  /**
   * Build close position instruction
   */
  async buildClosePositionInstruction(
    params: ClosePositionParams,
    accounts: PositionAccounts
  ): Promise<TransactionInstruction> {
    this.ensureInitialized();
    const { PublicKey, TransactionInstruction } = await import('@solana/web3.js');

    // Encode instruction data
    const data = this.encodeClosePositionData(params);

    // Build account metas
    const keys = [
      { pubkey: new PublicKey(params.owner), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.position), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.pool), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.custody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.custodyTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralCustody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.oracle), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(accounts.ownerTokenAccount), isSigner: false, isWritable: true },
      // System accounts
      { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId!,
      data,
    });
  }

  /**
   * Build increase size instruction
   */
  async buildIncreaseSizeInstruction(
    params: IncreaseSizeParams,
    accounts: PositionAccounts
  ): Promise<TransactionInstruction> {
    this.ensureInitialized();
    const { PublicKey, TransactionInstruction } = await import('@solana/web3.js');

    const data = this.encodeIncreaseSizeData(params);

    const keys = [
      { pubkey: new PublicKey(params.owner), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.position), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.pool), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.custody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.oracle), isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId!,
      data,
    });
  }

  /**
   * Build decrease size instruction
   */
  async buildDecreaseSizeInstruction(
    params: DecreaseSizeParams,
    accounts: PositionAccounts
  ): Promise<TransactionInstruction> {
    this.ensureInitialized();
    const { PublicKey, TransactionInstruction } = await import('@solana/web3.js');

    const data = this.encodeDecreaseSizeData(params);

    const keys = [
      { pubkey: new PublicKey(params.owner), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.position), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.pool), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.custody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralCustody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.oracle), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(accounts.ownerTokenAccount), isSigner: false, isWritable: true },
      // System accounts
      { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId!,
      data,
    });
  }

  /**
   * Build add collateral instruction
   */
  async buildAddCollateralInstruction(
    params: AddCollateralParams,
    accounts: PositionAccounts
  ): Promise<TransactionInstruction> {
    this.ensureInitialized();
    const { PublicKey, TransactionInstruction } = await import('@solana/web3.js');

    const data = this.encodeAddCollateralData(params);

    const keys = [
      { pubkey: new PublicKey(params.owner), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.position), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.pool), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(accounts.collateralCustody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.ownerTokenAccount), isSigner: false, isWritable: true },
      // System accounts
      { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId!,
      data,
    });
  }

  /**
   * Build remove collateral instruction
   */
  async buildRemoveCollateralInstruction(
    params: RemoveCollateralParams,
    accounts: PositionAccounts
  ): Promise<TransactionInstruction> {
    this.ensureInitialized();
    const { PublicKey, TransactionInstruction } = await import('@solana/web3.js');

    const data = this.encodeRemoveCollateralData(params);

    const keys = [
      { pubkey: new PublicKey(params.owner), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.position), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.pool), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(accounts.collateralCustody), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.collateralTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.oracle), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(accounts.ownerTokenAccount), isSigner: false, isWritable: true },
      // System accounts
      { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId!,
      data,
    });
  }

  // ==========================================================================
  // Data Encoding
  // ==========================================================================

  /**
   * Encode open position instruction data
   * Uses createIncreasePositionMarketRequest for market orders
   */
  private encodeOpenPositionData(params: OpenPositionParams): Buffer {
    const PRICE_DECIMALS = 6;
    const USD_DECIMALS = 6;

    // Calculate scaled values
    const sizeUsdScaled = BigInt(Math.floor(params.sizeUsd * 10 ** USD_DECIMALS));
    const collateralScaled = BigInt(Math.floor(params.collateralAmount * 10 ** USD_DECIMALS));
    const priceLimitScaled = params.priceLimit
      ? BigInt(Math.floor(params.priceLimit * 10 ** PRICE_DECIMALS))
      : BigInt(0);

    // Encode side: 0 = long, 1 = short
    const sideValue = params.side === 'long' ? 0 : 1;

    // Build buffer: discriminator (8) + side (1) + sizeUsd (8) + collateral (8) + priceLimit (8)
    const buffer = Buffer.alloc(8 + 1 + 8 + 8 + 8);
    let offset = 0;

    // Discriminator for createIncreasePositionMarketRequest
    INSTRUCTION_DISCRIMINATORS.createIncreasePositionMarketRequest.copy(buffer, offset);
    offset += 8;

    // Side
    buffer.writeUInt8(sideValue, offset);
    offset += 1;

    // Size USD
    buffer.writeBigUInt64LE(sizeUsdScaled, offset);
    offset += 8;

    // Collateral
    buffer.writeBigUInt64LE(collateralScaled, offset);
    offset += 8;

    // Price limit
    buffer.writeBigUInt64LE(priceLimitScaled, offset);

    return buffer;
  }

  /**
   * Encode close position instruction data
   * Uses createDecreasePositionMarketRequest for market orders
   */
  private encodeClosePositionData(params: ClosePositionParams): Buffer {
    const PRICE_DECIMALS = 6;
    const USD_DECIMALS = 6;

    // If sizeUsd is not specified, use 0 to indicate full close
    const sizeUsdScaled = params.sizeUsd
      ? BigInt(Math.floor(params.sizeUsd * 10 ** USD_DECIMALS))
      : BigInt(0);
    const priceLimitScaled = params.priceLimit
      ? BigInt(Math.floor(params.priceLimit * 10 ** PRICE_DECIMALS))
      : BigInt(0);

    // Build buffer: discriminator (8) + sizeUsd (8) + priceLimit (8)
    const buffer = Buffer.alloc(8 + 8 + 8);
    let offset = 0;

    // Discriminator for createDecreasePositionMarketRequest
    INSTRUCTION_DISCRIMINATORS.createDecreasePositionMarketRequest.copy(buffer, offset);
    offset += 8;

    // Size USD
    buffer.writeBigUInt64LE(sizeUsdScaled, offset);
    offset += 8;

    // Price limit
    buffer.writeBigUInt64LE(priceLimitScaled, offset);

    return buffer;
  }

  /**
   * Encode increase size instruction data
   * Uses createIncreasePositionMarketRequest (same as open, for adding to position)
   */
  private encodeIncreaseSizeData(params: IncreaseSizeParams): Buffer {
    const USD_DECIMALS = 6;
    const PRICE_DECIMALS = 6;

    const sizeDeltaScaled = BigInt(Math.floor(params.sizeDeltaUsd * 10 ** USD_DECIMALS));
    const priceLimitScaled = params.priceLimit
      ? BigInt(Math.floor(params.priceLimit * 10 ** PRICE_DECIMALS))
      : BigInt(0);

    const buffer = Buffer.alloc(8 + 8 + 8);
    let offset = 0;

    INSTRUCTION_DISCRIMINATORS.createIncreasePositionMarketRequest.copy(buffer, offset);
    offset += 8;

    buffer.writeBigUInt64LE(sizeDeltaScaled, offset);
    offset += 8;

    buffer.writeBigUInt64LE(priceLimitScaled, offset);

    return buffer;
  }

  /**
   * Encode decrease size instruction data
   * Uses createDecreasePositionMarketRequest (same as close, for partial close)
   */
  private encodeDecreaseSizeData(params: DecreaseSizeParams): Buffer {
    const USD_DECIMALS = 6;
    const PRICE_DECIMALS = 6;

    const sizeDeltaScaled = BigInt(Math.floor(params.sizeDeltaUsd * 10 ** USD_DECIMALS));
    const priceLimitScaled = params.priceLimit
      ? BigInt(Math.floor(params.priceLimit * 10 ** PRICE_DECIMALS))
      : BigInt(0);

    const buffer = Buffer.alloc(8 + 8 + 8);
    let offset = 0;

    INSTRUCTION_DISCRIMINATORS.createDecreasePositionMarketRequest.copy(buffer, offset);
    offset += 8;

    buffer.writeBigUInt64LE(sizeDeltaScaled, offset);
    offset += 8;

    buffer.writeBigUInt64LE(priceLimitScaled, offset);

    return buffer;
  }

  /**
   * Encode add collateral instruction data
   * Uses createIncreasePositionMarketRequest with size=0 to add collateral only
   */
  private encodeAddCollateralData(params: AddCollateralParams): Buffer {
    const USD_DECIMALS = 6;

    const collateralScaled = BigInt(Math.floor(params.collateralAmount * 10 ** USD_DECIMALS));
    const sizeUsd = BigInt(0); // No size change, just add collateral
    const priceLimit = BigInt(0);

    // Build buffer with same format as increase position
    const buffer = Buffer.alloc(8 + 1 + 8 + 8 + 8);
    let offset = 0;

    INSTRUCTION_DISCRIMINATORS.createIncreasePositionMarketRequest.copy(buffer, offset);
    offset += 8;

    // Side (0 = long, but doesn't matter for collateral-only)
    buffer.writeUInt8(0, offset);
    offset += 1;

    // Size USD (0 for collateral-only)
    buffer.writeBigUInt64LE(sizeUsd, offset);
    offset += 8;

    // Collateral
    buffer.writeBigUInt64LE(collateralScaled, offset);
    offset += 8;

    // Price limit
    buffer.writeBigUInt64LE(priceLimit, offset);

    return buffer;
  }

  /**
   * Encode remove collateral instruction data
   * Uses createDecreasePositionMarketRequest with size=0 to remove collateral only
   */
  private encodeRemoveCollateralData(params: RemoveCollateralParams): Buffer {
    const USD_DECIMALS = 6;

    const collateralScaled = BigInt(Math.floor(params.collateralAmount * 10 ** USD_DECIMALS));
    const sizeUsd = BigInt(0); // No size change, just remove collateral
    const priceLimit = BigInt(0);

    // Build buffer with same format as decrease position
    const buffer = Buffer.alloc(8 + 8 + 8 + 8);
    let offset = 0;

    INSTRUCTION_DISCRIMINATORS.createDecreasePositionMarketRequest.copy(buffer, offset);
    offset += 8;

    // Size USD (0 for collateral-only)
    buffer.writeBigUInt64LE(sizeUsd, offset);
    offset += 8;

    // Collateral to remove
    buffer.writeBigUInt64LE(collateralScaled, offset);
    offset += 8;

    // Price limit
    buffer.writeBigUInt64LE(priceLimit, offset);

    return buffer;
  }

  // ==========================================================================
  // Account Resolution Helpers
  // ==========================================================================

  /**
   * Resolve position accounts for a market
   */
  async resolvePositionAccounts(
    owner: string,
    symbol: string,
    side: 'long' | 'short'
  ): Promise<PositionAccounts> {
    this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');

    const jupiterSymbol = unifiedToJupiter(symbol);
    const baseToken = jupiterSymbol.replace('-PERP', '');
    const tokenMint = JUPITER_TOKEN_MINTS[baseToken as keyof typeof JUPITER_TOKEN_MINTS];

    if (!tokenMint) {
      throw new Error(`Unknown token for market: ${symbol}`);
    }

    // Derive PDAs
    const programId = this.programId!;

    // Pool PDA
    const [poolPda] = await PublicKey.findProgramAddress(
      [Buffer.from('pool')],
      programId
    );

    // Custody PDA for the trading asset
    const [custodyPda] = await PublicKey.findProgramAddress(
      [Buffer.from('custody'), new PublicKey(tokenMint).toBuffer()],
      programId
    );

    // Collateral custody (USDC)
    const usdcMint = JUPITER_TOKEN_MINTS.USDC;
    const [collateralCustodyPda] = await PublicKey.findProgramAddress(
      [Buffer.from('custody'), new PublicKey(usdcMint).toBuffer()],
      programId
    );

    // Position PDA
    const ownerPubkey = new PublicKey(owner);
    const sideBuffer = Buffer.from([side === 'long' ? 0 : 1]);
    const [positionPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('position'),
        ownerPubkey.toBuffer(),
        poolPda.toBuffer(),
        custodyPda.toBuffer(),
        sideBuffer,
      ],
      programId
    );

    // Custody token accounts (derived from custody)
    const [custodyTokenAccountPda] = await PublicKey.findProgramAddress(
      [Buffer.from('custody_token_account'), custodyPda.toBuffer()],
      programId
    );

    const [collateralTokenAccountPda] = await PublicKey.findProgramAddress(
      [Buffer.from('custody_token_account'), collateralCustodyPda.toBuffer()],
      programId
    );

    // Oracle (Pyth oracle for the asset)
    // In production, this would be looked up from custody account data
    const [oraclePda] = await PublicKey.findProgramAddress(
      [Buffer.from('oracle'), custodyPda.toBuffer()],
      programId
    );

    return {
      position: positionPda.toBase58(),
      pool: poolPda.toBase58(),
      custody: custodyPda.toBase58(),
      custodyTokenAccount: custodyTokenAccountPda.toBase58(),
      collateralCustody: collateralCustodyPda.toBase58(),
      collateralTokenAccount: collateralTokenAccountPda.toBase58(),
      oracle: oraclePda.toBase58(),
      ownerTokenAccount: '', // Will be set by caller
    };
  }

  /**
   * Get associated token account address
   */
  async getAssociatedTokenAddress(owner: string, mint: string): Promise<string> {
    const { PublicKey } = await import('@solana/web3.js');

    const ownerPubkey = new PublicKey(owner);
    const mintPubkey = new PublicKey(mint);
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const [address] = await PublicKey.findProgramAddress(
      [ownerPubkey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return address.toBase58();
  }
}

/**
 * Create an instruction builder instance
 */
export function createInstructionBuilder(): JupiterInstructionBuilder {
  return new JupiterInstructionBuilder();
}
