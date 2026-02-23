/**
 * @file ForgotPasswordHandler.js
 * @description Password recovery handler via Firebase Authentication.
 * 
 * Contents:
 * - Constructor with dependency injection
 * - Form initialization and event binding
 * - Password reset email submission
 * - Success/error feedback handling
 * 
 * Dependencies:
 * - UserService (Firebase Auth password reset)
 * - UIManager (user feedback)
 * - FormManager (form state management)
 * - Logger (error logging)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ForgotPasswordHandler
 * @description Password recovery handler
 */
class ForgotPasswordHandler {

    /**
     * Initializes the password recovery handler
     * Automatically configures submit listener
     * 
     * @constructor
     * @param {UserService} userService - User service
     * @param {UIManager} uiManager - UI manager
     * @param {FormManager} formManager - Form manager
     * 
     * @example
     * const handler = new ForgotPasswordHandler(
     *   userService, UIManager, formManager
     * );
     */
    constructor(userService, uiManager, formManager) {
        this.userService = userService;
        this.uiManager = uiManager;
        this.formManager = formManager;
        this.form = document.getElementById('forgotPasswordForm');
        
        this.initialize();
    }

    /**
     * Initializes the form handler
     */
    initialize() {
        if (!this.form) {
            Logger.error('Formulário de recuperação não encontrado');
            return;
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSubmit(e);
        }, { passive: false });
    }

    /**
     * Processes form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('forgot-identifier').value.trim();
        
        this.uiManager.clearFormErrors(this.form);

        if (!usernameInput) {
            this.uiManager.showMessage('Por favor, preencha o campo de usuário', 'error');
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        this.uiManager.toggleButtonLoading(submitButton, true);

        try {
            const users = await this.userService.getUsers();
            const user = users.find(u => u.username === usernameInput);
            
            if (!user) {
                this.uiManager.toggleButtonLoading(submitButton, false);
                this.uiManager.showMessage('Usuário não encontrado', 'error');
                return;
            }
            
            const result = await this.userService.sendPasswordResetEmail(user.email);
            
            this.uiManager.toggleButtonLoading(submitButton, false);

            if (result.success) {
                this.uiManager.showMessage(
                    `${result.message}\n\nVerifique a caixa de entrada de: ${user.email}`, 
                    'success'
                );
                
                this.formManager.resetForm('forgotPassword');
                
                setTimeout(() => {
                    this.formManager.switchForm('forgotPassword', 'login');
                }, 5000);
            } else {
                this.uiManager.showMessage(result.message, 'error');
            }
        } catch (error) {
            Logger.error('Erro ao processar recuperação:', error);
            this.uiManager.toggleButtonLoading(submitButton, false);
            this.uiManager.showMessage('Erro ao processar solicitação. Tente novamente.', 'error');
        }
    }
}

export { ForgotPasswordHandler };
