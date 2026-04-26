/**
 * @file BaseExpenseModule.js
 * @description Abstract base class for financial expense modules.
 * 
 * Contents:
 * - Template Method Pattern for CRUD flow
 * - 9 expense categories
 * - Form rendering and validation
 * - FinanceService integration
 * 
 * Subclasses:
 * - FixedExpensesModule (monthly recurring)
 * - CreditExpensesModule (installment purchases)
 * 
 * Dependencies:
 * - FinanceService (Firebase persistence)
 * - SweetAlert2 (user feedback)
 * 
 * @abstract
 * @author Leandro Fialho Fernandes
 */

/**
 * @class BaseExpenseModule
 * @abstract
 * @description Abstract base class for expense modules
 */
class BaseExpenseModule {
    
    /**
     * Initializes the base expense module
     * 
     * @constructor
     * @param {string} moduleName - Module name ('fixed' or 'credit')
     * @param {FinanceService} financeService - Financial service
     * @param {number} userId - User ID
     * @throws {TypeError} If trying to instantiate directly (abstract class)
     * 
     * @example
     * super('fixed', financeService, userId);
     */
    constructor(moduleName, financeService, userId) {
        if (new.target === BaseExpenseModule) {
            throw new TypeError('Cannot construct BaseExpenseModule instances directly');
        }
        this.moduleName = moduleName;
        this.financeService = financeService;
        this.userId = userId;
        this.editingExpense = null;
        this.actionKey = null;
        this.categories = [
            'Alimentação',
            'Transporte',
            'Moradia',
            'Saúde',
            'Educação',
            'Lazer',
            'Roupas',
            'Eletrônicos',
            'Outros'
        ];
    }

    /**
     * Renders the module-specific form
     * @abstract
     * @returns {string} Form HTML
     */
    renderForm() {
        throw new Error('Method renderForm() must be implemented');
    }

    /**
     * Renders the expenses list
     * @abstract
     * @returns {Promise<string>} List HTML
     */
    async renderList() {
        throw new Error('Method renderList() must be implemented');
    }

    /**
     * Extracts data from the form
     * @abstract
     * @returns {Object} Form data
     */
    getFormData() {
        throw new Error('Method getFormData() must be implemented');
    }

    /**
     * Validates data before saving
     * @abstract
     * @param {Object} data - Data to be validated
     * @returns {Object} {valid: boolean, message: string}
     */
    validateData(data) {
        throw new Error('Method validateData() must be implemented');
    }

    /**
     * Resets the editing state
     * @returns {void}
     */
    resetEditingState() {
        this.editingExpense = null;
    }

    /**
     * Sets the expense being edited
     * @param {Object} expense - Expense to be edited
     * @returns {void}
     */
    setEditingExpense(expense) {
        this.editingExpense = expense;
    }

    /**
     * Sets the key used to synchronize form buttons
     * @param {string} key - Module identifier in ExpensesPageHandler
     * @returns {void}
     */
    setActionKey(key) {
        this.actionKey = key;
    }

    /**
     * Checks if in editing mode
     * @returns {boolean}
     */
    isEditing() {
        return this.editingExpense !== null;
    }

    /**
     * Shows loading during async operation
     * @param {string} title - Loading title
     * @param {string} text - Loading text
     * @returns {void}
     */
    showLoading(title = 'Processando...', text = 'Aguarde um momento') {
        Swal.fire({
            title,
            text,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }

    /**
     * Shows inline processing indicator on the list
     * @returns {void}
     */
    showListProcessing() {
        const list = document.querySelector('.expenses-list');
        if (list) {
            list.classList.add('loading');
        }
    }

    /**
     * Hides inline processing indicator on the list
     * @returns {void}
     */
    hideListProcessing() {
        const list = document.querySelector('.expenses-list');
        if (list) {
            list.classList.remove('loading');
        }
    }

    /**
     * Marks an expense card as being processed
     * @param {string} id - Expense ID
     * @param {string} action - Action type ('saving', 'deleting')
     * @returns {void}
     */
    setCardProcessing(id, action = 'processing') {
        const cards = document.querySelectorAll('.expense-card');
        cards.forEach(card => {
            const editBtn = card.querySelector('.btn-edit');
            const deleteBtn = card.querySelector('.btn-delete');
            
            if (editBtn && editBtn.getAttribute('onclick')?.includes(id)) {
                card.classList.add('processing', action);
            }
            if (deleteBtn && deleteBtn.getAttribute('onclick')?.includes(id)) {
                card.classList.add('processing', action);
            }
        });
    }

    /**
     * Removes processing state from card
     * @param {string} id - Expense ID
     * @returns {void}
     */
    clearCardProcessing(id) {
        const cards = document.querySelectorAll('.expense-card');
        cards.forEach(card => {
            const editBtn = card.querySelector('.btn-edit');
            const deleteBtn = card.querySelector('.btn-delete');
            
            if ((editBtn && editBtn.getAttribute('onclick')?.includes(id)) ||
                (deleteBtn && deleteBtn.getAttribute('onclick')?.includes(id))) {
                card.classList.remove('processing', 'saving', 'deleting');
            }
        });
    }

    /**
     * Shows success animation on a card (for updates)
     * @param {string} id - Expense ID (optional, for highlighting specific card after reload)
     * @returns {void}
     */
    showCardSuccess(id) {
        if (id) {
            sessionStorage.setItem('highlight_expense_id', id);
        }
    }

    /**
     * Checks and applies success highlight on page load
     * @returns {void}
     */
    applySuccessHighlight() {
        const highlightId = sessionStorage.getItem('highlight_expense_id');
        if (highlightId) {
            sessionStorage.removeItem('highlight_expense_id');
            
            setTimeout(() => {
                const cards = document.querySelectorAll('.expense-card');
                cards.forEach(card => {
                    const editBtn = card.querySelector('.btn-edit');
                    if (editBtn && editBtn.getAttribute('onclick')?.includes(highlightId)) {
                        card.classList.add('success');
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => card.classList.remove('success'), 1500);
                    }
                });
            }, 300);
        }
    }

    /**
     * Shows success message
     * @param {string} title - Message title
     * @param {string} text - Message text
     * @param {number} timer - Time to auto-close (ms)
     * @returns {Promise}
     */
    showSuccess(title, text, timer = 3000) {
        return Swal.fire({
            icon: 'success',
            title,
            text,
            showConfirmButton: false,
            timer,
            timerProgressBar: true
        });
    }

    /**
     * Shows error message
     * @param {string} title - Message title
     * @param {string} text - Message text
     * @returns {Promise}
     */
    showError(title, text) {
        return Swal.fire({
            icon: 'error',
            title,
            text,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Shows validation message
     * @param {string} message - Validation message
     * @returns {Promise}
     */
    showValidation(message) {
        return Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Shows confirmation before action
     * @param {string} title - Confirmation title
     * @param {string} text - Confirmation text
     * @param {string} confirmButtonText - Confirm button text
     * @returns {Promise<boolean>}
     */
    async showConfirmation(title, text, confirmButtonText = 'Confirmar') {
        const result = await Swal.fire({
            icon: 'question',
            title,
            text,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });
        return result.isConfirmed;
    }

    /**
     * Formats monetary value for display
     * @param {number} value - Value to format
     * @returns {string} Formatted value (e.g.: "1.234,56")
     */
    formatMoney(value) {
        if (!value && value !== 0) return '0,00';
        return parseFloat(value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Formats date for display
     * @param {string} dateString - Date in ISO format
     * @returns {string} Formatted date (e.g.: "09/11/2025")
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return 'N/A';
        }
    }

    /**
     * Renders empty state
     * @param {string} message - Message to display
     * @returns {string} Empty state HTML
     */
    renderEmptyState(message) {
        return `
            <div class="empty-state">
                <p>📭 ${message}</p>
                <small>Adicione um item usando o formulário acima</small>
            </div>
        `;
    }

    /**
     * Clears unsaved changes indicator from current tab
     * @returns {void}
     */
    clearTabUnsavedChanges() {
        if (window.tabManager) {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab) {
                window.tabManager.clearUnsavedChanges(activeTab.id);
            }
        }
    }

    /**
     * Capitalizes first letter of each word
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        if (!str) return '';
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    /**
     * Shows the form
     * @returns {void}
     */
    showForm() {
        const form = document.querySelector('.finance-form');
        if (form) {
            form.classList.add('active');
            this._syncFormActionState(true);
        }
    }

    /**
     * Hides the form
     * @returns {void}
     */
    hideForm() {
        const form = document.querySelector('.finance-form');
        if (form) {
            form.classList.remove('active');
            this._syncFormActionState(false);
        }
    }

    /**
     * Toggles the form
     * @returns {void}
     */
    toggleForm() {
        const form = document.querySelector('.finance-form');
        if (form) {
            const isActive = form.classList.toggle('active');
            this._syncFormActionState(isActive);
        }
    }

    /**
     * Keeps action buttons aligned with form state
     * Uses EventBus for decoupled communication with fallback to direct handler
     * @param {boolean} isVisible - Defines if form is visible
     * @returns {void}
     */
    _syncFormActionState(isVisible) {
        const key = this.actionKey || this.moduleName;

        if (typeof EventBus !== 'undefined' && typeof Events !== 'undefined') {
            EventBus.emit(Events.FORM_ACTION_STATE, { 
                page: 'expenses', 
                module: key, 
                isVisible 
            });
            return;
        }

        if (typeof window === 'undefined') {
            return;
        }

        const handler = window.expensesHandler;
        if (handler && typeof handler.setFormActionState === 'function') {
            handler.setFormActionState(key, isVisible);
        }
    }

    /**
     * Requests a module reload via EventBus (decoupled communication)
     * Falls back to direct handler call if EventBus is not available
     * @protected
     * @returns {void}
     */
    _requestModuleReload() {
        if (typeof EventBus !== 'undefined' && typeof Events !== 'undefined') {
            EventBus.emit(Events.MODULE_RELOADED, { page: 'expenses', module: this.moduleName });
            return;
        }

        const handler = window.expensesHandler;
        if (handler && typeof handler.reloadCurrentModule === 'function') {
            handler.reloadCurrentModule();
        }
    }
}
