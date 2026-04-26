/**
 * @file ShoppingModule.js
 * @description Shopping list module with categorization.
 * 
 * Contents:
 * - Item CRUD with purchase checkbox
 * - 9 categories with emojis
 * - Statistics (total, purchased, pending)
 * - Category grouping with expand/collapse
 * 
 * Extends: BasePersonalModule
 * 
 * Dependencies:
 * - PersonalDataService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ShoppingModule
 * @description Manages a categorized shopping list (extends BasePersonalModule)
 */
class ShoppingModule extends BasePersonalModule {

    /**
     * Initializes the shopping list module
     * 
     * @constructor
     * @param {PersonalDataService} personalDataService - Persistence service
     * 
     * @example
     * const module = new ShoppingModule(personalDataService);
     */
    constructor(personalDataService) {
        super(personalDataService, 'shopping');
    }

    /**
     * Renders the main module HTML structure
     */
    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnShopping" onclick="personalHandler.modules.shopping.showForm()">
                        + Novo Item
                    </button>
                </div>

                ${this.renderForm()}
                ${this.renderSummary()}

                <div id="shoppingList" class="shopping-categories"></div>
            </div>
        `;
    }

    /**
     * Renders the shopping item form HTML
     */
    renderForm() {
        return `
            <div id="shoppingForm" class="personal-form">
                <h4 id="shoppingFormTitle">Adicionar Item</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Item *</label>
                        <input type="text" id="shoppingItem" placeholder="Ex: Arroz">
                    </div>
                    <div class="form-input-group">
                        <label>Quantidade</label>
                        <input type="text" id="shoppingQuantity" placeholder="Ex: 2 pacotes">
                    </div>
                </div>
                <div class="form-input-group">
                    <label>Categoria *</label>
                    <select id="shoppingCategory">
                        <option value="Alimentos">🍎 Alimentos</option>
                        <option value="Limpeza">🧹 Limpeza</option>
                        <option value="Higiene">🧴 Higiene</option>
                        <option value="Bebidas">🥤 Bebidas</option>
                        <option value="Animais">🐶 Animais</option>
                        <option value="Eletrônicos">📱 Eletrônicos</option>
                        <option value="Vestuário">👕 Vestuário</option>
                        <option value="Farmácia">💊 Farmácia</option>
                        <option value="Outros">📦 Outros</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.shopping.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.shopping.save()">Adicionar Item</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders the summary statistics section
     */
    renderSummary() {
        return `
            <div class="shopping-summary">
                <div class="summary-item">
                    <span>Total de Itens:</span>
                    <strong id="shoppingTotalItems">0</strong>
                </div>
                <div class="summary-item">
                    <span>Comprados:</span>
                    <strong id="shoppingCompleted">0</strong>
                </div>
                <div class="summary-item">
                    <span>Restantes:</span>
                    <strong id="shoppingPending">0</strong>
                </div>
            </div>
        `;
    }

    /**
     * Renders a single shopping item
     */
    renderItem(item) {
        const actions = HTMLTemplates.buttons.actionGroup({
            onEdit: `personalHandler.modules.shopping.edit('${item.id}')`,
            onDelete: `personalHandler.modules.shopping.delete('${item.id}')`
        }, true);

        return `
            <div class="shopping-item ${item.purchased ? 'completed' : ''}">
                <div class="item-checkbox">
                    <input type="checkbox" ${item.purchased ? 'checked' : ''} 
                           onchange="personalHandler.modules.shopping.togglePurchased('${item.id}')">
                </div>
                <div class="shopping-item-content">
                    <span class="shopping-item-name">${item.item}</span>
                    <span class="shopping-item-quantity">${item.quantity || '1'}</span>
                </div>
                <div class="shopping-item-actions">
                    ${HTMLTemplates.buttons.editSmall(`personalHandler.modules.shopping.edit('${item.id}')`)}
                    ${HTMLTemplates.buttons.deleteSmall(`personalHandler.modules.shopping.delete('${item.id}')`)}
                </div>
            </div>
        `;
    }

    /**
     * Validates form data before saving
     */
    validateForm(data) {
        if (!data.item || data.item.trim() === '') {
            this.showValidation('Por favor, preencha o nome do item');
            return false;
        }
        return true;
    }

    /**
     * Extracts and returns form data
     */
    getFormData() {
        return {
            item: document.getElementById('shoppingItem').value.trim(),
            quantity: document.getElementById('shoppingQuantity').value.trim() || '1',
            category: document.getElementById('shoppingCategory').value,
            purchased: this.editingId ? (this.items.find(i => i.id === this.editingId)?.purchased || false) : false
        };
    }

    /**
     * Fills form with existing item data for editing
     */
    fillForm(item) {
        document.getElementById('shoppingFormTitle').textContent = 'Editar Item';
        document.getElementById('shoppingItem').value = item.item;
        document.getElementById('shoppingQuantity').value = item.quantity || '1';
        document.getElementById('shoppingCategory').value = item.category;
    }

    /* ============================================================================
       MODULE SPECIFIC METHODS
       ============================================================================ */

    /**
     * Renders list grouped by categories
     */
    renderList() {
        this.updateSummary();

        const container = document.getElementById('shoppingList');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const categories = {
            'Alimentos': { icon: '🍎', items: [] },
            'Limpeza': { icon: '🧹', items: [] },
            'Higiene': { icon: '🧴', items: [] },
            'Bebidas': { icon: '🥤', items: [] },
            'Animais': { icon: '🐶', items: [] },
            'Eletrônicos': { icon: '📱', items: [] },
            'Vestuário': { icon: '👕', items: [] },
            'Farmácia': { icon: '💊', items: [] },
            'Outros': { icon: '📦', items: [] }
        };

        this.items.forEach(item => {
            if (categories[item.category]) {
                categories[item.category].items.push(item);
            }
        });

        let html = '';
        for (const [categoryName, categoryData] of Object.entries(categories)) {
            if (categoryData.items.length > 0) {
                const categoryId = categoryName.toLowerCase().replace(/\s/g, '-');
                const categoryTotal = categoryData.items.length;
                const categoryCompleted = categoryData.items.filter(i => i.purchased).length;
                const categoryPending = categoryTotal - categoryCompleted;

                html += `
                <div class="shopping-category">
                    <div class="category-header" onclick="personalHandler.modules.shopping.toggleCategory('${categoryId}')">
                        <div class="category-info">
                            <span class="category-icon">${categoryData.icon}</span>
                            <h4>${categoryName}</h4>
                            <span class="category-count">${categoryCompleted}/${categoryTotal} itens</span>
                        </div>
                        <div class="category-actions">
                            <button class="btn-complete-category" onclick="event.stopPropagation(); personalHandler.modules.shopping.toggleCategoryComplete('${categoryName}')" title="Marcar/desmarcar categoria">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </button>
                            ${categoryPending > 0 ? `
                            <button class="btn-delete-category" onclick="event.stopPropagation(); personalHandler.modules.shopping.deletePendingCategory('${categoryName}')" title="Excluir ${categoryPending} pendente(s)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                            </button>
                            ` : ''}
                            <span class="category-arrow">▼</span>
                        </div>
                    </div>
                    <div class="category-items" id="category-${categoryId}">
                        ${categoryData.items.map(item => this.renderItem(item)).join('')}
                    </div>
                </div>
                `;
            }
        }

        container.innerHTML = html;
    }

    /**
     * Updates statistics summary
     */
    updateSummary() {
        const total = this.items.length;
        const completed = this.items.filter(item => item.purchased).length;
        const pending = total - completed;

        document.getElementById('shoppingTotalItems').textContent = total;
        document.getElementById('shoppingCompleted').textContent = completed;
        document.getElementById('shoppingPending').textContent = pending;
    }

    /**
     * Toggles purchased state
     */
    async togglePurchased(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        item.purchased = !item.purchased;
        await this.personalDataService.update(this.moduleName, itemId, item);
        await this.loadAndRender();
    }

    /**
     * Toggles category expansion
     */
    toggleCategory(categoryId) {
        const categoryContent = document.getElementById(`category-${categoryId}`);
        const header = categoryContent?.previousElementSibling;
        const arrow = header?.querySelector('.category-arrow');

        if (categoryContent) categoryContent.classList.toggle('open');
        if (arrow) arrow.classList.toggle('rotated');
    }

    /**
     * Marks/unmarks entire category
     */
    async toggleCategoryComplete(categoryName) {
        const categoryItems = this.items.filter(item => item.category === categoryName);
        if (categoryItems.length === 0) return;

        const allPurchased = categoryItems.every(item => item.purchased);

        for (const item of categoryItems) {
            item.purchased = !allPurchased;
            await this.personalDataService.update(this.moduleName, item.id, item);
        }

        await this.loadAndRender();
        this.showSuccess(allPurchased ? 'Categoria desmarcada!' : 'Categoria comprada!');
    }

    /**
     * Deletes all pending items from a category
     */
    async deletePendingCategory(categoryName) {
        const pendingItems = this.items.filter(item => item.category === categoryName && !item.purchased);

        if (pendingItems.length === 0) {
            this.showValidation('Não há itens pendentes nesta categoria');
            return;
        }

        const result = await Swal.fire({
            title: `Excluir ${pendingItems.length} item(ns)?`,
            text: `Todos os itens NÃO comprados da categoria "${categoryName}" serão excluídos`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            for (const item of pendingItems) {
                await this.personalDataService.delete(this.moduleName, item.id);
            }
            await this.loadAndRender();
            this.showSuccess(`${pendingItems.length} item(ns) removido(s)`);
        }
    }

    /**
     * Renders empty state when no items exist
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">🛒</span>
                <p>Lista de compras vazia</p>
                <small>Clique em "Novo Item" para começar</small>
            </div>
        `;
    }

    /**
     * Clears and resets the form to default state
     */
    clearForm() {
        super.clearForm();
        document.getElementById('shoppingCategory').value = 'Alimentos';
        document.getElementById('shoppingFormTitle').textContent = 'Adicionar Item';
    }
}
