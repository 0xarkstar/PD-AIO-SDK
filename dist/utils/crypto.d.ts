/**
 * Cross-platform crypto utilities
 *
 * Provides cryptographic functions that work in both Node.js and browser environments.
 * - Node.js: Uses the built-in 'crypto' module
 * - Browser: Uses the Web Crypto API
 *
 * For SHA3, we use the 'js-sha3' library as Web Crypto API doesn't support SHA3.
 */
/**
 * Create HMAC-SHA256 signature
 *
 * @param key - The secret key for HMAC
 * @param message - The message to sign
 * @returns Hex-encoded signature
 *
 * @example
 * ```typescript
 * const signature = await createHmacSha256('secret', 'message');
 * // Returns: "...hex string..."
 * ```
 */
export declare function createHmacSha256(key: string, message: string): Promise<string>;
/**
 * Create HMAC-SHA256 signature (synchronous Node.js only)
 *
 * For backward compatibility in Node.js environments.
 * In browsers, use the async version instead.
 *
 * @param key - The secret key for HMAC
 * @param message - The message to sign
 * @returns Hex-encoded signature
 */
export declare function createHmacSha256Sync(key: string, message: string): string;
/**
 * Create SHA3-256 hash
 *
 * Uses js-sha3 library for cross-platform compatibility
 * since Web Crypto API doesn't support SHA3.
 *
 * @param data - The data to hash (string or Uint8Array)
 * @returns Hex-encoded hash
 *
 * @example
 * ```typescript
 * const hash = await createSha3Hash('hello');
 * // Returns: "...hex string..."
 * ```
 */
export declare function createSha3Hash(data: string | Uint8Array): Promise<string>;
/**
 * Create SHA3-256 hash (synchronous)
 *
 * @param data - The data to hash (string or Uint8Array)
 * @returns Hex-encoded hash
 */
export declare function createSha3HashSync(data: string | Uint8Array): string;
/**
 * Create SHA3-256 hash and return as Buffer/Uint8Array
 *
 * @param data - The data to hash
 * @returns Hash as Uint8Array
 */
export declare function createSha3HashBuffer(data: string | Uint8Array): Promise<Uint8Array>;
/**
 * Create SHA256 hash
 *
 * @param data - The data to hash (string or Uint8Array)
 * @returns Hex-encoded hash
 */
export declare function createSha256Hash(data: string | Uint8Array): Promise<string>;
/**
 * Create SHA256 hash and return as Uint8Array
 *
 * @param data - The data to hash
 * @returns Hash as Uint8Array
 */
export declare function createSha256HashBuffer(data: string | Uint8Array): Promise<Uint8Array>;
/**
 * Convert hex string to Uint8Array
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Convert Uint8Array to hex string
 */
export declare function bytesToHex(bytes: Uint8Array): string;
//# sourceMappingURL=crypto.d.ts.map