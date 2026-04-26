/**
 * @file Validator.js
 * @description Utility helpers for validating common user inputs.
 * 
 * Features:
 * - Required field validation (validateRequired)
 * - Email format validation (validateEmail)
 * - Password validation (length, match, strength)
 * - Username rules (length, allowed characters)
 * - Brazilian phone validation (validatePhone)
 * 
 * Usage:
 *   if (!Validator.validateEmail(email)) { showError('Invalid email'); }
 *   const { isValid, message } = Validator.validatePasswordStrength(pwd);
 * 
 * Dependencies: None (standalone utility)
 * Used by: RegisterHandler, LoginHandler, SettingsModule
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class Validator
 * @description Provides static methods for validating user input fields.
 */
class Validator {

    /**
     * Validates if all fields are filled.
     * @param {Object<string,string>} fields - Object with fields to validate.
     * @returns {boolean} True when every field has a non-empty value.
     */
    static validateRequired(fields) {
        return Object.values(fields).every(value => value && value.trim() !== '');
    }

    /**
     * Validates email format.
     * @param {string} email - Email to validate.
     * @returns {boolean} True when email matches basic pattern.
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validates minimum password length.
     * @param {string} password - Password to validate.
     * @param {number} [minLength=6] - Minimum length required.
     * @returns {boolean} True when password length is sufficient.
     */
    static validatePasswordLength(password, minLength = 6) {
        return password.length >= minLength;
    }

    /**
     * Validates if passwords match.
     * @param {string} password - Password.
     * @param {string} confirmPassword - Password confirmation.
     * @returns {boolean} True when both passwords are identical.
     */
    static validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    /**
     * Validates password strength (optional helper).
     * @param {string} password - Password to validate.
     * @returns {{isValid: boolean, message: string}} Validation result with message.
     */
    static validatePasswordStrength(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < 8) {
            return { isValid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
        }

        const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

        if (strength < 3) {
            return { isValid: false, message: 'Senha fraca. Use maiúsculas, minúsculas e números' };
        }

        return { isValid: true, message: 'Senha forte' };
    }

    /**
     * Validates username rules.
     * @param {string} username - Username to validate.
     * @returns {{isValid: boolean, message: string}} Validation result with message.
     */
    static validateUsername(username) {
        if (username.length < 3) {
            return { isValid: false, message: 'Usuário deve ter no mínimo 3 caracteres' };
        }

        if (username.length > 20) {
            return { isValid: false, message: 'Usuário deve ter no máximo 20 caracteres' };
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return { isValid: false, message: 'Usuário deve conter apenas letras, números e underscore' };
        }

        return { isValid: true, message: 'Usuário válido' };
    }

    /**
     * Validates Brazilian phone numbers (10 or 11 digits).
     * @param {string} phone - Phone number to validate.
     * @returns {boolean} True when valid length.
     */
    static validatePhone(phone) {
        const numbers = phone.replace(/\D/g, '');
        return numbers.length === 10 || numbers.length === 11;
    }
}

if (typeof window !== 'undefined') {
    window.Validator = Validator;
}