/**
 * @file AccountInfoModule.js
 * @description Read-only account information display.
 * 
 * Contents:
 * - Account creation date (formatted)
 * - User ID (Firebase UID)
 * - Authentication provider (Email or Google)
 * 
 * Extends: BaseSettingsModule
 * 
 * Dependencies:
 * - UserService
 * - sessionStorage (data cache)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class AccountInfoModule
 * @extends BaseSettingsModule
 * @description Displays user account information
 */
class AccountInfoModule extends BaseSettingsModule {

    /**
     * Initializes the account information module
     * 
     * @constructor
     * @param {UserService} userService - User service
     * 
     * @example
     * const module = new AccountInfoModule(userService);
     */
    constructor(userService) {
        super('accountInfo', userService);
    }

    /**
     * Renders the account information module content
     * @returns {string} Information HTML
     */
    renderContent() {
        this.loadCurrentUser();

        return `
            <div class="settings-card settings-card-info">
                <div class="settings-card-header">
                    <div class="settings-card-icon">ℹ️</div>
                    <div>
                        <h3 class="settings-card-title">Informações da Conta</h3>
                        <p class="settings-card-description">Dados sobre sua conta no sistema</p>
                    </div>
                </div>
                <div class="account-info-grid">
                    <div class="account-info-item">
                        <span class="account-info-label">📅 Conta criada em:</span>
                        <span class="account-info-value">${this.formatDate(this.currentUser?.createdAt)}</span>
                    </div>
                    <div class="account-info-item">
                        <span class="account-info-label">🆔 ID do usuário:</span>
                        <span class="account-info-value">${this.currentUser?.id || 'N/A'}</span>
                    </div>
                    <div class="account-info-item">
                        <span class="account-info-label">🔑 Método de login:</span>
                        <span class="account-info-value">${this.getProviderName()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Extracts form data (not applicable for this module)
     * @returns {Object} Empty data
     */
    getFormData() {
        return {};
    }

    /**
     * Validates data (not applicable for this module)
     * @param {Object} data - Data to validate
     * @returns {Object} {valid: boolean}
     */
    validateData(data) {
        return { valid: true };
    }

    /**
     * Attaches module event listeners (no events in this module)
     * @returns {void}
     */
    attachEventListeners() {
    }
}
