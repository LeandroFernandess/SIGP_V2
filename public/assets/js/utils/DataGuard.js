/**
 * @file DataGuard.js
 * @description Defensive validation utilities for data from external sources.
 * 
 * Provides type-safe accessors and validators for:
 * - Firebase document data
 * - API responses
 * - User input
 * 
 * Features:
 * - Safe property access with defaults (get, getString, getNumber, getArray)
 * - Type checking (isObject, isArray, isString, isNumber)
 * - HTML sanitization (escapeHtml)
 * - Schema-based document validation (validateDoc)
 * 
 * Usage:
 *   const name = DataGuard.getString(doc, 'user.name', 'Guest');
 *   const items = DataGuard.getArray(response, 'data.items');
 *   const clean = DataGuard.validateDoc(doc, { title: 'string', price: 'number' });
 * 
 * Dependencies: None (standalone utility)
 * Used by: Services, Modules for safe data access
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class dataGuard
 * @description Utility class for defensive data validation and safe access.
 */
class DataGuard {

    /**
     * Checks if value is a non-null object.
     * @param {*} value - Value to check.
     * @returns {boolean}
     */
    static isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Checks if value is a non-empty array.
     * @param {*} value - Value to check.
     * @returns {boolean}
     */
    static isArray(value) {
        return Array.isArray(value);
    }

    /**
     * Checks if value is a non-empty string.
     * @param {*} value - Value to check.
     * @returns {boolean}
     */
    static isString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    /**
     * Checks if value is a number (not NaN).
     * @param {*} value - Value to check.
     * @returns {boolean}
     */
    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    /**
     * Safely gets a property from an object.
     * @param {Object} obj - Source object.
     * @param {string} path - Dot-separated path (e.g., 'user.profile.name').
     * @param {*} defaultValue - Value to return if path doesn't exist.
     * @returns {*}
     */
    static get(obj, path, defaultValue = null) {
        if (!this.isObject(obj) && !this.isArray(obj)) {
            return defaultValue;
        }

        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
            if (current === null || current === undefined) {
                return defaultValue;
            }
            current = current[key];
        }

        return current !== undefined ? current : defaultValue;
    }

    /**
     * Safely gets a string property.
     * @param {Object} obj - Source object.
     * @param {string} path - Dot-separated path.
     * @param {string} defaultValue - Default value.
     * @returns {string}
     */
    static getString(obj, path, defaultValue = '') {
        const value = this.get(obj, path, defaultValue);
        return typeof value === 'string' ? value : String(value ?? defaultValue);
    }

    /**
     * Safely gets a number property.
     * @param {Object} obj - Source object.
     * @param {string} path - Dot-separated path.
     * @param {number} defaultValue - Default value.
     * @returns {number}
     */
    static getNumber(obj, path, defaultValue = 0) {
        const value = this.get(obj, path, defaultValue);
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Safely gets an array property.
     * @param {Object} obj - Source object.
     * @param {string} path - Dot-separated path.
     * @returns {Array}
     */
    static getArray(obj, path) {
        const value = this.get(obj, path, []);
        return Array.isArray(value) ? value : [];
    }

    /**
     * Sanitizes a string for safe HTML display.
     * @param {string} str - String to sanitize.
     * @returns {string}
     */
    static escapeHtml(str) {
        if (typeof str !== 'string') return '';

        const htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return str.replace(/[&<>"']/g, char => htmlEntities[char]);
    }

    /**
     * Validates and cleans a Firebase document.
     * @param {Object} doc - Firebase document data.
     * @param {Object} schema - Expected field types.
     * @returns {Object} Cleaned document.
     * 
     * @example
     * const schema = { title: 'string', price: 'number', tags: 'array' };
     * const cleaned = DataGuard.validateDoc(doc, schema);
     */
    static validateDoc(doc, schema) {
        if (!this.isObject(doc)) return {};

        const result = {};

        for (const [key, type] of Object.entries(schema)) {
            const value = doc[key];

            switch (type) {
                case 'string':
                    result[key] = typeof value === 'string' ? value : '';
                    break;
                case 'number':
                    result[key] = this.isNumber(value) ? value : 0;
                    break;
                case 'boolean':
                    result[key] = Boolean(value);
                    break;
                case 'array':
                    result[key] = Array.isArray(value) ? value : [];
                    break;
                case 'object':
                    result[key] = this.isObject(value) ? value : {};
                    break;
                default:
                    result[key] = value;
            }
        }

        if (doc.id) result.id = doc.id;

        return result;
    }
}

if (typeof window !== 'undefined') {
    window.DataGuard = DataGuard;
}
