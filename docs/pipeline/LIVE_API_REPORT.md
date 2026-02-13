# Live API Validation Report

**Generated:** 2026-02-13T20:01:37.749Z
**Exchanges tested:** 16

## Summary

| Metric | Count |
|--------|-------|
| PASS | 64 |
| FAIL | 0 |
| SKIP | 13 |
| ERROR | 19 |
| **Total** | **96** |

## Exchange × Method Matrix

| Exchange | fetchMarkets | fetchTicker | fetchOrderBook | fetchTrades | fetchFundingRate | fetchOHLCV |
|----------|---|---|---|---|---|---|
| hyperliquid | PASS | PASS | PASS | SKIP | PASS | PASS |
| lighter | PASS | PASS | PASS | PASS | PASS | ERR |
| grvt | PASS | PASS | PASS | PASS | PASS | ERR |
| paradex | PASS | PASS | PASS | PASS | PASS | ERR |
| edgex | PASS | PASS | PASS | SKIP | PASS | ERR |
| backpack | PASS | PASS | PASS | PASS | ERR | ERR |
| nado | PASS | PASS | PASS | SKIP | ERR | ERR |
| variational | PASS | PASS | PASS | SKIP | PASS | ERR |
| extended | PASS | PASS | PASS | PASS | PASS | ERR |
| dydx | PASS | PASS | PASS | PASS | PASS | ERR |
| jupiter | PASS | PASS | PASS | SKIP | PASS | SKIP |
| drift | PASS | PASS | PASS | SKIP | PASS | SKIP |
| gmx | PASS | PASS | SKIP | SKIP | PASS | ERR |
| aster | PASS | PASS | PASS | PASS | PASS | PASS |
| pacifica | ERR | ERR | ERR | ERR | ERR | ERR |
| ostium | PASS | PASS | SKIP | SKIP | SKIP | ERR |

## Per-Exchange Details

### hyperliquid

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 269ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 229 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 60ms | last=68874.5, bid=68874.5, ask=68874.5 |
| fetchOrderBook | PASS | 71ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 343ms | rate=0.000010865, mark=68865 |
| fetchOHLCV | PASS | 187ms | 10 candles, first close=67127 |

### lighter

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 160ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 145 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 41ms | last=68839.1, bid=68839.1, ask=68839.1 |
| fetchOrderBook | PASS | 52ms | 50 bids, 50 asks |
| fetchTrades | PASS | 116ms | 100 trades, first: 68809.3 @ 0.0008 |
| fetchFundingRate | PASS | 160ms | rate=-0.00005339, mark=0 |
| fetchOHLCV | ERROR | 0ms | Lighter does not support OHLCV data |

### grvt

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 50ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 82 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 248ms | last=68843.5, bid=68843.5, ask=68843.6 |
| fetchOrderBook | PASS | 238ms | 50 bids, 50 asks |
| fetchTrades | PASS | 286ms | 100 trades, first: 68843.5 @ 0.002 |
| fetchFundingRate | PASS | 285ms | rate=0.0092, mark=68621.672482585 |
| fetchOHLCV | ERROR | 250ms | Client error (400): Bad Request |

### paradex

- **Symbol used:** BTC/USD:USD
- **Init time:** 183ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 96 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 44ms | last=68824.8, bid=68824.8, ask=68825.8 |
| fetchOrderBook | PASS | 41ms | 20 bids, 20 asks |
| fetchTrades | PASS | 43ms | 100 trades, first: 68831.2 @ 0.00021 |
| fetchFundingRate | PASS | 42ms | rate=-0.00007729070583, mark=-5.3216113973074215 |
| fetchOHLCV | ERROR | 0ms | Paradex does not support OHLCV data |

### edgex

- **Symbol used:** BTC/USD:USD
- **Init time:** 9ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 292 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 53ms | last=68856.1, bid=68856.1, ask=68856.1 |
| fetchOrderBook | PASS | 150ms | 15 bids, 15 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 52ms | rate=0.00005, mark=68900.7834228687 |
| fetchOHLCV | ERROR | 0ms | EdgeX does not support OHLCV data |

### backpack

- **Symbol used:** BTC/USDC
- **Init time:** 10ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 159 markets, using: BTC/USDC |
| fetchTicker | PASS | 156ms | last=68854.3, bid=0, ask=0 |
| fetchOrderBook | PASS | 71ms | 288 bids, 435 asks |
| fetchTrades | PASS | 51ms | 100 trades, first: 68854.3 @ 0.00285 |
| fetchFundingRate | ERROR | 233ms | No funding rate data available |
| fetchOHLCV | ERROR | 0ms | Backpack does not support OHLCV data |

### nado

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 135ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 29 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 53ms | last=68891.5, bid=68891, ask=68892 |
| fetchOrderBook | PASS | 56ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | ERROR | 52ms | Funding rate not available for this symbol |
| fetchOHLCV | ERROR | 0ms | Nado does not support OHLCV data |

### variational

- **Symbol used:** BTC/USDC:USDC
- **Init time:** 6ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 473 markets, using: BTC/USDC:USDC |
| fetchTicker | PASS | 22ms | last=68978.009895547, bid=68930.45, ask=68933.89 |
| fetchOrderBook | PASS | 21ms | 3 bids, 3 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 21ms | rate=-0.022532, mark=68978.009895547 |
| fetchOHLCV | ERROR | 0ms | Variational does not support OHLCV data |

### extended

- **Symbol used:** BTC/USD:USD
- **Init time:** 13ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 103 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 122ms | last=68834, bid=68819, ask=68820 |
| fetchOrderBook | PASS | 47ms | 1534 bids, 1027 asks |
| fetchTrades | PASS | 45ms | 50 trades, first: 68843 @ 0.0445 |
| fetchFundingRate | PASS | 42ms | rate=0.000008, mark=68802.59840425 |
| fetchOHLCV | ERROR | 1ms | Extended does not support OHLCV data |

### dydx

- **Symbol used:** BTC/USD:USD
- **Init time:** 132ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 293 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 36ms | last=68831.29424, bid=68831.29424, ask=68831.29424 |
| fetchOrderBook | PASS | 70ms | 100 bids, 100 asks |
| fetchTrades | PASS | 60ms | 100 trades, first: 68815 @ 0.02 |
| fetchFundingRate | PASS | 36ms | rate=0, mark=68831.29424 |
| fetchOHLCV | ERROR | 53ms | HTTP 404: Not Found |

### jupiter

- **Symbol used:** BTC/USD:USD
- **Init time:** 171ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 3 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 56ms | last=68839.96167944, bid=68839.96167944, ask=68839.96167944 |
| fetchOrderBook | PASS | 0ms | 0 bids, 0 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 0ms | rate=0.0001, mark=68839.96167944 |
| fetchOHLCV | SKIP | 0ms | has.fetchOHLCV === false |

### drift

- **Symbol used:** BTC/USD:USD
- **Init time:** 774ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 11 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 251ms | last=68833.1198345, bid=68788.639669, ask=68877.6 |
| fetchOrderBook | PASS | 731ms | 20 bids, 20 asks |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 69ms | rate=-0.406071375, mark=97073.394975 |
| fetchOHLCV | SKIP | 0ms | has.fetchOHLCV === false |

### gmx

- **Symbol used:** BTC/USD
- **Init time:** 1109ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 129 markets, using: BTC/USD |
| fetchTicker | PASS | 524ms | last=68849.33912478894, bid=68849.33912478894, ask=68849.33912478894 |
| fetchOrderBook | SKIP | 0ms | has.fetchOrderBook === false |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | PASS | 0ms | rate=0, mark=68849.33912478894 |
| fetchOHLCV | ERROR | 393ms | Unknown exchange error |

### aster

- **Symbol used:** BTC/USDT:USDT
- **Init time:** 12ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 275 markets, using: BTC/USDT:USDT |
| fetchTicker | PASS | 44ms | last=68852.4, bid=68852.4, ask=68852.4 |
| fetchOrderBook | PASS | 47ms | 20 bids, 20 asks |
| fetchTrades | PASS | 48ms | 100 trades, first: 68859.2 @ 0.767 |
| fetchFundingRate | PASS | 46ms | rate=-0.00005263, mark=68852.4 |
| fetchOHLCV | PASS | 112ms | 10 candles, first close=67137.8 |

### pacifica

- **Symbol used:** N/A
- **Init time:** 9ms

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
- **Init time:** 12ms

| Method | Status | Duration | Details |
|--------|--------|----------|---------|
| fetchMarkets | PASS | 0ms | 11 markets, using: BTC/USD:USD |
| fetchTicker | PASS | 1036ms | last=68838.71927447978, bid=68837.42411798722, ask=68839.17367277009 |
| fetchOrderBook | SKIP | 0ms | has.fetchOrderBook === false |
| fetchTrades | SKIP | 0ms | has.fetchTrades === false |
| fetchFundingRate | SKIP | 0ms | has.fetchFundingRate === false |
| fetchOHLCV | ERROR | 0ms | Ostium does not support OHLCV data |

## Handoff

- **Attempted**: Live validation of all 16 exchanges via public API endpoints
- **Worked**: Script creation, createExchange() instantiation, method-level validation with shape checks
- **Failed**: Exchanges with init failures or API errors documented above in per-exchange details
- **Remaining**: Retry flaky exchanges, add WebSocket validation, add latency percentile stats