/**
 * WebSocket Streaming Example
 *
 * Demonstrates real-time market data streaming
 */

import { createExchange } from '../src/index.js';

async function main(): Promise<void> {
  // Create exchange instance (public data doesn't require authentication)
  const exchange = createExchange('hyperliquid', {
    testnet: true,
    debug: true,
  });

  console.log('Initializing Hyperliquid adapter...');
  await exchange.initialize();

  const symbol = 'BTC/USDT:USDT';

  // Stream order book updates
  console.log(`\n=== Streaming Order Book for ${symbol} ===`);
  console.log('Press Ctrl+C to stop\n');

  let updateCount = 0;
  const maxUpdates = 10; // Limit for demo

  try {
    for await (const orderbook of exchange.watchOrderBook(symbol)) {
      updateCount++;

      const bestBid = orderbook.bids[0];
      const bestAsk = orderbook.asks[0];
      const spread = bestAsk ? bestAsk[0] - bestBid[0] : 0;
      const spreadBps = bestBid[0] > 0 ? (spread / bestBid[0]) * 10000 : 0;

      console.log(`Update #${updateCount} at ${new Date(orderbook.timestamp).toISOString()}`);
      console.log(`  Best Bid: $${bestBid[0].toFixed(2)} x ${bestBid[1]}`);
      console.log(`  Best Ask: $${bestAsk[0].toFixed(2)} x ${bestAsk[1]}`);
      console.log(`  Spread: $${spread.toFixed(2)} (${spreadBps.toFixed(2)} bps)`);
      console.log(`  Bid depth: ${orderbook.bids.length} levels`);
      console.log(`  Ask depth: ${orderbook.asks.length} levels`);
      console.log('---');

      // Stop after max updates for demo
      if (updateCount >= maxUpdates) {
        console.log(`\nReached ${maxUpdates} updates, stopping...`);
        break;
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
  }

  // Cleanup
  console.log('\n=== Disconnecting ===');
  await exchange.disconnect();
  console.log('Done!');
}

// Run example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
