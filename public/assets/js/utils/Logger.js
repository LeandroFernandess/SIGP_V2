/**
 * @file Logger.js
 * @description Lightweight logger with controllable debug output.
 * 
 * Features:
 * - Global debug flag control
 * - All standard console methods (log, warn, error, info)
 * - Zero overhead when disabled (no-op)
 * 
 * Usage:
 *   Logger.enableDebug();  // Enable during development
 *   Logger.log('Info');    // Only shows when DEBUG=true
 *   Logger.error('Fail');  // Only shows when DEBUG=true
 * 
 * Dependencies: None (standalone utility)
 * Used by: All modules for consistent logging
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class Logger
 * @description Lightweight logging utility with debug control.
 */
class Logger {

    /** @type {boolean} Flag to control console output. */
    static DEBUG = false;

    /**
     * Logs informational messages when debug is enabled.
     * @param {...any} args - Values to log.
     */
    static log(...args) {
        if (this.DEBUG) {
            console.log(...args);
        }
    }

    /**
     * Logs warnings when debug is enabled.
     * @param {...any} args - Values to warn.
     */
    static warn(...args) {
        if (this.DEBUG) {
            console.warn(...args);
        }
    }

    /**
     * Logs errors when debug is enabled.
     * @param {...any} args - Error details to log.
     */
    static error(...args) {
        if (this.DEBUG) {
            console.error(...args);
        }
    }

    /**
     * Logs info messages when debug is enabled.
     * @param {...any} args - Values to log.
     */
    static info(...args) {
        if (this.DEBUG) {
            console.info(...args);
        }
    }

    /**
     * Enables debug logging.
     */
    static enableDebug() {
        this.DEBUG = true;
        console.log('🔧 Logger: Modo DEBUG ativado');
    }

    /**
     * Disables debug logging.
     */
    static disableDebug() {
        this.DEBUG = false;
    }
}

if (typeof window !== 'undefined') {
    window.Logger = Logger;
}
