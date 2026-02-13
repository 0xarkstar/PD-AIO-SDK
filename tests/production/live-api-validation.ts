/**
 * Live API Validation Script
 *
 * Tests all 16 PD-AIO-SDK exchange adapters against live mainnet public endpoints.
 * No auth required — public endpoints only.
 *
 * Usage: npx tsx tests/production/live-api-validation.ts
 */

import { createExchange, type SupportedExchange } from '../../src/factory.js';
import type { IExchangeAdapter } from '../../src/types/adapter.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXCHANGES: SupportedExchange[] = [
  'hyperliquid',
  'lighter',
  'grvt',
  'paradex',
  'edgex',
  'backpack',
  'nado',
  'variational',
  'extended',
  'dydx',
  'jupiter',
  'drift',
  'gmx',
  'aster',
  'pacifica',
  'ostium',
];

const METHODS_TO_TEST = [
  'fetchMarkets',
  'fetchTicker',
  'fetchOrderBook',
  'fetchTrades',
  'fetchFundingRate',
  'fetchOHLCV',
] as const;

type MethodName = (typeof METHODS_TO_TEST)[number];

type Status = 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';

interface MethodResult {
  status: Status;
  durationMs: number;
  error?: string;
  details?: string;
}

interface ExchangeResult {
  exchange: string;
  symbol: string;
  methods: Record<MethodName, MethodResult>;
  initDurationMs: number;
  initError?: string;
}

const METHOD_TIMEOUT_MS = 15_000;
const INTER_EXCHANGE_DELAY_MS = 1500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function makeSkipResult(reason: string): MethodResult {
  return { status: 'SKIP', durationMs: 0, details: reason };
}

function makeErrorResult(error: unknown, durationMs: number): MethodResult {
  const msg = error instanceof Error ? error.message : String(error);
  return { status: 'ERROR', durationMs, error: msg };
}

async function testMethod(
  exchange: IExchangeAdapter,
  method: MethodName,
  symbol: string
): Promise<MethodResult> {
  // Check if method is supported via `has` feature map
  const hasFlag = exchange.has[method];
  if (hasFlag === false) {
    return makeSkipResult(`has.${method} === false`);
  }
  // If undefined in has map, still try — some adapters don't list all features

  const start = Date.now();
  try {
    switch (method) {
      case 'fetchMarkets': {
        const markets = await withTimeout(exchange.fetchMarkets(), METHOD_TIMEOUT_MS);
        const elapsed = Date.now() - start;
        if (!Array.isArray(markets) || markets.length === 0) {
          return { status: 'FAIL', durationMs: elapsed, error: 'Empty or non-array result' };
        }
        const m = markets[0]!;
        const checks: string[] = [];
        if (typeof m.symbol !== 'string') checks.push('symbol not string');
        if (typeof m.base !== 'string') checks.push('base not string');
        if (typeof m.quote !== 'string') checks.push('quote not string');
        if (checks.length > 0) {
          return { status: 'FAIL', durationMs: elapsed, error: checks.join('; ') };
        }
        return {
          status: 'PASS',
          durationMs: elapsed,
          details: `${markets.length} markets, first: ${m.symbol}`,
        };
      }

      case 'fetchTicker': {
        const ticker = await withTimeout(exchange.fetchTicker(symbol), METHOD_TIMEOUT_MS);
        const elapsed = Date.now() - start;
        const checks: string[] = [];
        if (typeof ticker.symbol !== 'string') checks.push('symbol not string');
        if (typeof ticker.last !== 'number' || ticker.last <= 0) checks.push(`last=${ticker.last}`);
        if (typeof ticker.bid !== 'number') checks.push('bid not number');
        if (typeof ticker.ask !== 'number') checks.push('ask not number');
        if (checks.length > 0) {
          return { status: 'FAIL', durationMs: elapsed, error: checks.join('; ') };
        }
        return {
          status: 'PASS',
          durationMs: elapsed,
          details: `last=${ticker.last}, bid=${ticker.bid}, ask=${ticker.ask}`,
        };
      }

      case 'fetchOrderBook': {
        const ob = await withTimeout(exchange.fetchOrderBook(symbol), METHOD_TIMEOUT_MS);
        const elapsed = Date.now() - start;
        const checks: string[] = [];
        if (!Array.isArray(ob.bids)) checks.push('bids not array');
        if (!Array.isArray(ob.asks)) checks.push('asks not array');
        // PriceLevel is [price, amount] tuple
        if (ob.bids.length > 0) {
          const bid = ob.bids[0]!;
          if (!Array.isArray(bid) || typeof bid[0] !== 'number' || typeof bid[1] !== 'number') {
            checks.push('bids[0] invalid PriceLevel');
          }
        }
        if (ob.asks.length > 0) {
          const ask = ob.asks[0]!;
          if (!Array.isArray(ask) || typeof ask[0] !== 'number' || typeof ask[1] !== 'number') {
            checks.push('asks[0] invalid PriceLevel');
          }
        }
        if (checks.length > 0) {
          return { status: 'FAIL', durationMs: elapsed, error: checks.join('; ') };
        }
        return {
          status: 'PASS',
          durationMs: elapsed,
          details: `${ob.bids.length} bids, ${ob.asks.length} asks`,
        };
      }

      case 'fetchTrades': {
        const trades = await withTimeout(exchange.fetchTrades(symbol), METHOD_TIMEOUT_MS);
        const elapsed = Date.now() - start;
        if (!Array.isArray(trades) || trades.length === 0) {
          return { status: 'FAIL', durationMs: elapsed, error: 'Empty or non-array result' };
        }
        const t = trades[0]!;
        const checks: string[] = [];
        if (typeof t.price !== 'number' || t.price <= 0) checks.push(`price=${t.price}`);
        if (typeof t.amount !== 'number' || t.amount <= 0) checks.push(`amount=${t.amount}`);
        if (typeof t.timestamp !== 'number') checks.push('timestamp not number');
        if (t.side !== 'buy' && t.side !== 'sell') checks.push(`side=${t.side}`);
        if (checks.length > 0) {
          return { status: 'FAIL', durationMs: elapsed, error: checks.join('; ') };
        }
        return {
          status: 'PASS',
          durationMs: elapsed,
          details: `${trades.length} trades, first: ${t.price} @ ${t.amount}`,
        };
      }

      case 'fetchFundingRate': {
        const fr = await withTimeout(exchange.fetchFundingRate(symbol), METHOD_TIMEOUT_MS);
        const elapsed = Date.now() - start;
        const checks: string[] = [];
        if (typeof fr.symbol !== 'string') checks.push('symbol not string');
        if (typeof fr.fundingRate !== 'number') checks.push('fundingRate not number');
        if (typeof fr.fundingTimestamp !== 'number') checks.push('fundingTimestamp not number');
        if (checks.length > 0) {
          return { status: 'FAIL', durationMs: elapsed, error: checks.join('; ') };
        }
        return {
          status: 'PASS',
          durationMs: elapsed,
          details: `rate=${fr.fundingRate}, mark=${fr.markPrice}`,
        };
      }

      case 'fetchOHLCV': {
        const candles = await withTimeout(
          exchange.fetchOHLCV(symbol, '1h', { limit: 10 }),
          METHOD_TIMEOUT_MS
        );
        const elapsed = Date.now() - start;
        if (!Array.isArray(candles) || candles.length === 0) {
          return { status: 'FAIL', durationMs: elapsed, error: 'Empty or non-array result' };
        }
        // OHLCV is [timestamp, open, high, low, close, volume]
        const c = candles[0]!;
        const checks: string[] = [];
        if (!Array.isArray(c) || c.length < 6) {
          checks.push(`Invalid tuple: length=${Array.isArray(c) ? c.length : 'not array'}`);
        } else {
          for (let i = 0; i < 6; i++) {
            if (typeof c[i] !== 'number') checks.push(`c[${i}] not number`);
          }
        }
        if (checks.length > 0) {
          return { status: 'FAIL', durationMs: elapsed, error: checks.join('; ') };
        }
        return {
          status: 'PASS',
          durationMs: elapsed,
          details: `${candles.length} candles, first close=${c[4]}`,
        };
      }
    }
  } catch (err) {
    return makeErrorResult(err, Date.now() - start);
  }
}

async function testExchange(exchangeId: SupportedExchange): Promise<ExchangeResult> {
  const result: ExchangeResult = {
    exchange: exchangeId,
    symbol: '',
    methods: {} as Record<MethodName, MethodResult>,
    initDurationMs: 0,
  };

  // Initialize
  const initStart = Date.now();
  let adapter: IExchangeAdapter;
  try {
    adapter = await withTimeout(createExchange(exchangeId), METHOD_TIMEOUT_MS);
    await withTimeout(adapter.initialize(), METHOD_TIMEOUT_MS);
    result.initDurationMs = Date.now() - initStart;
  } catch (err) {
    result.initDurationMs = Date.now() - initStart;
    result.initError = err instanceof Error ? err.message : String(err);
    // Mark all methods as ERROR due to init failure
    for (const method of METHODS_TO_TEST) {
      result.methods[method] = makeErrorResult(`Init failed: ${result.initError}`, 0);
    }
    return result;
  }

  // Get first valid symbol from fetchMarkets
  try {
    const markets = await withTimeout(adapter.fetchMarkets(), METHOD_TIMEOUT_MS);
    // Prefer BTC market, fallback to first available
    const btcMarket = markets.find(
      (m) => m.base === 'BTC' || m.symbol.includes('BTC') || m.symbol.includes('btc')
    );
    const ethMarket = markets.find(
      (m) => m.base === 'ETH' || m.symbol.includes('ETH') || m.symbol.includes('eth')
    );
    const chosen = btcMarket ?? ethMarket ?? markets[0];
    result.symbol = chosen?.symbol ?? '';

    // Record fetchMarkets result
    if (!Array.isArray(markets) || markets.length === 0) {
      result.methods.fetchMarkets = {
        status: 'FAIL',
        durationMs: 0,
        error: 'Empty markets',
      };
    } else {
      const m = markets[0]!;
      const checks: string[] = [];
      if (typeof m.symbol !== 'string') checks.push('symbol not string');
      if (typeof m.base !== 'string') checks.push('base not string');
      if (typeof m.quote !== 'string') checks.push('quote not string');
      result.methods.fetchMarkets = {
        status: checks.length > 0 ? 'FAIL' : 'PASS',
        durationMs: 0,
        error: checks.length > 0 ? checks.join('; ') : undefined,
        details: `${markets.length} markets, using: ${result.symbol}`,
      };
    }
  } catch (err) {
    result.methods.fetchMarkets = makeErrorResult(err, 0);
    // Can't continue without a symbol
    for (const method of METHODS_TO_TEST) {
      if (method !== 'fetchMarkets') {
        result.methods[method] = makeErrorResult('No symbol — fetchMarkets failed', 0);
      }
    }
    try {
      await adapter.disconnect();
    } catch {
      // ignore
    }
    return result;
  }

  // Test remaining methods
  for (const method of METHODS_TO_TEST) {
    if (method === 'fetchMarkets') continue; // Already tested
    result.methods[method] = await testMethod(adapter, method, result.symbol);
  }

  // Cleanup
  try {
    await adapter.disconnect();
  } catch {
    // ignore
  }

  return result;
}

function generateReport(results: ExchangeResult[]): string {
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push('# Live API Validation Report');
  lines.push('');
  lines.push(`**Generated:** ${now}`);
  lines.push(`**Exchanges tested:** ${results.length}`);
  lines.push('');

  // Summary counts
  let totalPass = 0;
  let totalFail = 0;
  let totalSkip = 0;
  let totalError = 0;

  for (const r of results) {
    for (const method of METHODS_TO_TEST) {
      const mr = r.methods[method];
      if (!mr) continue;
      switch (mr.status) {
        case 'PASS':
          totalPass++;
          break;
        case 'FAIL':
          totalFail++;
          break;
        case 'SKIP':
          totalSkip++;
          break;
        case 'ERROR':
          totalError++;
          break;
      }
    }
  }

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| PASS | ${totalPass} |`);
  lines.push(`| FAIL | ${totalFail} |`);
  lines.push(`| SKIP | ${totalSkip} |`);
  lines.push(`| ERROR | ${totalError} |`);
  lines.push(`| **Total** | **${totalPass + totalFail + totalSkip + totalError}** |`);
  lines.push('');

  // Exchange × Method matrix
  lines.push('## Exchange × Method Matrix');
  lines.push('');
  const header = `| Exchange | ${METHODS_TO_TEST.join(' | ')} |`;
  const sep = `|----------|${METHODS_TO_TEST.map(() => '---').join('|')}|`;
  lines.push(header);
  lines.push(sep);

  for (const r of results) {
    const statusIcons: Record<Status, string> = {
      PASS: 'PASS',
      FAIL: 'FAIL',
      SKIP: 'SKIP',
      ERROR: 'ERR',
    };
    const cells = METHODS_TO_TEST.map((m) => {
      const mr = r.methods[m];
      return mr ? statusIcons[mr.status] : 'N/A';
    });
    lines.push(`| ${r.exchange} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  // Per-exchange details
  lines.push('## Per-Exchange Details');
  lines.push('');

  for (const r of results) {
    lines.push(`### ${r.exchange}`);
    lines.push('');
    lines.push(`- **Symbol used:** ${r.symbol || 'N/A'}`);
    lines.push(`- **Init time:** ${r.initDurationMs}ms`);
    if (r.initError) {
      lines.push(`- **Init error:** ${r.initError}`);
    }
    lines.push('');
    lines.push('| Method | Status | Duration | Details |');
    lines.push('|--------|--------|----------|---------|');

    for (const method of METHODS_TO_TEST) {
      const mr = r.methods[method];
      if (!mr) {
        lines.push(`| ${method} | N/A | - | - |`);
        continue;
      }
      const detail = mr.error ?? mr.details ?? '-';
      lines.push(`| ${method} | ${mr.status} | ${mr.durationMs}ms | ${detail} |`);
    }
    lines.push('');
  }

  // Handoff section
  lines.push('## Handoff');
  lines.push('');
  lines.push('- **Attempted**: Live validation of all 16 exchanges via public API endpoints');
  lines.push(
    '- **Worked**: Script creation, createExchange() instantiation, method-level validation with shape checks'
  );
  lines.push(
    '- **Failed**: Exchanges with init failures or API errors documented above in per-exchange details'
  );
  lines.push(
    '- **Remaining**: Retry flaky exchanges, add WebSocket validation, add latency percentile stats'
  );

  return lines.join('\n');
}

async function main() {
  console.log('=== PD-AIO-SDK Live API Validation ===\n');
  console.log(`Testing ${EXCHANGES.length} exchanges...\n`);

  const results: ExchangeResult[] = [];

  for (const exchangeId of EXCHANGES) {
    console.log(`[${results.length + 1}/${EXCHANGES.length}] Testing ${exchangeId}...`);
    const result = await testExchange(exchangeId);

    // Print quick summary
    const statuses = METHODS_TO_TEST.map((m) => {
      const mr = result.methods[m];
      return mr ? `${m.replace('fetch', '')}:${mr.status}` : `${m}:N/A`;
    }).join(', ');
    console.log(`  Symbol: ${result.symbol || 'N/A'} | Init: ${result.initDurationMs}ms`);
    console.log(`  ${statuses}\n`);

    results.push(result);

    // Delay between exchanges
    if (results.length < EXCHANGES.length) {
      await new Promise((r) => setTimeout(r, INTER_EXCHANGE_DELAY_MS));
    }
  }

  // Generate report
  const report = generateReport(results);

  // Write to docs/pipeline/
  const reportDir = join(__dirname, '..', '..', 'docs', 'pipeline');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }
  const reportPath = join(reportDir, 'LIVE_API_REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n=== Report written to ${reportPath} ===`);

  // Print summary
  let pass = 0,
    fail = 0,
    skip = 0,
    error = 0;
  for (const r of results) {
    for (const m of METHODS_TO_TEST) {
      const mr = r.methods[m];
      if (!mr) continue;
      if (mr.status === 'PASS') pass++;
      else if (mr.status === 'FAIL') fail++;
      else if (mr.status === 'SKIP') skip++;
      else if (mr.status === 'ERROR') error++;
    }
  }
  console.log(`\nFinal: PASS=${pass} FAIL=${fail} SKIP=${skip} ERROR=${error}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
