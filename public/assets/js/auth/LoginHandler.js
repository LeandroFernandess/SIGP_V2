/**
 * @file LoginHandler.js
 * @description User authentication handler (Traditional login and Google OAuth).
 * 
 * Contents:
 * - Constructor with dependency injection
 * - Form initialization and event binding
 * - Traditional username/password authentication
 * - Google OAuth sign-in flow
 * - Session management (sessionStorage)
 * - iOS touch event support
 * 
 * Dependencies:
 * - UserService (Firebase Auth)
 * - UIManager (user feedback)
 * - LoadingManager (loading overlays)
 * - Logger (error logging)
 * - Swal (SweetAlert2 dialogs)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class LoginHandler
 * @description Manages the user login process
 */
class LoginHandler {
    
    /**
     * Initializes the login handler
     * Automatically sets up submit and Google OAuth listeners
     * 
     * @constructor
     * @param {UserService} userService - User service
     * @param {UIManager} uiManager - UI manager
     * @param {LoadingManager} loadingManager - Loading manager
     * 
     * @example
     * const handler = new LoginHandler(userService, UIManager, loadingManager);
     */
    constructor(userService, uiManager, loadingManager) {
        this.userService = userService;
        this.uiManager = uiManager;
        this.loadingManager = loadingManager;
        this.form = document.getElementById('loginForm');

        this.initialize();
    }

    /**
     * Initializes the form handler
     */
    initialize() {
        if (!this.form) {
            Logger.error('Formulário de login não encontrado');
            return;
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSubmit(e);
        }, { passive: false });

        const googleBtn = document.getElementById('googleLoginBtn');
        if (googleBtn) {
            googleBtn.style.cursor = 'pointer';
            googleBtn.style.webkitTapHighlightColor = 'transparent';

            googleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleGoogleLogin(e);
            }, { passive: false });

            googleBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleGoogleLogin(e);
            }, { passive: false });
        }
    }

    /**
     * Processes Google login
     * @param {Event} e - Click event
     */
    async handleGoogleLogin(e) {
        e.preventDefault();

        try {
            this.loadingManager.show('Autenticando com Google...');

            const result = await this.userService.signInWithGoogle();

            if (result.success) {

                sessionStorage.setItem('currentUser', JSON.stringify(result.user));

                this.loadingManager.showSuccess(
                    'Login realizado com sucesso!',
                    `Bem-vindo, ${result.user.name || result.user.username}!`
                );

                setTimeout(() => {
                    window.location.href = 'dashboard';
                }, 1500);
            } else {
                this.loadingManager.hide();

                const isAccountConflict = result.isAccountConflict === true;
                
                setTimeout(() => {
                    Swal.fire({
                        icon: isAccountConflict ? 'info' : 'warning',
                        title: isAccountConflict ? 'Conta Já Existe' : 'Login Cancelado',
                        html: `
                            <p class="swal-message">
                                ${result.message}
                            </p>
                            ${isAccountConflict ? `
                                <div class="swal-info-box">
                                    <p class="swal-info-title">📌 Como vincular:</p>
                                    <ol class="swal-step-list">
                                        <li>Faça login com seu <strong>usuário (${result.username || 'SIGPXXX'})</strong> e senha</li>
                                        <li>Vá em <strong>Configurações</strong></li>
                                        <li>Acesse a aba <strong>Segurança</strong></li>
                                        <li>Clique em <strong>"Vincular com Google"</strong></li>
                                    </ol>
                                </div>
                            ` : `
                                <p class="swal-muted">
                                    A página será recarregada em instantes...
                                </p>
                            `}
                        `,
                        showConfirmButton: isAccountConflict,
                        confirmButtonText: isAccountConflict ? 'Entendi' : undefined,
                        confirmButtonColor: '#3b82f6',
                        timer: isAccountConflict ? undefined : 3000,
                        timerProgressBar: !isAccountConflict,
                        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.98), rgba(17, 24, 39, 0.98))',
                        customClass: {
                            popup: 'custom-popup-class',
                            title: 'custom-title-class'
                        }
                    }).then(() => {
                        if (!isAccountConflict) {
                            window.location.reload();
                        }
                    });
                }, 300);
            }
        } catch (error) {
            Logger.error('❌ Google login error:', error);
            this.loadingManager.hide();

            setTimeout(() => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no Login',
                    html: `
                        <p style="color: #6b7280; margin-top: 1rem; font-size: 0.95rem;">
                            Ocorreu um erro ao fazer login com Google.
                        </p>
                        <p style="color: #9ca3af; margin-top: 0.5rem; font-size: 0.875rem;">
                            A página será recarregada automaticamente...
                        </p>
                    `,
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.98), rgba(17, 24, 39, 0.98))',
                    customClass: {
                        popup: 'custom-popup-class',
                        title: 'custom-title-class'
                    }
                }).then(() => {
                    window.location.reload();
                });
            }, 300);
        }
    }

    /**
     * Processes form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        const usernameInput = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        this.uiManager.clearFormErrors(this.form);

        if (!usernameInput || !password) {
            this.uiManager.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.loadingManager.show('Autenticando...', 'Verificando suas credenciais');

        try {
            const users = await this.userService.getUsers();
            const user = users.find(u => u.username === usernameInput);

            if (!user) {
                this.loadingManager.hide();
                setTimeout(() => {
                    this.uiManager.showMessage('Usuário não encontrado', 'error');
                }, 500);
                return;
            }

            const result = await this.userService.authenticate(user.email, password);

            if (result.success) {
                sessionStorage.setItem('currentUser', JSON.stringify(result.user));

                this.loadingManager.showSuccess(
                    'Login realizado com sucesso!',
                    `Bem-vindo, ${result.user.name || result.user.username}!`
                );

                setTimeout(() => {
                    window.location.href = 'dashboard';
                }, 1500);
            } else {
                this.loadingManager.hide();

                if (result.isGoogleOnlyAccount) {
                    setTimeout(() => {
                        this.uiManager.showMessage(result.message, 'info');
                    }, 300);
                } else {
                    setTimeout(() => {
                        this.uiManager.showMessage(result.message, 'error');
                    }, 500);
                }
            }
        } catch (error) {
            Logger.error('Authentication error:', error);
            this.loadingManager.hide();
            setTimeout(() => {
                this.uiManager.showMessage('Erro ao autenticar. Tente novamente.', 'error');
            }, 500);
        }
    }
}

export { LoginHandler };
