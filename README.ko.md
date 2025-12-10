# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - 탈중앙화 영구선물 거래소 통합 TypeScript SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-395%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue)](https://www.npmjs.com/package/pd-aio-sdk)

한국어 | **[English](./README.md)**

---

## 🎯 PD AIO SDK란?

**PD AIO SDK** (Perp DEX All-In-One SDK)는 **7개의 탈중앙화 영구선물 거래소**를 단일 인터페이스로 거래할 수 있게 해주는 프로덕션 레벨의 통합 TypeScript SDK입니다. 더 이상 각 거래소마다 다른 API를 배울 필요 없이, 한 번 작성하면 어디서든 거래할 수 있습니다.

### 왜 "All-In-One"인가?

- **하나의 인터페이스** → 7개 거래소 (Hyperliquid, GRVT, Paradex, EdgeX, Backpack, Lighter, Nado)
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
- **Hyperliquid** - 프로덕션 + 테스트넷, 초당 20만 주문, HIP-3 생태계
- **GRVT** - 프로덕션 + 테스트넷, CEX/DEX 하이브리드, 포트폴리오 마진
- **Paradex** - 프로덕션 + 테스트넷 (Sepolia), StarkNet L2
- **EdgeX** - 프로덕션만 (V1), 10ms 미만 매칭, $130B+ 거래량
- **Backpack** - 프로덕션만, 솔라나 기반, 다양한 마켓 지원
- **Lighter** - 베타 + 테스트넷, ZK-SNARK 증명, 오더북 DEX
- **Nado** - 프로덕션 + 테스트넷, Kraken의 Ink L2, 5-15ms 지연시간

### 🔐 프로덕션급 보안
- **EIP-712 서명** (Hyperliquid, GRVT, Nado)
- **StarkNet ECDSA** (Paradex, EdgeX)
- **ED25519** (Backpack)
- **API Key 인증** (Lighter)
- **보안 자격증명 관리** 및 검증 기능

### ⚡ 엔터프라이즈 기능
- **WebSocket 스트리밍** - 실시간 오더북, 포지션, 거래 데이터
- **자동 재연결** - 지수 백오프 및 구독 복구
- **속도 제한** - 거래소별 제한 자동 준수
- **스마트 캐싱** - 설정 가능한 TTL을 통한 시장 데이터 캐싱
- **재시도 로직** - 지수 백오프를 통한 자동 재시도
- **타입 안전성** - 런타임 검증(Zod) + TypeScript strict mode

### 📊 개발자 경험
- **Pattern A 아키텍처** - 7개 어댑터 모두 표준화된 구조 따름
- **409개 테스트** - 100% 통과율, 프로덕션 준비 완료
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
import { createExchange, createSymbol } from 'pd-aio-sdk';
import { Wallet } from 'ethers';

// 어댑터 초기화
const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true
});

await exchange.initialize();

// 심볼 생성 (거래소별 자동 설정)
const symbol = createSymbol('hyperliquid', 'BTC'); // "BTC/USDT:USDT" 반환

// 시장 데이터 조회
const markets = await exchange.fetchMarkets();
const orderBook = await exchange.fetchOrderBook(symbol);
const ticker = await exchange.fetchTicker(symbol);

// 주문 생성
const order = await exchange.createOrder({
  symbol,
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000
});

// 포지션 확인
const positions = await exchange.fetchPositions();
const balances = await exchange.fetchBalance();

// 주문 취소
await exchange.cancelOrder(order.id, symbol);

// 정리
await exchange.disconnect();
```

---

## 📚 지원 거래소

| 거래소 | 상태 | 테스트넷 | 인증 방식 | 특별 기능 |
|----------|--------|---------|-------------|------------------|
| **Hyperliquid** | ✅ 프로덕션 | ✅ 공개 | EIP-712 | 초당 20만 주문, HIP-3 생태계, 파우셋 제공 |
| **GRVT** | ✅ 프로덕션 | ✅ 공개 | EIP-712 + Session | CEX/DEX 하이브리드, 포트폴리오 마진 |
| **Paradex** | ✅ 프로덕션 | ✅ 공개 (Sepolia) | StarkNet + JWT | StarkNet L2, 초저지연 |
| **EdgeX** | ✅ 프로덕션 (V1) | ❌ 메인넷만* | StarkEx + Pedersen | 10ms 미만 매칭, $130B+ 거래량 |
| **Backpack** | ✅ 프로덕션 | ❌ 메인넷만 | ED25519 | 솔라나 기반, 다양한 마켓 타입 |
| **Lighter** | ⚠️ 베타 | ✅ 공개 (ETH 테스트넷) | API Key | ZK-SNARK 증명, 오더북 DEX |

> *EdgeX V2 테스트넷은 2025년 Q3에 출시 예정

### 🎁 보너스: HIP-3 생태계 (Hyperliquid 경유)

모든 HIP-3 DEX는 Hyperliquid의 인프라를 공유 - **하나의 어댑터로 7개 이상의 플랫폼 지원**:

- **trade.xyz** - 미국 주식 영구선물 (NVDA, TSLA, AAPL)
- **Ventuals** - Pre-IPO 영구선물 (SpaceX, OpenAI, Anthropic)
- **Based** - 거래 슈퍼앱
- **Volmex** - 변동성 지수
- **Nunchi** - Yield/APY 영구선물
- **Aura** - 미국 국채 영구선물

---

## 🔧 설정

### 1. 환경 설정

```bash
# 예제 파일 복사
cp .env.example .env
```

### 2. 자격증명 추가

```bash
# Hyperliquid (EIP-712)
HYPERLIQUID_PRIVATE_KEY=0x1234...
HYPERLIQUID_TESTNET=true

# GRVT (EIP-712 + Session)
GRVT_PRIVATE_KEY=0x1234...
GRVT_API_KEY=your_api_key
GRVT_TESTNET=true

# Paradex (StarkNet)
PARADEX_PRIVATE_KEY=0x1234...
PARADEX_ACCOUNT_ADDRESS=0x5678...
PARADEX_TESTNET=true

# Backpack (ED25519)
BACKPACK_PRIVATE_KEY=base58_encoded_key
BACKPACK_TESTNET=true

# Lighter (API Key)
LIGHTER_API_KEY=your_api_key
LIGHTER_API_SECRET=your_api_secret
LIGHTER_ACCOUNT_ID=your_account_id

# EdgeX (StarkEx)
EDGEX_API_KEY=your_api_key
EDGEX_TESTNET=true
```

### 3. 설정 검증 (선택사항)

```typescript
import { validateConfig } from 'pd-aio-sdk';

try {
  validateConfig('hyperliquid');
  console.log('✅ 설정이 유효합니다');
} catch (error) {
  console.error('❌ 설정 오류:', error.message);
}
```

---

## 📖 고급 예제

### WebSocket 스트리밍

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
  wallet: new Wallet(process.env.PRIVATE_KEY),
  testnet: true
});

await exchange.initialize();

// 오더북 업데이트 스트리밍
for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  console.log('최고 매수가:', orderBook.bids[0]);
  console.log('최고 매도가:', orderBook.asks[0]);
}

// 포지션 업데이트 스트리밍
for await (const positions of exchange.watchPositions()) {
  console.log('포지션 업데이트:', positions);
}

// 거래 스트리밍
for await (const trade of exchange.watchTrades('BTC/USDT:USDT')) {
  console.log('새로운 거래:', trade);
}
```

### 재시도를 통한 에러 처리

```typescript
import { createExchange, withRetry } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });

// 일시적 실패 시 자동 재시도
const markets = await withRetry(
  () => exchange.fetchMarkets(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000
  }
);
```

### 심볼 헬퍼

```typescript
import { createSymbol } from 'pd-aio-sdk';

// 거래소별 심볼 생성
const btcHyper = createSymbol('hyperliquid', 'BTC');  // "BTC/USDT:USDT"
const ethGrvt = createSymbol('grvt', 'ETH');          // "ETH/USDT:USDT"
const solBack = createSymbol('backpack', 'SOL');      // "SOL/USDT:USDT"

// 사용자 정의 견적 통화
const btcUsdc = createSymbol('paradex', 'BTC', 'USDC'); // "BTC/USDC:USDC"
```

### Python 스타일 별칭

```typescript
// TypeScript 스타일
await exchange.fetchOrderBook('BTC/USDT:USDT');
await exchange.createOrder({ ... });

// Python 스타일 (snake_case)
await exchange.fetch_order_book('BTC/USDT:USDT');
await exchange.create_order({ ... });
```

### 헬스 모니터링

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// 헬스 체크
const health = await exchange.getHealth();
console.log('상태:', health.status);        // 'healthy' | 'degraded' | 'unhealthy'
console.log('가동 시간:', health.uptimeSeconds);
console.log('캐시 적중률:', health.cache.hitRate);
```

---

## 🏗️ 아키텍처

### Pattern A: Full-Featured 아키텍처

**7개 모든 거래소 어댑터**가 **Pattern A** (Full-Featured) 아키텍처를 따릅니다 - 일관성, 테스트 용이성, 유지보수성을 제공하는 표준화된 구조:

- ✅ **전용 Normalizer 클래스** - 모든 데이터 변환 처리
- ✅ **관심사 분리** - 어댑터 로직과 정규화 분리
- ✅ **향상된 테스트 가능성** - 격리된 단위 테스트
- ✅ **일관된 파일 구조** - 모든 어댑터에서 동일
- ✅ **더 나은 유지보수성** - 쉬운 온보딩

#### 어댑터 구조

각 어댑터는 이 표준화된 구조를 따릅니다:

```
src/adapters/{exchange}/
├── {Exchange}Adapter.ts       # 메인 어댑터 구현
├── {Exchange}Normalizer.ts    # 데이터 변환 (7개 어댑터 모두)
├── {Exchange}Auth.ts          # 인증 (복잡한 인증만)
├── utils.ts                   # 헬퍼 함수
├── constants.ts               # 설정
├── types.ts                   # TypeScript 타입
└── index.ts                   # Public API
```

**예제**: Normalizer 클래스 직접 사용

```typescript
import { HyperliquidNormalizer } from 'pd-aio-sdk/adapters/hyperliquid';

const normalizer = new HyperliquidNormalizer();
const unifiedSymbol = normalizer.normalizeSymbol('BTC-PERP');
// 반환: 'BTC/USDT:USDT'
```

### 헥사고날 아키텍처

```
┌─────────────────────────────────────────────┐
│         애플리케이션 계층                      │
│  (트레이딩 봇 / 애플리케이션)                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         PD AIO SDK - 통합 인터페이스         │
│  ┌──────────────────────────────────────┐   │
│  │  공통 타입 & 인터페이스               │   │
│  │  - IExchangeAdapter                  │   │
│  │  - 통합 Order/Position/Balance       │   │
│  └──────────────────────────────────────┘   │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│Hyperliquid │GRVT    │Paradex  │  ...
│Adapter   │Adapter  │Adapter  │
└─────────┘  └─────────┘  └─────────┘
    │            │            │
    ▼            ▼            ▼
┌─────────────────────────────────────────────┐
│         거래소 API                          │
│  (Hyperliquid, GRVT, Paradex, 등)          │
└─────────────────────────────────────────────┘
```

### 핵심 컴포넌트

- **Adapters** - 거래소별 구현체 (Pattern A)
- **Normalizers** - 데이터 변환 클래스 (7개 어댑터 모두)
- **Core** - 속도 제한, 재시도 로직, 로깅, 헬스 체크
- **WebSocket** - 연결 관리, 자동 재연결
- **Utils** - 심볼 헬퍼, 검증, 에러 매핑
- **Types** - 통합 데이터 구조, 에러 계층

**자세히 알아보기**: 상세한 아키텍처 문서는 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참조하세요

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
✅ 395개 테스트 통과 (100% 성공률)
✅ 22개 테스트 스위트
✅ 통합 테스트: 17/17
✅ 단위 테스트: 378/378
```

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

# 포맷
npm run format

# 타입 체크
npm run typecheck
```

---

## 🤝 기여하기

기여를 환영합니다! 자세한 내용은 [Contributing Guide](./CONTRIBUTING.md)를 참조하세요.

### 개발 워크플로우

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

---

## 🔗 링크

### 문서
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md) - 상세한 아키텍처 가이드
- **API 레퍼런스**: [API.md](./API.md) - 완전한 API 문서
- **어댑터 가이드**: [ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md) - 새 거래소 추가 가이드
- **기여하기**: [CONTRIBUTING.md](./CONTRIBUTING.md) - 개발 가이드라인
- **변경 이력**: [CHANGELOG.md](./CHANGELOG.md) - 버전 히스토리
- **영문 문서**: [English Documentation](./README.md)

### 리소스
- **거래소 가이드**: [docs/guides/](./docs/guides/) - 거래소별 문서
- **예제**: [examples/](./examples/) - 즉시 사용 가능한 코드 예제
- **API 감사**: [API 구현 감사](./API_IMPLEMENTATION_AUDIT.md)

---

## 🙏 감사의 말

- [CCXT](https://github.com/ccxt/ccxt) 통합 API 디자인에서 영감을 받음
- [ethers.js](https://github.com/ethers-io/ethers.js), [starknet.js](https://github.com/starknet-io/starknet.js)로 구축
- 포괄적인 API 문서를 제공해주신 모든 거래소 팀에 감사드립니다

---

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/0xarkstar/PD-AIO-SDK/issues)
- **토론**: [GitHub Discussions](https://github.com/0xarkstar/PD-AIO-SDK/discussions)

---

<div align="center">

**DeFi 커뮤니티를 위해 ❤️로 만들었습니다**

[⭐ GitHub에서 Star 하기](https://github.com/0xarkstar/PD-AIO-SDK) | [📦 npm 패키지](https://www.npmjs.com/package/pd-aio-sdk)

</div>
