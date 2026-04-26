/**
 * @file FormUtils.js
 * @description Form-related helpers for masking, validation, and user session.
 * 
 * Features:
 * - Input masks (Brazilian phone, CPF)
 * - String utilities (removeNonNumeric)
 * - Session management (getCurrentUser, setCurrentUser, clearCurrentUser)
 * 
 * Usage:
 *   FormUtils.applyPhoneMask(inputElement);
 *   const user = FormUtils.getCurrentUser();
 * 
 * Dependencies: Logger (optional, for error logging)
 * Used by: RegisterHandler, SettingsModule, ProfileModule
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class FormUtils
 * @description Utility class for form input masks, validation, and user session management.
 */
class FormUtils {

    /**
     * Applies a Brazilian phone mask to an input field.
     * @param {HTMLInputElement} input - Target input element.
     */
    static applyPhoneMask(input) {
        if (!input) return;

        input.addEventListener('input', (e) => {
            let v = input.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 0) v = '(' + v;
            if (v.length > 3) v = v.slice(0, 3) + ') ' + v.slice(3);
            if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
            else if (v.length > 6) v = v.slice(0, 9) + '-' + v.slice(9);
            input.value = v;
        });
    }

    /**
     * Removes all non-numeric characters from a string.
     * @param {string} value - Value to clean.
     * @returns {string} Numeric characters only.
     */
    static removeNonNumeric(value) {
        return value.replace(/\D/g, '');
    }

    /**
     * Validates Brazilian phone numbers (10 or 11 digits).
     * @deprecated Use Validator.validatePhone() instead
     * @param {string} phone - Phone number to validate.
     * @returns {boolean} True when valid length.
     */
    static isValidPhone(phone) {
        const numbers = this.removeNonNumeric(phone);
        return numbers.length === 10 || numbers.length === 11;
    }

    /**
     * Retrieves the current user from sessionStorage.
     * @returns {Object|null} User data or null.
     */
    static getCurrentUser() {
        try {
            const userJson = sessionStorage.getItem('currentUser');
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            if (typeof Logger !== 'undefined') {
                Logger.error('Erro ao obter usuário:', error);
            }
            return null;
        }
    }

    /**
     * Saves the current user to sessionStorage.
     * @param {Object} user - User data to persist.
     */
    static setCurrentUser(user) {
        try {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } catch (error) {
            if (typeof Logger !== 'undefined') {
                Logger.error('Erro ao salvar usuário:', error);
            }
        }
    }

    /**
     * Clears the current user from sessionStorage.
     */
    static clearCurrentUser() {
        try {
            sessionStorage.removeItem('currentUser');
        } catch (error) {
            if (typeof Logger !== 'undefined') {
                Logger.error('Erro ao limpar usuário:', error);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.FormUtils = FormUtils;
}
