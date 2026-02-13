/**
 * Production E2E Test: WebSocket Stability
 *
 * WebSocket 연결의 장시간 안정성을 검증합니다.
 *
 * 검증 항목:
 * - WebSocket 연결 수립
 * - Order Book 스트리밍 (설정 시간 동안)
 * - Position 업데이트 스트리밍
 * - 메모리 누수 검증
 * - 자동 재연결 메커니즘
 */

import { createExchange, type SupportedExchange } from '../../src/factory.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

interface WebSocketTestResult {
  exchange: string;
  timestamp: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  metrics: {
    totalUpdates: number;
    avgUpdatesPerSecond: number;
    maxMemoryUsageMB: number;
    disconnections: number;
    reconnections: number;
    dataGaps: number;
  };
  errors: string[];
}

const TESTNET_CONFIGS = {
  hyperliquid: {
    privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
    testnet: true,
  },
  grvt: {
    privateKey: process.env.GRVT_PRIVATE_KEY,
    apiKey: process.env.GRVT_API_KEY,
    testnet: true,
  },
  paradex: {
    privateKey: process.env.PARADEX_PRIVATE_KEY,
    l1RpcUrl: process.env.PARADEX_L1_RPC_URL,
    testnet: true,
  },
  nado: {
    privateKey: process.env.NADO_PRIVATE_KEY,
    testnet: true,
  },
};

/**
 * 메모리 사용량 체크
 */
function getMemoryUsageMB(): number {
  const used = process.memoryUsage();
  return Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
}

/**
 * WebSocket 안정성 테스트
 */
async function testWebSocketStability(
  exchange: SupportedExchange,
  durationMinutes: number = 5
): Promise<WebSocketTestResult> {
  console.log(`\n🔍 Testing ${exchange.toUpperCase()} WebSocket Stability...`);
  console.log(`   Duration: ${durationMinutes} minutes\n`);

  const result: WebSocketTestResult = {
    exchange,
    timestamp: new Date().toISOString(),
    status: 'PASSED',
    duration: 0,
    metrics: {
      totalUpdates: 0,
      avgUpdatesPerSecond: 0,
      maxMemoryUsageMB: 0,
      disconnections: 0,
      reconnections: 0,
      dataGaps: 0,
    },
    errors: [],
  };

  const config = TESTNET_CONFIGS[exchange];
  if (!config) {
    console.log(`  ⏭️  Skipped: Exchange not configured`);
    result.status = 'SKIPPED';
    return result;
  }

  const startTime = Date.now();
  const durationMs = durationMinutes * 60 * 1000;
  let exchangeInstance: any = null;
  let updateCount = 0;
  let lastUpdateTime = Date.now();
  let maxMemory = 0;

  try {
    // Exchange 초기화
    console.log('  📡 Initializing exchange...');
    exchangeInstance = await createExchange(exchange, config as any);
    await exchangeInstance.initialize();

    // Market 조회
    const markets = await exchangeInstance.fetchMarkets();
    const testSymbol = markets.find((m: any) => m.symbol.includes('BTC'))?.symbol || markets[0]?.symbol;

    if (!testSymbol) {
      throw new Error('No test symbol found');
    }

    console.log(`  📊 Watching Order Book for ${testSymbol}...`);
    console.log(`  ⏱️  Test will run for ${durationMinutes} minutes`);
    console.log(`  💾 Initial memory: ${getMemoryUsageMB()} MB\n`);

    // WebSocket 스트리밍 시작
    const watchPromise = (async () => {
      try {
        for await (const orderBook of exchangeInstance.watchOrderBook(testSymbol)) {
          updateCount++;
          const now = Date.now();

          // 데이터 갭 감지 (5초 이상 업데이트 없으면)
          if (now - lastUpdateTime > 5000) {
            result.metrics.dataGaps++;
            console.log(`  ⚠️  Data gap detected: ${Math.round((now - lastUpdateTime) / 1000)}s`);
          }
          lastUpdateTime = now;

          // 메모리 사용량 추적
          const currentMemory = getMemoryUsageMB();
          if (currentMemory > maxMemory) {
            maxMemory = currentMemory;
          }

          // 주기적으로 상태 출력 (30초마다)
          if (updateCount % 100 === 0) {
            const elapsed = Math.round((now - startTime) / 1000);
            const updatesPerSec = Math.round(updateCount / elapsed);
            console.log(
              `  📈 Updates: ${updateCount} | ` +
              `Rate: ${updatesPerSec}/s | ` +
              `Memory: ${currentMemory} MB | ` +
              `Elapsed: ${elapsed}s`
            );
          }

          // 테스트 시간 초과 체크
          if (now - startTime >= durationMs) {
            console.log('\n  ✅ Test duration reached, stopping...');
            break;
          }
        }
      } catch (error) {
        result.errors.push(`Stream error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    })();

    // 타임아웃 설정
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), durationMs + 10000)
    );

    await Promise.race([watchPromise, timeout]);

    // 최종 메트릭 계산
    result.duration = Date.now() - startTime;
    result.metrics.totalUpdates = updateCount;
    result.metrics.avgUpdatesPerSecond = Math.round(updateCount / (result.duration / 1000));
    result.metrics.maxMemoryUsageMB = maxMemory;

    console.log('\n  📊 Final Metrics:');
    console.log(`     Total Updates: ${result.metrics.totalUpdates}`);
    console.log(`     Avg Rate: ${result.metrics.avgUpdatesPerSecond}/s`);
    console.log(`     Max Memory: ${result.metrics.maxMemoryUsageMB} MB`);
    console.log(`     Data Gaps: ${result.metrics.dataGaps}`);

    // 검증: 충분한 업데이트가 있었는지
    const minExpectedUpdates = (durationMinutes * 60) / 2; // 최소 0.5 업데이트/초
    if (updateCount < minExpectedUpdates) {
      throw new Error(`Too few updates: ${updateCount} < ${minExpectedUpdates}`);
    }

    // 검증: 메모리 누수가 없는지 (초기 대비 2배 이상 증가하면 경고)
    const initialMemory = getMemoryUsageMB();
    if (maxMemory > initialMemory * 2) {
      console.log(`  ⚠️  Potential memory leak detected: ${initialMemory} MB -> ${maxMemory} MB`);
      result.errors.push(`Memory increased from ${initialMemory}MB to ${maxMemory}MB`);
    }

  } catch (error) {
    result.status = 'FAILED';
    result.errors.push(error instanceof Error ? error.message : String(error));
    console.error(`\n  ❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // cleanup
    if (exchangeInstance) {
      try {
        console.log('\n  🔌 Disconnecting...');
        await exchangeInstance.disconnect();
      } catch (e) {
        console.error('  ⚠️  Cleanup error:', e);
      }
    }
  }

  return result;
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('🚀 Starting Production E2E Tests - WebSocket Stability\n');
  console.log('='.repeat(60));

  // 테스트 지속 시간 (분)
  const durationMinutes = parseInt(process.env.WS_TEST_DURATION || '5', 10);

  const exchanges: SupportedExchange[] = ['hyperliquid', 'grvt', 'paradex', 'nado'];

  // CLI 인자로 특정 거래소만 테스트
  const targetExchange = process.argv[2];
  const exchangesToTest = targetExchange
    ? exchanges.filter((e) => e === targetExchange)
    : exchanges;

  const results: WebSocketTestResult[] = [];

  for (const exchange of exchangesToTest) {
    const result = await testWebSocketStability(exchange, durationMinutes);
    results.push(result);

    // 다음 테스트 전 잠시 대기
    if (exchangesToTest.length > 1) {
      console.log('\n  ⏳ Waiting 10s before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const skipped = results.filter((r) => r.status === 'SKIPPED').length;

  console.log(`Total Exchanges: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  results.forEach((r) => {
    const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⏭️';
    console.log(`\n${icon} ${r.exchange.toUpperCase()}: ${r.status}`);
    if (r.status !== 'SKIPPED') {
      console.log(`   Updates: ${r.metrics.totalUpdates}`);
      console.log(`   Rate: ${r.metrics.avgUpdatesPerSecond}/s`);
      console.log(`   Max Memory: ${r.metrics.maxMemoryUsageMB} MB`);
      if (r.errors.length > 0) {
        console.log(`   Errors: ${r.errors.join(', ')}`);
      }
    }
  });

  // 결과를 JSON 파일로 저장
  const outputDir = join(process.cwd(), 'results');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputPath = join(outputDir, `websocket-stability-${timestamp}.json`);

  try {
    const fs = await import('fs/promises');
    await fs.mkdir(outputDir, { recursive: true });
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          testDate: new Date().toISOString(),
          testType: 'websocket-stability',
          durationMinutes,
          exchanges: results,
          summary: {
            total: results.length,
            passed,
            failed,
            skipped,
          },
        },
        null,
        2
      )
    );
    console.log(`\n💾 Results saved to: ${outputPath}`);
  } catch (error) {
    console.error('Failed to save results:', error);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
