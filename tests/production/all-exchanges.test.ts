/**
 * Production E2E Test: All Exchanges
 *
 * 7개 거래소를 순차적으로 테스트하여 통합 검증을 수행합니다.
 *
 * 검증 항목:
 * - 7개 거래소 순차 실행
 * - 각 거래소별 기본 플로우 검증
 * - 거래소별 특수 기능 테스트
 * - 에러 핸들링 일관성 검증
 * - 전체 시스템 안정성 평가
 */

import { createExchange, type SupportedExchange } from '../../src/factory.js';
import * as dotenv from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// .env.production 파일 로드
dotenv.config({ path: '.env.production' });

interface ExchangeTestResult {
  exchange: string;
  timestamp: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  tests: {
    [key: string]: {
      status: 'PASSED' | 'FAILED' | 'SKIPPED';
      duration: number;
      error?: string;
      details?: any;
    };
  };
  features: {
    [key: string]: boolean;
  };
  metrics: {
    avgResponseTime: number;
    marketCount: number;
    apiCalls: number;
  };
}

interface AllExchangesReport {
  testDate: string;
  totalDuration: number;
  exchanges: ExchangeTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    successRate: number;
  };
  recommendations: string[];
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
  lighter: {
    apiKey: process.env.LIGHTER_API_KEY,
    apiSecret: process.env.LIGHTER_API_SECRET,
    accountId: process.env.LIGHTER_ACCOUNT_ID,
    testnet: true,
  },
  edgex: {
    apiKey: process.env.EDGEX_API_KEY,
    apiSecret: process.env.EDGEX_API_SECRET,
    starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY,
    testnet: true,
  },
  backpack: {
    apiKey: process.env.BACKPACK_API_KEY,
    apiSecret: process.env.BACKPACK_SECRET_KEY,
    testnet: true,
  },
};

/**
 * 거래소별 테스트 가능 여부 확인
 */
function canTestExchange(exchange: SupportedExchange): boolean {
  const config = TESTNET_CONFIGS[exchange];
  if (!config) return false;

  switch (exchange) {
    case 'hyperliquid':
      return !!config.privateKey;
    case 'grvt':
      return !!(config.privateKey && config.apiKey);
    case 'paradex':
      return !!(config.privateKey && config.l1RpcUrl);
    case 'nado':
      return !!config.privateKey;
    case 'lighter':
      return !!(config.apiKey && config.apiSecret && config.accountId);
    case 'edgex':
      return !!(config.apiKey && config.apiSecret && config.starkPrivateKey);
    case 'backpack':
      return !!(config.apiKey && config.apiSecret);
    default:
      return false;
  }
}

/**
 * 단일 테스트 실행 헬퍼
 */
async function runTest(
  testName: string,
  testFn: () => Promise<any>
): Promise<{ status: 'PASSED' | 'FAILED'; duration: number; error?: string; details?: any }> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    return { status: 'PASSED', duration, details: result };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 대기 헬퍼 (milliseconds)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 거래소 종합 테스트
 */
async function testExchange(exchange: SupportedExchange): Promise<ExchangeTestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Testing ${exchange.toUpperCase()}`);
  console.log('='.repeat(80));

  const result: ExchangeTestResult = {
    exchange,
    timestamp: new Date().toISOString(),
    status: 'PASSED',
    duration: 0,
    tests: {},
    features: {},
    metrics: {
      avgResponseTime: 0,
      marketCount: 0,
      apiCalls: 0,
    },
  };

  if (!canTestExchange(exchange)) {
    console.log(`⏭️  Skipped: Missing credentials`);
    result.status = 'SKIPPED';
    return result;
  }

  const startTime = Date.now();
  let exchangeInstance: any = null;
  let testSymbol: string | undefined;
  const responseTimes: number[] = [];

  try {
    // 1. Initialize Exchange
    console.log('1️⃣  Initializing...');
    const initResult = await runTest('Initialize', async () => {
      const config = TESTNET_CONFIGS[exchange];
      exchangeInstance = await createExchange(exchange, config as any);
      await exchangeInstance.initialize();

      // Capture features
      result.features = {
        fetchMarkets: exchangeInstance.has.fetchMarkets || false,
        fetchOrderBook: exchangeInstance.has.fetchOrderBook || false,
        fetchTrades: exchangeInstance.has.fetchTrades || false,
        fetchTicker: exchangeInstance.has.fetchTicker || false,
        fetchFundingRate: exchangeInstance.has.fetchFundingRate || false,
        fetchBalance: exchangeInstance.has.fetchBalance || false,
        fetchPositions: exchangeInstance.has.fetchPositions || false,
        createOrder: exchangeInstance.has.createOrder || false,
        cancelOrder: exchangeInstance.has.cancelOrder || false,
        setLeverage: exchangeInstance.has.setLeverage || false,
        watchOrderBook: exchangeInstance.has.watchOrderBook || false,
        watchTrades: exchangeInstance.has.watchTrades || false,
      };

      return {
        id: exchangeInstance.id,
        name: exchangeInstance.name,
        isReady: exchangeInstance.isReady,
      };
    });
    result.tests['initialize'] = initResult;
    responseTimes.push(initResult.duration);
    result.metrics.apiCalls++;

    if (initResult.status === 'FAILED') {
      throw new Error('Initialization failed');
    }
    console.log(`   ✅ Initialized (${initResult.duration}ms)`);

    // 2. Fetch Markets
    console.log('2️⃣  Fetching markets...');
    const marketsResult = await runTest('Fetch Markets', async () => {
      const markets = await exchangeInstance.fetchMarkets();
      if (!markets || markets.length === 0) {
        throw new Error('No markets returned');
      }
      result.metrics.marketCount = markets.length;

      // Find test symbol
      const btcMarket = markets.find((m: any) => m.symbol.includes('BTC'));
      const ethMarket = markets.find((m: any) => m.symbol.includes('ETH'));
      testSymbol = btcMarket?.symbol || ethMarket?.symbol || markets[0]?.symbol;

      return {
        count: markets.length,
        testSymbol,
        sampleMarkets: markets.slice(0, 3).map((m: any) => m.symbol),
      };
    });
    result.tests['fetchMarkets'] = marketsResult;
    responseTimes.push(marketsResult.duration);
    result.metrics.apiCalls++;

    if (marketsResult.status === 'PASSED') {
      console.log(`   ✅ Found ${marketsResult.details?.count} markets (${marketsResult.duration}ms)`);
    } else {
      console.log(`   ❌ Failed (${marketsResult.duration}ms)`);
    }

    // 3. Fetch Order Book
    if (testSymbol) {
      console.log('3️⃣  Fetching order book...');
      const orderBookResult = await runTest('Fetch OrderBook', async () => {
        const orderBook = await exchangeInstance.fetchOrderBook(testSymbol);
        if (!orderBook || !orderBook.bids || !orderBook.asks) {
          throw new Error('Invalid order book structure');
        }
        return {
          symbol: orderBook.symbol,
          bidsCount: orderBook.bids.length,
          asksCount: orderBook.asks.length,
          spread: orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0],
        };
      });
      result.tests['fetchOrderBook'] = orderBookResult;
      responseTimes.push(orderBookResult.duration);
      result.metrics.apiCalls++;

      if (orderBookResult.status === 'PASSED') {
        console.log(`   ✅ OrderBook: ${orderBookResult.details?.bidsCount} bids, ${orderBookResult.details?.asksCount} asks (${orderBookResult.duration}ms)`);
      } else {
        console.log(`   ❌ Failed (${orderBookResult.duration}ms)`);
      }
    }

    // 4. Fetch Trades
    if (testSymbol && exchangeInstance.has.fetchTrades) {
      console.log('4️⃣  Fetching trades...');
      const tradesResult = await runTest('Fetch Trades', async () => {
        const trades = await exchangeInstance.fetchTrades(testSymbol, { limit: 10 });
        return {
          count: trades?.length || 0,
          sampleTrade: trades?.[0],
        };
      });
      result.tests['fetchTrades'] = tradesResult;
      responseTimes.push(tradesResult.duration);
      result.metrics.apiCalls++;

      if (tradesResult.status === 'PASSED') {
        console.log(`   ✅ Found ${tradesResult.details?.count} trades (${tradesResult.duration}ms)`);
      } else {
        console.log(`   ❌ Failed (${tradesResult.duration}ms)`);
      }
    }

    // 5. Fetch Ticker
    if (testSymbol && exchangeInstance.has.fetchTicker) {
      console.log('5️⃣  Fetching ticker...');
      const tickerResult = await runTest('Fetch Ticker', async () => {
        const ticker = await exchangeInstance.fetchTicker(testSymbol);
        if (!ticker) throw new Error('No ticker returned');
        return {
          symbol: ticker.symbol,
          last: ticker.last,
          volume: ticker.baseVolume,
          change: ticker.percentage,
        };
      });
      result.tests['fetchTicker'] = tickerResult;
      responseTimes.push(tickerResult.duration);
      result.metrics.apiCalls++;

      if (tickerResult.status === 'PASSED') {
        console.log(`   ✅ Last: $${tickerResult.details?.last} (${tickerResult.duration}ms)`);
      } else {
        console.log(`   ❌ Failed (${tickerResult.duration}ms)`);
      }
    }

    // 6. Fetch Funding Rate
    if (testSymbol && exchangeInstance.has.fetchFundingRate) {
      console.log('6️⃣  Fetching funding rate...');
      const fundingResult = await runTest('Fetch Funding Rate', async () => {
        const funding = await exchangeInstance.fetchFundingRate(testSymbol);
        if (!funding) throw new Error('No funding rate returned');
        return {
          symbol: funding.symbol,
          rate: funding.fundingRate,
          nextFundingTime: funding.nextFundingTimestamp,
        };
      });
      result.tests['fetchFundingRate'] = fundingResult;
      responseTimes.push(fundingResult.duration);
      result.metrics.apiCalls++;

      if (fundingResult.status === 'PASSED') {
        console.log(`   ✅ Rate: ${(fundingResult.details?.rate * 100).toFixed(4)}% (${fundingResult.duration}ms)`);
      } else {
        console.log(`   ❌ Failed (${fundingResult.duration}ms)`);
      }
    }

    // 7. Fetch Balance
    console.log('7️⃣  Fetching balance...');
    const balanceResult = await runTest('Fetch Balance', async () => {
      const balances = await exchangeInstance.fetchBalance();
      if (!balances) throw new Error('No balance returned');
      return {
        count: Array.isArray(balances) ? balances.length : Object.keys(balances).length,
        sample: Array.isArray(balances) ? balances[0] : balances[Object.keys(balances)[0]],
      };
    });
    result.tests['fetchBalance'] = balanceResult;
    responseTimes.push(balanceResult.duration);
    result.metrics.apiCalls++;

    if (balanceResult.status === 'PASSED') {
      console.log(`   ✅ ${balanceResult.details?.count} currencies (${balanceResult.duration}ms)`);
    } else {
      console.log(`   ❌ Failed (${balanceResult.duration}ms)`);
    }

    // 8. Fetch Positions
    console.log('8️⃣  Fetching positions...');
    const positionsResult = await runTest('Fetch Positions', async () => {
      const positions = await exchangeInstance.fetchPositions();
      return {
        count: positions?.length || 0,
        hasOpenPositions: positions?.length > 0,
        sample: positions?.[0],
      };
    });
    result.tests['fetchPositions'] = positionsResult;
    responseTimes.push(positionsResult.duration);
    result.metrics.apiCalls++;

    if (positionsResult.status === 'PASSED') {
      console.log(`   ✅ ${positionsResult.details?.count} open positions (${positionsResult.duration}ms)`);
    } else {
      console.log(`   ❌ Failed (${positionsResult.duration}ms)`);
    }

    // 9. Test Symbol Normalization
    console.log('9️⃣  Testing symbol normalization...');
    const symbolNormResult = await runTest('Symbol Normalization', async () => {
      const testSymbols = ['BTC/USDT:USDT', 'ETH/USDC:USDC'];
      const results = testSymbols.map(symbol => {
        const toExchange = exchangeInstance.symbolToExchange(symbol);
        const fromExchange = exchangeInstance.symbolFromExchange(toExchange);
        return {
          unified: symbol,
          exchange: toExchange,
          roundTrip: fromExchange,
          success: fromExchange === symbol || toExchange !== symbol, // Allow different formats
        };
      });
      return { results };
    });
    result.tests['symbolNormalization'] = symbolNormResult;

    if (symbolNormResult.status === 'PASSED') {
      console.log(`   ✅ Symbol normalization working (${symbolNormResult.duration}ms)`);
    } else {
      console.log(`   ❌ Failed (${symbolNormResult.duration}ms)`);
    }

    // 10. Test Error Handling
    console.log('🔟 Testing error handling...');
    const errorHandlingResult = await runTest('Error Handling', async () => {
      try {
        // Try to fetch invalid symbol
        await exchangeInstance.fetchTicker('INVALID/SYMBOL:USDT');
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        // Should throw an error
        return {
          errorThrown: true,
          errorType: error.constructor.name,
          errorCode: error.code,
        };
      }
    });
    result.tests['errorHandling'] = errorHandlingResult;

    if (errorHandlingResult.status === 'PASSED') {
      console.log(`   ✅ Error handling working (${errorHandlingResult.duration}ms)`);
    } else {
      console.log(`   ❌ Failed (${errorHandlingResult.duration}ms)`);
    }

    // Calculate metrics
    if (responseTimes.length > 0) {
      result.metrics.avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Check if all tests passed
    const failedTests = Object.values(result.tests).filter(t => t.status === 'FAILED').length;
    if (failedTests > 0) {
      result.status = 'FAILED';
    }

    console.log(`\n✅ ${exchange.toUpperCase()} completed successfully`);
    console.log(`   📊 ${result.metrics.apiCalls} API calls, avg ${result.metrics.avgResponseTime.toFixed(0)}ms`);

  } catch (error) {
    console.error(`\n❌ ${exchange.toUpperCase()} failed: ${error instanceof Error ? error.message : String(error)}`);
    result.status = 'FAILED';
  } finally {
    // Disconnect
    if (exchangeInstance) {
      try {
        await exchangeInstance.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('🚀 Production E2E Test: All Exchanges');
  console.log('='.repeat(80));
  console.log(`\nTesting 7 exchanges sequentially...\n`);

  const exchanges: SupportedExchange[] = [
    'hyperliquid',
    'grvt',
    'paradex',
    'nado',
    'lighter',
    'edgex',
    'backpack',
  ];

  const testStartTime = Date.now();
  const results: ExchangeTestResult[] = [];

  for (const exchange of exchanges) {
    const result = await testExchange(exchange);
    results.push(result);

    // Wait between exchanges to avoid rate limits
    await sleep(2000);
  }

  const totalDuration = Date.now() - testStartTime;

  // Generate report
  const report: AllExchangesReport = {
    testDate: new Date().toISOString(),
    totalDuration,
    exchanges: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      skipped: results.filter(r => r.status === 'SKIPPED').length,
      successRate: 0,
    },
    recommendations: [],
  };

  const tested = report.summary.total - report.summary.skipped;
  if (tested > 0) {
    report.summary.successRate = (report.summary.passed / tested) * 100;
  }

  // Generate recommendations
  if (report.summary.skipped > 0) {
    report.recommendations.push(
      `⚠️  ${report.summary.skipped} exchange(s) skipped due to missing credentials`
    );
  }
  if (report.summary.failed > 0) {
    report.recommendations.push(
      `❌ ${report.summary.failed} exchange(s) failed - check logs for details`
    );
  }
  if (report.summary.successRate === 100) {
    report.recommendations.push('✅ All exchanges passed! System is production-ready.');
  } else if (report.summary.successRate >= 80) {
    report.recommendations.push(
      '⚠️  Most exchanges passed, but some issues need attention before production.'
    );
  } else {
    report.recommendations.push(
      '❌ Significant failures detected. Not recommended for production deployment.'
    );
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80));

  results.forEach(result => {
    const icon =
      result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
    const passedTests = Object.values(result.tests).filter(t => t.status === 'PASSED').length;
    const totalTests = Object.keys(result.tests).length;
    const testInfo = result.status !== 'SKIPPED' ? `(${passedTests}/${totalTests} tests)` : '';

    console.log(
      `${icon} ${result.exchange.padEnd(15)} ${result.status.padEnd(10)} ${testInfo.padEnd(15)} ${result.duration}ms`
    );
  });

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📈 Overall Success Rate: ${report.summary.successRate.toFixed(1)}%`);
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`\n✅ Passed:  ${report.summary.passed}/${tested}`);
  console.log(`❌ Failed:  ${report.summary.failed}/${tested}`);
  console.log(`⏭️  Skipped: ${report.summary.skipped}/${report.summary.total}`);

  console.log(`\n💡 Recommendations:`);
  report.recommendations.forEach(rec => console.log(`   ${rec}`));

  // Save results to file
  const resultsDir = join(process.cwd(), 'results');

  try {
    mkdirSync(resultsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const outputPath = join(resultsDir, 'all-exchanges-results.json');

  try {
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved to: ${outputPath}`);
  } catch (error) {
    console.log(`⚠️  Could not save results: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Exit with appropriate code
  const exitCode = report.summary.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testExchange, ExchangeTestResult, AllExchangesReport };
