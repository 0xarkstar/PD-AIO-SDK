/**
 * Lighter Trading Example
 *
 * Demonstrates how to use the Lighter adapter with FFI-based native signing.
 *
 * Prerequisites:
 * 1. Install optional FFI dependencies: npm install ffi-napi ref-napi
 * 2. Obtain native signing library from lighter-python SDK
 * 3. Place library in native/lighter/ directory
 *
 * Environment variables:
 * - LIGHTER_API_PRIVATE_KEY: Your API private key (hex string)
 * - LIGHTER_TESTNET: Set to 'true' for testnet (recommended for testing)
 *
 * Usage:
 *   export LIGHTER_API_PRIVATE_KEY=0x...
 *   export LIGHTER_TESTNET=true
 *   npx tsx examples/lighter-trading.ts
 */

import { LighterAdapter, OrderType, TimeInForce } from '../src/adapters/lighter/index.js';

async function main() {
  // Configuration from environment
  const apiPrivateKey = process.env.LIGHTER_API_PRIVATE_KEY;
  const useTestnet = process.env.LIGHTER_TESTNET === 'true';

  if (!apiPrivateKey) {
    console.error('Please set LIGHTER_API_PRIVATE_KEY environment variable');
    process.exit(1);
  }

  console.log('Lighter Trading Example');
  console.log('=======================');
  console.log(`Network: ${useTestnet ? 'Testnet' : 'Mainnet'}`);
  console.log();

  // Create the adapter with FFI signing
  const lighter = new LighterAdapter({
    apiPrivateKey,
    testnet: useTestnet,
    // Optional: customize account settings
    // accountIndex: 0,      // Default: 0
    // apiKeyIndex: 255,     // Default: 255 (main key)
  });

  try {
    // Initialize the adapter
    console.log('Initializing adapter...');
    await lighter.initialize();

    // Check authentication mode
    if (lighter.hasFFISigning) {
      console.log('Using FFI native signing (full trading support)');
    } else {
      console.log('FFI signing not available - check native library installation');
      console.log('Falling back to HMAC mode (limited functionality)');
    }
    console.log();

    // Fetch available markets
    console.log('Fetching markets...');
    const markets = await lighter.fetchMarkets();
    console.log(`Found ${markets.length} perpetual markets:`);
    markets.slice(0, 5).forEach(m => {
      console.log(`  - ${m.symbol} (leverage: ${m.maxLeverage}x)`);
    });
    console.log();

    // Pick a market for trading
    const symbol = markets[0]?.symbol || 'BTC/USDC:USDC';
    console.log(`Using market: ${symbol}`);

    // Fetch ticker data
    console.log('Fetching ticker...');
    const ticker = await lighter.fetchTicker(symbol);
    console.log(`  Last price: ${ticker.last}`);
    console.log(`  24h volume: ${ticker.baseVolume}`);
    console.log();

    // Fetch order book
    console.log('Fetching order book (top 5 levels)...');
    const orderbook = await lighter.fetchOrderBook(symbol, { limit: 5 });
    console.log('  Bids:');
    orderbook.bids.slice(0, 3).forEach(([price, size]) => {
      console.log(`    ${price} x ${size}`);
    });
    console.log('  Asks:');
    orderbook.asks.slice(0, 3).forEach(([price, size]) => {
      console.log(`    ${price} x ${size}`);
    });
    console.log();

    // Check account balance
    console.log('Fetching balance...');
    try {
      const balances = await lighter.fetchBalance();
      balances.forEach(b => {
        console.log(`  ${b.currency}: ${b.total} (available: ${b.free})`);
      });
    } catch (error) {
      console.log('  Unable to fetch balance (authentication required)');
    }
    console.log();

    // Check positions
    console.log('Fetching positions...');
    try {
      const positions = await lighter.fetchPositions();
      if (positions.length === 0) {
        console.log('  No open positions');
      } else {
        positions.forEach(p => {
          console.log(`  ${p.symbol}: ${p.side} ${p.contracts} @ ${p.entryPrice}`);
          console.log(`    Unrealized PnL: ${p.unrealizedPnl}`);
        });
      }
    } catch (error) {
      console.log('  Unable to fetch positions (authentication required)');
    }
    console.log();

    // Check open orders
    console.log('Fetching open orders...');
    try {
      const orders = await lighter.fetchOpenOrders();
      if (orders.length === 0) {
        console.log('  No open orders');
      } else {
        orders.forEach(o => {
          console.log(`  ${o.id}: ${o.side} ${o.amount} @ ${o.price} (${o.status})`);
        });
      }
    } catch (error) {
      console.log('  Unable to fetch orders (authentication required)');
    }
    console.log();

    // Example: Create a limit order (commented out for safety)
    /*
    console.log('Creating limit order...');
    try {
      // Place a limit buy order far below market price (won't fill)
      const limitPrice = ticker.last * 0.5; // 50% below current price

      const order = await lighter.createOrder({
        symbol,
        type: 'limit',
        side: 'buy',
        amount: 0.001,
        price: limitPrice,
        postOnly: true, // Maker only
      });

      console.log(`  Order created: ${order.id}`);
      console.log(`  Status: ${order.status}`);

      // Cancel the order
      console.log('Cancelling order...');
      const cancelled = await lighter.cancelOrder(order.id, symbol);
      console.log(`  Order cancelled: ${cancelled.status}`);
    } catch (error) {
      console.log(`  Order failed: ${error instanceof Error ? error.message : error}`);
    }
    */

    // Example: Withdraw collateral (commented out for safety)
    /*
    console.log('Withdrawing collateral...');
    if (lighter.hasFFISigning) {
      try {
        // Withdraw 10 USDC (6 decimals)
        const txHash = await lighter.withdrawCollateral(
          0,                    // Collateral index (0 = USDC)
          BigInt(10000000),     // Amount in smallest units (10 USDC)
          '0xYourWalletAddress' // Destination address
        );
        console.log(`  Withdrawal submitted: ${txHash}`);
      } catch (error) {
        console.log(`  Withdrawal failed: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      console.log('  Withdrawals require FFI signing');
    }
    */

    // Check adapter health and status
    console.log('Checking adapter status...');
    const status = await lighter.getStatus();
    console.log(`  Ready: ${status.ready}`);
    console.log(`  Auth mode: ${status.authMode}`);
    console.log(`  Network: ${status.network}`);
    console.log(`  Latency: ${status.latencyMs ?? 'N/A'}ms`);
    console.log(`  Rate limiter tokens: ${status.rateLimiter.availableTokens}`);
    console.log();

    // Health check
    console.log('Running health check...');
    const healthy = await lighter.isHealthy();
    console.log(`  Healthy: ${healthy}`);
    console.log();

    console.log('Example completed successfully!');
    console.log();
    console.log('To enable actual trading, uncomment the order creation section.');
    console.log('To enable withdrawals, uncomment the withdrawal section.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await lighter.disconnect();
  }
}

main();
