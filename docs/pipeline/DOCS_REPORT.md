# Documentation Sync Report (Cycle 5)

**Agent**: p-impl-docs
**Date**: 2026-02-09

## Changes Made

### API.md

1. **Backpack section** (line ~370):
   - Added detailed auth documentation: ED25519 signing with alphabetized params + instruction prefix
   - Documented required headers: `X-API-KEY`, `X-Timestamp`, `X-Window` (5000ms), `X-Signature`
   - Added "Order Format (Cycle 5)" subsection: sides are `Bid`/`Ask` (not `BUY`/`SELL`), types are `Market`/`Limit`/`PostOnly` (not `MARKET`/`LIMIT`)

2. **dYdX section** (line ~600):
   - Added "API Notes (Cycle 5)" subsection
   - Documented that `/trades`, `/candles`, `/historicalFunding` use query parameters (not path params)
   - Documented `subaccountNumber` in URL path for private endpoints

3. **Lighter section** (line ~410):
   - Updated auth description: WASM-based signing (recommended) or HMAC-SHA256
   - Added "API Notes (Cycle 5)": all endpoints use `/api/v1/` prefix
   - Updated special features: added WASM signing cross-platform note

4. **Extended section** (line ~550):
   - Fixed `rateLimitPerMinute` default: `600` -> `1000` (was incorrectly documented as 600)

5. **GMX section** (line ~780):
   - Added "API Notes (Cycle 5)": candles endpoint is `/prices/candles` (not `/candlesticks`), param is `tokenSymbol` (not `marketAddress`)

6. **Hyperliquid section** (line ~212):
   - Added: `fetchTrades` throws `NotSupportedError` -- use `watchTrades` (WebSocket) instead

7. **Jupiter section** (line ~684):
   - Updated `fetchTrades` from `❌` to `⚠️` with note: throws `NotSupportedError` (trades are on-chain only)

### README.md

1. Test badge: `2400+` -> `4800+` (line 7)
2. Enterprise features bullet: `2400+ tests` -> `4800+ tests` (line 145)
3. Test results section: `2400+ tests passing` -> `4800+ tests passing` (line 547)

### README.ko.md

1. Test badge: `2400+` -> `4800+` (line 7)
2. Developer experience bullet: `2400개+ 테스트` -> `4800개+ 테스트` (line 155)
3. Test results section: `2400개+ 테스트 통과` -> `4800개+ 테스트 통과` (line 565)

## Summary

- **Files modified**: 3 (API.md, README.md, README.ko.md)
- **Total changes**: 13 edits across all files
- All changes sourced from actual adapter source code, verified against Cycle 5 implementations
