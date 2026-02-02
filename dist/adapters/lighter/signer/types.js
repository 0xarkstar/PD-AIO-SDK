/**
 * Lighter FFI Type Definitions
 *
 * Type definitions for interacting with the native Lighter signing library.
 * These types mirror the C structures used by the native library.
 */
/**
 * Order types supported by Lighter
 */
export var OrderType;
(function (OrderType) {
    OrderType[OrderType["LIMIT"] = 0] = "LIMIT";
    OrderType[OrderType["MARKET"] = 1] = "MARKET";
    OrderType[OrderType["STOP_LIMIT"] = 2] = "STOP_LIMIT";
    OrderType[OrderType["STOP_MARKET"] = 3] = "STOP_MARKET";
})(OrderType || (OrderType = {}));
/**
 * Time in force options
 */
export var TimeInForce;
(function (TimeInForce) {
    /** Good Till Cancel */
    TimeInForce[TimeInForce["GTC"] = 0] = "GTC";
    /** Immediate or Cancel */
    TimeInForce[TimeInForce["IOC"] = 1] = "IOC";
    /** Fill or Kill */
    TimeInForce[TimeInForce["FOK"] = 2] = "FOK";
    /** Post Only (maker only) */
    TimeInForce[TimeInForce["POST_ONLY"] = 3] = "POST_ONLY";
})(TimeInForce || (TimeInForce = {}));
/**
 * Transaction types returned by the native library
 */
export var TxType;
(function (TxType) {
    TxType[TxType["CREATE_ORDER"] = 1] = "CREATE_ORDER";
    TxType[TxType["CANCEL_ORDER"] = 2] = "CANCEL_ORDER";
    TxType[TxType["CANCEL_ALL_ORDERS"] = 3] = "CANCEL_ALL_ORDERS";
    TxType[TxType["WITHDRAW_COLLATERAL"] = 4] = "WITHDRAW_COLLATERAL";
    TxType[TxType["UPDATE_API_KEY_PERMISSIONS"] = 5] = "UPDATE_API_KEY_PERMISSIONS";
})(TxType || (TxType = {}));
//# sourceMappingURL=types.js.map