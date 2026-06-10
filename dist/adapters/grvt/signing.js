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
import { verifyTypedData, Signature, getBigInt } from 'ethers';
/** GRVT EIP-712 domain name (constant across environments). */
export const GRVT_EIP712_DOMAIN_NAME = 'GRVT Exchange';
/** GRVT EIP-712 domain version (constant across environments). */
export const GRVT_EIP712_DOMAIN_VERSION = '0';
/** ZKsync hyperchain ids used in the EIP-712 domain. */
export const GRVT_CHAIN_IDS = {
    mainnet: 325,
    testnet: 326,
};
/** Price scaling: limitPrice = price * 1e9. */
export const GRVT_PRICE_DECIMALS = 9;
/** Builder fee scaling: builderFee = fee * 1e4. */
export const GRVT_BUILDER_FEE_DECIMALS = 4;
/**
 * SIGN time-in-force enum (what goes into the EIP-712 `timeInForce` uint8).
 * Distinct from the API request string (GOOD_TILL_TIME / IMMEDIATE_OR_CANCEL / ...).
 */
export const GRVT_SIGN_TIME_IN_FORCE = {
    GOOD_TILL_TIME: 1,
    ALL_OR_NONE: 2,
    IMMEDIATE_OR_CANCEL: 3,
    FILL_OR_KILL: 4,
};
/**
 * EIP-712 type definitions (ethers v6 form: no EIP712Domain key — ethers adds it).
 * Field order is load-bearing (it defines the struct hash).
 */
export const GRVT_EIP712_ORDER_TYPES = {
    Order: [
        { name: 'subAccountID', type: 'uint64' },
        { name: 'isMarket', type: 'bool' },
        { name: 'timeInForce', type: 'uint8' },
        { name: 'postOnly', type: 'bool' },
        { name: 'reduceOnly', type: 'bool' },
        { name: 'legs', type: 'OrderLeg[]' },
        { name: 'nonce', type: 'uint32' },
        { name: 'expiration', type: 'int64' },
    ],
    OrderLeg: [
        { name: 'assetID', type: 'uint256' },
        { name: 'contractSize', type: 'uint64' },
        { name: 'limitPrice', type: 'uint64' },
        { name: 'isBuyingContract', type: 'bool' },
    ],
};
/** EIP-712 types for the builder-fee variant (builder + builderFee after legs). */
export const GRVT_EIP712_ORDER_WITH_BUILDER_FEE_TYPES = {
    OrderWithBuilderFee: [
        { name: 'subAccountID', type: 'uint64' },
        { name: 'isMarket', type: 'bool' },
        { name: 'timeInForce', type: 'uint8' },
        { name: 'postOnly', type: 'bool' },
        { name: 'reduceOnly', type: 'bool' },
        { name: 'legs', type: 'OrderLeg[]' },
        { name: 'builder', type: 'address' },
        { name: 'builderFee', type: 'uint32' },
        { name: 'nonce', type: 'uint32' },
        { name: 'expiration', type: 'int64' },
    ],
    OrderLeg: [
        { name: 'assetID', type: 'uint256' },
        { name: 'contractSize', type: 'uint64' },
        { name: 'limitPrice', type: 'uint64' },
        { name: 'isBuyingContract', type: 'bool' },
    ],
};
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;
/**
 * Scale a decimal string by 10**decimals into a BigInt, truncating excess
 * fractional digits (mirrors the SDK's Decimal-based scaling; never uses float).
 *
 * @throws if `value` is not a plain decimal string.
 */
export function scaleDecimal(value, decimals) {
    if (!DECIMAL_RE.test(value)) {
        throw new Error(`Invalid decimal string for scaling: ${JSON.stringify(value)}`);
    }
    const negative = value.startsWith('-');
    const unsigned = negative ? value.slice(1) : value;
    const [whole, fraction = ''] = unsigned.split('.');
    const paddedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);
    const magnitude = BigInt((whole === '' ? '0' : whole) + paddedFraction);
    return negative ? -magnitude : magnitude;
}
/** Generate a GRVT order nonce: a random integer in [0, 1e9) (fits uint32). */
export function generateNonce() {
    return Math.floor(Math.random() * 1e9);
}
/**
 * Generate an order expiration in unix NANOSECONDS (string).
 * @param hoursFromNow hours until expiry (default 24, must stay <= 30 days).
 */
export function generateExpiration(hoursFromNow = 24) {
    const expirationMs = Date.now() + hoursFromNow * 60 * 60 * 1000;
    return (BigInt(expirationMs) * 1000000n).toString();
}
function encodeLegs(legs) {
    return legs.map((leg) => ({
        assetID: getBigInt(leg.instrumentHash),
        contractSize: scaleDecimal(leg.size, leg.baseDecimals),
        limitPrice: scaleDecimal(leg.limitPrice, GRVT_PRICE_DECIMALS),
        isBuyingContract: leg.isBuyingAsset,
    }));
}
function hasBuilder(input) {
    return (input.builder !== undefined &&
        input.builder !== '' &&
        input.builder !== '0' &&
        input.builder.toLowerCase() !== ZERO_ADDRESS);
}
/**
 * Build the EIP-712 typed-data message + types for a GRVT order.
 * Returns the ethers-ready `{ domain, types, message, primaryType }` plus the
 * resolved nonce/expiration so the caller can echo them into the wire body.
 */
export function buildOrderTypedData(input) {
    const nonce = input.nonce ?? generateNonce();
    const expiration = input.expiration ?? generateExpiration();
    const legs = encodeLegs(input.legs);
    const domain = {
        name: GRVT_EIP712_DOMAIN_NAME,
        version: GRVT_EIP712_DOMAIN_VERSION,
        chainId: input.chainId,
    };
    const base = {
        subAccountID: getBigInt(input.subAccountId),
        isMarket: input.isMarket,
        timeInForce: GRVT_SIGN_TIME_IN_FORCE[input.timeInForce],
        postOnly: input.postOnly,
        reduceOnly: input.reduceOnly,
        legs,
    };
    if (hasBuilder(input)) {
        if (input.builderFee === undefined) {
            throw new Error('builderFee is required when builder is set');
        }
        const message = {
            ...base,
            builder: input.builder,
            builderFee: Number(scaleDecimal(input.builderFee, GRVT_BUILDER_FEE_DECIMALS)),
            nonce,
            expiration,
        };
        return {
            domain,
            types: GRVT_EIP712_ORDER_WITH_BUILDER_FEE_TYPES,
            message,
            primaryType: 'OrderWithBuilderFee',
            nonce,
            expiration,
        };
    }
    const message = { ...base, nonce, expiration };
    return {
        domain,
        types: GRVT_EIP712_ORDER_TYPES,
        message,
        primaryType: 'Order',
        nonce,
        expiration,
    };
}
/**
 * Sign a GRVT order with an ethers wallet, returning the wire `signature` DTO.
 * Uses `eth_signTypedData_v4` semantics via ethers `Wallet.signTypedData`.
 */
export async function signOrder(wallet, input) {
    const { domain, types, message, nonce, expiration } = buildOrderTypedData(input);
    const flatSignature = await wallet.signTypedData(domain, types, message);
    const { r, s, v } = Signature.from(flatSignature);
    return {
        signer: wallet.address,
        r,
        s,
        v,
        expiration,
        nonce,
        chainId: input.chainId,
    };
}
/**
 * Recover the signer address from a GRVT order signature — the inverse of
 * {@link signOrder}, for self-consistency tests and verification.
 */
export function recoverOrderSigner(input, signature) {
    const { domain, types, message } = buildOrderTypedData({
        ...input,
        // pin nonce/expiration so the recovered hash matches what was signed
        nonce: input.nonce,
        expiration: input.expiration,
    });
    const serialized = Signature.from({
        r: signature.r,
        s: signature.s,
        v: signature.v,
    }).serialized;
    return verifyTypedData(domain, types, message, serialized);
}
//# sourceMappingURL=signing.js.map