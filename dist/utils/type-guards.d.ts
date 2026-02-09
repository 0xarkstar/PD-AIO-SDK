/**
 * Shared type guard helpers
 */
/**
 * Type-safe check whether a string is included in a readonly array of string literals.
 * Replaces `Object.values(ERRORS).includes(code as any)` pattern.
 */
export declare function includesValue<T extends string>(values: readonly T[], code: string): code is T;
/**
 * Type-safe check whether a number is included in a readonly array of number literals.
 * Replaces `Object.values(NUMERIC_ERRORS).includes(code as any)` pattern.
 */
export declare function includesNumericValue<T extends number>(values: readonly T[], code: number): code is T;
//# sourceMappingURL=type-guards.d.ts.map