/**
 * @file BaseSettingsModule.js
 * @description Abstract base class for user settings modules.
 * 
 * Contents:
 * - Template Method Pattern for updates
 * - SessionStorage synchronization
 * - Centralized validation patterns
 * - UserService integration
 * 
 * Subclasses:
 * - ProfileModule, SecurityModule
 * - AccountInfoModule, PreferencesModule
 * 
 * Dependencies:
 * - UserService (Firebase persistence)
 * - SweetAlert2 (user feedback)
 * 
 * @abstract
 * @author Leandro Fialho Fernandes
 */

/**
 * @class BaseSettingsModule
 * @abstract
 * @description Abstract base class for settings modules
 */
class BaseSettingsModule {
    
    /**
     * Initializes the base settings module
     * 
     * @constructor
     * @param {string} moduleName - Module name (profile, security, account, preferences)
     * @param {UserService} userService - User service
     * @throws {TypeError} If trying to instantiate directly (abstract class)
     * 
     * @example
     * super('profile', userService);
     */
    constructor(moduleName, userService) {
        if (new.target === BaseSettingsModule) {
            throw new TypeError('Cannot construct BaseSettingsModule instances directly');
        }
        this.moduleName = moduleName;
        this.userService = userService;
        this.currentUser = null;
    }

    /**
     * Renders module-specific content
     * @abstract
     * @returns {string} Module HTML
     */
    renderContent() {
        throw new Error('Method renderContent() must be implemented');
    }

    /**
     * Extracts form data
     * @abstract
     * @returns {Object} Form data
     */
    getFormData() {
        throw new Error('Method getFormData() must be implemented');
    }

    /**
     * Validates data before saving
     * @abstract
     * @param {Object} data - Data to validate
     * @returns {Object} {valid: boolean, message: string}
     */
    validateData(data) {
        throw new Error('Method validateData() must be implemented');
    }

    /**
     * Loads current user from sessionStorage
     * @returns {Object} User data
     */
    loadCurrentUser() {
        try {
            const userString = sessionStorage.getItem('currentUser');
            this.currentUser = userString ? JSON.parse(userString) : null;
            return this.currentUser;
        } catch (error) {
            Logger.error('❌ Error loading user:', error);
            return null;
        }
    }

    /**
     * Updates user in sessionStorage
     * @param {Object} updates - Updates to apply
     * @returns {void}
     */
    updateSessionUser(updates) {
        if (this.currentUser) {
            Object.assign(this.currentUser, updates);
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }

    /**
     * Shows loading during async operation
     * @param {string} title - Loading title
     * @param {string} text - Loading text
     * @returns {void}
     */
    showLoading(title = 'Processing...', text = 'Please wait') {
        Swal.fire({
            title,
            text,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }

    /**
     * Mostra mensagem de sucesso
     * @param {string} title - Título da mensagem
     * @param {string} text - Texto da mensagem
     * @param {number} timer - Tempo para fechar automaticamente (ms)
     * @returns {Promise}
     */
    showSuccess(title, text, timer = 3000) {
        return Swal.fire({
            icon: 'success',
            title,
            text,
            showConfirmButton: false,
            timer,
            timerProgressBar: true
        });
    }

    /**
     * Mostra mensagem de erro
     * @param {string} title - Título da mensagem
     * @param {string} text - Texto da mensagem
     * @returns {Promise}
     */
    showError(title, text) {
        return Swal.fire({
            icon: 'error',
            title,
            text,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Mostra mensagem de validação
     * @param {string} message - Mensagem de validação
     * @returns {Promise}
     */
    showValidation(message) {
        return Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Mostra confirmação antes de ação
     * @param {string} title - Título da confirmação
     * @param {string} text - Texto da confirmação
     * @param {string} confirmButtonText - Texto do botão confirmar
     * @returns {Promise<boolean>}
     */
    async showConfirmation(title, text, confirmButtonText = 'Confirmar') {
        const result = await Swal.fire({
            icon: 'question',
            title,
            text,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });
        return result.isConfirmed;
    }

    /**
     * Formata data para exibição
     * @param {string} dateString - Data em formato ISO ou timestamp
     * @returns {string} Data formatada
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    }

    /**
     * Capitaliza primeira letra de cada palavra
     * @param {string} str - String a capitalizar
     * @returns {string} String capitalizada
     */
    capitalize(str) {
        if (!str) return '';
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    /**
     * Verifica se é login via email/senha
     * @returns {boolean}
     */
    isEmailPasswordLogin() {
        return this.currentUser?.provider === 'email' || !this.currentUser?.provider;
    }

    /**
     * Obtém nome do provedor de autenticação
     * @returns {string}
     */
    getProviderName() {
        const provider = this.currentUser?.provider;
        const providerNames = {
            'google.com': 'Google',
            'email': 'E-mail/Senha',
            'password': 'E-mail/Senha'
        };
        return providerNames[provider] || 'E-mail/Senha';
    }
}
