/**
 * @file UIManager.js
 * @description Static utility class for UI feedback and form validation.
 * 
 * Contents:
 * - showMessage(): Display toast notifications
 * - showSuccess(), showError(): Shortcut methods
 * - toggleButtonLoading(): Button loading state
 * - showFieldError(), clearFormErrors(): Form validation UI
 * 
 * Usage: All methods are static (UIManager.showMessage(...))
 * 
 * Dependencies:
 * - Logger (error logging)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class UIManager
 * @description Manages interface elements and visual feedback (static utility class)
 */
class UIManager {

    /**
     * @description Displays a feedback message to the user
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success' or 'error')
     * @param {number} duration - Duration in ms (default: 4000)
     * 
     * @example
     * UIManager.showMessage('Login successful', 'success', 3000);
     */
    static showMessage(message, type = 'success', duration = 4000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;

        const card = document.querySelector('.login-card');
        if (!card) {
            Logger.error('Card not found');
            return;
        }

        card.insertBefore(messageDiv, card.firstChild);

        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 100);

        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, duration);
    }

    /**
     * Shortcut to display success message
     * @param {string} message - Success message
     * @param {number} duration - Duration in ms (default: 4000)
     */
    static showSuccess(message, duration = 4000) {
        this.showMessage(message, 'success', duration);
    }

    /**
     * Shortcut to display error message
     * @param {string} message - Error message
     * @param {number} duration - Duration in ms (default: 4000)
     */
    static showError(message, duration = 4000) {
        this.showMessage(message, 'error', duration);
    }

    /**
     * Displays loading state on a button
     * @param {HTMLElement} button - Button element
     * @param {boolean} isLoading - Loading state
     */
    static toggleButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
            button.style.opacity = '1';
        }
    }

    /**
     * Adds error class to a field
     * @param {HTMLElement} input - Input field
     * @param {string} message - Error message
     */
    static showFieldError(input, message) {
        input.classList.add('error');

        const existingError = input.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        input.parentElement.appendChild(errorDiv);

        if (!document.getElementById('field-error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'field-error-styles';
            styles.textContent = `
                .form-group input.error {
                    border-color: #ef4444 !important;
                }
                .field-error {
                    color: #fca5a5;
                    font-size: 0.8rem;
                    margin-top: 0.25rem;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Removes error class from a field
     * @param {HTMLElement} input - Input field
     */
    static clearFieldError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentElement.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Clears all errors from a form
     * @param {HTMLElement} form - Form element
     */
    static clearFormErrors(form) {
        const inputs = form.querySelectorAll('input.error');
        inputs.forEach(input => this.clearFieldError(input));
    }
}
