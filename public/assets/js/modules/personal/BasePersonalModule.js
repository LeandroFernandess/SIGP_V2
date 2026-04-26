/**
 * @file BasePersonalModule.js
 * @description Abstract base class for personal area modules.
 * 
 * Contents:
 * - Template Method Pattern for CRUD
 * - Form management (add/edit modes)
 * - Centralized validation and error handling
 * - PersonalDataService integration
 * 
 * Subclasses:
 * - TasksModule, LinksModule, PasswordsModule
 * - ShoppingModule, WishlistModule
 * 
 * Dependencies:
 * - PersonalDataService (Firebase persistence)
 * - SweetAlert2 (user feedback)
 * 
 * @abstract
 * @author Leandro Fialho Fernandes
 */

/**
 * @class BasePersonalModule
 * @abstract
 * @description Abstract base class for personal area modules
 */
class BasePersonalModule {

    /**
     * Initializes the base module with service and name
     * 
     * @constructor
     * @param {PersonalDataService} personalDataService - Persistence service
     * @param {string} moduleName - Module name (tasks, links, passwords, shopping, wishlist)
     * @throws {TypeError} If trying to instantiate directly (abstract class)
     * 
     * @example
     * // Only in subclasses
     * super(personalDataService, 'tasks');
     */
    constructor(personalDataService, moduleName) {
        if (new.target === BasePersonalModule) {
            throw new TypeError('Cannot instantiate abstract class BasePersonalModule');
        }

        this.personalDataService = personalDataService;
        this.moduleName = moduleName;
        this.editingId = null;
        this.items = [];
    }

    /**
     * Renders the complete module HTML
     * @abstract
     * @returns {string} Module HTML
     */
    render() {
        throw new Error('Method render() must be implemented by subclass');
    }

    /**
     * Renders an individual module item
     * @abstract
     * @param {Object} item - Item to be rendered
     * @returns {string} Item HTML
     */
    renderItem(item) {
        throw new Error('Method renderItem() must be implemented by subclass');
    }

    /**
     * Validates form data before saving
     * @abstract
     * @param {Object} data - Data to be validated
     * @returns {boolean} True if valid, false otherwise
     */
    validateForm(data) {
        throw new Error('Method validateForm() must be implemented by subclass');
    }

    /**
     * Gets form data
     * @abstract
     * @returns {Object} Form data
     */
    getFormData() {
        throw new Error('Method getFormData() must be implemented by subclass');
    }

    /**
     * Fills the form with item data (for editing)
     * @abstract
     * @param {Object} item - Item whose data will be loaded into the form
     */
    fillForm(item) {
        throw new Error('Method fillForm() must be implemented by subclass');
    }

    /**
     * Loads all module items
     * @returns {Promise<Array>} Array of items
     */
    async loadItems() {
        try {
            this.items = await this.personalDataService.getAll(this.moduleName);
            return this.items;
        } catch (error) {
            Logger.error(`Erro ao carregar ${this.moduleName}:`, error);
            this.showError('Erro ao carregar dados');
            return [];
        }
    }

    /**
     * Saves a new item or updates existing item
     * @returns {Promise<boolean>} True if saved successfully
     */
    async save() {
        try {
            const formData = this.getFormData();

            if (!this.validateForm(formData)) {
                return false;
            }

            if (this.editingId) {
                const existingItem = this.items.find(item => item.id === this.editingId);
                if (existingItem) {
                    const updatedItem = { ...existingItem, ...formData, updatedAt: new Date().toISOString() };
                    await this.personalDataService.update(this.moduleName, this.editingId, updatedItem);
                    this.showSuccess('Item atualizado com sucesso!');
                }
            } else {
                const newItem = {
                    ...formData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await this.personalDataService.add(this.moduleName, newItem);
                this.showSuccess('Item adicionado com sucesso!');
            }

            this.clearForm();
            this.cancelForm();
            await this.loadAndRender();

            return true;

        } catch (error) {
            Logger.error(`Erro ao salvar ${this.moduleName}:`, error);
            this.showError('Erro ao salvar item');
            return false;
        }
    }

    /**
     * Edits an existing item
     * @param {string} itemId - ID of item to be edited
     */
    async edit(itemId) {
        try {
            const item = this.items.find(i => i.id === itemId);
            if (!item) {
                this.showError('Item não encontrado');
                return;
            }

            this.editingId = itemId;
            this.showForm();
            this.fillForm(item);
            this.hideItemsList();
            
            const form = document.getElementById(`${this.moduleName}Form`);
            if (form) {
                form.classList.add('editing-mode');
            }

        } catch (error) {
            Logger.error(`Erro ao editar ${this.moduleName}:`, error);
            this.showError('Erro ao carregar item para edição');
        }
    }

    /**
     * Deletes an item
     * @param {string} itemId - ID of item to be deleted
     */
    async delete(itemId) {
        try {
            const result = await Swal.fire({
                title: 'Tem certeza?',
                text: 'Esta ação não pode ser desfeita!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, deletar!',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280'
            });

            if (result.isConfirmed) {
                await this.personalDataService.delete(this.moduleName, itemId);
                this.showSuccess('Item deletado com sucesso!');
                await this.loadAndRender();
            }

        } catch (error) {
            Logger.error(`Erro ao deletar ${this.moduleName}:`, error);
            this.showError('Erro ao deletar item');
        }
    }

    /**
     * Displays the add/edit form
     */
    showForm() {
        const form = document.getElementById(`${this.moduleName}Form`);
        const addBtn = document.getElementById(`addBtn${this.capitalize(this.moduleName)}`);
        const list = document.getElementById(`${this.moduleName}List`);
        
        if (form) form.classList.add('active');
        if (addBtn) addBtn.classList.add('hidden');
        if (list) list.classList.add('hidden');
    }

    /**
     * Activates focus mode on form (fullscreen)
     */
    toggleFocusMode() {
        const form = document.getElementById(`${this.moduleName}Form`);
        if (!form) return;

        let overlay = document.getElementById('formOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'formOverlay';
            overlay.className = 'form-overlay';
            overlay.onclick = () => this.toggleFocusMode();
            document.body.appendChild(overlay);
        }

        form.classList.toggle('focus-mode');
        overlay.classList.toggle('active');
        
        if (form.classList.contains('focus-mode')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    /**
     * Cancels operation and hides the form
     */
    cancelForm() {
        this.clearForm();
        this.editingId = null;
        
        const form = document.getElementById(`${this.moduleName}Form`);
        const addBtn = document.getElementById(`addBtn${this.capitalize(this.moduleName)}`);
        const overlay = document.getElementById('formOverlay');
        const list = document.getElementById(`${this.moduleName}List`);
        
        if (form) {
            form.classList.remove('active');
            form.classList.remove('focus-mode');
            form.classList.remove('editing-mode');
        }
        if (addBtn) addBtn.classList.remove('hidden');
        if (overlay) overlay.classList.remove('active');
        if (list) list.classList.remove('hidden');

        this.showItemsList();

        document.body.style.overflow = '';
    }

    /**
     * Hides items list during editing
     */
    hideItemsList() {
        const listContainer = document.getElementById(`${this.moduleName}List`);
        if (listContainer) {
            listContainer.classList.add('hidden-for-edit');
        }
        
        const filters = document.querySelector('.task-filters, .filter-buttons');
        if (filters) {
            filters.classList.add('hidden-for-edit');
        }
    }

    /**
     * Shows items list again
     */
    showItemsList() {
        const listContainer = document.getElementById(`${this.moduleName}List`);
        if (listContainer) {
            listContainer.classList.remove('hidden-for-edit');
        }
        
        const filters = document.querySelector('.task-filters, .filter-buttons');
        if (filters) {
            filters.classList.remove('hidden-for-edit');
        }
    }

    /**
     * Hides other cards when in edit mode (legacy - no longer used)
     * @deprecated Use hideItemsList() instead
     */
    hideOtherCards(editingId) {
        const listContainer = document.getElementById(`${this.moduleName}List`);
        if (!listContainer) return;

        const cards = listContainer.querySelectorAll('.item-card');
        cards.forEach(card => {
            const cardId = this.extractCardId(card);
            
            if (cardId && cardId !== editingId) {
                card.classList.add('hidden-for-edit');
            }
        });
    }

    /**
     * Shows all cards again (legacy - no longer used)
     * @deprecated Use showItemsList() instead
     */
    showAllCards() {
        const listContainer = document.getElementById(`${this.moduleName}List`);
        if (!listContainer) return;

        const cards = listContainer.querySelectorAll('.item-card');
        cards.forEach(card => {
            card.classList.remove('hidden-for-edit');
        });
    }

    /**
     * Extracts the ID from a card
     * @param {HTMLElement} card - Card element
     * @returns {string|null} Card ID or null
     */
    extractCardId(card) {
        if (card.dataset.id) return card.dataset.id;
        
        const editBtn = card.querySelector('[onclick*="edit"]');
        if (editBtn) {
            const match = editBtn.getAttribute('onclick').match(/['"]([^'"]+)['"]/);
            if (match) return match[1];
        }
        
        return null;
    }   
    
    /**
     * Clears all form fields
     */
    clearForm() {
        const form = document.getElementById(`${this.moduleName}Form`);
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    }

    /**
     * Loads data and renders the items list
     */
    async loadAndRender() {
        await this.loadItems();
        this.renderList();
    }

    /**
     * Renders the items list in the container
     */
    renderList() {
        const container = document.getElementById(`${this.moduleName}List`);
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = this.items.map(item => this.renderItem(item)).join('');
    }

    /**
     * Renders empty state (when there are no items)
     * @returns {string} Empty state HTML
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <p>📭 Nenhum item encontrado</p>
                <p class="empty-state-hint">Clique em "Adicionar" para criar o primeiro item</p>
            </div>
        `;
    }

    /**
     * Capitalizes first letter of a string
     * @param {string} str - String to be capitalized
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Formats date for display
     * @param {string} dateString - Date in ISO format
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Shows success message
     * @param {string} message - Message to be displayed
     */
    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: message,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
    }

    /**
     * Shows error message
     * @param {string} message - Message to be displayed
     */
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Shows validation message
     * @param {string} message - Message to be displayed
     */
    showValidation(message) {
        Swal.fire({
            icon: 'warning',
            title: 'Atenção!',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
}
