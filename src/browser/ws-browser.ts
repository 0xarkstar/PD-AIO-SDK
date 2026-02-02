/**
 * Browser WebSocket wrapper
 *
 * This module re-exports the native browser WebSocket to provide
 * compatibility with code written for the Node.js 'ws' package.
 *
 * Bundlers like webpack, vite, and esbuild will use the "browser" field
 * in package.json to replace 'ws' imports with this file.
 */

// Get reference to global WebSocket
const BrowserWebSocket = typeof window !== 'undefined'
  ? window.WebSocket
  : (globalThis as any).WebSocket;

// Export as default and named export to match 'ws' package interface
export default BrowserWebSocket;
export { BrowserWebSocket as WebSocket };
