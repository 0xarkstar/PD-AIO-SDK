# Fix Misc Report (p-fix-misc)

## Fix 1: Hyperliquid `has.fetchTrades` Flag

**Problem**: `HyperliquidAdapter` declared `has.fetchTrades: true` but the `fetchTrades()` method throws `NotSupportedError` (REST API not supported; WebSocket only). This misleads callers who check the feature flag before calling the method.

**Changes**:
- `src/adapters/hyperliquid/HyperliquidAdapter.ts` line 87: `fetchTrades: true` -> `fetchTrades: false`
- `tests/unit/hyperliquid-adapter.test.ts` line 45: updated assertion to `toBe(false)`
- `tests/integration/hyperliquid-adapter.test.ts` line 61: updated assertion to `toBe(false)`

**Verification**: All 254 Hyperliquid unit tests pass (8 suites).

---

## Fix 2: `check-api-compatibility.ts` ESM Compatibility

**Problem**: `scripts/check-api-compatibility.ts` used `require.main === module` (line 230) which is a CJS pattern incompatible with ESM modules.

**Changes**:
- Added `import { fileURLToPath } from 'node:url';` at the top of the file
- Replaced `if (require.main === module)` with:
  ```typescript
  const isMain = process.argv[1] === fileURLToPath(import.meta.url);
  if (isMain) { ... }
  ```

**Verification**: `npx tsc --noEmit` shows zero errors in this file. The only remaining tsc error is in `src/adapters/jupiter/utils.ts:195` (outside owned scope).

---

## Handoff

- **Attempted**: Fix `has.fetchTrades` flag mismatch and CJS-to-ESM migration for `require.main === module`
- **Worked**: Both fixes applied cleanly; all Hyperliquid tests pass (254/254); tsc clean for owned files
- **Failed**: Nothing
- **Remaining**: The pre-existing `tsc` error in `src/adapters/jupiter/utils.ts:195` (TS2532) is outside scope — should be handled by the Jupiter fixer teammate
