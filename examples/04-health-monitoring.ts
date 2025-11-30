/**
 * Example 4: Health Monitoring and Metrics
 *
 * This example demonstrates:
 * - Running health checks
 * - Monitoring API metrics
 * - Tracking performance
 * - Identifying bottlenecks
 * - Production monitoring patterns
 *
 * Before running:
 * 1. Run: npx ts-node examples/04-health-monitoring.ts
 */

import { HyperliquidAdapter } from '../src/index.js';
import { createSymbol } from '../src/utils/symbols.js';
import { isHealthy, isCriticallyUnhealthy } from '../src/types/health.js';
import { getTopEndpoints, getSlowestEndpoints, getMostErrorProneEndpoints } from '../src/types/metrics.js';

async function main() {
  console.log('='.repeat(60));
  console.log('HEALTH MONITORING & METRICS EXAMPLE');
  console.log('='.repeat(60));
  console.log();

  const exchange = new HyperliquidAdapter({
    testnet: false,
  });

  try {
    await exchange.initialize();
    console.log('✅ Connected\n');

    // Example 1: Basic health check
    console.log('Example 1: Basic health check');
    console.log('─'.repeat(60));

    const health = await exchange.healthCheck();

    console.log('Health Check Results:');
    console.log(`   Overall Status: ${health.status.toUpperCase()}`);
    console.log(`   Overall Latency: ${health.latency}ms`);
    console.log();

    console.log('   API Health:');
    console.log(`      Reachable: ${health.api.reachable ? '✅' : '❌'}`);
    console.log(`      Latency: ${health.api.latency}ms`);
    if (health.api.error) {
      console.log(`      Error: ${health.api.error}`);
    }
    console.log();

    if (health.websocket) {
      console.log('   WebSocket Health:');
      console.log(`      Connected: ${health.websocket.connected ? '✅' : '❌'}`);
      console.log(`      Reconnecting: ${health.websocket.reconnecting ? 'Yes' : 'No'}`);
      if (health.websocket.uptime) {
        console.log(`      Uptime: ${(health.websocket.uptime / 1000).toFixed(0)}s`);
      }
      console.log();
    }

    if (health.rateLimit) {
      console.log('   Rate Limit Status:');
      console.log(`      Remaining: ${health.rateLimit.remaining}/${health.rateLimit.limit}`);
      console.log(`      Usage: ${health.rateLimit.percentUsed.toFixed(1)}%`);
      console.log(`      Resets at: ${new Date(health.rateLimit.resetAt).toLocaleTimeString()}`);
      console.log();
    }

    // Example 2: Health status interpretation
    console.log('Example 2: Interpreting health status');
    console.log('─'.repeat(60));

    if (isHealthy(health.status)) {
      console.log('   ✅ Exchange is operational');
    } else if (isCriticallyUnhealthy(health)) {
      console.log('   ❌ Exchange is critically unhealthy - consider failover');
    } else {
      console.log('   ⚠️  Exchange is degraded - some features may be limited');
    }
    console.log();

    // Example 3: Generate some API traffic for metrics
    console.log('Example 3: Generating API traffic...');
    console.log('─'.repeat(60));

    const symbol = createSymbol('hyperliquid', 'BTC');

    console.log('   Making various API calls...');
    await exchange.fetchMarkets();
    await exchange.fetchTicker(symbol);
    await exchange.fetchOrderBook(symbol);
    await exchange.fetchTrades(symbol);
    await exchange.fetchFundingRate(symbol);

    // Make some calls to different symbols
    for (const base of ['ETH', 'SOL', 'MATIC']) {
      const sym = createSymbol('hyperliquid', base);
      await exchange.fetchTicker(sym);
    }

    console.log('   ✅ Generated API traffic\n');

    // Example 4: View metrics snapshot
    console.log('Example 4: API metrics overview');
    console.log('─'.repeat(60));

    const metrics = exchange.getMetrics();

    console.log('Overall Metrics:');
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Successful: ${metrics.successfulRequests} (${(metrics.successRate * 100).toFixed(2)}%)`);
    console.log(`   Failed: ${metrics.failedRequests} (${(metrics.errorRate * 100).toFixed(2)}%)`);
    console.log(`   Rate Limit Hits: ${metrics.rateLimitHits}`);
    console.log(`   Average Latency: ${metrics.averageLatency.toFixed(2)}ms`);
    console.log(`   Collection Duration: ${(metrics.collectionDuration / 1000).toFixed(0)}s`);
    console.log();

    // Example 5: Top endpoints by usage
    console.log('Example 5: Top endpoints by request count');
    console.log('─'.repeat(60));

    if (metrics.endpoints.length > 0) {
      console.log('   Most Used Endpoints:');
      metrics.endpoints.slice(0, 5).forEach((ep, i) => {
        console.log(`   ${i + 1}. ${ep.endpoint}`);
        console.log(`      Requests: ${ep.count}`);
        console.log(`      Avg Latency: ${ep.averageLatency.toFixed(2)}ms`);
        console.log(`      Error Rate: ${(ep.errorRate * 100).toFixed(2)}%`);
      });
    } else {
      console.log('   No endpoint data yet');
    }
    console.log();

    // Example 6: Performance analysis
    console.log('Example 6: Performance analysis');
    console.log('─'.repeat(60));

    // Generate more traffic to see performance patterns
    console.log('   Generating additional traffic for analysis...');
    for (let i = 0; i < 10; i++) {
      await exchange.fetchMarkets();
    }

    const latestMetrics = exchange.getMetrics();
    const rawMetrics = {
      totalRequests: latestMetrics.totalRequests,
      successfulRequests: latestMetrics.successfulRequests,
      failedRequests: latestMetrics.failedRequests,
      rateLimitHits: latestMetrics.rateLimitHits,
      averageLatency: latestMetrics.averageLatency,
      endpointStats: new Map(),
      startedAt: Date.now(),
    };

    // Populate endpoint stats from snapshot
    latestMetrics.endpoints.forEach((ep) => {
      rawMetrics.endpointStats.set(ep.endpoint, {
        endpoint: ep.endpoint,
        count: ep.count,
        totalLatency: ep.averageLatency * ep.count,
        errors: Math.round(ep.errorRate * ep.count),
        minLatency: 0,
        maxLatency: 0,
      });
    });

    const topEndpoints = getTopEndpoints(rawMetrics, 3);
    const slowestEndpoints = getSlowestEndpoints(rawMetrics, 3);
    const errorProneEndpoints = getMostErrorProneEndpoints(rawMetrics, 3);

    console.log('\n   📊 Top 3 Most Used Endpoints:');
    topEndpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.endpoint} (${ep.count} calls)`);
    });

    console.log('\n   🐌 Top 3 Slowest Endpoints:');
    slowestEndpoints.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.endpoint} (${ep.averageLatency.toFixed(2)}ms avg)`);
    });

    console.log('\n   ⚠️  Top 3 Error-Prone Endpoints:');
    if (errorProneEndpoints.length > 0) {
      errorProneEndpoints.forEach((ep, i) => {
        console.log(`   ${i + 1}. ${ep.endpoint} (${(ep.errorRate * 100).toFixed(2)}% error rate)`);
      });
    } else {
      console.log('   ✅ No errors detected');
    }
    console.log();

    // Example 7: Continuous monitoring pattern
    console.log('Example 7: Continuous monitoring pattern');
    console.log('─'.repeat(60));

    async function monitoringLoop() {
      console.log('   Starting monitoring loop (5 iterations)...\n');

      for (let i = 1; i <= 5; i++) {
        console.log(`   Iteration ${i}:`);

        // Check health
        const h = await exchange.healthCheck({ timeout: 3000 });
        console.log(`      Health: ${h.status}, Latency: ${h.latency}ms`);

        // Get metrics
        const m = exchange.getMetrics();
        console.log(`      Requests: ${m.totalRequests}, Success Rate: ${(m.successRate * 100).toFixed(1)}%`);
        console.log(`      Avg Latency: ${m.averageLatency.toFixed(2)}ms`);

        // Make some API calls
        await exchange.fetchMarkets();

        // Wait before next iteration
        if (i < 5) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    await monitoringLoop();
    console.log();

    // Example 8: Metrics reset
    console.log('Example 8: Resetting metrics');
    console.log('─'.repeat(60));

    const beforeReset = exchange.getMetrics();
    console.log(`   Before reset: ${beforeReset.totalRequests} total requests`);

    exchange.resetMetrics();

    const afterReset = exchange.getMetrics();
    console.log(`   After reset: ${afterReset.totalRequests} total requests`);
    console.log(`   ✅ Metrics reset successfully\n`);

    // Example 9: Production monitoring recommendations
    console.log('Example 9: Production monitoring best practices');
    console.log('─'.repeat(60));

    console.log(`
   Recommended Monitoring Setup:

   1. Health Checks:
      - Run every 30-60 seconds
      - Alert if status is 'unhealthy' for >2 minutes
      - Alert if latency exceeds threshold (e.g., 1000ms)

   2. Metrics Collection:
      - Snapshot metrics every 5 minutes
      - Store in time-series database
      - Track trends over time

   3. Alerting Thresholds:
      - Error rate > 5% for >5 minutes
      - Average latency > 500ms for >5 minutes
      - Rate limit usage > 80%
      - Any endpoint with >10% error rate

   4. Dashboards:
      - Request rate (requests/minute)
      - Success/error rates
      - Latency percentiles (p50, p95, p99)
      - Top endpoints by volume and latency

   5. Logging:
      - Log all health check failures
      - Log metrics snapshots
      - Log unusual patterns (spikes, drops)
    `);

    console.log('='.repeat(60));
    console.log('✅ EXAMPLE COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error);
  } finally {
    await exchange.disconnect();
    console.log('\n✅ Disconnected\n');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
