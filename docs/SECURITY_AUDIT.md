# Security Audit Report

**Date**: 2026-02-14
**SDK Version**: 0.2.0
**Node Version**: v25.2.1
**npm Version**: 11.6.2
**Auditor**: Automated npm audit + manual analysis

## Summary

| Metric | Count |
|--------|-------|
| Total vulnerabilities (before fix) | 18 |
| Fixed by `npm audit fix` | 1 |
| Remaining | 17 |
| — High severity | 7 |
| — Low severity | 10 |
| Fixable without breaking changes | 0 |
| Upstream (cannot fix from SDK side) | 17 |

**All 17 remaining vulnerabilities are in transitive dependencies of upstream packages (`@drift-labs/sdk`, `@paradex/sdk`, `@solana/web3.js`). No action is possible from the SDK side without breaking changes.**

## Vulnerability Details

### Fixed

| Package | Severity | Advisory | Resolution |
|---------|----------|----------|------------|
| `axios` <=1.13.4 | **High** | [GHSA-43fc-jf86-j433](https://github.com/advisories/GHSA-43fc-jf86-j433) — DoS via `__proto__` key in mergeConfig | Updated to latest via `npm audit fix` |

### Upstream — Cannot Fix (Cluster 1: `elliptic`)

**Root cause**: The `elliptic` package uses a cryptographic primitive with a risky implementation ([GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84)). No patched version exists.

| # | Package | Severity | Required By (chain) | Why Unfixable |
|---|---------|----------|---------------------|---------------|
| 1 | `elliptic` (all versions) | Low | `@paradex/sdk` → `@starkware-industries/starkware-crypto-utils` | No fix available upstream; `elliptic` maintainers have not released a patch |
| 2 | `browserify-sign` >=2.4.0 | Low | `crypto-browserify` → `@starkware-industries/starkware-crypto-utils` | Depends on `elliptic` |
| 3 | `crypto-browserify` >=3.4.0 | Low | `@starkware-industries/starkware-crypto-utils` | Depends on `browserify-sign` + `create-ecdh` |
| 4 | `create-ecdh` (all versions) | Low | `crypto-browserify` | Depends on `elliptic` |
| 5 | `secp256k1` >=2.0.0 | Low | `ethereum-cryptography` | Depends on `elliptic` |
| 6 | `ethereum-cryptography` 0.1.x | Low | `ethereumjs-util` | Depends on `secp256k1` |
| 7 | `ethereumjs-util` >=4.5.1 | Low | `ethereumjs-wallet` | Depends on `ethereum-cryptography` |
| 8 | `ethereumjs-wallet` >=0.6.5 | Low | `@starkware-industries/starkware-crypto-utils` | Depends on `ethereum-cryptography` + `ethereumjs-util` |
| 9 | `@starkware-industries/starkware-crypto-utils` | Low | `@paradex/sdk` | Depends on all of the above |
| 10 | `@paradex/sdk` (all versions) | Low | **SDK direct dep** (Paradex adapter) | Cannot update; upstream must fix |

**Risk assessment**: Low. The `elliptic` advisory describes a theoretical weakness in the ECDSA implementation, not a practical exploit. StarkNet/StarkEx signing uses Stark curves (not secp256k1), so the affected elliptic code path is not exercised for Paradex operations. These packages are only loaded when the Paradex adapter is used.

### Upstream — Cannot Fix (Cluster 2: `bigint-buffer`)

**Root cause**: `bigint-buffer` has a buffer overflow vulnerability in `toBigIntLE()` ([GHSA-3gc7-fjrx-p6mg](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg)).

| # | Package | Severity | Required By (chain) | Why Unfixable |
|---|---------|----------|---------------------|---------------|
| 1 | `bigint-buffer` (all versions) | **High** | `@solana/buffer-layout-utils` → `@solana/spl-token` → `@drift-labs/sdk` | Fix requires `@drift-labs/sdk@0.1.35` (breaking downgrade from ^2.156.0) |
| 2 | `@solana/buffer-layout-utils` | **High** | `@solana/spl-token` | Depends on `bigint-buffer` |
| 3 | `@solana/spl-token` >=0.2.0 | **High** | `@drift-labs/sdk`, `@ellipsis-labs/phoenix-sdk`, `@openbook-dex/openbook-v2` | Depends on `@solana/buffer-layout-utils` |
| 4 | `@drift-labs/sdk` >=0.1.36 | **High** | **SDK direct dep** (Drift adapter) | Depends on vulnerable `@solana/spl-token` |
| 5 | `@ellipsis-labs/phoenix-sdk` | **High** | `@drift-labs/sdk` | Depends on vulnerable `@solana/spl-token` |
| 6 | `@openbook-dex/openbook-v2` | **High** | `@drift-labs/sdk` | Depends on vulnerable `@solana/spl-token` |
| 7 | `@solana/web3.js` 1.43.1-1.98.0 | **High** | `@drift-labs/sdk` (internal copy) | Depends on `bigint-buffer` |

**Risk assessment**: Moderate. The buffer overflow in `bigint-buffer` could theoretically be triggered if untrusted BigInt values are passed through `toBigIntLE()`. In practice, the Drift adapter uses this code path only for Solana on-chain data deserialization where input comes from the Solana RPC. Exploitation would require a compromised RPC endpoint. Only loaded when the Drift adapter is used.

## Dependency Weight Analysis

### Total `node_modules` Size: 608 MB

### Major Dependencies

| Dependency | Size | Required By | Chain-Specific | Can Be Optional? |
|-----------|------|-------------|----------------|-----------------|
| `@solana/*` (total) | 102 MB | Drift, Jupiter, Pacifica, Backpack | Solana | Yes — only Solana exchange users need this |
| `@drift-labs/sdk` | 78 MB | Drift | Solana | Yes — only Drift users |
| `@solana/web3.js` | 19 MB | Jupiter, Drift, Pacifica, Backpack | Solana | Yes — only Solana exchange users |
| `ethers` | 18 MB | Hyperliquid, GRVT, Ostium, Aster, GMX | EVM | Semi-core — many exchanges need it |
| `starknet` | 11 MB | Paradex, EdgeX, Extended | StarkNet | Yes — only StarkNet exchange users |
| `@noble/ed25519` | 2.8 MB (as `@noble`) | Backpack, Lighter | Multi | Small, reasonable to keep |
| `axios` | 2.4 MB | Various (HTTP client) | None | Core utility |
| `@starkware-industries` | 2.2 MB | Paradex | StarkNet | Yes — via `@paradex/sdk` |
| `@paradex/sdk` | 104 KB | Paradex | StarkNet | Yes — only Paradex users |

### Chain Dependency Map

| Chain | Total Weight | Exchanges | Key Packages |
|-------|-------------|-----------|--------------|
| **Solana** | ~180 MB | Drift, Jupiter, Pacifica, Backpack | `@drift-labs/sdk`, `@solana/web3.js`, `@solana/spl-token` |
| **EVM** | ~18 MB | Hyperliquid, GRVT, Ostium, Aster, GMX | `ethers` |
| **StarkNet** | ~13 MB | Paradex, EdgeX, Extended | `starknet`, `@starkware-industries/*` |
| **None** (REST-only) | ~5 MB | Lighter, Nado, Variational, dYdX | `ws`, `zod`, `eventemitter3` |

### Engine Compatibility Warnings

The following packages require Node ^24.0.0 but the current environment runs v25.2.1:
- `@drift-labs/sdk@2.156.0`
- `@pythnetwork/pyth-lazer-sdk@5.2.1` (transitive of `@drift-labs/sdk`)

These produce `EBADENGINE` warnings but do not currently cause runtime failures.

## Recommendations

### For v0.2.0 (Current Release)

1. **No blocking issues.** All 17 remaining vulnerabilities are upstream and cannot be resolved without breaking changes.
2. **Axios fixed.** The one actionable vulnerability (axios DoS) has been resolved.
3. **Document for users.** Include a note in README that `npm audit` will report upstream vulnerabilities from chain-specific SDKs.

### For v1.0 (Future)

1. **Move chain-specific deps to `peerDependencies`**:
   - `@drift-labs/sdk` — Drift only (saves ~78 MB for non-Drift users)
   - `starknet` — Paradex/EdgeX/Extended only (saves ~11 MB)
   - `@solana/web3.js` — Solana exchanges only (saves ~19 MB)
   - `@paradex/sdk` — Paradex only
   - This would also transfer audit responsibility to users for chain-specific vulnerabilities

2. **Consider lighter alternatives**:
   - Replace `@solana/web3.js` v1.x with `@solana/kit` (v2) when Drift SDK supports it
   - The Solana ecosystem is the heaviest contributor (180 MB / 608 MB = ~30%)

3. **Monitor upstream fixes**:
   - `elliptic`: Watch for a patched release or `@starkware-industries` migration to `@noble/curves`
   - `bigint-buffer`: Watch for `@solana/spl-token` migration away from `bigint-buffer`

### For Users

Users who only need specific exchanges can use subpath imports to get tree-shaking benefits:

```typescript
// Instead of importing everything (608 MB node_modules):
import { createAdapter } from 'pd-aio-sdk'

// Import only what you need:
import { HyperliquidAdapter } from 'pd-aio-sdk/hyperliquid'
```

Note: Tree-shaking only helps with bundle size, not `node_modules` install size. Moving to `peerDependencies` in v1.0 will address install size.

## Handoff

- **Attempted**: Full npm audit, safe fix application, dependency weight analysis
- **Worked**: `npm audit fix` resolved axios vulnerability (18 → 17 remaining). All remaining vulns confirmed upstream.
- **Failed**: N/A — no safe fixes available for remaining vulnerabilities
- **Remaining**: Moving chain-specific deps to `peerDependencies` (deferred to v1.0 planning)
