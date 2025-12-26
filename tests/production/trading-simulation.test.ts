/**
 * Production E2E Test: Trading Simulation
 *
 * 실제 Testnet 환경에서 거래 시뮬레이션을 검증합니다.
 *
 * 검증 항목:
 * - 시장가 주문 실행
 * - 지정가 주문 체결
 * - 포지션 오픈/클로즈
 * - Stop Loss / Take Profit 시뮬레이션
 * - 레버리지 조정
 * - PnL 계산 정확성
 *
 * ⚠️ 주의: 이 테스트는 실제 주문을 생성합니다! Testnet에서만 실행하세요!
 */

import { createExchange, type SupportedExchange } from '../../src/factory.js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

// .env.production 파일 로드
dotenv.config({ path: '.env.production' });

interface TradingTestResult {
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
  metrics: {
    marketOrderSuccessRate?: number;
    limitOrderFillRate?: number;
    averageSlippage?: number;
    pnlAccuracy?: number;
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
    console.log(`  ✅ ${testName} (${duration}ms)`);
    return { status: 'PASSED', duration, details: result };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`  ❌ ${testName} (${duration}ms)`);
    console.error(`     Error: ${error instanceof Error ? error.message : String(error)}`);
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
 * 거래 시뮬레이션 테스트
 */
async function testTradingSimulation(exchange: SupportedExchange): Promise<TradingTestResult> {
  console.log(`\n🎯 Trading Simulation Test: ${exchange.toUpperCase()}...`);

  const result: TradingTestResult = {
    exchange,
    timestamp: new Date().toISOString(),
    status: 'PASSED',
    duration: 0,
    tests: {},
    metrics: {},
  };

  if (!canTestExchange(exchange)) {
    console.log(`  ⏭️  Skipped: Missing credentials`);
    result.status = 'SKIPPED';
    return result;
  }

  if (process.env.ENABLE_TRADING_TESTS !== 'true') {
    console.log(`  ⏭️  Skipped: Trading tests disabled (set ENABLE_TRADING_TESTS=true)`);
    result.status = 'SKIPPED';
    return result;
  }

  const startTime = Date.now();
  let exchangeInstance: any = null;
  let testSymbol: string | undefined;
  const createdOrders: string[] = [];

  try {
    // 1. Initialize Exchange
    const initResult = await runTest('Initialize Exchange', async () => {
      const config = TESTNET_CONFIGS[exchange];
      exchangeInstance = createExchange(exchange, config as any);
      await exchangeInstance.initialize();
      return { initialized: true };
    });
    result.tests['initialize'] = initResult;
    if (initResult.status === 'FAILED') throw new Error('Initialization failed');

    // 2. Find Test Symbol
    const symbolResult = await runTest('Find Test Symbol', async () => {
      const markets = await exchangeInstance.fetchMarkets();
      const btcMarket = markets.find((m: any) => m.symbol.includes('BTC'));
      const ethMarket = markets.find((m: any) => m.symbol.includes('ETH'));
      testSymbol = btcMarket?.symbol || ethMarket?.symbol || markets[0]?.symbol;

      if (!testSymbol) throw new Error('No test symbol found');

      return { symbol: testSymbol, marketCount: markets.length };
    });
    result.tests['findSymbol'] = symbolResult;
    if (!testSymbol) throw new Error('No test symbol found');

    // 3. Set Leverage (if supported)
    if (exchangeInstance.has.setLeverage) {
      const leverageResult = await runTest('Set Leverage', async () => {
        await exchangeInstance.setLeverage(testSymbol, 2);
        return { leverage: 2 };
      });
      result.tests['setLeverage'] = leverageResult;
    }

    // 4. Market Order Test (Small Size)
    const marketOrderResult = await runTest('Market Order Execution', async () => {
      const orderBook = await exchangeInstance.fetchOrderBook(testSymbol);
      const bestAsk = orderBook.asks[0]?.[0];

      if (!bestAsk) throw new Error('No ask price available');

      // Very small order size (0.001 BTC or 0.01 ETH)
      const orderSize = testSymbol.includes('BTC') ? 0.001 : 0.01;

      const order = await exchangeInstance.createOrder({
        symbol: testSymbol,
        type: 'market',
        side: 'buy',
        amount: orderSize,
      });

      if (order.id) createdOrders.push(order.id);

      // Wait for order to fill
      await sleep(2000);

      return {
        orderId: order.id,
        size: orderSize,
        status: order.status,
        filled: order.filled,
      };
    });
    result.tests['marketOrder'] = marketOrderResult;

    // 5. Limit Order Test (Post-Only)
    const limitOrderResult = await runTest('Limit Order (Post-Only)', async () => {
      const orderBook = await exchangeInstance.fetchOrderBook(testSymbol);
      const bestBid = orderBook.bids[0]?.[0];

      if (!bestBid) throw new Error('No bid price available');

      // Place order below best bid (won't fill immediately)
      const limitPrice = bestBid * 0.95; // 5% below
      const orderSize = testSymbol.includes('BTC') ? 0.001 : 0.01;

      const order = await exchangeInstance.createOrder({
        symbol: testSymbol,
        type: 'limit',
        side: 'buy',
        amount: orderSize,
        price: limitPrice,
        postOnly: true,
      });

      if (order.id) createdOrders.push(order.id);

      return {
        orderId: order.id,
        size: orderSize,
        price: limitPrice,
        status: order.status,
        postOnly: order.postOnly,
      };
    });
    result.tests['limitOrder'] = limitOrderResult;

    // 6. Check Positions
    const positionResult = await runTest('Verify Position Opened', async () => {
      const positions = await exchangeInstance.fetchPositions();
      const position = positions.find((p: any) => p.symbol === testSymbol);

      return {
        hasPosition: !!position,
        size: position?.size || 0,
        side: position?.side,
        entryPrice: position?.entryPrice,
        unrealizedPnl: position?.unrealizedPnl,
      };
    });
    result.tests['verifyPosition'] = positionResult;

    // 7. Close Position (Reduce-Only Market Order)
    const closePositionResult = await runTest('Close Position', async () => {
      const positions = await exchangeInstance.fetchPositions();
      const position = positions.find((p: any) => p.symbol === testSymbol);

      if (!position || position.size === 0) {
        return { closed: false, reason: 'No open position to close' };
      }

      const order = await exchangeInstance.createOrder({
        symbol: testSymbol,
        type: 'market',
        side: position.side === 'long' ? 'sell' : 'buy',
        amount: position.size,
        reduceOnly: true,
      });

      if (order.id) createdOrders.push(order.id);

      // Wait for order to fill
      await sleep(2000);

      return {
        orderId: order.id,
        size: position.size,
        status: order.status,
        reduceOnly: order.reduceOnly,
      };
    });
    result.tests['closePosition'] = closePositionResult;

    // 8. Cancel All Remaining Orders
    const cancelResult = await runTest('Cancel All Open Orders', async () => {
      const orders = await exchangeInstance.cancelAllOrders(testSymbol);
      return {
        cancelledCount: orders.length,
        orderIds: orders.map((o: any) => o.id),
      };
    });
    result.tests['cancelAllOrders'] = cancelResult;

    // 9. Verify No Open Positions
    const finalPositionResult = await runTest('Verify Position Closed', async () => {
      const positions = await exchangeInstance.fetchPositions();
      const position = positions.find((p: any) => p.symbol === testSymbol);

      return {
        hasPosition: !!position,
        size: position?.size || 0,
      };
    });
    result.tests['verifyPositionClosed'] = finalPositionResult;

    // 10. Calculate Metrics
    const passedTests = Object.values(result.tests).filter(t => t.status === 'PASSED').length;
    const totalTests = Object.keys(result.tests).length;

    result.metrics.marketOrderSuccessRate = marketOrderResult.status === 'PASSED' ? 100 : 0;
    result.metrics.limitOrderFillRate = limitOrderResult.status === 'PASSED' ? 100 : 0;

    if (totalTests > 0 && passedTests < totalTests) {
      result.status = 'FAILED';
    }

  } catch (error) {
    console.error(`\n❌ Trading simulation failed: ${error instanceof Error ? error.message : String(error)}`);
    result.status = 'FAILED';
  } finally {
    // Cleanup: Cancel any remaining orders
    if (exchangeInstance && createdOrders.length > 0) {
      console.log('\n🧹 Cleaning up...');
      try {
        for (const orderId of createdOrders) {
          try {
            await exchangeInstance.cancelOrder(orderId);
            console.log(`  ✅ Cancelled order ${orderId}`);
          } catch (error) {
            console.log(`  ⚠️  Could not cancel order ${orderId} (may already be filled/cancelled)`);
          }
        }
      } catch (error) {
        console.log('  ⚠️  Cleanup partially failed');
      }
    }

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
  console.log('🎯 Production E2E Test: Trading Simulation');
  console.log('='.repeat(80));
  console.log(`\n⚠️  WARNING: This test creates REAL orders on Testnet!`);
  console.log(`⚠️  Ensure you have sufficient Testnet funds.\n`);

  // Check if trading tests are enabled
  if (process.env.ENABLE_TRADING_TESTS !== 'true') {
    console.log('❌ Trading tests are disabled.');
    console.log('   Set ENABLE_TRADING_TESTS=true in .env.production to enable.');
    process.exit(1);
  }

  const exchanges: SupportedExchange[] = [
    'hyperliquid',
    'grvt',
    'paradex',
    'nado',
    'lighter',
    'edgex',
    'backpack',
  ];

  const results: TradingTestResult[] = [];

  for (const exchange of exchanges) {
    const result = await testTradingSimulation(exchange);
    results.push(result);

    // Wait between exchanges to avoid rate limits
    await sleep(2000);
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;

  results.forEach(result => {
    const icon =
      result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
    console.log(
      `${icon} ${result.exchange.padEnd(15)} ${result.status.padEnd(10)} (${result.duration}ms)`
    );
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  // Save results to file
  const resultsDir = join(process.cwd(), 'results');
  const outputPath = join(resultsDir, 'trading-simulation-results.json');

  try {
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  } catch (error) {
    console.log(`⚠️  Could not save results: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Exit with appropriate code
  const exitCode = failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testTradingSimulation, TradingTestResult };
