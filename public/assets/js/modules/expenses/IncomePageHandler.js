/**
 * @file IncomePageHandler.js
 * @description Monthly income management and configuration.
 * 
 * Contents:
 * - Income display (formatted R$ ###.###,##)
 * - Edit mode toggle
 * - Value validation (positive numbers)
 * - FinanceService persistence
 * 
 * Dependencies:
 * - FinanceService (Firebase persistence)
 * - SweetAlert2 (user feedback)
 * 
 * @author Leandro Fialho Fernandes
 */
 
/**
 * @class IncomePageHandler
 * @description Manages the monthly income configuration page
 */
class IncomePageHandler {

    /**
     * Initializes the monthly income handler
     * 
     * @constructor
     * @param {FinanceService} financeService - Financial service instance
     * @param {number} userId - Logged user ID
     * 
     * @example
     * const handler = new IncomePageHandler(financeService, 123);
     */
    constructor(financeService, userId) {
        this.financeService = financeService;
        this.userId = userId;
        this.isEditing = false;
        this.currentIncome = null;
    }

    /**
     * Renders the monthly income page
     * Displays form or view according to state
     * @returns {Promise<string>} Income page HTML
     */
    async render() {
        const income = await this.financeService.getIncome(this.userId);
        this.currentIncome = income;

        if (!income || this.isEditing) {
            return `
                <div class="income-container">
                    <div class="income-hero page-hero">
                        <h1>💰 Renda Mensal</h1>
                        <p>${income ? 'Atualize sua renda mensal para manter seus cálculos precisos' : 'Configure sua renda mensal para começar a gerenciar suas finanças'}</p>
                    </div>
                    ${this.renderIncomeForm(income)}
                </div>
            `;
        }

        return `
            <div class="income-container">
                <div class="income-hero page-hero">
                    <h1>💰 Renda Mensal</h1>
                    <p>Gerencie e acompanhe sua renda mensal e projeções financeiras</p>
                </div>

                ${this.renderIncomeOverview(income)}
                ${this.renderIncomeInsights(income)}
                ${this.renderFinancialTips(income)}
            </div>
        `;
    }

    /**
     * Renders the income registration/edit form
     * @param {Object|null} income - Existing income data (null for new)
     * @returns {string} Form HTML
     */
    renderIncomeForm(income = null) {
        const value = income ? income.value : '';
        const buttonText = income ? 'Atualizar Renda' : 'Salvar Renda';
        const title = income ? 'Editar Renda Mensal' : 'Cadastrar Renda Mensal';
        const subtitle = income 
            ? 'Atualize o valor da sua renda mensal' 
            : 'Informe sua renda mensal para começar a gerenciar suas finanças';

        return `
            <div class="income-form-section">
                <div class="section-header">
                    <div class="section-icon">✏️</div>
                    <div class="section-info">
                        <h3>${title}</h3>
                        <p>${subtitle}</p>
                    </div>
                </div>
                <form id="incomeForm" class="income-form-content">
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="incomeValue">Valor da Renda Mensal (R$)</label>
                            <input 
                                type="number" 
                                id="incomeValue" 
                                step="0.01" 
                                placeholder="Ex: 5000,00"
                                value="${value}"
                                required
                            >
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">${buttonText}</button>
                        ${income ? '<button type="button" id="btnCancelEdit" class="btn-secondary">Cancelar</button>' : ''}
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Renders the income overview section with main card and actions
     * @param {Object} income - Income data
     * @returns {string} Income overview HTML
     */
    renderIncomeOverview(income) {
        const lastUpdate = income.updatedAt ? new Date(income.updatedAt).toLocaleDateString('pt-BR') : 'N/A';
        
        return `
            <div class="income-intro">
                <p class="intro-text">Visão completa da sua renda e projeções financeiras</p>
            </div>

            <div class="income-sections-grid">
                <!-- CARD PRINCIPAL DE RENDA -->
                <div class="income-section income-main-card">
                    <div class="section-header">
                        <div class="section-icon">💵</div>
                        <div class="section-info">
                            <h3>Sua Renda Mensal</h3>
                            <p>Valor base para cálculos</p>
                        </div>
                    </div>
                    <div class="income-main-content">
                        <div class="income-value-display">
                            <span class="income-currency">R$</span>
                            <span class="income-amount">${this.formatMoney(income.value)}</span>
                        </div>
                        <div class="income-meta">
                            <span class="income-update-date">📅 Atualizado em: ${lastUpdate}</span>
                        </div>
                        <button id="btnEditIncome" class="btn-edit-income">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Editar Renda
                        </button>
                    </div>
                </div>

                <!-- PROJEÇÕES -->
                <div class="income-section">
                    <div class="section-header">
                        <div class="section-icon">📊</div>
                        <div class="section-info">
                            <h3>Projeções</h3>
                            <p>Estimativas baseadas na renda</p>
                        </div>
                    </div>
                    <div class="section-metrics">
                        <div class="metric-card">
                            <div class="metric-icon u-color-green">📅</div>
                            <div class="metric-content">
                                <span class="metric-label">Renda Diária</span>
                                <span class="metric-value u-text-green">R$ ${this.formatMoney(income.value / 30)}</span>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon u-color-blue">📆</div>
                            <div class="metric-content">
                                <span class="metric-label">Renda Semanal</span>
                                <span class="metric-value u-text-blue">R$ ${this.formatMoney((income.value / 30) * 7)}</span>
                            </div>
                        </div>
                        <div class="metric-card highlight-card">
                            <div class="metric-icon u-color-purple-grad">📈</div>
                            <div class="metric-content">
                                <span class="metric-label">Renda Anual</span>
                                <span class="metric-value u-text-purple u-large-bold">R$ ${this.formatMoney(income.value * 12)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DISTRIBUIÇÃO RECOMENDADA -->
                <div class="income-section">
                    <div class="section-header">
                        <div class="section-icon">🎯</div>
                        <div class="section-info">
                            <h3>Distribuição Ideal</h3>
                            <p>Regra 50-30-20</p>
                        </div>
                    </div>
                    <div class="section-distribution">
                        <div class="distribution-item">
                            <div class="distribution-header">
                                <span class="distribution-icon u-color-red">🏠</span>
                                <div class="distribution-info">
                                    <span class="distribution-label">Necessidades</span>
                                    <span class="distribution-percentage">50%</span>
                                </div>
                            </div>
                            <div class="distribution-value">R$ ${this.formatMoney(income.value * 0.5)}</div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-header">
                                <span class="distribution-icon u-color-blue">🎮</span>
                                <div class="distribution-info">
                                    <span class="distribution-label">Desejos</span>
                                    <span class="distribution-percentage">30%</span>
                                </div>
                            </div>
                            <div class="distribution-value">R$ ${this.formatMoney(income.value * 0.3)}</div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-header">
                                <span class="distribution-icon u-color-green">💰</span>
                                <div class="distribution-info">
                                    <span class="distribution-label">Poupança</span>
                                    <span class="distribution-percentage">20%</span>
                                </div>
                            </div>
                            <div class="distribution-value">R$ ${this.formatMoney(income.value * 0.2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders income insights section
     * @param {Object} income - Income data
     * @returns {string} Insights HTML
     */
    renderIncomeInsights(income) {
        return `
            <div class="income-disclaimer">
                <span class="disclaimer-icon">ℹ️</span>
                <p><strong>Nota:</strong> Todos os valores e métricas apresentados são estimativas baseadas na sua renda mensal informada. Os valores reais podem variar devido a diversos fatores, como impostos, benefícios adicionais, variações de carga horária e outras fontes de renda.</p>
            </div>
        `;
    }

    /**
     * Renders financial tips section
     * @param {Object} income - Income data
     * @returns {string} Tips HTML
     */
    renderFinancialTips(income) {
        return `
            <div class="income-tips-section">
                <div class="visualization-header">
                    <h2>💡 Dicas Financeiras</h2>
                    <p>Recomendações baseadas na sua renda mensal</p>
                </div>
                
                <div class="tips-grid">
                    <div class="tip-card">
                        <div class="tip-icon">💳</div>
                        <h4>Limite de Cartão</h4>
                        <p>Recomendado: até 30% da renda</p>
                        <p class="tip-highlight">R$ ${this.formatMoney(income.value * 0.3)}</p>
                    </div>

                    <div class="tip-card">
                        <div class="tip-icon">🏠</div>
                        <h4>Moradia Ideal</h4>
                        <p>Máximo recomendado: 30% da renda</p>
                        <p class="tip-highlight">R$ ${this.formatMoney(income.value * 0.3)}</p>
                    </div>

                    <div class="tip-card">
                        <div class="tip-icon">🚨</div>
                        <h4>Fundo de Emergência</h4>
                        <p>Meta: 6 meses de despesas</p>
                        <p class="tip-highlight">R$ ${this.formatMoney(income.value * 6)}</p>
                    </div>

                    <div class="tip-card">
                        <div class="tip-icon">📊</div>
                        <h4>Investimentos</h4>
                        <p>Comece com pelo menos 10%</p>
                        <p class="tip-highlight">R$ ${this.formatMoney(income.value * 0.1)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * @deprecated Use renderIncomeOverview instead
     * Renders the registered income display (legacy method)
     * @param {Object} income - Income data
     * @returns {string} Income display HTML
     */
    renderIncomeDisplay(income) {
        return this.renderIncomeOverview(income) + this.renderIncomeInsights(income) + this.renderFinancialTips(income);
    }

    /**
     * Initializes all page event listeners
     * @returns {void}
     */
    initializeListeners() {
        const form = document.getElementById('incomeForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSaveIncome(e));
        }

        const btnEdit = document.getElementById('btnEditIncome');
        if (btnEdit) {
            btnEdit.addEventListener('click', () => this.handleEditIncome());
        }

        const btnCancel = document.getElementById('btnCancelEdit');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => this.handleCancelEdit());
        }
    }

    /**
     * Saves or updates monthly income
     * @param {Event} e - Form submit event
     * @returns {Promise<void>}
     */
    async handleSaveIncome(e) {
        e.preventDefault();

        const value = parseFloat(document.getElementById('incomeValue').value);

        const incomeData = {
            value,
            updatedAt: new Date().toISOString()
        };

        try {
            await this.financeService.saveIncome(this.userId, incomeData);

            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: this.currentIncome ? 'Renda atualizada com sucesso!' : 'Renda cadastrada com sucesso!',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            }).then(() => {
                this.isEditing = false;
                window.pageManager.loadPage('renda-mensal');
            });
        } catch (error) {
            Logger.error('❌ Erro ao salvar renda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Não foi possível salvar a renda. Tente novamente.',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        }
    }

    /**
     * Enables income edit mode
     * @returns {void}
     */
    handleEditIncome() {
        this.isEditing = true;
        window.pageManager.loadPage('renda-mensal');
    }

    /**
     * Cancels editing and returns to view
     * @returns {void}
     */
    handleCancelEdit() {
        this.isEditing = false;
        window.pageManager.loadPage('renda-mensal');
    }

    /**
     * Formats numeric value to Brazilian monetary format
     * @param {number} value - Value to be formatted
     * @returns {string} Formatted value (e.g.: "1.234,56")
     */
    formatMoney(value) {
        return parseFloat(value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Formats date to Brazilian standard
     * @param {string} dateString - Date in ISO format
     * @returns {string} Formatted date (dd/mm/yyyy)
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}