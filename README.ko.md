# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - 탈중앙화 영구선물 거래소 통합 TypeScript SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-6908%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)](https://github.com/0xarkstar/PD-AIO-SDK)
[![ESLint](https://img.shields.io/badge/ESLint-0%20errors-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![npm version](https://img.shields.io/badge/npm-v0.3.0-blue)](https://www.npmjs.com/package/pd-aio-sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

한국어 | **[English](./README.md)**

---

## ⚡ 5분 빠른 시작

```bash
npm install pd-aio-sdk
```

```typescript
import { createExchange } from 'pd-aio-sdk';

// 1. 시장 데이터 조회 (인증 불필요)
const hl = await createExchange('hyperliquid', { testnet: true });
await hl.initialize();

const ticker = await hl.fetchTicker('ETH/USDT:USDT');
console.log(`ETH 가격: $${ticker.last}`);

// 2. 거래 실행 (인증 포함)
const exchange = await createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  testnet: true,
});
await exchange.initialize();

const order = await exchange.createOrder({
  symbol: 'ETH/USDT:USDT',
  side: 'buy',
  type: 'limit',
  amount: 0.1,
  price: 3000,
});
```

> **19개 거래소, 하나의 인터페이스.** `'hyperliquid'`를 지원되는 다른 거래소로 바꾸기만 하면 — API는 동일합니다.

---

## 🎯 PD AIO SDK란?

**PD AIO SDK** (Perp DEX All-In-One SDK)는 **19개의 탈중앙화 영구선물 거래소**를 단일 인터페이스로 거래할 수 있게 해주는 프로덕션 레벨의 통합 TypeScript SDK입니다. 더 이상 각 거래소마다 다른 API를 배울 필요 없이, 한 번 작성하면 어디서든 거래할 수 있습니다.

### 왜 "All-In-One"인가?

- **하나의 인터페이스** → 19개 거래소 (Hyperliquid, GRVT, Paradex, EdgeX, Backpack, Lighter, Nado, Extended, Variational, dYdX, Jupiter, Drift, GMX, Aster, Pacifica, Ostium, Reya, Ethereal, Avantis)
- **하나의 코드베이스** → 모든 거래 작업 (시장 데이터, 주문, 포지션, WebSocket)
- **하나의 설치** → 완전한 솔루션 (인증, 속도 제한, 에러 처리)

---

## ✨ 주요 기능

### 🔌 통합 인터페이스
- **CCXT 스타일 API** - 개발자에게 친숙한 인터페이스
- **완전한 Async/Await** - 모든 메서드가 Promise 반환, 콜백 없음
- **일관된 메서드명** - 모든 거래소에서 동일한 메서드 사용
- **Python 별칭 지원** - Python 개발자를 위한 snake_case 메서드

### 🌐 다중 거래소 지원

| 거래소 | 상태 | 마켓 | 인증 | 비고 |
|--------|------|------|------|------|
| **Hyperliquid** | ✅ 검증 완료 | 229 perp | EIP-712 | 전체 API + WebSocket |
| **EdgeX** | ✅ 검증 완료 | 292 perp | StarkNet ECDSA | REST 거래 없음¹ |
| **Paradex** | ✅ 검증 완료 | 95 perp | StarkNet + JWT | OB 인증 필요 |
| **GRVT** | ✅ 검증 완료 | 95 perp | API Key + EIP-712 | 서브밀리초 지연시간 |
| **Backpack** | ✅ 검증 완료 | 159 perp+spot | ED25519 | 솔라나 기반 |
| **Lighter** | ✅ 검증 완료 | 156 perp | WASM 서명 | 크로스 플랫폼 |
| **Nado** | ✅ 검증 완료 | 44 perp+spot | EIP-712 (Ink L2) | REST 거래 없음¹ |
| **Extended** | ✅ 검증 완료 | 114 perp | API Key | StarkNet DEX |
| **Variational** | ✅ 검증 완료 | 470 RFQ | API Key | WebSocket 없음 |
| **dYdX v4** | ✅ 검증 완료 | 293 perp | Cosmos SDK | 전체 거래 + WebSocket |
| **Jupiter Perps** | ✅ 검증 완료 | 3 perp | Solana 지갑 | 오라클 기반, OB 없음⁴ |
| **Drift Protocol** | ✅ 검증 완료 | 41 perp | Solana 지갑 | DLOB + WebSocket |
| **GMX v2** | ✅ 검증 완료 | 129 markets | 온체인 | 오라클 기반, OB 없음⁴ |
| **Aster** | ✅ 검증 완료 | 304 perp | HMAC-SHA256 | 전체 API + OHLCV |
| **Pacifica** | ✅ 검증 완료 | 59 perp | ED25519 | 솔라나 기반 |
| **Ostium** | ✅ 검증 완료 | 11 RWA perp | ethers.js | 오라클 기반, OB 없음⁴ |
| **Reya** | ✅ 검증 완료 | 69 perp | EIP-712 | 오라클/풀 기반, OB 없음⁴ |
| **Ethereal** | ✅ 검증 완료 | 15 perp | EIP-712 | USDe 담보 |
| **Avantis** | 🟡 부분 지원 | 온체인 | 지갑 서명 | 컨트랙트 주소 필요⁵ |

> ¹ 실시간 거래 데이터는 `watchTrades()` 사용
> ² GMX 거래는 ExchangeRouter 컨트랙트를 통한 온체인 트랜잭션 필요
> ³ Ostium은 RWA (실세계 자산) 영구선물 전문: 주식, 외환, 원자재, 지수
> ⁴ 오라클/AMM 기반 DEX — 전통적인 오더북 없음
> ⁵ Avantis는 Base 메인넷 실제 컨트랙트 주소 필요 (온체인 프로토콜)

### 📊 API 완성도 매트릭스

#### 범례
- ✅ 완전 구현
- ⚠️ 부분 구현 (제한 있음)
- ❌ 미구현

#### Public API 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX | Aster | Pacifica | Ostium | Reya | Ethereal | Avantis |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|:-----:|:--------:|:------:|:----:|:--------:|:-------:|
| fetchMarkets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁵ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| fetchTrades | ✅ | ❌¹ | ❌ | ✅ | ⚠️² | ✅ | ⚠️³ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| fetchOHLCV | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fetchFundingRate | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| fetchFundingRateHistory | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### 거래 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX | Aster | Pacifica | Ostium | Reya | Ethereal | Avantis |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|:-----:|:--------:|:------:|:----:|:--------:|:-------:|
| createOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁶ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cancelOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁶ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cancelAllOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁶ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| createBatchOrders | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️⁴ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cancelBatchOrders | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ⚠️⁴ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| editOrder | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### 계정 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX | Aster | Pacifica | Ostium | Reya | Ethereal | Avantis |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|:-----:|:--------:|:------:|:----:|:--------:|:-------:|
| fetchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁷ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchBalance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁷ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchOrderHistory | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fetchMyTrades | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fetchUserFees | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fetchPortfolio | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| setLeverage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌⁸ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| setMarginMode | ❌ | ❌ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### WebSocket 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX | Aster | Pacifica | Ostium | Reya | Ethereal | Avantis |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|:-----:|:--------:|:------:|:----:|:--------:|:-------:|
| watchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchTrades | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchBalance | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchMyTrades | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| watchFundingRate | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### 어댑터별 완성도 요약

| 어댑터 | Public | 거래 | 계정 | WebSocket | **전체** |
|---------|:------:|:-------:|:-------:|:---------:|:---------:|
| **Extended** | 6/7 (86%) | 6/6 (100%) | 8/8 (100%) | 7/8 (88%) | **93%** |
| **dYdX v4** | 7/7 (100%) | 5/6 (83%) | 5/8 (63%) | 7/8 (88%) | **83%** |
| **Hyperliquid** | 6/7 (86%) | 5/6 (83%) | 7/8 (88%) | 6/8 (75%) | **83%** |
| **Drift** | 6/7 (86%) | 3/6 (50%) | 5/8 (63%) | 7/8 (88%) | **72%** |
| **GRVT** | 6/7 (86%) | 4/6 (67%) | 5/8 (63%) | 6/8 (75%) | **72%** |
| **Paradex** | 5/7 (71%) | 3/6 (50%) | 6/8 (75%) | 7/8 (88%) | **71%** |
| **Backpack** | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Lighter** | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Nado** | 4/7 (57%) | 4/6 (67%) | 5/8 (63%) | 5/8 (63%) | **62%** |
| **EdgeX** | 4/7 (57%) | 5/6 (83%) | 4/8 (50%) | 6/8 (75%) | **62%** |
| **Jupiter** | 5/7 (71%) | 3/6 (50%) | 3/8 (38%) | 0/8 (0%) | **38%** |
| **Variational** | 4/7 (57%) | 5/6 (83%) | 4/8 (50%) | 0/8 (0%) | **45%** |
| **GMX v2** | 5/7 (71%) | 0/6 (0%) | 0/8 (0%) | 0/8 (0%) | **17%** |
| **Aster** | 7/7 (100%) | 3/6 (50%) | 4/8 (50%) | 0/8 (0%) | **48%** |
| **Pacifica** | 5/7 (71%) | 3/6 (50%) | 4/8 (50%) | 0/8 (0%) | **41%** |
| **Ostium** | 3/7 (43%) | 3/6 (50%) | 3/8 (38%) | 0/8 (0%) | **31%** |

#### 참고사항
- ¹ EdgeX: REST 엔드포인트 없음
- ² Hyperliquid: REST에서 빈 배열 반환, WebSocket 사용
- ³ Nado: REST 가능하나 제한적, WebSocket 권장
- ⁴ Variational: 배치 작업은 에뮬레이션 (순차 처리)
- ⁵ GMX: AMM 기반, 전통적인 오더북 없음
- ⁶ GMX: 거래는 ExchangeRouter를 통한 온체인 트랜잭션 필요
- ⁷ GMX: 서브그래프 또는 RPC 통합 필요
- ⁸ dYdX/Jupiter/Drift/GMX: 레버리지는 주문 시 포지션별로 설정

### 🔐 프로덕션급 보안
- **EIP-712 서명** (Hyperliquid, GRVT, Nado, Reya, Ethereal)
- **StarkNet ECDSA + SHA3** (EdgeX)
- **StarkNet 서명** (Paradex)
- **ED25519** (Backpack)
- **WASM 기반 서명** (Lighter) - 크로스 플랫폼, 네이티브 의존성 없음
- **API Key 인증** (Extended)
- **Cosmos SDK 서명** (dYdX v4)
- **Solana 지갑 서명** (Jupiter, Drift)
- **HMAC-SHA256** (Aster)
- **ethers.js 컨트랙트 서명** (Ostium)
- **지갑 서명** (Avantis)
- **보안 자격증명 관리** 및 검증 기능

### ⚡ 엔터프라이즈 기능
- **WebSocket 스트리밍** - 실시간 오더북, 포지션, 거래 데이터
- **자동 재연결** - 지수 백오프 및 구독 복구
- **속도 제한** - 거래소별 제한 자동 준수
- **스마트 캐싱** - 설정 가능한 TTL을 통한 시장 데이터 캐싱
- **재시도 로직** - 지수 백오프를 통한 자동 재시도
- **타입 안전성** - 런타임 검증(Zod) + TypeScript strict mode

### 📊 개발자 경험
- **Pattern A 아키텍처** - 19개 어댑터 모두 표준화된 구조 따름
- **6908개 테스트** - 100% 통과율, 85% 커버리지 적용
- **구조화된 로깅** - 민감 데이터 마스킹을 포함한 JSON 로그
- **헬스 체크** - 내장 시스템 모니터링
- **포괄적인 문서** - 영어 + 한국어 문서 제공
- **TypeScript strict mode** - 완전한 타입 안전성
- **예제 포함** - 10개 이상의 즉시 사용 가능한 예제

---

## 🚀 빠른 시작

### 설치

```bash
npm install pd-aio-sdk
# 또는
yarn add pd-aio-sdk
# 또는
pnpm add pd-aio-sdk
```

### 기본 사용법

```typescript
import { createExchange } from 'pd-aio-sdk';

// 어댑터 초기화 (Public API는 인증 불필요)
const exchange = await createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// 시장 데이터 조회 (Public API - 자격증명 불필요)
const markets = await exchange.fetchMarkets();
const orderBook = await exchange.fetchOrderBook('BTC/USDT:USDT');
const ticker = await exchange.fetchTicker('BTC/USDT:USDT');

console.log(`${markets.length}개 마켓 발견`);
console.log(`BTC 가격: ${ticker.last}`);
```

### 인증 포함 (거래용)

```typescript
import { createExchange } from 'pd-aio-sdk';

// Private API를 위한 자격증명과 함께 초기화
const exchange = await createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();

// 주문 생성 (인증 필요)
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000
});

// 포지션 및 잔액 확인
const positions = await exchange.fetchPositions();
const balances = await exchange.fetchBalance();

// 주문 취소
await exchange.cancelOrder(order.id, 'BTC/USDT:USDT');

// 정리
await exchange.disconnect();
```

---

## 📚 지원 거래소

### ✅ 프로덕션 준비 완료

#### Hyperliquid
```typescript
const exchange = await createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY, // Public API는 선택사항
  testnet: true
});
```
- **마켓**: 229 perp
- **인증**: EIP-712 서명
- **특징**: 초당 20만 주문, HIP-3 생태계, 완전한 WebSocket 지원

#### EdgeX
```typescript
const exchange = await createExchange('edgex', {
  starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY, // Public API는 선택사항
});
```
- **마켓**: 292 perp
- **인증**: SHA3-256 + ECDSA 서명
- **참고**: fetchTrades는 WebSocket만 지원 (REST 엔드포인트 없음)

#### Nado
```typescript
const exchange = await createExchange('nado', {
  privateKey: process.env.NADO_PRIVATE_KEY, // Public API는 선택사항
  testnet: true
});
```
- **마켓**: 44 perp+spot
- **인증**: Ink L2 (Kraken)에서 EIP-712 서명

#### GRVT
```typescript
const exchange = await createExchange('grvt', {
  apiKey: process.env.GRVT_API_KEY, // Public API는 선택사항
  testnet: false
});
```
- **마켓**: 95 perp
- **인증**: API Key + EIP-712 서명
- **특징**: 서브밀리초 지연시간, CEX/DEX 하이브리드 아키텍처
- **레버리지**: 최대 100x
- **WebSocket**: 실시간 오더북, 거래, 포지션, 주문

#### Backpack
```typescript
const exchange = await createExchange('backpack', {
  apiKey: process.env.BACKPACK_API_KEY, // Public API는 선택사항
  apiSecret: process.env.BACKPACK_API_SECRET,
  testnet: false
});
```
- **마켓**: 159 perp+spot
- **인증**: ED25519 서명
- **특징**: 솔라나 기반, 완전한 REST API + WebSocket
- **레버리지**: 선물 최대 20x

#### Lighter
```typescript
const exchange = await createExchange('lighter', {
  apiPrivateKey: process.env.LIGHTER_PRIVATE_KEY, // Public API는 선택사항
  testnet: true
});
```
- **마켓**: 156 perp
- **인증**: WASM 기반 서명 (크로스 플랫폼)
- **특징**: 완전한 거래 지원, WebSocket 스트리밍
- **설정**: 추가 설정 불필요 - WASM 모듈 자동 포함

#### dYdX v4
```typescript
const exchange = await createExchange('dydx', {
  mnemonic: process.env.DYDX_MNEMONIC,  // 24단어 시드 구문
  testnet: true
});
```
- **마켓**: 293 perp
- **인증**: Cosmos SDK 서명
- **특징**: L1 블록체인, 완전한 거래 + WebSocket 지원

#### Jupiter Perps
```typescript
const exchange = await createExchange('jupiter', {
  walletAddress: process.env.JUPITER_WALLET_ADDRESS,
  privateKey: process.env.JUPITER_PRIVATE_KEY,  // 거래용 선택사항
});
```
- **마켓**: 3 perp (SOL, ETH, BTC)
- **인증**: Solana 지갑 서명
- **특징**: 최대 100x 레버리지

#### Drift Protocol
```typescript
const exchange = await createExchange('drift', {
  walletAddress: process.env.DRIFT_WALLET_ADDRESS,
  privateKey: process.env.DRIFT_PRIVATE_KEY,  // 거래용 선택사항
});
```
- **마켓**: 41 perp
- **인증**: Solana 지갑 서명
- **특징**: DLOB (분산 지정가 주문서), 완전한 WebSocket 지원

#### GMX v2
```typescript
const exchange = await createExchange('gmx', {
  chain: 'arbitrum',  // 또는 'avalanche'
  walletAddress: process.env.GMX_WALLET_ADDRESS,  // 포지션 데이터용 선택사항
});
```
- **마켓**: 11 perp (Arbitrum 8개, Avalanche 3개)
- **인증**: 읽기 전용 REST API
- **특징**: AMM 기반, 거래는 온체인 트랜잭션 필요
- **참고**: 거래 기능은 @gmx-io/sdk 사용 필요

#### Aster
```typescript
const exchange = await createExchange('aster', {
  apiKey: process.env.ASTER_API_KEY,
  apiSecret: process.env.ASTER_API_SECRET,
});
```
- **마켓**: 304 perp
- **인증**: HMAC-SHA256 (Binance 스타일)
- **체인**: BNB Chain
- **특징**: 레퍼럴 코드 지원, OHLCV 데이터, 펀딩 레이트 히스토리

#### Pacifica
```typescript
const exchange = await createExchange('pacifica', {
  apiKey: process.env.PACIFICA_API_KEY,
  apiSecret: process.env.PACIFICA_API_SECRET,  // ED25519 개인키 (base64)
});
```
- **마켓**: 59 perp
- **인증**: ED25519 서명 (Backpack 스타일)
- **체인**: Solana
- **특징**: 빌더 코드 지원

#### Ostium
```typescript
const exchange = await createExchange('ostium', {
  privateKey: process.env.OSTIUM_PRIVATE_KEY,  // EVM 개인키
});
```
- **마켓**: 11 RWA perp (주식, 외환, 원자재, 지수)
- **인증**: ethers.js 컨트랙트 상호작용
- **체인**: Arbitrum
- **특징**: 실세계 자산(RWA) 영구선물, 서브그래프 서비스 마이그레이션 (일부 기능 제한)

#### Reya
```typescript
const exchange = await createExchange('reya', {
  privateKey: process.env.REYA_PRIVATE_KEY,  // EVM 개인키
});
```
- **마켓**: 69 perp
- **인증**: EIP-712 서명
- **체인**: Reya Network (Arbitrum L3)
- **특징**: 오라클/풀 기반 (오더북 없음), 연속 펀딩

#### Ethereal
```typescript
const exchange = await createExchange('ethereal', {
  privateKey: process.env.ETHEREAL_PRIVATE_KEY,  // EVM 개인키
});
```
- **마켓**: 15 perp
- **인증**: EIP-712 서명
- **특징**: USDe 담보, UUID 제품 ID

#### Avantis
```typescript
const exchange = await createExchange('avantis', {
  privateKey: process.env.AVANTIS_PRIVATE_KEY,  // EVM 개인키
});
```
- **마켓**: 온체인 (Base 체인)
- **인증**: 지갑 서명
- **특징**: Pyth 오라클 기반, 오더북 없음
- **참고**: 실제 컨트랙트 주소 필요 (플레이스홀더)

### 🟡 부분 지원

#### Paradex
```typescript
const exchange = await createExchange('paradex', { testnet: true });
```
- **마켓**: 95 perp
- **Public API**: ⚠️ 공개 엔드포인트 작동
- **Ticker/OrderBook**: ✅ 작동
- **Private API**: StarkNet 서명 + JWT 필요

#### Extended
```typescript
const exchange = await createExchange('extended', {
  apiKey: process.env.EXTENDED_API_KEY
});
```
- **마켓**: 114 perp
- **인증**: API Key
- **참고**: 메인넷만 작동

### 🔴 프로덕션 미준비

| 거래소 | 문제 | 비고 |
|--------|------|------|
| **Variational** | RFQ 기반, API 개발중 | 표준 오더북 아님 |

---

## 🔧 설정

### 환경 변수

```bash
# ============================================
# Hyperliquid (EIP-712) - ✅ 프로덕션 준비
# ============================================
HYPERLIQUID_PRIVATE_KEY=0x...  # 64자리 16진수
HYPERLIQUID_TESTNET=true

# ============================================
# EdgeX (SHA3 + ECDSA) - ✅ 프로덕션 준비
# ============================================
EDGEX_STARK_PRIVATE_KEY=0x...  # StarkNet 개인키

# ============================================
# Nado (Ink L2의 EIP-712) - ✅ 프로덕션 준비
# ============================================
NADO_PRIVATE_KEY=0x...  # EVM 개인키
NADO_TESTNET=true

# ============================================
# Lighter (WASM 서명) - ✅ 프로덕션 준비
# ============================================
LIGHTER_PRIVATE_KEY=0x...  # 64자리 16진수
LIGHTER_TESTNET=true

# ============================================
# Paradex (StarkNet) - 🟡 제한적
# ============================================
PARADEX_STARK_PRIVATE_KEY=0x...  # StarkNet 개인키
PARADEX_TESTNET=true

# ============================================
# Extended (API Key) - 🟡 메인넷만
# ============================================
EXTENDED_API_KEY=your_api_key
# 참고: 테스트넷 (Sepolia) 미운영

# ============================================
# dYdX v4 (Cosmos SDK) - ✅ 프로덕션 준비
# ============================================
DYDX_MNEMONIC="word1 word2 ... word24"  # 24단어 Cosmos 시드 구문
DYDX_TESTNET=true

# ============================================
# Jupiter Perps (Solana) - ✅ 프로덕션 준비
# ============================================
JUPITER_WALLET_ADDRESS=your_solana_address
JUPITER_PRIVATE_KEY=base58_private_key   # 거래용 선택사항

# ============================================
# Drift Protocol (Solana) - ✅ 프로덕션 준비
# ============================================
DRIFT_WALLET_ADDRESS=your_solana_address
DRIFT_PRIVATE_KEY=base58_private_key     # 거래용 선택사항

# ============================================
# GMX v2 (Arbitrum/Avalanche) - 🟡 읽기 전용
# ============================================
GMX_CHAIN=arbitrum                        # 또는 'avalanche'
GMX_WALLET_ADDRESS=0x...                  # 포지션 데이터용 선택사항

# ============================================
# Aster (BNB Chain) - ✅ 프로덕션 준비
# ============================================
ASTER_API_KEY=your_api_key
ASTER_API_SECRET=your_api_secret          # HMAC-SHA256

# ============================================
# Pacifica (Solana) - ✅ 프로덕션 준비
# ============================================
PACIFICA_API_KEY=your_api_key
PACIFICA_API_SECRET=base64_key            # ED25519 개인키 (base64)

# ============================================
# Ostium (Arbitrum RWA) - ✅ 프로덕션 준비
# ============================================
OSTIUM_PRIVATE_KEY=0x...                  # EVM 개인키

# ============================================
# Reya (Reya Network L2) - ✅ 프로덕션 준비
# ============================================
REYA_PRIVATE_KEY=0x...                    # EVM 개인키

# ============================================
# Ethereal (EIP-712) - ✅ 프로덕션 준비
# ============================================
ETHEREAL_PRIVATE_KEY=0x...                # EVM 개인키

# ============================================
# Avantis (Base 체인) - 🟡 부분 지원
# ============================================
AVANTIS_PRIVATE_KEY=0x...                 # EVM 개인키
```

---

## 📖 고급 예제

### OHLCV (캔들스틱) 데이터

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = await createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// 지난 24시간 동안의 1시간 캔들 조회
const candles = await exchange.fetchOHLCV('BTC/USDT:USDT', '1h', {
  limit: 24
});

for (const [timestamp, open, high, low, close, volume] of candles) {
  console.log(`${new Date(timestamp).toISOString()}: O=${open} H=${high} L=${low} C=${close} V=${volume}`);
}

// 지원되는 타임프레임: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
// 현재 사용 가능한 거래소: Hyperliquid, GRVT, dYdX, GMX, Aster
```

### WebSocket 스트리밍

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = await createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();

// 오더북 업데이트 스트리밍
for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  console.log('최고 매수가:', orderBook.bids[0]);
  console.log('최고 매도가:', orderBook.asks[0]);
}

// 포지션 업데이트 스트리밍 (인증 필요)
for await (const positions of exchange.watchPositions()) {
  console.log('포지션 업데이트:', positions);
}

// 내 거래 스트리밍 (인증 필요)
for await (const trade of exchange.watchMyTrades('BTC/USDT:USDT')) {
  console.log('내 거래:', trade.side, trade.amount, '@', trade.price);
}
```

### 다중 거래소 예제

```typescript
import { createExchange } from 'pd-aio-sdk';

// 여러 거래소 초기화 (Public API - 인증 불필요)
const hyperliquid = await createExchange('hyperliquid', { testnet: true });
const edgex = await createExchange('edgex', {});
const nado = await createExchange('nado', { testnet: true });

await Promise.all([
  hyperliquid.initialize(),
  edgex.initialize(),
  nado.initialize()
]);

// 모든 거래소에서 마켓 조회
const [hlMarkets, edgexMarkets, nadoMarkets] = await Promise.all([
  hyperliquid.fetchMarkets(),
  edgex.fetchMarkets(),
  nado.fetchMarkets()
]);

console.log(`Hyperliquid: ${hlMarkets.length}개 마켓`);
console.log(`EdgeX: ${edgexMarkets.length}개 마켓`);
console.log(`Nado: ${nadoMarkets.length}개 마켓`);
```

### 에러 처리

```typescript
import { createExchange, PerpDEXError } from 'pd-aio-sdk';

const exchange = await createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

try {
  // 자격증명 없으면 에러 발생
  await exchange.fetchBalance();
} catch (error) {
  if (error instanceof PerpDEXError) {
    console.log('에러 코드:', error.code);      // 'MISSING_CREDENTIALS'
    console.log('거래소:', error.exchange);     // 'hyperliquid'
    console.log('메시지:', error.message);
  }
}
```

---

## 💰 빌더 코드 (수익 공유)

빌더 코드는 SDK 운영자를 위한 수수료 귀속 기능으로, 애플리케이션을 통해 발생한 거래 수수료의 일부를 받을 수 있습니다.

### 지원 거래소

| 거래소 | 빌더 코드 필드 | 비고 |
|--------|---------------|------|
| **Hyperliquid** | `builderAddress` | EVM 주소, 온체인 수수료 분배 |
| **GRVT** | `builderAddress` | API 수준 귀속 |
| **Pacifica** | `builderAddress` | Solana 기반 귀속 |
| **Aster** | `builderAddress` | BNB Chain 레퍼럴 시스템 |
| **Ostium** | `builderAddress` | Arbitrum RWA 수수료 공유 |
| **GMX** | `builderAddress` | Arbitrum/Avalanche |
| **Drift** | `builderAddress` | Solana 레퍼럴 프로그램 |

### 설정

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = await createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  builderAddress: '0xYourAddress',
  builderCodeEnabled: true, // 기본값 — 생략 가능
  testnet: true,
});
```

### 켜기/끄기 토글

빌더 코드는 `builderAddress`가 제공되면 **기본적으로 활성화**됩니다. 언제든지 비활성화할 수 있습니다:

```typescript
// 빌더 코드 비활성화 (수수료가 거래소로 직접 전달)
const exchange = await createExchange('hyperliquid', {
  builderAddress: '0xYourAddress',
  builderCodeEnabled: false, // 명시적으로 비활성화
});
```

---

## 📦 서브패스 임포트 (트리 쉐이킹)

필요한 어댑터만 임포트하여 번들 크기를 줄일 수 있습니다:

```typescript
// 필요한 것만 임포트 (트리 쉐이킹 가능)
import { HyperliquidAdapter } from 'pd-aio-sdk/hyperliquid';
import { DriftAdapter } from 'pd-aio-sdk/drift';
import { AsterAdapter } from 'pd-aio-sdk/aster';
import { ReyaAdapter } from 'pd-aio-sdk/reya';
import { EtherealAdapter } from 'pd-aio-sdk/ethereal';
import { AvantisAdapter } from 'pd-aio-sdk/avantis';

// 또는 전체 SDK 사용
import { createExchange } from 'pd-aio-sdk';
```

---

## 🧪 테스트

### 테스트 실행

```bash
# 모든 테스트
npm test

# 커버리지 포함
npm run test:coverage

# 감시 모드
npm run test:watch

# 특정 거래소
npm test -- hyperliquid
```

### 테스트 결과

```
✅ 6908개 테스트 통과 (100% 성공률)
✅ 194개 테스트 스위트
✅ 커버리지: 85% 구문, 89% 함수
✅ ESLint: 0 에러, TypeScript strict: 0 에러
✅ 라이브 API: 18/19 거래소 실제 API 검증 (2026년 3월 기준)
```

### API 라이브 검증 결과 (2026년 3월 기준)

| 거래소 | Markets | Ticker | OrderBook | Trades | FundingRate | OHLCV | 상태 |
|--------|---------|--------|-----------|--------|-------------|-------|------|
| **Aster** | ✅ 304 | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6 완벽 |
| **Hyperliquid** | ✅ 229 | ✅ | ✅ | WS전용 | ✅ | ✅ | 5/6 |
| **Lighter** | ✅ 156 | ✅ | ✅ | ✅ | ✅ | - | 5/6 |
| **GRVT** | ✅ 95 | ✅ | ✅ | ✅ | ✅ | - | 5/6 |
| **Paradex** | ✅ 95 | ✅ | ✅ | ✅ | ✅ | - | 5/6 |
| **dYdX** | ✅ 293 | ✅ | ✅ | ✅ | ✅ | - | 5/6 |
| **Reya** | ✅ 69 | ✅ | - | ✅ | ✅ | - | 4/6 |
| **Ethereal** | ✅ 15 | ✅ | ✅ | ✅ | ✅ | - | 5/6 |
| **EdgeX** | ✅ 292 | ✅ | ✅ | - | ✅ | - | 4/6 |
| **Backpack** | ✅ 159 | ✅ | ✅ | ✅ | - | - | 4/6 |
| **Variational** | ✅ 470 | ✅ | ✅ | - | ✅ | - | 4/6 |
| **Drift** | ✅ 41 | ✅ | ✅ | - | ✅ | - | 4/6 |
| **Extended** | ✅ 114 | ✅ | ✅ | - | ✅ | - | 4/6 |
| **Nado** | ✅ 44 | ✅ | ✅ | - | - | - | 3/6 |
| **GMX** | ✅ 129 | ✅ | - | - | ✅ | - | 3/6 |
| **Pacifica** | ✅ 59 | ✅ | ✅ | ✅ | ✅ | - | 5/6 |
| **Ostium** | ✅ 11 | ✅ | - | - | - | - | 2/6 |
| **Jupiter** | ✅ 3 | ✅ | ✅ | - | ✅ | - | 4/6 |
| **Avantis** | 🟡 | - | - | - | - | - | 부분 지원 |

---

## 🏗️ 아키텍처

### Pattern A: Full-Featured 아키텍처

**19개 모든 거래소 어댑터**가 **Pattern A** (Full-Featured) 아키텍처를 따릅니다:

```
src/adapters/{exchange}/
├── {Exchange}Adapter.ts       # 메인 어댑터 구현
├── {Exchange}Normalizer.ts    # 데이터 변환
├── auth.ts                    # 인증 (복잡한 경우)
├── utils.ts                   # 헬퍼 함수
├── constants.ts               # 설정
├── types.ts                   # TypeScript 타입
└── index.ts                   # Public API
```

### 핵심 컴포넌트

- **Adapters** - 거래소별 구현체
- **Normalizers** - 데이터 변환 (CCXT 형식 ↔ 거래소 형식)
- **Core** - 속도 제한, 재시도 로직, 로깅
- **WebSocket** - 연결 관리, 자동 재연결
- **Types** - 통합 데이터 구조, 에러 계층

**자세히 알아보기**: 상세한 문서는 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참조하세요

---

## 📦 빌드 & 개발

```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 감시 모드
npm run dev

# 린트
npm run lint

# 타입 체크
npm run typecheck
```

---

## 🤝 기여하기

기여를 환영합니다! 자세한 내용은 [Contributing Guide](./CONTRIBUTING.md)를 참조하세요.

---

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

---

## 🔗 링크

### 문서
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API 레퍼런스**: [API.md](./API.md)
- **어댑터 가이드**: [ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md)
- **기여하기**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **영문 문서**: [English Documentation](./README.md)

### 리소스
- **거래소 가이드**: [docs/guides/](./docs/guides/)
- **예제**: [examples/](./examples/)

---

## 🙏 감사의 말

- [CCXT](https://github.com/ccxt/ccxt) 통합 API 디자인에서 영감을 받음
- [ethers.js](https://github.com/ethers-io/ethers.js), [starknet.js](https://github.com/starknet-io/starknet.js)로 구축

---

<div align="center">

**DeFi 커뮤니티를 위해 ❤️로 만들었습니다**

[⭐ GitHub에서 Star 하기](https://github.com/0xarkstar/PD-AIO-SDK) | [📦 npm 패키지](https://www.npmjs.com/package/pd-aio-sdk)

</div>
