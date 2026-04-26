/**
 * @file DOMUtils.js
 * @description DOM helpers with caching and common element operations.
 * 
 * Features:
 * - Element caching (getById, getMultipleById)
 * - Input operations (getInputValue, setInputValue)
 * - Visibility control (show, hide, toggle)
 * - Class manipulation (addClass, removeClass, toggleClass)
 * - Event handling with auto-cleanup (addListener)
 * - Performance utilities (debounce, throttle, nextFrame)
 * 
 * Usage:
 *   const element = DOMUtils.getById('myId');        // Cached lookup
 *   const value = DOMUtils.getInputValue('email');   // Get trimmed value
 *   DOMUtils.addClass('btn', 'active');              // Add class
 *   const debouncedFn = DOMUtils.debounce(fn, 300);  // Debounce
 * 
 * Dependencies: None (standalone utility)
 * Used by: All UI components for DOM manipulation
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class DOMUtils
 * @description Utility class for DOM manipulation with caching and common operations.
 */
class DOMUtils {

    /** @type {Map<string, HTMLElement>} DOM element cache */
    static elementCache = new Map();

    /**
     * Gets an element by ID using cache.
     * @param {string} id - Element ID.
     * @returns {HTMLElement|null} Element or null.
     */
    static getById(id) {
        if (!this.elementCache.has(id)) {
            this.elementCache.set(id, document.getElementById(id));
        }
        return this.elementCache.get(id);
    }

    /**
     * Gets multiple elements by IDs.
     * @param {string[]} ids - List of IDs.
     * @returns {Object} Map of elements keyed by id.
     */
    static getMultipleById(ids) {
        const elements = {};
        ids.forEach(id => {
            elements[id] = this.getById(id);
        });
        return elements;
    }

    /**
     * Clears the element cache (useful after dynamic DOM changes).
     */
    static clearCache() {
        this.elementCache.clear();
    }

    /**
     * Removes a specific element from cache.
     * @param {string} id - Element ID.
     */
    static removeCached(id) {
        this.elementCache.delete(id);
    }

    /**
     * Gets an input value by ID.
     * @param {string} id - Input ID.
     * @returns {string} Input value or empty string.
     */
    static getInputValue(id) {
        const element = this.getById(id);
        return element ? element.value.trim() : '';
    }

    /**
     * Sets an input value by ID.
     * @param {string} id - Input ID.
     * @param {string} value - Value to set.
     */
    static setInputValue(id, value) {
        const element = this.getById(id);
        if (element) {
            element.value = value || '';
        }
    }

    /**
     * Adds an event listener with an auto-remove helper.
     * @param {string} id - Element ID.
     * @param {string} event - Event name.
     * @param {Function} handler - Event handler.
     * @returns {Function} Function to remove the listener.
     */
    static addListener(id, event, handler) {
        const element = this.getById(id);
        if (element) {
            element.addEventListener(event, handler);
            return () => element.removeEventListener(event, handler);
        }
        return () => { };
    }

    /**
     * Shows an element.
     * @param {string} id - Element ID.
     */
    static show(id) {
        const element = this.getById(id);
        if (element) {
            element.style.display = '';
        }
    }

    /**
     * Hides an element.
     * @param {string} id - Element ID.
     */
    static hide(id) {
        const element = this.getById(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    /**
     * Toggles visibility of an element.
     * @param {string} id - Element ID.
     */
    static toggle(id) {
        const element = this.getById(id);
        if (element) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
    }

    /**
     * Adds a class to an element.
     * @param {string} id - Element ID.
     * @param {string} className - Class name.
     */
    static addClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Removes a class from an element.
     * @param {string} id - Element ID.
     * @param {string} className - Class name.
     */
    static removeClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Toggles a class on an element.
     * @param {string} id - Element ID.
     * @param {string} className - Class name.
     */
    static toggleClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.toggle(className);
        }
    }

    /**
     * Creates a debounced version of a function.
     * Delays execution until after `delay` ms have elapsed since last call.
     * @param {Function} fn - Function to debounce.
     * @param {number} [delay=300] - Delay in milliseconds.
     * @returns {Function} Debounced function.
     */
    static debounce(fn, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Creates a throttled version of a function.
     * Ensures function is called at most once per `limit` ms.
     * @param {Function} fn - Function to throttle.
     * @param {number} [limit=100] - Minimum time between calls in ms.
     * @returns {Function} Throttled function.
     */
    static throttle(fn, limit = 100) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Executes a callback on next animation frame (optimized for visual updates).
     * @param {Function} fn - Function to execute.
     * @returns {number} Request ID for cancellation.
     */
    static nextFrame(fn) {
        return requestAnimationFrame(fn);
    }

    /**
     * Cancels a scheduled animation frame callback.
     * @param {number} id - Request ID from nextFrame.
     */
    static cancelFrame(id) {
        cancelAnimationFrame(id);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMUtils;
}

if (typeof window !== 'undefined') {
    window.DOMUtils = DOMUtils;
}
