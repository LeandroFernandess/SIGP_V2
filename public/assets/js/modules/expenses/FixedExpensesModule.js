/**
 * @file FixedExpensesModule.js
 * @description Monthly recurring fixed expenses management.
 * 
 * Contents:
 * - Fixed expense CRUD (rent, utilities, subscriptions)
 * - Due day tracking
 * - 9 expense categories
 * - Monthly total calculation
 * 
 * Extends: BaseExpenseModule
 * 
 * Dependencies:
 * - FinanceService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class FixedExpensesModule
 * @extends BaseExpenseModule
 * @description Manages monthly fixed expenses
 */
class FixedExpensesModule extends BaseExpenseModule {

    /**
     * Initializes the fixed expenses module
     * 
     * @constructor
     * @param {FinanceService} financeService - Financial service
     * @param {number} userId - User ID
     * 
     * @example
     * const module = new FixedExpensesModule(financeService, 12345);
     */
    constructor(financeService, userId) {
        super('fixedExpenses', financeService, userId);
        this.setActionKey('fixed');
        this.expenses = [];
        this.isProcessing = false;
    }

    /**
     * Renders the fixed expenses form
     * @returns {string} Form HTML
     */
    renderForm() {
        const isEditing = this.isEditing();
        const expense = isEditing ? this.editingExpense : {};
        const buttonText = isEditing ? 'Atualizar Gasto Fixo' : '+ Adicionar Gasto Fixo';
        const title = isEditing ? 'Editar Gasto Fixo' : 'Adicionar Gasto Fixo';
        const recurrenceType = expense.recurrenceType || 'monthly';

        return `
            <div class="finance-form">
                <h3>${title}</h3>
                <form id="fixedExpenseForm">
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="fixedName">Nome do Gasto</label>
                            <input 
                                type="text" 
                                id="fixedName" 
                                placeholder="Ex: Aluguel, Internet, IPVA..."
                                value="${expense.name || ''}"
                                required
                            >
                        </div>
                        <div class="form-input-group">
                            <label for="fixedValue">Valor (R$)</label>
                            <input 
                                type="number" 
                                id="fixedValue" 
                                step="0.01"
                                placeholder="0,00"
                                value="${expense.value || ''}"
                                required
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="fixedCategory">Categoria</label>
                            <select id="fixedCategory" required>
                                <option value="">Selecione...</option>
                                ${this.categories.map(cat =>
            `<option value="${cat}" ${expense.category === cat ? 'selected' : ''}>${cat}</option>`
        ).join('')}
                            </select>
                        </div>
                        <div class="form-input-group">
                            <label for="fixedRecurrenceType">Recorrência</label>
                            <select id="fixedRecurrenceType" required onchange="expensesHandler.modules.fixed.toggleRecurrenceFields()">
                                <option value="monthly" ${recurrenceType === 'monthly' ? 'selected' : ''}>📅 Mensal</option>
                                <option value="yearly" ${recurrenceType === 'yearly' ? 'selected' : ''}>🗓️ Anual</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row" id="recurrenceFieldsContainer">
                        <div class="form-input-group" id="dueDayField" style="display: ${recurrenceType === 'monthly' ? 'block' : 'none'};">
                            <label for="fixedDueDay">Dia de Vencimento</label>
                            <input 
                                type="number" 
                                id="fixedDueDay" 
                                min="1" 
                                max="31"
                                placeholder="1-31"
                                value="${expense.dueDay || ''}"
                            >
                        </div>
                        <div class="form-input-group" id="dueMonthField" style="display: ${recurrenceType === 'yearly' ? 'block' : 'none'};">
                            <label for="fixedDueMonth">Mês de Vencimento</label>
                            <select id="fixedDueMonth">
                                <option value="1" ${expense.dueMonth === 1 ? 'selected' : ''}>Janeiro</option>
                                <option value="2" ${expense.dueMonth === 2 ? 'selected' : ''}>Fevereiro</option>
                                <option value="3" ${expense.dueMonth === 3 ? 'selected' : ''}>Março</option>
                                <option value="4" ${expense.dueMonth === 4 ? 'selected' : ''}>Abril</option>
                                <option value="5" ${expense.dueMonth === 5 ? 'selected' : ''}>Maio</option>
                                <option value="6" ${expense.dueMonth === 6 ? 'selected' : ''}>Junho</option>
                                <option value="7" ${expense.dueMonth === 7 ? 'selected' : ''}>Julho</option>
                                <option value="8" ${expense.dueMonth === 8 ? 'selected' : ''}>Agosto</option>
                                <option value="9" ${expense.dueMonth === 9 ? 'selected' : ''}>Setembro</option>
                                <option value="10" ${expense.dueMonth === 10 ? 'selected' : ''}>Outubro</option>
                                <option value="11" ${expense.dueMonth === 11 ? 'selected' : ''}>Novembro</option>
                                <option value="12" ${expense.dueMonth === 12 ? 'selected' : ''}>Dezembro</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">${buttonText}</button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Renders the fixed expenses list
     * @returns {Promise<string>} List HTML
     */
    async renderList() {
        this.expenses = await this.financeService.getFixedExpenses(this.userId);

        if (this.expenses.length === 0) {
            return this.renderEmptyState('Nenhum gasto fixo cadastrado');
        }

        return `
            <div class="expenses-list">
                ${this.expenses.map(exp => this.renderExpenseCard(exp)).join('')}
            </div>
        `;
    }

    /**
     * Toggles recurrence fields based on selected type
     * @returns {void}
     */
    toggleRecurrenceFields() {
        const recurrenceType = document.getElementById('fixedRecurrenceType').value;
        const dueDayField = document.getElementById('dueDayField');
        const dueMonthField = document.getElementById('dueMonthField');
        const dueDayInput = document.getElementById('fixedDueDay');
        const dueMonthInput = document.getElementById('fixedDueMonth');

        if (recurrenceType === 'monthly') {
            dueDayField.style.display = 'block';
            dueMonthField.style.display = 'none';
            dueDayInput.required = true;
            dueMonthInput.required = false;
        } else {
            dueDayField.style.display = 'none';
            dueMonthField.style.display = 'block';
            dueDayInput.required = false;
            dueMonthInput.required = true;
        }
    }

    /**
     * Renders a fixed expense card
     * @param {Object} expense - Expense to render
     * @returns {string} Card HTML
     */
    renderExpenseCard(expense) {
        return HTMLTemplates.cards.fixedExpense(
            expense,
            'expensesHandler.modules.fixed',
            this.formatMoney.bind(this)
        );
    }

    /**
     * Extracts data from the form
     * @returns {Object} Form data
     */
    getFormData() {
        const recurrenceType = document.getElementById('fixedRecurrenceType').value;
        const data = {
            name: document.getElementById('fixedName').value.trim(),
            value: parseFloat(document.getElementById('fixedValue').value),
            category: document.getElementById('fixedCategory').value,
            recurrenceType: recurrenceType
        };

        if (recurrenceType === 'monthly') {
            data.dueDay = parseInt(document.getElementById('fixedDueDay').value, 10);
            data.dueMonth = null;
        } else {
            data.dueMonth = parseInt(document.getElementById('fixedDueMonth').value, 10);
            data.dueDay = null;
        }

        return data;
    }

    /**
     * Validates form data
     * @param {Object} data - Data to validate
     * @returns {Object} {valid: boolean, message: string}
     */
    validateData(data) {
        if (!data.name || data.name.length === 0) {
            return {
                valid: false,
                message: 'Por favor, informe o nome do gasto.'
            };
        }

        if (!data.value || data.value <= 0) {
            return {
                valid: false,
                message: 'Por favor, informe um valor válido.'
            };
        }

        if (!data.category) {
            return {
                valid: false,
                message: 'Por favor, selecione uma categoria.'
            };
        }

        if (!data.recurrenceType) {
            return {
                valid: false,
                message: 'Por favor, selecione o tipo de recorrência.'
            };
        }

        if (data.recurrenceType === 'monthly') {
            if (!data.dueDay || data.dueDay < 1 || data.dueDay > 31) {
                return {
                    valid: false,
                    message: 'Por favor, informe um dia de vencimento válido (1-31).'
                };
            }
        } else if (data.recurrenceType === 'yearly') {
            if (!data.dueMonth || data.dueMonth < 1 || data.dueMonth > 12) {
                return {
                    valid: false,
                    message: 'Por favor, selecione um mês de vencimento válido.'
                };
            }
        }

        return { valid: true };
    }

    /**
     * Saves or updates a fixed expense
     * @param {Event} event - Submit event
     * @returns {Promise<void>}
     */
    async save(event) {
        event.preventDefault();

        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;

        const data = this.getFormData();

        const validation = this.validateData(data);

        if (!validation.valid) {
            this.showValidation(validation.message);
            this.isProcessing = false;
            return;
        }

        this.showListProcessing();

        try {
            if (this.isEditing()) {
                data.id = this.editingExpense.id;
                this.setCardProcessing(data.id, 'saving');
                await this.financeService.updateFixedExpense(this.userId, data);
                this.showCardSuccess(data.id);
                this.showSuccess('Atualizado!', 'Gasto fixo atualizado com sucesso!');
            } else {
                await this.financeService.saveFixedExpense(this.userId, data);
                this.showSuccess('Sucesso!', 'Gasto fixo adicionado com sucesso!');
            }

            this.resetEditingState();
            this.hideForm();
            this.isProcessing = false;
            this.hideListProcessing();

            setTimeout(async () => {
                this._requestModuleReload();
                this.applySuccessHighlight();
            }, 1200);
        } catch (error) {
            Logger.error('❌ Erro ao salvar gasto fixo:', error);
            this.showError('Erro!', 'Não foi possível salvar o gasto. Tente novamente.');
            this.hideListProcessing();
            if (this.isEditing()) {
                this.clearCardProcessing(data.id);
            }
            this.isProcessing = false;
        }
    }

    /**
     * Edits a fixed expense
     * @param {string} id - Expense ID
     * @returns {void}
     */
    async edit(id) {
        const expense = this.expenses.find(e => e.id === id);
        if (expense) {
            this.setEditingExpense(expense);

            const formContainer = document.querySelector('.finance-form');
            if (formContainer) {
                formContainer.outerHTML = this.renderForm();
                this.showForm();
                this.attachEventListeners();

                const form = document.getElementById('fixedExpenseForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    }

    /**
     * Deletes a fixed expense
     * @param {string} id - Expense ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            const confirmed = await this.showConfirmation(
                'Tem certeza?',
                'Esta ação não poderá ser desfeita.',
                'Sim, excluir'
            );

            if (!confirmed) {
                this.isProcessing = false;
                return;
            }

            this.setCardProcessing(id, 'deleting');

            await this.financeService.deleteFixedExpense(this.userId, id);

            this.showSuccess('Excluído!', 'Gasto fixo removido com sucesso!');

            this.isProcessing = false;

            setTimeout(async () => {
                this._requestModuleReload();
            }, 1200);

        } catch (error) {
            Logger.error('❌ Erro ao excluir gasto fixo:', error);
            this.showError('Erro!', 'Não foi possível excluir o gasto. Tente novamente.');
            this.clearCardProcessing(id);
            this.isProcessing = false;
        }
    }

    /**
     * Deletes all fixed expenses
     * @returns {Promise<void>}
     */
    async deleteAll() {
        if (this.isProcessing) {
            return;
        }

        if (this.expenses.length === 0) {
            this.showInfo('Nenhum registro', 'Não há gastos fixos para excluir.');
            return;
        }

        this.isProcessing = true;

        try {
            const confirmed = await this.showConfirmation(
                'Excluir todos os gastos fixos?',
                `Você está prestes a excluir ${this.expenses.length} registro(s). Esta ação não poderá ser desfeita.`,
                'Sim, excluir todos'
            );

            if (!confirmed) {
                this.isProcessing = false;
                return;
            }

            this.expenses.forEach(exp => this.setCardProcessing(exp.id, 'deleting'));

            const deletePromises = this.expenses.map(exp => 
                this.financeService.deleteFixedExpense(this.userId, exp.id)
            );

            await Promise.all(deletePromises);

            this.showSuccess('Excluídos!', `${this.expenses.length} gasto(s) fixo(s) removido(s) com sucesso!`);

            this.isProcessing = false;

            setTimeout(async () => {
                this._requestModuleReload();
            }, 1200);

        } catch (error) {
            Logger.error('❌ Erro ao excluir gastos fixos:', error);
            this.showError('Erro!', 'Não foi possível excluir os gastos. Tente novamente.');
            this.expenses.forEach(exp => this.clearCardProcessing(exp.id));
            this.isProcessing = false;
        }
    }

    /**
     * Cancels editing
     * @returns {void}
     */
    async cancelEdit() {
        this.resetEditingState();
        this.hideForm();
        this._requestModuleReload();
    }

    /**
     * Marks an expense as paid for the current month/year
     * @param {string} id - Expense ID
     * @returns {Promise<void>}
     */
    async markAsPaid(id) {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.setCardProcessing(id);

            const expense = this.expenses.find(e => e.id === id);
            if (!expense) {
                throw new Error('Gasto não encontrado');
            }

            const isYearly = expense.recurrenceType === 'yearly';
            const updatedExpense = {
                ...expense,
                paidThisMonth: !isYearly ? true : expense.paidThisMonth,
                paidThisYear: isYearly ? true : expense.paidThisYear,
                lastPaidDate: new Date().toISOString()
            };

            const result = await this.financeService.updateFixedExpense(this.userId, updatedExpense);

            if (result) {
                const message = isYearly ? 'Gasto anual marcado como pago!' : 'Gasto marcado como pago!';
                this.showSuccess('Sucesso!', message);
                await this._requestModuleReload();
            } else {
                throw new Error('Falha ao atualizar');
            }

        } catch (error) {
            Logger.error('❌ Erro ao marcar como pago:', error);
            this.showError('Erro!', 'Não foi possível marcar como pago. Tente novamente.');
        } finally {
            this.clearCardProcessing(id);
            this.isProcessing = false;
        }
    }

    /**
     * Unmarks an expense as paid (removes payment)
     * @param {string} id - Expense ID
     * @returns {Promise<void>}
     */
    async unmarkAsPaid(id) {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.setCardProcessing(id);

            const expense = this.expenses.find(e => e.id === id);
            if (!expense) {
                throw new Error('Gasto não encontrado');
            }

            const isYearly = expense.recurrenceType === 'yearly';
            const updatedExpense = {
                ...expense,
                paidThisMonth: !isYearly ? false : expense.paidThisMonth,
                paidThisYear: isYearly ? false : expense.paidThisYear,
                lastPaidDate: null
            };

            const result = await this.financeService.updateFixedExpense(this.userId, updatedExpense);

            if (result) {
                this.showSuccess('Sucesso!', 'Pagamento desmarcado!');
                await this._requestModuleReload();
            } else {
                throw new Error('Falha ao atualizar');
            }

        } catch (error) {
            Logger.error('❌ Erro ao desmarcar pagamento:', error);
            this.showError('Erro!', 'Não foi possível desmarcar o pagamento. Tente novamente.');
        } finally {
            this.clearCardProcessing(id);
            this.isProcessing = false;
        }
    }

    /**
     * Attaches event listeners
     * @returns {void}
     */
    attachEventListeners() {
        const form = document.getElementById('fixedExpenseForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => this.save(e));
        }

        const cancelBtn = document.getElementById('btnCancelEdit');
        if (cancelBtn) {
            const newBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
            newBtn.addEventListener('click', () => this.cancelEdit());
        }
    }

    /**
     * Calculates total fixed expenses
     * @returns {Promise<number>} Total expenses
     */
    async getTotal() {
        return await this.financeService.getTotalFixedExpenses(this.userId);
    }

    /**
     * Calculates total monthly fixed expenses
     * @returns {Promise<number>} Total monthly expenses
     */
    async getTotalMonthly() {
        return await this.financeService.getTotalMonthlyFixedExpenses(this.userId);
    }

    /**
     * Calculates total yearly fixed expenses
     * @returns {Promise<number>} Total yearly expenses
     */
    async getTotalYearly() {
        return await this.financeService.getTotalYearlyFixedExpenses(this.userId);
    }
}
