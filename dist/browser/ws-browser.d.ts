/**
 * Browser WebSocket wrapper
 *
 * This module re-exports the native browser WebSocket to provide
 * compatibility with code written for the Node.js 'ws' package.
 *
 * Bundlers like webpack, vite, and esbuild will use the "browser" field
 * in package.json to replace 'ws' imports with this file.
 */
declare const BrowserWebSocket: any;
export default BrowserWebSocket;
export { BrowserWebSocket as WebSocket };
//# sourceMappingURL=ws-browser.d.ts.map