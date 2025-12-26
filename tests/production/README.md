# Production E2E Tests

실제 Testnet/Mainnet 환경에서 SDK의 프로덕션 준비도를 검증하는 테스트 스위트입니다.

## 목적

- ✅ 실제 네트워크 환경에서 전체 워크플로우 검증
- ✅ 장시간 연결 안정성 테스트
- ✅ Rate limiting 및 에러 복구 메커니즘 검증
- ✅ WebSocket 재연결 로직 검증
- ✅ 실제 자금을 사용한 소액 거래 테스트

## 테스트 실행 전 준비사항

### 1. 환경 변수 설정

```bash
# .env.production 파일 생성
cp .env.example .env.production

# 각 거래소별 Testnet 자격증명 입력
# - Hyperliquid: Testnet 지갑 및 faucet에서 테스트 자금 획득
# - GRVT: Testnet 계정 및 API 키
# - Paradex: Testnet StarkNet 지갑
# - Nado: Testnet Ink L2 지갑
# - 기타 거래소별 설정
```

### 2. Testnet 자금 준비

각 거래소의 Testnet에서 테스트 자금을 확보하세요:

- **Hyperliquid Testnet**: https://app.hyperliquid-testnet.xyz/ (Faucet 제공)
- **GRVT Testnet**: https://testnet.grvt.io/
- **Paradex Testnet**: https://testnet.paradex.trade/
- **Nado Testnet**: https://test.nado.xyz/

### 3. 최소 자금 요구사항

- 최소 $10 상당의 Testnet 자금 권장
- 수수료 및 최소 주문 금액 고려

## 테스트 스위트 구성

### A. 기본 기능 테스트 (`basic-flow.test.ts`)

**검증 항목:**
- ✅ Exchange 초기화
- ✅ Markets 조회
- ✅ Order Book 조회
- ✅ Balance 조회
- ✅ 주문 생성 (Limit Order)
- ✅ 주문 조회
- ✅ 주문 취소
- ✅ Position 조회
- ✅ 정상적인 연결 종료

**실행 방법:**
```bash
npm run test:production:basic
```

### B. WebSocket 안정성 테스트 (`websocket-stability.test.ts`)

**검증 항목:**
- ✅ WebSocket 연결 수립
- ✅ Order Book 스트리밍 (1시간 이상)
- ✅ Position 업데이트 스트리밍
- ✅ Trade 스트리밍
- ✅ 네트워크 단절 시 자동 재연결
- ✅ 재연결 후 구독 복구
- ✅ 메모리 누수 검증

**실행 방법:**
```bash
npm run test:production:websocket
```

### C. 스트레스/부하 테스트 (`stress-test.ts`)

**검증 항목:**
- ✅ 동시 다발적 주문 생성 (Rate Limit 검증)
- ✅ 대량 주문 취소
- ✅ 다중 심볼 동시 구독
- ✅ API 응답 시간 측정
- ✅ Rate Limit 에러 복구

**실행 방법:**
```bash
npm run test:production:stress
```

### D. 실제 거래 시뮬레이션 (`trading-simulation.test.ts`)

**검증 항목:**
- ✅ 시장가 주문 실행
- ✅ 지정가 주문 체결
- ✅ 포지션 오픈/클로즈
- ✅ Stop Loss / Take Profit
- ✅ 레버리지 조정
- ✅ PnL 계산 정확성

**실행 방법:**
```bash
npm run test:production:trading
```

### E. 전체 거래소 통합 테스트 (`all-exchanges.test.ts`)

**검증 항목:**
- ✅ 7개 거래소 순차 실행
- ✅ 각 거래소별 기본 플로우 검증
- ✅ 거래소별 특수 기능 테스트
- ✅ 에러 핸들링 일관성 검증

**실행 방법:**
```bash
npm run test:production:all
```

## 실행 명령어

```bash
# 전체 Production 테스트 실행
npm run test:production

# 특정 거래소만 테스트
npm run test:production -- --exchange=hyperliquid

# 특정 테스트 스위트만 실행
npm run test:production:basic
npm run test:production:websocket
npm run test:production:stress
npm run test:production:trading
npm run test:production:all

# 결과를 JSON으로 저장
npm run test:production -- --output=./results/production-test-results.json

# Verbose 모드
npm run test:production -- --verbose
```

## 테스트 결과 분석

### 성공 기준

각 테스트는 다음 기준을 만족해야 합니다:

1. **기본 기능 테스트**: 100% 성공률
2. **WebSocket 안정성**: 1시간 이상 연결 유지, 재연결 성공률 100%
3. **스트레스 테스트**: Rate Limit 준수, 에러 복구율 100%
4. **거래 시뮬레이션**: 주문 체결률 95% 이상, PnL 계산 오차 0.1% 이하
5. **전체 거래소**: 최소 5개 이상 거래소 통과

### 결과 리포트

테스트 완료 후 다음 형식의 리포트가 생성됩니다:

```json
{
  "testDate": "2025-12-15T10:30:00Z",
  "duration": "3600s",
  "exchanges": {
    "hyperliquid": {
      "status": "PASSED",
      "tests": {
        "basic": "PASSED",
        "websocket": "PASSED",
        "stress": "PASSED",
        "trading": "PASSED"
      },
      "metrics": {
        "avgResponseTime": "150ms",
        "orderSuccessRate": "100%",
        "websocketUptime": "99.9%"
      }
    }
    // ... 다른 거래소
  },
  "overallStatus": "PASSED",
  "failedTests": [],
  "recommendations": []
}
```

## 주의사항

⚠️ **중요:**
- 이 테스트는 **실제 네트워크**에 연결합니다
- Testnet이지만 **실제 거래소 API**를 호출합니다
- Rate Limit에 주의하세요 (일부 거래소는 Testnet에도 제한이 있습니다)
- 테스트 중 실제 주문이 생성/취소됩니다
- 장시간 실행되는 테스트가 있습니다 (최대 1시간)

⚠️ **절대 금지:**
- Production 환경에서 테스트 실행 금지
- Mainnet 자격증명 사용 금지
- 대량의 주문을 동시에 생성하여 Rate Limit 초과 금지

## CI/CD 통합

### GitHub Actions 예제

```yaml
name: Production E2E Tests

on:
  schedule:
    - cron: '0 0 * * *'  # 매일 자정 실행
  workflow_dispatch:

jobs:
  production-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Production E2E Tests
        env:
          HYPERLIQUID_PRIVATE_KEY: ${{ secrets.HYPERLIQUID_TESTNET_KEY }}
          HYPERLIQUID_TESTNET: true
          GRVT_PRIVATE_KEY: ${{ secrets.GRVT_TESTNET_KEY }}
          GRVT_API_KEY: ${{ secrets.GRVT_TESTNET_API_KEY }}
          GRVT_TESTNET: true
          # ... 다른 환경 변수
        run: npm run test:production

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: production-test-results
          path: ./results/
```

## 모니터링 및 알림

### 실패 시 알림

테스트 실패 시 다음 채널로 알림을 받을 수 있습니다:
- Slack
- Discord
- Email
- PagerDuty

설정 방법은 `docs/monitoring-setup.md` 참고

## 다음 단계

1. ✅ Production E2E 테스트 실행
2. ⏭️ 결과 분석 및 이슈 수정
3. ⏭️ Load Testing 및 벤치마크
4. ⏭️ Production 배포 승인
5. ⏭️ Production 모니터링 설정

## 문의

문제가 발생하면 다음을 확인하세요:
1. `.env.production` 파일의 자격증명이 올바른지
2. Testnet 자금이 충분한지
3. 네트워크 연결이 안정적인지
4. Rate Limit을 초과하지 않았는지

더 자세한 도움이 필요하면 GitHub Issues를 생성하세요.
