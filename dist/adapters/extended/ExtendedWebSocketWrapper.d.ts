/**
 * Extended WebSocket Wrapper — real per-stream protocol (live-verified
 * 2026-06-11, capture in tests/fixtures/extended/)
 *
 * The venue model (the previous single-multiplexed-socket implementation
 * with {action:'subscribe'} frames, JSON auth and a JSON ping/pong heartbeat
 * was fictional — the host it targeted is NXDOMAIN):
 *
 * - ONE socket per (stream, market): `{base}/{stream}/{market}`, e.g.
 *   `{base}/orderbooks/BTC-USD`, `{base}/publicTrades/BTC-USD`. The HTTP
 *   upgrade IS the subscription — the client sends ZERO outbound frames.
 * - Keepalive: the SERVER sends WS protocol-level PINGs (~1s) and the
 *   runtime auto-PONGs. No JSON heartbeat exists, so none is implemented.
 * - Orderbook: first frame per connection is a full SNAPSHOT, every
 *   subsequent frame a DELTA applied via the `c` field (new ABSOLUTE qty,
 *   c=="0" deletes). A FULL unified book is emitted per frame; client
 *   `limit` is served by SLICING the maintained book — `?depth=10`/`20`
 *   silently fail live and are never forwarded.
 * - Trades: the first frame per (re)connection is a 50-trade HISTORICAL
 *   backfill (timestamps predate connect) and is skipped. Non-TRADE flow
 *   (LIQUIDATION/DELEVERAGE) is kept, tagged via `info.tT`.
 * - Reconnect re-opens the per-stream URL; the fresh SNAPSHOT rebuilds the
 *   book. `seq` is per-connection and is passed through as `sequenceId`
 *   (it RESETS to 1 on reconnect — never persisted across connections).
 *
 * Scope: public orderbooks + publicTrades streams only (the venue funding
 * stream exists but is out of scope for this repair).
 */
import type { OrderBook, Trade } from '../../types/common.js';
export interface ExtendedWebSocketConfig {
    /**
     * Per-stream WS BASE (e.g.
     * `wss://api.starknet.extended.exchange/stream.extended.exchange/v1`).
     * The wrapper composes `{base}/{stream}/{market}` per subscription.
     */
    wsUrl: string;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    /** Base reconnect backoff delay in ms (exponential, for tests) */
    reconnectDelayMs?: number;
}
/**
 * WebSocket wrapper for Extended exchange
 * Provides AsyncGenerator-based streaming for real-time public market data
 */
export declare class ExtendedWebSocketWrapper {
    /** Maximum queue size for backpressure */
    private static readonly MAX_QUEUE_SIZE;
    private readonly streamBase;
    private readonly reconnect;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelayMs;
    private readonly normalizer;
    private readonly logger;
    private readonly streams;
    constructor(config: ExtendedWebSocketConfig);
    /**
     * Watch order book updates
     *
     * Seeds from the connection SNAPSHOT, applies DELTAs via the `c` field and
     * yields a FULL unified OrderBook per frame. `limit` slices the maintained
     * book (never forwarded as `?depth` — depth=10/20 silently fail live).
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch public trade updates
     *
     * The first frame per (re)connection (50-trade historical backfill) is
     * skipped. LIQUIDATION/DELEVERAGE flow is kept, tagged via `info.tT`.
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Disconnect all per-stream sockets
     */
    disconnect(): void;
    /**
     * Check if any stream socket is open
     */
    get connected(): boolean;
    /**
     * Core consumer loop: opens (or joins) the per-stream socket and yields
     * normalized payloads dispatched by {@link handleFrame}.
     */
    private streamPayloads;
    /**
     * Open (or reuse) the socket for a (stream, market) pair
     */
    private openStream;
    /**
     * Connect one per-stream socket. The URL IS the subscription: nothing is
     * sent after the upgrade (no subscribe, no auth, no JSON ping).
     */
    private connectStream;
    /**
     * Decode one raw frame and dispatch normalized payloads to consumers
     */
    private handleFrame;
    /**
     * Reconnect = re-open the per-stream URL. There is nothing to replay: the
     * URL is the subscription, the fresh SNAPSHOT rebuilds the book and the
     * trades backfill gate re-arms (see onopen).
     */
    private scheduleReconnect;
    /**
     * Close a stream socket once its last consumer is gone
     */
    private closeStream;
    /**
     * Get stream key for subscription tracking
     */
    private getChannelKey;
}
//# sourceMappingURL=ExtendedWebSocketWrapper.d.ts.map