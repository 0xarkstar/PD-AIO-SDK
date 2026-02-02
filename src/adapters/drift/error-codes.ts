/**
 * Drift Protocol Error Code Mappings
 *
 * Maps Drift-specific error messages to standardized error types
 */

import {
  ExchangeUnavailableError,
  InsufficientMarginError,
  InsufficientBalanceError,
  InvalidOrderError,
  InvalidSignatureError,
  OrderNotFoundError,
  PerpDEXError,
  PositionNotFoundError,
  RateLimitError,
  TransactionFailedError,
  LiquidationError,
} from '../../types/errors.js';
import { DRIFT_ERROR_MESSAGES } from './constants.js';

/**
 * Map Drift/Solana errors to unified PerpDEX error types
 *
 * @param error - Error from Drift/Solana
 * @returns Unified PerpDEXError
 */
export function mapDriftError(error: unknown): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check known error patterns
    for (const [pattern, code] of Object.entries(DRIFT_ERROR_MESSAGES)) {
      if (message.includes(pattern)) {
        switch (code) {
          case 'INSUFFICIENT_MARGIN':
            return new InsufficientMarginError(error.message, code, 'drift', error);
          case 'INSUFFICIENT_BALANCE':
            return new InsufficientBalanceError(error.message, code, 'drift', undefined, undefined, error);
          case 'POSITION_NOT_FOUND':
            return new PositionNotFoundError(error.message, code, 'drift', error);
          case 'ORDER_NOT_FOUND':
            return new OrderNotFoundError(error.message, code, 'drift', error);
          case 'MAX_LEVERAGE_EXCEEDED':
          case 'MIN_ORDER_SIZE':
          case 'REDUCE_ONLY_VIOLATION':
          case 'POST_ONLY_VIOLATION':
            return new InvalidOrderError(error.message, code, 'drift', error);
          case 'ORACLE_ERROR':
          case 'MARKET_PAUSED':
            return new ExchangeUnavailableError(error.message, code, 'drift', error);
          case 'RATE_LIMIT_EXCEEDED':
            return new RateLimitError(error.message, code, 'drift', undefined, error);
          case 'TRANSACTION_FAILED':
            return new TransactionFailedError(error.message, code, 'drift', undefined, error);
          case 'LIQUIDATION':
            return new LiquidationError(error.message, code, 'drift', error);
        }
      }
    }

    // Solana-specific errors
    if (message.includes('blockhash') || message.includes('expired')) {
      return new TransactionFailedError(
        'Transaction expired',
        'TRANSACTION_EXPIRED',
        'drift',
        undefined,
        error
      );
    }

    if (message.includes('signature verification')) {
      return new InvalidSignatureError(
        'Invalid transaction signature',
        'INVALID_SIGNATURE',
        'drift',
        error
      );
    }

    if (message.includes('insufficient lamports') || message.includes('insufficient sol')) {
      return new InsufficientBalanceError(
        'Insufficient SOL for transaction fees',
        'INSUFFICIENT_SOL',
        'drift',
        undefined,
        undefined,
        error
      );
    }

    // Check "user account not found" before general "account not found"
    if (message.includes('user account not found')) {
      return new PerpDEXError(
        'Drift user account not initialized',
        'USER_NOT_INITIALIZED',
        'drift',
        error
      );
    }

    if (message.includes('account not found') || message.includes('account does not exist')) {
      return new PerpDEXError(
        'Account not found on chain',
        'ACCOUNT_NOT_FOUND',
        'drift',
        error
      );
    }

    // RPC errors
    if (message.includes('429') || message.includes('too many requests')) {
      return new RateLimitError('RPC rate limit exceeded', 'RATE_LIMIT', 'drift', undefined, error);
    }

    if (message.includes('503') || message.includes('502') || message.includes('504')) {
      return new ExchangeUnavailableError(
        'Solana RPC temporarily unavailable',
        'RPC_UNAVAILABLE',
        'drift',
        error
      );
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new ExchangeUnavailableError(
        'Request timeout',
        'TIMEOUT',
        'drift',
        error
      );
    }

    // Drift-specific errors
    if (message.includes('max number of positions')) {
      return new InvalidOrderError(
        'Maximum number of positions reached',
        'MAX_POSITIONS',
        'drift',
        error
      );
    }

    if (message.includes('market not active')) {
      return new ExchangeUnavailableError(
        'Market is not active',
        'MARKET_NOT_ACTIVE',
        'drift',
        error
      );
    }

    if (message.includes('price bands')) {
      return new InvalidOrderError(
        'Order price outside allowed bands',
        'PRICE_BANDS_BREACHED',
        'drift',
        error
      );
    }

    if (message.includes('order would be filled at worse price')) {
      return new InvalidOrderError(
        'Order would be filled at worse price than limit',
        'SLIPPAGE_EXCEEDED',
        'drift',
        error
      );
    }
  }

  // Default to generic exchange error
  return new ExchangeUnavailableError(
    'Unknown exchange error',
    'UNKNOWN_ERROR',
    'drift',
    error
  );
}

/**
 * Standard Drift error codes for reference
 */
export const DriftErrorCodes = {
  // Trading errors
  INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_SOL: 'INSUFFICIENT_SOL',
  MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
  MIN_ORDER_SIZE: 'MIN_ORDER_SIZE',
  MAX_POSITIONS: 'MAX_POSITIONS',
  REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
  POST_ONLY_VIOLATION: 'POST_ONLY_VIOLATION',
  SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
  PRICE_BANDS_BREACHED: 'PRICE_BANDS_BREACHED',

  // Position errors
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  POSITION_LIQUIDATED: 'POSITION_LIQUIDATED',

  // Order errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_EXPIRED: 'ORDER_EXPIRED',

  // Oracle errors
  ORACLE_ERROR: 'ORACLE_ERROR',
  ORACLE_STALE: 'ORACLE_STALE',

  // Market errors
  MARKET_PAUSED: 'MARKET_PAUSED',
  MARKET_NOT_ACTIVE: 'MARKET_NOT_ACTIVE',

  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_EXPIRED: 'TRANSACTION_EXPIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',

  // Account errors
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  USER_NOT_INITIALIZED: 'USER_NOT_INITIALIZED',

  // Network errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RPC_UNAVAILABLE: 'RPC_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',

  // Liquidation
  LIQUIDATION: 'LIQUIDATION',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type DriftErrorCode = typeof DriftErrorCodes[keyof typeof DriftErrorCodes];
