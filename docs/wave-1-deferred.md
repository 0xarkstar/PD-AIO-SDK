# Wave 1 + Wave 2 Deferred Items

This document captures items considered during the Wave 1 (bot-infrastructure adoption) and Wave 2 (SDK completeness) reviews that were intentionally deferred or rejected. Future contributors should not re-litigate these without new evidence.

## Why this exists
Audit cycles tend to surface the same backlog repeatedly. Capturing the deferral reasoning preserves the "named user blocked" discipline rule and prevents wasted re-investigation. The premise: PD-AIO-SDK at v0.3.0 with 6,241 tests / 85.87% coverage is shipping software; further polish must answer "which user is blocked without this?"

## Deferred from Wave 1 (bot-infrastructure adoption)

These items from a 5-panel review of patterns in a private Python trading-bot reference repo were rejected because the SDK already implements them, the pattern is Python-flavored, or the operational concern is the consumer's responsibility:

- **Reference Grafana dashboards** — already shipped at `monitoring/grafana/dashboards/{circuit-breaker,overview}.json`. Reference dashboards in the source repo contain operational PII (account labels, hardcoded volume formulas) and cannot be copied directly.
- **Adapter `capabilities.*` runtime API** — already exists as `adapter.has` + `supportsFeature()` (CCXT canonical pattern). See `src/types/adapter.ts:117-130`.
- **Public Circuit Breaker State API addition** — already exists at three layers: `CircuitBreaker.getState()`, `HTTPClient.getCircuitBreakerState()`, `BaseAdapterCore.getCircuitBreakerState()`. Threat model documented inline (see CircuitBreaker.ts JSDoc).
- **WS→REST fallback metric** — the fallback mechanism itself does not exist in `src/websocket/`. Metering nonexistent code is meaningless. Re-open if/when fallback logic is implemented.
- **StateManager / graceful-restart helper** — Python-bot pattern. SDKs should not own state lifecycle; consumers manage persistence.
- **Subprocess IPC for native dep isolation** — see ADR-0001 — rejected for breaking lazy loading, browser support, and tree-shaking.

## Deferred from Wave 2 (SDK completeness audit)

A 3-panel audit (code-reviewer + architect + critic) surfaced these and the critic explicitly argued against the temptation to fix them in this wave:

- **10 unimplemented FeatureMap fields × 20 adapters (200 implementations)** — typedef wishlist, not user-requested. The Wave 1 capability matrix codegen surfaces these as ❌ honestly. Implementing all is weeks of work for no signal.
- **All 44 lint warnings** — most are `any` typing in WebSocket internals where exchange payloads are heterogeneous. Wave 2 fixed only the cascade source (`WebSocketClient.ts:28`). Remaining warnings have negative ROI.
- **3 contract drifts in cross-adapter test (backpack signs public GET, nado strict Zod schema, drift initialize ordering)** — surfaced by mock-based test only; no production user has reported. Defer until reported.
- **Logger middleware integration into HTTPClient + WebSocket** — non-linear maintenance burden across 20 adapters. Consumers inject their own logger. Re-open only if a specific debugging scenario demands it.
- **WebSocketManager adoption across all 6 WS adapters** — too broad. Wave 2 fixed only Hyperliquid + Lighter (zero reconnect references). Adopt others per-need.
- **Pattern A enforcement** — nado missing utils.ts, lighter Normalizer not exported, variational missing Auth. Defer until specific consumer hits a missing file. **Katana** (missing Normalizer) is now formally allowlisted as an intentional divergence — see `scripts/pattern-a-allowlist.json`. Katana's API responses arrive in unified format; a separate Normalizer would be cargo-cult. Review milestone: v0.5.0.
- **Distributed tracing / OpenTelemetry integration** — complex permanent burden. No consumer demand.
- **Coverage push 85.87% → 90%+** — diminishing returns; remaining branches are error-path edge cases.
- **Zod 3 → 4 migration** — major API surface change. Batch with future major version.
- **Always-false `watch*` flags on on-chain DEXes (gmx, jupiter, avantis, ostium, drift)** — these are pool/oracle-based venues with nothing to stream; the `false` is honest, not drift.

## Discipline rule (Wave 2 critic)

> "6,241 tests at 85.87% coverage is shipping software — every additional polish item must answer 'which named user is blocked without this?' If the answer is 'nobody yet,' it's deferred, not done."

## When to re-open a deferred item

- A specific user reports a concrete failure tied to one of the items above.
- A new adapter brings a hard requirement that surfaces deferred infrastructure (e.g., a venue that genuinely requires structured tracing).
- A security incident demonstrates the deferred fix would have prevented real harm.
- The next major version (v0.4.0+) is being planned and breaking changes are on the table.

---

Last updated: 2026-04-26
