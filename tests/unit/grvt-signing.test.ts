/**
 * Unit tests for GRVT EIP-712 order signing (signing.ts).
 *
 * The load-bearing test is the sign -> recover roundtrip: it proves the
 * leg-based EIP-712 domain + Order/OrderLeg struct + value encoding are
 * self-consistent (ethers recovers the signer from the typed data). This is
 * the GRVT analog of the Katana EIP-712 fix — a wrong struct silently produces
 * a signature the venue rejects.
 */

import { Wallet, getBigInt } from 'ethers';
import { describe, it, expect } from '@jest/globals';
import {
  scaleDecimal,
  generateNonce,
  generateExpiration,
  buildOrderTypedData,
  signOrder,
  recoverOrderSigner,
  GRVT_CHAIN_IDS,
  GRVT_SIGN_TIME_IN_FORCE,
  GRVT_EIP712_ORDER_TYPES,
  GRVT_EIP712_DOMAIN_NAME,
  GRVT_EIP712_DOMAIN_VERSION,
  type GrvtSignOrderInput,
} from '../../src/adapters/grvt/signing.js';

// Hardhat account #0 — deterministic test key (NOT a real funded key).
const TEST_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function baseOrder(overrides: Partial<GrvtSignOrderInput> = {}): GrvtSignOrderInput {
  return {
    subAccountId: '123456789',
    isMarket: false,
    timeInForce: 'GOOD_TILL_TIME',
    postOnly: true,
    reduceOnly: false,
    chainId: GRVT_CHAIN_IDS.mainnet,
    nonce: 987654321,
    expiration: '1900000000000000000', // fixed, future, < 30d when tests run is not validated here
    legs: [
      {
        instrumentHash: '0x030501', // BTC perp asset id
        baseDecimals: 9,
        size: '0.001',
        limitPrice: '50000.0',
        isBuyingAsset: true,
      },
    ],
    ...overrides,
  };
}

describe('GRVT signing — scaleDecimal', () => {
  it('scales price by 1e9 without float loss (the 1.013 vector the SDK warns about)', () => {
    // int(float("1.013") * 1e9) === 1012999999  (WRONG)
    // Decimal("1.013") * 1e9   === 1013000000   (CORRECT)
    expect(scaleDecimal('1.013', 9)).toBe(1013000000n);
  });

  it('scales size by base_decimals', () => {
    expect(scaleDecimal('0.001', 9)).toBe(1000000n);
    expect(scaleDecimal('1', 9)).toBe(1000000000n);
    expect(scaleDecimal('50000.0', 9)).toBe(50000000000000n);
  });

  it('truncates excess fractional digits (no rounding)', () => {
    expect(scaleDecimal('1.2345678901', 9)).toBe(1234567890n);
  });

  it('handles integers and leading-zero fractions', () => {
    expect(scaleDecimal('0.000000001', 9)).toBe(1n);
    expect(scaleDecimal('42', 6)).toBe(42000000n);
  });

  it('rejects non-decimal strings', () => {
    expect(() => scaleDecimal('1e9', 9)).toThrow();
    expect(() => scaleDecimal('abc', 9)).toThrow();
    expect(() => scaleDecimal('', 9)).toThrow();
  });
});

describe('GRVT signing — nonce/expiration generators', () => {
  it('generateNonce stays within [0, 1e9) (uint32-safe)', () => {
    for (let i = 0; i < 1000; i += 1) {
      const n = generateNonce();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1e9);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('generateExpiration returns future nanoseconds within ~24h by default', () => {
    const nowNs = BigInt(Date.now()) * 1_000_000n;
    const exp = BigInt(generateExpiration());
    expect(exp).toBeGreaterThan(nowNs);
    const dayNs = 24n * 60n * 60n * 1_000_000_000n;
    expect(exp - nowNs).toBeLessThanOrEqual(dayNs + 1_000_000_000n);
  });
});

describe('GRVT signing — typed data structure', () => {
  it('domain has name/version/chainId and NO verifyingContract', () => {
    const { domain } = buildOrderTypedData(baseOrder());
    expect(domain.name).toBe(GRVT_EIP712_DOMAIN_NAME);
    expect(domain.version).toBe(GRVT_EIP712_DOMAIN_VERSION);
    expect(domain.chainId).toBe(325);
    expect('verifyingContract' in domain).toBe(false);
  });

  it('uses the leg-based Order + OrderLeg struct (not a flat struct)', () => {
    const { types, primaryType } = buildOrderTypedData(baseOrder());
    expect(primaryType).toBe('Order');
    expect(types).toBe(GRVT_EIP712_ORDER_TYPES);
    expect(types.OrderLeg.map((f) => f.name)).toEqual([
      'assetID',
      'contractSize',
      'limitPrice',
      'isBuyingContract',
    ]);
  });

  it('encodes legs with scaled bigint values', () => {
    const { message } = buildOrderTypedData(baseOrder());
    const legs = message.legs as Array<Record<string, unknown>>;
    expect(legs).toHaveLength(1);
    expect(legs[0].assetID).toBe(getBigInt('0x030501'));
    expect(legs[0].contractSize).toBe(1000000n); // 0.001 * 1e9
    expect(legs[0].limitPrice).toBe(50000000000000n); // 50000 * 1e9
    expect(legs[0].isBuyingContract).toBe(true);
  });

  it('maps timeInForce to the sign enum (GTT=1)', () => {
    const { message } = buildOrderTypedData(baseOrder());
    expect(message.timeInForce).toBe(GRVT_SIGN_TIME_IN_FORCE.GOOD_TILL_TIME);
    expect(message.timeInForce).toBe(1);
  });

  it('builds the OrderWithBuilderFee struct when a builder is set', () => {
    const { types, primaryType, message } = buildOrderTypedData(
      baseOrder({ builder: '0x1111111111111111111111111111111111111111', builderFee: '0.001' })
    );
    expect(primaryType).toBe('OrderWithBuilderFee');
    expect(types.OrderWithBuilderFee).toBeDefined();
    expect(message.builder).toBe('0x1111111111111111111111111111111111111111');
    expect(message.builderFee).toBe(10); // 0.001 * 1e4
  });

  it('throws if builder is set without a builderFee', () => {
    expect(() =>
      buildOrderTypedData(
        baseOrder({ builder: '0x1111111111111111111111111111111111111111' })
      )
    ).toThrow(/builderFee is required/);
  });
});

describe('GRVT signing — sign/recover roundtrip', () => {
  it('recovers the signer address from a signed order (Order)', async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const order = baseOrder();
    const sig = await signOrder(wallet, order);

    expect(sig.signer).toBe(wallet.address);
    expect(sig.r).toMatch(/^0x[0-9a-f]{64}$/);
    expect(sig.s).toMatch(/^0x[0-9a-f]{64}$/);
    expect([27, 28]).toContain(sig.v);
    expect(sig.nonce).toBe(order.nonce);
    expect(sig.expiration).toBe(order.expiration);
    expect(sig.chainId).toBe(325);

    const recovered = recoverOrderSigner(order, sig);
    expect(recovered).toBe(wallet.address);
  });

  it('recovers the signer for a sell-side order', async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const order = baseOrder({
      legs: [
        {
          instrumentHash: '0x040501',
          baseDecimals: 9,
          size: '2.5',
          limitPrice: '3000.123456789',
          isBuyingAsset: false,
        },
      ],
    });
    const sig = await signOrder(wallet, order);
    expect(recoverOrderSigner(order, sig)).toBe(wallet.address);
  });

  it('recovers the signer for an OrderWithBuilderFee', async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const order = baseOrder({
      builder: '0x1111111111111111111111111111111111111111',
      builderFee: '0.0025',
    });
    const sig = await signOrder(wallet, order);
    expect(recoverOrderSigner(order, sig)).toBe(wallet.address);
  });

  it('a tampered message does NOT recover the same signer', async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const order = baseOrder();
    const sig = await signOrder(wallet, order);
    // flip the size — recovered address must differ
    const tampered = baseOrder({
      legs: [{ ...order.legs[0], size: '0.002' }],
    });
    expect(recoverOrderSigner(tampered, sig)).not.toBe(wallet.address);
  });

  it('testnet chainId (326) changes the domain separator (different signer recovery basis)', async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const mainnetOrder = baseOrder({ chainId: GRVT_CHAIN_IDS.mainnet });
    const testnetOrder = baseOrder({ chainId: GRVT_CHAIN_IDS.testnet });
    const mainnetSig = await signOrder(wallet, mainnetOrder);
    // the mainnet signature must NOT validate against the testnet domain
    expect(recoverOrderSigner(testnetOrder, mainnetSig)).not.toBe(wallet.address);
    // but it does validate against its own domain
    expect(recoverOrderSigner(mainnetOrder, mainnetSig)).toBe(wallet.address);
  });
});
