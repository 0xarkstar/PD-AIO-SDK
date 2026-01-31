/**
 * Extended Exchange - Basic Usage Example
 *
 * This example demonstrates how to use the Extended adapter for:
 * - REST API trading operations
 * - WebSocket real-time streaming
 * - StarkNet integration (optional)
 *
 * Extended is a StarkNet-based hybrid CLOB perpetual DEX supporting up to 100x leverage.
 */

import { ExtendedAdapter } from '../src/adapters/extended/index.js';

// Configuration
const config = {
  apiKey: process.env.EXTENDED_API_KEY || 'your-api-key',
  // Optional: StarkNet integration for on-chain operations
  // starknetPrivateKey: process.env.STARKNET_PRIVATE_KEY,
  // starknetAccountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
};

async function main() {
  const adapter = new ExtendedAdapter(config);

  try {
    // Initialize the adapter
    await adapter.initialize();
    console.log('Extended adapter initialized');
    console.log(`Adapter ID: ${adapter.id}`);
    console.log(`Ready: ${adapter.isReady}`);

    // =========================================================================
    // 1. Market Data (Public - No API Key Required)
    // =========================================================================
    console.log('\n--- Market Data ---');

    // Fetch all available markets
    const markets = await adapter.fetchMarkets();
    console.log(`Available markets: ${markets.length}`);
    markets.slice(0, 3).forEach((m) => {
      console.log(`  ${m.symbol} - Max Leverage: ${m.maxLeverage}x`);
    });

    // Fetch ticker for BTC/USD
    const ticker = await adapter.fetchTicker('BTC/USD:USD');
    console.log(`\nBTC/USD Ticker:`);
    console.log(`  Last: $${ticker.last}`);
    console.log(`  Bid: $${ticker.bid}`);
    console.log(`  Ask: $${ticker.ask}`);
    console.log(`  24h Volume: ${ticker.baseVolume} BTC`);

    // Fetch order book
    const orderBook = await adapter.fetchOrderBook('BTC/USD:USD', { limit: 5 });
    console.log(`\nOrder Book (top 5):`);
    console.log(`  Best Bid: $${orderBook.bids[0]?.[0]} (${orderBook.bids[0]?.[1]} BTC)`);
    console.log(`  Best Ask: $${orderBook.asks[0]?.[0]} (${orderBook.asks[0]?.[1]} BTC)`);

    // Fetch recent trades
    const trades = await adapter.fetchTrades('BTC/USD:USD', { limit: 5 });
    console.log(`\nRecent trades: ${trades.length}`);

    // Fetch funding rate
    const fundingRate = await adapter.fetchFundingRate('BTC/USD:USD');
    console.log(`\nFunding Rate: ${(fundingRate.fundingRate * 100).toFixed(4)}%`);
    console.log(`  Mark Price: $${fundingRate.markPrice}`);
    console.log(`  Index Price: $${fundingRate.indexPrice}`);

    // =========================================================================
    // 2. Account Operations (Requires API Key)
    // =========================================================================
    if (config.apiKey && config.apiKey !== 'your-api-key') {
      console.log('\n--- Account Operations ---');

      // Fetch account balance
      const balances = await adapter.fetchBalance();
      console.log('Account Balances:');
      balances.forEach((b) => {
        console.log(`  ${b.currency}: ${b.total} (Free: ${b.free}, Used: ${b.used})`);
      });

      // Fetch positions
      const positions = await adapter.fetchPositions();
      console.log(`\nOpen Positions: ${positions.length}`);
      positions.forEach((p) => {
        console.log(`  ${p.symbol} ${p.side.toUpperCase()}`);
        console.log(`    Size: ${p.size}, Entry: $${p.entryPrice}`);
        console.log(`    Unrealized PnL: $${p.unrealizedPnl}`);
        console.log(`    Leverage: ${p.leverage}x (${p.marginMode})`);
      });

      // Fetch user fees
      const fees = await adapter.fetchUserFees();
      console.log(`\nFee Rates:`);
      console.log(`  Maker: ${(fees.maker * 100).toFixed(3)}%`);
      console.log(`  Taker: ${(fees.taker * 100).toFixed(3)}%`);

      // =========================================================================
      // 3. Trading Operations
      // =========================================================================
      console.log('\n--- Trading Operations ---');

      // Example: Create a limit order (commented out for safety)
      /*
      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.001,
        price: 40000,
        reduceOnly: false,
        postOnly: true,
      });
      console.log(`Order created: ${order.id}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: ${order.amount} @ $${order.price}`);
      */

      // Set leverage
      await adapter.setLeverage('BTC/USD:USD', 10);
      console.log('Leverage set to 10x for BTC/USD:USD');

      // Set margin mode
      await adapter.setMarginMode('BTC/USD:USD', 'isolated');
      console.log('Margin mode set to isolated for BTC/USD:USD');

      // Fetch order history
      const orderHistory = await adapter.fetchOrderHistory('BTC/USD:USD', undefined, 5);
      console.log(`\nRecent Order History: ${orderHistory.length} orders`);
    }

    // =========================================================================
    // 4. WebSocket Streaming
    // =========================================================================
    console.log('\n--- WebSocket Streaming ---');
    console.log('Starting real-time data streams (will run for 10 seconds)...\n');

    // Create abort controller for cleanup
    const abortController = new AbortController();

    // Stream order book updates
    const orderBookStream = async () => {
      console.log('Subscribing to order book...');
      let count = 0;
      for await (const ob of adapter.watchOrderBook('BTC/USD:USD', 5)) {
        console.log(`[OrderBook] Bid: $${ob.bids[0]?.[0]} | Ask: $${ob.asks[0]?.[0]}`);
        if (++count >= 3) break; // Limit to 3 updates for demo
      }
    };

    // Stream trade updates
    const tradesStream = async () => {
      console.log('Subscribing to trades...');
      let count = 0;
      for await (const trade of adapter.watchTrades('BTC/USD:USD')) {
        console.log(`[Trade] ${trade.side.toUpperCase()} ${trade.amount} @ $${trade.price}`);
        if (++count >= 5) break; // Limit to 5 trades for demo
      }
    };

    // Stream ticker updates
    const tickerStream = async () => {
      console.log('Subscribing to ticker...');
      let count = 0;
      for await (const t of adapter.watchTicker('BTC/USD:USD')) {
        console.log(`[Ticker] Last: $${t.last} | 24h Change: ${t.percentage}%`);
        if (++count >= 3) break; // Limit to 3 updates for demo
      }
    };

    // Run streams concurrently with timeout
    const streamPromise = Promise.race([
      Promise.all([orderBookStream(), tradesStream(), tickerStream()]),
      new Promise((resolve) => setTimeout(resolve, 10000)), // 10 second timeout
    ]);

    await streamPromise;
    console.log('\nWebSocket streaming demo complete');

    // =========================================================================
    // 5. Private WebSocket Streams (Requires API Key)
    // =========================================================================
    if (config.apiKey && config.apiKey !== 'your-api-key') {
      console.log('\n--- Private WebSocket Streams ---');

      // Watch positions (real-time position updates)
      const positionsStream = async () => {
        console.log('Subscribing to positions...');
        let count = 0;
        for await (const positions of adapter.watchPositions()) {
          console.log(`[Positions] ${positions.length} open positions`);
          positions.forEach((p) => {
            console.log(`  ${p.symbol}: ${p.size} @ $${p.entryPrice}, PnL: $${p.unrealizedPnl}`);
          });
          if (++count >= 2) break;
        }
      };

      // Watch orders (real-time order updates)
      const ordersStream = async () => {
        console.log('Subscribing to orders...');
        let count = 0;
        for await (const orders of adapter.watchOrders()) {
          console.log(`[Orders] ${orders.length} active orders`);
          if (++count >= 2) break;
        }
      };

      // Watch balance (real-time balance updates)
      const balanceStream = async () => {
        console.log('Subscribing to balance...');
        let count = 0;
        for await (const balances of adapter.watchBalance()) {
          console.log(`[Balance] ${balances.length} currencies`);
          balances.forEach((b) => {
            console.log(`  ${b.currency}: ${b.total}`);
          });
          if (++count >= 2) break;
        }
      };

      await Promise.race([
        Promise.all([positionsStream(), ordersStream(), balanceStream()]),
        new Promise((resolve) => setTimeout(resolve, 10000)),
      ]);
    }

    console.log('\n--- Example Complete ---');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    await adapter.disconnect();
    console.log('Adapter disconnected');
  }
}

// Run the example
main().catch(console.error);
