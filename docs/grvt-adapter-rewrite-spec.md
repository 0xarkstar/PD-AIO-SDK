# GRVT adapter — FULL REWRITE spec (live-verified 2026-05-26)

> **Status: the current `src/adapters/grvt/` is built against a GUESSED/hallucinated GRVT API and is live-NONFUNCTIONAL.** Its 480-style tests are internal-consistency only (same trap the Katana adapter had before its EIP-712 fix). Signing, request-auth, types, and market-data shapes are ALL wrong vs the real GRVT API. This is a full rewrite, not a bug fix. Spec below is verified from the OFFICIAL GRVT Python+TS SDK source + api-docs + live API.

> **✅ GROUND-TRUTH VERIFIED 2026-05-26 against official SDK source** (`grvt-ts-sdk/src/signing/{domain,types,signer}.ts` + `grvt-pysdk/src/pysdk/grvt_raw_{signing,env,base}.py`; mirror saved to `/tmp/grvt-ref/`). Every cryptographic detail below — EIP-712 domain (no verifyingContract), Order+OrderLeg struct, TIF sign-enum (GTT=1/AON=2/IOC=3/FOK=4), leg scaling (contractSize=Decimal(size)·10^base_decimals, limitPrice=Decimal(price)·1e9, assetID=instrument_hash), chainIds (prod 325 / testnet 326 / dev+staging 327), cookie-session auth, base URLs — is confirmed byte-for-byte. **NOTE: the TS SDK does NOT implement order signing (only account/transfer/withdraw); the Python SDK `sign_order` + `build_EIP712_order_message_data` is the authoritative order-signing reference — mirror its logic.**
>
> **Extra impl details learned from SDK source (use verbatim):**
> - **Signer (TS):** `@metamask/eth-sig-util` `signTypedData({privateKey, data:{types,primaryType:'Order',domain,message}, version:V4})`, then split sig into r/s/v (32B each + v). Equivalent to ethers `signTypedData(domain,{Order,OrderLeg},message)` + `Signature.from`.
> - **nonce:** `Math.floor(Math.random()*1e9)` (kept < 1e9, well within uint32 — do NOT use full uint32 range).
> - **expiration:** `String((Date.now() + hours*3600*1000) * 1e6)` → nanoseconds string, default 24h. Validation: must be future AND ≤ 30 days (`grvt_raw_signing.py validateExpiration`).
> - **OrderWithBuilderFee:** only when builder addr set + non-zero; struct inserts `builder`(address) + `builderFee`(uint32) AFTER `legs`, BEFORE `nonce`; `builderFee = int(Decimal(fee)*1e4)` (BUILDER_FEE_DECIMALS=4). primaryType becomes `'OrderWithBuilderFee'`.
> - **Leg uses `Decimal`, never float** (SDK comment: `int(float("1.013")*1e9)=1012999999` BUG vs `Decimal("1.013")*1e9=1013000000`). Use a Decimal lib (e.g. `decimal.js` / bigint math) — JS `number` will lose precision on contractSize/limitPrice.
> - **WS base path** = `/ws` (prod `wss://trades.grvt.io/ws`, `wss://market-data.grvt.io/ws`); the `full` stream variant is the JSON-RPC `stream` name (`v1.book.s` etc.), not a URL suffix. (Market-data read side already works in zo-mm-sim recorder — mirror it.)
> - **Signature DTO** built from sign output: `{r:"0x"+r.hex, s:"0x"+s.hex, v, signer:account.address, expiration, nonce, chain_id}` (chain_id falls back to env chain if 0).

## What's wrong now (per layer)
- **EIP-712 domain** (`constants.ts GRVT_EIP712_DOMAIN`): `{name:'GRVT', version:'1', chainId:325, verifyingContract:'0x000…'}` → WRONG. Real = `{name:"GRVT Exchange", version:"0", chainId:325}`, **NO verifyingContract**. (testnet chainId is **326**, not `326822723` in `GRVTAuth.signOrder`.)
- **Order EIP-712 struct** (`GRVT_EIP712_ORDER_TYPE` + `GRVTAuth.signOrder` value): flat `{instrument,orderType,side,size,price,timeInForce,reduceOnly,postOnly,nonce,expiry}` → WRONG. Real is **leg-based** (below).
- **Request auth** (`GRVTAuth.sign`/`getHeaders`): uses `X-API-KEY` + `X-Signature`/`X-Timestamp`/`X-Address` message signing → WRONG. Real = **cookie-session**: `POST {edge}/auth/api_key/login {api_key}` → `Set-Cookie: gravity=…` + resp header `X-Grvt-Account-Id`; then send cookie `gravity=…` + header `X-Grvt-Account-Id` on authed calls. No per-request HMAC.
- **types.ts**: `GRVTMarket.maker_fee/taker_fee/instrument_type:'PERP'/instrument_id`, `GRVTOrderBook` bids `[price,size]`+`sequence`, `GRVTTrade.is_buyer_maker`, order_type `LIMIT_MAKER` → all WRONG. Real: no fee fields (fees per-fill), `kind:'PERPETUAL'`, `instrument_hash`, book `{price,size,num_orders}`+`event_time`, trade `is_taker_buyer`, no LIMIT_MAKER (compositional is_market+post_only+TIF).
- **Endpoints** (`GRVTSDKWrapper` mdg/tdg): verify they POST the real `full/v1/*` paths (below); the wrapper likely targets guessed paths.

## VERIFIED correct GRVT spec (use this for the rewrite)

### Base URLs (PROD; testnet swaps `.testnet.`)
- Edge (auth): `https://edge.grvt.io`
- Trade Data (orders/account): `https://trades.grvt.io` (WS `wss://trades.grvt.io/ws/full`)
- Market Data: `https://market-data.grvt.io` (WS `wss://market-data.grvt.io/ws/full`)
- chainId PROD **325**, TESTNET **326**. Rate limit 100 req / 10s (=10/s); WS 50 subs.

### Auth flow
1. API key created in UI (`grvt.io/exchange/account/api-keys`) — not API-creatable.
2. `POST {edge}/auth/api_key/login` body `{"api_key": KEY}` → `Set-Cookie: gravity=…` + header `X-Grvt-Account-Id` + body `{sub_account_id, funding_account_address}`.
3. Authed requests: cookie `gravity=…` + header `X-Grvt-Account-Id: <id>`. Refresh cookie when <5s to expiry. (Alt: `POST /auth/wallet/login`, sign `WalletLogin(address signer, uint32 nonce, int64 expiration≤5min)`.)
4. Account model: main `account_id` (X-Grvt-Account-Id) → `sub_account_id` (uint64, the trading account; in every order/cancel body).

### EIP-712 (order signing) — field order is load-bearing
```
domain = { name: "GRVT Exchange", version: "0", chainId: 325 }   // NO verifyingContract
Order:
  subAccountID  uint64
  isMarket      bool
  timeInForce   uint8     // GTT=1, AON=2, IOC=3, FOK=4  (SIGN enum; distinct from API string)
  postOnly      bool
  reduceOnly    bool
  legs          OrderLeg[]
  nonce         uint32    // client-random dedup key
  expiration    int64     // unix NANOSECONDS, must be future, ≤30 days
OrderLeg:
  assetID          uint256  // = instrument.instrument_hash (e.g. BTC 0x030501)
  contractSize     uint64   // int(Decimal(size) * 10**instrument.base_decimals)  (BTC base_decimals=9)
  limitPrice       uint64   // int(Decimal(price) * 10**9)   (PRICE_MULTIPLIER=1e9)
  isBuyingContract bool
```
- Sign with `eth_signTypedData_v4` (ethers `signTypedData(domain, {Order,OrderLeg}, msg)`).
- Signature DTO: `{signer, r, s, v, expiration, nonce, chain_id}` (chain_id falls back to GRVT chain if 0).
- `OrderWithBuilderFee` variant adds `builder` address + `builderFee` uint32 (= Decimal(fee)·1e4) before `nonce` — only when a builder address is set.
- **Use Decimal, not float**, for size/price scaling.

### Wire bodies (POST JSON; responses wrap `{"result": …}`)
- Create: `POST {trades}/full/v1/create_order`
```json
{"order":{ "sub_account_id":"<id>", "is_market":false, "time_in_force":"GOOD_TILL_TIME",
  "post_only":true, "reduce_only":false,
  "legs":[{"instrument":"BTC_USDT_Perp","size":"0.001","limit_price":"50000.0","is_buying_asset":true}],
  "signature":{"r":"0x…","s":"0x…","v":28,"expiration":"<nanos>","nonce":<uint32>,"signer":"0x…"},
  "metadata":{"client_order_id":"<random in [2^63, 2^64-1]>"} }}
```
  MAKER QUOTE = `is_market:false + post_only:true + GOOD_TILL_TIME` → speedbump-EXEMPT, rejects-on-cross (`FAIL_POST_ONLY`).
- Cancel: `POST {trades}/full/v1/cancel_order {"sub_account_id","order_id"}` (or `client_order_id`). Cancel-all: `full/v1/cancel_all_orders {"sub_account_id"}`.
- TIF (API strings, orderbook venue): `GOOD_TILL_TIME`/`IMMEDIATE_OR_CANCEL`/`FILL_OR_KILL` only (post_only only with GTT/AON).

### Market data (POST, `{"result":…}`) — see zo-mm-sim `recorder/adapters/grvt.py` for working parsers
- `full/v1/instruments` `{"kind":["PERPETUAL"],"is_active":true}` → list `{instrument, instrument_hash, base, quote, base_decimals(int), quote_decimals(int), tick_size, min_size, min_notional, funding_interval_hours}`. **136 incl EQUITIES (AAPL/AMD/…) — skip non-crypto. NO fee fields.**
- `full/v1/ticker` `{"instrument":"BTC_USDT_Perp"}` → `{mark_price,index_price,last_price,mid_price,best_bid/ask_price/size,buy_volume_24h_q,sell_volume_24h_q,open_interest,funding_rate,next_funding_time,…}` (all strings).
- `full/v1/book` `{"instrument","depth"}` (depth∈{10,50,100,500}) → `{event_time, bids:[{price,size,num_orders}], asks:[…]}` (FULL snapshot, no diff).
- `full/v1/trade` `{"instrument","limit"}` → `[{event_time, is_taker_buyer(bool), size, price, mark_price, index_price, trade_id(str), venue, is_rpi}]`.
- Fees per-fill: `full/v1/fill_history` → `fill.fee` (NEGATIVE = maker rebate). NOT per-instrument.
- WS JSON-RPC: `{"jsonrpc":"2.0","method":"subscribe","params":{"stream":"v1.book.s","selectors":["BTC_USDT_Perp@500-50"]},"id":1}`. Streams `v1.{book.s,book.d,trade,ticker.s,mini.s}`; trade-data streams `v1.{order,fill,position}` need cookie+X-Grvt-Account-Id on connect.

## ✅ Crypto core BUILT + PROVEN (2026-05-26)

`src/adapters/grvt/signing.ts` (NEW, self-contained) implements the leg-based EIP-712 order signing and is **proven two ways**:
1. **Sign→recover roundtrip** (`tests/unit/grvt-signing.test.ts`, 18 tests green): ethers `verifyTypedData` recovers the signer for Order / OrderWithBuilderFee / sell-side; tampered message + testnet-domain do NOT recover (self-consistent).
2. **Byte-identical to official pysdk** (cross-SDK check): same key + order → identical `r/s/v` in ethers (TS) and `eth_account` (the pysdk's signer). RFC-6979 deterministic ECDSA, so equality = venue-correct, not just self-consistent.
   - signer `0xf39Fd6…92266`, r `0xd715aee…177d63b3d`, s `0x527401e2…970853e`, v `27`.

**Wave B must DELEGATE all order signing to `signing.ts`** (`signOrder`, `buildOrderTypedData`, `scaleDecimal`, `generateNonce`, `generateExpiration`, `GRVT_CHAIN_IDS`, `GRVT_SIGN_TIME_IN_FORCE`) — do NOT re-implement EIP-712. `signing.ts` exports `GrvtSignOrderInput` (subAccountId, isMarket, timeInForce, postOnly, reduceOnly, legs[{instrumentHash, baseDecimals, size, limitPrice, isBuyingAsset}], chainId, nonce?, expiration?, builder?, builderFee?) and returns `GrvtSignature` ({signer,r,s,v,expiration,nonce,chainId}).

## Rewrite checklist (files) — crypto core (#3 signing) DONE; remaining = wave B
1. `constants.ts` — fix domain (no verifyingContract, name/version), testnet chainId 326, replace ORDER_TYPE with leg-based Order+OrderLeg, add TIF sign-enum + API-string maps, fix endpoint paths to `full/v1/*` + the 3 hosts. (EIP-712 domain/order-type now live in `signing.ts` — `constants.ts` should re-export or drop them, not duplicate.)
2. `types.ts` — rewrite GRVTMarket (instrument_hash/base_decimals/kind, no fees), GRVTOrderBook ({price,size,num_orders}+event_time), GRVTTrade (is_taker_buyer), GRVTOrderSignPayload (subAccountID, instrument_hash, base_decimals, size, price, is_buying, is_market, tif, post_only, reduce_only, nonce uint32, expiration nanos). Add ticker type w/ 24h vol fields.
3. `GRVTAuth.ts` — replace request-auth with cookie-session (login → gravity cookie + X-Grvt-Account-Id); rewrite `signOrder`/`createSignature` to the leg-based struct + encoding; add chain_id to signature DTO; nonce uint32, expiration nanos.
4. `GRVTAdapter.ts createOrder` — cache instrument meta (instrument_hash + base_decimals) from `fetch_markets`; carry `sub_account_id` from login; build the leg-based payload + wire body; client_order_id in [2^63,2^64-1].
5. `GRVTNormalizer.ts` — map the real instrument/book/trade/ticker shapes.
6. `GRVTSDKWrapper.ts`/`GRVTWebSocketWrapper.ts` — POST `full/v1/*`, JSON-RPC WS.
7. **Tests** — rewrite `grvt-auth.test.ts` signing tests to the leg struct + add a **sign→recover roundtrip** (ethers `verifyTypedData`) proving the EIP-712 self-consistency; tsc clean; existing non-GRVT tests untouched.

## ✅ WAVE B COMPLETE (2026-05-26)

All 7 files rewritten + tests rewritten to real shapes. Verified independently:
- **tsc clean for GRVT** (only 2 pre-existing `src/utils/crypto.ts` Uint8Array errors remain, unrelated).
- **All 10 GRVT suites / 244 tests pass** (incl. `grvt-signing.test.ts` 18/18 crypto-core regression guard + `grvt.spec.ts` contract).
- Diff **surgical to `src/adapters/grvt/` + `tests/**/grvt*`** (the Katana working-tree changes are pre-existing from 2026-05-25, not this rewrite).
- Full-suite `jest is not defined` failures are **pre-existing** (project-wide ESM/jest-global quirk in old tests untouched by this work, e.g. `rate-limiter.test.ts` unmodified since 2026-03-05, no GRVT coupling) — NOT caused by the rewrite.
- `@grvt/client` no longer imported anywhere in `src/` (replaced by a direct `fetch` client in `GRVTSDKWrapper.ts`).

## ⏳ DEFERRED — live testnet verify (needs operator API key)
Live-verify on **testnet (chainId 326)**: login → cookie, place a tiny post-only order, confirm accepted (not `FAIL_POST_ONLY`/signature-reject). GRVT analog of the Katana VERIFY-LIVE. The signing is already byte-identical to the official pysdk, so this gates the AUTH/wire-body path, not the signature.

**5 live-API assumptions to confirm during the testnet verify** (baked into the impl, could not be hit offline):
1. `gravity` cookie parsed via regex `gravity=([^;,\s]+)` from a (possibly comma-collapsed) `Set-Cookie`; may need `Headers.getSetCookie()` if it doesn't survive Node fetch's header collapse.
2. Login body wrapping: impl handles both `{result:{sub_account_id,…}}` and bare `{sub_account_id,…}` — confirm which.
3. `full/v1/funding` accepts both array and single-object — confirm shape.
4. Account-summary balances read from `result.spot_balances` — confirm field name.
5. Cookie expiry defaults to 24h + 5s refresh buffer (no explicit expiry in spec) — parse `Max-Age`/`Expires` if GRVT returns one.

## Reference
- zo-mm-sim `src/zo_mm_sim/recorder/adapters/grvt.py` — already-built, working GRVT **market-data** parsers (instruments/book/trade/ticker) — mirror for the read side.
- Official SDKs: `github.com/gravity-technologies/grvt-pysdk`, `grvt-ts-sdk` — authoritative for signing/auth.
- Z1 `~/Obsidian/Dev/Research/perp-dex-maker-venue-scan-2026-05.md` + zo-mm-sim `.omc/specs/grvt-standx-probe-scope.md`.
