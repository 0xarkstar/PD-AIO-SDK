/**
 * Basic Usage Example
 *
 * This example demonstrates the fundamental operations:
 * - Creating an exchange adapter
 * - Fetching market data
 * - Placing orders
 * - Managing positions
 */

import { createExchange } from '../src/index.js';

async function main() {
  // Create exchange adapter
  // Replace with your actual private key or use environment variable
  const exchange = createExchange('hyperliquid', {
    privateKey: process.env.PRIVATE_KEY!,
    testnet: true, // Use testnet for development
  });

  try {
    // Initialize connection
    console.log('🔌 Initializing connection...');
    await exchange.initialize();
    console.log('✅ Connected to', exchange.name);

    // 1. Fetch Available Markets
    console.log('\n📊 Fetching markets...');
    const markets = await exchange.fetchMarkets();
    console.log(`Found ${markets.length} markets:`);
    markets.slice(0, 5).forEach(market => {
      console.log(`  - ${market.symbol} (max leverage: ${market.maxLeverage}x)`);
    });

    // 2. Get Order Book
    console.log('\n📖 Fetching BTC order book...');
    const orderBook = await exchange.fetchOrderBook('BTC/USDT:USDT', 5);
    console.log('Best 5 Bids:');
    orderBook.bids.slice(0, 5).forEach(([price, size]) => {
      console.log(`  ${price.toFixed(2)} @ ${size.toFixed(4)}`);
    });
    console.log('Best 5 Asks:');
    orderBook.asks.slice(0, 5).forEach(([price, size]) => {
      console.log(`  ${price.toFixed(2)} @ ${size.toFixed(4)}`);
    });

    // 3. Check Account Balance
    console.log('\n💰 Fetching account balance...');
    const balance = await exchange.fetchBalance();
    console.log(`Total: ${balance.total} ${balance.currency}`);
    console.log(`Available: ${balance.free} ${balance.currency}`);
    console.log(`In use: ${balance.used} ${balance.currency}`);

    // 4. Place a Limit Order (This will actually place an order!)
    // Uncomment the code below only if you're ready to place a real order
    /*
    console.log('\n📝 Placing limit buy order...');
    const order = await exchange.createOrder(
      'BTC/USDT:USDT',
      'limit',
      'buy',
      0.001,  // amount (very small for testing)
      30000,  // price (well below market to avoid fill)
      {
        postOnly: true,  // ensure we're making, not taking
      }
    );
    console.log('✅ Order placed:', {
      id: order.id,
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      amount: order.amount,
      price: order.price,
      status: order.status,
    });

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cancel the order
    console.log('\n❌ Cancelling order...');
    await exchange.cancelOrder(order.id, 'BTC/USDT:USDT');
    console.log('✅ Order cancelled');
    */

    // 5. Check Open Positions
    console.log('\n📍 Fetching positions...');
    const positions = await exchange.fetchPositions();
    if (positions.length === 0) {
      console.log('No open positions');
    } else {
      console.log('Open positions:');
      positions.forEach(pos => {
        console.log(`  ${pos.symbol}: ${pos.side} ${pos.size} @ ${pos.entryPrice}`);
        console.log(`    Unrealized PnL: ${pos.unrealizedPnl.toFixed(2)}`);
        console.log(`    Leverage: ${pos.leverage}x`);
      });
    }

    // 6. Get Recent Trades
    console.log('\n📈 Fetching recent trades...');
    const trades = await exchange.fetchTrades('BTC/USDT:USDT', { limit: 5 });
    console.log('Last 5 trades:');
    trades.forEach(trade => {
      const time = new Date(trade.timestamp).toLocaleTimeString();
      console.log(`  ${time} ${trade.side.toUpperCase()} ${trade.amount} @ ${trade.price}`);
    });

    // 7. Get Funding Rate
    console.log('\n💸 Fetching funding rate...');
    const funding = await exchange.fetchFundingRate('BTC/USDT:USDT');
    console.log(`Current funding rate: ${(funding.fundingRate * 100).toFixed(4)}%`);
    console.log(`Funding interval: ${funding.fundingIntervalHours} hours`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Always disconnect when done
    console.log('\n👋 Disconnecting...');
    await exchange.disconnect();
    console.log('✅ Disconnected');
  }
}

// Run the example
main().catch(console.error);
