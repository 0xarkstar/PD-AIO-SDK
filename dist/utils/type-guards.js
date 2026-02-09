/**
 * Shared type guard helpers
 */
/**
 * Type-safe check whether a string is included in a readonly array of string literals.
 * Replaces `Object.values(ERRORS).includes(code as any)` pattern.
 */
export function includesValue(values, code) {
    return values.includes(code);
}
/**
 * Type-safe check whether a number is included in a readonly array of number literals.
 * Replaces `Object.values(NUMERIC_ERRORS).includes(code as any)` pattern.
 */
export function includesNumericValue(values, code) {
    return values.includes(code);
}
//# sourceMappingURL=type-guards.js.map