/**
 * Browser WebSocket wrapper
 *
 * This module re-exports the native browser WebSocket to provide
 * compatibility with code written for the Node.js 'ws' package.
 *
 * Bundlers like webpack, vite, and esbuild will use the "browser" field
 * in package.json to replace 'ws' imports with this file.
 */
declare const BrowserWebSocket: {
    new (url: string | URL, protocols?: string | string[]): WebSocket;
    prototype: WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
};
export default BrowserWebSocket;
export { BrowserWebSocket as WebSocket };
//# sourceMappingURL=ws-browser.d.ts.map