# Production Monitoring Guide

실제 프로덕션 환경에서 PD AIO SDK를 안정적으로 운영하기 위한 모니터링 가이드입니다.

## 📊 모니터링 대상 메트릭

### 1. 핵심 성능 지표 (KPIs)

#### API 응답 시간
- **fetchMarkets**: < 1000ms
- **fetchOrderBook**: < 500ms
- **fetchTicker**: < 300ms
- **createOrder**: < 2000ms
- **cancelOrder**: < 1500ms

#### 성공률
- **주문 생성 성공률**: > 99%
- **주문 취소 성공률**: > 99%
- **API 요청 성공률**: > 99.5%

#### WebSocket
- **연결 유지 시간**: > 23시간 (일일 재연결 허용)
- **재연결 성공률**: > 99%
- **메시지 손실률**: < 0.1%

### 2. 에러 메트릭

#### 에러 분류
```typescript
{
  "errors": {
    "network": {
      "count": 0,
      "rate": "0/s",
      "lastError": null
    },
    "rateLimit": {
      "count": 5,
      "rate": "0.05/s",
      "lastError": "2025-12-15T10:30:00Z"
    },
    "authentication": {
      "count": 0,
      "rate": "0/s",
      "lastError": null
    },
    "trading": {
      "insufficientMargin": 2,
      "invalidOrder": 1,
      "orderNotFound": 0
    }
  }
}
```

#### 알림 임계값
- **Network Error**: 분당 5회 초과 시 알림
- **Rate Limit Error**: 분당 10회 초과 시 알림
- **Authentication Error**: 1회 발생 시 즉시 알림
- **Trading Error**: 분당 20회 초과 시 알림

### 3. 시스템 메트릭

#### 리소스 사용량
- **메모리 사용량**: < 500MB (정상), < 1GB (경고), > 1GB (위험)
- **CPU 사용률**: < 50% (정상), < 80% (경고), > 80% (위험)
- **WebSocket 연결 수**: < 10 (정상), < 20 (경고), > 20 (위험)

#### 처리량
- **초당 요청 수**: 모니터링 필수
- **초당 주문 처리**: 모니터링 필수
- **WebSocket 메시지/초**: 모니터링 필수

## 🔍 헬스체크 구현

### Exchange Health Check

각 거래소 어댑터는 `getHealth()` 메서드를 제공합니다:

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

const health = await exchange.getHealth();

console.log(health);
// {
//   status: 'healthy' | 'degraded' | 'unhealthy',
//   uptimeSeconds: 3600,
//   lastRequestTime: 1702650000000,
//   cache: {
//     hitRate: 0.85,
//     size: 150
//   },
//   errors: {
//     last24h: 5,
//     last1h: 0
//   },
//   websocket: {
//     connected: true,
//     subscriptions: 3,
//     lastMessageTime: 1702650000000
//   }
// }
```

### HTTP 헬스체크 엔드포인트 예제

Express.js를 사용한 헬스체크 엔드포인트:

```typescript
import express from 'express';
import { createExchange, type SupportedExchange } from 'pd-aio-sdk';

const app = express();

// 거래소 인스턴스들 (전역 또는 DI 컨테이너에서 관리)
const exchanges = new Map();

// 초기화
async function initializeExchanges() {
  const exchangeNames: SupportedExchange[] = ['hyperliquid', 'grvt', 'paradex'];

  for (const name of exchangeNames) {
    try {
      const exchange = createExchange(name, {
        // ... config
      });
      await exchange.initialize();
      exchanges.set(name, exchange);
    } catch (error) {
      console.error(`Failed to initialize ${name}:`, error);
    }
  }
}

// 전체 헬스체크
app.get('/health', async (req, res) => {
  const results = {};
  let overallStatus = 'healthy';

  for (const [name, exchange] of exchanges) {
    try {
      const health = await exchange.getHealth();
      results[name] = health;

      if (health.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (health.status === 'degraded' && overallStatus !== 'unhealthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      results[name] = {
        status: 'unhealthy',
        error: error.message
      };
      overallStatus = 'unhealthy';
    }
  }

  const statusCode = overallStatus === 'healthy' ? 200
                   : overallStatus === 'degraded' ? 200
                   : 503;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    exchanges: results
  });
});

// 개별 거래소 헬스체크
app.get('/health/:exchange', async (req, res) => {
  const { exchange: exchangeName } = req.params;
  const exchange = exchanges.get(exchangeName);

  if (!exchange) {
    return res.status(404).json({
      error: `Exchange ${exchangeName} not found`
    });
  }

  try {
    const health = await exchange.getHealth();
    const statusCode = health.status === 'healthy' ? 200
                     : health.status === 'degraded' ? 200
                     : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 상세 메트릭
app.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    exchanges: {}
  };

  for (const [name, exchange] of exchanges) {
    try {
      const health = await exchange.getHealth();
      metrics.exchanges[name] = {
        ...health,
        // 추가 메트릭
        memory: process.memoryUsage(),
      };
    } catch (error) {
      metrics.exchanges[name] = {
        error: error.message
      };
    }
  }

  res.json(metrics);
});

// Prometheus 형식 메트릭
app.get('/metrics/prometheus', async (req, res) => {
  const lines = [];

  for (const [name, exchange] of exchanges) {
    try {
      const health = await exchange.getHealth();

      // Uptime
      lines.push(`exchange_uptime_seconds{exchange="${name}"} ${health.uptimeSeconds}`);

      // Cache hit rate
      lines.push(`exchange_cache_hit_rate{exchange="${name}"} ${health.cache.hitRate}`);

      // Errors
      lines.push(`exchange_errors_24h{exchange="${name}"} ${health.errors.last24h}`);

      // WebSocket status
      lines.push(`exchange_websocket_connected{exchange="${name}"} ${health.websocket.connected ? 1 : 0}`);
    } catch (error) {
      lines.push(`exchange_health_check_failed{exchange="${name}"} 1`);
    }
  }

  res.set('Content-Type', 'text/plain');
  res.send(lines.join('\n'));
});

await initializeExchanges();
app.listen(3000, () => {
  console.log('Health check server running on port 3000');
});
```

## 📈 Grafana 대시보드 설정

### 필요한 데이터 소스
1. **Prometheus**: 메트릭 수집
2. **Loki** (선택): 로그 집계
3. **Elasticsearch** (선택): 에러 로그 분석

### 주요 패널

#### 1. Exchange Status Overview
```
Query: exchange_health_status
Visualization: Stat
```

#### 2. API Response Time
```
Query: histogram_quantile(0.95, exchange_api_response_time_bucket)
Visualization: Graph (Time series)
```

#### 3. Error Rate
```
Query: rate(exchange_errors_total[5m])
Visualization: Graph (Stacked)
```

#### 4. WebSocket Connections
```
Query: exchange_websocket_connected
Visualization: Stat + Time series
```

#### 5. Memory Usage
```
Query: exchange_memory_usage_bytes
Visualization: Graph
```

## 🚨 알림 설정

### Grafana Alerts 예제

#### High Error Rate
```yaml
name: High Error Rate
condition: rate(exchange_errors_total[5m]) > 0.1
for: 5m
labels:
  severity: warning
annotations:
  summary: "High error rate detected on {{ $labels.exchange }}"
  description: "Error rate is {{ $value }} errors/sec"
```

#### WebSocket Disconnection
```yaml
name: WebSocket Disconnected
condition: exchange_websocket_connected == 0
for: 1m
labels:
  severity: critical
annotations:
  summary: "WebSocket disconnected on {{ $labels.exchange }}"
  description: "WebSocket has been disconnected for more than 1 minute"
```

#### Memory Leak
```yaml
name: Potential Memory Leak
condition: increase(exchange_memory_usage_bytes[1h]) > 500000000
for: 10m
labels:
  severity: warning
annotations:
  summary: "Potential memory leak on {{ $labels.exchange }}"
  description: "Memory usage increased by {{ $value }} bytes in 1 hour"
```

### Slack 알림 통합

```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

async function sendAlert(exchange: string, severity: 'info' | 'warning' | 'critical', message: string) {
  const emoji = severity === 'critical' ? '🔴' : severity === 'warning' ? '⚠️' : 'ℹ️';
  const color = severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'good';

  await slack.chat.postMessage({
    channel: '#pd-aio-sdk-alerts',
    text: `${emoji} ${exchange.toUpperCase()}: ${message}`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Exchange',
            value: exchange,
            short: true
          },
          {
            title: 'Severity',
            value: severity,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          }
        ]
      }
    ]
  });
}

// 사용 예제
sendAlert('hyperliquid', 'critical', 'WebSocket disconnected for 5 minutes');
```

## 📝 로깅 베스트 프랙티스

### 구조화된 로깅

SDK는 내장된 구조화된 로깅을 제공합니다:

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
  testnet: true,
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    format: 'json', // 'json' | 'text'
    maskSensitive: true // 민감한 데이터 마스킹
  }
});
```

### 로그 레벨 가이드

- **DEBUG**: 개발 환경에서만 사용 (모든 API 요청/응답)
- **INFO**: 주요 이벤트 (연결, 주문 생성/취소)
- **WARN**: 경고 (Rate Limit 접근, 재시도)
- **ERROR**: 에러 (실패한 요청, 연결 끊김)

### 로그 집계

Elasticsearch + Kibana 또는 Loki + Grafana를 사용하여 로그 집계:

```bash
# Docker Compose 예제
version: '3'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
```

## 🔄 장애 대응 절차

### 1. WebSocket 연결 끊김
```
1. 헬스체크 확인
2. 자동 재연결 시도 (SDK 내장)
3. 재연결 실패 시 알림
4. 수동 재시작 고려
```

### 2. Rate Limit 초과
```
1. 요청 빈도 확인
2. 불필요한 요청 제거
3. 캐싱 활용
4. 요청 간격 증가
```

### 3. 인증 실패
```
1. API 키/Private Key 확인
2. 만료 여부 확인
3. 권한 확인
4. 자격증명 갱신
```

### 4. 메모리 누수
```
1. 메모리 프로파일링
2. WebSocket 연결 누수 확인
3. 이벤트 리스너 정리 확인
4. 캐시 크기 제한 확인
```

## 📊 SLA 목표

### Availability
- **목표**: 99.9% (월 43분 다운타임 허용)
- **측정**: 헬스체크 엔드포인트 응답률

### Performance
- **API 응답 시간 P95**: < 2초
- **WebSocket 메시지 지연**: < 100ms
- **주문 체결 시간**: < 3초

### Reliability
- **주문 성공률**: > 99%
- **데이터 정확성**: 100%
- **에러 복구율**: > 99%

## 🛠️ 도구 추천

### 모니터링
- **Prometheus** + **Grafana**: 메트릭 시각화
- **Datadog**: 올인원 모니터링
- **New Relic**: APM

### 로깅
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki** + **Promtail** + **Grafana**
- **Datadog Logs**

### 알림
- **PagerDuty**: 장애 대응
- **Opsgenie**: 온콜 관리
- **Slack**: 팀 커뮤니케이션

### 에러 트래킹
- **Sentry**: 에러 모니터링
- **Rollbar**: 에러 집계
- **Bugsnag**: 에러 알림

## 📚 참고 자료

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [The Twelve-Factor App - Logs](https://12factor.net/logs)
- [SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
