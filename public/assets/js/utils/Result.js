/**
 * @file Result.js
 * @description Lightweight Result Pattern for consistent error handling.
 * 
 * Implements the Result/Either monad pattern for predictable error handling
 * without exceptions. Provides a clear contract for success/failure states.
 * 
 * Usage:
 *   return Result.ok(data);       // Success with data
 *   return Result.fail('msg');    // Failure with message
 * 
 * Checking:
 *   if (result.success) { use(result.data); }
 *   else { showError(result.error); }
 * 
 * Advanced:
 *   result.unwrap();              // Throws if failed
 *   result.unwrapOr(default);     // Returns default if failed
 *   result.map(fn);               // Transform data if successful
 * 
 * Dependencies: None (standalone utility)
 * Used by: Services, Handlers for async operation results
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class Result
 * @description Represents the outcome of an operation, encapsulating success or failure.
 */
class Result {

    /**
     * @param {boolean} success - Whether operation succeeded.
     * @param {*} data - Data on success.
     * @param {string|null} error - Error message on failure.
     */
    constructor(success, data = null, error = null) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    /**
     * Creates a successful result.
     * @param {*} data - The success payload.
     * @returns {Result}
     */
    static ok(data) {
        return new Result(true, data, null);
    }

    /**
     * Creates a failure result.
     * @param {string} error - Error message.
     * @returns {Result}
     */
    static fail(error) {
        return new Result(false, null, error);
    }

    /**
     * Unwraps the result, throwing if failed.
     * @returns {*} The data.
     * @throws {Error} If result is a failure.
     */
    unwrap() {
        if (!this.success) {
            throw new Error(this.error || 'Unknown error');
        }
        return this.data;
    }

    /**
     * Returns data or a default value.
     * @param {*} defaultValue - Value to return on failure.
     * @returns {*}
     */
    unwrapOr(defaultValue) {
        return this.success ? this.data : defaultValue;
    }

    /**
     * Maps the data if successful.
     * @param {Function} fn - Transform function.
     * @returns {Result}
     */
    map(fn) {
        if (!this.success) return this;
        try {
            return Result.ok(fn(this.data));
        } catch (e) {
            return Result.fail(e.message);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Result = Result;
}
