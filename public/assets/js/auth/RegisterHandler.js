/**
 * @file RegisterHandler.js
 * @description New user registration handler (Traditional and Google OAuth).
 * 
 * Contents:
 * - Constructor with dependency injection
 * - Form initialization and event binding
 * - Traditional email/password registration
 * - Google OAuth registration flow
 * - Form validation (email, password match, length)
 * - Auto-generated username (SIGP000, SIGP001...)
 * - iOS touch event support
 * 
 * Dependencies:
 * - UserService (Firebase Auth user creation)
 * - UIManager (user feedback)
 * - Validator (form validation)
 * - FormManager (form state management)
 * - Logger (error logging)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class RegisterHandler
 * @description New user registration handler
 */
class RegisterHandler {

    /**
     * Initializes the registration handler
     * Automatically sets up listeners
     * 
     * @constructor
     * @param {UserService} userService - User service
     * @param {UIManager} uiManager - UI manager
     * @param {Validator} validator - Field validator
     * @param {FormManager} formManager - Form manager
     * 
     * @example
     * const handler = new RegisterHandler(
     *   userService, UIManager, Validator, formManager
     * );
     */
    constructor(userService, uiManager, validator, formManager) {
        this.userService = userService;
        this.uiManager = uiManager;
        this.validator = validator;
        this.formManager = formManager;
        this.form = document.getElementById('registerForm');

        this.initialize();
    }

    /**
     * Initializes the form handler
     */
    initialize() {
        if (!this.form) {
            Logger.error('Formulário de registro não encontrado');
            return;
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSubmit(e);
        }, { passive: false });

        const selectFormBtn = document.getElementById('selectFormMethod');
        const selectGoogleBtn = document.getElementById('selectGoogleMethod');
        const backBtn = document.getElementById('backToMethodSelection');
        const methodSelection = document.getElementById('methodSelection');
        const formMethodContent = document.getElementById('formMethodContent');

        if (selectFormBtn) {
            selectFormBtn.addEventListener('click', () => {
                methodSelection.style.display = 'none';
                formMethodContent.style.display = 'block';
            });
        }

        if (selectGoogleBtn) {
            selectGoogleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGoogleRegister(e);
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                methodSelection.style.display = 'block';
                formMethodContent.style.display = 'none';
                this.form.reset();
            });
        }

        const googleBtn = document.getElementById('googleRegisterBtn');
        if (googleBtn) {
            googleBtn.style.cursor = 'pointer';
            googleBtn.style.webkitTapHighlightColor = 'transparent';

            googleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleGoogleRegister(e);
            }, { passive: false });

            googleBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleGoogleRegister(e);
            }, { passive: false });
        }
    }

    /**
     * Processes Google registration/login
     * @param {Event} e - Click event
     */
    async handleGoogleRegister(e) {
        e.preventDefault();

        try {
            const loadingManager = window.loadingManager;
            if (loadingManager) {
                loadingManager.show('Autenticando com Google...');
            }

            const result = await this.userService.signInWithGoogle();

            if (result.success) {

                sessionStorage.setItem('currentUser', JSON.stringify(result.user));

                if (loadingManager) {
                    if (result.isNewUser) {
                        loadingManager.showSuccess(
                            'Conta criada com sucesso!',
                            `Bem-vindo ao SIGP! Seu usuário é: ${result.user.username}`
                        );
                    } else {
                        loadingManager.showSuccess(
                            'Login realizado com sucesso!',
                            `Bem-vindo de volta, ${result.user.name}!`
                        );
                    }
                }

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                if (loadingManager) {
                    loadingManager.hide();
                }
                setTimeout(() => {
                    this.uiManager.showMessage(result.message, 'error');
                }, 500);
            }
        } catch (error) {
            console.error('🎯 RegisterHandler: Erro capturado:', error);
            console.error('🎯 Error stack:', error?.stack);
            const loadingManager = window.loadingManager;
            if (loadingManager) {
                loadingManager.hide();
            }
            Logger.error('❌ Google registration error:', error);
            setTimeout(() => {
                this.uiManager.showMessage('Erro ao criar conta com Google. Tente novamente.', 'error');
            }, 500);
        }
    }

    /**
     * Processes form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        this.uiManager.clearFormErrors(this.form);

        if (!this.validator.validateRequired({ name, email, password, confirmPassword })) {
            this.uiManager.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        if (!this.validator.validateEmail(email)) {
            this.uiManager.showMessage('Por favor, insira um e-mail válido', 'error');
            const emailInput = document.getElementById('register-email');
            this.uiManager.showFieldError(emailInput, 'E-mail inválido');
            return;
        }

        if (!this.validator.validatePasswordMatch(password, confirmPassword)) {
            this.uiManager.showMessage('As senhas não coincidem', 'error');
            const confirmInput = document.getElementById('register-confirm-password');
            this.uiManager.showFieldError(confirmInput, 'Senhas não coincidem');
            return;
        }

        if (!this.validator.validatePasswordLength(password, 6)) {
            this.uiManager.showMessage('A senha deve ter no mínimo 6 caracteres', 'error');
            const passwordInput = document.getElementById('register-password');
            this.uiManager.showFieldError(passwordInput, 'Mínimo 6 caracteres');
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        this.uiManager.toggleButtonLoading(submitButton, true);

        try {
            const result = await this.userService.createUser({
                name,
                email,
                password
            });

            this.uiManager.toggleButtonLoading(submitButton, false);

            if (result.success) {
                this.uiManager.showMessage(
                    `✅ ${result.message}\n\nUse este usuário para fazer login.`,
                    'success'
                );
                this.formManager.resetForm('register');

                setTimeout(() => {
                    const loadingManager = window.loadingManager;
                    if (loadingManager) {
                        loadingManager.show(
                            'Redirecionando para o login...',
                            'Você será redirecionado em instantes para fazer seu primeiro acesso'
                        );
                    }
                    
                    setTimeout(() => {
                        if (loadingManager) {
                            loadingManager.hide();
                        }
                        this.formManager.switchForm('register', 'login');
                    }, 2000);
                }, 2500);
            } else {
                this.uiManager.showMessage(result.message, 'error');
            }
        } catch (error) {
            Logger.error('Error creating user:', error);
            this.uiManager.toggleButtonLoading(submitButton, false);
            this.uiManager.showMessage('Erro ao criar usuário. Tente novamente.', 'error');
        }
    }
}

export { RegisterHandler };
