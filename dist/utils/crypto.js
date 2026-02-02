/**
 * Cross-platform crypto utilities
 *
 * Provides cryptographic functions that work in both Node.js and browser environments.
 * - Node.js: Uses the built-in 'crypto' module
 * - Browser: Uses the Web Crypto API
 *
 * For SHA3, we use the 'js-sha3' library as Web Crypto API doesn't support SHA3.
 */
const isBrowser = typeof window !== 'undefined' && typeof window.crypto !== 'undefined';
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
export async function createHmacSha256(key, message) {
    if (isBrowser) {
        // Web Crypto API
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const msgData = encoder.encode(message);
        const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        return arrayBufferToHex(signature);
    }
    else {
        // Node.js crypto
        const { createHmac } = await import('crypto');
        return createHmac('sha256', key).update(message).digest('hex');
    }
}
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
export function createHmacSha256Sync(key, message) {
    if (isBrowser) {
        throw new Error('createHmacSha256Sync is not available in browsers. Use createHmacSha256 instead.');
    }
    // Dynamic require for Node.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.createHmac('sha256', key).update(message).digest('hex');
}
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
export async function createSha3Hash(data) {
    const { sha3_256 } = await import('js-sha3');
    return sha3_256(data);
}
/**
 * Create SHA3-256 hash (synchronous)
 *
 * @param data - The data to hash (string or Uint8Array)
 * @returns Hex-encoded hash
 */
export function createSha3HashSync(data) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sha3_256 } = require('js-sha3');
    return sha3_256(data);
}
/**
 * Create SHA3-256 hash and return as Buffer/Uint8Array
 *
 * @param data - The data to hash
 * @returns Hash as Uint8Array
 */
export async function createSha3HashBuffer(data) {
    const { sha3_256 } = await import('js-sha3');
    // js-sha3 can return array directly
    return new Uint8Array(sha3_256.array(data));
}
/**
 * Create SHA256 hash
 *
 * @param data - The data to hash (string or Uint8Array)
 * @returns Hex-encoded hash
 */
export async function createSha256Hash(data) {
    if (isBrowser) {
        const encoder = new TextEncoder();
        const msgData = typeof data === 'string' ? encoder.encode(data) : data;
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgData);
        return arrayBufferToHex(hashBuffer);
    }
    else {
        const { createHash } = await import('crypto');
        return createHash('sha256').update(data).digest('hex');
    }
}
/**
 * Create SHA256 hash and return as Uint8Array
 *
 * @param data - The data to hash
 * @returns Hash as Uint8Array
 */
export async function createSha256HashBuffer(data) {
    if (isBrowser) {
        const encoder = new TextEncoder();
        const msgData = typeof data === 'string' ? encoder.encode(data) : data;
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgData);
        return new Uint8Array(hashBuffer);
    }
    else {
        const { createHash } = await import('crypto');
        const hash = createHash('sha256').update(data).digest();
        return new Uint8Array(hash);
    }
}
/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
}
/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
//# sourceMappingURL=crypto.js.map