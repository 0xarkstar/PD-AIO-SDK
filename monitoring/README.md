# Perp DEX SDK - Monitoring & Observability

프로덕션급 모니터링 인프라로 Prometheus 메트릭 수집, Grafana 대시보드 시각화, 자동 알림을 제공합니다.

## 📊 구성 요소

### 1. Prometheus Metrics
- **자동 메트릭 수집**: 모든 API 요청, Circuit Breaker, WebSocket, 주문이 자동으로 추적됩니다
- **커스텀 메트릭**: 필요에 따라 추가 메트릭 정의 가능
- **표준 호환**: Prometheus 텍스트 형식으로 노출

### 2. Metrics HTTP Server
- **GET /metrics**: Prometheus 스크랩 엔드포인트
- **GET /health**: 헬스체크 엔드포인트
- **인증 지원**: Bearer 토큰 인증 옵션

### 3. Grafana Dashboards
- **Overview Dashboard**: 전체 시스템 개요
- **Circuit Breaker Dashboard**: 회로 차단기 상태 모니터링
- **Performance Dashboard**: 성능 메트릭 분석

### 4. Prometheus Alerts
- **Critical Alerts**: Circuit Breaker OPEN, 매우 높은 에러율
- **Warning Alerts**: 높은 에러율, 느린 요청, 연결 끊김

---

## 🚀 빠른 시작

### 1단계: 메트릭 초기화

```typescript
import { initializeMetrics, startMetricsServer } from 'perp-dex-sdk';

// 애플리케이션 시작 시 메트릭 초기화
initializeMetrics({
  metricPrefix: 'perpdex_',
  enableDefaultMetrics: true, // CPU, 메모리 등 시스템 메트릭 포함
  defaultLabels: {
    app: 'my-trading-bot',
    environment: 'production',
  },
});

// Metrics 서버 시작
await startMetricsServer({
  port: 9090,
  host: '0.0.0.0',
  enableAuth: true,
  authToken: process.env.METRICS_TOKEN,
});

console.log('Metrics server running on http://localhost:9090/metrics');
```

### 2단계: Prometheus 설정

`prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# 알림 규칙 로드
rule_files:
  - 'alerts.yml'

# 메트릭 수집 대상
scrape_configs:
  - job_name: 'perpdex-sdk'
    static_configs:
      - targets: ['localhost:9090']
    # 인증이 활성화된 경우
    bearer_token: 'your-secret-token'
    scrape_interval: 15s
    scrape_timeout: 10s
```

알림 규칙 설정 (`alerts.yml`):
```bash
cp monitoring/prometheus/alerts.yml /etc/prometheus/alerts.yml
```

### 3단계: Grafana 대시보드 임포트

1. Grafana에 로그인
2. **Dashboards** → **Import** 클릭
3. 다음 파일 중 하나 업로드:
   - `monitoring/grafana/dashboards/overview.json` - 종합 대시보드
   - `monitoring/grafana/dashboards/circuit-breaker.json` - Circuit Breaker 모니터링

4. Prometheus 데이터 소스 선택

---

## 📈 주요 메트릭

### Request Metrics
```promql
# 초당 요청 수
rate(perpdex_requests_total[5m])

# 에러율
rate(perpdex_requests_total{status="error"}[5m])
  / rate(perpdex_requests_total[5m])

# P95 레이턴시
histogram_quantile(0.95,
  sum(rate(perpdex_request_duration_ms_bucket[5m])) by (le, exchange)
)

# P99 레이턴시
histogram_quantile(0.99,
  sum(rate(perpdex_request_duration_ms_bucket[5m])) by (le, exchange)
)
```

### Circuit Breaker Metrics
```promql
# Circuit Breaker 상태 (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
perpdex_circuit_breaker_state

# 상태 전환 횟수
rate(perpdex_circuit_breaker_transitions_total[5m])

# 성공률
rate(perpdex_circuit_breaker_successes_total[5m])
  / (rate(perpdex_circuit_breaker_successes_total[5m])
     + rate(perpdex_circuit_breaker_failures_total[5m]))
```

### WebSocket Metrics
```promql
# 활성 WebSocket 연결 수
perpdex_websocket_connections

# 재연결 빈도
rate(perpdex_websocket_reconnects_total[5m])

# WebSocket 메시지 처리율
rate(perpdex_websocket_messages_total{type="incoming"}[5m])
```

### Order Metrics
```promql
# 주문 처리율
rate(perpdex_orders_total[5m])

# 주문 거부율
rate(perpdex_order_rejections_total[5m])
  / rate(perpdex_orders_total[5m])

# P95 주문 레이턴시
histogram_quantile(0.95,
  sum(rate(perpdex_order_latency_ms_bucket[5m])) by (le, exchange)
)
```

---

## 🚨 알림 규칙

### Critical Alerts (즉시 조치 필요)

| Alert | 조건 | 설명 |
|-------|------|------|
| **CircuitBreakerOpen** | Circuit Breaker가 1분 이상 OPEN | 거래소 연결 실패, 모든 요청 차단 |
| **VeryHighRequestErrorRate** | 에러율 > 50% (2분) | 심각한 서비스 장애 |
| **VerySlowRequests** | P95 레이턴시 > 10초 (2분) | 심각한 성능 저하 |
| **MetricsServerDown** | Metrics 서버 응답 없음 (1분) | 모니터링 시스템 장애 |

### Warning Alerts (주의 필요)

| Alert | 조건 | 설명 |
|-------|------|------|
| **HighRequestErrorRate** | 에러율 > 10% (5분) | 서비스 불안정 |
| **SlowRequests** | P95 레이턴시 > 5초 (5분) | 성능 저하 |
| **WebSocketDisconnected** | WebSocket 연결 없음 (2분) | 실시간 데이터 수신 불가 |
| **HighOrderRejectionRate** | 주문 거부율 > 20% (5분) | 주문 실행 문제 |

---

## 🎯 사용 예시

### 커스텀 메트릭 추가

```typescript
import { getMetrics } from 'perp-dex-sdk';

const metrics = getMetrics();

// 커스텀 비즈니스 메트릭 기록
metrics.recordRequest('hyperliquid', 'customOperation', 'success', 123);
metrics.recordOrder('hyperliquid', 'buy', 'limit', 'placed', 50);

// 캐시 성능 추적
metrics.recordCacheHit('marketData');
metrics.recordCacheMiss('marketData');
```

### 커스텀 헬스체크

```typescript
import { startMetricsServer } from 'perp-dex-sdk';

await startMetricsServer({
  port: 9090,
  healthCheck: async () => {
    // 데이터베이스 연결 확인
    const dbConnected = await checkDatabaseConnection();

    // Redis 연결 확인
    const redisConnected = await checkRedisConnection();

    return {
      status: dbConnected && redisConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      details: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
      },
    };
  },
});
```

---

## 📊 Grafana Dashboard 가이드

### Overview Dashboard

![Overview Dashboard](https://via.placeholder.com/800x400?text=Overview+Dashboard)

**주요 패널:**
- **Requests/sec**: 초당 성공/에러 요청 수
- **Circuit Breaker Status**: 각 거래소별 회로 차단기 상태
- **Request Rate by Exchange**: 거래소별 요청 비율
- **Request Latency**: P95, P99 레이턴시 추이
- **WebSocket Connections**: 활성 WebSocket 연결 수
- **Order Rate**: 주문 처리 비율

### Circuit Breaker Dashboard

![Circuit Breaker Dashboard](https://via.placeholder.com/800x400?text=Circuit+Breaker+Dashboard)

**주요 패널:**
- **Circuit Breaker Status**: 거래소별 실시간 상태
- **State Timeline**: 시간대별 상태 변화 추적
- **State Transitions**: 상태 전환 빈도
- **Success/Failure Rate**: 성공/실패 비율
- **Success Rate %**: 거래소별 성공률

---

## 🔧 트러블슈팅

### 메트릭이 수집되지 않을 때

1. **Metrics 초기화 확인**:
   ```typescript
   import { isMetricsInitialized } from 'perp-dex-sdk';

   if (!isMetricsInitialized()) {
     console.error('Metrics not initialized!');
   }
   ```

2. **Metrics 서버 상태 확인**:
   ```bash
   curl http://localhost:9090/health
   ```

3. **Prometheus 연결 확인**:
   ```bash
   # Prometheus targets 확인
   curl http://prometheus:9090/api/v1/targets
   ```

### Circuit Breaker가 계속 OPEN 상태일 때

1. **에러 로그 확인**:
   ```typescript
   // 디버그 로깅 활성화
   const exchange = createExchange('hyperliquid', { debug: true });
   ```

2. **Circuit Breaker 메트릭 확인**:
   ```promql
   # 실패 원인 분석
   rate(perpdex_request_errors_total[5m])
   ```

3. **임계값 조정** (필요시):
   ```typescript
   const exchange = createExchange('hyperliquid', {
     circuitBreaker: {
       failureThreshold: 10,  // 기본값: 5
       resetTimeout: 60000,   // 기본값: 30000 (30초)
     },
   });
   ```

---

## 📚 추가 리소스

- [Prometheus 쿼리 가이드](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana 대시보드 튜토리얼](https://grafana.com/docs/grafana/latest/dashboards/)
- [PromQL 치트시트](https://promlabs.com/promql-cheat-sheet/)

---

## 🤝 기여하기

새로운 대시보드나 알림 규칙을 추가하고 싶으시다면:

1. `monitoring/grafana/dashboards/` 또는 `monitoring/prometheus/alerts.yml` 수정
2. Pull Request 생성
3. 대시보드 스크린샷 포함

---

**문의**: Issues 탭에서 질문하거나 버그를 보고해주세요.
