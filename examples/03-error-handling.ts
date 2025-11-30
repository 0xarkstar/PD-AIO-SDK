/**
 * Example 3: Error Handling and Retry Logic
 *
 * This example demonstrates:
 * - Using automatic retry logic
 * - Handling different error types
 * - Graceful degradation
 * - Error recovery patterns
 * - Best practices for production use
 *
 * Before running:
 * 1. Run: npx ts-node examples/03-error-handling.ts
 */

import { HyperliquidAdapter } from '../src/index.js';
import { createSymbol } from '../src/utils/symbols.js';
import { withRetry } from '../src/core/retry.js';
import {
  InvalidOrderError,
  RateLimitError,
  ExchangeUnavailableError,
  InsufficientMarginError,
} from '../src/types/errors.js';

async function main() {
  console.log('='.repeat(60));
  console.log('ERROR HANDLING & RETRY LOGIC EXAMPLE');
  console.log('='.repeat(60));
  console.log();

  const exchange = new HyperliquidAdapter({
    testnet: true,
  });

  try {
    await exchange.initialize();
    console.log('✅ Connected\n');

    // Example 1: Using automatic retry logic
    console.log('Example 1: Automatic retry with exponential backoff');
    console.log('─'.repeat(60));

    const symbol = createSymbol('hyperliquid', 'BTC');

    const marketsWithRetry = await withRetry(
      () => exchange.fetchMarkets(),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        enableJitter: true,
        onRetry: (attempt, error, delay) => {
          console.log(`   Retry attempt ${attempt} after ${delay}ms`);
          console.log(`   Reason: ${error.message}`);
        },
      }
    );

    console.log(`✅ Fetched ${marketsWithRetry.length} markets (with retry protection)\n`);

    // Example 2: Handling specific error types
    console.log('Example 2: Handling specific error types');
    console.log('─'.repeat(60));

    try {
      // This will fail without credentials
      await exchange.createOrder({
        symbol,
        side: 'buy',
        type: 'market',
        amount: 0.01,
      });
    } catch (error) {
      if (error instanceof InvalidOrderError) {
        console.log('✅ Caught InvalidOrderError:');
        console.log(`   Message: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Exchange: ${error.exchange}`);
      } else {
        console.log('   Unexpected error type:', error);
      }
    }
    console.log();

    // Example 3: Rate limit handling
    console.log('Example 3: Rate limit aware retry');
    console.log('─'.repeat(60));

    async function fetchWithRateLimitHandling() {
      try {
        return await withRetry(() => exchange.fetchTicker(symbol), {
          maxAttempts: 5,
          onRetry: (attempt, error, delay) => {
            if (error instanceof RateLimitError) {
              console.log(`   ⏳ Rate limited. Waiting ${delay}ms before retry...`);
            }
          },
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          console.log('   ❌ Rate limit exceeded even after retries');
          console.log(`   Retry after: ${error.retryAfter}ms`);
        }
        throw error;
      }
    }

    const ticker = await fetchWithRateLimitHandling();
    console.log(`✅ Ticker fetched: $${ticker.last?.toFixed(2)}\n`);

    // Example 4: Graceful degradation
    console.log('Example 4: Graceful degradation pattern');
    console.log('─'.repeat(60));

    async function getMarketDataWithFallback() {
      let data = null;

      // Try primary source
      try {
        console.log('   Trying primary API...');
        data = await exchange.fetchTicker(symbol);
        console.log('   ✅ Primary API succeeded');
        return data;
      } catch (error) {
        console.log('   ⚠️  Primary API failed, trying fallback...');
      }

      // Try fallback
      try {
        data = await exchange.fetchMarkets();
        const market = data.find((m) => m.symbol === symbol);
        console.log('   ✅ Fallback succeeded (using market data)');
        return market;
      } catch (error) {
        console.log('   ❌ All sources failed');
        throw new Error('Unable to fetch market data from any source');
      }
    }

    const marketData = await getMarketDataWithFallback();
    console.log(`   Result: ${JSON.stringify(marketData, null, 2).slice(0, 200)}...\n`);

    // Example 5: Error classification
    console.log('Example 5: Classifying errors for appropriate handling');
    console.log('─'.repeat(60));

    function isRetryableError(error: Error): boolean {
      // Network errors are retryable
      if (error instanceof ExchangeUnavailableError) return true;

      // Rate limits are retryable with backoff
      if (error instanceof RateLimitError) return true;

      // Business logic errors are not retryable
      if (error instanceof InvalidOrderError) return false;
      if (error instanceof InsufficientMarginError) return false;

      // Unknown errors - be conservative
      return false;
    }

    const testErrors = [
      new InvalidOrderError('Invalid price', 'INVALID_PRICE', 'hyperliquid'),
      new RateLimitError('Too many requests', 'hyperliquid', 5000),
      new ExchangeUnavailableError('Connection timeout', 'TIMEOUT', 'hyperliquid'),
    ];

    testErrors.forEach((err) => {
      const retryable = isRetryableError(err);
      console.log(`   ${err.constructor.name}: ${retryable ? '✅ Retryable' : '❌ Not retryable'}`);
    });
    console.log();

    // Example 6: Production error handling pattern
    console.log('Example 6: Production-ready error handling');
    console.log('─'.repeat(60));

    async function productionSafeFetch() {
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`   Attempt ${attempt}/${maxRetries}...`);

          const result = await exchange.fetchMarkets({ active: true });

          console.log(`   ✅ Success on attempt ${attempt}`);
          return result;
        } catch (error) {
          lastError = error as Error;

          // Don't retry on business logic errors
          if (
            error instanceof InvalidOrderError ||
            error instanceof InsufficientMarginError
          ) {
            console.log('   ❌ Non-retryable error, aborting');
            throw error;
          }

          // Log the error
          console.log(`   ⚠️  Attempt ${attempt} failed: ${lastError.message}`);

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`   Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // All retries exhausted
      console.log('   ❌ All retry attempts exhausted');
      throw lastError || new Error('Unknown error');
    }

    const safeResult = await productionSafeFetch();
    console.log(`   Final result: ${safeResult.length} markets\n`);

    // Example 7: Circuit breaker pattern
    console.log('Example 7: Circuit breaker pattern');
    console.log('─'.repeat(60));

    class CircuitBreaker {
      private failureCount = 0;
      private lastFailureTime = 0;
      private readonly threshold = 5;
      private readonly timeout = 60000; // 1 minute

      async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (this.isOpen()) {
          const waitTime = this.timeout - (Date.now() - this.lastFailureTime);
          throw new Error(`Circuit breaker open. Try again in ${Math.ceil(waitTime / 1000)}s`);
        }

        try {
          const result = await fn();
          this.onSuccess();
          return result;
        } catch (error) {
          this.onFailure();
          throw error;
        }
      }

      private isOpen(): boolean {
        return this.failureCount >= this.threshold &&
               Date.now() - this.lastFailureTime < this.timeout;
      }

      private onSuccess(): void {
        this.failureCount = 0;
      }

      private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
      }

      getStatus(): string {
        if (this.isOpen()) return 'OPEN (blocking requests)';
        if (this.failureCount > 0) return `HALF-OPEN (${this.failureCount} failures)`;
        return 'CLOSED (healthy)';
      }
    }

    const breaker = new CircuitBreaker();
    console.log(`   Circuit breaker status: ${breaker.getStatus()}`);

    const result = await breaker.execute(() => exchange.fetchMarkets());
    console.log(`   ✅ Request succeeded through circuit breaker`);
    console.log(`   Circuit breaker status: ${breaker.getStatus()}\n`);

    console.log('='.repeat(60));
    console.log('✅ EXAMPLE COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log();
    console.log('Key Takeaways:');
    console.log('1. Use withRetry() for automatic retry with exponential backoff');
    console.log('2. Handle specific error types for appropriate recovery');
    console.log('3. Implement graceful degradation for critical operations');
    console.log('4. Classify errors as retryable vs non-retryable');
    console.log('5. Use circuit breakers to prevent cascade failures');
    console.log('6. Always log errors with sufficient context for debugging');
  } catch (error) {
    console.error('\n❌ Example error:');
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
