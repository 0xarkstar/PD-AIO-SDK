# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - 탈중앙화 영구선물 거래소 통합 TypeScript SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-2400%2B%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![npm version](https://img.shields.io/badge/npm-v0.2.0-blue)](https://www.npmjs.com/package/pd-aio-sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

한국어 | **[English](./README.md)**

---

## 🎯 PD AIO SDK란?

**PD AIO SDK** (Perp DEX All-In-One SDK)는 **13개의 탈중앙화 영구선물 거래소**를 단일 인터페이스로 거래할 수 있게 해주는 프로덕션 레벨의 통합 TypeScript SDK입니다. 더 이상 각 거래소마다 다른 API를 배울 필요 없이, 한 번 작성하면 어디서든 거래할 수 있습니다.

### 왜 "All-In-One"인가?

- **하나의 인터페이스** → 13개 거래소 (Hyperliquid, GRVT, Paradex, EdgeX, Backpack, Lighter, Nado, Extended, Variational, dYdX, Jupiter, Drift, GMX)
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

| 거래소 | 상태 | Perp | Spot | Public API | Private API |
|--------|------|------|------|------------|-------------|
| **EdgeX** | ✅ 프로덕션 준비 | 292 | - | ✅ 전체 | ✅ 전체 |
| **Hyperliquid** | ✅ 프로덕션 준비 | 228 | - | ✅ 전체 | ✅ 전체 |
| **dYdX v4** | ✅ 프로덕션 준비 | 220+ | - | ✅ 전체 | ✅ 전체 |
| **Lighter** | ✅ 프로덕션 준비 | 132 | - | ✅ 전체 | ✅ 전체 (Native FFI) |
| **Paradex** | 🟡 제한적 | 108 | - | ✅ Markets만 | ⚠️ JWT 필요 |
| **GRVT** | ✅ 프로덕션 준비 | 80 | - | ✅ 전체 | ✅ 전체 |
| **Backpack** | ✅ 프로덕션 준비 | 75 | 79 | ✅ 전체 | ✅ 전체 |
| **Drift** | ✅ 프로덕션 준비 | 30+ | - | ✅ 전체 | ✅ 전체 |
| **Nado** | ✅ 프로덕션 준비 | 23 | 3 | ✅ 전체 | ✅ 전체 |
| **GMX v2** | 🟡 읽기 전용 | 11 | - | ✅ 전체 | ❌ 온체인¹ |
| **Jupiter** | ✅ 프로덕션 준비 | 3 | - | ✅ 전체 | ✅ 전체 |
| **Extended** | 🟡 메인넷만 | 94 | - | ✅ 작동 | ✅ 전체 |
| **Variational** | 🔴 Alpha (RFQ) | - | - | ❌ | ❌ |

> ¹ GMX 거래는 ExchangeRouter 컨트랙트를 통한 온체인 트랜잭션 필요

### 📊 API 완성도 매트릭스

#### 범례
- ✅ 완전 구현
- ⚠️ 부분 구현 (제한 있음)
- ❌ 미구현

#### Public API 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| fetchMarkets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌⁴ |
| fetchTrades | ✅ | ❌¹ | ✅ | ✅ | ⚠️² | ✅ | ⚠️³ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| fetchOHLCV | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| fetchFundingRate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| fetchFundingRateHistory | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

#### 거래 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| createOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌⁵ |
| cancelOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌⁵ |
| cancelAllOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌⁵ |
| createBatchOrders | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| cancelBatchOrders | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| editOrder | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### 계정 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| fetchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌⁶ |
| fetchBalance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌⁶ |
| fetchOrderHistory | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| fetchMyTrades | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| fetchUserFees | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fetchPortfolio | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| setLeverage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌⁷ |
| setMarginMode | ❌ | ❌ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### WebSocket 메서드
| 메서드 | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| watchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchTrades | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchTicker | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchBalance | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchMyTrades | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchFundingRate | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

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

#### 참고사항
- ¹ EdgeX: WebSocket (`watchTrades`) 사용 - REST 엔드포인트 없음
- ² Hyperliquid: REST API에서 빈 배열 반환, 실시간 거래는 WebSocket 사용
- ³ Nado: 실시간 거래는 WebSocket 필요
- ⁴ GMX: AMM 기반, 전통적인 오더북 없음
- ⁵ GMX: 거래는 ExchangeRouter를 통한 온체인 트랜잭션 필요
- ⁶ GMX: 서브그래프 또는 RPC 통합 필요
- ⁷ dYdX/Jupiter/Drift/GMX: 레버리지는 주문 시 포지션별로 설정

### 🔐 프로덕션급 보안
- **EIP-712 서명** (Hyperliquid, GRVT, Nado)
- **StarkNet ECDSA + SHA3** (EdgeX)
- **StarkNet 서명** (Paradex)
- **ED25519** (Backpack)
- **API Key 인증** (Lighter, Extended)
- **Cosmos SDK 서명** (dYdX v4)
- **Solana 지갑 서명** (Jupiter, Drift)
- **보안 자격증명 관리** 및 검증 기능

### ⚡ 엔터프라이즈 기능
- **WebSocket 스트리밍** - 실시간 오더북, 포지션, 거래 데이터
- **자동 재연결** - 지수 백오프 및 구독 복구
- **속도 제한** - 거래소별 제한 자동 준수
- **스마트 캐싱** - 설정 가능한 TTL을 통한 시장 데이터 캐싱
- **재시도 로직** - 지수 백오프를 통한 자동 재시도
- **타입 안전성** - 런타임 검증(Zod) + TypeScript strict mode

### 📊 개발자 경험
- **Pattern A 아키텍처** - 13개 어댑터 모두 표준화된 구조 따름
- **2400개+ 테스트** - 100% 통과율, 프로덕션 준비 완료
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
const exchange = createExchange('hyperliquid', { testnet: true });
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
const exchange = createExchange('hyperliquid', {
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
const exchange = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY, // Public API는 선택사항
  testnet: true
});
```
- **마켓**: 228 perp
- **인증**: EIP-712 서명
- **특징**: 초당 20만 주문, HIP-3 생태계, 완전한 WebSocket 지원

#### EdgeX
```typescript
const exchange = createExchange('edgex', {
  starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY, // Public API는 선택사항
});
```
- **마켓**: 292 perp
- **인증**: SHA3-256 + ECDSA 서명
- **참고**: fetchTrades는 WebSocket만 지원 (REST 엔드포인트 없음)

#### Nado
```typescript
const exchange = createExchange('nado', {
  privateKey: process.env.NADO_PRIVATE_KEY, // Public API는 선택사항
  testnet: true
});
```
- **마켓**: 23 perp + 3 spot
- **인증**: Ink L2 (Kraken)에서 EIP-712 서명

#### GRVT
```typescript
const exchange = createExchange('grvt', {
  apiKey: process.env.GRVT_API_KEY, // Public API는 선택사항
  testnet: false
});
```
- **마켓**: 80 perp
- **인증**: API Key + EIP-712 서명
- **특징**: 서브밀리초 지연시간, CEX/DEX 하이브리드 아키텍처
- **레버리지**: 최대 100x
- **WebSocket**: 실시간 오더북, 거래, 포지션, 주문

#### Backpack
```typescript
const exchange = createExchange('backpack', {
  apiKey: process.env.BACKPACK_API_KEY, // Public API는 선택사항
  apiSecret: process.env.BACKPACK_API_SECRET,
  testnet: false
});
```
- **마켓**: 75 perp + 79 spot
- **인증**: ED25519 서명
- **특징**: 솔라나 기반, 완전한 REST API + WebSocket
- **레버리지**: 선물 최대 20x

#### Lighter
```typescript
const exchange = createExchange('lighter', {
  apiPrivateKey: process.env.LIGHTER_PRIVATE_KEY, // Public API는 선택사항
  testnet: true
});
```
- **마켓**: 132 perp
- **인증**: Native FFI 서명 (koffi + C 라이브러리)
- **특징**: 완전한 거래 지원, WebSocket 스트리밍
- **설정**: `lighter-sdk` Python 패키지에서 네이티브 라이브러리 필요

#### dYdX v4
```typescript
const exchange = createExchange('dydx', {
  mnemonic: process.env.DYDX_MNEMONIC,  // 24단어 시드 구문
  testnet: true
});
```
- **마켓**: 220+ perp
- **인증**: Cosmos SDK 서명
- **특징**: L1 블록체인, 완전한 거래 + WebSocket 지원

#### Jupiter Perps
```typescript
const exchange = createExchange('jupiter', {
  walletAddress: process.env.JUPITER_WALLET_ADDRESS,
  privateKey: process.env.JUPITER_PRIVATE_KEY,  // 거래용 선택사항
});
```
- **마켓**: 3 perp (SOL, ETH, BTC)
- **인증**: Solana 지갑 서명
- **특징**: 최대 100x 레버리지

#### Drift Protocol
```typescript
const exchange = createExchange('drift', {
  walletAddress: process.env.DRIFT_WALLET_ADDRESS,
  privateKey: process.env.DRIFT_PRIVATE_KEY,  // 거래용 선택사항
});
```
- **마켓**: 30+ perp
- **인증**: Solana 지갑 서명
- **특징**: DLOB (분산 지정가 주문서), 완전한 WebSocket 지원

#### GMX v2
```typescript
const exchange = createExchange('gmx', {
  chain: 'arbitrum',  // 또는 'avalanche'
  walletAddress: process.env.GMX_WALLET_ADDRESS,  // 포지션 데이터용 선택사항
});
```
- **마켓**: 11 perp (Arbitrum 8개, Avalanche 3개)
- **인증**: 읽기 전용 REST API
- **특징**: AMM 기반, 거래는 온체인 트랜잭션 필요
- **참고**: 거래 기능은 @gmx-io/sdk 사용 필요

### 🟡 부분 지원

#### Paradex
```typescript
const exchange = createExchange('paradex', { testnet: true });
```
- **마켓**: 108 perp
- **Public API**: ✅ fetchMarkets만 지원
- **Ticker/OrderBook**: JWT 인증 필요 (Paradex 특수 제한)
- **Private API**: StarkNet 서명 + JWT 필요

#### Extended
```typescript
const exchange = createExchange('extended', {
  apiKey: process.env.EXTENDED_API_KEY
});
```
- **상태**: 테스트넷 미운영, 메인넷만 작동
- **마켓**: 현재 0개 반환 (서비스 상태 불명확)

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
# Lighter - 🟡 Public API만
# ============================================
# 참고: Private API는 공식 lighter-sdk 필요
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
```

---

## 📖 고급 예제

### WebSocket 스트리밍

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
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

// 거래 스트리밍
for await (const trade of exchange.watchTrades('BTC/USDT:USDT')) {
  console.log('새로운 거래:', trade);
}
```

### 다중 거래소 예제

```typescript
import { createExchange } from 'pd-aio-sdk';

// 여러 거래소 초기화 (Public API - 인증 불필요)
const hyperliquid = createExchange('hyperliquid', { testnet: true });
const edgex = createExchange('edgex', {});
const nado = createExchange('nado', { testnet: true });

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

const exchange = createExchange('hyperliquid', { testnet: true });
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
✅ 2400개+ 테스트 통과 (100% 성공률)
✅ 90개+ 테스트 스위트
✅ 커버리지 임계값 적용 (60%+)
✅ 통합 테스트: 모두 통과
```

### API 검증 결과 (2026-02-01 기준)

| 거래소 | Perp | Spot | Ticker | OrderBook | FundingRate | 상태 |
|--------|------|------|--------|-----------|-------------|------|
| **EdgeX** | ✅ 292 | - | ✅ | ✅ | ✅ | 프로덕션 준비 |
| **Hyperliquid** | ✅ 228 | - | ✅ | ✅ | ✅ | 프로덕션 준비 |
| **Lighter** | ✅ 132 | - | ✅ | ✅ | - | 프로덕션 준비 |
| **Paradex** | ✅ 108 | - | ❌ JWT | ❌ JWT | - | 제한적 |
| **GRVT** | ✅ 80 | - | ✅ | ✅ | ✅ | 프로덕션 준비 |
| **Backpack** | ✅ 75 | ✅ 79 | ✅ | ✅ | ✅ | 프로덕션 준비 |
| **Nado** | ✅ 23 | ✅ 3 | ✅ | ✅ | ✅ | 프로덕션 준비 |
| **Extended** | ✅ 0 | - | - | - | - | 메인넷만 |

---

## 🏗️ 아키텍처

### Pattern A: Full-Featured 아키텍처

**13개 모든 거래소 어댑터**가 **Pattern A** (Full-Featured) 아키텍처를 따릅니다:

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
