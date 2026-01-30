/**
 * Exchange API Test Script
 *
 * 1. Public API 테스트 (fetchMarkets)
 * 2. Balance 확인
 * 3. 자금 있으면 거래 테스트
 */

import { config } from 'dotenv';
import { Wallet } from 'ethers';
import { createExchange } from '../src/factory.js';

// Load .env.production
config({ path: '.env.production' });

interface TestResult {
  exchange: string;
  publicApi: boolean;
  balance: number | null;
  balanceError?: string;
  tradingTest?: boolean;
  tradingError?: string;
}

const results: TestResult[] = [];

async function testExchange(
  name: string,
  createAdapter: () => any,
  needsInit: boolean = false
): Promise<TestResult> {
  const result: TestResult = {
    exchange: name,
    publicApi: false,
    balance: null,
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));

  let adapter: any;

  try {
    adapter = createAdapter();

    if (needsInit) {
      console.log(`  [${name}] Initializing...`);
      await adapter.initialize();
    }

    // 1. Public API Test - fetchMarkets
    console.log(`  [${name}] Testing fetchMarkets...`);
    const markets = await adapter.fetchMarkets();
    console.log(`  [${name}] ✅ fetchMarkets: ${markets.length} markets found`);
    result.publicApi = true;

    // 2. Balance Test
    console.log(`  [${name}] Testing fetchBalance...`);
    try {
      const balances = await adapter.fetchBalance();
      const totalBalance = balances.reduce((sum: number, b: any) => sum + (b.total || 0), 0);
      console.log(`  [${name}] ✅ fetchBalance: $${totalBalance.toFixed(2)} total`);
      result.balance = totalBalance;

      // Log individual balances
      for (const b of balances) {
        if (b.total > 0) {
          console.log(`      ${b.asset}: ${b.total} (free: ${b.free}, used: ${b.used})`);
        }
      }

      // 3. Trading Test (if balance > 0)
      if (totalBalance > 0) {
        console.log(`  [${name}] 💰 Funds available - trading test possible`);
        // Trading test는 나중에 수동으로 진행
        result.tradingTest = false; // Not tested yet
      } else {
        console.log(`  [${name}] ⚠️ No funds - skipping trading test`);
      }
    } catch (balanceError: any) {
      console.log(`  [${name}] ❌ fetchBalance failed: ${balanceError.message}`);
      result.balanceError = balanceError.message;
    }

  } catch (error: any) {
    console.log(`  [${name}] ❌ Error: ${error.message}`);
    if (!result.publicApi) {
      result.balanceError = error.message;
    }
  } finally {
    if (adapter && typeof adapter.disconnect === 'function') {
      try {
        await adapter.disconnect();
      } catch {}
    }
  }

  return result;
}

async function main() {
  console.log('PD-AIO-SDK Exchange Test');
  console.log('========================\n');
  console.log('Testing exchanges with configured credentials...\n');

  // Hyperliquid (needs initialize)
  if (process.env.HYPERLIQUID_PRIVATE_KEY) {
    const result = await testExchange('Hyperliquid', () => {
      const wallet = new Wallet(process.env.HYPERLIQUID_PRIVATE_KEY!);
      return createExchange('hyperliquid', {
        wallet,
        testnet: process.env.HYPERLIQUID_TESTNET === 'true',
      });
    }, true); // needsInit = true
    results.push(result);
  }

  // GRVT
  if (process.env.GRVT_PRIVATE_KEY && process.env.GRVT_API_KEY) {
    const result = await testExchange('GRVT', () => {
      const wallet = new Wallet(process.env.GRVT_PRIVATE_KEY!);
      return createExchange('grvt', {
        wallet,
        apiKey: process.env.GRVT_API_KEY,
        testnet: process.env.GRVT_TESTNET === 'true',
      });
    });
    results.push(result);
  }

  // Nado (needs initialize)
  if (process.env.NADO_PRIVATE_KEY) {
    const result = await testExchange('Nado', () => {
      return createExchange('nado', {
        privateKey: process.env.NADO_PRIVATE_KEY,
        testnet: process.env.NADO_TESTNET === 'true',
      });
    }, true); // needsInit = true
    results.push(result);
  }

  // Backpack (mainnet only)
  if (process.env.BACKPACK_API_KEY && process.env.BACKPACK_SECRET_KEY) {
    const result = await testExchange('Backpack', () => {
      return createExchange('backpack', {
        apiKey: process.env.BACKPACK_API_KEY,
        apiSecret: process.env.BACKPACK_SECRET_KEY,
      });
    });
    results.push(result);
  }

  // Extended (REST only, no WebSocket)
  if (process.env.EXTENDED_API_KEY && process.env.EXTENDED_STARKNET_PRIVATE_KEY) {
    const result = await testExchange('Extended', () => {
      return createExchange('extended', {
        apiKey: process.env.EXTENDED_API_KEY,
        starknetPrivateKey: process.env.EXTENDED_STARKNET_PRIVATE_KEY,
        starknetAccountAddress: process.env.EXTENDED_STARKNET_ACCOUNT_ADDRESS,
        testnet: process.env.EXTENDED_TESTNET === 'true',
      });
    });
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('\n| Exchange | Public API | Balance | Trading Ready |');
  console.log('|----------|------------|---------|---------------|');

  for (const r of results) {
    const publicApi = r.publicApi ? '✅' : '❌';
    const balance = r.balance !== null ? `$${r.balance.toFixed(2)}` : (r.balanceError ? '❌ Error' : '-');
    const trading = r.balance && r.balance > 0 ? '✅ Ready' : '⚠️ No funds';
    console.log(`| ${r.exchange.padEnd(8)} | ${publicApi.padEnd(10)} | ${balance.padEnd(7)} | ${trading.padEnd(13)} |`);
  }

  // Exchanges with funds
  const withFunds = results.filter(r => r.balance && r.balance > 0);
  if (withFunds.length > 0) {
    console.log(`\n💰 Exchanges with funds (ready for trading test):`);
    for (const r of withFunds) {
      console.log(`   - ${r.exchange}: $${r.balance!.toFixed(2)}`);
    }
  }

  console.log('\nTest completed.');
}

main().catch(console.error);
