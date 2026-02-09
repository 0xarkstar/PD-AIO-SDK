# PD-AIO-SDK Cycle 7: Type Safety + ESLint + Coverage Sweep

## Active Phase: P1 (Implementation)

## Baseline (post-Cycle 6)
- Tests: 5017 passed, 0 failures
- Coverage: 73.43% stmts, 78.28% functions
- ESLint errors: 2,934
- `as any` count: 75+ in production code
- Build: PASS, tsc: 0 errors

## Streams

| Stream | Agent | Task |
|--------|-------|------|
| A | p-impl-lint | ESLint auto-fix + `as any` type safety refactor |
| B | p-impl-mixin-tests | Mixin unit tests (7 files at 0%) + jest thresholds |
| C | p-impl-coverage | Adapter coverage expansion (Jupiter, GMX, Extended) |

## File Ownership Map

- p-impl-lint: `src/core/logger.ts`, `src/websocket/WebSocketClient.ts`, `src/utils/type-guards.ts` (new), `src/adapters/*/error-codes.ts`, `src/adapters/*/normalizer files`, `src/types/common.ts` (info field only)
- p-impl-mixin-tests: `tests/unit/mixin-*.test.ts` (new), `jest.config.js`
- p-impl-coverage: `tests/unit/jupiter-*.test.ts`, `tests/unit/gmx-*.test.ts`, `tests/unit/extended-*.test.ts`

## Quality Gates

- `npx tsc --noEmit` — 0 errors
- `npx jest --forceExit` — 5017+ tests, 0 failures
- `npm run build` — PASS
- ESLint errors: 2,934 → <500
- `as any` count: 75+ → <30
