/**
 * @file ProfileModule.js
 * @description User personal profile settings management.
 * 
 * Contents:
 * - Editable fields (name, birthDate, phone)
 * - Read-only field (username - SIGP000 format)
 * - Firebase Firestore update
 * - SessionStorage synchronization
 * 
 * Extends: BaseSettingsModule
 * 
 * Dependencies:
 * - UserService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ProfileModule
 * @extends BaseSettingsModule
 * @description Manages personal profile settings
 */
class ProfileModule extends BaseSettingsModule {

    /**
     * Initializes the profile module
     * 
     * @constructor
     * @param {UserService} userService - User service
     * 
     * @example
     * const module = new ProfileModule(userService);
     */
    constructor(userService) {
        super('profile', userService);
    }

    /**
     * Renders profile module content
     * @returns {string} Profile form HTML
     */
    renderContent() {
        this.loadCurrentUser();
        
        return `
            <div class="settings-card">
                <div class="settings-card-header">
                    <div class="settings-card-icon">👤</div>
                    <div>
                        <h3 class="settings-card-title">Perfil Pessoal</h3>
                        <p class="settings-card-description">Atualize suas informações pessoais</p>
                    </div>
                </div>
                <form id="profileForm" class="settings-form">
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="profileName">
                                <span class="label-icon">👤</span>
                                Nome Completo
                            </label>
                            <input 
                                type="text" 
                                id="profileName" 
                                value="${this.currentUser?.name || ''}" 
                                placeholder="Digite seu nome completo"
                                required 
                            />
                        </div>
                        <div class="form-input-group">
                            <label for="profileUsername">
                                <span class="label-icon">🆔</span>
                                Usuário
                            </label>
                            <input 
                                type="text" 
                                id="profileUsername" 
                                value="${this.currentUser?.username || ''}" 
                                placeholder="Seu identificador único"
                                readonly 
                                class="readonly-input"
                                title="O nome de usuário não pode ser alterado"
                            />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="profileBirth">
                                <span class="label-icon">🎂</span>
                                Data de Nascimento
                            </label>
                            <input 
                                type="date" 
                                id="profileBirth" 
                                value="${this.currentUser?.birthDate || ''}" 
                            />
                        </div>
                        <div class="form-input-group">
                            <label for="profilePhone">
                                <span class="label-icon">📱</span>
                                Telefone
                            </label>
                            <input 
                                type="tel" 
                                id="profilePhone" 
                                value="${this.currentUser?.phone || ''}" 
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <span>💾</span>
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Extracts profile form data
     * @returns {Object} Form data
     */
    getFormData() {
        return {
            name: document.getElementById('profileName').value.trim(),
            birthDate: document.getElementById('profileBirth').value,
            phone: document.getElementById('profilePhone').value.trim()
        };
    }

    /**
     * Validates profile data
     * @param {Object} data - Data to validate
     * @returns {Object} {valid: boolean, message: string}
     */
    validateData(data) {
        if (!data.name || data.name.length === 0) {
            return {
                valid: false,
                message: 'Por favor, preencha o nome completo.'
            };
        }

        if (data.name.length < 3) {
            return {
                valid: false,
                message: 'O nome deve ter pelo menos 3 caracteres.'
            };
        }

        return { valid: true };
    }

    /**
     * Handles profile form submission
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
            this.showLoading('Salvando...', 'Atualizando suas informações');

            const result = await this.userService.updateUserProfile(
                this.currentUser.id,
                data
            );

            if (result.success) {
                this.updateSessionUser(data);

                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = data.name;
                }

                await this.showSuccess(
                    'Perfil atualizado!',
                    'Suas informações foram salvas com sucesso.'
                );
            } else {
                throw new Error(result.message || 'Erro ao atualizar perfil');
            }
        } catch (error) {
            Logger.error('❌ Erro ao salvar perfil:', error);
            this.showError(
                'Erro ao salvar',
                error.message || 'Não foi possível atualizar seu perfil. Tente novamente.'
            );
        }
    }

    /**
     * Attaches module event listeners
     * @returns {void}
     */
    attachEventListeners() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }
}
