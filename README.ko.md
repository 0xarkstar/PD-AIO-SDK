# Perp DEX SDK

> 탈중앙화 무기한 선물 거래소를 위한 통합 TypeScript SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)

[English](./README.md) | **한국어**

## 개요

탈중앙화 무기한 선물 거래소에서 트레이딩하기 위한 프로덕션 수준의 SDK입니다. Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack 및 전체 HIP-3 생태계를 포함하여 **7개 이상의 플랫폼**을 지원합니다.

### 주요 기능

- 🔌 **통합 인터페이스**: CCXT 패턴을 따르는 여러 DEX를 위한 단일 API
- 🔐 **멀티체인 인증**: EIP-712, StarkNet ECDSA, ED25519 지원
- 🌊 **WebSocket 스트리밍**: 실시간 오더북, 포지션, 거래 내역
- ⚡ **완전한 비동기**: TypeScript strict 모드로 async/await 기반 구축
- 🛡️ **타입 안전성**: Zod 런타임 검증 + TypeScript 컴파일 타임 검사
- 🔄 **자동 재연결**: 구독 복구를 위한 지수 백오프
- 📊 **기능 감지**: 거래소별 런타임 기능 확인
- 🧪 **367개 유닛 테스트**: 포괄적인 테스트 커버리지 (>80%)
- 📝 **구조화된 로깅**: 민감 데이터 마스킹을 포함한 JSON 로그
- 🏥 **헬스 & 메트릭**: 내장 헬스 체크 및 성능 모니터링
- 💾 **스마트 캐싱**: 구성 가능한 TTL을 사용한 마켓 데이터 캐싱
- 🔁 **배치 작업**: 순차 실행으로 자동 폴백
- 🐍 **Python 스타일 별칭**: Python 개발자를 위한 snake_case 메서드명

## 지원 거래소

| 거래소 | 상태 | 테스트넷 | 인증 방식 | 특징 |
|----------|--------|---------|----------------|----------|
| **Hyperliquid** | ✅ 프로덕션 | ✅ 지원 | EIP-712 | REST + WebSocket, 초당 20만 주문, HIP-3 생태계 |
| **GRVT** | ✅ 프로덕션 | ✅ 지원 | EIP-712 + 세션 | 포트폴리오 마진, 하이브리드 CEX/DEX |
| **Paradex** | ✅ 프로덕션 | ✅ 지원 | StarkNet + JWT | StarkNet L2, 저지연 |
| **EdgeX** | ✅ 프로덕션 | ✅ 지원 | StarkEx + Pedersen | 10ms 미만 매칭, 가스비 없음 |
| **Backpack** | ✅ 프로덕션 | ✅ 지원 | ED25519 | Solana 기반 무기한 선물 |
| **Lighter** | ✅ 프로덕션 | ❌ 미지원 | API Key | ZK-SNARK 증명, 오더북 DEX |

### HIP-3 생태계 (Hyperliquid 어댑터를 통해 지원)
- **trade.xyz**: 미국 주식 무기한 선물 (NVDA, TSLA, AAPL)
- **Ventuals**: Pre-IPO 무기한 선물 (SpaceX, OpenAI, Anthropic)
- **Based**: 트레이딩 슈퍼 앱
- **Volmex**: 변동성 지수
- **Nunchi**: 수익률/APY 무기한 선물
- **Aura**: 미국 국채 무기한 선물

## 설치

```bash
npm install perp-dex-sdk
# 또는
yarn add perp-dex-sdk
# 또는
pnpm add perp-dex-sdk
```

## 빠른 시작

### 기본 트레이딩 예제

```typescript
import { createExchange, createSymbol } from 'perp-dex-sdk';
import { Wallet } from 'ethers';

// 거래소 어댑터 초기화
const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true
});

await exchange.initialize();

// 마켓 조회
const markets = await exchange.fetchMarkets();
console.log('사용 가능한 마켓:', markets.map(m => m.symbol));

// 헬퍼로 심볼 생성 (수동 형식보다 쉬움)
const btcSymbol = createSymbol('hyperliquid', 'BTC');  // "BTC/USDT:USDT"
const ethSymbol = createSymbol('hyperliquid', 'ETH', 'USDC');  // "ETH/USDC:USDC"

// 지정가 주문
const order = await exchange.createOrder({
  symbol: btcSymbol,
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000,
  postOnly: true,
  reduceOnly: false
});

console.log('주문 완료:', order.id);

// 포지션 확인
const positions = await exchange.fetchPositions();
console.log('오픈 포지션:', positions);

// 사용 후 정리
await exchange.disconnect();
```

### WebSocket 스트리밍 예제

```typescript
import { createExchange, createSymbol } from 'perp-dex-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

const symbol = createSymbol('hyperliquid', 'BTC');

// 오더북 업데이트 스트리밍
for await (const orderbook of exchange.watchOrderBook(symbol)) {
  console.log('최고 매수가:', orderbook.bids[0]);
  console.log('최고 매도가:', orderbook.asks[0]);
}

// 포지션 업데이트 스트리밍
for await (const positions of exchange.watchPositions()) {
  console.log('포지션 변경:', positions);
}
```

### 자동 재시도를 사용한 안정적인 트레이딩

```typescript
import { createExchange, withRetry, createSymbol } from 'perp-dex-sdk';
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', { wallet, testnet: true });

await exchange.initialize();

// 일시적 실패 시 자동 재시도 (rate limit, 네트워크 오류 등)
const markets = await withRetry(
  () => exchange.fetchMarkets(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error, delay) => {
      console.log(`재시도 ${attempt}회 (${delay}ms 후): ${error.message}`);
    }
  }
);

// 자동 재시도로 주문하기
const symbol = createSymbol('hyperliquid', 'BTC');
const order = await withRetry(() =>
  exchange.createOrder({
    symbol,
    type: 'limit',
    side: 'buy',
    amount: 0.1,
    price: 50000,
  })
);

console.log('주문 성공:', order.id);
```

### 고급 기능

#### 구조화된 로깅

```typescript
import { createExchange } from 'perp-dex-sdk';

// 디버그 로깅 활성화
const exchange = createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  debug: true  // DEBUG 레벨 로그 활성화
});

await exchange.initialize();

// 로그는 어댑터별 컨텍스트가 포함된 구조화된 JSON입니다:
// {"timestamp":"2025-12-01T10:00:00.000Z","level":"info","context":"Hyperliquid","message":"Adapter initialized"}

// 민감한 데이터는 자동으로 마스킹됩니다:
// {"apiKey":"***2345","apiSecret":"***7890"}
```

#### 헬스 체크 & 메트릭

```typescript
// 어댑터 헬스 체크
const health = await exchange.healthCheck();
console.log('전체 상태:', health.overall);  // 'healthy' | 'degraded' | 'unhealthy'
console.log('API 헬스:', health.components.api);
console.log('WebSocket 헬스:', health.components.websocket);

// 성능 메트릭 조회
const metrics = exchange.getMetrics();
console.log('총 요청 수:', metrics.totalRequests);
console.log('성공률:', metrics.successfulRequests / metrics.totalRequests);
console.log('평균 지연시간:', metrics.averageLatency, 'ms');
console.log('Rate limit 횟수:', metrics.rateLimitHits);

// 엔드포인트별 통계
metrics.endpointStats.forEach((stats, endpoint) => {
  console.log(`${endpoint}: ${stats.totalCalls}회 호출, 평균 ${stats.avgLatency}ms`);
});
```

#### 마켓 데이터 캐싱

```typescript
// 5분 캐시로 마켓 미리 로드
await exchange.preloadMarkets({ ttl: 300000 });

// 이후 호출은 캐시 사용 (훨씬 빠름)
const markets = await exchange.getPreloadedMarkets();
if (markets) {
  console.log('캐시된 마켓 사용:', markets.length);
} else {
  console.log('캐시 만료, 다시 가져오는 중...');
  const fresh = await exchange.fetchMarkets();
}

// 수동으로 캐시 삭제
exchange.clearCache();
```

#### 배치 작업

```typescript
// 여러 주문을 한번에 생성
const orders = await exchange.createBatchOrders([
  { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
  { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
  { symbol: 'SOL/USDT:USDT', side: 'sell', type: 'limit', amount: 10, price: 100 },
]);

// 네이티브 배치 API가 있으면 자동으로 사용,
// 없으면 순차 실행으로 폴백
console.log('생성된 주문:', orders.length);

// 여러 주문 취소
const canceled = await exchange.cancelBatchOrders(['order-1', 'order-2', 'order-3']);
```

#### Python 스타일 메서드명

```typescript
// Python 스타일을 선호한다면 snake_case 사용
const markets = await exchange.fetch_markets();      // fetchMarkets()와 동일
const ticker = await exchange.fetch_ticker(symbol);  // fetchTicker()와 동일
const order = await exchange.create_order(request);  // createOrder()와 동일

// 두 스타일 모두 동일하게 작동
await exchange.fetchMarkets();   // camelCase (JavaScript/TypeScript)
await exchange.fetch_markets();  // snake_case (Python)
```

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   사용자 애플리케이션                      │
├─────────────────────────────────────────────────────────┤
│                  통합 Perp DEX SDK                       │
│  ┌──────────┬──────────────┬────────────────────────┐   │
│  │ 공개     │ 비공개 API   │  WebSocket 스트리밍    │   │
│  │ 마켓     │  트레이딩    │  실시간 업데이트       │   │
│  │ 데이터   │  포지션      │  자동 재연결           │   │
│  └──────────┴──────────────┴────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│             정규화 & 에러 처리                            │
├─────────────────────────────────────────────────────────┤
│                  거래소 어댑터                            │
│  ┌──────────┬─────────┬────────┬─────────┬──────────┐   │
│  │Hyperliquid│ Lighter │ GRVT   │ Paradex │ EdgeX    │   │
│  └──────────┴─────────┴────────┴─────────┴──────────┘   │
├─────────────────────────────────────────────────────────┤
│                인프라 레이어                              │
│  인증 │ Rate Limiter │ WebSocket 관리자 │ 검증         │
└─────────────────────────────────────────────────────────┘
```

## 테스트 커버리지

```bash
Test Suites: 20 passed, 20 total
Tests:       367 passed, 367 total
Snapshots:   0 total
Time:        ~8s
Coverage:    >80% (branches, functions, lines, statements)
```

**테스트 분류:**
- Core Logger: 27개 테스트
- Logger Integration: 22개 테스트
- Batch Fallbacks: 16개 테스트
- Method Aliases: 23개 테스트
- Health System: 16개 테스트
- Metrics: 19개 테스트
- Market Cache: 13개 테스트
- Rate Limiter: 23개 테스트
- Validation: 18개 테스트
- Exchange Utils: 100개 이상 테스트
- 기타 등등...

## 문서

- [시작 가이드](./docs/guides/getting-started.md)
- [API 레퍼런스](./docs/api/)
- [거래소별 가이드](./docs/exchange-guides/)
- [WebSocket 스트리밍](./docs/guides/websocket.md)
- [에러 처리](./docs/guides/error-handling.md)
- [개발 문서](./docs/development/) - 단계별 완료 요약

## 개발

### 필수 요구사항

- Node.js >= 18.0.0
- TypeScript >= 5.6.0

### 설정

```bash
# 저장소 클론
git clone https://github.com/yourusername/perp-dex-sdk.git
cd perp-dex-sdk

# 의존성 설치
npm install

# 테스트 실행
npm test

# 빌드
npm run build

# 개발 모드 실행
npm run dev
```

### 테스트 실행

```bash
# 유닛 테스트
npm test

# 커버리지 포함
npm run test:coverage

# Watch 모드
npm run test:watch

# 통합 테스트 (테스트넷 접근 필요)
npm run test:integration

# E2E 테스트 (메인넷 접근 필요)
npm run test:e2e
```

### 코드 품질

```bash
# 타입 체크
npm run typecheck

# 린팅
npm run lint

# 린팅 문제 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format
```

## 기여하기

기여를 환영합니다! 자세한 내용은 [기여 가이드](./CONTRIBUTING.md)를 참조하세요.

### 개발 워크플로우

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항에 대한 테스트 작성
4. 기능 구현
5. 모든 테스트 통과 확인 (`npm test`)
6. 린터 실행 (`npm run lint`)
7. 변경 사항 커밋 (`git commit -m 'Add amazing feature'`)
8. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
9. Pull Request 생성

## 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 면책 조항

이 SDK는 교육 및 개발 목적입니다. **사용에 따른 위험은 본인이 부담합니다.** 무기한 선물 거래는 상당한 손실 위험을 포함합니다. 저자는 이 소프트웨어 사용으로 인해 발생하는 재정적 손실에 대해 책임지지 않습니다.

## 지원

- 📖 [문서](./docs/)
- 🐛 [이슈 트래커](https://github.com/yourusername/perp-dex-sdk/issues)
- 💬 [토론](https://github.com/yourusername/perp-dex-sdk/discussions)

## 감사의 말

[CCXT](https://github.com/ccxt/ccxt) 아키텍처 패턴에서 영감을 받아 제작되었습니다.

---

## 주요 차별점

### vs 다른 SDK

이 SDK는 다른 유사 프로젝트와 비교하여 다음과 같은 차별점이 있습니다:

✅ **엔터프라이즈급 아키텍처**
- Hexagonal Architecture (Clean Architecture)
- SOLID 원칙 준수
- Design Patterns 적용

✅ **완벽한 타입 안전성**
- TypeScript strict 모드
- Zod 런타임 검증
- 100% 타입 커버리지

✅ **프로덕션 준비 완료**
- 367개 유닛 테스트
- >80% 코드 커버리지
- 구조화된 로깅 (민감 데이터 자동 마스킹)
- 헬스 체크 & 성능 메트릭

✅ **개발자 경험**
- 완벽한 IDE 자동완성
- 명확한 에러 메시지
- 포괄적인 JSDoc 문서
- Python/JavaScript 양쪽 스타일 지원

✅ **고급 기능**
- WebSocket 실시간 스트리밍
- 자동 재연결 & 재구독
- 배치 작업 자동 폴백
- 거래소별 Rate Limiting
- TTL 기반 스마트 캐싱

이 SDK는 단순한 래퍼가 아닌, 프로덕션 환경에서 사용 가능한 엔터프라이즈급 솔루션입니다.
