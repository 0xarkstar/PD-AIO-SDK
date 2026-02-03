/**
 * Buffer Utilities Browser Environment Tests
 *
 * Tests for browser-specific code paths by mocking the browser environment
 */

describe('buffer utilities (browser environment)', () => {
  // These tests use jest.resetModules to force fresh module loading
  // with browser environment mocked

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    // Clean up browser globals
    // @ts-expect-error - cleaning up
    delete global.window;
    // @ts-expect-error - cleaning up
    delete global.atob;
    // @ts-expect-error - cleaning up
    delete global.btoa;
  });

  test('base64ToBytes uses atob in browser', async () => {
    // Set up browser environment
    // @ts-expect-error - mocking browser globals
    global.window = {};
    global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

    const { toBuffer } = await import('../../src/utils/buffer.js');

    const result = toBuffer('SGVsbG8=', 'base64');
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
  });

  test('bytesToBase64 uses btoa in browser', async () => {
    // Set up browser environment
    // @ts-expect-error - mocking browser globals
    global.window = {};
    global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

    const { fromBuffer } = await import('../../src/utils/buffer.js');

    const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = fromBuffer(buffer, 'base64');
    expect(result).toBe('SGVsbG8=');
  });

  test('base64 round trip in browser environment', async () => {
    // @ts-expect-error - mocking browser globals
    global.window = {};
    global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

    const { toBuffer, fromBuffer } = await import('../../src/utils/buffer.js');

    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const base64 = fromBuffer(original, 'base64');
    const restored = toBuffer(base64, 'base64');

    expect(Array.from(restored)).toEqual([1, 2, 3, 4, 5]);
  });

  test('base64 with various byte values in browser', async () => {
    // @ts-expect-error - mocking browser globals
    global.window = {};
    global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

    const { toBuffer, fromBuffer } = await import('../../src/utils/buffer.js');

    // Test with bytes that need proper encoding
    const bytes = new Uint8Array([0, 127, 128, 255]);
    const base64 = fromBuffer(bytes, 'base64');
    const restored = toBuffer(base64, 'base64');

    expect(Array.from(restored)).toEqual([0, 127, 128, 255]);
  });

  test('empty base64 in browser', async () => {
    // @ts-expect-error - mocking browser globals
    global.window = {};
    global.atob = (str: string) => (str ? Buffer.from(str, 'base64').toString('binary') : '');
    global.btoa = (str: string) => (str ? Buffer.from(str, 'binary').toString('base64') : '');

    const { toBuffer, fromBuffer } = await import('../../src/utils/buffer.js');

    const empty = new Uint8Array(0);
    const base64 = fromBuffer(empty, 'base64');
    expect(base64).toBe('');

    const restored = toBuffer('', 'base64');
    expect(restored.length).toBe(0);
  });
});

describe('buffer utilities (additional Node.js coverage)', () => {
  // These tests ensure Node.js code paths are covered

  beforeEach(() => {
    jest.resetModules();
    // Ensure we're in Node.js environment
    // @ts-expect-error - cleaning up
    delete global.window;
  });

  test('toBuffer handles all encoding paths', async () => {
    const { toBuffer } = await import('../../src/utils/buffer.js');

    // UTF-8 (default)
    const utf8 = toBuffer('hello');
    expect(Array.from(utf8)).toEqual([104, 101, 108, 108, 111]);

    // Hex
    const hex = toBuffer('deadbeef', 'hex');
    expect(Array.from(hex)).toEqual([222, 173, 190, 239]);

    // Base64
    const base64 = toBuffer('SGVsbG8=', 'base64');
    expect(Array.from(base64)).toEqual([72, 101, 108, 108, 111]);

    // Uint8Array passthrough
    const arr = new Uint8Array([1, 2, 3]);
    expect(toBuffer(arr)).toBe(arr);
  });

  test('fromBuffer handles all encoding paths', async () => {
    const { fromBuffer } = await import('../../src/utils/buffer.js');

    const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

    // UTF-8
    expect(fromBuffer(buffer, 'utf8')).toBe('Hello');

    // Hex
    expect(fromBuffer(buffer, 'hex')).toBe('48656c6c6f');

    // Base64
    expect(fromBuffer(buffer, 'base64')).toBe('SGVsbG8=');
  });

  test('hexToBytes internal function handles edge cases', async () => {
    const { toBuffer } = await import('../../src/utils/buffer.js');

    // Empty hex
    const empty = toBuffer('', 'hex');
    expect(empty.length).toBe(0);

    // All zeros
    const zeros = toBuffer('0000', 'hex');
    expect(Array.from(zeros)).toEqual([0, 0]);

    // All 0xff
    const ones = toBuffer('ffff', 'hex');
    expect(Array.from(ones)).toEqual([255, 255]);
  });

  test('bytesToHex internal function handles edge cases', async () => {
    const { fromBuffer } = await import('../../src/utils/buffer.js');

    // Empty buffer
    expect(fromBuffer(new Uint8Array(0), 'hex')).toBe('');

    // Single byte needing padding
    expect(fromBuffer(new Uint8Array([0]), 'hex')).toBe('00');
    expect(fromBuffer(new Uint8Array([15]), 'hex')).toBe('0f');
  });

  test('base64 encoding edge cases in Node.js', async () => {
    const { toBuffer, fromBuffer } = await import('../../src/utils/buffer.js');

    // Standard base64 padding
    const oneByte = new Uint8Array([65]); // 'A'
    const b64One = fromBuffer(oneByte, 'base64');
    const restored = toBuffer(b64One, 'base64');
    expect(Array.from(restored)).toEqual([65]);

    // Two bytes (needs == padding)
    const twoBytes = new Uint8Array([65, 66]); // 'AB'
    const b64Two = fromBuffer(twoBytes, 'base64');
    const restoredTwo = toBuffer(b64Two, 'base64');
    expect(Array.from(restoredTwo)).toEqual([65, 66]);

    // Three bytes (needs = padding)
    const threeBytes = new Uint8Array([65, 66, 67]); // 'ABC'
    const b64Three = fromBuffer(threeBytes, 'base64');
    const restoredThree = toBuffer(b64Three, 'base64');
    expect(Array.from(restoredThree)).toEqual([65, 66, 67]);
  });

  test('BigInt boundary values', async () => {
    const {
      allocBuffer,
      writeBigUInt64LE,
      writeBigUInt64BE,
      readBigUInt64LE,
      readBigUInt64BE,
    } = await import('../../src/utils/buffer.js');

    // Test max uint64 value
    const maxValue = BigInt('18446744073709551615'); // 2^64 - 1
    const buffer = allocBuffer(8);

    writeBigUInt64LE(buffer, maxValue, 0);
    expect(readBigUInt64LE(buffer, 0)).toBe(maxValue);

    writeBigUInt64BE(buffer, maxValue, 0);
    expect(readBigUInt64BE(buffer, 0)).toBe(maxValue);

    // Test zero
    writeBigUInt64LE(buffer, BigInt(0), 0);
    expect(readBigUInt64LE(buffer, 0)).toBe(BigInt(0));
  });

  test('UInt32 boundary values', async () => {
    const {
      allocBuffer,
      writeUInt32LE,
      writeUInt32BE,
      readUInt32LE,
      readUInt32BE,
    } = await import('../../src/utils/buffer.js');

    // Test max uint32 value
    const maxValue = 0xffffffff;
    const buffer = allocBuffer(4);

    writeUInt32LE(buffer, maxValue, 0);
    expect(readUInt32LE(buffer, 0)).toBe(maxValue);

    writeUInt32BE(buffer, maxValue, 0);
    expect(readUInt32BE(buffer, 0)).toBe(maxValue);

    // Test zero
    writeUInt32LE(buffer, 0, 0);
    expect(readUInt32LE(buffer, 0)).toBe(0);
  });

  test('concatBuffers with various inputs', async () => {
    const { concatBuffers, allocBuffer } = await import('../../src/utils/buffer.js');

    // Large buffers
    const large1 = allocBuffer(1000);
    large1.fill(1);
    const large2 = allocBuffer(1000);
    large2.fill(2);

    const result = concatBuffers(large1, large2);
    expect(result.length).toBe(2000);
    expect(result[0]).toBe(1);
    expect(result[999]).toBe(1);
    expect(result[1000]).toBe(2);
    expect(result[1999]).toBe(2);
  });

  test('sliceBuffer edge cases', async () => {
    const { sliceBuffer, toBuffer } = await import('../../src/utils/buffer.js');

    const buffer = toBuffer('Hello World');

    // Slice entire buffer
    const full = sliceBuffer(buffer, 0);
    expect(full.length).toBe(buffer.length);

    // Slice with start beyond length
    const beyondStart = sliceBuffer(buffer, 100);
    expect(beyondStart.length).toBe(0);

    // Slice with end before start
    const endBeforeStart = sliceBuffer(buffer, 5, 3);
    expect(endBeforeStart.length).toBe(0);
  });

  test('copyBuffer creates true independent copy', async () => {
    const { copyBuffer, allocBuffer } = await import('../../src/utils/buffer.js');

    const original = allocBuffer(10);
    for (let i = 0; i < 10; i++) {
      original[i] = i;
    }

    const copy = copyBuffer(original);

    // Verify independence
    original[0] = 255;
    expect(copy[0]).toBe(0);

    copy[1] = 255;
    expect(original[1]).toBe(1);
  });

  test('buffersEqual with various lengths', async () => {
    const { buffersEqual, allocBuffer } = await import('../../src/utils/buffer.js');

    // Same reference
    const buf = allocBuffer(10);
    expect(buffersEqual(buf, buf)).toBe(true);

    // Different lengths
    expect(buffersEqual(allocBuffer(5), allocBuffer(10))).toBe(false);

    // Same length, same content
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    expect(buffersEqual(a, b)).toBe(true);

    // Same length, different content (difference at end)
    const c = new Uint8Array([1, 2, 4]);
    expect(buffersEqual(a, c)).toBe(false);
  });
});
