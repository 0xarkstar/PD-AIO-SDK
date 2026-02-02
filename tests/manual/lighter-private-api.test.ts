/**
 * Lighter Private API Integration Test
 *
 * Manual test for verifying Lighter private API functionality.
 * Requires environment variables:
 * - LIGHTER_API_PRIVATE_KEY: Your API private key (hex string)
 * - LIGHTER_TESTNET: Set to 'true' for testnet (recommended)
 *
 * Usage:
 *   export LIGHTER_API_PRIVATE_KEY=0x...
 *   export LIGHTER_TESTNET=true
 *   npx tsx tests/manual/lighter-private-api.test.ts
 */

import dotenv from 'dotenv';
import { LighterAdapter } from '../../src/adapters/lighter/index.js';

dotenv.config();

// Configuration
const API_PRIVATE_KEY = process.env.LIGHTER_API_PRIVATE_KEY;
const USE_TESTNET = process.env.LIGHTER_TESTNET === 'true';

async function main() {
  console.log('='.repeat(60));
  console.log('Lighter Private API Integration Test');
  console.log('='.repeat(60));
  console.log();

  // Validate environment
  if (!API_PRIVATE_KEY) {
    console.error('ERROR: LIGHTER_API_PRIVATE_KEY environment variable not set');
    console.error('Usage:');
    console.error('  export LIGHTER_API_PRIVATE_KEY=0x...');
    console.error('  export LIGHTER_TESTNET=true');
    console.error('  npx tsx tests/manual/lighter-private-api.test.ts');
    process.exit(1);
  }

  console.log(`Network: ${USE_TESTNET ? 'Testnet' : 'Mainnet'}`);
  console.log(`Private Key: ${API_PRIVATE_KEY.slice(0, 10)}...${API_PRIVATE_KEY.slice(-4)}`);
  console.log();

  // Create adapter
  const lighter = new LighterAdapter({
    apiPrivateKey: API_PRIVATE_KEY,
    testnet: USE_TESTNET,
  });

  try {
    // Initialize
    console.log('1. Initializing adapter...');
    await lighter.initialize();
    console.log('   ✓ Adapter initialized');
    console.log(`   ✓ FFI Signing: ${lighter.hasFFISigning ? 'Available' : 'Not Available (falling back to HMAC)'}`);
    console.log();

    // Test: Fetch Markets
    console.log('2. Fetching markets...');
    const markets = await lighter.fetchMarkets();
    console.log(`   ✓ Found ${markets.length} perp markets`);
    if (markets.length > 0) {
      console.log(`   First market: ${markets[0].symbol}`);
    }
    console.log();

    // Test: Fetch Balance
    console.log('3. Fetching balance...');
    try {
      const balances = await lighter.fetchBalance();
      console.log(`   ✓ Found ${balances.length} balance entries`);
      for (const balance of balances) {
        console.log(`   - ${balance.currency}: ${balance.total} (available: ${balance.free})`);
      }
    } catch (error) {
      console.log(`   ✗ Failed to fetch balance: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Test: Fetch Positions
    console.log('4. Fetching positions...');
    try {
      const positions = await lighter.fetchPositions();
      console.log(`   ✓ Found ${positions.length} positions`);
      for (const position of positions) {
        console.log(`   - ${position.symbol}: ${position.side} ${position.contracts} @ ${position.entryPrice}`);
      }
    } catch (error) {
      console.log(`   ✗ Failed to fetch positions: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Test: Fetch Open Orders
    console.log('5. Fetching open orders...');
    try {
      const orders = await lighter.fetchOpenOrders();
      console.log(`   ✓ Found ${orders.length} open orders`);
      for (const order of orders) {
        console.log(`   - ${order.id}: ${order.side} ${order.amount} ${order.symbol} @ ${order.price}`);
      }
    } catch (error) {
      console.log(`   ✗ Failed to fetch open orders: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Test: Create Order (DRY RUN - won't actually submit unless confirmed)
    if (markets.length > 0) {
      const testSymbol = markets[0].symbol;
      console.log(`6. Order creation test (${testSymbol})...`);

      // Get current price
      const ticker = await lighter.fetchTicker(testSymbol);
      const currentPrice = ticker.last;

      // Calculate a limit price far from current (won't fill)
      const limitPrice = currentPrice * 0.5; // 50% below current price

      console.log(`   Current price: ${currentPrice}`);
      console.log(`   Test limit price: ${limitPrice} (won't fill)`);
      console.log();
      console.log('   Skipping actual order creation in test mode.');
      console.log('   To test order creation, uncomment the code below:');
      console.log();

      /*
      // UNCOMMENT TO TEST ORDER CREATION
      try {
        const order = await lighter.createOrder({
          symbol: testSymbol,
          type: 'limit',
          side: 'buy',
          amount: 0.001, // Minimum amount
          price: limitPrice,
          postOnly: true,
        });
        console.log(`   ✓ Order created: ${order.id}`);

        // Cancel the order immediately
        console.log('   Cancelling test order...');
        const cancelled = await lighter.cancelOrder(order.id, testSymbol);
        console.log(`   ✓ Order cancelled: ${cancelled.id}`);
      } catch (error) {
        console.log(`   ✗ Order failed: ${error instanceof Error ? error.message : error}`);
      }
      */
    }
    console.log();

    // Test: Fetch Order History
    console.log('7. Fetching order history...');
    try {
      const history = await lighter.fetchOrderHistory(undefined, undefined, 5);
      console.log(`   ✓ Found ${history.length} historical orders`);
    } catch (error) {
      console.log(`   ✗ Failed to fetch order history: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Test: Fetch Trade History
    console.log('8. Fetching trade history...');
    try {
      const trades = await lighter.fetchMyTrades(undefined, undefined, 5);
      console.log(`   ✓ Found ${trades.length} trades`);
    } catch (error) {
      console.log(`   ✗ Failed to fetch trade history: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Test: Nonce Resync
    console.log('9. Testing nonce resync...');
    try {
      await lighter.resyncNonce();
      console.log('   ✓ Nonce resync successful');
    } catch (error) {
      console.log(`   ✗ Nonce resync failed: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Test: Withdraw Collateral (commented out for safety)
    console.log('10. Collateral withdrawal test...');
    if (lighter.hasWasmSigning) {
      console.log('   WASM signing available - withdrawal possible');
      console.log('   Skipping actual withdrawal in test mode.');
      console.log('   To test withdrawal, uncomment the code below:');
      /*
      // UNCOMMENT TO TEST WITHDRAWAL
      const walletAddress = process.env.WALLET_ADDRESS || '';
      if (walletAddress) {
        try {
          const txHash = await lighter.withdrawCollateral(
            0,                // USDC collateral index
            BigInt(1000000),  // 1 USDC (6 decimals)
            walletAddress
          );
          console.log(`   ✓ Withdrawal submitted: ${txHash}`);
        } catch (error) {
          console.log(`   ✗ Withdrawal failed: ${error instanceof Error ? error.message : error}`);
        }
      } else {
        console.log('   Set WALLET_ADDRESS env var to test withdrawals');
      }
      */
    } else {
      console.log('   WASM signing not available - cannot test withdrawals');
    }
    console.log();

    console.log('='.repeat(60));
    console.log('Test completed successfully');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await lighter.disconnect();
  }
}

main();
