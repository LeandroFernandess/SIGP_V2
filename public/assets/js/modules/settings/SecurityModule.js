/**
 * @file SecurityModule.js
 * @description Security settings and password change management.
 * 
 * Contents:
 * - Email display (read-only)
 * - Password change form
 * - Visibility toggle for passwords
 * - Google login detection
 * 
 * Extends: BaseSettingsModule
 * 
 * Dependencies:
 * - UserService (Firebase Auth)
 * 
 * @author Leandro Fialho Fernandes
 * @version 2.1
 */

/**
 * @class SecurityModule
 * @extends BaseSettingsModule
 * @description Manages security settings (email and password)
 */
class SecurityModule extends BaseSettingsModule {

    /**
     * Initializes the security module
     * 
     * @constructor
     * @param {UserService} userService - User service
     * 
     * @example
     * const module = new SecurityModule(userService);
     */
    constructor(userService) {
        super('security', userService);
    }

    /**
     * Renders security module content
     * @returns {string} Security form HTML
     */
    renderContent() {
        this.loadCurrentUser();

        return `
            <div class="settings-card">
                <div class="settings-card-header">
                    <div class="settings-card-icon">🔒</div>
                    <div>
                        <h3 class="settings-card-title">Segurança</h3>
                        <p class="settings-card-description">Informações de segurança da sua conta</p>
                    </div>
                </div>
                <div class="settings-form">
                    <div class="form-input-group">
                        <label for="securityEmail">
                            <span class="label-icon">📧</span>
                            E-mail
                        </label>
                        <input 
                            type="email" 
                            id="securityEmail" 
                            value="${this.currentUser?.email || ''}" 
                            readonly 
                            class="readonly-input"
                            title="O e-mail não pode ser alterado"
                        />
                        <small class="input-hint">O e-mail usado não pode ser alterado</small>
                    </div>

                    ${this.isEmailPasswordLogin() ? this.renderPasswordAndLinkForm() : this.renderGoogleNotice()}
                </div>
            </div>
        `;
    }

    /**
     * Renders password change form and Google link option (for email login)
     * @returns {string} Password form HTML
     */
    renderPasswordAndLinkForm() {
        const providers = this.currentUser?.providers || [];
        const hasGoogle = providers.includes('google');

        return `
            <div class="form-divider">
                <span>Alterar Senha</span>
            </div>

            <form id="passwordForm">
                <div class="form-row">
                    <div class="form-input-group">
                        <label for="newPassword">
                            <span class="label-icon">🔒</span>
                            Nova Senha
                        </label>
                        <div class="password-input-wrapper">
                            <input 
                                type="password" 
                                id="newPassword" 
                                placeholder="Mínimo 6 caracteres"
                                autocomplete="new-password"
                                required
                            />
                            <button type="button" class="toggle-password-btn" data-target="newPassword" title="Mostrar/Ocultar senha">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-input-group">
                        <label for="confirmPassword">
                            <span class="label-icon">🔒</span>
                            Confirmar Nova Senha
                        </label>
                        <div class="password-input-wrapper">
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                placeholder="Digite novamente"
                                autocomplete="new-password"
                                required
                            />
                            <button type="button" class="toggle-password-btn" data-target="confirmPassword" title="Mostrar/Ocultar senha">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-warning">
                        <span>🔒</span>
                        Atualizar Senha
                    </button>
                </div>
            </form>
            
            ${!hasGoogle ? this.renderGoogleLinkSection() : ''}
        `;
    }

    /**
     * Renders Google link section for password accounts
     * @returns {string} Google link HTML
     */
    renderGoogleLinkSection() {
        return `
            <div class="form-divider mt-lg">
                <span>Vincular Conta Google</span>
            </div>
            
            <div class="info-box info-box--blue">
                <p>
                    🔗 Vincule sua conta Google para poder fazer login com ambos os métodos (usuário/senha OU Google).
                </p>
            </div>
            
            <button type="button" id="linkGoogleBtn" class="btn-primary btn-full">
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                    <g fill="none" fill-rule="evenodd">
                        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </g>
                </svg>
                Vincular Conta Google
            </button>
        `;
    }

    /**
     * Renders notice for Google login
     * @returns {string} Notice HTML
     */
    renderGoogleNotice() {
        return `
            <div class="google-login-notice">
                <span class="notice-icon">🔐</span>
                <div class="notice-content">
                    <h4>Login via Google</h4>
                    <p>Sua conta utiliza autenticação do Google. Para fazer login, use o botão "Continuar com Google" na página inicial.</p>
                    <p style="margin-top: 0.5rem; color: #9ca3af; font-size: 0.875rem;">📌 Contas criadas com Google não podem usar login por usuário e senha.</p>
                </div>
            </div>
        `;
    }

    /**
     * Extracts data from password form
     * @returns {Object} Form data
     */
    getFormData() {
        return {
            newPassword: document.getElementById('newPassword')?.value || '',
            confirmPassword: document.getElementById('confirmPassword')?.value || ''
        };
    }

    /**
     * Validates password data
     * @param {Object} data - Data to validate
     * @returns {Object} {valid: boolean, message: string}
     */
    validateData(data) {
        if (!data.newPassword || !data.confirmPassword) {
            return {
                valid: false,
                message: 'Por favor, preencha todos os campos de senha.'
            };
        }

        if (data.newPassword.length < 6) {
            return {
                valid: false,
                message: 'A nova senha deve ter pelo menos 6 caracteres.'
            };
        }

        if (data.newPassword !== data.confirmPassword) {
            return {
                valid: false,
                message: 'A nova senha e a confirmação devem ser iguais.'
            };
        }

        return { valid: true };
    }

    /**
     * Handles password form submission
     * @param {Event} event - Submit event
     * @returns {Promise<void>}
     */
    async handleSubmit(event) {
        event.preventDefault();

        const data = this.getFormData();
        const validation = this.validateData(data);

        if (!validation.valid) {
            this.showValidation(validation.message);
            return;
        }

        try {
            this.showLoading('Atualizando...', 'Alterando sua senha');

            const result = await this.userService.updateUserPasswordDirect(data.newPassword);

            if (!result.success) {
                throw new Error(result.message || 'Erro ao atualizar senha');
            }

            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';

            await this.showSuccess(
                'Senha atualizada!',
                'Sua senha foi alterada com sucesso.'
            );
        } catch (error) {
            Logger.error('❌ Erro ao atualizar senha:', error);
            this.showError(
                'Erro ao atualizar',
                error.message || 'Não foi possível atualizar sua senha.'
            );
        }
    }

    /**
     * Handles Google account linking
     * @returns {Promise<void>}
     */
    async handleLinkGoogle() {
        try {
            this.showLoading('Vinculando...', 'Conectando sua conta Google');

            const result = await this.userService.linkGoogleAccount();

            if (!result.success) {
                throw new Error(result.message || 'Erro ao vincular conta Google');
            }

            await this.showSuccess(
                'Google vinculado!',
                'Agora você pode fazer login com Google ou usuário/senha.'
            );

            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            Logger.error('❌ Erro ao vincular Google:', error);
            this.showError(
                'Erro ao vincular',
                error.message || 'Não foi possível vincular sua conta Google.'
            );
        }
    }

    /**
     * Toggle password visibility
     * @param {string} inputId - Password field ID
     * @returns {void}
     */
    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    /**
     * Attaches module event listeners
     * @returns {void}
     */
    attachEventListeners() {
        const form = document.getElementById('passwordForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const linkGoogleBtn = document.getElementById('linkGoogleBtn');
        if (linkGoogleBtn) {
            linkGoogleBtn.addEventListener('click', () => this.handleLinkGoogle());
        }

        document.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                this.togglePasswordVisibility(targetId);
            });
        });
    }
}
