/**
 * Cross-platform Buffer utilities
 *
 * Provides buffer manipulation functions that work in both Node.js and browser environments.
 * Uses Uint8Array as the base type for cross-platform compatibility.
 *
 * In browsers, these functions use native APIs (TextEncoder, atob/btoa).
 * In Node.js, they also work but can optionally use Buffer for better performance.
 */
/**
 * Convert string or Uint8Array to Uint8Array (buffer)
 *
 * @param data - Input data as string or Uint8Array
 * @param encoding - String encoding: 'hex', 'base64', or 'utf8' (default)
 * @returns Uint8Array
 *
 * @example
 * ```typescript
 * const bytes = toBuffer('hello', 'utf8');
 * const bytes = toBuffer('48656c6c6f', 'hex');
 * const bytes = toBuffer('SGVsbG8=', 'base64');
 * ```
 */
export declare function toBuffer(data: string | Uint8Array, encoding?: 'hex' | 'base64' | 'utf8'): Uint8Array;
/**
 * Convert Uint8Array to string with specified encoding
 *
 * @param data - Input Uint8Array
 * @param encoding - Output encoding: 'hex', 'base64', or 'utf8'
 * @returns Encoded string
 *
 * @example
 * ```typescript
 * const hex = fromBuffer(bytes, 'hex');
 * const base64 = fromBuffer(bytes, 'base64');
 * const text = fromBuffer(bytes, 'utf8');
 * ```
 */
export declare function fromBuffer(data: Uint8Array, encoding: 'hex' | 'base64' | 'utf8'): string;
/**
 * Allocate a new Uint8Array of specified size (filled with zeros)
 *
 * @param size - Size in bytes
 * @returns Zero-filled Uint8Array
 */
export declare function allocBuffer(size: number): Uint8Array;
/**
 * Allocate a new Uint8Array without initialization (may contain garbage)
 * Use this for performance when you'll immediately fill the buffer.
 *
 * @param size - Size in bytes
 * @returns Uninitialized Uint8Array
 */
export declare function allocUnsafe(size: number): Uint8Array;
/**
 * Read a 64-bit unsigned integer in little-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns BigInt value
 */
export declare function readBigUInt64LE(data: Uint8Array, offset?: number): bigint;
/**
 * Read a 64-bit unsigned integer in big-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns BigInt value
 */
export declare function readBigUInt64BE(data: Uint8Array, offset?: number): bigint;
/**
 * Write a 64-bit unsigned integer in little-endian format
 *
 * @param data - Target Uint8Array
 * @param value - BigInt value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export declare function writeBigUInt64LE(data: Uint8Array, value: bigint, offset?: number): void;
/**
 * Write a 64-bit unsigned integer in big-endian format
 *
 * @param data - Target Uint8Array
 * @param value - BigInt value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export declare function writeBigUInt64BE(data: Uint8Array, value: bigint, offset?: number): void;
/**
 * Read a 32-bit unsigned integer in little-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns Number value
 */
export declare function readUInt32LE(data: Uint8Array, offset?: number): number;
/**
 * Read a 32-bit unsigned integer in big-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns Number value
 */
export declare function readUInt32BE(data: Uint8Array, offset?: number): number;
/**
 * Write a 32-bit unsigned integer in little-endian format
 *
 * @param data - Target Uint8Array
 * @param value - Number value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export declare function writeUInt32LE(data: Uint8Array, value: number, offset?: number): void;
/**
 * Write a 32-bit unsigned integer in big-endian format
 *
 * @param data - Target Uint8Array
 * @param value - Number value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export declare function writeUInt32BE(data: Uint8Array, value: number, offset?: number): void;
/**
 * Concatenate multiple Uint8Arrays into one
 *
 * @param arrays - Arrays to concatenate
 * @returns Combined Uint8Array
 */
export declare function concatBuffers(...arrays: Uint8Array[]): Uint8Array;
/**
 * Compare two Uint8Arrays for equality
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays are equal
 */
export declare function buffersEqual(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Create a copy of a Uint8Array
 *
 * @param data - Source array
 * @returns New Uint8Array with copied data
 */
export declare function copyBuffer(data: Uint8Array): Uint8Array;
/**
 * Slice a Uint8Array (creates a copy, not a view)
 *
 * @param data - Source array
 * @param start - Start index (default: 0)
 * @param end - End index (default: data.length)
 * @returns New Uint8Array with sliced data
 */
export declare function sliceBuffer(data: Uint8Array, start?: number, end?: number): Uint8Array;
//# sourceMappingURL=buffer.d.ts.map