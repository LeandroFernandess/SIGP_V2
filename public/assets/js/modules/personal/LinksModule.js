/**
 * @file LinksModule.js
 * @description Favorite links management with categories.
 * 
 * Contents:
 * - Link CRUD operations
 * - 8 categories with emojis
 * - Open in new tab functionality
 * - Grid layout visualization
 * 
 * Extends: BasePersonalModule
 * 
 * Dependencies:
 * - PersonalDataService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

class LinksModule extends BasePersonalModule {

    /**
     * Initializes the links module
     * 
     * @constructor
     * @param {PersonalDataService} personalDataService - Persistence service
     * 
     * @example
     * const module = new LinksModule(personalDataService);
     */
    constructor(personalDataService) {
        super(personalDataService, 'links');
        this.currentFilter = 'all';
    }

    /**
     * Renders the main module HTML structure
     */
    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnLinks" onclick="personalHandler.modules.links.showForm()">
                        + Novo Link
                    </button>
                </div>

                ${this.renderForm()}
                <div id="linksFiltersContainer"></div>

                <div id="linksList" class="links-grid"></div>
            </div>
        `;
    }

    /**
     * Renders the link form HTML
     */
    renderForm() {
        return `
            <div id="linksForm" class="personal-form">
                <h4 id="linksFormTitle">Adicionar Novo Link</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Título *</label>
                        <input type="text" id="linkTitle" placeholder="Ex: GitHub">
                    </div>
                    <div class="form-input-group">
                        <label>URL *</label>
                        <input type="url" id="linkUrl" placeholder="https://github.com">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Categoria *</label>
                        <select id="linkCategory">
                            <option value="Estudos">📚 Estudos</option>
                            <option value="Compras">🛒 Compras</option>
                            <option value="Utilitários">🔧 Utilitários</option>
                            <option value="Vídeos">🎬 Vídeos</option>
                            <option value="Trabalho">💼 Trabalho</option>
                            <option value="Social">👥 Social</option>
                            <option value="Entretenimento">🎮 Entretenimento</option>
                            <option value="Outros">💬 Outros</option>
                        </select>
                    </div>
                    <div class="form-input-group">
                        <label>Descrição</label>
                        <input type="text" id="linkDescription" placeholder="Descrição do link">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.links.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.links.save()">Salvar Link</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders the category filters
     */
    renderFilters() {
        const categories = [
            { id: 'Estudos', emoji: '📚' },
            { id: 'Compras', emoji: '🛒' },
            { id: 'Utilitários', emoji: '🔧' },
            { id: 'Vídeos', emoji: '🎬' },
            { id: 'Trabalho', emoji: '💼' },
            { id: 'Social', emoji: '👥' },
            { id: 'Entretenimento', emoji: '🎮' },
            { id: 'Outros', emoji: '💬' }
        ];

        const categoriesWithLinks = categories.filter(cat => 
            this.items.some(link => link.category === cat.id)
        );

        let filtersHTML = `
            <div class="link-filters">
                <button class="filter-btn active" data-filter="all" onclick="personalHandler.modules.links.filterByCategory('all')">
                    Todos (<span id="countAll">0</span>)
                </button>
        `;

        categoriesWithLinks.forEach(cat => {
            filtersHTML += `
                <button class="filter-btn" data-filter="${cat.id}" onclick="personalHandler.modules.links.filterByCategory('${cat.id}')">
                    ${cat.emoji} ${cat.id} (<span id="count${cat.id.replace(/\s/g, '')}">0</span>)
                </button>
            `;
        });

        filtersHTML += `</div>`;
        return filtersHTML;
    }

    /**
     * Renders a single link card
     */
    renderItem(link) {
        const categoryIcons = {
            'Estudos': '📚', 'Compras': '🛒', 'Utilitários': '🔧',
            'Vídeos': '🎬', 'Trabalho': '💼', 'Social': '👥',
            'Entretenimento': '🎮', 'Outros': '💬'
        };

        const emoji = categoryIcons[link.category] || '🔗';

        return `
            <div class="link-card">
                <div class="link-icon">${emoji}</div>
                <h4>${link.title}</h4>
                <p class="link-description">${link.description || link.url}</p>
                <span class="link-category">${link.category}</span>
                <div class="link-actions">
                    <a href="${link.url}" target="_blank" class="btn-open" title="Abrir link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                    </a>
                    <button class="btn-edit-small" onclick="personalHandler.modules.links.edit('${link.id}')" title="Editar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete-small" onclick="personalHandler.modules.links.delete('${link.id}')" title="Excluir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        if (!data.title || data.title.trim() === '') {
            this.showValidation('Por favor, preencha o título do link');
            return false;
        }
        if (!data.url || data.url.trim() === '') {
            this.showValidation('Por favor, preencha a URL do link');
            return false;
        }
        return true;
    }

    /**
     * Extracts and returns form data
     */
    getFormData() {
        return {
            title: document.getElementById('linkTitle').value.trim(),
            url: document.getElementById('linkUrl').value.trim(),
            category: document.getElementById('linkCategory').value,
            description: document.getElementById('linkDescription').value.trim()
        };
    }

    /**
     * Fills form with existing link data for editing
     */
    fillForm(link) {
        document.getElementById('linksFormTitle').textContent = 'Editar Link';
        document.getElementById('linkTitle').value = link.title;
        document.getElementById('linkUrl').value = link.url;
        document.getElementById('linkCategory').value = link.category || 'Estudos';
        document.getElementById('linkDescription').value = link.description || '';
    }

    /**
     * Renders empty state when no links exist
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">🔗</span>
                <p>Nenhum link cadastrado</p>
                <small>Clique em "Novo Link" para começar</small>
            </div>
        `;
    }

    /**
     * Clears and resets the form to default state
     */
    clearForm() {
        super.clearForm();
        document.getElementById('linkCategory').value = 'Estudos';
        document.getElementById('linksFormTitle').textContent = 'Adicionar Novo Link';
    }

    /**
     * Filters links by category
     */
    async filterByCategory(category) {
        this.currentFilter = category;

        document.querySelectorAll('.link-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.link-filters [data-filter="${category}"]`)?.classList.add('active');

        this.renderList();
    }

    /**
     * Renders the links list with filters
     */
    renderList() {
        const container = document.getElementById('linksList');
        const filtersContainer = document.getElementById('linksFiltersContainer');
        
        if (!container) return;

        if (filtersContainer) {
            if (this.items.length > 0) {
                filtersContainer.innerHTML = this.renderFilters();
            } else {
                filtersContainer.innerHTML = '';
            }
        }

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        let filteredItems = this.items;
        if (this.currentFilter !== 'all') {
            filteredItems = this.items.filter(link => link.category === this.currentFilter);
        }

        this.updateFilterCounts();

        if (filteredItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p>Nenhum link nesta categoria</p>
                    <small>Selecione outra categoria ou adicione um novo link</small>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredItems.map(link => this.renderItem(link)).join('');
    }

    /**
     * Updates filter counts
     */
    updateFilterCounts() {
        const categories = ['Estudos', 'Compras', 'Utilitários', 'Vídeos', 'Trabalho', 'Social', 'Entretenimento', 'Outros'];
        
        const countAll = document.getElementById('countAll');
        if (countAll) countAll.textContent = this.items.length;

        categories.forEach(category => {
            const count = this.items.filter(link => link.category === category).length;
            const countEl = document.getElementById(`count${category.replace(/\s/g, '')}`);
            if (countEl) countEl.textContent = count;
        });
    }
}
