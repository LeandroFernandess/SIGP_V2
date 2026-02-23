/**
 * @file PasswordsModule.js
 * @description Secure password and credentials management.
 * 
 * Contents:
 * - Credential CRUD (service, username, password)
 * - 6 categories (Email, Social, Work, Bank, Streaming, Others)
 * - Visibility toggle (show/hide password)
 * - Copy to clipboard functionality
 * 
 * Extends: BasePersonalModule
 * 
 * Dependencies:
 * - PersonalDataService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

class PasswordsModule extends BasePersonalModule {

    /**
     * Initializes the passwords module
     * 
     * @constructor
     * @param {PersonalDataService} personalDataService - Persistence service
     * 
     * @example
     * const module = new PasswordsModule(personalDataService);
     */
    constructor(personalDataService) {
        super(personalDataService, 'passwords');
    }

    /**
     * Renders the main module HTML structure
     */
    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnPasswords" onclick="personalHandler.modules.passwords.showForm()">
                        + Nova Senha
                    </button>
                </div>

                ${this.renderForm()}

                <div id="passwordsList" class="items-list"></div>
            </div>
        `;
    }

    /**
     * Renders the password form HTML
     */
    renderForm() {
        return `
            <div id="passwordsForm" class="personal-form">
                <h4 id="passwordsFormTitle">
                    Adicionar Nova Credencial
                    <button class="btn-focus-mode" onclick="personalHandler.modules.passwords.toggleFocusMode()" title="Modo Foco">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                        </svg>
                        Expandir
                    </button>
                </h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Serviço/Site *</label>
                        <input type="text" id="passwordService" placeholder="Ex: Gmail, Netflix">
                    </div>
                    <div class="form-input-group">
                        <label>Categoria</label>
                        <select id="passwordCategory">
                            <option value="Email">📧 Email</option>
                            <option value="Redes Sociais">👥 Redes Sociais</option>
                            <option value="Trabalho">💼 Trabalho</option>
                            <option value="Banco">🏦 Banco</option>
                            <option value="Streaming">🎬 Streaming</option>
                            <option value="Outros">📁 Outros</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Usuário/Email *</label>
                        <input type="text" id="passwordUsername" placeholder="usuario@email.com">
                    </div>
                    <div class="form-input-group">
                        <label>Senha *</label>
                        <div class="password-input-group">
                            <input type="password" id="passwordPassword" placeholder="••••••••">
                            <button type="button" class="btn-toggle-password" onclick="personalHandler.modules.passwords.toggleVisibility('passwordPassword')">
                                👁️
                            </button>
                        </div>
                    </div>
                </div>
                <div class="form-input-group">
                    <label>URL (opcional)</label>
                    <input type="url" id="passwordUrl" placeholder="https://site.com">
                </div>
                <div class="form-input-group">
                    <label>Notas (opcional)</label>
                    <textarea id="passwordNotes" rows="2" placeholder="Informações adicionais..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.passwords.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.passwords.save()">Salvar Credencial</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders a single password item card
     */
    renderItem(pwd) {
        const categoryIcons = {
            'Email': '📧', 'Redes Sociais': '👥', 'Trabalho': '💼',
            'Banco': '🏦', 'Streaming': '🎬', 'Outros': '📁'
        };

        const decodedPassword = atob(pwd.password);

        return `
            <div class="item-card password-item">
                <div class="item-content">
                    <h4>${categoryIcons[pwd.category] || '🔐'} ${pwd.service}</h4>
                    <div class="item-meta">
                        <span class="item-badge">${pwd.category}</span>
                        <span class="item-detail">👤 ${pwd.username}</span>
                    </div>
                    <div class="password-reveal">
                        <input type="password" value="${decodedPassword}" readonly id="pwd_${pwd.id}">
                        <button class="btn-reveal" onclick="personalHandler.modules.passwords.toggleVisibility('pwd_${pwd.id}')" title="Mostrar senha">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="btn-copy" onclick="personalHandler.modules.passwords.copyPassword('${decodedPassword}')" title="Copiar senha">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                    ${pwd.url ? `<a href="${pwd.url}" target="_blank" class="password-url">🔗 ${pwd.url}</a>` : ''}
                    ${pwd.notes ? `<p class="item-description">${pwd.notes}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="personalHandler.modules.passwords.edit('${pwd.id}')" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete" onclick="personalHandler.modules.passwords.delete('${pwd.id}')" title="Excluir">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Validates form data before saving
     */
    validateForm(data) {
        if (!data.service || data.service.trim() === '') {
            this.showValidation('Por favor, preencha o nome do serviço');
            return false;
        }
        if (!data.username || data.username.trim() === '') {
            this.showValidation('Por favor, preencha o usuário');
            return false;
        }
        if (!data.password || data.password.trim() === '') {
            this.showValidation('Por favor, preencha a senha');
            return false;
        }
        return true;
    }

    /**
     * Extracts and returns form data
     */
    getFormData() {
        const password = document.getElementById('passwordPassword').value;

        return {
            service: document.getElementById('passwordService').value.trim(),
            category: document.getElementById('passwordCategory').value,
            username: document.getElementById('passwordUsername').value.trim(),
            password: btoa(password),
            url: document.getElementById('passwordUrl').value.trim(),
            notes: document.getElementById('passwordNotes').value.trim()
        };
    }

    /**
     * Fills form with existing password data for editing
     */
    fillForm(pwd) {
        document.getElementById('passwordsFormTitle').textContent = 'Editar Credencial';
        document.getElementById('passwordService').value = pwd.service;
        document.getElementById('passwordCategory').value = pwd.category;
        document.getElementById('passwordUsername').value = pwd.username;
        document.getElementById('passwordPassword').value = atob(pwd.password);
        document.getElementById('passwordUrl').value = pwd.url || '';
        document.getElementById('passwordNotes').value = pwd.notes || '';
    }


    /**
     * Renders list grouped by categories
     */
    renderList() {
        const container = document.getElementById('passwordsList');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const categories = {
            'Email': { icon: '📧', items: [] },
            'Redes Sociais': { icon: '👥', items: [] },
            'Trabalho': { icon: '💼', items: [] },
            'Banco': { icon: '🏦', items: [] },
            'Streaming': { icon: '🎬', items: [] },
            'Outros': { icon: '📁', items: [] }
        };

        this.items.forEach(pwd => {
            if (categories[pwd.category]) {
                categories[pwd.category].items.push(pwd);
            }
        });

        let html = '';
        for (const [categoryName, categoryData] of Object.entries(categories)) {
            if (categoryData.items.length > 0) {
                const categoryId = categoryName.toLowerCase().replace(/\s/g, '-');
                const categoryTotal = categoryData.items.length;

                html += `
                <div class="password-category">
                    <div class="category-header" onclick="personalHandler.modules.passwords.toggleCategory('${categoryId}')">
                        <div class="category-info">
                            <span class="category-icon">${categoryData.icon}</span>
                            <h4>${categoryName}</h4>
                            <span class="category-count">${categoryTotal} ${categoryTotal === 1 ? 'senha' : 'senhas'}</span>
                        </div>
                        <span class="category-arrow">▼</span>
                    </div>
                    <div class="category-items" id="password-category-${categoryId}">
                        ${categoryData.items.map(pwd => this.renderItem(pwd)).join('')}
                    </div>
                </div>
                `;
            }
        }

        container.innerHTML = html;
    }

    /**
     * Toggles password visibility
     */
    toggleVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    /**
     * Copies password to clipboard
     */
    copyPassword(password) {
        navigator.clipboard.writeText(password).then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Copiado!',
                text: 'Senha copiada para a área de transferência',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }).catch(err => {
            Logger.error('Erro ao copiar:', err);
            this.showError('Não foi possível copiar a senha');
        });
    }

    /**
     * Toggles category expansion
     */
    toggleCategory(categoryId) {
        const categoryContent = document.getElementById(`password-category-${categoryId}`);
        const header = categoryContent?.previousElementSibling;
        const arrow = header?.querySelector('.category-arrow');

        if (categoryContent) {
            categoryContent.classList.toggle('open');
        }
        if (arrow) {
            arrow.classList.toggle('rotated');
        }
    }

    /**
     * Renders empty state when no passwords exist
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">🔐</span>
                <p>Nenhuma senha cadastrada</p>
                <small>Clique em "Nova Senha" para começar</small>
            </div>
        `;
    }

    /**
     * Clears and resets the form to default state
     */
    clearForm() {
        super.clearForm();
        document.getElementById('passwordCategory').value = 'Email';
        document.getElementById('passwordsFormTitle').textContent = 'Adicionar Nova Credencial';
    }
}
