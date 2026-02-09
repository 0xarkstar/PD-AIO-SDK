# Perp DEX Landscape Analysis

> Last updated: 2026-02-09
> PD-AIO-SDK v0.2.0 — 13 adapters

---

## 1. Executive Summary

The perpetual DEX market has matured into a multi-trillion-dollar annualized sector. On February 5, 2026, the market recorded $70B in single-day volume — the second-highest ever — demonstrating the explosive growth trajectory. Hyperliquid leads with ~35% daily market share ($24.7B peak day), followed by Aster ($10B), EdgeX ($8.7B), and Lighter ($7.5B).

**PD-AIO-SDK's position**: The SDK covers 13 exchanges spanning 8 chains/networks. However, several high-volume exchanges are not yet covered — notably **Aster** (#2 by daily volume), **Pacifica** (top Solana perp DEX by volume), and **Reya** (innovative L2 architecture). Adding these would significantly expand the SDK's addressable market.

**Key findings**:

1. **Lighter has flipped Hyperliquid** in 30-day perps volume ($198B vs $166B), though HL retains dominance in OI ($7.3B vs $1.4B) and revenue
2. **Aster (ex-SynFutures)** on BNB Chain has surged to #2 with $125B+ 30-day volume and $1.7B TVL — a critical gap in SDK coverage
3. **Developer incentive programs** are substantial: Hyperliquid Builder Codes alone have generated $40M+ in developer revenue; dYdX's grants program has $8M allocated; Arbitrum ecosystem grants fund GMX and others

---

## 2. Current SDK Coverage (13 Adapters)

| # | Exchange | Chain/Network | TVL | 30d Volume (est.) | Open Interest | Status |
|---|----------|---------------|-----|-------------------|---------------|--------|
| 1 | **Hyperliquid** | Hyperliquid L1 | ~$1.5B | ~$166B | ~$5.1–7.3B | Active leader; spot + perps |
| 2 | **Lighter** | Lighter Chain (ETH L2) | ~$1.4B | ~$198B | ~$1.4B | Flipped HL in 30d vol; LIT token live |
| 3 | **EdgeX** | StarkEx / Ethereum L2 | ~$356M | ~$120B | ~$790M | #4 by volume; V2 in Q1 2026 |
| 4 | **Jupiter** | Solana | ~$554M | ~$30–50B (est.) | N/A | 250x leverage; JLP vault; Polymarket integration |
| 5 | **Drift** | Solana | ~$817M | ~$25–40B (est.) | N/A | v3 launched Feb 2026; 10x faster fills |
| 6 | **dYdX** | dYdX Chain (Cosmos) | ~$41M | ~$10–20B (est.) | N/A | Migrated to own chain; RWA perps planned |
| 7 | **GMX** | Arbitrum + Avalanche | ~$600M | ~$5–10B (est.) | ~$68M | V2 pools; expanding to Solana |
| 8 | **Paradex** | Starknet Appchain | ~$140M | ~$30B | N/A | Zero-fee; privacy-focused; rapid growth |
| 9 | **GRVT** | ZKsync Validium | N/A | ~$3.8B (est.) | ~$9M | TGE planned Q1 2026; $19M Series A |
| 10 | **Backpack** | Solana | N/A | ~$22B | N/A | VARA licensed; $1.5B daily perps vol |
| 11 | **EdgeX** | (see row 3) | — | — | — | — |
| 12 | **Nado** | Ink (Kraken L2) | N/A | ~$800M/day (beta) | ~$40M | Open Beta Season 1; CEX-speed (5–15ms) |
| 13 | **Extended** | Starknet | ~$200M | ~$10–15B (est.) | ~$55M | #1 Starknet app by TVL; 50+ markets |
| — | **Variational** | Arbitrum | N/A | ~$9.6B | N/A | RFQ model; zero fees; loss rebates |

> **Notes**: Volume estimates use a mix of DeFiLlama 30-day data and extrapolated daily figures from January–February 2026. TVL and OI figures are point-in-time snapshots. "N/A" indicates data not readily available from public sources.

### Coverage by Chain

| Chain | Adapters | Notes |
|-------|----------|-------|
| Hyperliquid L1 | Hyperliquid | Dominant perp chain |
| Solana | Jupiter, Drift, Backpack | 3 adapters; missing Pacifica |
| Arbitrum | GMX, Variational | 2 adapters; missing Ostium |
| Starknet | Paradex, Extended | 2 adapters |
| StarkEx | EdgeX | 1 adapter |
| Lighter Chain | Lighter | 1 adapter |
| ZKsync | GRVT | 1 adapter |
| Ink (Kraken L2) | Nado | 1 adapter |
| dYdX Chain | dYdX | 1 adapter |
| **BNB Chain** | **NONE** | **Gap: Aster (#2 by volume)** |
| **Ethena Network** | **NONE** | **Gap: Ethereal** |
| **Reya Chain** | **NONE** | **Gap: Reya** |

---

## 3. New Adapter Candidates

### 3.1 HIGH Priority

#### Aster (formerly SynFutures) — BNB Chain + Multi-chain

| Metric | Value |
|--------|-------|
| Chain | BNB Chain (primary), Ethereum, Solana, Arbitrum |
| 30d Volume | ~$125B+ |
| TVL | ~$359M–$1.7B (varies by source) |
| Daily Volume Peak | ~$10B (Feb 5, 2026) |
| API Maturity | REST API documented (docs.asterdex.com); GitHub API docs (asterdex/api-docs) |
| SDK | API key system; no official TS/Python SDK yet |
| Token | ASTER (live) |

**Rationale**: Aster is the #2 perp DEX by daily volume and the dominant protocol on BNB Chain. The SDK currently has zero BNB Chain coverage — adding Aster would fill this critical gap and capture one of the highest-volume venues in the market. API documentation exists and is mature enough for integration. The SynFutures Builder Program provides infrastructure for external developers.

**Priority: HIGH** — Volume justifies immediate integration; BNB Chain is an unserved ecosystem.

---

#### Pacifica — Solana

| Metric | Value |
|--------|-------|
| Chain | Solana |
| 30d Volume | ~$15–25B (est.) |
| Daily Volume Peak | ~$1.75B |
| OI | ~$34M+ |
| API Maturity | REST API documented (docs.pacifica.fi/api-documentation/api) |
| SDK | No official SDK found |
| Token | PACIFICA (expected) |
| Team | Ex-FTX COO Constance Wang + ex-Alameda members |

**Rationale**: Pacifica has overtaken Jupiter as the largest Solana perp DEX by daily trading volume. While the SDK already has 3 Solana adapters (Jupiter, Drift, Backpack), Pacifica represents the fastest-growing venue on the chain. The ex-FTX team brings institutional-grade engineering. API documentation is available.

**Priority: HIGH** — Fastest-growing Solana perp DEX; strong API documentation; complements existing Solana coverage.

---

#### Ostium — Arbitrum (RWA Focus)

| Metric | Value |
|--------|-------|
| Chain | Arbitrum |
| 7d Volume | ~$938M |
| Cumulative Volume | $25B+ |
| TVL | N/A |
| API Maturity | REST API + **official Python SDK** (0xOstium/ostium-python-sdk) |
| SDK | Python SDK on GitHub (v3.10+); supports orders, positions, fees |
| Token | Points program active; TGE anticipated |
| Funding | $24M raised (Harvard alumni-founded) |

**Rationale**: Ostium occupies a unique niche — RWA perpetuals (stocks, forex, commodities, indices) on Arbitrum. This is a differentiated market segment not served by any current adapter. The **official Python SDK** is the most developer-friendly among all candidates, significantly reducing integration effort. Builder Codes provide permissionless fee sharing.

**Priority: HIGH** — Unique RWA niche; official Python SDK reduces dev effort; $24M funded; growing rapidly.

---

### 3.2 MEDIUM Priority

#### Reya — Reya Chain (Arbitrum Orbit L2)

| Metric | Value |
|--------|-------|
| Chain | Reya Chain (Arbitrum Orbit) |
| Weekly Volume | ~$3.6B |
| TVL | ~$31M |
| API Maturity | REST API v2 documented (docs.reya.xyz); WebSocket available |
| SDK | No official SDK; REST API only |
| Token | Points program active |

**Rationale**: Reya's L2-enshrined DEX architecture is technically innovative — gas-free, MEV-proof, FIFO matching, yield-bearing collateral (srUSD). The REST API v2 is well-documented. However, TVL is still modest ($31M) and volume is lower than HIGH priority candidates. Worth monitoring for growth.

**Priority: MEDIUM** — Innovative architecture; good API docs; lower volume than top candidates.

---

#### Ethereal — Ethena Network (L3)

| Metric | Value |
|--------|-------|
| Chain | Ethena Network L3 |
| 30d Volume | ~$1.56B |
| TVL | N/A |
| API Maturity | REST API + WebSocket (docs.etherealtest.net); Python SDK |
| SDK | Trading API + Python SDK documented |
| Token | Season Zero points program; ENA integration |

**Rationale**: Ethereal operates on the Ethena Network L3, using USDe as native collateral. Sub-20ms execution. Has developer docs and Python SDK. Volume is still early-stage but growing. The Ethena ecosystem backing provides strong tailwinds.

**Priority: MEDIUM** — Early-stage but well-funded ecosystem; developer tools exist; USDe-native is differentiated.

---

### 3.3 LOW Priority

#### Trade.xyz — Hyperliquid L1

| Metric | Value |
|--------|-------|
| Chain | Hyperliquid L1 |
| Volume | Routed through Hyperliquid |
| API | Hyperliquid API (same endpoints) |

**Assessment**: Trade.xyz is a **modular protocol stack / frontend layer** built on top of Hyperliquid. It routes orders through Hyperliquid's orderbook via HIP-3. Trades executed via Trade.xyz use the same Hyperliquid API endpoints — the existing Hyperliquid adapter already covers this liquidity. A separate adapter would be redundant.

**Priority: LOW** — Not a separate exchange; uses Hyperliquid API. No adapter needed.

---

#### Based — Hyperliquid L1

| Metric | Value |
|--------|-------|
| Chain | Hyperliquid L1 |
| Volume | Routed through Hyperliquid |
| API | Hyperliquid API (same endpoints) |

**Assessment**: Similar to Trade.xyz, Based appears to be a **frontend/interface** built on Hyperliquid's infrastructure. No evidence of independent orderbook or separate API. The existing Hyperliquid adapter covers all trading on the HL L1 chain.

**Priority: LOW** — White-label HL frontend; no separate adapter needed.

---

## 4. Developer Programs & Incentives

### 4.1 Current Exchanges

| Exchange | Program Type | Details | Est. Value |
|----------|-------------|---------|------------|
| **Hyperliquid** | Builder Codes | Permissionless; earn up to 0.1% on perps, 1% on spot per trade | **$40M+ paid to devs** to date; Phantom earns ~$100K/day |
| **Hyperliquid** | HIP-3 Markets | Launch custom perp markets on HL | Revenue share on new markets |
| **dYdX** | Grants Program | $8M DYDX allocated; 12–18 month program via dYdX Grants Ltd. | Up to $8M in grants |
| **dYdX** | Nethermind SDK | Funded API docs, SDK parity (TS/Python/Rust), client maintenance | Multi-year grants |
| **GMX** | Arbitrum STIP | 12M ARB tokens for GMX V2 ecosystem incentives | ~$12M in ARB |
| **GMX** | GMX Grants | 80+ protocols built on GMX foundations | Project-specific grants |
| **Drift** | Protocol Fees Fund | $1.5M/month ($9M/6mo) from protocol fees for development | $18M/year for dev |
| **Drift** | Ecosystem Grants | Grants, hackathons, improved SDKs planned for 2026 | TBD |
| **Paradex** | Starknet Grants | Starknet Seed Grants + Growth Grants for ecosystem projects | Varies |
| **Paradex** | XP Campaign | Season 2 extended; points → potential token | Points-based |
| **Backpack** | Developer APIs | Official REST API + SDKs (Python, TS, Go, Rust) | N/A (tools) |
| **GRVT** | SDK Support | Official Python SDK + TypeScript SDK (@grvt/sdk on NPM) | N/A (tools) |
| **Lighter** | LIT Token | 25% community airdrop; 50% to ecosystem | ~$500M+ at FDV |
| **EdgeX** | Points Program | 1 point per $1 traded; convert to $MARU at TGE (Mar 2026) | Points → tokens |
| **Nado** | Beta Rewards | Open Beta Season 1 rewards; NFT collection airdrop | TBD |
| **Extended** | Points Program | Active points program for traders | Points → potential token |
| **Variational** | Zero Fees + Loss Rebate | 2–4% loss rebates to traders; zero maker/taker fees | Direct trader incentive |

### 4.2 Candidate Exchanges

| Exchange | Program Type | Details | Est. Value |
|----------|-------------|---------|------------|
| **Aster** | SynFutures Builder Program | External teams build on SynFutures infrastructure; modular trading venues | Infrastructure access |
| **Aster** | API Access | REST API with key system; code to be open-sourced Q1 2026 | N/A (tools) |
| **Pacifica** | Points Program | Active points/airdrop program; PACIFICA token anticipated | Points → token |
| **Pacifica** | API | REST API documented at docs.pacifica.fi | N/A (tools) |
| **Ostium** | Builder Codes | Permissionless builder fees; atomic transfer on trade open | Revenue share |
| **Ostium** | Python SDK | Official Python SDK (GitHub: 0xOstium/ostium-python-sdk) | N/A (tools) |
| **Reya** | REST API v2 | Documented trading API for automated systems | N/A (tools) |
| **Reya** | Arbitrum LTIPP | Applied for Arbitrum long-term incentives program | TBD |
| **Ethereal** | Season Zero Points | Early user points program; Python SDK available | Points → token |
| **Ethereal** | Ethena Ecosystem | Backed by Ethena governance; ENA integration benefits | Ecosystem support |

---

## 5. Recommended Next Adapters

### Top 3 Picks

#### 1. Aster (BNB Chain) — **HIGHEST PRIORITY**

**Volume**: ~$125B 30-day; #2 daily behind Hyperliquid
**Why**:
- Fills the SDK's biggest chain gap (zero BNB Chain coverage)
- Consistently top-3 by daily volume ($10B on peak days)
- API documentation is available (docs.asterdex.com + GitHub)
- SynFutures Builder Program provides developer support
- Multi-chain expansion (ETH, Solana, Arbitrum) means one adapter covers multiple deployments

**Effort estimate**: Medium — REST API documented; no official SDK, but API docs on GitHub

---

#### 2. Ostium (Arbitrum) — **HIGH PRIORITY, LOW EFFORT**

**Volume**: $25B+ cumulative; ~$938M weekly
**Why**:
- **Official Python SDK** dramatically reduces integration effort
- Unique RWA niche (stocks, forex, commodities) — no other adapter covers this market
- Builder Codes provide immediate revenue-sharing opportunity
- $24M funded; Harvard alumni team; strong institutional backing
- Arbitrum chain already supported (GMX, Variational) — infra reuse

**Effort estimate**: Low — Official Python SDK available; Arbitrum already supported

---

#### 3. Pacifica (Solana) — **HIGH PRIORITY**

**Volume**: Overtaken Jupiter as #1 Solana perp DEX by daily volume
**Why**:
- Fastest-growing perp DEX on Solana
- Ex-FTX team (Constance Wang, former COO) brings engineering credibility
- API documentation available at docs.pacifica.fi
- Solana infra already well-established in SDK (Jupiter, Drift, Backpack)
- Likely token launch ahead — early integration captures airdrop-driven volume

**Effort estimate**: Medium — REST API docs available; Solana tooling already in SDK

---

### Honorable Mentions

| Exchange | Priority | Rationale |
|----------|----------|-----------|
| Reya | MEDIUM | Innovative L2 architecture; good API v2 docs; monitor for volume growth |
| Ethereal | MEDIUM | Ethena ecosystem backing; Python SDK; early-stage volume |
| Trade.xyz / Based | LOW | HL frontends — covered by existing Hyperliquid adapter |

---

## 6. Appendix

### Data Sources

| Source | URL | Data Used |
|--------|-----|-----------|
| DeFiLlama | defillama.com/perps | TVL, volume, protocol rankings |
| CoinGecko | coingecko.com | OI, 24h volume, exchange data |
| Messari | messari.io | Protocol research, funding data |
| CoinMarketCap | coinmarketcap.com | Market insights, protocol updates |
| Official Docs | Various (docs.asterdex.com, docs.pacifica.fi, etc.) | API maturity assessment |
| GitHub | Various repos | SDK availability |
| News Sources | The Block, CoinDesk, Blockworks, Crypto Briefing | Market developments |

### Methodology

1. **TVL data**: Point-in-time snapshots from DeFiLlama and official sources (January–February 2026)
2. **Volume data**: 30-day trailing volume from DeFiLlama where available; extrapolated from daily figures when 30-day data unavailable
3. **API maturity**: Assessed by checking official documentation sites, GitHub repos, and SDK availability on NPM/PyPI
4. **Priority ranking**: Weighted combination of:
   - 30-day trading volume (40%)
   - API/SDK maturity and integration effort (25%)
   - Chain coverage gap filled (20%)
   - Developer incentive programs (15%)

### Key Market Events (Q4 2025 – Q1 2026)

- **Dec 2025**: Lighter launches LIT token with 25% community airdrop; volume surges past Hyperliquid
- **Jan 2026**: Aster surges to #2 on record BNB Chain perp volume ($67B monthly chain record)
- **Jan 2026**: EdgeX overtakes Tron and Hyperliquid in 24-hour fees
- **Feb 2026**: $70B single-day perp DEX volume (Feb 5); Hyperliquid leads at $24.7B
- **Feb 2026**: Drift v3 launches on Solana with 10x faster order fills

### Disclaimer

This analysis is based on publicly available data as of February 9, 2026. Metrics (TVL, volume, OI) change rapidly and should be verified against live sources before making integration decisions. Volume figures may include wash trading on some platforms. TVL figures from different sources may not be directly comparable due to differing methodologies.
