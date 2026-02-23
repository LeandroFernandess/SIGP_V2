/**
 * @file WishlistModule.js
 * @description Wishlist and goals module with prioritization.
 * 
 * Contents:
 * - Wish CRUD with estimated value
 * - 3 priority levels (Low, Medium, High)
 * - Achieved/not achieved status
 * - Grid layout with cards
 * - Report integration (total wishes)
 * 
 * Extends: BasePersonalModule
 * 
 * Dependencies:
 * - PersonalDataService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class WishlistModule
 * @description Manages a wishlist with priorities and achieved status (extends BasePersonalModule)
 */
class WishlistModule extends BasePersonalModule {

    /**
     * Initializes the wishlist module
     * 
     * @constructor
     * @param {PersonalDataService} personalDataService - Persistence service
     * 
     * @example
     * const module = new WishlistModule(personalDataService);
     */
    constructor(personalDataService) {
        super(personalDataService, 'wishlist');
    }

    /**
     * Renders the main module HTML structure
     */
    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnWishlist" onclick="personalHandler.modules.wishlist.showForm()">
                        + Novo Desejo
                    </button>
                </div>

                ${this.renderForm()}

                <div id="wishlistList" class="wishlist-grid"></div>
            </div>
        `;
    }

    /**
     * Renders the wishlist form HTML
     */
    renderForm() {
        return `
            <div id="wishlistForm" class="personal-form">
                <h4 id="wishlistFormTitle">Adicionar Desejo/Objetivo</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Título *</label>
                        <input type="text" id="wishTitle" placeholder="Ex: Comprar notebook novo">
                    </div>
                    <div class="form-input-group">
                        <label>Prioridade</label>
                        <select id="wishPriority">
                            <option value="1">⭐ Baixa</option>
                            <option value="2" selected>⭐⭐ Média</option>
                            <option value="3">⭐⭐⭐ Alta</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Valor Estimado (R$)</label>
                        <input type="number" id="wishPrice" placeholder="0.00" step="0.01">
                    </div>
                    <div class="form-input-group">
                        <label>Link do Produto</label>
                        <input type="url" id="wishLink" placeholder="https://loja.com/produto">
                    </div>
                </div>
                <div class="form-input-group">
                    <label>Descrição</label>
                    <textarea id="wishDescription" rows="3" placeholder="Detalhes sobre este desejo..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.wishlist.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.wishlist.save()">Salvar Desejo</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders a single wishlist card
     */
    renderItem(wish) {
        const stars = '⭐'.repeat(wish.priority);

        return `
            <div class="wish-card ${wish.achieved ? 'achieved' : ''}">
                <div class="wish-header">
                    <span class="wish-priority">${stars}</span>
                    <button class="btn-achieve" onclick="personalHandler.modules.wishlist.toggleAchieved('${wish.id}')" 
                            title="${wish.achieved ? 'Marcar como não alcançado' : 'Marcar como alcançado'}">
                        ${wish.achieved ? '✅' : '⭕'}
                    </button>
                </div>
                <h4>${wish.title}</h4>
                ${wish.description ? `<p class="wish-description">${wish.description}</p>` : ''}
                ${wish.link ? `<a href="${wish.link}" target="_blank" class="wish-link" title="Ver produto">🔗 Ver Produto</a>` : ''}
                <div class="wish-footer">
                    ${wish.price > 0 ? `<span class="wish-price">💰 R$ ${wish.price.toFixed(2).replace('.', ',')}</span>` : ''}
                </div>
                <div class="wish-actions">
                    <button class="btn-edit-wish" onclick="personalHandler.modules.wishlist.edit('${wish.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete-wish" onclick="personalHandler.modules.wishlist.delete('${wish.id}')">
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
        if (!data.title || data.title.trim() === '') {
            this.showValidation('Por favor, preencha o título do desejo');
            return false;
        }
        return true;
    }

    /**
     * Extracts and returns form data
     */
    getFormData() {
        return {
            title: document.getElementById('wishTitle').value.trim(),
            priority: parseInt(document.getElementById('wishPriority').value, 10),
            price: parseFloat(document.getElementById('wishPrice').value) || 0,
            link: document.getElementById('wishLink').value.trim(),
            description: document.getElementById('wishDescription').value.trim(),
            achieved: this.editingId ? (this.items.find(w => w.id === this.editingId)?.achieved || false) : false
        };
    }

    /**
     * Fills form with existing wish data for editing
     */
    fillForm(wish) {
        document.getElementById('wishlistFormTitle').textContent = 'Editar Desejo';
        document.getElementById('wishTitle').value = wish.title;
        document.getElementById('wishPriority').value = wish.priority;
        document.getElementById('wishPrice').value = wish.price || '';
        document.getElementById('wishLink').value = wish.link || '';
        document.getElementById('wishDescription').value = wish.description || '';
    }

    /**
     * Toggles achieved state
     */
    async toggleAchieved(wishId) {
        const wish = this.items.find(w => w.id === wishId);
        if (!wish) return;

        wish.achieved = !wish.achieved;
        await this.personalDataService.update(this.moduleName, wishId, wish);
        await this.loadAndRender();

        if (wish.achieved) {
            Swal.fire({
                icon: 'success',
                title: 'Parabéns! 🎉',
                text: 'Desejo alcançado!',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }
    }

    /**
     * Renders empty state when no wishes exist
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">⭐</span>
                <p>Nenhum desejo cadastrado</p>
                <small>Clique em "Novo Desejo" para começar</small>
            </div>
        `;
    }

    /**
     * Clears and resets the form to default state
     */
    clearForm() {
        super.clearForm();
        document.getElementById('wishPriority').value = '2';
        document.getElementById('wishlistFormTitle').textContent = 'Adicionar Desejo/Objetivo';
    }

    /**
     * Renders the items list in the container with priority sorting
     * Overrides base method to sort by priority (highest to lowest)
     */
    renderList() {
        const container = document.getElementById(`${this.moduleName}List`);
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const sortedItems = [...this.items].sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        container.innerHTML = sortedItems.map(item => this.renderItem(item)).join('');
    }
}
