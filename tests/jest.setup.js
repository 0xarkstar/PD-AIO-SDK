/**
 * Jest Setup File
 *
 * Adds BigInt serialization support for Jest.
 */

// Enable BigInt serialization for Jest
// This prevents "Do not know how to serialize a BigInt" errors
if (typeof BigInt !== 'undefined') {
  // eslint-disable-next-line no-extend-native
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}
