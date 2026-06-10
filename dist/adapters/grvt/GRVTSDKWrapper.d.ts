/**
 * GRVT HTTP client.
 *
 * Direct REST client for the REAL GRVT API (no `@grvt/client` SDK — that was
 * built against a guessed shape). GRVT splits its API across three hosts:
 *  - edge:        `POST /auth/api_key/login` -> `gravity` cookie + X-Grvt-Account-Id
 *  - trades:      authed orders / account (`full/v1/create_order`, ...)
 *  - market-data: public market data (`full/v1/{instruments,ticker,book,trade}`)
 *
 * All REST is POST with a JSON body; responses wrap the payload in `{ result }`.
 * Authed requests carry `Cookie: gravity=<cookie>` + `X-Grvt-Account-Id: <id>`.
 * This client owns the session (login, refresh-on-expiry) and delegates order
 * signing to the adapter (which uses `signing.ts`); it does no signing itself.
 */
import type { GRVTSession, GRVTCreateOrderBody, GRVTCancelOrderBody } from './types.js';
/**
 * GRVT HTTP client configuration.
 */
export interface GRVTSDKWrapperConfig {
    /** Use testnet hosts (chainId 326). */
    testnet?: boolean;
    /** API key (created in the GRVT UI; required for authed calls). */
    apiKey?: string;
    /** Per-request timeout (ms). */
    timeout?: number;
}
/**
 * Direct GRVT REST client + session manager.
 */
export declare class GRVTSDKWrapper {
    private readonly hosts;
    private readonly apiKey?;
    private readonly timeout;
    private session?;
    constructor(config?: GRVTSDKWrapperConfig);
    /**
     * Log in with the API key, capturing the `gravity` session cookie, the
     * `X-Grvt-Account-Id` header, and the body `{ sub_account_id,
     * funding_account_address }`. Returns the resolved session.
     *
     * @throws {Error} if no API key is configured or the login fails.
     */
    login(): Promise<GRVTSession>;
    /**
     * The current session, if logged in.
     */
    getSession(): GRVTSession | undefined;
    /**
     * The trading sub-account id from the current session (if any).
     */
    getSubAccountId(): string | undefined;
    /**
     * Manually set the session (e.g. restored from elsewhere).
     */
    setSession(session: GRVTSession): void;
    /**
     * Clear the current session.
     */
    clearSession(): void;
    /**
     * Whether a session is present.
     */
    hasSession(): boolean;
    /**
     * Whether the client is configured with an API key (can authenticate).
     */
    hasCredentials(): boolean;
    /**
     * Fetch active perpetual instruments (`full/v1/instruments`).
     */
    getInstruments(): Promise<unknown>;
    /**
     * Fetch a full ticker for one instrument (`full/v1/ticker`).
     */
    getTicker(instrument: string): Promise<unknown>;
    /**
     * Fetch a FULL order-book snapshot (`full/v1/book`). Depth ∈ {10,50,100,500}.
     */
    getOrderBook(instrument: string, depth: number): Promise<unknown>;
    /**
     * Fetch recent public trades (`full/v1/trade`).
     */
    getTrades(instrument: string, limit: number): Promise<unknown>;
    /**
     * Fetch funding-rate entries (`full/v1/funding`).
     */
    getFunding(instrument: string): Promise<unknown>;
    /**
     * Fetch candlesticks (`full/v1/kline`).
     */
    getKline(body: Record<string, unknown>): Promise<unknown>;
    /**
     * Submit a signed order (`full/v1/create_order`). The caller builds + signs
     * the body via `signing.ts`; this method just POSTs it under `{ order }`.
     */
    createOrder(order: GRVTCreateOrderBody): Promise<unknown>;
    /**
     * Cancel a single order by `order_id` or `client_order_id`.
     */
    cancelOrder(body: GRVTCancelOrderBody): Promise<unknown>;
    /**
     * Cancel all open orders for the sub-account.
     */
    cancelAllOrders(subAccountId: string): Promise<unknown>;
    /**
     * Fetch open orders for the sub-account.
     */
    getOpenOrders(subAccountId: string, instrument?: string): Promise<unknown>;
    /**
     * Fetch historical orders for the sub-account.
     */
    getOrderHistory(subAccountId: string, instrument?: string, limit?: number): Promise<unknown>;
    /**
     * Fetch user fills (`full/v1/fill_history`).
     */
    getFillHistory(subAccountId: string, instrument?: string, limit?: number): Promise<unknown>;
    /**
     * Fetch open positions for the sub-account.
     */
    getPositions(subAccountId: string): Promise<unknown>;
    /**
     * Fetch the sub-account summary (balances).
     */
    getSubAccountSummary(subAccountId: string): Promise<unknown>;
    /**
     * POST a public request and unwrap the `{ result }` envelope.
     */
    private postUnwrapped;
    /**
     * POST an authenticated request (cookie + account id), refreshing the session
     * first if it is missing or near expiry. Unwraps the `{ result }` envelope.
     */
    private postAuthed;
    /**
     * Ensure a live session exists, logging in (or refreshing) when needed.
     */
    private ensureSession;
    /**
     * Raw POST helper using the global `fetch` (Node 18+/browser), with a timeout.
     */
    private rawPost;
    /**
     * Read a response body, throw on non-2xx, and unwrap the `{ result }` envelope.
     */
    private handleJson;
    /**
     * Extract the `gravity` cookie value from a Set-Cookie header (single value;
     * `fetch` collapses multiple Set-Cookie headers into one comma-joined string).
     */
    private parseGravityCookie;
}
//# sourceMappingURL=GRVTSDKWrapper.d.ts.map