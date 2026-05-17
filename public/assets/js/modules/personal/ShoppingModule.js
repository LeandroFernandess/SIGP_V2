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
        this.expandedCategories = new Set();
        this.tempBulkItems = [];
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
                        <input type="number" id="shoppingQuantity"
                               placeholder="Ex: 2" inputmode="numeric" min="1" step="1">
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
                <div class="form-input-group shopping-bulk-builder" id="shoppingBulkBuilder">
                    <label>Montar lista em massa (opcional)</label>
                    <div class="shopping-bulk-add-row">
                        <input type="text" id="shoppingBulkItemName"
                               placeholder="Item (ex: Arroz)" maxlength="120">
                        <input type="number" id="shoppingBulkItemQuantity"
                               placeholder="Qtd" inputmode="numeric" min="1" step="1">
                        <button type="button" class="btn-add-bulk-item"
                                onclick="personalHandler.modules.shopping.addBulkItemToList()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Adicionar à lista
                        </button>
                    </div>
                    <div id="shoppingBulkList" class="shopping-bulk-list"></div>
                    <small class="form-hint">
                        Vá montando a lista item a item. Quando estiver pronta, clique em "Salvar lista" e tudo será adicionado de uma vez na categoria selecionada acima.
                    </small>
                    <div class="shopping-bulk-actions">
                        <button type="button" class="btn-secondary"
                                onclick="personalHandler.modules.shopping.clearBulkList()">
                            Limpar lista
                        </button>
                        <button type="button" class="btn-primary"
                                onclick="personalHandler.modules.shopping.saveBulkItems()">
                            Salvar lista
                        </button>
                    </div>
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
        const rawQty = document.getElementById('shoppingQuantity').value || '';
        const cleanedQty = String(rawQty).replace(/\D/g, '');
        const parsedQty = parseInt(cleanedQty, 10);
        const quantity = (Number.isFinite(parsedQty) && parsedQty > 0)
            ? String(parsedQty)
            : '1';

        return {
            item: document.getElementById('shoppingItem').value.trim(),
            quantity,
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
        const legacyQty = String(item.quantity ?? '1');
        const numericMatch = legacyQty.match(/\d+/);
        document.getElementById('shoppingQuantity').value = numericMatch ? numericMatch[0] : '1';

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
                            <button class="btn-delete-category-all" onclick="event.stopPropagation(); personalHandler.modules.shopping.deleteCategory('${categoryName}')" title="Excluir toda a lista (${categoryTotal} item(ns))">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                    <line x1="4" y1="20" x2="20" y2="4"/>
                                </svg>
                            </button>
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

        this.expandedCategories.forEach(categoryId => {
            const categoryContent = document.getElementById(`category-${categoryId}`);
            if (!categoryContent) return;
            categoryContent.classList.add('open');
            const arrow = categoryContent.previousElementSibling?.querySelector('.category-arrow');
            if (arrow) arrow.classList.add('rotated');
        });
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
     * Toggles category expansion and persists the state in memory so the
     * accordion does not collapse on the next re-render.
     */
    toggleCategory(categoryId) {
        const categoryContent = document.getElementById(`category-${categoryId}`);
        const header = categoryContent?.previousElementSibling;
        const arrow = header?.querySelector('.category-arrow');

        if (categoryContent) categoryContent.classList.toggle('open');
        if (arrow) arrow.classList.toggle('rotated');

        if (this.expandedCategories.has(categoryId)) {
            this.expandedCategories.delete(categoryId);
        } else {
            this.expandedCategories.add(categoryId);
        }
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
     * Deletes ALL items from a category, regardless of purchased state.
     * Allows the user to remove a whole shopping list even when it's incomplete.
     */
    async deleteCategory(categoryName) {
        const categoryItems = this.items.filter(item => item.category === categoryName);

        if (categoryItems.length === 0) {
            this.showValidation('Categoria já está vazia');
            return;
        }

        const result = await Swal.fire({
            title: `Excluir lista "${categoryName}"?`,
            text: `Todos os ${categoryItems.length} item(ns) serão removidos, independente de estarem comprados ou não.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir tudo',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        if (!result.isConfirmed) return;

        for (const item of categoryItems) {
            await this.personalDataService.delete(this.moduleName, item.id);
        }

        const categoryId = categoryName.toLowerCase().replace(/\s/g, '-');
        this.expandedCategories.delete(categoryId);

        await this.loadAndRender();
        this.showSuccess(`Lista "${categoryName}" removida (${categoryItems.length} item(ns))`);
    }

    /* ============================================================================
       BULK BUILDER (item + quantity rows reviewed before saving)
       ============================================================================ */

    /**
     * Adds an item + quantity pair to the temporary bulk list. Mirrors the
     * topic builder used by TasksModule, but stores name and quantity
     * separately so the user can compose a structured shopping list.
     */
    addBulkItemToList() {
        if (!Array.isArray(this.tempBulkItems)) this.tempBulkItems = [];

        const nameInput = document.getElementById('shoppingBulkItemName');
        const qtyInput = document.getElementById('shoppingBulkItemQuantity');
        if (!nameInput) return;

        const itemName = (nameInput.value || '').trim();
        const rawQty = (qtyInput?.value || '').replace(/\D/g, '');
        const parsedQty = parseInt(rawQty, 10);
        const quantity = (Number.isFinite(parsedQty) && parsedQty > 0)
            ? String(parsedQty)
            : '1';

        if (!itemName) {
            this.showValidation('Informe o nome do item');
            return;
        }

        const duplicateInTemp = this.tempBulkItems.some(
            row => row.item.toLowerCase() === itemName.toLowerCase()
                && row.quantity === quantity
        );
        if (duplicateInTemp) {
            this.showValidation('Esse item já está na lista temporária');
            return;
        }

        this.tempBulkItems.push({
            id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            item: itemName,
            quantity
        });

        nameInput.value = '';
        if (qtyInput) qtyInput.value = '';
        this.renderBulkItemsList();
        nameInput.focus();
    }

    /**
     * Removes one row from the temporary bulk list.
     * @param {string} rowId
     */
    removeBulkItemFromList(rowId) {
        if (!Array.isArray(this.tempBulkItems)) this.tempBulkItems = [];
        this.tempBulkItems = this.tempBulkItems.filter(row => row.id !== rowId);
        this.renderBulkItemsList();
    }

    /**
     * Renders the preview tags showing all rows pending in the temporary list.
     */
    renderBulkItemsList() {
        if (!Array.isArray(this.tempBulkItems)) this.tempBulkItems = [];

        const container = document.getElementById('shoppingBulkList');
        if (!container) return;

        if (this.tempBulkItems.length === 0) {
            container.innerHTML = '<p class="shopping-bulk-empty">Nenhum item adicionado à lista ainda</p>';
            return;
        }

        container.innerHTML = this.tempBulkItems.map(row => {
            const safeItem = DataGuard.escapeHtml(row.item);
            const safeQty = DataGuard.escapeHtml(row.quantity);
            return `
                <div class="shopping-bulk-tag">
                    <span class="shopping-bulk-tag-text">
                        <strong>${safeItem}</strong>
                        <span class="shopping-bulk-tag-qty">× ${safeQty}</span>
                    </span>
                    <button type="button" class="shopping-bulk-remove"
                            onclick="personalHandler.modules.shopping.removeBulkItemFromList('${row.id}')"
                            title="Remover item da lista">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * Wires Enter-key shortcuts on the builder inputs:
     *  - Enter in the item input: jumps focus to quantity (if empty) or adds.
     *  - Enter in the quantity input: adds the current pair to the list.
     */
    setupBulkItemInputListeners() {
        const nameInput = document.getElementById('shoppingBulkItemName');
        const qtyInput = document.getElementById('shoppingBulkItemQuantity');

        if (nameInput && !nameInput.dataset.bulkListenerAttached) {
            nameInput.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (qtyInput && !qtyInput.value.trim()) {
                    qtyInput.focus();
                } else {
                    this.addBulkItemToList();
                }
            });
            nameInput.dataset.bulkListenerAttached = '1';
        }

        if (qtyInput && !qtyInput.dataset.bulkListenerAttached) {
            qtyInput.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                this.addBulkItemToList();
            });
            qtyInput.addEventListener('input', () => {
                const cleaned = qtyInput.value.replace(/\D/g, '');
                if (cleaned !== qtyInput.value) qtyInput.value = cleaned;
            });
            qtyInput.dataset.bulkListenerAttached = '1';
        }
    }

    /**
     * Discards all rows from the temporary bulk list (does not touch Firestore).
     */
    clearBulkList() {
        if (!Array.isArray(this.tempBulkItems)) this.tempBulkItems = [];
        if (this.tempBulkItems.length === 0) return;
        this.tempBulkItems = [];
        this.renderBulkItemsList();
    }

    /**
     * Persists every row of the temporary bulk list into the currently
     * selected category, then resets the builder UI and keeps the category
     * expanded so the user can see the result.
     */
    async saveBulkItems() {
        if (!Array.isArray(this.tempBulkItems)) this.tempBulkItems = [];

        const categorySelect = document.getElementById('shoppingCategory');
        if (!categorySelect) return;

        if (this.tempBulkItems.length === 0) {
            this.showValidation('Adicione ao menos um item à lista antes de salvar');
            return;
        }

        const category = categorySelect.value;
        const total = this.tempBulkItems.length;

        try {
            for (const row of this.tempBulkItems) {
                await this.personalDataService.add(this.moduleName, {
                    item: row.item,
                    quantity: row.quantity || '1',
                    category,
                    purchased: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            this.tempBulkItems = [];
            this.renderBulkItemsList();

            const categoryId = category.toLowerCase().replace(/\s/g, '-');
            this.expandedCategories.add(categoryId);

            this.cancelForm();
            await this.loadAndRender();
            this.showSuccess(`${total} item(ns) adicionado(s) em "${category}"`);
        } catch (err) {
            Logger.error('Erro ao salvar lista em massa:', err);
            this.showError('Erro ao salvar a lista');
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
        const categorySelect = document.getElementById('shoppingCategory');
        if (categorySelect) categorySelect.value = 'Alimentos';
        const title = document.getElementById('shoppingFormTitle');
        if (title) title.textContent = 'Adicionar Item';

       this.tempBulkItems = [];
        this.renderBulkItemsList();
    }

    /**
     * Hook into showForm to attach the bulk builder keyboard shortcuts and
     * paint the initial empty-state placeholder for the preview list.
     */
    showForm() {
        super.showForm();
        setTimeout(() => {
            this.renderBulkItemsList();
            this.setupBulkItemInputListeners();
        }, 50);
    }
}
