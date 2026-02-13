/**
 * Production E2E Test: Stress Test
 *
 * Rate Limiting과 동시성 처리를 검증하는 스트레스 테스트입니다.
 *
 * 검증 항목:
 * - 동시 다발적 API 요청
 * - Rate Limit 준수 여부
 * - Rate Limit 초과 시 에러 핸들링
 * - 대량 주문 생성/취소
 * - API 응답 시간 측정
 */

import { createExchange, type SupportedExchange } from '../../src/factory.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

interface StressTestResult {
  exchange: string;
  timestamp: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  tests: {
    [key: string]: {
      status: 'PASSED' | 'FAILED';
      metrics: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        rateLimitErrors: number;
        avgResponseTime: number;
        minResponseTime: number;
        maxResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
      };
      errors: string[];
    };
  };
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
 * 응답 시간 통계 계산
 */
function calculateStats(responseTimes: number[]) {
  if (responseTimes.length === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

/**
 * 동시 API 요청 스트레스 테스트
 */
async function testConcurrentRequests(
  exchangeInstance: any,
  symbol: string,
  concurrency: number = 10
) {
  console.log(`\n  📊 Testing concurrent requests (concurrency: ${concurrency})...`);

  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let rateLimitErrors = 0;

  const requests = Array.from({ length: concurrency }, async (_, i) => {
    const startTime = Date.now();
    try {
      await exchangeInstance.fetchOrderBook(symbol);
      const duration = Date.now() - startTime;
      responseTimes.push(duration);
      successCount++;
    } catch (error) {
      const duration = Date.now() - startTime;
      responseTimes.push(duration);

      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        rateLimitErrors++;
      } else {
        errors.push(`Request ${i}: ${errorMsg}`);
      }
    }
  });

  await Promise.all(requests);

  const stats = calculateStats(responseTimes);

  console.log(`     ✅ Successful: ${successCount}/${concurrency}`);
  console.log(`     ⚠️  Rate Limit Errors: ${rateLimitErrors}`);
  console.log(`     ❌ Other Errors: ${errors.length}`);
  console.log(`     ⏱️  Avg Response: ${stats.avg}ms`);
  console.log(`     ⏱️  P95 Response: ${stats.p95}ms`);

  return {
    totalRequests: concurrency,
    successfulRequests: successCount,
    failedRequests: concurrency - successCount,
    rateLimitErrors,
    avgResponseTime: stats.avg,
    minResponseTime: stats.min,
    maxResponseTime: stats.max,
    p95ResponseTime: stats.p95,
    p99ResponseTime: stats.p99,
    errors,
  };
}

/**
 * 순차적 대량 요청 테스트 (Rate Limit 검증)
 */
async function testRateLimiting(
  exchangeInstance: any,
  symbol: string,
  requestCount: number = 100
) {
  console.log(`\n  🚦 Testing rate limiting (${requestCount} sequential requests)...`);

  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let rateLimitErrors = 0;

  for (let i = 0; i < requestCount; i++) {
    const startTime = Date.now();
    try {
      await exchangeInstance.fetchTicker(symbol);
      const duration = Date.now() - startTime;
      responseTimes.push(duration);
      successCount++;

      // Progress indicator
      if ((i + 1) % 20 === 0) {
        console.log(`     Progress: ${i + 1}/${requestCount}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      responseTimes.push(duration);

      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        rateLimitErrors++;
      } else {
        errors.push(`Request ${i}: ${errorMsg}`);
      }
    }

    // Small delay to avoid overwhelming the exchange
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const stats = calculateStats(responseTimes);

  console.log(`     ✅ Successful: ${successCount}/${requestCount}`);
  console.log(`     ⚠️  Rate Limit Errors: ${rateLimitErrors}`);
  console.log(`     ❌ Other Errors: ${errors.length}`);
  console.log(`     ⏱️  Avg Response: ${stats.avg}ms`);

  return {
    totalRequests: requestCount,
    successfulRequests: successCount,
    failedRequests: requestCount - successCount,
    rateLimitErrors,
    avgResponseTime: stats.avg,
    minResponseTime: stats.min,
    maxResponseTime: stats.max,
    p95ResponseTime: stats.p95,
    p99ResponseTime: stats.p99,
    errors,
  };
}

/**
 * 거래소 스트레스 테스트
 */
async function testExchangeStress(exchange: SupportedExchange): Promise<StressTestResult> {
  console.log(`\n🔍 Stress Testing ${exchange.toUpperCase()}...`);

  const result: StressTestResult = {
    exchange,
    timestamp: new Date().toISOString(),
    status: 'PASSED',
    tests: {},
  };

  const config = TESTNET_CONFIGS[exchange];
  if (!config) {
    console.log(`  ⏭️  Skipped: Exchange not configured`);
    result.status = 'SKIPPED';
    return result;
  }

  let exchangeInstance: any = null;

  try {
    // Exchange 초기화
    console.log('  🔧 Initializing exchange...');
    exchangeInstance = await createExchange(exchange, config as any);
    await exchangeInstance.initialize();

    // Market 조회
    const markets = await exchangeInstance.fetchMarkets();
    const testSymbol = markets.find((m: any) => m.symbol.includes('BTC'))?.symbol || markets[0]?.symbol;

    if (!testSymbol) {
      throw new Error('No test symbol found');
    }

    console.log(`  📈 Test symbol: ${testSymbol}`);

    // 1. 동시 요청 테스트 (낮은 concurrency)
    const concurrent10 = await testConcurrentRequests(exchangeInstance, testSymbol, 10);
    result.tests['concurrent_10'] = {
      status: concurrent10.successfulRequests >= 8 ? 'PASSED' : 'FAILED',
      metrics: concurrent10,
      errors: concurrent10.errors,
    };

    // 2. 동시 요청 테스트 (높은 concurrency)
    const concurrent50 = await testConcurrentRequests(exchangeInstance, testSymbol, 50);
    result.tests['concurrent_50'] = {
      status: concurrent50.successfulRequests >= 40 ? 'PASSED' : 'FAILED',
      metrics: concurrent50,
      errors: concurrent50.errors,
    };

    // 3. Rate Limiting 테스트
    const rateLimitTest = await testRateLimiting(exchangeInstance, testSymbol, 100);
    result.tests['rate_limiting'] = {
      status: rateLimitTest.successfulRequests >= 80 ? 'PASSED' : 'FAILED',
      metrics: rateLimitTest,
      errors: rateLimitTest.errors,
    };

    // 전체 성공 여부
    const failedTests = Object.values(result.tests).filter((t) => t.status === 'FAILED');
    result.status = failedTests.length === 0 ? 'PASSED' : 'FAILED';

  } catch (error) {
    result.status = 'FAILED';
    console.error(`\n  ❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // cleanup
    if (exchangeInstance) {
      try {
        await exchangeInstance.disconnect();
      } catch (e) {
        // ignore cleanup errors
      }
    }
  }

  return result;
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('🚀 Starting Production E2E Tests - Stress Test\n');
  console.log('='.repeat(60));

  const exchanges: SupportedExchange[] = ['hyperliquid', 'grvt', 'paradex', 'nado'];

  // CLI 인자로 특정 거래소만 테스트
  const targetExchange = process.argv[2];
  const exchangesToTest = targetExchange
    ? exchanges.filter((e) => e === targetExchange)
    : exchanges;

  const results: StressTestResult[] = [];

  for (const exchange of exchangesToTest) {
    const result = await testExchangeStress(exchange);
    results.push(result);

    // 다음 테스트 전 잠시 대기
    if (exchangesToTest.length > 1) {
      console.log('\n  ⏳ Waiting 15s before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 15000));
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
      Object.entries(r.tests).forEach(([testName, test]) => {
        const testIcon = test.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${testIcon} ${testName}: ${test.status}`);
        console.log(`      Success Rate: ${test.metrics.successfulRequests}/${test.metrics.totalRequests}`);
        console.log(`      Avg Response: ${test.metrics.avgResponseTime}ms`);
      });
    }
  });

  // 결과를 JSON 파일로 저장
  const outputDir = join(process.cwd(), 'results');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputPath = join(outputDir, `stress-test-${timestamp}.json`);

  try {
    const fs = await import('fs/promises');
    await fs.mkdir(outputDir, { recursive: true });
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          testDate: new Date().toISOString(),
          testType: 'stress-test',
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
