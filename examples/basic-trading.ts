/**
 * Basic Trading Example
 *
 * Demonstrates basic order placement and position management
 */

import { Wallet } from 'ethers';
import { createExchange } from '../src/index.js';

async function main(): Promise<void> {
  // Initialize wallet (use environment variable for security)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable required');
  }

  const wallet = new Wallet(privateKey);

  // Create exchange instance
  const exchange = createExchange('hyperliquid', {
    wallet,
    testnet: true, // Use testnet for safety
    debug: true,
  });

  console.log('Initializing Hyperliquid adapter...');
  await exchange.initialize();

  // Fetch available markets
  console.log('\n=== Fetching Markets ===');
  const markets = await exchange.fetchMarkets({ active: true });
  console.log(`Found ${markets.length} active markets`);
  console.log('Sample markets:', markets.slice(0, 3).map((m) => m.symbol));

  // Fetch order book
  console.log('\n=== Fetching Order Book ===');
  const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT');
  console.log('Best bid:', orderbook.bids[0]);
  console.log('Best ask:', orderbook.asks[0]);

  // Fetch account balance
  console.log('\n=== Fetching Balance ===');
  const balances = await exchange.fetchBalance();
  console.log('Account balance:', balances);

  // Fetch open positions
  console.log('\n=== Fetching Positions ===');
  const positions = await exchange.fetchPositions();
  console.log('Open positions:', positions.length);

  if (positions.length > 0) {
    console.log('Sample position:', positions[0]);
  }

  // Example: Place a limit order (commented out for safety)
  /*
  console.log('\n=== Placing Limit Order ===');
  const order = await exchange.createOrder({
    symbol: 'BTC/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 0.001,
    price: 50000,
    postOnly: true,
    reduceOnly: false,
  });
  console.log('Order placed:', order);

  // Cancel the order
  console.log('\n=== Canceling Order ===');
  const canceled = await exchange.cancelOrder(order.id, order.symbol);
  console.log('Order canceled:', canceled);
  */

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
