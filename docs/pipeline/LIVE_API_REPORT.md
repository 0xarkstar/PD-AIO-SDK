# Live API Validation Report

**Generated:** 2026-02-13T18:33:24.123Z
**Exchanges tested:** 16

## Summary

| Metric | Count |
|--------|-------|
| PASS | 56 |
| FAIL | 1 |
| SKIP | 10 |
| ERROR | 29 |
| **Total** | **96** |

## Exchange × Method Matrix

| Exchange | fetchMarkets | fetchTicker | fetchOrderBook | fetchTrades | fetchFundingRate | fetchOHLCV |
|----------|---|---|---|---|---|---|
| hyperliquid | PASS | PASS | PASS | ERR | PASS | PASS |
| lighter | PASS | PASS | PASS | PASS | PASS | ERR |
| grvt | PASS | PASS | PASS | PASS | PASS | ERR |
| paradex | PASS | PASS | PASS | PASS | PASS | ERR |
| edgex | PASS | PASS | PASS | SKIP | PASS | ERR |
| backpack | PASS | PASS | PASS | PASS | ERR | ERR |
| nado | PASS | PASS | PASS | SKIP | ERR | ERR |
| variational | PASS | PASS | PASS | SKIP | PASS | ERR |
| extended | PASS | ERR | ERR | FAIL | ERR | ERR |
| dydx | PASS | PASS | PASS | PASS | PASS | ERR |
| jupiter | ERR | ERR | ERR | ERR | ERR | ERR |
| drift | PASS | PASS | PASS | SKIP | PASS | SKIP |
| gmx | PASS | PASS | SKIP | SKIP | PASS | ERR |
| aster | PASS | PASS | PASS | PASS | PASS | PASS |
| pacifica | ERR | ERR | ERR | ERR | ERR | ERR |
| ostium | PASS | PASS | SKIP | SKIP | SKIP | ERR |

## Per-Exchange Details

### hyperliquid

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 268ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 229 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 115ms | last=69035.5, bid=69035.5, ask=69035.5 |
| fetchOrderBook | PASS | 43ms | 20 bids, 20 asks |
| fetchTrades | ERROR | 0ms | fetchTrades is not supported via REST API. Use watchTrades (WebSocket) instead. |
| fetchFundingRate | PASS | 120ms | rate=0.0000073524, mark=69035.5 |
| fetchOHLCV | PASS | 158ms | 10 candles, first close=66920 |

### lighter

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 214ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 145 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 45ms | last=69014.6, bid=69014.6, ask=69014.6 |
| fetchOrderBook | PASS | 89ms | 50 bids, 50 asks |
| fetchTrades | PASS | 191ms | 100 trades, first: 69021.3 @ 0.002 |
| fetchFundingRate | PASS | 12ms | rate=-0.00003125, mark=0 |
| fetchOHLCV | ERROR | 0ms | Lighter does not support OHLCV data |

### grvt

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 67ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 82 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 256ms | last=69032.3, bid=69041.2, ask=69041.3 |
| fetchOrderBook | PASS | 268ms | 50 bids, 50 asks |
| fetchTrades | PASS | 313ms | 100 trades, first: 69032.3 @ 0.005 |
| fetchFundingRate | PASS | 296ms | rate=0.0092, mark=68621.672482585 |
| fetchOHLCV | ERROR | 277ms | Client error (400): Bad Request |

### paradex

- **Symbol used:** BTC/USD:USD
- **Init time:** 210ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 96 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 43ms | last=68985.2, bid=68990.7, ask=68985.2 |
| fetchOrderBook | PASS | 46ms | 20 bids, 20 asks |
| fetchTrades | PASS | 49ms | 100 trades, first: 68994.6 @ 0.02176 |
| fetchFundingRate | PASS | 51ms | rate=-0.0000556771589, mark=-3.843512493692993 |
| fetchOHLCV | ERROR | 0ms | Paradex does not support OHLCV data |

### edgex

- **Symbol used:** BTC/USD:USD
- **Init time:** 11ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 292 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 57ms | last=69031.5, bid=69031.5, ask=69031.5 |
| fetchOrderBook | PASS | 158ms | 15 bids, 15 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 58ms | rate=-0.0000496, mark=69081.85000065714 |
| fetchOHLCV | ERROR | 1ms | EdgeX does not support OHLCV data |

### backpack

- **Symbol used:** BTC/USDC
- **Init time:** 16ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 159 markets, using: BTC/USDC |
| fetchTicker | PASS | 164ms | last=69020.7, bid=0, ask=0 |
| fetchOrderBook | PASS | 76ms | 275 bids, 439 asks |
| fetchTrades | PASS | 53ms | 100 trades, first: 69020.7 @ 0.0073 |
| fetchFundingRate | ERROR | 240ms | No funding rate data available |
| fetchOHLCV | ERROR | 0ms | Backpack does not support OHLCV data |

### nado

- **Symbol used:** KBTC/USDC
- **Init time:** 205ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 29 markets, using: KBTC/USDC |
| fetchTicker | PASS | 53ms | last=69010.5, bid=68995, ask=69026 |
| fetchOrderBook | PASS | 69ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | ERROR | 55ms | Funding rate not available for this symbol |
| fetchOHLCV | ERROR | 0ms | Nado does not support OHLCV data |

### variational

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 13ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 473 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 24ms | last=69039.5782319724, bid=68965.52, ask=68968.29 |
| fetchOrderBook | PASS | 24ms | 3 bids, 3 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 21ms | rate=0.00715, mark=69039.5782319724 |
| fetchOHLCV | ERROR | 0ms | Variational does not support OHLCV data |

### extended

- **Symbol used:** BTC/USD:USD
- **Init time:** 28ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 103 markets, using: BTC/USD:USD |
| fetchTicker | ERROR | 126ms | Cannot read properties of undefined (reading 'includes') |
| fetchOrderBook | ERROR | 45ms | Cannot read properties of undefined (reading 'includes') |
| fetchTrades | FAIL | 43ms | Empty or non-array result |
| fetchFundingRate | ERROR | 47ms | HTTP 400: Bad Request |
| fetchOHLCV | ERROR | 0ms | Extended does not support OHLCV data |

### dydx

- **Symbol used:** BTC/USD:USD
- **Init time:** 257ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 293 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 44ms | last=69020.94586, bid=69020.94586, ask=69020.94586 |
| fetchOrderBook | PASS | 40ms | 100 bids, 100 asks |
| fetchTrades | PASS | 85ms | 100 trades, first: 69040 @ 0.0324 |
| fetchFundingRate | PASS | 44ms | rate=3.030303030303e-8, mark=69020.94586 |
| fetchOHLCV | ERROR | 58ms | HTTP 404: Not Found |

### jupiter

- **Symbol used:** N/A
- **Init time:** 28ms
- **Init error:** Unknown exchange error

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | ERROR | 0ms | Init failed: Unknown exchange error |
| fetchTicker | ERROR | 0ms | Init failed: Unknown exchange error |
| fetchOrderBook | ERROR | 0ms | Init failed: Unknown exchange error |
| fetchTrades | ERROR | 0ms | Init failed: Unknown exchange error |
| fetchFundingRate | ERROR | 0ms | Init failed: Unknown exchange error |
| fetchOHLCV | ERROR | 0ms | Init failed: Unknown exchange error |

### drift

- **Symbol used:** BTC/USD:USD
- **Init time:** 399ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 11 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 247ms | last=69007.5286185, bid=68972.757237, ask=69042.3 |
| fetchOrderBook | PASS | 734ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 1519ms | rate=-0.313202208, mark=96869.198398 |
| fetchOHLCV | SKIP | 0ms | has.fetchOHLCV === false |

### gmx

- **Symbol used:** BTC/USD
- **Init time:** 1852ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 129 markets, using: BTC/USD |
| fetchTicker | PASS | 535ms | last=69042.82641282953, bid=69042.82641282953, ask=69042.82641282953 |
| fetchOrderBook | SKIP | 0ms | has.fetchOrderBook === false |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 0ms | rate=0, mark=69042.82641282953 |
| fetchOHLCV | ERROR | 784ms | Unknown exchange error |

### aster

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 18ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 275 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 46ms | last=69032.4, bid=69032.4, ask=69032.4 |
| fetchOrderBook | PASS | 48ms | 20 bids, 20 asks |
| fetchTrades | PASS | 113ms | 100 trades, first: 69028.4 @ 0.217 |
| fetchFundingRate | PASS | 46ms | rate=-0.00002762, mark=69036.0651413 |
| fetchOHLCV | PASS | 113ms | 10 candles, first close=66928.6 |

### pacifica

- **Symbol used:** N/A
- **Init time:** 16ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | ERROR | 0ms | HTTP 404: Not Found |
| fetchTicker | ERROR | 0ms | No symbol — fetchMarkets failed |
| fetchOrderBook | ERROR | 0ms | No symbol — fetchMarkets failed |
| fetchTrades | ERROR | 0ms | No symbol — fetchMarkets failed |
| fetchFundingRate | ERROR | 0ms | No symbol — fetchMarkets failed |
| fetchOHLCV | ERROR | 0ms | No symbol — fetchMarkets failed |

### ostium

- **Symbol used:** BTC/USD:USD
- **Init time:** 18ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 11 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 1063ms | last=69033.50626591325, bid=69032.3110992659, ask=69033.83355636252 |
| fetchOrderBook | SKIP | 0ms | has.fetchOrderBook === false |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | SKIP | 0ms | has.fetchFundingRate === false |
| fetchOHLCV | ERROR | 0ms | Ostium does not support OHLCV data |

## Handoff

- **Attempted**: Live validation of all 16 exchanges via public API endpoints
- **Worked**: Script creation, createExchange() instantiation, method-level validation with shape checks
- **Failed**: Exchanges with init failures or API errors documented above in per-exchange details
- **Remaining**: Retry flaky exchanges, add WebSocket validation, add latency percentile stats