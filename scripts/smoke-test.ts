/**
 * Smoke Test - Real API calls against all 20 exchanges
 *
 * Tests public endpoints (no auth required):
 * - createExchange() + initialize()
 * - fetchMarkets()
 * - fetchTicker('BTC/USD:USD' or equivalent)
 * - fetchOrderBook('BTC/USD:USD' or equivalent)
 *
 * Usage: npx tsx scripts/smoke-test.ts
 */

// Catch unhandled errors (WebSocket heartbeat timeouts etc.)
process.on('uncaughtException', (err) => {
  console.error(`\n⚠️  Uncaught: ${err.message}`);
});
process.on('unhandledRejection', (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n⚠️  Unhandled rejection: ${msg}`);
});

import { createExchange, getSupportedExchanges } from '../src/index.js';
import type { SupportedExchange } from '../src/index.js';

// Some exchanges use different BTC symbol formats
// All symbols in UNIFIED format (base/quote:settle)
const BTC_SYMBOLS: Partial<Record<string, string>> = {
  hyperliquid: 'BTC/USDT:USDT',
  lighter: 'BTC/USDC:USDC',
  grvt: 'BTC/USDT:USDT',
  paradex: 'BTC/USD:USD',
  edgex: 'BTC/USDT:USDT',
  backpack: 'BTC/USDC:USDC',
  nado: 'BTC/USDC:USDC',
  variational: 'BTC/USD:USD',
  extended: 'BTC/USD:USD',
  dydx: 'BTC/USD:USD',
  jupiter: 'BTC/USD:USD',
  drift: 'BTC/USD:USD',
  gmx: 'BTC/USD:USD',
  aster: 'BTC/USDT:USDT',
  pacifica: 'BTC/USD:USD',
  ostium: 'BTC/USD:USD',
  reya: 'BTC/USD:USD',
  ethereal: 'BTC/USD:USD',
  avantis: 'BTC/USD:USD',
};

// Exchanges that don't have orderbooks by design (oracle/AMM-based)
const NO_ORDERBOOK = new Set(['gmx', 'ostium', 'avantis', 'jupiter', 'reya']);
// Exchanges where orderbook requires authentication
const OB_NEEDS_AUTH = new Set(['paradex']);

interface TestResult {
  exchange: string;
  initialize: '✅' | '❌' | '⏭️';
  fetchMarkets: '✅' | '❌' | '⏭️';
  marketCount: number;
  fetchTicker: '✅' | '❌' | '⏭️';
  tickerPrice: string;
  fetchOrderBook: '✅' | '❌' | '⏭️';
  obDepth: string;
  errors: string[];
  timeMs: number;
}

async function testExchange(name: string): Promise<TestResult> {
  const result: TestResult = {
    exchange: name,
    initialize: '⏭️',
    fetchMarkets: '⏭️',
    marketCount: 0,
    fetchTicker: '⏭️',
    tickerPrice: '-',
    fetchOrderBook: '⏭️',
    obDepth: '-',
    errors: [],
    timeMs: 0,
  };

  const start = Date.now();

  try {
    // 1. Create + Initialize
    const exchange = await createExchange(name as SupportedExchange);
    try {
      await exchange.initialize();
      result.initialize = '✅';
    } catch (e: unknown) {
      result.initialize = '❌';
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`init: ${msg.slice(0, 80)}`);
      result.timeMs = Date.now() - start;
      return result;
    }

    // 2. fetchMarkets
    try {
      const markets = await exchange.fetchMarkets();
      result.fetchMarkets = '✅';
      result.marketCount = markets.length;
    } catch (e: unknown) {
      result.fetchMarkets = '❌';
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`markets: ${msg.slice(0, 80)}`);
    }

    // 3. fetchTicker
    const symbol = BTC_SYMBOLS[name] ?? 'BTC/USD:USD';
    try {
      const ticker = await exchange.fetchTicker(symbol);
      result.fetchTicker = '✅';
      result.tickerPrice = ticker.last?.toString() ?? ticker.mark?.toString() ?? 'null';
    } catch (e: unknown) {
      result.fetchTicker = '❌';
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`ticker(${symbol}): ${msg.slice(0, 80)}`);
    }

    // 4. fetchOrderBook (skip for oracle DEXes and auth-required)
    if (NO_ORDERBOOK.has(name)) {
      result.fetchOrderBook = '⏭️';
      result.obDepth = 'n/a (oracle)';
    } else if (OB_NEEDS_AUTH.has(name)) {
      result.fetchOrderBook = '⏭️';
      result.obDepth = 'n/a (auth)';
    } else {
      try {
        const ob = await exchange.fetchOrderBook(symbol);
        result.fetchOrderBook = '✅';
        result.obDepth = `${ob.bids.length}b/${ob.asks.length}a`;
      } catch (e: unknown) {
        result.fetchOrderBook = '❌';
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`ob(${symbol}): ${msg.slice(0, 80)}`);
      }
    }

    // Cleanup - close WebSocket connections to prevent heartbeat leaks
    try {
      if (typeof (exchange as any).close === 'function') {
        await (exchange as any).close();
      }
      if (typeof (exchange as any).wsManager?.close === 'function') {
        (exchange as any).wsManager.close();
      }
      if (typeof (exchange as any).disconnect === 'function') {
        await (exchange as any).disconnect();
      }
    } catch { /* ignore cleanup errors */ }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(`create: ${msg.slice(0, 100)}`);
  }

  result.timeMs = Date.now() - start;
  return result;
}

async function main() {
  const exchanges = getSupportedExchanges();
  console.log(`\n🔥 PD-AIO-SDK Smoke Test — ${exchanges.length} exchanges\n`);
  console.log('Testing public endpoints (no auth)...\n');

  const results: TestResult[] = [];

  // Run sequentially to avoid rate limits and make output readable
  for (const name of exchanges) {
    process.stdout.write(`  Testing ${name.padEnd(15)}... `);
    const result = await Promise.race([
      testExchange(name),
      new Promise<TestResult>((resolve) =>
        setTimeout(() => resolve({
          exchange: name, initialize: '❌', fetchMarkets: '⏭️', marketCount: 0,
          fetchTicker: '⏭️', tickerPrice: '-', fetchOrderBook: '⏭️', obDepth: '-',
          errors: ['TIMEOUT (15s)'], timeMs: 15000,
        }), 15000)
      ),
    ]);
    results.push(result);

    const status = [result.initialize, result.fetchMarkets, result.fetchTicker, result.fetchOrderBook].join(' ');
    console.log(`${status}  (${result.timeMs}ms)`);
  }

  // Summary table
  console.log('\n' + '='.repeat(100));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(100));
  console.log(
    'Exchange'.padEnd(15) +
    'Init'.padEnd(6) +
    'Markets'.padEnd(10) +
    'Count'.padEnd(8) +
    'Ticker'.padEnd(9) +
    'Price'.padEnd(14) +
    'OB'.padEnd(6) +
    'Depth'.padEnd(12) +
    'Time'
  );
  console.log('-'.repeat(100));

  for (const r of results) {
    console.log(
      r.exchange.padEnd(15) +
      r.initialize.padEnd(6) +
      r.fetchMarkets.padEnd(10) +
      String(r.marketCount).padEnd(8) +
      r.fetchTicker.padEnd(9) +
      r.tickerPrice.slice(0, 12).padEnd(14) +
      r.fetchOrderBook.padEnd(6) +
      r.obDepth.padEnd(12) +
      `${r.timeMs}ms`
    );
  }

  // Error details
  const withErrors = results.filter(r => r.errors.length > 0);
  if (withErrors.length > 0) {
    console.log('\n' + '='.repeat(100));
    console.log('ERRORS');
    console.log('='.repeat(100));
    for (const r of withErrors) {
      for (const err of r.errors) {
        console.log(`  ${r.exchange.padEnd(15)} ${err}`);
      }
    }
  }

  // Stats
  const passing = results.filter(r => r.initialize === '✅');
  const fullPass = results.filter(r =>
    r.initialize === '✅' && r.fetchMarkets === '✅' &&
    r.fetchTicker === '✅' && r.fetchOrderBook === '✅'
  );
  console.log(`\n📊 ${passing.length}/${results.length} initialized, ${fullPass.length}/${results.length} fully working\n`);
}

main().catch(console.error);
