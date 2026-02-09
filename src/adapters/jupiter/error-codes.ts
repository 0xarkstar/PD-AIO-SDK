/**
 * Jupiter Perps Error Code Mappings
 *
 * Maps Jupiter-specific error messages to standardized error types
 */

import {
  ExchangeUnavailableError,
  InsufficientMarginError,
  InsufficientBalanceError,
  InvalidOrderError,
  InvalidSignatureError,
  PerpDEXError,
  PositionNotFoundError,
  RateLimitError,
  TransactionFailedError,
} from '../../types/errors.js';
import { JUPITER_ERROR_MESSAGES } from './constants.js';

/**
 * Map Jupiter/Solana errors to unified PerpDEX error types
 *
 * @param error - Error from Jupiter/Solana
 * @returns Unified PerpDEXError
 */
export function mapJupiterError(error: unknown): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check known error patterns
    for (const [pattern, code] of Object.entries(JUPITER_ERROR_MESSAGES)) {
      if (message.includes(pattern)) {
        switch (code) {
          case 'INSUFFICIENT_MARGIN':
            return new InsufficientMarginError(error.message, code, 'jupiter', error);
          case 'INSUFFICIENT_BALANCE':
            return new InsufficientBalanceError(
              error.message,
              code,
              'jupiter',
              undefined,
              undefined,
              error
            );
          case 'POSITION_NOT_FOUND':
            return new PositionNotFoundError(error.message, code, 'jupiter', error);
          case 'INVALID_LEVERAGE':
          case 'MAX_LEVERAGE_EXCEEDED':
          case 'MIN_POSITION_SIZE':
            return new InvalidOrderError(error.message, code, 'jupiter', error);
          case 'ORACLE_ERROR':
            return new ExchangeUnavailableError(error.message, code, 'jupiter', error);
          case 'POOL_CAPACITY_EXCEEDED':
            return new InvalidOrderError(error.message, code, 'jupiter', error);
          case 'RATE_LIMIT_EXCEEDED':
            return new RateLimitError(error.message, code, 'jupiter', undefined, error);
          case 'TRANSACTION_FAILED':
            return new TransactionFailedError(error.message, code, 'jupiter', undefined, error);
        }
      }
    }

    // Solana-specific errors
    if (message.includes('blockhash') || message.includes('expired')) {
      return new TransactionFailedError(
        'Transaction expired',
        'TRANSACTION_EXPIRED',
        'jupiter',
        undefined,
        error
      );
    }

    if (message.includes('signature verification')) {
      return new InvalidSignatureError(
        'Invalid transaction signature',
        'INVALID_SIGNATURE',
        'jupiter',
        error
      );
    }

    if (message.includes('insufficient lamports') || message.includes('insufficient sol')) {
      return new InsufficientBalanceError(
        'Insufficient SOL for transaction fees',
        'INSUFFICIENT_SOL',
        'jupiter',
        undefined,
        undefined,
        error
      );
    }

    if (message.includes('account not found') || message.includes('account does not exist')) {
      return new PerpDEXError('Account not found on chain', 'ACCOUNT_NOT_FOUND', 'jupiter', error);
    }

    // RPC errors
    if (message.includes('429') || message.includes('too many requests')) {
      return new RateLimitError(
        'RPC rate limit exceeded',
        'RATE_LIMIT',
        'jupiter',
        undefined,
        error
      );
    }

    if (message.includes('503') || message.includes('502') || message.includes('504')) {
      return new ExchangeUnavailableError(
        'Solana RPC temporarily unavailable',
        'RPC_UNAVAILABLE',
        'jupiter',
        error
      );
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new ExchangeUnavailableError('Request timeout', 'TIMEOUT', 'jupiter', error);
    }
  }

  // Default to generic exchange error
  return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'jupiter', error);
}

/**
 * Standard Jupiter error codes for reference
 */
export const JupiterErrorCodes = {
  // Trading errors
  INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_SOL: 'INSUFFICIENT_SOL',
  INVALID_LEVERAGE: 'INVALID_LEVERAGE',
  MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
  MIN_POSITION_SIZE: 'MIN_POSITION_SIZE',
  POOL_CAPACITY_EXCEEDED: 'POOL_CAPACITY_EXCEEDED',

  // Position errors
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  POSITION_LIQUIDATED: 'POSITION_LIQUIDATED',

  // Oracle errors
  ORACLE_ERROR: 'ORACLE_ERROR',
  ORACLE_STALE: 'ORACLE_STALE',

  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_EXPIRED: 'TRANSACTION_EXPIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',

  // Account errors
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  INVALID_ACCOUNT: 'INVALID_ACCOUNT',

  // Network errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RPC_UNAVAILABLE: 'RPC_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type JupiterErrorCode = (typeof JupiterErrorCodes)[keyof typeof JupiterErrorCodes];
