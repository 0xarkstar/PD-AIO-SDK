/**
 * API Verification Test
 * Tests adapters against real APIs (public endpoints only)
 *
 * Usage:
 *   node tests/manual/api-verification.mjs [exchange]
 *
 * Examples:
 *   node tests/manual/api-verification.mjs          # Test all exchanges
 *   node tests/manual/api-verification.mjs lighter  # Test only Lighter
 */

import { createExchange } from '../../dist/factory.js';

async function testExchange(name, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${name.toUpperCase()}`);
  console.log('='.repeat(60));

  const result = {
    exchange: name,
    fetchMarkets: false,
    fetchTicker: false,
    fetchOrderBook: false,
    errors: [],
  };

  try {
    const exchange = createExchange(name, config);

    // Test fetchMarkets
    console.log('\n📊 fetchMarkets:');
    try {
      const markets = await exchange.fetchMarkets();
      console.log(`  ✅ Found ${markets.length} markets`);
      if (markets.length > 0) {
        console.log(`  First market: ${markets[0].symbol}`);
        console.log(`  Base: ${markets[0].base}, Quote: ${markets[0].quote}`);
      }
      result.fetchMarkets = true;

      // Test fetchTicker (only if markets exist)
      if (markets.length > 0) {
        const symbol = markets[0].symbol;
        console.log(`\n📈 fetchTicker(${symbol}):`);
        try {
          const ticker = await exchange.fetchTicker(symbol);
          console.log(`  ✅ Last: ${ticker.last}, Bid: ${ticker.bid}, Ask: ${ticker.ask}`);
          console.log(`  Volume: ${ticker.baseVolume}`);
          result.fetchTicker = true;
        } catch (e) {
          console.log(`  ❌ Error: ${e.message}`);
          result.errors.push(`fetchTicker: ${e.message}`);
        }
      }

      // Test fetchOrderBook (only if markets exist)
      if (markets.length > 0) {
        const symbol = markets[0].symbol;
        console.log(`\n📖 fetchOrderBook(${symbol}):`);
        try {
          const orderBook = await exchange.fetchOrderBook(symbol, { limit: 5 });
          console.log(`  ✅ Bids: ${orderBook.bids.length}, Asks: ${orderBook.asks.length}`);
          if (orderBook.bids.length > 0) {
            console.log(`  Top bid: ${orderBook.bids[0][0]} @ ${orderBook.bids[0][1]}`);
          }
          if (orderBook.asks.length > 0) {
            console.log(`  Top ask: ${orderBook.asks[0][0]} @ ${orderBook.asks[0][1]}`);
          }
          result.fetchOrderBook = true;
        } catch (e) {
          console.log(`  ❌ Error: ${e.message}`);
          result.errors.push(`fetchOrderBook: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      result.errors.push(`fetchMarkets: ${e.message}`);
    }

    console.log(`\n${result.errors.length === 0 ? '✅' : '⚠️'} ${name} API verification ${result.errors.length === 0 ? 'PASSED' : 'PARTIAL'}`);
  } catch (error) {
    console.log(`\n❌ ${name} API verification FAILED: ${error.message}`);
    result.errors.push(`initialization: ${error.message}`);
  }

  return result;
}

async function main() {
  console.log('🔬 PD-AIO-SDK API Verification Test');
  console.log('Testing public endpoints against real APIs...\n');

  // Get target exchange from CLI args
  const targetExchange = process.argv[2]?.toLowerCase();

  // Priority exchange configurations (testnet where available)
  const exchangeConfigs = [
    { name: 'hyperliquid', config: { testnet: true }, description: 'EIP-712 signing' },
    { name: 'lighter', config: { testnet: true }, description: 'HMAC-SHA256 signing' },
    { name: 'edgex', config: { testnet: true }, description: 'StarkEx Pedersen hash signing' },
    { name: 'nado', config: { testnet: true }, description: 'EIP-712 on Ink L2' },
    { name: 'extended', config: { testnet: true }, description: 'API Key + optional StarkNet' },
    { name: 'paradex', config: { testnet: true }, description: 'StarkNet signing' },
  ];

  // Filter exchanges if target specified
  const exchangesToTest = targetExchange
    ? exchangeConfigs.filter((e) => e.name === targetExchange)
    : exchangeConfigs;

  if (targetExchange && exchangesToTest.length === 0) {
    console.error(`❌ Unknown exchange: ${targetExchange}`);
    console.log('\nAvailable exchanges:');
    exchangeConfigs.forEach((e) => console.log(`  - ${e.name}: ${e.description}`));
    process.exit(1);
  }

  const results = [];

  for (const { name, config, description } of exchangesToTest) {
    console.log(`\n[${name}] ${description}`);
    const result = await testExchange(name, config);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('\n| Exchange     | Markets | Ticker | OrderBook | Status |');
  console.log('|--------------|---------|--------|-----------|--------|');

  for (const r of results) {
    const markets = r.fetchMarkets ? '✅' : '❌';
    const ticker = r.fetchTicker ? '✅' : '❌';
    const orderBook = r.fetchOrderBook ? '✅' : '❌';
    const status = r.errors.length === 0 ? '✅ PASS' : '⚠️ PARTIAL';
    console.log(`| ${r.exchange.padEnd(12)} | ${markets.padEnd(7)} | ${ticker.padEnd(6)} | ${orderBook.padEnd(9)} | ${status.padEnd(6)} |`);
  }

  // Overall result
  const passed = results.filter((r) => r.errors.length === 0).length;
  const total = results.length;

  console.log(`\n📊 Overall: ${passed}/${total} exchanges passed all tests`);

  if (results.some((r) => r.errors.length > 0)) {
    console.log('\n⚠️ Errors:');
    for (const r of results) {
      if (r.errors.length > 0) {
        console.log(`  ${r.exchange}:`);
        r.errors.forEach((e) => console.log(`    - ${e}`));
      }
    }
  }
}

main().catch(console.error);
