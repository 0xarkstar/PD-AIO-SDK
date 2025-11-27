# TypeScript Conventions for Perp DEX SDK

## General Rules

- Use TypeScript strict mode (all strict checks enabled)
- Never use `any` type - use `unknown` for truly dynamic data
- Always use ES modules (`import`/`export`, not `require`)
- Prefer `async`/`await` over raw Promises
- Use optional chaining (`?.`) and nullish coalescing (`??`)

## Type Definitions

### Interfaces vs Types

- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, and mapped types
- Prefix interfaces with `I` (e.g., `IExchangeAdapter`)

```typescript
// Good
interface IExchangeAdapter {
  fetchMarkets(): Promise<Market[]>;
}

type OrderType = 'market' | 'limit' | 'stopMarket' | 'stopLimit';
type OrderSide = 'buy' | 'sell';

// Bad
type ExchangeAdapter = {  // Should be interface
  fetchMarkets(): Promise<Market[]>;
};
```

## Naming Conventions

- **Interfaces**: `IExchangeAdapter`, `IAuthStrategy`
- **Types**: `OrderType`, `ConnectionState`
- **Classes**: `HyperliquidAdapter`, `WebSocketManager`
- **Functions**: `fetchMarkets`, `normalizeSymbol`
- **Constants**: `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- **Private members**: `_connectionState`, `_subscriptions`

## Function Declarations

Always specify return types explicitly:

```typescript
// Good
async function fetchMarkets(): Promise<Market[]> {
  // ...
}

function calculatePnl(entry: number, current: number, size: number): number {
  return (current - entry) * size;
}

// Bad
async function fetchMarkets() {  // Missing return type
  // ...
}
```

## Error Handling

- Always type-guard errors in catch blocks
- Use custom error classes that extend `PerpDEXError`
- Include context (exchange name, original error)

```typescript
try {
  await exchange.createOrder(...);
} catch (error) {
  if (error instanceof PerpDEXError) {
    throw error;
  }
  throw new ExchangeUnavailableError(
    'Failed to create order',
    'EXCHANGE_ERROR',
    'hyperliquid',
    error
  );
}
```

## Async Patterns

### Preferred: Async/Await

```typescript
// Good
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return DataSchema.parse(data);
}

// Bad - avoid Promise chains
function fetchData(): Promise<Data> {
  return fetch(url)
    .then(r => r.json())
    .then(d => DataSchema.parse(d));
}
```

### Async Generators for Streaming

```typescript
async function* watchOrderBook(symbol: string): AsyncGenerator<OrderBook> {
  for await (const update of wsManager.subscribe(channel)) {
    yield normalizeOrderBook(update);
  }
}
```

## Zod Validation

Use Zod for all external API responses:

```typescript
import { z } from 'zod';

const OrderResponseSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  amount: z.number().positive(),
  price: z.number().positive().optional(),
});

type OrderResponse = z.infer<typeof OrderResponseSchema>;

// Validate and parse
const order = OrderResponseSchema.parse(apiResponse);
```

## Type Guards

Create type guards for runtime checks:

```typescript
function isMarketOrder(order: Order): order is MarketOrder {
  return order.type === 'market';
}

function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response
  );
}
```

## Generics

Use descriptive generic names:

```typescript
// Good
function mapResponse<TInput, TOutput>(
  data: TInput,
  mapper: (input: TInput) => TOutput
): TOutput {
  return mapper(data);
}

// Bad
function mapResponse<T, U>(data: T, mapper: (input: T) => U): U {
  return mapper(data);
}
```

## Imports

Always use explicit file extensions in imports:

```typescript
// Good
import { normalizeSymbol } from '../utils/normalize.js';
import type { Order } from '../types/common.js';

// Bad
import { normalizeSymbol } from '../utils/normalize';  // Missing .js
```

## Documentation

Every public API must have JSDoc:

```typescript
/**
 * Fetches all available markets from the exchange.
 *
 * @param params - Optional parameters for filtering markets
 * @returns Promise resolving to array of markets
 * @throws {ExchangeUnavailableError} If exchange API is down
 * @throws {RateLimitError} If rate limit exceeded
 *
 * @example
 * ```typescript
 * const markets = await exchange.fetchMarkets({ active: true });
 * console.log(markets[0].symbol); // "BTC/USDT:USDT"
 * ```
 */
async fetchMarkets(params?: MarketParams): Promise<Market[]> {
  // ...
}
```

## No Mutations

Prefer immutable operations:

```typescript
// Good
const newState = { ...state, connected: true };
const newArray = [...items, newItem];

// Bad
state.connected = true;  // Mutation
items.push(newItem);     // Mutation
```

## Null Handling

Use optional chaining and nullish coalescing:

```typescript
// Good
const price = order.price ?? 0;
const symbol = response.data?.symbol ?? 'UNKNOWN';

// Bad
const price = order.price !== null && order.price !== undefined ? order.price : 0;
```

## Enums vs Unions

Prefer const unions over enums:

```typescript
// Good
const ORDER_TYPES = ['market', 'limit', 'stopMarket', 'stopLimit'] as const;
type OrderType = typeof ORDER_TYPES[number];

// Acceptable for error codes
enum ErrorCode {
  INSUFFICIENT_MARGIN = 'INSUFFICIENT_MARGIN',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
}
```
