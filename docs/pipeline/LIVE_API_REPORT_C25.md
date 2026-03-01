# Live API Validation Report - C25

**Date**: 2026-03-01T07:48:33.318Z
**Cycle**: C25 (Post-Zod Validation)

## Summary

- **Total Tests**: 96 (16 exchanges × 6 methods)
- **PASS**: 31/96 (32.3%)
- **SKIP**: 14/96 (14.6%)
- **ERROR**: 51/96 (53.1%)
- **Baseline**: 67/96 (69.8%)
- **Target**: 72+/96 (75%+)
- **Status**: ⚠️ 41 more needed

## Detailed Results

| Exchange | Markets | Ticker | OrderBook | Trades | FundingRate | OHLCV | Score |
|----------|---------|--------|-----------|--------|-------------|-------|-------|
| hyperliquid | ❌ | ✅ | ✅ | ⏭️ | ✅ | ✅ | 4/6 |
| dydx     | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5/6 |
| gmx      | ❌ | ✅ | ⏭️ | ⏭️ | ✅ | ✅ | 3/6 |
| drift    | ✅ | ❌ | ❌ | ⏭️ | ❌ | ⏭️ | 0/6 |
| backpack | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 0/6 |
| paradex  | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | 2/6 |
| edgex    | ✅ | ✅ | ✅ | ⏭️ | ✅ | ❌ | 3/6 |
| lighter  | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | 3/6 |
| jupiter  | ✅ | ✅ | ✅ | ⏭️ | ✅ | ⏭️ | 3/6 |
| grvt     | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5/6 |
| ostium   | ✅ | ❌ | ⏭️ | ⏭️ | ⏭️ | ❌ | 0/6 |
| extended | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 1/6 |
| variational | ❌ | ❌ | ❌ | ⏭️ | ❌ | ❌ | 0/6 |
| aster    | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 0/6 |
| pacifica | ❌ | ❌ | ❌ | ❌ | ❌ | ⏭️ | 0/6 |
| nado     | ✅ | ✅ | ✅ | ⏭️ | ❌ | ❌ | 2/6 |

## Error Details

### hyperliquid
- **fetchMarkets**: Unknown exchange error

### gmx
- **fetchMarkets**: Market is disabled or paused

### drift
- **fetchTicker**: Unknown exchange error
- **fetchOrderBook**: Unknown exchange error
- **fetchFundingRate**: Unknown exchange error

### backpack
- **fetchMarkets**: Network request failed
- **fetchTicker**: Network request failed
- **fetchOrderBook**: Network request failed
- **fetchTrades**: Network request failed
- **fetchFundingRate**: Network request failed
- **fetchOHLCV**: Backpack does not support OHLCV data

### paradex
- **fetchOrderBook**: [
  {
    "code": "invalid_type",
    "expected": 
- **fetchTrades**: [
  {
    "code": "invalid_type",
    "expected": 
- **fetchOHLCV**: Paradex does not support OHLCV data

### edgex
- **fetchOHLCV**: EdgeX does not support OHLCV data

### lighter
- **fetchTicker**: Invalid order parameters
- **fetchOHLCV**: Lighter does not support OHLCV data

### ostium
- **fetchTicker**: [
  {
    "code": "invalid_type",
    "expected": 
- **fetchOHLCV**: Ostium does not support OHLCV data

### extended
- **fetchTicker**: [
  {
    "code": "invalid_type",
    "expected": 
- **fetchOrderBook**: [
  {
    "code": "invalid_type",
    "expected": 
- **fetchTrades**: [
  {
    "code": "invalid_type",
    "expected": 
- **fetchOHLCV**: Extended does not support OHLCV data

### variational
- **fetchMarkets**: Network request failed
- **fetchTicker**: Network request failed
- **fetchOrderBook**: Network request failed
- **fetchFundingRate**: Network request failed
- **fetchOHLCV**: Variational does not support OHLCV data

### aster
- **fetchMarkets**: Network request failed
- **fetchTicker**: Network request failed
- **fetchOrderBook**: Network request failed
- **fetchTrades**: Network request failed
- **fetchFundingRate**: Network request failed
- **fetchOHLCV**: Network request failed

### pacifica
- **fetchMarkets**: Network request failed
- **fetchTicker**: Network request failed
- **fetchOrderBook**: Network request failed
- **fetchTrades**: Network request failed
- **fetchFundingRate**: Network request failed

### nado
- **fetchFundingRate**: Funding rate not available for this symbol
- **fetchOHLCV**: Nado does not support OHLCV data

## Handoff

### Attempted
- Live API validation of 6 public methods across all 16 exchanges
- Tested: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate, fetchOHLCV
- Used testnet configurations where available
- 15s timeout per method call

### Worked
- Successfully tested all 16 exchanges
- 31 methods passed validation
- Proper error handling and timeouts

### Failed
- 51 methods returned errors (see Error Details above)

### Remaining
- 41 more PASS results needed to meet target
- Recommend investigating ERROR cases and fixing adapter implementations