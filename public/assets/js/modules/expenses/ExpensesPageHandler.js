/**
 * @file ExpensesPageHandler.js
 * @description Orchestrator for Expense Control page (Fixed and Credit).
 * 
 * Contents:
 * - Module switching (fixed/credit)
 * - Form state management
 * - EventBus integration
 * - Module initialization
 * 
 * Modules: FixedExpensesModule, CreditExpensesModule
 * 
 * Dependencies:
 * - FinanceService
 * - EventBus (decoupled communication)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ExpensesPageHandler
 * @description Manages the expenses page (fixed and credit card)
 */
class ExpensesPageHandler {

    /**
     * Initializes the expenses page handler
     * Creates instances of the 2 modules (fixed and credit)
     * 
     * @constructor
     * @param {FinanceService} financeService - Financial service instance
     * @param {number} userId - Logged user ID
     * 
     * @example
     * const handler = new ExpensesPageHandler(financeService, 12345);
     */
    constructor(financeService, userId) {
        this.financeService = financeService;
        this.userId = userId;
        this.currentModule = 'fixed';
        this.formState = {
            fixed: false,
            credit: false
        };
        
        this.modules = {
            fixed: new FixedExpensesModule(financeService, userId),
            credit: new CreditExpensesModule(financeService, userId)
        };

        this._setupEventListeners();
    }

    /**
     * Sets up EventBus listeners for decoupled communication
     * @private
     * @returns {void}
     */
    _setupEventListeners() {
        if (typeof EventBus === 'undefined' || typeof Events === 'undefined') {
            return;
        }

        EventBus.on(Events.MODULE_RELOADED, (data) => {
            if (data && data.page === 'expenses') {
                this.reloadCurrentModule();
            }
        });

        EventBus.on(Events.FORM_ACTION_STATE, (data) => {
            if (data && data.page === 'expenses') {
                this.setFormActionState(data.module, data.isVisible);
            }
        });
    }

    /**
     * Renders the complete expenses page structure
     * @returns {Promise<string>} Page HTML
     */
    async render() {
        const totalFixedMonthly = await this.modules.fixed.getTotalMonthly();
        const totalFixedYearly = await this.modules.fixed.getTotalYearly();
        const totalCredit = await this.modules.credit.getTotal();
        const totalExpenses = totalFixedMonthly + totalFixedYearly + totalCredit;

        const fixedMonthlyPercentage = totalExpenses > 0 ? ((totalFixedMonthly / totalExpenses) * 100).toFixed(1) : 0;
        const fixedYearlyPercentage = totalExpenses > 0 ? ((totalFixedYearly / totalExpenses) * 100).toFixed(1) : 0;
        const creditPercentage = totalExpenses > 0 ? ((totalCredit / totalExpenses) * 100).toFixed(1) : 0;

        return `
            <div class="expenses-container">
                <div class="expenses-hero page-hero">
                    <h1>💳 Controle de Gastos</h1>
                    <p>Gerencie seus gastos fixos e compras no cartão de crédito</p>
                </div>

                <div class="expenses-intro">
                    <p class="intro-text">Visão completa dos seus gastos mensais por categoria</p>
                </div>

                <!-- Cards de Resumo -->
                <div class="expenses-sections-grid">
                    <div class="expenses-section">
                        <div class="section-header">
                            <div class="section-icon">📅</div>
                            <div class="section-info">
                                <h3>Gastos Fixos Mensais</h3>
                                <p>Despesas recorrentes mensais</p>
                            </div>
                        </div>
                        <div class="section-summary">
                            <div class="summary-value negative">R$ ${this.formatMoney(totalFixedMonthly)}</div>
                            <div class="summary-percentage">${fixedMonthlyPercentage}% do total</div>
                        </div>
                    </div>

                    <div class="expenses-section">
                        <div class="section-header">
                            <div class="section-icon">🗓️</div>
                            <div class="section-info">
                                <h3>Gastos Fixos Anuais</h3>
                                <p>Despesas recorrentes anuais</p>
                            </div>
                        </div>
                        <div class="section-summary">
                            <div class="summary-value negative">R$ ${this.formatMoney(totalFixedYearly)}</div>
                            <div class="summary-percentage">${fixedYearlyPercentage}% do total</div>
                        </div>
                    </div>

                    <div class="expenses-section">
                        <div class="section-header">
                            <div class="section-icon">💳</div>
                            <div class="section-info">
                                <h3>Cartão de Crédito</h3>
                                <p>Parcelas do mês atual</p>
                            </div>
                        </div>
                        <div class="section-summary">
                            <div class="summary-value negative">R$ ${this.formatMoney(totalCredit)}</div>
                            <div class="summary-percentage">${creditPercentage}% do total</div>
                        </div>
                    </div>

                    <div class="expenses-section expenses-total-section">
                        <div class="section-header">
                            <div class="section-icon">📊</div>
                            <div class="section-info">
                                <h3>Total de Gastos</h3>
                                <p>Soma de todas as despesas</p>
                            </div>
                        </div>
                        <div class="section-summary">
                            <div class="summary-value total-value">R$ ${this.formatMoney(totalExpenses)}</div>
                            <div class="summary-percentage">100% das despesas</div>
                        </div>
                    </div>
                </div>

                <!-- Seção de Gerenciamento -->
                <div class="expenses-management-section">
                    <div class="visualization-header">
                        <h2>📝 Gerenciar Gastos</h2>
                        <p>Adicione, edite ou remova seus gastos</p>
                    </div>

                    <!-- Tabs de Navegação -->
                    <div class="finance-tabs">
                        <button class="finance-tab active" data-tab="fixed" 
                                onclick="expensesHandler.switchModule('fixed')">
                            🏠 Gastos Fixos
                        </button>
                        <button class="finance-tab" data-tab="credit" 
                                onclick="expensesHandler.switchModule('credit')">
                            💳 Cartão de Crédito
                        </button>
                    </div>

                    <!-- Conteúdo Dinâmico -->
                    <div id="expensesContent" class="tab-content active">
                        ${await this.renderCurrentModule()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders the current module
     * @returns {Promise<string>} Active module HTML
     */
    async renderCurrentModule() {
        const module = this.modules[this.currentModule];
        if (!module) return '';

        await module.renderList();

        const buttonLabel = this.currentModule === 'fixed' ? '+ Adicionar Gasto Fixo' : '+ Adicionar Compra';
        const isFormVisible = this.formState?.[this.currentModule] || false;
        const hasItems = this.modules[this.currentModule]?.expenses?.length > 0 || false;
        const actions = `
            <div class="finance-actions" data-tab="${this.currentModule}">
                <button class="btn-primary finance-action-btn finance-action-add ${isFormVisible ? 'is-hidden' : ''}"
                        onclick="expensesHandler.openForm('${this.currentModule}')">
                    ${buttonLabel}
                </button>
                ${hasItems && !isFormVisible ? `
                    <button class="btn-delete-all finance-action-btn"
                            onclick="expensesHandler.deleteAll('${this.currentModule}')">
                        ${HTMLTemplates.icons.delete(18)}
                        Excluir Todos
                    </button>
                ` : ''}
                <button class="btn-secondary finance-action-btn finance-action-cancel ${isFormVisible ? '' : 'is-hidden'}"
                        onclick="expensesHandler.closeForm('${this.currentModule}')">
                    Cancelar
                </button>
            </div>
        `;

        const form = module.renderForm();
        const list = await module.renderList();

        return actions + form + list;
    }

    /**
     * Displays the selected module's form
     * @param {string} tab - Tab identifier
     * @returns {void}
     */
    openForm(tab) {
        const module = this.modules[tab];
        if (!module) return;
        module.showForm();
    }

    /**
     * Hides the form and restores action buttons
     * @param {string} tab - Tab identifier
     * @returns {Promise<void>}
     */
    async closeForm(tab) {
        const module = this.modules[tab];
        if (!module) return;

        if (typeof module.isEditing === 'function' && module.isEditing()) {
            if (typeof module.cancelEdit === 'function') {
                await module.cancelEdit();
                return;
            }
        }

        if (typeof module.resetEditingState === 'function') {
            module.resetEditingState();
        }
        module.hideForm();
    }

    /**
     * Updates form action buttons according to current state
     * @param {string} tab - Tab identifier
     * @param {boolean} isFormVisible - Indicates if form is open
     * @returns {void}
     */
    setFormActionState(tab, isFormVisible) {
        if (this.formState) {
            this.formState[tab] = isFormVisible;
        }

        const container = document.querySelector(`.finance-actions[data-tab="${tab}"]`);
        if (!container) return;

        const addButton = container.querySelector('.finance-action-add');
        const cancelButton = container.querySelector('.finance-action-cancel');

        if (addButton) {
            addButton.classList.toggle('is-hidden', isFormVisible);
        }

        if (cancelButton) {
            cancelButton.classList.toggle('is-hidden', !isFormVisible);
        }
    }

    /**
     * Switches between expense modules
     * @param {string} moduleName - Desired module ('fixed' or 'credit')
     * @returns {void}
     */
    async switchModule(moduleName) {
        if (!this.modules[moduleName]) return;
        
        Object.keys(this.formState).forEach(key => {
            this.formState[key] = false;
        });
        
        this.currentModule = moduleName;

        document.querySelectorAll('.finance-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === moduleName);
        });

        const contentDiv = document.getElementById('expensesContent');
        if (contentDiv) {
            contentDiv.innerHTML = '<div class="loading-state">Carregando...</div>';
            
            contentDiv.innerHTML = await this.renderCurrentModule();
            
            this.modules[moduleName].attachEventListeners();
        }
    }

    /**
     * Initializes the handler and loads current module data
     * @returns {void}
     */
    initialize() {
        this.formState = {
            fixed: false,
            credit: false
        };
        
        this.currentModule = 'fixed';
        
        const currentModule = this.modules[this.currentModule];
        if (currentModule) {
            setTimeout(() => {
                currentModule.attachEventListeners();
            }, 50);
        }
    }

    /**
     * Initializes event listeners (PageManager compatibility)
     * @returns {void}
     */
    initializeListeners() {
        this.initialize();
    }

    /**
     * Resets editing state for all modules
     * @returns {void}
     */
    resetEditingState() {
        Object.values(this.modules).forEach(module => {
            if (module.cancelEdit) {
                module.cancelEdit();
            }
        });
    }

    /**
     * Reloads only the current tab without reloading the entire page
     * Also updates summary cards with new totals
     * @returns {Promise<void>}
     */
    async reloadCurrentModule() {
        const contentDiv = document.getElementById('expensesContent');
        if (contentDiv) {
            contentDiv.innerHTML = await this.renderCurrentModule();
            this.modules[this.currentModule].attachEventListeners();
        }
        
        await this.updateSummaryCards();
    }

    /**
     * Updates only the summary cards with current totals
     * @returns {Promise<void>}
     */
    async updateSummaryCards() {
        const totalFixedMonthly = await this.modules.fixed.getTotalMonthly();
        const totalFixedYearly = await this.modules.fixed.getTotalYearly();
        const totalCredit = await this.modules.credit.getTotal();
        const totalExpenses = totalFixedMonthly + totalFixedYearly + totalCredit;

        const fixedMonthlyPercentage = totalExpenses > 0 ? ((totalFixedMonthly / totalExpenses) * 100).toFixed(1) : 0;
        const fixedYearlyPercentage = totalExpenses > 0 ? ((totalFixedYearly / totalExpenses) * 100).toFixed(1) : 0;
        const creditPercentage = totalExpenses > 0 ? ((totalCredit / totalExpenses) * 100).toFixed(1) : 0;

        const sectionsGrid = document.querySelector('.expenses-sections-grid');
        if (sectionsGrid) {
            const sections = sectionsGrid.querySelectorAll('.expenses-section');
            
            if (sections[0]) {
                const valueEl = sections[0].querySelector('.summary-value');
                const percentEl = sections[0].querySelector('.summary-percentage');
                if (valueEl) valueEl.textContent = `R$ ${this.formatMoney(totalFixedMonthly)}`;
                if (percentEl) percentEl.textContent = `${fixedMonthlyPercentage}% do total`;
            }
            
            if (sections[1]) {
                const valueEl = sections[1].querySelector('.summary-value');
                const percentEl = sections[1].querySelector('.summary-percentage');
                if (valueEl) valueEl.textContent = `R$ ${this.formatMoney(totalFixedYearly)}`;
                if (percentEl) percentEl.textContent = `${fixedYearlyPercentage}% do total`;
            }
            
            if (sections[2]) {
                const valueEl = sections[2].querySelector('.summary-value');
                const percentEl = sections[2].querySelector('.summary-percentage');
                if (valueEl) valueEl.textContent = `R$ ${this.formatMoney(totalCredit)}`;
                if (percentEl) percentEl.textContent = `${creditPercentage}% do total`;
            }
            
            if (sections[3]) {
                const valueEl = sections[3].querySelector('.summary-value');
                if (valueEl) valueEl.textContent = `R$ ${this.formatMoney(totalExpenses)}`;
            }
        }
    }
    
    /**
     * Deletes all expenses from current module
     * @param {string} tab - Tab identifier ('fixed' or 'credit')
     * @returns {Promise<void>}
     */
    async deleteAll(tab) {
        const module = this.modules[tab];
        if (!module || typeof module.deleteAll !== 'function') return;
        
        await module.deleteAll();
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
}
