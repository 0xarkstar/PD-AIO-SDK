# Fix Lint & GMX Coverage Report

## ESLint/Prettier Fixes

Ran `npx prettier --write` on the following 5 files:

1. `src/adapters/gmx/GmxAdapter.ts` - formatted
2. `src/adapters/gmx/constants.ts` - formatted
3. `src/adapters/lighter/LighterAdapter.ts` - formatted
4. `src/adapters/lighter/LighterMarketData.ts` - formatted
5. `src/adapters/ostium/OstiumNormalizer.ts` - formatted

### ESLint Verification

```
npx eslint src/adapters/gmx/ src/adapters/lighter/ src/adapters/ostium/
✖ 322 problems (0 errors, 322 warnings)
```

All 0 errors. Warnings are pre-existing (unsafe `any` types, missing `await` in async methods) and not introduced by this change.

## GMX Coverage Fix

### Problem
GMX `constants.ts` function coverage was at 77.77% (below 80% threshold). Two functions were untested:
- `getTokenDecimals()` - returns decimals for a given base asset
- `getOraclePriceDivisor()` - computes 10^(30 - tokenDecimals) for oracle price conversion

### Solution
Added 13 new test cases to `tests/unit/gmx-constants.test.ts`:

**`getTokenDecimals` (7 tests):**
- ETH returns 18
- BTC returns 8
- USDC returns 6
- AVAX returns 18
- SOL returns 9
- Unknown token returns default (18)
- Empty string returns default (18)

**`getOraclePriceDivisor` (6 tests):**
- ETH -> 10^12
- BTC -> 10^22
- USDC -> 10^24
- SOL -> 10^21
- Unknown token -> 10^12 (default)
- Consistency check: divisor = 10^(30 - getTokenDecimals(asset)) for 6 assets

### Coverage Results
```
GMX constants.ts:
  Stmts: 97.61% | Branch: 81.81% | Funcs: 100% | Lines: 100%
```

All 63 tests passing (50 existing + 13 new).

## Files Modified
- `src/adapters/gmx/GmxAdapter.ts` (prettier only)
- `src/adapters/gmx/constants.ts` (prettier only)
- `src/adapters/lighter/LighterAdapter.ts` (prettier only)
- `src/adapters/lighter/LighterMarketData.ts` (prettier only)
- `src/adapters/ostium/OstiumNormalizer.ts` (prettier only)
- `tests/unit/gmx-constants.test.ts` (added 13 test cases for getTokenDecimals + getOraclePriceDivisor)

## Handoff
- **Attempted**: Prettier formatting on 5 adapter files; adding test coverage for getTokenDecimals and getOraclePriceDivisor
- **Worked**: All prettier formatting applied cleanly; all 13 new tests pass; GMX function coverage now at 100%
- **Failed**: Nothing
- **Remaining**: Pre-existing ESLint warnings (322) are all `@typescript-eslint` warnings (no-explicit-any, require-await, no-unsafe-member-access) — not actionable in this scope
