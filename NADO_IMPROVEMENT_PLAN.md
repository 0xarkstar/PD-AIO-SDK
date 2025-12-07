# Nado Adapter 개선 계획서

## 📊 현황 분석

### 공식 SDK vs 커스텀 구현 비교

| 항목 | 공식 SDK (@nadohq) | 현재 커스텀 구현 | 결정 |
|------|-------------------|----------------|------|
| **상태** | Alpha (v0.1.0-alpha.41) | Stable | ✅ 커스텀 유지 |
| **의존성** | viem + bignumber.js | ethers | ✅ ethers 유지 |
| **API 구조** | `nadoClient.market.*` | `IExchangeAdapter` | ✅ 통합 인터페이스 유지 |
| **코드량** | ~500줄 (추정) | 983줄 (adapter) + 403줄 (utils) | ⚠️ 최적화 필요 |
| **유틸리티** | toFixedPoint, getOrderDigest 등 | 수동 구현 | 💡 참고 가능 |
| **문서화** | 공식 문서 우수 | JSDoc 우수 | ✅ 양호 |
| **테스트** | 알 수 없음 | < 20% 커버리지 | ⚠️ 개선 필요 |

### 결정: 하이브리드 접근 방식

**전체 SDK 통합 안 함 (이유):**
1. 알파 단계로 안정성 불확실
2. viem 마이그레이션 필요 (전체 프로젝트 영향)
3. API 구조가 다름 (통합 인터페이스 파괴)
4. 추가 의존성 5개 패키지

**커스텀 구현 개선 진행 (방향):**
1. 공식 SDK의 좋은 패턴 참고
2. 아키텍처 품질 향상
3. 누락 기능 추가
4. 테스트 커버리지 확보

---

## 🎯 개선 목표

### 1. 코드 품질 향상
- ✅ 명확한 책임 분리 (Auth, HTTP Client, Normalizer)
- ✅ 재사용 가능한 컴포넌트
- ✅ 테스트 가능한 구조

### 2. 기능 완성도
- ✅ 누락 기능 구현 (fetchTrades, watchBalance)
- ✅ WebSocket Stream Authentication
- ✅ 에러 처리 정교화
- ✅ 정밀도 손실 방지

### 3. 성능 최적화
- ✅ 불필요한 반복 제거
- ✅ 캐싱 전략
- ✅ 배치 처리

---

## 🏗️ 아키텍처 설계

### 현재 구조
```
NadoAdapter
├── query() - 직접 fetch 호출
├── execute() - 직접 fetch 호출
├── signNadoOrder() - utils에서 import
├── normalizeNadoOrder() - utils에서 import
└── ...
```

### 개선된 구조
```
NadoAdapter (Orchestrator)
├── NadoAuth (책임: 인증/서명)
│   ├── signOrder()
│   ├── signCancellation()
│   ├── signStreamAuth()
│   └── getNonce()
├── NadoAPIClient (책임: HTTP 통신)
│   ├── query()
│   ├── execute()
│   ├── retry logic
│   └── error mapping
├── NadoNormalizer (책임: 데이터 변환)
│   ├── normalizeProduct()
│   ├── normalizeOrder()
│   ├── normalizePosition()
│   └── precision-safe conversions
└── WebSocketManager (기존 재사용)
```

---

## 📋 구현 단계

### Phase 1: 핵심 인프라 리팩토링 (우선순위 1)

#### 1.1 NadoAuth 클래스 생성
**파일:** `src/adapters/nado/NadoAuth.ts`

**책임:**
- EIP-712 서명 로직 중앙화
- Nonce 관리
- 도메인 생성 추상화

**주요 메서드:**
```typescript
class NadoAuth {
  constructor(wallet: Wallet, chainId: number)

  // 서명 메서드
  async signOrder(order: NadoEIP712Order, productId: number): Promise<string>
  async signCancellation(cancel: NadoEIP712Cancellation, endpointAddress: string): Promise<string>
  async signStreamAuth(auth: NadoEIP712StreamAuth, endpointAddress: string): Promise<string>

  // Nonce 관리
  getCurrentNonce(): number
  getNextNonce(): number
  setNonce(nonce: number): void

  // 유틸리티
  private createDomain(verifyingContract: string): EIP712Domain
  private productIdToVerifyingContract(productId: number): string
}
```

**개선 효과:**
- utils.ts에서 80줄 제거
- 서명 로직 재사용성 향상
- 단위 테스트 용이

#### 1.2 NadoAPIClient 클래스 생성
**파일:** `src/adapters/nado/NadoAPIClient.ts`

**책임:**
- HTTP 요청 추상화
- 재시도 로직
- 에러 매핑
- Rate limiting 통합

**주요 메서드:**
```typescript
class NadoAPIClient {
  constructor(config: {
    apiUrl: string
    rateLimiter: RateLimiter
    timeout?: number
  })

  async query<T>(type: string, params?: any): Promise<T>
  async execute<T>(type: string, payload: any, signature: string): Promise<T>

  private async request<T>(endpoint: string, body: any): Promise<T>
  private shouldRetry(error: any): boolean
  private mapError(error: any): PerpDEXError
}
```

**재시도 전략:**
```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  multiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'NETWORK_ERROR',
    'RATE_LIMIT', // with backoff
  ],
}
```

**개선 효과:**
- NadoAdapter에서 100줄 제거
- 일시적 네트워크 오류 자동 복구
- 테스트/모킹 용이

#### 1.3 NadoNormalizer 클래스 생성
**파일:** `src/adapters/nado/NadoNormalizer.ts`

**책임:**
- Nado 응답 → 통합 포맷 변환
- 정밀도 안전 보장
- 배치 변환 최적화

**주요 메서드:**
```typescript
class NadoNormalizer {
  // 단일 엔티티 변환
  normalizeProduct(product: NadoProduct): Market
  normalizeOrder(order: NadoOrder, mapping: ProductMapping): Order
  normalizePosition(position: NadoPosition, mapping: ProductMapping): Position | null
  normalizeBalance(balance: NadoBalance): Balance[]
  normalizeTicker(ticker: NadoTicker): Ticker
  normalizeOrderBook(orderBook: NadoOrderBook, symbol: string): OrderBook
  normalizeTrade(trade: NadoTrade, mapping: ProductMapping): Trade

  // 배치 변환
  normalizeOrders(orders: NadoOrder[], mappings: Map<number, ProductMapping>): Order[]
  normalizePositions(positions: NadoPosition[], mappings: Map<number, ProductMapping>): Position[]

  // 정밀도 안전 변환
  private fromX18Safe(value: string): number
  private toX18Safe(value: number | string): string
  private validateNumber(value: number): void
}
```

**정밀도 개선:**
```typescript
private fromX18Safe(value: string): number {
  const formatted = ethers.formatUnits(value, 18);
  const parsed = parseFloat(formatted);

  // NaN 검증
  if (isNaN(parsed)) {
    throw new PerpDEXError('Invalid x18 value', 'INVALID_NUMBER', 'nado');
  }

  // 정밀도 손실 경고 (선택적)
  if (Math.abs(parsed) > Number.MAX_SAFE_INTEGER) {
    this.warn(`Precision loss detected for value: ${value}`);
  }

  return parsed;
}
```

**개선 효과:**
- utils.ts 간소화
- 정밀도 손실 방지
- 배치 처리로 성능 향상

---

### Phase 2: 에러 처리 개선 (우선순위 1)

#### 2.1 Nado 특정 에러 매핑

**파일:** `src/adapters/nado/errors.ts`

**Nado 에러 코드 분류:**
```typescript
// 클라이언트 에러 (4xx) - 재시도 불필요
export const NADO_CLIENT_ERRORS = {
  INVALID_SIGNATURE: 'invalid_signature',
  INVALID_ORDER: 'invalid_order',
  INSUFFICIENT_MARGIN: 'insufficient_margin',
  ORDER_NOT_FOUND: 'order_not_found',
  INVALID_PRODUCT: 'invalid_product',
  INVALID_NONCE: 'invalid_nonce',
  ORDER_EXPIRED: 'order_expired',
} as const;

// 서버 에러 (5xx) - 재시도 가능
export const NADO_SERVER_ERRORS = {
  INTERNAL_ERROR: 'internal_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  TIMEOUT: 'timeout',
} as const;

// Rate Limit - 재시도 with backoff
export const NADO_RATE_LIMIT_ERROR = 'rate_limit_exceeded';
```

**에러 매핑 함수:**
```typescript
export function mapNadoError(
  errorCode: string | number,
  message: string,
  originalError?: any
): PerpDEXError {
  const code = errorCode.toString();

  // Insufficient margin
  if (code === NADO_CLIENT_ERRORS.INSUFFICIENT_MARGIN) {
    return new InsufficientMarginError(message, code, 'nado', originalError);
  }

  // Invalid signature
  if (code === NADO_CLIENT_ERRORS.INVALID_SIGNATURE) {
    return new InvalidSignatureError(message, code, 'nado', originalError);
  }

  // Order not found
  if (code === NADO_CLIENT_ERRORS.ORDER_NOT_FOUND) {
    return new OrderNotFoundError(message, code, 'nado', originalError);
  }

  // Invalid order
  if (code === NADO_CLIENT_ERRORS.INVALID_ORDER) {
    return new InvalidOrderError(message, code, 'nado', originalError);
  }

  // Rate limit
  if (code === NADO_RATE_LIMIT_ERROR) {
    return new RateLimitError(message, code, 'nado', originalError);
  }

  // Server errors
  if (Object.values(NADO_SERVER_ERRORS).includes(code as any)) {
    return new ExchangeUnavailableError(message, code, 'nado', originalError);
  }

  // Default
  return new PerpDEXError(message, code, 'nado', originalError);
}
```

**개선 효과:**
- 정교한 에러 분류
- 재시도 가능 여부 명확화
- 클라이언트 코드에서 에러 타입별 처리 가능

---

### Phase 3: WebSocket 개선 (우선순위 2)

#### 3.1 Stream Authentication 구현

**현재 문제:**
- `signNadoStreamAuth()` 정의되어 있지만 사용 안 함
- 인증 없이 WebSocket 연결 (private 채널 불가능?)

**개선 방안:**
```typescript
// NadoAdapter.ts
async initialize(): Promise<void> {
  // ... 기존 초기화 코드

  // WebSocket Stream Auth 추가
  if (this.wallet && this.contractsInfo) {
    const streamAuth: NadoEIP712StreamAuth = {
      sender: this.wallet.address,
      expiration: Math.floor(Date.now() / 1000) + 3600, // 1시간
    };

    const signature = await this.auth.signStreamAuth(
      streamAuth,
      this.contractsInfo.endpoint_address
    );

    this.wsAuthSignature = signature;
  }

  // WebSocket Manager 초기화 시 auth 전달
  this.wsManager = new WebSocketManager({
    url: this.wsUrl,
    auth: this.wsAuthSignature ? {
      type: 'eip712',
      signature: this.wsAuthSignature,
    } : undefined,
    // ... 나머지 설정
  });
}
```

#### 3.2 구독 관리 개선

**Subscription Helper 추가:**
```typescript
// src/adapters/nado/subscriptions.ts
export class NadoSubscriptionBuilder {
  static orderBook(productId: number) {
    return {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.ORDERBOOK,
      product_id: productId,
    };
  }

  static positions(subaccount: string) {
    return {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.POSITIONS,
      subaccount,
    };
  }

  static orders(subaccount: string) {
    return {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.ORDERS,
      subaccount,
    };
  }

  static trades(productId: number) {
    return {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.TRADES,
      product_id: productId,
    };
  }

  static balance(subaccount: string) {
    return {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.SUBACCOUNT,
      subaccount,
    };
  }

  static channelId(channel: string, identifier: number | string): string {
    return `${channel}:${identifier}`;
  }
}
```

**사용 예:**
```typescript
async *watchOrderBook(symbol: string): AsyncGenerator<OrderBook> {
  const mapping = this.getProductMapping(symbol);
  const subscription = NadoSubscriptionBuilder.orderBook(mapping.productId);
  const channelId = NadoSubscriptionBuilder.channelId(
    NADO_WS_CHANNELS.ORDERBOOK,
    mapping.productId
  );

  for await (const update of this.wsManager.watch<NadoOrderBook>(
    channelId,
    subscription
  )) {
    yield this.normalizer.normalizeOrderBook(update, symbol);
  }
}
```

---

### Phase 4: 누락 기능 구현 (우선순위 2)

#### 4.1 fetchTrades 구현

**현재 상태:**
```typescript
async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
  this.warn('fetchTrades not fully supported on Nado (requires WebSocket)');
  return [];
}
```

**개선 방안:**
```typescript
async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
  // Option 1: Indexer API 사용 (있다면)
  // Option 2: WebSocket으로 최근 거래 수집
  // Option 3: 지원 안 함을 명확히 에러로 표시

  throw new PerpDEXError(
    'fetchTrades not supported on Nado - use watchTrades() for real-time trade stream',
    'NOT_SUPPORTED',
    this.id
  );
}
```

**대안: 캐싱 기반 구현**
```typescript
private recentTradesCache: Map<string, Trade[]> = new Map();
private readonly RECENT_TRADES_LIMIT = 100;

async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
  // 캐시에서 반환
  const cached = this.recentTradesCache.get(symbol);
  if (cached) {
    return params?.limit ? cached.slice(0, params.limit) : cached;
  }

  // 캐시 없으면 빈 배열 (WebSocket 구독 시작 권장)
  this.warn(`No cached trades for ${symbol}. Use watchTrades() to populate cache.`);
  return [];
}

async *watchTrades(symbol: string): AsyncGenerator<Trade> {
  // ... 기존 코드 ...

  for await (const trade of this.wsManager.watch<NadoTrade>(...)) {
    const normalized = this.normalizer.normalizeTrade(trade, mapping);

    // 캐시 업데이트
    this.updateTradesCache(symbol, normalized);

    yield normalized;
  }
}

private updateTradesCache(symbol: string, trade: Trade): void {
  const cache = this.recentTradesCache.get(symbol) || [];
  cache.unshift(trade); // 최신 거래를 앞에 추가

  if (cache.length > this.RECENT_TRADES_LIMIT) {
    cache.pop(); // 오래된 거래 제거
  }

  this.recentTradesCache.set(symbol, cache);
}
```

#### 4.2 watchBalance 구현

**현재 상태:**
- `has.watchBalance: true`로 설정되어 있지만 구현 안 됨

**구현:**
```typescript
async *watchBalance(): AsyncGenerator<Balance[]> {
  if (!this.wsManager) {
    throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
  }

  if (!this.wallet) {
    throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
  }

  const subscription = NadoSubscriptionBuilder.balance(this.wallet.address);
  const channelId = NadoSubscriptionBuilder.channelId(
    NADO_WS_CHANNELS.SUBACCOUNT,
    this.wallet.address
  );

  for await (const balance of this.wsManager.watch<NadoBalance>(
    channelId,
    subscription
  )) {
    yield this.normalizer.normalizeBalance(balance);
  }
}
```

---

### Phase 5: 성능 최적화 (우선순위 3)

#### 5.1 Product Mapping 최적화

**현재:**
```typescript
private productMappings: Map<number, ProductMapping> = new Map();
private symbolToProductId: Map<string, number> = new Map();

private getProductMapping(symbol: string): ProductMapping {
  const nadoSymbol = ccxtSymbolToNado(symbol);
  const productId = this.symbolToProductId.get(nadoSymbol);
  const mapping = this.productMappings.get(productId);
  // ...
}
```

**개선:**
```typescript
// 단일 Map으로 통합
private productMappings: Map<string, ProductMapping> = new Map();

private getProductMapping(symbol: string): ProductMapping {
  const nadoSymbol = ccxtSymbolToNado(symbol);
  const mapping = this.productMappings.get(nadoSymbol);

  if (!mapping) {
    throw new InvalidOrderError(
      `Unknown symbol: ${symbol}`,
      'UNKNOWN_SYMBOL',
      this.id
    );
  }

  return mapping;
}

// 초기화 시
for (const product of products) {
  const mapping: ProductMapping = {
    productId: product.product_id,
    symbol: product.symbol,
    ccxtSymbol: market.symbol,
  };

  this.productMappings.set(product.symbol, mapping);
}
```

#### 5.2 배치 정규화

**현재:**
```typescript
// watchOrders()에서
for (const order of orders) {
  const mapping = this.productMappings.get(order.product_id);
  if (!mapping) continue;
  normalized.push(normalizeNadoOrder(order, mapping));
}
```

**개선:**
```typescript
// NadoNormalizer.ts
normalizeOrders(
  orders: NadoOrder[],
  mappings: Map<number, ProductMapping>
): Order[] {
  return orders
    .map(order => {
      const mapping = mappings.get(order.product_id);
      return mapping ? this.normalizeOrder(order, mapping) : null;
    })
    .filter((o): o is Order => o !== null);
}

// watchOrders()에서
const normalized = this.normalizer.normalizeOrders(orders, this.productMappings);
yield normalized;
```

---

## 📝 테스트 전략

### Unit Tests

**NadoAuth 테스트:**
```typescript
describe('NadoAuth', () => {
  it('should sign order correctly', async () => {
    const auth = new NadoAuth(mockWallet, 763373);
    const signature = await auth.signOrder(mockOrder, 2);
    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('should manage nonce correctly', () => {
    const auth = new NadoAuth(mockWallet, 763373);
    expect(auth.getCurrentNonce()).toBe(0);
    expect(auth.getNextNonce()).toBe(0);
    expect(auth.getCurrentNonce()).toBe(1);
  });
});
```

**NadoAPIClient 테스트:**
```typescript
describe('NadoAPIClient', () => {
  it('should retry on network error', async () => {
    const client = new NadoAPIClient(mockConfig);

    // Mock: 첫 2번 실패, 3번째 성공
    fetchMock
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValueOnce({ status: 'success', data: {} });

    const result = await client.query('status');
    expect(result).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should not retry on client error', async () => {
    const client = new NadoAPIClient(mockConfig);

    fetchMock.mockResolvedValueOnce({
      status: 'failure',
      error: 'invalid_signature',
    });

    await expect(client.query('test')).rejects.toThrow(InvalidSignatureError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
```

**NadoNormalizer 테스트:**
```typescript
describe('NadoNormalizer', () => {
  it('should handle precision safely', () => {
    const normalizer = new NadoNormalizer();

    // 큰 숫자
    const large = '1000000000000000000'; // 1e18
    expect(normalizer['fromX18Safe'](large)).toBe(1);

    // NaN 검증
    expect(() => normalizer['fromX18Safe']('invalid')).toThrow();
  });

  it('should batch normalize orders', () => {
    const normalizer = new NadoNormalizer();
    const orders = [mockOrder1, mockOrder2, mockOrder3];
    const result = normalizer.normalizeOrders(orders, mockMappings);

    expect(result).toHaveLength(3);
    expect(result[0].symbol).toBe('BTC/USDT:USDT');
  });
});
```

### Integration Tests

**전체 플로우 테스트:**
```typescript
describe('NadoAdapter Integration', () => {
  let adapter: NadoAdapter;

  beforeEach(async () => {
    adapter = new NadoAdapter({
      wallet: mockWallet,
      testnet: true,
    });
    await adapter.initialize();
  });

  it('should complete order lifecycle', async () => {
    // 1. Create order
    const order = await adapter.createOrder({
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.01,
      price: 80000,
      postOnly: true,
    });

    expect(order.status).toBe('open');

    // 2. Fetch open orders
    const openOrders = await adapter.fetchOpenOrders('BTC/USDT:USDT');
    expect(openOrders.some(o => o.id === order.id)).toBe(true);

    // 3. Cancel order
    const canceled = await adapter.cancelOrder(order.id);
    expect(canceled.status).toBe('canceled');
  });
});
```

---

## 📊 성공 지표

### 코드 품질
- [ ] TypeScript strict 모드 100% 준수
- [ ] ESLint 경고 0개
- [ ] 테스트 커버리지 > 80%
- [ ] 모든 public 메서드 JSDoc 완비

### 기능 완성도
- [ ] `has` 맵의 모든 true 항목 구현 완료
- [ ] 에러 처리 100% 명확화
- [ ] WebSocket 모든 채널 지원

### 성능
- [ ] 평균 응답 시간 < 100ms (로컬)
- [ ] 메모리 누수 0
- [ ] Rate limit 준수 100%

---

## 🚀 실행 계획

### Week 1: 인프라 리팩토링
- Day 1-2: NadoAuth 구현 및 테스트
- Day 3-4: NadoAPIClient 구현 및 테스트
- Day 5: NadoNormalizer 구현 및 테스트

### Week 2: 기능 개선
- Day 1-2: 에러 처리 개선
- Day 3: WebSocket Stream Auth
- Day 4-5: 누락 기능 구현

### Week 3: 최적화 및 테스트
- Day 1-2: 성능 최적화
- Day 3-4: 통합 테스트
- Day 5: 문서화 및 리뷰

---

## 📚 참고 자료

- [Nado 공식 문서](https://docs.nado.xyz)
- [Nado TypeScript SDK](https://github.com/nadohq/nado-typescript-sdk)
- [현재 구현 분석](./NADO_ANALYSIS.md)
- [공식 SDK vs 커스텀 비교](./SDK_COMPARISON.md)
