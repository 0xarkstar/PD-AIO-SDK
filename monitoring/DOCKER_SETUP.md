# Docker Compose 모니터링 스택 설정 가이드

로컬 개발 환경에서 Prometheus + Grafana + Alertmanager를 한 번에 실행하는 가이드입니다.

## 📋 포함된 서비스

| 서비스 | 포트 | 설명 |
|--------|------|------|
| **Prometheus** | 9090 | 메트릭 수집 및 저장 |
| **Grafana** | 3000 | 데이터 시각화 대시보드 |
| **Alertmanager** | 9093 | 알림 관리 및 전송 |
| **Node Exporter** | 9100 | 시스템 메트릭 수집 |
| **cAdvisor** | 8080 | 컨테이너 메트릭 수집 |

---

## 🚀 빠른 시작

### 1. 환경 변수 설정

```bash
cd monitoring
cp .env.example .env

# .env 파일 편집
nano .env
```

**.env 예시:**
```bash
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-password-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Docker Compose 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 보기
docker-compose logs -f grafana
```

### 3. 서비스 접속

#### Grafana 대시보드
- URL: http://localhost:3000
- 기본 계정: `admin` / `admin` (첫 로그인 시 비밀번호 변경 요구)
- 자동으로 로드되는 대시보드:
  - **Perp DEX SDK - Overview**
  - **Perp DEX SDK - Circuit Breaker**

#### Prometheus
- URL: http://localhost:9090
- Targets 확인: http://localhost:9090/targets
- 쿼리 테스트: http://localhost:9090/graph

#### Alertmanager
- URL: http://localhost:9093
- 활성 알림 확인: http://localhost:9093/#/alerts

---

## 🔧 설정 상세

### Prometheus 설정

**파일:** `prometheus/prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'perpdex-sdk'
    static_configs:
      - targets: ['host.docker.internal:9090']
```

**주의사항:**
- `host.docker.internal`은 Docker Desktop (Mac/Windows)에서 호스트 머신을 가리킵니다
- Linux에서는 `172.17.0.1` 또는 `--network host` 사용

**Linux 사용자:**
```yaml
# Linux의 경우
- targets: ['172.17.0.1:9090']
```

또는 extra_hosts 사용:
```yaml
# docker-compose.yml
services:
  prometheus:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Grafana 자동 설정

Grafana는 시작 시 자동으로:
1. ✅ Prometheus 데이터 소스 연결
2. ✅ 대시보드 임포트 (overview, circuit-breaker)
3. ✅ 기본 플러그인 설치

**설정 파일:**
- Datasource: `grafana/provisioning/datasources/prometheus.yml`
- Dashboard: `grafana/provisioning/dashboards/default.yml`

### Alertmanager 설정

**Slack 알림 설정:**

1. Slack Incoming Webhook 생성:
   - https://api.slack.com/messaging/webhooks
   - Workspace에서 앱 추가
   - Webhook URL 복사

2. `.env` 파일에 추가:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. Alertmanager 재시작:
   ```bash
   docker-compose restart alertmanager
   ```

**알림 채널:**
- `#perpdex-alerts-critical`: Critical 알림
- `#perpdex-alerts-warnings`: Warning 알림
- `#perpdex-circuit-breaker`: Circuit Breaker 알림

---

## 📊 사용 방법

### 1. SDK 애플리케이션 실행

```typescript
// your-app.ts
import { initializeMetrics, startMetricsServer, createExchange } from 'perp-dex-sdk';

// 메트릭 초기화
initializeMetrics({
  metricPrefix: 'perpdex_',
  enableDefaultMetrics: true,
});

// Metrics 서버 시작 (Docker의 Prometheus가 스크랩함)
await startMetricsServer({ port: 9090 });

// 거래소 사용
const exchange = createExchange('hyperliquid');
await exchange.initialize();

// 메트릭이 자동으로 수집됨
const markets = await exchange.fetchMarkets();
```

### 2. Grafana에서 메트릭 확인

1. http://localhost:3000 접속
2. **Dashboards** → **Perp DEX SDK** 폴더
3. **Overview** 또는 **Circuit Breaker** 대시보드 선택

### 3. Prometheus에서 쿼리 실행

```promql
# 초당 요청 수
rate(perpdex_requests_total[5m])

# 에러율
rate(perpdex_requests_total{status="error"}[5m])
  / rate(perpdex_requests_total[5m])

# Circuit Breaker 상태
perpdex_circuit_breaker_state
```

### 4. 알림 테스트

```bash
# Alertmanager에 테스트 알림 전송
curl -X POST http://localhost:9093/api/v1/alerts -d '[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "This is a test alert"
    }
  }
]'
```

---

## 🛠️ 관리 명령어

### 서비스 관리

```bash
# 모든 서비스 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d grafana prometheus

# 서비스 중지
docker-compose stop

# 서비스 재시작
docker-compose restart prometheus

# 서비스 및 볼륨 완전 삭제
docker-compose down -v

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps
```

### Prometheus 설정 리로드

```bash
# 설정 파일 수정 후 리로드 (재시작 불필요)
curl -X POST http://localhost:9090/-/reload
```

### Grafana 대시보드 업데이트

```bash
# 대시보드 JSON 파일 수정 후 Grafana 재시작
docker-compose restart grafana

# 또는 Grafana UI에서 수동으로 다시 임포트
```

---

## 📈 데이터 지속성

모든 데이터는 Docker 볼륨에 저장됩니다:

```bash
# 볼륨 확인
docker volume ls | grep monitoring

# 볼륨 상세 정보
docker volume inspect monitoring_prometheus-data
docker volume inspect monitoring_grafana-data

# 볼륨 백업
docker run --rm -v monitoring_prometheus-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/prometheus-backup.tar.gz -C /data .

# 볼륨 복원
docker run --rm -v monitoring_prometheus-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/prometheus-backup.tar.gz -C /data
```

---

## 🔍 트러블슈팅

### Prometheus가 메트릭을 수집하지 못함

**증상:**
- Prometheus Targets에서 `perpdex-sdk` job이 DOWN 상태

**해결:**
1. SDK Metrics 서버가 실행 중인지 확인:
   ```bash
   curl http://localhost:9090/metrics
   ```

2. Docker에서 호스트 접근 확인:
   ```bash
   # Docker 컨테이너 내부에서 테스트
   docker-compose exec prometheus wget -O- http://host.docker.internal:9090/metrics
   ```

3. Linux인 경우 IP 주소 변경:
   ```yaml
   # prometheus.yml
   - targets: ['172.17.0.1:9090']  # 또는 실제 호스트 IP
   ```

### Grafana 대시보드가 보이지 않음

**해결:**
1. 프로비저닝 로그 확인:
   ```bash
   docker-compose logs grafana | grep -i provision
   ```

2. 대시보드 파일 권한 확인:
   ```bash
   ls -la grafana/dashboards/
   chmod 644 grafana/dashboards/*.json
   ```

3. 수동 임포트:
   - Grafana UI → Dashboards → Import
   - `grafana/dashboards/overview.json` 업로드

### Alertmanager가 Slack 알림을 보내지 않음

**해결:**
1. Webhook URL 확인:
   ```bash
   # Alertmanager 컨테이너에서 확인
   docker-compose exec alertmanager env | grep SLACK
   ```

2. 설정 파일 문법 확인:
   ```bash
   docker-compose exec alertmanager amtool check-config /etc/alertmanager/config.yml
   ```

3. 테스트 알림 전송:
   ```bash
   curl -X POST http://localhost:9093/api/v1/alerts -H "Content-Type: application/json" -d '[{
     "labels": {"alertname": "Test", "severity": "warning"},
     "annotations": {"summary": "Test alert"}
   }]'
   ```

### 메모리 부족

**증상:**
- 컨테이너가 자주 재시작됨
- OOM (Out of Memory) 에러

**해결:**
1. Prometheus 보존 기간 줄이기:
   ```yaml
   # docker-compose.yml
   command:
     - '--storage.tsdb.retention.time=7d'  # 30d에서 7d로 변경
   ```

2. 리소스 제한 설정:
   ```yaml
   services:
     prometheus:
       deploy:
         resources:
           limits:
             memory: 2G
           reservations:
             memory: 1G
   ```

---

## 🎯 프로덕션 배포

**주의:** 이 Docker Compose 설정은 로컬 개발용입니다.

**프로덕션 환경에서는:**
1. ✅ 강력한 비밀번호 사용
2. ✅ HTTPS 설정 (reverse proxy 사용)
3. ✅ 인증/권한 강화
4. ✅ 데이터 백업 자동화
5. ✅ 리소스 제한 설정
6. ✅ 로그 로테이션
7. ✅ 보안 업데이트 정기 적용

**권장 프로덕션 설정:**
- Kubernetes + Prometheus Operator
- Managed Grafana Cloud
- Dedicated Alertmanager cluster

---

## 📚 추가 리소스

- [Prometheus 문서](https://prometheus.io/docs/)
- [Grafana 문서](https://grafana.com/docs/)
- [Alertmanager 문서](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Docker Compose 문서](https://docs.docker.com/compose/)

---

## 🤝 기여

개선 사항이나 버그를 발견하셨다면 Issue 또는 PR을 생성해주세요!
