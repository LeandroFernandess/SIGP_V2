/**
 * @file EventBus.js
 * @description Centralized pub/sub event system for decoupled component communication.
 * 
 * Contents:
 * - Events constant (frozen event names)
 * - EventBusClass (on, once, off, emit methods)
 * - Singleton export (EventBus instance)
 * - Global exposure (window.EventBus, window.Events)
 * 
 * Event Categories:
 * - Module: MODULE_RELOADED, MODULE_CHANGED, MODULE_INITIALIZED
 * - Form: FORM_STATE_CHANGED, FORM_SUBMITTED, FORM_CANCELLED
 * - Data: DATA_CREATED, DATA_UPDATED, DATA_DELETED, DATA_LOADED
 * - Navigation: TAB_OPENED, TAB_CLOSED, TAB_CHANGED, PAGE_LOADED
 * - Auth: AUTH_LOGIN, AUTH_LOGOUT, AUTH_ERROR
 * - UI: LOADING_START, LOADING_END, NOTIFICATION_SHOW, THEME_CHANGED
 * 
 * Dependencies: None (standalone module)
 * 
 * @author Leandro Fialho Fernandes
 */


/**
 * Centralized event names to prevent typos and enable autocomplete
 * @constant {Object}
 */
const Events = Object.freeze({
    // Module lifecycle events
    MODULE_RELOADED: 'module:reloaded',
    MODULE_CHANGED: 'module:changed',
    MODULE_INITIALIZED: 'module:initialized',

    // Form events
    FORM_STATE_CHANGED: 'form:stateChanged',
    FORM_SUBMITTED: 'form:submitted',
    FORM_CANCELLED: 'form:cancelled',
    FORM_ACTION_STATE: 'form:actionState',

    // Data events
    DATA_CREATED: 'data:created',
    DATA_UPDATED: 'data:updated',
    DATA_DELETED: 'data:deleted',
    DATA_LOADED: 'data:loaded',

    // Navigation events
    TAB_OPENED: 'tab:opened',
    TAB_CLOSED: 'tab:closed',
    TAB_CHANGED: 'tab:changed',
    PAGE_LOADED: 'page:loaded',

    // Auth events
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_ERROR: 'auth:error',

    // UI events
    LOADING_START: 'ui:loadingStart',
    LOADING_END: 'ui:loadingEnd',
    NOTIFICATION_SHOW: 'ui:notification',
    THEME_CHANGED: 'ui:themeChanged'
});


/**
 * EventBus class implementing the publish-subscribe pattern
 */
class EventBusClass {

    constructor() {
        /** @private {Map<string, Set<Function>>} */
        this._listeners = new Map();

        /** @private {boolean} */
        this._debug = false;
    }

    /**
     * Enable or disable debug logging
     * @param {boolean} enabled - Whether to enable debug mode
     * @returns {EventBusClass} This instance for chaining
     */
    setDebug(enabled) {
        this._debug = enabled;
        return this;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name (use Events constants)
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (typeof callback !== 'function') {
            console.warn(`[EventBus] Invalid callback for event "${event}"`);
            return () => { };
        }

        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }

        this._listeners.get(event).add(callback);

        if (this._debug) {
        }

        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        return this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function to remove
     * @returns {boolean} Whether the listener was removed
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (!listeners) {
            return false;
        }

        const removed = listeners.delete(callback);

        if (this._debug && removed) {
        }

        if (listeners.size === 0) {
            this._listeners.delete(event);
        }

        return removed;
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Event name (optional, clears all if omitted)
     * @returns {void}
     */
    clear(event) {
        if (event) {
            this._listeners.delete(event);
            if (this._debug) {
            }
        } else {
            this._listeners.clear();
            if (this._debug) {
            }
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} [data] - Data to pass to handlers
     * @returns {void}
     */
    emit(event, data) {
        if (this._debug) {
        }

        const listeners = this._listeners.get(event);
        if (!listeners || listeners.size === 0) {
            return;
        }

        const eventData = data !== undefined ? Object.freeze({ ...data }) : undefined;

        listeners.forEach(callback => {
            try {
                callback(eventData);
            } catch (error) {
                console.error(`[EventBus] Error in handler for "${event}":`, error);
            }
        });
    }

    /**
     * Emit an event asynchronously (next tick)
     * @param {string} event - Event name
     * @param {*} [data] - Data to pass to handlers
     * @returns {void}
     */
    emitAsync(event, data) {
        setTimeout(() => this.emit(event, data), 0);
    }


    /**
     * Check if an event has any listeners
     * @param {string} event - Event name
     * @returns {boolean} Whether the event has listeners
     */
    hasListeners(event) {
        const listeners = this._listeners.get(event);
        return listeners ? listeners.size > 0 : false;
    }

    /**
     * Get the count of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const listeners = this._listeners.get(event);
        return listeners ? listeners.size : 0;
    }

    /**
     * Get all registered event names
     * @returns {string[]} Array of event names
     */
    eventNames() {
        return Array.from(this._listeners.keys());
    }
}

/**
 * Singleton instance of EventBus
 * @type {EventBusClass}
 */
const EventBus = new EventBusClass();

if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.Events = Events;
}
