# Live API Validation Report

**Generated:** 2026-02-19T05:13:30.345Z
**Exchanges tested:** 16

## Summary

| Metric | Count |
|--------|-------|
| PASS | 67 |
| FAIL | 0 |
| SKIP | 21 |
| ERROR | 8 |
| **Total** | **96** |

## Exchange × Method Matrix

| Exchange | fetchMarkets | fetchTicker | fetchOrderBook | fetchTrades | fetchFundingRate | fetchOHLCV |
|----------|---|---|---|---|---|---|
| hyperliquid | PASS | PASS | PASS | SKIP | PASS | PASS |
| lighter | PASS | PASS | PASS | PASS | PASS | SKIP |
| grvt | PASS | PASS | PASS | PASS | PASS | PASS |
| paradex | PASS | PASS | PASS | PASS | PASS | SKIP |
| edgex | PASS | PASS | PASS | SKIP | PASS | SKIP |
| backpack | PASS | PASS | PASS | PASS | ERR | SKIP |
| nado | PASS | PASS | PASS | SKIP | ERR | SKIP |
| variational | PASS | PASS | PASS | SKIP | PASS | SKIP |
| extended | PASS | PASS | PASS | PASS | PASS | SKIP |
| dydx | PASS | PASS | PASS | PASS | PASS | PASS |
| jupiter | PASS | PASS | PASS | SKIP | PASS | SKIP |
| drift | PASS | PASS | PASS | SKIP | PASS | SKIP |
| gmx | PASS | PASS | SKIP | SKIP | PASS | PASS |
| aster | PASS | PASS | PASS | PASS | PASS | PASS |
| pacifica | ERR | ERR | ERR | ERR | ERR | ERR |
| ostium | PASS | PASS | SKIP | SKIP | SKIP | SKIP |

## Per-Exchange Details

### hyperliquid

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 404ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 229 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 61ms | last=66757.5, bid=66757.5, ask=66757.5 |
| fetchOrderBook | PASS | 44ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 121ms | rate=0.0000125, mark=66757.5 |
| fetchOHLCV | PASS | 155ms | 10 candles, first close=66230 |

### lighter

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 178ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 149 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 42ms | last=66760.8, bid=66760.8, ask=66760.8 |
| fetchOrderBook | PASS | 50ms | 50 bids, 50 asks |
| fetchTrades | PASS | 13ms | 100 trades, first: 66760.8 @ 0.00001 |
| fetchFundingRate | PASS | 12ms | rate=-0.00000868, mark=0 |
| fetchOHLCV | SKIP | 0ms | Lighter does not support OHLCV data |

### grvt

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 105ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 86 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 255ms | last=66760, bid=66759.9, ask=66760 |
| fetchOrderBook | PASS | 255ms | 50 bids, 50 asks |
| fetchTrades | PASS | 405ms | 100 trades, first: 66760 @ 0.014 |
| fetchFundingRate | PASS | 380ms | rate=0.0025, mark=66443.40006312 |
| fetchOHLCV | PASS | 337ms | 10 candles, first close=66746.3 |

### paradex

- **Symbol used:** BTC/USD:USD
- **Init time:** 296ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 94 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 41ms | last=66729, bid=66724.9, ask=66729.6 |
| fetchOrderBook | PASS | 42ms | 20 bids, 20 asks |
| fetchTrades | PASS | 43ms | 100 trades, first: 66735.3 @ 0.01 |
| fetchFundingRate | PASS | 45ms | rate=0.00008621285981, mark=5.755274058485027 |
| fetchOHLCV | SKIP | 0ms | Paradex does not support OHLCV data |

### edgex

- **Symbol used:** BTC/USD:USD
- **Init time:** 16ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 292 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 70ms | last=66752.3, bid=66752.3, ask=66752.3 |
| fetchOrderBook | PASS | 72ms | 15 bids, 15 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 60ms | rate=-0.00005011, mark=66764.6549991332 |
| fetchOHLCV | SKIP | 0ms | EdgeX does not support OHLCV data |

### backpack

- **Symbol used:** BTC/USDC
- **Init time:** 18ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 159 markets, using: BTC/USDC |
| fetchTicker | PASS | 7ms | last=66761.1, bid=0, ask=0 |
| fetchOrderBook | PASS | 66ms | 382 bids, 466 asks |
| fetchTrades | PASS | 54ms | 100 trades, first: 66773.8 @ 0.00148 |
| fetchFundingRate | ERROR | 258ms | No funding rate data available |
| fetchOHLCV | SKIP | 0ms | Backpack does not support OHLCV data |

### nado

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 164ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 29 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 52ms | last=66801.5, bid=66801, ask=66802 |
| fetchOrderBook | PASS | 55ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | ERROR | 172ms | Funding rate not available for this symbol |
| fetchOHLCV | SKIP | 0ms | Nado does not support OHLCV data |

### variational

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 15ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 470 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 27ms | last=66681.2115759484, bid=66709.98, ask=66712.66 |
| fetchOrderBook | PASS | 36ms | 3 bids, 3 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 25ms | rate=0.004777, mark=66681.2115759484 |
| fetchOHLCV | SKIP | 0ms | Variational does not support OHLCV data |

### extended

- **Symbol used:** BTC/USD:USD
- **Init time:** 22ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 105 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 124ms | last=66730, bid=66729, ask=66730 |
| fetchOrderBook | PASS | 45ms | 1277 bids, 1458 asks |
| fetchTrades | PASS | 43ms | 50 trades, first: 66714 @ 0.15589 |
| fetchFundingRate | PASS | 40ms | rate=0.000006, mark=66744.132523875 |
| fetchOHLCV | SKIP | 0ms | Extended does not support OHLCV data |

### dydx

- **Symbol used:** BTC/USD:USD
- **Init time:** 155ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 293 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 36ms | last=66749.20532, bid=66749.20532, ask=66749.20532 |
| fetchOrderBook | PASS | 73ms | 100 bids, 100 asks |
| fetchTrades | PASS | 64ms | 100 trades, first: 66731 @ 0.0002 |
| fetchFundingRate | PASS | 35ms | rate=-0.00001148076923076923, mark=66749.20532 |
| fetchOHLCV | PASS | 60ms | 10 candles, first close=66731 |

### jupiter

- **Symbol used:** BTC/USD:USD
- **Init time:** 263ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 3 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 58ms | last=66770.64, bid=66770.64, ask=66770.64 |
| fetchOrderBook | PASS | 0ms | 0 bids, 0 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 0ms | rate=0.0001, mark=66770.64 |
| fetchOHLCV | SKIP | 0ms | has.fetchOHLCV === false |

### drift

- **Symbol used:** BTC/USD:USD
- **Init time:** 793ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 11 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 246ms | last=66764.65, bid=66755.4, ask=66773.9 |
| fetchOrderBook | PASS | 711ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 1499ms | rate=0.4609905, mark=91848.691876 |
| fetchOHLCV | SKIP | 0ms | has.fetchOHLCV === false |

### gmx

- **Symbol used:** BTC/USD
- **Init time:** 1138ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 129 markets, using: BTC/USD |
| fetchTicker | PASS | 69ms | last=66767.2537173596, bid=66767.2537173596, ask=66767.2537173596 |
| fetchOrderBook | SKIP | 0ms | has.fetchOrderBook === false |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 0ms | rate=0, mark=66767.2537173596 |
| fetchOHLCV | PASS | 781ms | 10 candles, first close=66752.78 |

### aster

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 14ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 279 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 46ms | last=66767.5, bid=66767.5, ask=66767.5 |
| fetchOrderBook | PASS | 46ms | 20 bids, 20 asks |
| fetchTrades | PASS | 46ms | 100 trades, first: 66732.7 @ 0.072 |
| fetchFundingRate | PASS | 111ms | rate=0.00000965, mark=66767.5 |
| fetchOHLCV | PASS | 110ms | 10 candles, first close=66220.9 |

### pacifica

- **Symbol used:** N/A
- **Init time:** 15ms

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
- **Init time:** 23ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 11 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 306ms | last=66766.78265907252, bid=66765.54025364856, ask=66768.43688998636 |
| fetchOrderBook | SKIP | 0ms | has.fetchOrderBook === false |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | SKIP | 0ms | has.fetchFundingRate === false |
| fetchOHLCV | SKIP | 0ms | Ostium does not support OHLCV data |

## Handoff

- **Attempted**: Live validation of all 16 exchanges via public API endpoints
- **Worked**: Script creation, createExchange() instantiation, method-level validation with shape checks
- **Failed**: Exchanges with init failures or API errors documented above in per-exchange details
- **Remaining**: Retry flaky exchanges, add WebSocket validation, add latency percentile stats