/**
 * API Contract Validator
 *
 * Validates API endpoints against their specifications.
 * Detects breaking changes and schema violations.
 */

import { z } from 'zod';
import type {
  APIEndpoint,
  APISpecification,
  ValidationResult,
  ContractValidationReport,
  BreakingChange,
  ValidationOptions,
} from './types.js';

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  timeout: 10000,
  skipAuthEndpoints: false,
  includeResponseData: false,
  failOnWarnings: false,
  maxConcurrency: 3,
  retry: false,
  maxRetries: 2,
};

/**
 * API Contract Validator
 *
 * Validates API endpoints against their specifications and detects breaking changes.
 */
export class ContractValidator {
  private readonly baseUrl: string;
  private readonly options: Required<ValidationOptions>;
  private readonly authHeaders?: Record<string, string>;

  constructor(
    baseUrl: string,
    options: ValidationOptions = {},
    authHeaders?: Record<string, string>
  ) {
    this.baseUrl = baseUrl;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.authHeaders = authHeaders;
  }

  /**
   * Validate a single API endpoint
   *
   * @param endpoint - API endpoint specification
   * @returns Validation result
   */
  async validateEndpoint(endpoint: APIEndpoint): Promise<ValidationResult> {
    const result: ValidationResult = {
      endpointId: endpoint.id,
      success: false,
      timestamp: Date.now(),
      errors: [],
      warnings: [],
      schemaErrors: [],
    };

    // Skip auth endpoints if configured
    if (endpoint.requiresAuth && this.options.skipAuthEndpoints) {
      result.errors?.push('Skipped: Authentication required');
      return result;
    }

    const startTime = Date.now();

    try {
      // Build request URL
      const url = `${this.baseUrl}${endpoint.path}`;

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (endpoint.requiresAuth && this.authHeaders) {
        Object.assign(headers, this.authHeaders);
      }

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Record response time
      result.responseTime = Date.now() - startTime;
      result.statusCode = response.status;

      // Check status code
      if (!response.ok) {
        result.errors?.push(`HTTP ${response.status}: ${response.statusText}`);
        result.success = false;
        return result;
      }

      // Parse response
      const responseData = await response.json();

      // Store raw response if configured
      if (this.options.includeResponseData) {
        result.rawResponse = responseData;
      }

      // Validate response schema
      const schemaValidation = this.validateSchema(endpoint.responseSchema, responseData);

      if (!schemaValidation.success) {
        result.schemaErrors = schemaValidation.errors;
        result.success = false;
        return result;
      }

      // Check response time performance
      if (endpoint.expectedResponseTime && result.responseTime) {
        if (result.responseTime > endpoint.expectedResponseTime * 1.5) {
          result.warnings?.push(
            `Slow response: ${result.responseTime}ms (expected ${endpoint.expectedResponseTime}ms)`
          );
        }
      }

      // Success
      result.success = true;

      return result;
    } catch (error) {
      result.responseTime = Date.now() - startTime;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          result.errors?.push(`Timeout after ${this.options.timeout}ms`);
        } else {
          result.errors?.push(`Request failed: ${error.message}`);
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle DOMException and other non-Error objects
        const errorObj = error as any;
        if (errorObj.name === 'AbortError') {
          result.errors?.push(`Timeout after ${this.options.timeout}ms`);
        } else if (errorObj.message) {
          result.errors?.push(`Request failed: ${errorObj.message}`);
        } else {
          result.errors?.push(`Unknown error: ${JSON.stringify(error)}`);
        }
      } else {
        result.errors?.push(`Unknown error: ${String(error)}`);
      }

      result.success = false;
      return result;
    }
  }

  /**
   * Validate response data against schema
   *
   * @param schema - Zod schema
   * @param data - Response data
   * @returns Validation result
   */
  private validateSchema(
    schema: z.ZodSchema,
    data: any
  ): { success: boolean; errors: string[] } {
    try {
      schema.parse(data);
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        return { success: false, errors };
      }

      return {
        success: false,
        errors: ['Schema validation failed: Unknown error'],
      };
    }
  }

  /**
   * Validate all endpoints in a specification
   *
   * @param spec - API specification
   * @returns Validation report
   */
  async validateSpecification(spec: APISpecification): Promise<ContractValidationReport> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    // Validate endpoints with concurrency control
    const chunks = this.chunkArray(spec.endpoints, this.options.maxConcurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((endpoint) => this.validateEndpoint(endpoint))
      );
      results.push(...chunkResults);
    }

    // Calculate statistics
    const passed = results.filter((r) => r.success).length;
    const skipped = results.filter(
      (r) => !r.success && r.errors?.some((e) => e.startsWith('Skipped'))
    ).length;
    const failed = results.filter(
      (r) => !r.success && !r.errors?.some((e) => e.startsWith('Skipped'))
    ).length;

    const successfulResults = results.filter((r) => r.success && r.responseTime);
    const averageResponseTime =
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) /
          successfulResults.length
        : 0;

    // Detect breaking changes
    const breakingChanges = this.detectBreakingChanges(results);

    const report: ContractValidationReport = {
      exchange: spec.exchange,
      totalEndpoints: spec.endpoints.length,
      passed,
      failed,
      skipped,
      results,
      breakingChanges,
      successRate: passed / spec.endpoints.length,
      averageResponseTime,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    };

    return report;
  }

  /**
   * Detect breaking changes from validation results
   *
   * @param results - Validation results
   * @returns Breaking changes
   */
  private detectBreakingChanges(results: ValidationResult[]): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const result of results) {
      // Schema validation failures are breaking changes
      if (result.schemaErrors && result.schemaErrors.length > 0) {
        changes.push({
          endpointId: result.endpointId,
          type: 'schema_change',
          description: `Schema validation failed: ${result.schemaErrors.join(', ')}`,
          severity: 'critical',
          expected: 'Valid schema',
          actual: result.schemaErrors,
          timestamp: result.timestamp,
        });
      }

      // Non-200 status codes (excluding auth issues)
      if (
        result.statusCode &&
        result.statusCode !== 200 &&
        result.statusCode !== 401 &&
        result.statusCode !== 403
      ) {
        changes.push({
          endpointId: result.endpointId,
          type: 'status_code_change',
          description: `Unexpected status code: ${result.statusCode}`,
          severity: result.statusCode >= 500 ? 'critical' : 'major',
          expected: 200,
          actual: result.statusCode,
          timestamp: result.timestamp,
        });
      }
    }

    return changes;
  }

  /**
   * Split array into chunks for concurrent processing
   *
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Chunked array
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate markdown report from validation results
   *
   * @param report - Validation report
   * @returns Markdown formatted report
   */
  static generateMarkdownReport(report: ContractValidationReport): string {
    const lines: string[] = [];

    lines.push(`# API Contract Validation Report`);
    lines.push(`**Exchange**: ${report.exchange}`);
    lines.push(`**Date**: ${new Date(report.timestamp).toISOString()}`);
    lines.push(`**Duration**: ${report.duration}ms`);
    lines.push('');

    lines.push(`## Summary`);
    lines.push(`- **Total Endpoints**: ${report.totalEndpoints}`);
    lines.push(`- **Passed**: ${report.passed} ✅`);
    lines.push(`- **Failed**: ${report.failed} ❌`);
    lines.push(`- **Skipped**: ${report.skipped} ⏭️`);
    lines.push(
      `- **Success Rate**: ${(report.successRate * 100).toFixed(2)}%`
    );
    lines.push(
      `- **Average Response Time**: ${report.averageResponseTime.toFixed(2)}ms`
    );
    lines.push('');

    // Breaking changes
    if (report.breakingChanges.length > 0) {
      lines.push(`## ⚠️ Breaking Changes (${report.breakingChanges.length})`);
      lines.push('');

      for (const change of report.breakingChanges) {
        const icon =
          change.severity === 'critical'
            ? '🔴'
            : change.severity === 'major'
            ? '🟠'
            : '🟡';
        lines.push(
          `### ${icon} ${change.endpointId} - ${change.type}`
        );
        lines.push(`**Severity**: ${change.severity}`);
        lines.push(`**Description**: ${change.description}`);
        lines.push('');
      }
    }

    // Failed endpoints
    const failedResults = report.results.filter((r) => !r.success);
    if (failedResults.length > 0) {
      lines.push(`## Failed Endpoints (${failedResults.length})`);
      lines.push('');

      for (const result of failedResults) {
        lines.push(`### ${result.endpointId}`);
        if (result.statusCode) {
          lines.push(`- **Status Code**: ${result.statusCode}`);
        }
        if (result.responseTime) {
          lines.push(`- **Response Time**: ${result.responseTime}ms`);
        }
        if (result.errors && result.errors.length > 0) {
          lines.push(`- **Errors**:`);
          result.errors.forEach((err) => lines.push(`  - ${err}`));
        }
        if (result.schemaErrors && result.schemaErrors.length > 0) {
          lines.push(`- **Schema Errors**:`);
          result.schemaErrors.forEach((err) => lines.push(`  - ${err}`));
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
