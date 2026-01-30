/**
 * API Verification Test v2
 * Tests adapters against real APIs with detailed error logging
 */

import { createExchange } from '../../src/factory.js';

async function testHyperliquid() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing HYPERLIQUID (Testnet)');
  console.log('='.repeat(60));

  const exchange = createExchange('hyperliquid', { testnet: true });

  // Test fetchMarkets
  console.log('\n📊 fetchMarkets:');
  try {
    const markets = await exchange.fetchMarkets();
    console.log(`  ✅ Found ${markets.length} markets`);
    const btcMarket = markets.find(m => m.symbol.includes('BTC'));
    if (btcMarket) {
      console.log(`  BTC market: ${btcMarket.symbol}`);
    }
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
    console.log(`  Code: ${e.code}`);
  }

  // Test fetchTicker with BTC
  console.log('\n📈 fetchTicker(BTC/USDT:USDT):');
  try {
    const ticker = await exchange.fetchTicker('BTC/USDT:USDT');
    console.log(`  ✅ Last: ${ticker.last}`);
    console.log(`  Bid: ${ticker.bid}, Ask: ${ticker.ask}`);
    console.log(`  24h Volume: ${ticker.baseVolume}`);
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
    console.log(`  Code: ${e.code}`);
    if (e.originalError) {
      console.log(`  Original: ${JSON.stringify(e.originalError)}`);
    }
  }

  // Test fetchOrderBook
  console.log('\n📖 fetchOrderBook(BTC/USDT:USDT):');
  try {
    const orderBook = await exchange.fetchOrderBook('BTC/USDT:USDT', 5);
    console.log(`  ✅ Bids: ${orderBook.bids.length}, Asks: ${orderBook.asks.length}`);
    if (orderBook.bids.length > 0) {
      console.log(`  Top bid: $${orderBook.bids[0][0]} x ${orderBook.bids[0][1]}`);
    }
    if (orderBook.asks.length > 0) {
      console.log(`  Top ask: $${orderBook.asks[0][0]} x ${orderBook.asks[0][1]}`);
    }
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
    console.log(`  Code: ${e.code}`);
  }

  // Test fetchTrades
  console.log('\n📜 fetchTrades(BTC/USDT:USDT):');
  try {
    const trades = await exchange.fetchTrades('BTC/USDT:USDT', undefined, 5);
    console.log(`  ✅ Found ${trades.length} recent trades`);
    if (trades.length > 0) {
      const latest = trades[0];
      console.log(`  Latest: ${latest.side} ${latest.amount} @ $${latest.price}`);
    }
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
    console.log(`  Code: ${e.code}`);
  }

  // Test fetchFundingRate
  console.log('\n💰 fetchFundingRate(BTC/USDT:USDT):');
  try {
    const funding = await exchange.fetchFundingRate('BTC/USDT:USDT');
    console.log(`  ✅ Current rate: ${(funding.fundingRate * 100).toFixed(4)}%`);
    console.log(`  Next funding: ${new Date(funding.fundingTimestamp).toISOString()}`);
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
    console.log(`  Code: ${e.code}`);
  }
}

async function testParadex() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing PARADEX (Testnet) - Public Endpoints');
  console.log('='.repeat(60));

  // Paradex requires auth even for adapter creation, so test API directly
  console.log('\n📊 Direct API call to /markets:');
  try {
    const response = await fetch('https://api.testnet.paradex.trade/v1/markets');
    const data = await response.json() as { results: any[] };
    console.log(`  ✅ Found ${data.results.length} markets`);
    const btcMarket = data.results.find((m: any) => m.symbol.includes('BTC'));
    if (btcMarket) {
      console.log(`  BTC market: ${btcMarket.symbol}`);
      console.log(`  Tick size: ${btcMarket.price_tick_size}`);
    }
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

async function main() {
  console.log('🔬 PD-AIO-SDK API Verification Test v2');
  console.log('Testing against real testnet APIs...\n');

  await testHyperliquid();
  await testParadex();

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
