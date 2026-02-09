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
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

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
export function toBuffer(
  data: string | Uint8Array,
  encoding?: 'hex' | 'base64' | 'utf8'
): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (encoding === 'hex') {
    return hexToBytes(data);
  }

  if (encoding === 'base64') {
    return base64ToBytes(data);
  }

  // Default: UTF-8
  return new TextEncoder().encode(data);
}

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
export function fromBuffer(data: Uint8Array, encoding: 'hex' | 'base64' | 'utf8'): string {
  if (encoding === 'hex') {
    return bytesToHex(data);
  }

  if (encoding === 'base64') {
    return bytesToBase64(data);
  }

  // Default: UTF-8
  return new TextDecoder().decode(data);
}

/**
 * Allocate a new Uint8Array of specified size (filled with zeros)
 *
 * @param size - Size in bytes
 * @returns Zero-filled Uint8Array
 */
export function allocBuffer(size: number): Uint8Array {
  return new Uint8Array(size);
}

/**
 * Allocate a new Uint8Array without initialization (may contain garbage)
 * Use this for performance when you'll immediately fill the buffer.
 *
 * @param size - Size in bytes
 * @returns Uninitialized Uint8Array
 */
export function allocUnsafe(size: number): Uint8Array {
  // In browsers, there's no way to allocate without zeroing
  // So this is equivalent to allocBuffer
  return new Uint8Array(size);
}

/**
 * Read a 64-bit unsigned integer in little-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns BigInt value
 */
export function readBigUInt64LE(data: Uint8Array, offset: number = 0): bigint {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  return view.getBigUint64(0, true); // true = little-endian
}

/**
 * Read a 64-bit unsigned integer in big-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns BigInt value
 */
export function readBigUInt64BE(data: Uint8Array, offset: number = 0): bigint {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  return view.getBigUint64(0, false); // false = big-endian
}

/**
 * Write a 64-bit unsigned integer in little-endian format
 *
 * @param data - Target Uint8Array
 * @param value - BigInt value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export function writeBigUInt64LE(data: Uint8Array, value: bigint, offset: number = 0): void {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  view.setBigUint64(0, value, true); // true = little-endian
}

/**
 * Write a 64-bit unsigned integer in big-endian format
 *
 * @param data - Target Uint8Array
 * @param value - BigInt value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export function writeBigUInt64BE(data: Uint8Array, value: bigint, offset: number = 0): void {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  view.setBigUint64(0, value, false); // false = big-endian
}

/**
 * Read a 32-bit unsigned integer in little-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns Number value
 */
export function readUInt32LE(data: Uint8Array, offset: number = 0): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  return view.getUint32(0, true);
}

/**
 * Read a 32-bit unsigned integer in big-endian format
 *
 * @param data - Source Uint8Array
 * @param offset - Byte offset to start reading (default: 0)
 * @returns Number value
 */
export function readUInt32BE(data: Uint8Array, offset: number = 0): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  return view.getUint32(0, false);
}

/**
 * Write a 32-bit unsigned integer in little-endian format
 *
 * @param data - Target Uint8Array
 * @param value - Number value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export function writeUInt32LE(data: Uint8Array, value: number, offset: number = 0): void {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  view.setUint32(0, value, true);
}

/**
 * Write a 32-bit unsigned integer in big-endian format
 *
 * @param data - Target Uint8Array
 * @param value - Number value to write
 * @param offset - Byte offset to start writing (default: 0)
 */
export function writeUInt32BE(data: Uint8Array, value: number, offset: number = 0): void {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  view.setUint32(0, value, false);
}

/**
 * Concatenate multiple Uint8Arrays into one
 *
 * @param arrays - Arrays to concatenate
 * @returns Combined Uint8Array
 */
export function concatBuffers(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Compare two Uint8Arrays for equality
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays are equal
 */
export function buffersEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Create a copy of a Uint8Array
 *
 * @param data - Source array
 * @returns New Uint8Array with copied data
 */
export function copyBuffer(data: Uint8Array): Uint8Array {
  return new Uint8Array(data);
}

/**
 * Slice a Uint8Array (creates a copy, not a view)
 *
 * @param data - Source array
 * @param start - Start index (default: 0)
 * @param end - End index (default: data.length)
 * @returns New Uint8Array with sliced data
 */
export function sliceBuffer(data: Uint8Array, start: number = 0, end?: number): Uint8Array {
  return data.slice(start, end);
}

// =============================================================================
// Internal helper functions
// =============================================================================

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substr(i, 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  if (isBrowser) {
    // Browser: use atob
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    // Node.js: use Buffer
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  if (isBrowser) {
    // Browser: use btoa
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  } else {
    // Node.js: use Buffer
    return Buffer.from(bytes).toString('base64');
  }
}
