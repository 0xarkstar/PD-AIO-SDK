/**
 * Example 1: Basic Trading Operations
 *
 * This example demonstrates:
 * - Environment setup with credential validation
 * - Creating market and limit orders
 * - Canceling orders
 * - Fetching positions and balances
 * - Proper cleanup
 *
 * Before running:
 * 1. Copy .env.example to .env
 * 2. Add your Hyperliquid testnet private key
 * 3. Run: npx ts-node examples/01-basic-trading.ts
 */

import { HyperliquidAdapter } from '../src/index.js';
import { validateConfig } from '../src/utils/config.js';
import { createSymbol } from '../src/utils/symbols.js';

async function main() {
  console.log('='.repeat(60));
  console.log('BASIC TRADING EXAMPLE');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Validate environment configuration
  console.log('Step 1: Validating credentials...');
  try {
    validateConfig('hyperliquid');
    console.log('✅ Credentials are valid\n');
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
    console.error('\n💡 Tip: Make sure you have copied .env.example to .env');
    console.error('   and added your HYPERLIQUID_PRIVATE_KEY\n');
    process.exit(1);
  }

  // Step 2: Initialize the exchange adapter
  console.log('Step 2: Connecting to Hyperliquid testnet...');
  const exchange = new HyperliquidAdapter({
    privateKey: process.env.HYPERLIQUID_PRIVATE_KEY!,
    testnet: true, // Use testnet for safe testing
  });

  try {
    await exchange.initialize();
    console.log('✅ Connected to Hyperliquid testnet\n');

    // Step 3: Create a symbol using the helper
    console.log('Step 3: Creating symbol...');
    const symbol = createSymbol('hyperliquid', 'BTC');
    console.log(`✅ Trading ${symbol}\n`);

    // Step 4: Fetch current balance
    console.log('Step 4: Fetching account balance...');
    const balances = await exchange.fetchBalance();
    console.log('✅ Account balances:');
    balances.forEach((balance) => {
      console.log(`   ${balance.currency}: ${balance.free.toFixed(2)} free, ${balance.total.toFixed(2)} total`);
    });
    console.log();

    // Step 5: Check existing positions
    console.log('Step 5: Checking existing positions...');
    const positions = await exchange.fetchPositions();
    console.log(`✅ Found ${positions.length} open position(s)`);
    if (positions.length > 0) {
      positions.forEach((pos) => {
        console.log(`   ${pos.symbol}: ${pos.contracts} contracts @ $${pos.entryPrice}`);
      });
    }
    console.log();

    // Step 6: Place a limit buy order
    console.log('Step 6: Creating a limit buy order...');
    console.log('⚠️  This is a testnet order - no real money involved');

    const limitOrder = await exchange.createOrder({
      symbol,
      side: 'buy',
      type: 'limit',
      amount: 0.01, // Very small amount for testing
      price: 30000, // Well below market to avoid accidental fills
    });

    console.log('✅ Limit order created:');
    console.log(`   Order ID: ${limitOrder.id}`);
    console.log(`   Status: ${limitOrder.status}`);
    console.log(`   Side: ${limitOrder.side}`);
    console.log(`   Amount: ${limitOrder.amount} BTC`);
    console.log(`   Price: $${limitOrder.price}`);
    console.log();

    // Step 7: Fetch open orders
    console.log('Step 7: Fetching open orders...');
    const openOrders = await exchange.fetchOpenOrders(symbol);
    console.log(`✅ Found ${openOrders.length} open order(s)`);
    openOrders.forEach((order) => {
      console.log(`   ${order.id}: ${order.side} ${order.amount} @ $${order.price}`);
    });
    console.log();

    // Step 8: Cancel the order
    console.log('Step 8: Canceling the order...');
    const canceledOrder = await exchange.cancelOrder(limitOrder.id, symbol);
    console.log('✅ Order canceled:');
    console.log(`   Order ID: ${canceledOrder.id}`);
    console.log(`   Status: ${canceledOrder.status}`);
    console.log();

    // Step 9: Demonstrate market order (commented out to avoid accidental execution)
    console.log('Step 9: Market order example (not executed)');
    console.log('💡 To create a market order, use:');
    console.log('   await exchange.createOrder({');
    console.log('     symbol,');
    console.log('     side: "buy",');
    console.log('     type: "market",');
    console.log('     amount: 0.01');
    console.log('   });');
    console.log();

    console.log('='.repeat(60));
    console.log('✅ EXAMPLE COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error);
    console.error('\n💡 Tip: Make sure you have testnet funds in your account');
    console.error('   Visit: https://app.hyperliquid-testnet.xyz/faucet');
  } finally {
    // Step 10: Always cleanup
    console.log('\nStep 10: Disconnecting...');
    await exchange.disconnect();
    console.log('✅ Disconnected\n');
  }
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
