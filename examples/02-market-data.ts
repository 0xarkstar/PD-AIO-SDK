/**
 * Example 2: Market Data Operations
 *
 * This example demonstrates:
 * - Fetching available markets
 * - Getting ticker information
 * - Retrieving order books
 * - Fetching recent trades
 * - Getting funding rates
 * - Using market data preloading
 *
 * Before running:
 * 1. No credentials required for public market data
 * 2. Run: npx ts-node examples/02-market-data.ts
 */

import { HyperliquidAdapter } from '../src/index.js';
import { createSymbol } from '../src/utils/symbols.js';

async function main() {
  console.log('='.repeat(60));
  console.log('MARKET DATA EXAMPLE');
  console.log('='.repeat(60));
  console.log();

  // Initialize without credentials (public data only)
  console.log('Step 1: Connecting to Hyperliquid (public API)...');
  const exchange = new HyperliquidAdapter({
    testnet: false, // Use mainnet for real market data
  });

  try {
    await exchange.initialize();
    console.log('✅ Connected\n');

    // Step 2: Fetch all available markets
    console.log('Step 2: Fetching available markets...');
    const markets = await exchange.fetchMarkets();
    console.log(`✅ Found ${markets.length} markets:`);

    // Show first 5 markets
    markets.slice(0, 5).forEach((market) => {
      console.log(`   ${market.symbol} - ${market.active ? 'Active' : 'Inactive'}`);
      console.log(`      Min amount: ${market.limits.amount?.min}`);
      console.log(`      Min price: ${market.limits.price?.min}`);
    });
    console.log(`   ... and ${markets.length - 5} more\n`);

    // Step 3: Demonstrate market preloading
    console.log('Step 3: Preloading markets with 10-minute cache...');
    await exchange.preloadMarkets({ ttl: 600000 }); // 10 minutes
    console.log('✅ Markets cached\n');

    console.log('   Fetching from cache (no API call)...');
    const cachedMarkets = exchange.getPreloadedMarkets();
    console.log(`✅ Retrieved ${cachedMarkets?.length} markets from cache\n`);

    // Step 4: Get ticker for a specific symbol
    const symbol = createSymbol('hyperliquid', 'BTC');
    console.log(`Step 4: Fetching ticker for ${symbol}...`);
    const ticker = await exchange.fetchTicker(symbol);
    console.log('✅ Ticker data:');
    console.log(`   Last price: $${ticker.last?.toFixed(2)}`);
    console.log(`   24h high: $${ticker.high?.toFixed(2)}`);
    console.log(`   24h low: $${ticker.low?.toFixed(2)}`);
    console.log(`   24h volume: ${ticker.baseVolume?.toFixed(2)} BTC`);
    console.log(`   24h change: ${ticker.percentage?.toFixed(2)}%`);
    console.log();

    // Step 5: Fetch order book
    console.log(`Step 5: Fetching order book for ${symbol}...`);
    const orderBook = await exchange.fetchOrderBook(symbol, { limit: 5 });
    console.log('✅ Order Book:');
    console.log('   Bids (buyers):');
    orderBook.bids.slice(0, 5).forEach(([price, amount]) => {
      console.log(`      $${price.toFixed(2)} - ${amount.toFixed(4)} BTC`);
    });
    console.log('   Asks (sellers):');
    orderBook.asks.slice(0, 5).forEach(([price, amount]) => {
      console.log(`      $${price.toFixed(2)} - ${amount.toFixed(4)} BTC`);
    });
    console.log();

    // Step 6: Fetch recent trades
    console.log(`Step 6: Fetching recent trades for ${symbol}...`);
    const trades = await exchange.fetchTrades(symbol, { limit: 5 });
    console.log(`✅ Last ${trades.length} trades:`);
    trades.forEach((trade) => {
      const timestamp = new Date(trade.timestamp).toLocaleTimeString();
      console.log(`   [${timestamp}] ${trade.side} ${trade.amount.toFixed(4)} BTC @ $${trade.price.toFixed(2)}`);
    });
    console.log();

    // Step 7: Get funding rate
    console.log(`Step 7: Fetching funding rate for ${symbol}...`);
    const fundingRate = await exchange.fetchFundingRate(symbol);
    console.log('✅ Funding rate:');
    console.log(`   Current rate: ${(fundingRate.fundingRate * 100).toFixed(4)}%`);
    console.log(`   Next funding: ${new Date(fundingRate.fundingTimestamp).toLocaleString()}`);
    console.log();

    // Step 8: Compare multiple markets
    console.log('Step 8: Comparing top 3 markets...');
    const symbolsToCompare = ['BTC', 'ETH', 'SOL'];

    for (const base of symbolsToCompare) {
      const sym = createSymbol('hyperliquid', base);
      const tick = await exchange.fetchTicker(sym);
      console.log(`   ${sym}:`);
      console.log(`      Price: $${tick.last?.toFixed(2)}`);
      console.log(`      24h Volume: $${tick.quoteVolume?.toFixed(0)}`);
      console.log(`      24h Change: ${tick.percentage?.toFixed(2)}%`);
    }
    console.log();

    // Step 9: Find active markets
    console.log('Step 9: Finding active markets...');
    const activeMarkets = markets.filter((m) => m.active);
    console.log(`✅ ${activeMarkets.length} out of ${markets.length} markets are active`);

    // Group by base currency
    const baseCurrencies = new Set(activeMarkets.map((m) => m.base));
    console.log(`   Available base currencies: ${baseCurrencies.size}`);
    console.log(`   Examples: ${Array.from(baseCurrencies).slice(0, 10).join(', ')}`);
    console.log();

    console.log('='.repeat(60));
    console.log('✅ EXAMPLE COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error);
  } finally {
    console.log('\nDisconnecting...');
    await exchange.disconnect();
    console.log('✅ Disconnected\n');
  }
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
