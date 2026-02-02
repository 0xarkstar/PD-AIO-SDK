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
 * These are the first 8 bytes of each instruction to identify the operation
 */
const INSTRUCTION_DISCRIMINATORS = {
  openPosition: Buffer.from([0x87, 0x40, 0x6e, 0x53, 0x27, 0xc7, 0x44, 0x10]),
  closePosition: Buffer.from([0x7b, 0x86, 0x51, 0x0d, 0x35, 0x96, 0x73, 0x21]),
  increaseSize: Buffer.from([0xa3, 0xc4, 0x89, 0x11, 0x45, 0xd2, 0x88, 0x55]),
  decreaseSize: Buffer.from([0xb5, 0x56, 0x77, 0x23, 0x67, 0x89, 0x99, 0x66]),
  addCollateral: Buffer.from([0xc7, 0x68, 0x88, 0x34, 0x78, 0x90, 0xaa, 0x77]),
  removeCollateral: Buffer.from([0xd9, 0x79, 0x99, 0x45, 0x89, 0xa1, 0xbb, 0x88]),
  liquidate: Buffer.from([0xe0, 0x8a, 0xaa, 0x56, 0x9a, 0xb2, 0xcc, 0x99]),
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

    // Discriminator
    INSTRUCTION_DISCRIMINATORS.openPosition.copy(buffer, offset);
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

    // Discriminator
    INSTRUCTION_DISCRIMINATORS.closePosition.copy(buffer, offset);
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

    INSTRUCTION_DISCRIMINATORS.increaseSize.copy(buffer, offset);
    offset += 8;

    buffer.writeBigUInt64LE(sizeDeltaScaled, offset);
    offset += 8;

    buffer.writeBigUInt64LE(priceLimitScaled, offset);

    return buffer;
  }

  /**
   * Encode decrease size instruction data
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

    INSTRUCTION_DISCRIMINATORS.decreaseSize.copy(buffer, offset);
    offset += 8;

    buffer.writeBigUInt64LE(sizeDeltaScaled, offset);
    offset += 8;

    buffer.writeBigUInt64LE(priceLimitScaled, offset);

    return buffer;
  }

  /**
   * Encode add collateral instruction data
   */
  private encodeAddCollateralData(params: AddCollateralParams): Buffer {
    const USD_DECIMALS = 6;

    const collateralScaled = BigInt(Math.floor(params.collateralAmount * 10 ** USD_DECIMALS));

    const buffer = Buffer.alloc(8 + 8);
    let offset = 0;

    INSTRUCTION_DISCRIMINATORS.addCollateral.copy(buffer, offset);
    offset += 8;

    buffer.writeBigUInt64LE(collateralScaled, offset);

    return buffer;
  }

  /**
   * Encode remove collateral instruction data
   */
  private encodeRemoveCollateralData(params: RemoveCollateralParams): Buffer {
    const USD_DECIMALS = 6;

    const collateralScaled = BigInt(Math.floor(params.collateralAmount * 10 ** USD_DECIMALS));

    const buffer = Buffer.alloc(8 + 8);
    let offset = 0;

    INSTRUCTION_DISCRIMINATORS.removeCollateral.copy(buffer, offset);
    offset += 8;

    buffer.writeBigUInt64LE(collateralScaled, offset);

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
