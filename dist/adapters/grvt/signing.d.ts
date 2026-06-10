/**
 * GRVT EIP-712 order signing (self-contained, live-verified).
 *
 * Ground-truthed 2026-05-26 against the official GRVT SDK source:
 *  - grvt-pysdk  `src/pysdk/grvt_raw_signing.py` (`sign_order`, `build_EIP712_order_message_data`)
 *  - grvt-ts-sdk `src/signing/{domain,types}.ts` (EIP-712 domain + Order/OrderLeg struct)
 *
 * The order EIP-712 struct is LEG-BASED (not the flat struct the previous
 * adapter guessed). Signing details that are load-bearing:
 *  - domain = { name: "GRVT Exchange", version: "0", chainId }  (NO verifyingContract)
 *  - chainId: mainnet 325, testnet 326
 *  - contractSize = Decimal(size)  * 10 ** instrument.base_decimals   (uint64)
 *  - limitPrice   = Decimal(price) * 1e9 (PRICE_MULTIPLIER)           (uint64)
 *  - assetID      = instrument.instrument_hash (uint256)
 *  - timeInForce  = SIGN enum (GTT=1, AON=2, IOC=3, FOK=4) — NOT the API string
 *  - nonce        = random in [0, 1e9)  (uint32)
 *  - expiration   = unix NANOSECONDS, future, <= 30 days              (int64)
 *
 * Scaling uses string -> BigInt math (never float): the SDK explicitly warns
 * `int(float("1.013") * 1e9) == 1012999999` vs the correct `1013000000`.
 *
 * This module deliberately depends on nothing else in the adapter so it can be
 * unit-proven in isolation (sign -> recover roundtrip).
 */
import { Wallet } from 'ethers';
import type { TypedDataDomain, TypedDataField } from 'ethers';
/** GRVT EIP-712 domain name (constant across environments). */
export declare const GRVT_EIP712_DOMAIN_NAME = "GRVT Exchange";
/** GRVT EIP-712 domain version (constant across environments). */
export declare const GRVT_EIP712_DOMAIN_VERSION = "0";
/** ZKsync hyperchain ids used in the EIP-712 domain. */
export declare const GRVT_CHAIN_IDS: {
    readonly mainnet: 325;
    readonly testnet: 326;
};
/** Price scaling: limitPrice = price * 1e9. */
export declare const GRVT_PRICE_DECIMALS = 9;
/** Builder fee scaling: builderFee = fee * 1e4. */
export declare const GRVT_BUILDER_FEE_DECIMALS = 4;
/**
 * SIGN time-in-force enum (what goes into the EIP-712 `timeInForce` uint8).
 * Distinct from the API request string (GOOD_TILL_TIME / IMMEDIATE_OR_CANCEL / ...).
 */
export declare const GRVT_SIGN_TIME_IN_FORCE: {
    readonly GOOD_TILL_TIME: 1;
    readonly ALL_OR_NONE: 2;
    readonly IMMEDIATE_OR_CANCEL: 3;
    readonly FILL_OR_KILL: 4;
};
export type GrvtTimeInForce = keyof typeof GRVT_SIGN_TIME_IN_FORCE;
/**
 * EIP-712 type definitions (ethers v6 form: no EIP712Domain key — ethers adds it).
 * Field order is load-bearing (it defines the struct hash).
 */
export declare const GRVT_EIP712_ORDER_TYPES: Record<string, TypedDataField[]>;
/** EIP-712 types for the builder-fee variant (builder + builderFee after legs). */
export declare const GRVT_EIP712_ORDER_WITH_BUILDER_FEE_TYPES: Record<string, TypedDataField[]>;
/** One leg of an order, in human-readable units. */
export interface GrvtOrderLegInput {
    /** Instrument hash from `full/v1/instruments` (e.g. '0x030501'), used as the uint256 assetID. */
    instrumentHash: string;
    /** Instrument `base_decimals` (e.g. BTC = 9), used to scale `size` into contractSize. */
    baseDecimals: number;
    /** Human size, e.g. '0.001'. */
    size: string;
    /** Human limit price, e.g. '50000.0'. */
    limitPrice: string;
    /** true = buying the contract (bid), false = selling (ask). */
    isBuyingAsset: boolean;
}
/** Inputs to sign a GRVT order. */
export interface GrvtSignOrderInput {
    /** Trading sub-account id (uint64). */
    subAccountId: string | number | bigint;
    /** Market order flag (maker quotes = false). */
    isMarket: boolean;
    /** Time in force (sign enum key). Maker quotes use GOOD_TILL_TIME. */
    timeInForce: GrvtTimeInForce;
    /** Post-only (maker quotes = true → speedbump-exempt, rejects on cross). */
    postOnly: boolean;
    /** Reduce-only. */
    reduceOnly: boolean;
    /** Order legs (single leg for a plain perp order). */
    legs: GrvtOrderLegInput[];
    /** EIP-712 chain id (325 mainnet / 326 testnet). */
    chainId: number;
    /** uint32 dedup nonce; defaults to a random value in [0, 1e9). */
    nonce?: number;
    /** int64 expiration in unix NANOSECONDS (string); defaults to now + 24h. */
    expiration?: string;
    /** Optional builder address (enables the OrderWithBuilderFee struct). */
    builder?: string;
    /** Optional human builder fee, required when `builder` is set. */
    builderFee?: string;
}
/** GRVT order signature DTO (matches the wire `signature` object). */
export interface GrvtSignature {
    signer: string;
    r: string;
    s: string;
    v: number;
    expiration: string;
    nonce: number;
    chainId: number;
}
/**
 * Scale a decimal string by 10**decimals into a BigInt, truncating excess
 * fractional digits (mirrors the SDK's Decimal-based scaling; never uses float).
 *
 * @throws if `value` is not a plain decimal string.
 */
export declare function scaleDecimal(value: string, decimals: number): bigint;
/** Generate a GRVT order nonce: a random integer in [0, 1e9) (fits uint32). */
export declare function generateNonce(): number;
/**
 * Generate an order expiration in unix NANOSECONDS (string).
 * @param hoursFromNow hours until expiry (default 24, must stay <= 30 days).
 */
export declare function generateExpiration(hoursFromNow?: number): string;
/**
 * Build the EIP-712 typed-data message + types for a GRVT order.
 * Returns the ethers-ready `{ domain, types, message, primaryType }` plus the
 * resolved nonce/expiration so the caller can echo them into the wire body.
 */
export declare function buildOrderTypedData(input: GrvtSignOrderInput): {
    domain: TypedDataDomain;
    types: Record<string, TypedDataField[]>;
    message: Record<string, unknown>;
    primaryType: string;
    nonce: number;
    expiration: string;
};
/**
 * Sign a GRVT order with an ethers wallet, returning the wire `signature` DTO.
 * Uses `eth_signTypedData_v4` semantics via ethers `Wallet.signTypedData`.
 */
export declare function signOrder(wallet: Wallet, input: GrvtSignOrderInput): Promise<GrvtSignature>;
/**
 * Recover the signer address from a GRVT order signature — the inverse of
 * {@link signOrder}, for self-consistency tests and verification.
 */
export declare function recoverOrderSigner(input: GrvtSignOrderInput, signature: Pick<GrvtSignature, 'r' | 's' | 'v'>): string;
//# sourceMappingURL=signing.d.ts.map