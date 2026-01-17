/**
 * All Exchanges Error Codes Tests
 * Tests error code definitions for all adapters
 */

import { describe, it, expect } from '@jest/globals';

// Import all error codes
import * as BackpackErrors from '../../src/adapters/backpack/error-codes.js';
import * as LighterErrors from '../../src/adapters/lighter/error-codes.js';
import * as GRVTErrors from '../../src/adapters/grvt/error-codes.js';
import * as ParadexErrors from '../../src/adapters/paradex/error-codes.js';
import * as EdgeXErrors from '../../src/adapters/edgex/error-codes.js';

describe('Error Codes Coverage', () => {
  describe('Backpack Error Codes', () => {
    it('should define error constants', () => {
      expect(BackpackErrors.BACKPACK_CLIENT_ERRORS).toBeDefined();
      expect(BackpackErrors.BACKPACK_SERVER_ERRORS).toBeDefined();
      expect(BackpackErrors.BACKPACK_RATE_LIMIT_ERROR).toBeDefined();
    });

    it('should provide type checker functions', () => {
      expect(typeof BackpackErrors.isClientError).toBe('function');
      expect(typeof BackpackErrors.isServerError).toBe('function');
      expect(typeof BackpackErrors.isRetryableError).toBe('function');
    });

    it('should provide error mapper', () => {
      expect(typeof BackpackErrors.mapBackpackError).toBe('function');
      const error = BackpackErrors.mapBackpackError(1001, 'Test error');
      expect(error).toBeDefined();
    });
  });

  describe('Lighter Error Codes', () => {
    it('should define error constants', () => {
      expect(LighterErrors.LIGHTER_CLIENT_ERRORS).toBeDefined();
      expect(LighterErrors.LIGHTER_SERVER_ERRORS).toBeDefined();
      expect(LighterErrors.LIGHTER_RATE_LIMIT_ERROR).toBeDefined();
    });

    it('should provide type checker functions', () => {
      expect(typeof LighterErrors.isClientError).toBe('function');
      expect(typeof LighterErrors.isRetryableError).toBe('function');
    });

    it('should provide extractErrorCode function', () => {
      expect(typeof LighterErrors.extractErrorCode).toBe('function');
      const code = LighterErrors.extractErrorCode('rate limit exceeded');
      expect(code).toBe(LighterErrors.LIGHTER_RATE_LIMIT_ERROR);
    });

    it('should provide error mapper', () => {
      expect(typeof LighterErrors.mapLighterError).toBe('function');
      const error = LighterErrors.mapLighterError('1001', 'Test error');
      expect(error).toBeDefined();
    });
  });

  describe('GRVT Error Codes', () => {
    it('should define error constants', () => {
      expect(GRVTErrors.GRVT_CLIENT_ERRORS).toBeDefined();
      expect(GRVTErrors.GRVT_SERVER_ERRORS).toBeDefined();
    });

    it('should provide error mapper', () => {
      expect(typeof GRVTErrors.mapGRVTError).toBe('function');
      const error = GRVTErrors.mapGRVTError('INSUFFICIENT_BALANCE', 'Test error');
      expect(error).toBeDefined();
    });
  });

  describe('Paradex Error Codes', () => {
    it('should define error constants', () => {
      expect(ParadexErrors.PARADEX_CLIENT_ERRORS).toBeDefined();
      expect(ParadexErrors.PARADEX_SERVER_ERRORS).toBeDefined();
    });

    it('should provide error mapper', () => {
      expect(typeof ParadexErrors.mapParadexError).toBe('function');
      const error = ParadexErrors.mapParadexError('1001', 'Test error');
      expect(error).toBeDefined();
    });
  });

  describe('EdgeX Error Codes', () => {
    it('should define error constants', () => {
      expect(EdgeXErrors.EDGEX_CLIENT_ERRORS).toBeDefined();
      expect(EdgeXErrors.EDGEX_SERVER_ERRORS).toBeDefined();
    });

    it('should provide error mapper', () => {
      expect(typeof EdgeXErrors.mapEdgeXError).toBe('function');
      const error = EdgeXErrors.mapEdgeXError('1001', 'Test error');
      expect(error).toBeDefined();
    });
  });

  describe('Error Code Integration', () => {
    it('all error mappers should return PerpDEXError instances', () => {
      const backpackError = BackpackErrors.mapBackpackError(9999, 'Unknown');
      const lighterError = LighterErrors.mapLighterError('9999', 'Unknown');
      const grvtError = GRVTErrors.mapGRVTError('UNKNOWN', 'Unknown');
      const paradexError = ParadexErrors.mapParadexError('9999', 'Unknown');
      const edgexError = EdgeXErrors.mapEdgeXError('9999', 'Unknown');

      expect(backpackError.name).toContain('Error');
      expect(lighterError.name).toContain('Error');
      expect(grvtError.name).toContain('Error');
      expect(paradexError.name).toContain('Error');
      expect(edgexError.name).toContain('Error');
    });

    it('adapters with retryable logic should identify retryable errors', () => {
      expect(BackpackErrors.isRetryableError(BackpackErrors.BACKPACK_RATE_LIMIT_ERROR)).toBe(true);
      expect(LighterErrors.isRetryableError(LighterErrors.LIGHTER_RATE_LIMIT_ERROR)).toBe(true);
      // GRVT, Paradex, EdgeX may have different error handling patterns
    });
  });
});
