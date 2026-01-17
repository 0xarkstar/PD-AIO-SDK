/**
 * API Contract Test Types
 *
 * Defines types for API endpoint specifications and validation results.
 */

import { z } from 'zod';

/**
 * HTTP methods supported by the contract validator
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * API Endpoint Specification
 * Defines the contract for a single API endpoint
 */
export interface APIEndpoint {
  /**
   * Unique identifier for this endpoint
   */
  id: string;

  /**
   * Endpoint path (e.g., '/markets', '/orders')
   */
  path: string;

  /**
   * HTTP method
   */
  method: HttpMethod;

  /**
   * Whether this endpoint requires authentication
   */
  requiresAuth: boolean;

  /**
   * Request parameters schema (optional)
   */
  requestSchema?: z.ZodSchema;

  /**
   * Response schema for validation
   */
  responseSchema: z.ZodSchema;

  /**
   * Rate limit weight for this endpoint
   */
  rateLimit?: number;

  /**
   * Expected response time in milliseconds (for performance testing)
   */
  expectedResponseTime?: number;

  /**
   * Optional description
   */
  description?: string;
}

/**
 * API Specification for an exchange
 * Collection of all endpoints for a specific exchange
 */
export interface APISpecification {
  /**
   * Exchange identifier
   */
  exchange: string;

  /**
   * Base URL for the API
   */
  baseUrl: string;

  /**
   * List of endpoints
   */
  endpoints: APIEndpoint[];

  /**
   * Version of the API specification
   */
  version: string;

  /**
   * Last updated timestamp
   */
  lastUpdated: string;
}

/**
 * Validation result for a single endpoint
 */
export interface ValidationResult {
  /**
   * Endpoint ID
   */
  endpointId: string;

  /**
   * Whether validation passed
   */
  success: boolean;

  /**
   * Response status code
   */
  statusCode?: number;

  /**
   * Response time in milliseconds
   */
  responseTime?: number;

  /**
   * Schema validation errors (if any)
   */
  schemaErrors?: string[];

  /**
   * General errors (network, timeout, etc.)
   */
  errors?: string[];

  /**
   * Warnings (non-breaking issues)
   */
  warnings?: string[];

  /**
   * Raw response data (for debugging)
   */
  rawResponse?: any;

  /**
   * Timestamp of validation
   */
  timestamp: number;
}

/**
 * Contract validation report
 * Aggregate results for all endpoints
 */
export interface ContractValidationReport {
  /**
   * Exchange identifier
   */
  exchange: string;

  /**
   * Total endpoints tested
   */
  totalEndpoints: number;

  /**
   * Number of passed validations
   */
  passed: number;

  /**
   * Number of failed validations
   */
  failed: number;

  /**
   * Number of skipped validations (auth required, etc.)
   */
  skipped: number;

  /**
   * Individual validation results
   */
  results: ValidationResult[];

  /**
   * Breaking changes detected
   */
  breakingChanges: BreakingChange[];

  /**
   * Overall success rate (0-1)
   */
  successRate: number;

  /**
   * Average response time in milliseconds
   */
  averageResponseTime: number;

  /**
   * Timestamp of validation
   */
  timestamp: number;

  /**
   * Duration of full validation in milliseconds
   */
  duration: number;
}

/**
 * Breaking change detected in API
 */
export interface BreakingChange {
  /**
   * Endpoint affected
   */
  endpointId: string;

  /**
   * Type of breaking change
   */
  type: 'schema_change' | 'status_code_change' | 'endpoint_removed' | 'required_field_added' | 'response_format_change';

  /**
   * Description of the change
   */
  description: string;

  /**
   * Severity of the change
   */
  severity: 'critical' | 'major' | 'minor';

  /**
   * Expected value/format
   */
  expected: any;

  /**
   * Actual value/format
   */
  actual: any;

  /**
   * Timestamp of detection
   */
  timestamp: number;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Timeout for each request in milliseconds
   * @default 10000
   */
  timeout?: number;

  /**
   * Skip authentication-required endpoints
   * @default false
   */
  skipAuthEndpoints?: boolean;

  /**
   * Include response data in results
   * @default false
   */
  includeResponseData?: boolean;

  /**
   * Fail on warnings
   * @default false
   */
  failOnWarnings?: boolean;

  /**
   * Maximum concurrent requests
   * @default 3
   */
  maxConcurrency?: number;

  /**
   * Retry failed requests
   * @default false
   */
  retry?: boolean;

  /**
   * Maximum retries
   * @default 2
   */
  maxRetries?: number;
}
