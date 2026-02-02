/**
 * Jupiter Perps Program Instructions
 *
 * Builds Solana program instructions for Jupiter Perpetuals trading.
 * Handles position opening, closing, and modification.
 */
type TransactionInstruction = import('@solana/web3.js').TransactionInstruction;
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
export declare class JupiterInstructionBuilder {
    private programId?;
    private isInitialized;
    /**
     * Initialize the instruction builder
     */
    initialize(): Promise<void>;
    /**
     * Ensure builder is initialized
     */
    private ensureInitialized;
    /**
     * Build open position instruction
     */
    buildOpenPositionInstruction(params: OpenPositionParams, accounts: PositionAccounts): Promise<TransactionInstruction>;
    /**
     * Build close position instruction
     */
    buildClosePositionInstruction(params: ClosePositionParams, accounts: PositionAccounts): Promise<TransactionInstruction>;
    /**
     * Build increase size instruction
     */
    buildIncreaseSizeInstruction(params: IncreaseSizeParams, accounts: PositionAccounts): Promise<TransactionInstruction>;
    /**
     * Build decrease size instruction
     */
    buildDecreaseSizeInstruction(params: DecreaseSizeParams, accounts: PositionAccounts): Promise<TransactionInstruction>;
    /**
     * Build add collateral instruction
     */
    buildAddCollateralInstruction(params: AddCollateralParams, accounts: PositionAccounts): Promise<TransactionInstruction>;
    /**
     * Build remove collateral instruction
     */
    buildRemoveCollateralInstruction(params: RemoveCollateralParams, accounts: PositionAccounts): Promise<TransactionInstruction>;
    /**
     * Encode open position instruction data
     * Uses createIncreasePositionMarketRequest for market orders
     */
    private encodeOpenPositionData;
    /**
     * Encode close position instruction data
     * Uses createDecreasePositionMarketRequest for market orders
     */
    private encodeClosePositionData;
    /**
     * Encode increase size instruction data
     * Uses createIncreasePositionMarketRequest (same as open, for adding to position)
     */
    private encodeIncreaseSizeData;
    /**
     * Encode decrease size instruction data
     * Uses createDecreasePositionMarketRequest (same as close, for partial close)
     */
    private encodeDecreaseSizeData;
    /**
     * Encode add collateral instruction data
     * Uses createIncreasePositionMarketRequest with size=0 to add collateral only
     */
    private encodeAddCollateralData;
    /**
     * Encode remove collateral instruction data
     * Uses createDecreasePositionMarketRequest with size=0 to remove collateral only
     */
    private encodeRemoveCollateralData;
    /**
     * Resolve position accounts for a market
     */
    resolvePositionAccounts(owner: string, symbol: string, side: 'long' | 'short'): Promise<PositionAccounts>;
    /**
     * Get associated token account address
     */
    getAssociatedTokenAddress(owner: string, mint: string): Promise<string>;
}
/**
 * Create an instruction builder instance
 */
export declare function createInstructionBuilder(): JupiterInstructionBuilder;
export {};
//# sourceMappingURL=instructions.d.ts.map