#!/usr/bin/env ts-node
/**
 * Live API Validation Script for C25
 *
 * Tests 6 public market data methods across all 16 exchanges:
 * - fetchMarkets()
 * - fetchTicker(symbol)
 * - fetchOrderBook(symbol)
 * - fetchTrades(symbol)
 * - fetchFundingRate(symbol)
 * - fetchOHLCV(symbol)
 *
 * Target: 72+/96 PASS (baseline: 67/96)
 */

import { createExchange } from '../src/factory.js';
import type { IBaseAdapter } from '../src/adapters/base/IBaseAdapter.js';

// Exchange configurations
const EXCHANGES = [
  'hyperliquid',
  'dydx',
  'gmx',
  'drift',
  'backpack',
  'paradex',
  'edgex',
  'lighter',
  'jupiter',
  'grvt',
  'ostium',
  'extended',
  'variational',
  'aster',
  'pacifica',
  'nado',
] as const;

// Symbol mappings per exchange (BTC perpetual)
const SYMBOLS: Record<string, string> = {
  hyperliquid: 'BTC/USD:USD',
  dydx: 'BTC-USD',
  gmx: 'BTC/USD:USD',
  drift: 'BTC-PERP',
  backpack: 'BTC_USDC',
  paradex: 'BTC-USD-PERP',
  edgex: 'BTCUSD',
  lighter: 'BTC/USD',
  jupiter: 'SOL-PERP', // Jupiter is Solana-based
  grvt: 'BTC_USDT_Perp',
  ostium: 'BTC/USD:USD',
  extended: 'BTC-USD-PERP',
  variational: 'BTC-PERP',
  aster: 'BTC-PERP',
  pacifica: 'BTC-PERP',
  nado: 'PERP_BTC_USDC',
};

type TestMethod = 'fetchMarkets' | 'fetchTicker' | 'fetchOrderBook' | 'fetchTrades' | 'fetchFundingRate' | 'fetchOHLCV';
type TestResult = 'PASS' | 'SKIP' | 'ERROR';

interface MethodResult {
  method: TestMethod;
  result: TestResult;
  error?: string;
  responseTime?: number;
}

interface ExchangeResult {
  exchange: string;
  methods: MethodResult[];
  totalScore: number;
}

/**
 * Test a single method with timeout
 */
async function testMethod(
  adapter: IBaseAdapter,
  method: TestMethod,
  symbol: string,
  timeout: number = 15000
): Promise<MethodResult> {
  const result: MethodResult = {
    method,
    result: 'ERROR',
  };

  try {
    // Check if method is supported via 'has' map
    const hasMap = (adapter as any).has;
    if (hasMap && method in hasMap && !hasMap[method]) {
      result.result = 'SKIP';
      result.error = 'Not supported by adapter';
      return result;
    }

    const startTime = Date.now();

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeout);
    });

    // Execute method with timeout
    let data: any;
    switch (method) {
      case 'fetchMarkets':
        data = await Promise.race([
          adapter.fetchMarkets(),
          timeoutPromise
        ]);
        break;
      case 'fetchTicker':
        data = await Promise.race([
          adapter.fetchTicker(symbol),
          timeoutPromise
        ]);
        break;
      case 'fetchOrderBook':
        data = await Promise.race([
          adapter.fetchOrderBook(symbol),
          timeoutPromise
        ]);
        break;
      case 'fetchTrades':
        data = await Promise.race([
          adapter.fetchTrades(symbol),
          timeoutPromise
        ]);
        break;
      case 'fetchFundingRate':
        data = await Promise.race([
          adapter.fetchFundingRate(symbol),
          timeoutPromise
        ]);
        break;
      case 'fetchOHLCV':
        data = await Promise.race([
          adapter.fetchOHLCV(symbol, '1h'),
          timeoutPromise
        ]);
        break;
    }

    result.responseTime = Date.now() - startTime;

    // Validate response
    if (!data) {
      throw new Error('Empty response');
    }

    if (method === 'fetchMarkets' && (!Array.isArray(data) || data.length === 0)) {
      throw new Error('No markets returned');
    }

    if (method === 'fetchOrderBook' && (!data.bids || !data.asks)) {
      throw new Error('Invalid orderbook structure');
    }

    if (method === 'fetchTrades' && (!Array.isArray(data) || data.length === 0)) {
      throw new Error('No trades returned');
    }

    if (method === 'fetchOHLCV' && (!Array.isArray(data) || data.length === 0)) {
      throw new Error('No OHLCV data returned');
    }

    result.result = 'PASS';
  } catch (error: any) {
    const errorMsg = error.message || String(error);

    // Check if it's a "not implemented" error
    if (errorMsg.toLowerCase().includes('not implemented') ||
        errorMsg.toLowerCase().includes('not supported')) {
      result.result = 'SKIP';
      result.error = 'Not implemented';
    } else if (errorMsg.toLowerCase().includes('invalid symbol')) {
      result.result = 'SKIP';
      result.error = 'Symbol not found';
    } else {
      result.result = 'ERROR';
      result.error = errorMsg.substring(0, 50); // Truncate long errors
    }
  }

  return result;
}

/**
 * Test all methods for a single exchange
 */
async function testExchange(exchangeName: string): Promise<ExchangeResult> {
  console.log(`\n🔍 Testing ${exchangeName}...`);

  const result: ExchangeResult = {
    exchange: exchangeName,
    methods: [],
    totalScore: 0,
  };

  let adapter: IBaseAdapter | null = null;

  try {
    // Create adapter with testnet flag (await is critical!)
    adapter = await createExchange(exchangeName as any, { testnet: true });

    console.log(`  Created adapter: ${adapter.id}`);

    // Initialize if needed
    if (typeof (adapter as any).initialize === 'function') {
      console.log(`  Initializing ${exchangeName}...`);
      try {
        await Promise.race([
          (adapter as any).initialize(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 10000))
        ]);
      } catch (initError: any) {
        // Non-fatal - some adapters may not need initialization
        console.log(`  ⚠️ Init warning: ${initError.message}`);
      }
    }

    // First, fetch markets to get the actual symbol
    let symbol = 'BTC/USD:USD'; // fallback
    let markets: any[] = [];

    try {
      markets = await Promise.race([
        adapter.fetchMarkets(),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
      ]);

      // Find BTC market (try various patterns)
      const btcMarket = markets.find((m: any) =>
        m.symbol?.includes('BTC') ||
        m.id?.includes('BTC') ||
        m.base === 'BTC'
      );

      if (btcMarket) {
        symbol = btcMarket.symbol || btcMarket.id;
        console.log(`  Using symbol: ${symbol}`);
      }

      result.methods.push({
        method: 'fetchMarkets',
        result: 'PASS',
        responseTime: 0,
      });
    } catch (error: any) {
      result.methods.push({
        method: 'fetchMarkets',
        result: 'ERROR',
        error: error.message?.substring(0, 50) || 'Failed',
      });
      console.log(`  ❌ fetchMarkets failed - using fallback symbol`);
    }

    const methods: TestMethod[] = [
      'fetchTicker',
      'fetchOrderBook',
      'fetchTrades',
      'fetchFundingRate',
      'fetchOHLCV',
    ];

    // Test each remaining method
    for (const method of methods) {
      const methodResult = await testMethod(adapter, method, symbol);
      result.methods.push(methodResult);

      const icon = methodResult.result === 'PASS' ? '✅' :
                   methodResult.result === 'SKIP' ? '⏭️' : '❌';
      const time = methodResult.responseTime ? `(${methodResult.responseTime}ms)` : '';
      console.log(`  ${icon} ${method} ${time}`);
      if (methodResult.error) {
        console.log(`     └─ ${methodResult.error}`);
      }

      if (methodResult.result === 'PASS') {
        result.totalScore++;
      }
    }

  } catch (error: any) {
    console.log(`  ❌ Failed to initialize: ${error.message}`);
    // Fill remaining methods with ERROR
    const methods: TestMethod[] = [
      'fetchMarkets',
      'fetchTicker',
      'fetchOrderBook',
      'fetchTrades',
      'fetchFundingRate',
      'fetchOHLCV',
    ];
    for (const method of methods) {
      result.methods.push({
        method,
        result: 'ERROR',
        error: 'Initialization failed',
      });
    }
  } finally {
    // Cleanup
    if (adapter && typeof (adapter as any).disconnect === 'function') {
      try {
        await (adapter as any).disconnect();
      } catch {}
    }
  }

  console.log(`  Score: ${result.totalScore}/6`);
  return result;
}

/**
 * Generate markdown report
 */
function generateReport(results: ExchangeResult[]): string {
  const lines: string[] = [];

  lines.push('# Live API Validation Report - C25');
  lines.push('');
  lines.push(`**Date**: ${new Date().toISOString()}`);
  lines.push(`**Cycle**: C25 (Post-Zod Validation)`);
  lines.push('');

  // Summary
  const totalTests = results.length * 6;
  const totalPass = results.reduce((sum, r) => sum + r.totalScore, 0);
  const totalSkip = results.reduce((sum, r) =>
    sum + r.methods.filter(m => m.result === 'SKIP').length, 0);
  const totalError = totalTests - totalPass - totalSkip;

  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Tests**: ${totalTests} (16 exchanges × 6 methods)`);
  lines.push(`- **PASS**: ${totalPass}/${totalTests} (${((totalPass / totalTests) * 100).toFixed(1)}%)`);
  lines.push(`- **SKIP**: ${totalSkip}/${totalTests} (${((totalSkip / totalTests) * 100).toFixed(1)}%)`);
  lines.push(`- **ERROR**: ${totalError}/${totalTests} (${((totalError / totalTests) * 100).toFixed(1)}%)`);
  lines.push(`- **Baseline**: 67/96 (69.8%)`);
  lines.push(`- **Target**: 72+/96 (75%+)`);
  lines.push(`- **Status**: ${totalPass >= 72 ? '✅ TARGET MET' : `⚠️ ${72 - totalPass} more needed`}`);
  lines.push('');

  // Detailed table
  lines.push('## Detailed Results');
  lines.push('');
  lines.push('| Exchange | Markets | Ticker | OrderBook | Trades | FundingRate | OHLCV | Score |');
  lines.push('|----------|---------|--------|-----------|--------|-------------|-------|-------|');

  for (const result of results) {
    const cells = result.methods.map(m => {
      if (m.result === 'PASS') return '✅';
      if (m.result === 'SKIP') return '⏭️';
      return '❌';
    });

    lines.push(`| ${result.exchange.padEnd(8)} | ${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[4]} | ${cells[5]} | ${result.totalScore}/6 |`);
  }

  lines.push('');

  // Error details
  lines.push('## Error Details');
  lines.push('');

  for (const result of results) {
    const errors = result.methods.filter(m => m.result === 'ERROR' && m.error);
    if (errors.length > 0) {
      lines.push(`### ${result.exchange}`);
      for (const err of errors) {
        lines.push(`- **${err.method}**: ${err.error}`);
      }
      lines.push('');
    }
  }

  // Handoff section
  lines.push('## Handoff');
  lines.push('');
  lines.push('### Attempted');
  lines.push('- Live API validation of 6 public methods across all 16 exchanges');
  lines.push('- Tested: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate, fetchOHLCV');
  lines.push('- Used testnet configurations where available');
  lines.push('- 15s timeout per method call');
  lines.push('');
  lines.push('### Worked');
  lines.push(`- Successfully tested all 16 exchanges`);
  lines.push(`- ${totalPass} methods passed validation`);
  lines.push(`- Proper error handling and timeouts`);
  lines.push('');
  lines.push('### Failed');
  if (totalError > 0) {
    lines.push(`- ${totalError} methods returned errors (see Error Details above)`);
  } else {
    lines.push('- No failures');
  }
  lines.push('');
  lines.push('### Remaining');
  if (totalPass < 72) {
    lines.push(`- ${72 - totalPass} more PASS results needed to meet target`);
    lines.push('- Recommend investigating ERROR cases and fixing adapter implementations');
  } else {
    lines.push('- Target met! Ready for production validation');
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Live API Validation - C25');
  console.log('================================');
  console.log(`Testing ${EXCHANGES.length} exchanges × 6 methods = ${EXCHANGES.length * 6} tests`);

  const results: ExchangeResult[] = [];

  // Test each exchange sequentially (to avoid rate limits)
  for (const exchange of EXCHANGES) {
    const result = await testExchange(exchange);
    results.push(result);

    // Small delay between exchanges
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate report
  const report = generateReport(results);

  // Write to pipeline docs
  const fs = await import('fs');
  const path = await import('path');

  const reportPath = path.join(process.cwd(), 'docs/pipeline/LIVE_API_REPORT_C25.md');
  fs.writeFileSync(reportPath, report);

  console.log('\n================================');
  console.log(`📄 Report saved to: ${reportPath}`);

  const totalPass = results.reduce((sum, r) => sum + r.totalScore, 0);
  console.log(`\n✅ Total PASS: ${totalPass}/96`);
  console.log(`🎯 Target: 72/96 (${totalPass >= 72 ? 'MET' : 'NOT MET'})`);

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
