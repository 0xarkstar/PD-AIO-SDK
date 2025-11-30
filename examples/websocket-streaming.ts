/**
 * WebSocket Streaming Example
 *
 * This example demonstrates real-time data streaming:
 * - Order book updates
 * - Position updates
 * - Order updates
 */

import { createExchange } from '../src/index.js';

async function main() {
  const exchange = createExchange('hyperliquid', {
    privateKey: process.env.PRIVATE_KEY!,
    testnet: true,
  });

  try {
    console.log('🔌 Initializing WebSocket connection...');
    await exchange.initialize();
    console.log('✅ Connected to', exchange.name);

    // Stream Order Book Updates
    console.log('\n📖 Streaming BTC order book (press Ctrl+C to stop)...\n');

    let updateCount = 0;
    const maxUpdates = 10;

    for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
      updateCount++;

      const timestamp = new Date(orderBook.timestamp).toLocaleTimeString();
      const bestBid = orderBook.bids[0];
      const bestAsk = orderBook.asks[0];
      const spread = bestAsk[0] - bestBid[0];
      const spreadBps = (spread / bestBid[0]) * 10000;

      console.log(`[${timestamp}] Update #${updateCount}`);
      console.log(`  Best Bid: $${bestBid[0].toFixed(2)} x ${bestBid[1].toFixed(4)}`);
      console.log(`  Best Ask: $${bestAsk[0].toFixed(2)} x ${bestAsk[1].toFixed(4)}`);
      console.log(`  Spread: $${spread.toFixed(2)} (${spreadBps.toFixed(2)} bps)`);
      console.log('');

      if (updateCount >= maxUpdates) {
        console.log('✅ Received', maxUpdates, 'updates, stopping...');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n👋 Disconnecting...');
    await exchange.disconnect();
    console.log('✅ Disconnected');
  }
}

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

main().catch(console.error);
