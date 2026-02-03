/**
 * Buffer Utilities Unit Tests
 *
 * Tests for cross-platform buffer operations
 */

import {
  toBuffer,
  fromBuffer,
  allocBuffer,
  allocUnsafe,
  readBigUInt64LE,
  readBigUInt64BE,
  writeBigUInt64LE,
  writeBigUInt64BE,
  readUInt32LE,
  readUInt32BE,
  writeUInt32LE,
  writeUInt32BE,
  concatBuffers,
  buffersEqual,
  copyBuffer,
  sliceBuffer,
} from '../../src/utils/buffer.js';

describe('buffer utilities', () => {
  describe('toBuffer', () => {
    test('converts string to buffer', () => {
      const result = toBuffer('hello');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
    });

    test('converts empty string to empty buffer', () => {
      const result = toBuffer('');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    test('converts Unicode string to buffer', () => {
      const result = toBuffer('你好');

      expect(result).toBeInstanceOf(Uint8Array);
      // UTF-8 encoding: 你 = 3 bytes, 好 = 3 bytes
      expect(result.length).toBe(6);
    });

    test('converts hex string to buffer', () => {
      const result = toBuffer('48656c6c6f', 'hex');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
    });

    test('handles hex with 0x prefix', () => {
      const result = toBuffer('0x48656c6c6f', 'hex');

      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    test('throws for odd-length hex string', () => {
      expect(() => toBuffer('abc', 'hex')).toThrow('Invalid hex string: odd length');
    });

    test('throws for invalid hex characters', () => {
      expect(() => toBuffer('ghij', 'hex')).toThrow(/Invalid hex character/);
    });

    test('converts base64 string to buffer', () => {
      const result = toBuffer('SGVsbG8=', 'base64');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
    });

    test('passes through Uint8Array unchanged', () => {
      const original = new Uint8Array([1, 2, 3]);
      const result = toBuffer(original);

      expect(result).toBe(original);
    });

    test('converts utf8 string explicitly', () => {
      const result = toBuffer('hello', 'utf8');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
    });
  });

  describe('fromBuffer', () => {
    test('converts buffer to UTF-8 string', () => {
      const buffer = new Uint8Array([104, 101, 108, 108, 111]);
      const result = fromBuffer(buffer, 'utf8');

      expect(result).toBe('hello');
    });

    test('converts buffer to hex string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]);
      const result = fromBuffer(buffer, 'hex');

      expect(result).toBe('48656c6c6f');
    });

    test('converts buffer to base64 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]);
      const result = fromBuffer(buffer, 'base64');

      expect(result).toBe('SGVsbG8=');
    });

    test('handles empty buffer', () => {
      const buffer = new Uint8Array(0);

      expect(fromBuffer(buffer, 'utf8')).toBe('');
      expect(fromBuffer(buffer, 'hex')).toBe('');
      expect(fromBuffer(buffer, 'base64')).toBe('');
    });

    test('round trip: toBuffer -> fromBuffer (utf8)', () => {
      const original = 'Hello, World!';
      const buffer = toBuffer(original);
      const result = fromBuffer(buffer, 'utf8');

      expect(result).toBe(original);
    });

    test('round trip: toBuffer -> fromBuffer (hex)', () => {
      const original = 'deadbeef';
      const buffer = toBuffer(original, 'hex');
      const result = fromBuffer(buffer, 'hex');

      expect(result).toBe(original);
    });

    test('round trip: toBuffer -> fromBuffer (base64)', () => {
      const original = 'SGVsbG8gV29ybGQh';
      const buffer = toBuffer(original, 'base64');
      const result = fromBuffer(buffer, 'base64');

      expect(result).toBe(original);
    });
  });

  describe('allocBuffer', () => {
    test('allocates buffer of specified size', () => {
      const result = allocBuffer(10);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(10);
    });

    test('initializes buffer with zeros', () => {
      const result = allocBuffer(5);

      expect(Array.from(result)).toEqual([0, 0, 0, 0, 0]);
    });

    test('allocates zero-length buffer', () => {
      const result = allocBuffer(0);

      expect(result.length).toBe(0);
    });

    test('allocates large buffer', () => {
      const result = allocBuffer(1000);

      expect(result.length).toBe(1000);
      expect(result.every(byte => byte === 0)).toBe(true);
    });
  });

  describe('allocUnsafe', () => {
    test('allocates buffer of specified size', () => {
      const result = allocUnsafe(10);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(10);
    });

    test('allocates zero-length buffer', () => {
      const result = allocUnsafe(0);

      expect(result.length).toBe(0);
    });

    test('allocates large buffer', () => {
      const result = allocUnsafe(10000);

      expect(result.length).toBe(10000);
    });
  });

  describe('BigUInt64 operations', () => {
    describe('readBigUInt64LE', () => {
      test('reads little-endian 64-bit unsigned integer', () => {
        // Value 0x0102030405060708 in LE: 08 07 06 05 04 03 02 01
        const buffer = new Uint8Array([0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01]);
        const result = readBigUInt64LE(buffer, 0);

        expect(result).toBe(BigInt('0x0102030405060708'));
      });

      test('reads without offset parameter (uses default 0)', () => {
        const buffer = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const result = readBigUInt64LE(buffer);

        expect(result).toBe(BigInt(1));
      });

      test('reads with offset', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const result = readBigUInt64LE(buffer, 2);

        expect(result).toBe(BigInt(1));
      });

      test('reads max value', () => {
        const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
        const result = readBigUInt64LE(buffer, 0);

        expect(result).toBe(BigInt('0xffffffffffffffff'));
      });

      test('reads zero', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const result = readBigUInt64LE(buffer, 0);

        expect(result).toBe(BigInt(0));
      });
    });

    describe('readBigUInt64BE', () => {
      test('reads big-endian 64-bit unsigned integer', () => {
        // Value 0x0102030405060708 in BE: 01 02 03 04 05 06 07 08
        const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
        const result = readBigUInt64BE(buffer, 0);

        expect(result).toBe(BigInt('0x0102030405060708'));
      });

      test('reads without offset parameter (uses default 0)', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
        const result = readBigUInt64BE(buffer);

        expect(result).toBe(BigInt(1));
      });

      test('reads with offset', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]);
        const result = readBigUInt64BE(buffer, 2);

        expect(result).toBe(BigInt('0x0000000000000100'));
      });
    });

    describe('writeBigUInt64LE', () => {
      test('writes little-endian 64-bit unsigned integer', () => {
        const buffer = allocBuffer(8);
        writeBigUInt64LE(buffer, BigInt('0x0102030405060708'), 0);

        expect(Array.from(buffer)).toEqual([0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01]);
      });

      test('writes without offset parameter (uses default 0)', () => {
        const buffer = allocBuffer(8);
        writeBigUInt64LE(buffer, BigInt(1));

        expect(buffer[0]).toBe(0x01);
        expect(buffer[7]).toBe(0x00);
      });

      test('writes with offset', () => {
        const buffer = allocBuffer(10);
        writeBigUInt64LE(buffer, BigInt(1), 2);

        expect(buffer[2]).toBe(0x01);
        expect(buffer[3]).toBe(0x00);
      });

      test('writes zero', () => {
        const buffer = allocBuffer(8);
        writeBigUInt64LE(buffer, BigInt(0), 0);

        expect(Array.from(buffer)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
      });
    });

    describe('writeBigUInt64BE', () => {
      test('writes big-endian 64-bit unsigned integer', () => {
        const buffer = allocBuffer(8);
        writeBigUInt64BE(buffer, BigInt('0x0102030405060708'), 0);

        expect(Array.from(buffer)).toEqual([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
      });

      test('writes without offset parameter (uses default 0)', () => {
        const buffer = allocBuffer(8);
        writeBigUInt64BE(buffer, BigInt(1));

        expect(buffer[0]).toBe(0x00);
        expect(buffer[7]).toBe(0x01);
      });

      test('writes with offset', () => {
        const buffer = allocBuffer(10);
        writeBigUInt64BE(buffer, BigInt(1), 2);

        expect(buffer[2]).toBe(0x00);
        expect(buffer[9]).toBe(0x01);
      });
    });

    describe('BigUInt64 round trips', () => {
      test('LE write then read returns same value', () => {
        const original = BigInt('12345678901234567890');
        const buffer = allocBuffer(8);
        writeBigUInt64LE(buffer, original, 0);
        const result = readBigUInt64LE(buffer, 0);

        expect(result).toBe(original);
      });

      test('BE write then read returns same value', () => {
        const original = BigInt('12345678901234567890');
        const buffer = allocBuffer(8);
        writeBigUInt64BE(buffer, original, 0);
        const result = readBigUInt64BE(buffer, 0);

        expect(result).toBe(original);
      });
    });
  });

  describe('UInt32 operations', () => {
    describe('readUInt32LE', () => {
      test('reads little-endian 32-bit unsigned integer', () => {
        const buffer = new Uint8Array([0x04, 0x03, 0x02, 0x01]);
        const result = readUInt32LE(buffer, 0);

        expect(result).toBe(0x01020304);
      });

      test('reads without offset parameter (uses default 0)', () => {
        const buffer = new Uint8Array([0x01, 0x00, 0x00, 0x00]);
        const result = readUInt32LE(buffer);

        expect(result).toBe(1);
      });

      test('reads with offset', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);
        const result = readUInt32LE(buffer, 2);

        expect(result).toBe(1);
      });

      test('reads max value', () => {
        const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
        const result = readUInt32LE(buffer, 0);

        expect(result).toBe(0xffffffff);
      });
    });

    describe('readUInt32BE', () => {
      test('reads big-endian 32-bit unsigned integer', () => {
        const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        const result = readUInt32BE(buffer, 0);

        expect(result).toBe(0x01020304);
      });

      test('reads without offset parameter (uses default 0)', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
        const result = readUInt32BE(buffer);

        expect(result).toBe(1);
      });

      test('reads with offset', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
        const result = readUInt32BE(buffer, 2);

        expect(result).toBe(1);
      });
    });

    describe('writeUInt32LE', () => {
      test('writes little-endian 32-bit unsigned integer', () => {
        const buffer = allocBuffer(4);
        writeUInt32LE(buffer, 0x01020304, 0);

        expect(Array.from(buffer)).toEqual([0x04, 0x03, 0x02, 0x01]);
      });

      test('writes without offset parameter (uses default 0)', () => {
        const buffer = allocBuffer(4);
        writeUInt32LE(buffer, 1);

        expect(buffer[0]).toBe(0x01);
        expect(buffer[3]).toBe(0x00);
      });

      test('writes with offset', () => {
        const buffer = allocBuffer(6);
        writeUInt32LE(buffer, 1, 2);

        expect(buffer[2]).toBe(0x01);
        expect(buffer[3]).toBe(0x00);
      });
    });

    describe('writeUInt32BE', () => {
      test('writes big-endian 32-bit unsigned integer', () => {
        const buffer = allocBuffer(4);
        writeUInt32BE(buffer, 0x01020304, 0);

        expect(Array.from(buffer)).toEqual([0x01, 0x02, 0x03, 0x04]);
      });

      test('writes without offset parameter (uses default 0)', () => {
        const buffer = allocBuffer(4);
        writeUInt32BE(buffer, 1);

        expect(buffer[0]).toBe(0x00);
        expect(buffer[3]).toBe(0x01);
      });

      test('writes with offset', () => {
        const buffer = allocBuffer(6);
        writeUInt32BE(buffer, 1, 2);

        expect(buffer[5]).toBe(0x01);
        expect(buffer[4]).toBe(0x00);
      });
    });

    describe('UInt32 round trips', () => {
      test('LE write then read returns same value', () => {
        const original = 0xdeadbeef;
        const buffer = allocBuffer(4);
        writeUInt32LE(buffer, original, 0);
        const result = readUInt32LE(buffer, 0);

        expect(result).toBe(original);
      });

      test('BE write then read returns same value', () => {
        const original = 0xdeadbeef;
        const buffer = allocBuffer(4);
        writeUInt32BE(buffer, original, 0);
        const result = readUInt32BE(buffer, 0);

        expect(result).toBe(original);
      });
    });
  });

  describe('concatBuffers', () => {
    test('concatenates multiple buffers using rest parameters', () => {
      const buf1 = new Uint8Array([1, 2, 3]);
      const buf2 = new Uint8Array([4, 5, 6]);
      const buf3 = new Uint8Array([7, 8, 9]);
      const result = concatBuffers(buf1, buf2, buf3);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('handles no arguments', () => {
      const result = concatBuffers();

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    test('handles single buffer', () => {
      const buf = new Uint8Array([1, 2, 3]);
      const result = concatBuffers(buf);

      expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    test('handles empty buffers', () => {
      const buf1 = new Uint8Array([1, 2]);
      const buf2 = new Uint8Array(0);
      const buf3 = new Uint8Array([3, 4]);
      const result = concatBuffers(buf1, buf2, buf3);

      expect(Array.from(result)).toEqual([1, 2, 3, 4]);
    });

    test('handles two buffers', () => {
      const buf1 = new Uint8Array([0x01, 0x02]);
      const buf2 = new Uint8Array([0x03, 0x04]);
      const result = concatBuffers(buf1, buf2);

      expect(Array.from(result)).toEqual([0x01, 0x02, 0x03, 0x04]);
    });
  });

  describe('buffersEqual', () => {
    test('returns true for equal buffers', () => {
      const buf1 = new Uint8Array([1, 2, 3]);
      const buf2 = new Uint8Array([1, 2, 3]);

      expect(buffersEqual(buf1, buf2)).toBe(true);
    });

    test('returns false for different content', () => {
      const buf1 = new Uint8Array([1, 2, 3]);
      const buf2 = new Uint8Array([1, 2, 4]);

      expect(buffersEqual(buf1, buf2)).toBe(false);
    });

    test('returns false for different lengths', () => {
      const buf1 = new Uint8Array([1, 2, 3]);
      const buf2 = new Uint8Array([1, 2]);

      expect(buffersEqual(buf1, buf2)).toBe(false);
    });

    test('returns true for empty buffers', () => {
      const buf1 = new Uint8Array(0);
      const buf2 = new Uint8Array(0);

      expect(buffersEqual(buf1, buf2)).toBe(true);
    });

    test('returns true for same reference', () => {
      const buf = new Uint8Array([1, 2, 3]);

      expect(buffersEqual(buf, buf)).toBe(true);
    });
  });

  describe('copyBuffer', () => {
    test('copies buffer content', () => {
      const source = new Uint8Array([1, 2, 3, 4, 5]);
      const result = copyBuffer(source);

      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
    });

    test('creates independent copy', () => {
      const source = new Uint8Array([1, 2, 3]);
      const copy = copyBuffer(source);

      source[0] = 99;

      expect(copy[0]).toBe(1);
    });

    test('copies empty buffer', () => {
      const source = new Uint8Array(0);
      const result = copyBuffer(source);

      expect(result.length).toBe(0);
    });
  });

  describe('sliceBuffer', () => {
    test('slices buffer from start to end', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const result = sliceBuffer(buffer, 1, 4);

      expect(Array.from(result)).toEqual([2, 3, 4]);
    });

    test('slices with default start (0)', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const result = sliceBuffer(buffer);

      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
    });

    test('slices from start with no end', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const result = sliceBuffer(buffer, 2);

      expect(Array.from(result)).toEqual([3, 4, 5]);
    });

    test('slices with negative start', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const result = sliceBuffer(buffer, -2);

      expect(Array.from(result)).toEqual([4, 5]);
    });

    test('slices with negative end', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const result = sliceBuffer(buffer, 1, -1);

      expect(Array.from(result)).toEqual([2, 3, 4]);
    });

    test('creates independent copy', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const slice = sliceBuffer(buffer, 1, 3);

      buffer[1] = 99;

      expect(slice[0]).toBe(2);
    });

    test('handles empty slice', () => {
      const buffer = new Uint8Array([1, 2, 3]);
      const result = sliceBuffer(buffer, 1, 1);

      expect(result.length).toBe(0);
    });
  });

  describe('integration tests', () => {
    test('complex buffer operations', () => {
      // Create a packet-like structure
      const header = allocBuffer(4);
      writeUInt32BE(header, 12, 0); // Total length

      const payload = toBuffer('hello');
      const timestamp = allocBuffer(8);
      writeBigUInt64BE(timestamp, BigInt(Date.now()), 0);

      const packet = concatBuffers(header, payload, timestamp);

      expect(packet.length).toBe(17);
      expect(readUInt32BE(packet, 0)).toBe(12);
      expect(fromBuffer(sliceBuffer(packet, 4, 9), 'utf8')).toBe('hello');
    });

    test('buffer copy and equality', () => {
      const original = toBuffer('test data');
      const copy = copyBuffer(original);

      expect(buffersEqual(original, copy)).toBe(true);

      copy[0] = 99;

      expect(buffersEqual(original, copy)).toBe(false);
    });

    test('hex encode and decode', () => {
      const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const hex = fromBuffer(original, 'hex');
      const restored = toBuffer(hex, 'hex');

      expect(buffersEqual(original, restored)).toBe(true);
    });

    test('base64 encode and decode', () => {
      const original = toBuffer('Hello, World!');
      const base64 = fromBuffer(original, 'base64');
      const restored = toBuffer(base64, 'base64');

      expect(buffersEqual(original, restored)).toBe(true);
    });
  });
});
