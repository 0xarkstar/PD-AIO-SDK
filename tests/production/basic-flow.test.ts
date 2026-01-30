/**
 * Production E2E Test: Basic Flow
 *
 * 실제 Testnet 환경에서 기본적인 거래 플로우를 검증합니다.
 *
 * 검증 항목:
 * - Exchange 초기화
 * - Markets 조회
 * - Order Book 조회
 * - Balance 조회
 * - 주문 생성 (Limit Order)
 * - 주문 조회
 * - 주문 취소
 * - Position 조회
 * - 정상적인 연결 종료
 */

import { createExchange, type SupportedExchange } from '../../src/factory.js';
import { Wallet } from 'ethers';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

// .env.production 파일 로드
dotenv.config({ path: '.env.production' });

interface TestResult {
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
  metrics?: {
    avgResponseTime?: number;
    orderSuccessRate?: number;
  };
}

/**
 * Testnet configurations for each exchange
 *
 * Environment variable mapping:
 * - PRIVATE_KEY: EVM/Ethereum private key (EIP-712 signing)
 * - STARK_PRIVATE_KEY: StarkNet/StarkEx private key (Pedersen hash)
 * - API_KEY: API authentication key
 * - API_SECRET: API signing secret (HMAC)
 */
const TESTNET_CONFIGS = {
  // EIP-712 signature based
  hyperliquid: {
    privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
    testnet: true,
  },
  nado: {
    privateKey: process.env.NADO_PRIVATE_KEY,
    testnet: true,
  },

  // API Key + HMAC signature based
  lighter: {
    apiKey: process.env.LIGHTER_API_KEY,
    apiSecret: process.env.LIGHTER_API_SECRET,
    testnet: true,
  },

  // StarkEx L2 signature based
  edgex: {
    starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY,
    testnet: true,
  },

  // EIP-712 + API Key
  grvt: {
    privateKey: process.env.GRVT_PRIVATE_KEY,
    apiKey: process.env.GRVT_API_KEY,
    testnet: true,
  },

  // StarkNet signature based
  paradex: {
    starkPrivateKey: process.env.PARADEX_STARK_PRIVATE_KEY,
    testnet: true,
  },

  // ED25519 API credentials
  backpack: {
    apiKey: process.env.BACKPACK_API_KEY,
    secretKey: process.env.BACKPACK_SECRET_KEY,
    testnet: true,
  },

  // API Key + optional StarkNet
  extended: {
    apiKey: process.env.EXTENDED_API_KEY,
    testnet: true,
  },

  // HMAC signature (API in development)
  variational: {
    apiKey: process.env.VARIATIONAL_API_KEY,
    apiSecret: process.env.VARIATIONAL_API_SECRET,
    testnet: true,
  },
};

/**
 * 거래소별 테스트 가능 여부 확인
 */
function canTestExchange(exchange: SupportedExchange): boolean {
  const config = TESTNET_CONFIGS[exchange as keyof typeof TESTNET_CONFIGS];
  if (!config) return false;

  switch (exchange) {
    // EIP-712 signature based
    case 'hyperliquid':
    case 'nado':
      return !!(config as any).privateKey;

    // API Key + HMAC signature based
    case 'lighter':
      return !!((config as any).apiKey && (config as any).apiSecret);

    // StarkEx L2 signature based
    case 'edgex':
      return !!(config as any).starkPrivateKey;

    // EIP-712 + API Key
    case 'grvt':
      return !!((config as any).privateKey && (config as any).apiKey);

    // StarkNet signature based
    case 'paradex':
      return !!(config as any).starkPrivateKey;

    // ED25519 API credentials
    case 'backpack':
      return !!((config as any).apiKey && (config as any).secretKey);

    // API Key based
    case 'extended':
      return !!(config as any).apiKey;

    // HMAC signature based
    case 'variational':
      return !!((config as any).apiKey && (config as any).apiSecret);

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
 * 거래소별 기본 플로우 테스트
 */
async function testExchangeBasicFlow(exchange: SupportedExchange): Promise<TestResult> {
  console.log(`\n🔍 Testing ${exchange.toUpperCase()}...`);

  const result: TestResult = {
    exchange,
    timestamp: new Date().toISOString(),
    status: 'PASSED',
    duration: 0,
    tests: {},
  };

  if (!canTestExchange(exchange)) {
    console.log(`  ⏭️  Skipped: Missing credentials`);
    result.status = 'SKIPPED';
    return result;
  }

  const startTime = Date.now();
  let exchangeInstance: any = null;

  try {
    // 1. Exchange 초기화
    const initResult = await runTest('Initialize Exchange', async () => {
      const config = TESTNET_CONFIGS[exchange];
      exchangeInstance = createExchange(exchange, config as any);
      await exchangeInstance.initialize();
      return { initialized: true };
    });
    result.tests['initialize'] = initResult;
    if (initResult.status === 'FAILED') throw new Error('Initialization failed');

    // 2. Markets 조회
    const marketsResult = await runTest('Fetch Markets', async () => {
      const markets = await exchangeInstance.fetchMarkets();
      if (!markets || markets.length === 0) {
        throw new Error('No markets returned');
      }
      return { marketCount: markets.length, sampleMarket: markets[0]?.symbol };
    });
    result.tests['fetchMarkets'] = marketsResult;

    // 3. Order Book 조회
    let testSymbol: string | undefined;
    const orderBookResult = await runTest('Fetch Order Book', async () => {
      const markets = await exchangeInstance.fetchMarkets();
      // BTC 또는 ETH 마켓 찾기
      const btcMarket = markets.find((m: any) => m.symbol.includes('BTC'));
      const ethMarket = markets.find((m: any) => m.symbol.includes('ETH'));
      testSymbol = btcMarket?.symbol || ethMarket?.symbol || markets[0]?.symbol;

      if (!testSymbol) throw new Error('No test symbol found');

      const orderBook = await exchangeInstance.fetchOrderBook(testSymbol);
      if (!orderBook || !orderBook.bids || !orderBook.asks) {
        throw new Error('Invalid order book structure');
      }
      return {
        symbol: testSymbol,
        bidsCount: orderBook.bids.length,
        asksCount: orderBook.asks.length,
        bestBid: orderBook.bids[0]?.[0],
        bestAsk: orderBook.asks[0]?.[0],
      };
    });
    result.tests['fetchOrderBook'] = orderBookResult;

    // 4. Balance 조회
    const balanceResult = await runTest('Fetch Balance', async () => {
      const balance = await exchangeInstance.fetchBalance();
      if (!balance) throw new Error('No balance returned');
      return {
        currencies: Object.keys(balance).length,
        sample: Object.keys(balance)[0],
      };
    });
    result.tests['fetchBalance'] = balanceResult;

    // 5. Ticker 조회
    if (testSymbol) {
      const tickerResult = await runTest('Fetch Ticker', async () => {
        const ticker = await exchangeInstance.fetchTicker(testSymbol);
        if (!ticker) throw new Error('No ticker returned');
        return {
          symbol: ticker.symbol,
          last: ticker.last,
          bid: ticker.bid,
          ask: ticker.ask,
          volume: ticker.volume,
        };
      });
      result.tests['fetchTicker'] = tickerResult;
    }

    // 6. Positions 조회
    const positionsResult = await runTest('Fetch Positions', async () => {
      const positions = await exchangeInstance.fetchPositions();
      return {
        positionCount: positions?.length || 0,
        hasOpenPositions: positions?.length > 0,
      };
    });
    result.tests['fetchPositions'] = positionsResult;

    // 7. 주문 생성 (매우 작은 금액으로 테스트)
    // 주의: 실제 주문이 생성됩니다. Testnet에서만 실행하세요!
    if (testSymbol && process.env.ENABLE_ORDER_TESTS === 'true') {
      let orderId: string | undefined;

      const createOrderResult = await runTest('Create Limit Order', async () => {
        const orderBook = await exchangeInstance.fetchOrderBook(testSymbol);
        const bestBid = orderBook.bids[0]?.[0];

        if (!bestBid) throw new Error('No best bid price');

        // 현재가보다 훨씬 낮은 가격으로 주문 (체결되지 않도록)
        const price = Number(bestBid) * 0.5;

        const order = await exchangeInstance.createOrder({
          symbol: testSymbol,
          type: 'limit',
          side: 'buy',
          amount: 0.001, // 매우 작은 수량
          price,
        });

        if (!order || !order.id) throw new Error('Order creation failed');
        orderId = order.id;

        return {
          orderId: order.id,
          symbol: order.symbol,
          type: order.type,
          side: order.side,
          amount: order.amount,
          price: order.price,
          status: order.status,
        };
      });
      result.tests['createOrder'] = createOrderResult;

      // 8. 주문 조회
      if (orderId) {
        const fetchOrderResult = await runTest('Fetch Order', async () => {
          const order = await exchangeInstance.fetchOrder(orderId, testSymbol);
          if (!order) throw new Error('Order not found');
          return {
            orderId: order.id,
            status: order.status,
          };
        });
        result.tests['fetchOrder'] = fetchOrderResult;

        // 9. 주문 취소
        const cancelOrderResult = await runTest('Cancel Order', async () => {
          await exchangeInstance.cancelOrder(orderId, testSymbol);
          return { cancelled: true };
        });
        result.tests['cancelOrder'] = cancelOrderResult;
      }
    }

    // 10. 연결 종료
    const disconnectResult = await runTest('Disconnect', async () => {
      await exchangeInstance.disconnect();
      return { disconnected: true };
    });
    result.tests['disconnect'] = disconnectResult;

    // 전체 성공 여부 확인
    const failedTests = Object.values(result.tests).filter((t) => t.status === 'FAILED');
    result.status = failedTests.length === 0 ? 'PASSED' : 'FAILED';
  } catch (error) {
    result.status = 'FAILED';
    console.error(`  💥 Fatal error: ${error instanceof Error ? error.message : String(error)}`);
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

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('🚀 Starting Production E2E Tests - Basic Flow\n');
  console.log('='.repeat(60));

  const exchanges: SupportedExchange[] = ['hyperliquid', 'grvt', 'paradex', 'nado', 'lighter', 'edgex', 'backpack'];

  // CLI 인자로 특정 거래소만 테스트
  const targetExchange = process.argv[2];
  const exchangesToTest = targetExchange
    ? exchanges.filter((e) => e === targetExchange)
    : exchanges;

  const results: TestResult[] = [];

  for (const exchange of exchangesToTest) {
    const result = await testExchangeBasicFlow(exchange);
    results.push(result);
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
    const passedTests = Object.values(r.tests).filter((t) => t.status === 'PASSED').length;
    const totalTests = Object.keys(r.tests).length;
    console.log(`\n${icon} ${r.exchange.toUpperCase()}: ${r.status}`);
    if (totalTests > 0) {
      console.log(`   Tests: ${passedTests}/${totalTests} passed`);
      console.log(`   Duration: ${r.duration}ms`);
    }
  });

  // 결과를 JSON 파일로 저장
  const outputDir = join(process.cwd(), 'results');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputPath = join(outputDir, `basic-flow-${timestamp}.json`);

  try {
    const fs = await import('fs/promises');
    await fs.mkdir(outputDir, { recursive: true });
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          testDate: new Date().toISOString(),
          testType: 'basic-flow',
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

  // 실패한 테스트가 있으면 exit code 1
  process.exit(failed > 0 ? 1 : 0);
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
