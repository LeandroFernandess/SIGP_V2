/**
 * @file CreditExpensesModule.js
 * @description Credit card installment purchases management.
 * 
 * Contents:
 * - Installment purchase CRUD
 * - Automatic installment value calculation
 * - End date calculation
 * - Progress tracking (paid installments)
 * 
 * Extends: BaseExpenseModule
 * 
 * Dependencies:
 * - FinanceService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class CreditExpensesModule
 * @extends BaseExpenseModule
 * @description Manages installment credit card expenses
 */
class CreditExpensesModule extends BaseExpenseModule {

    /**
     * Initializes the installment expenses module
     * 
     * @constructor
     * @param {FinanceService} financeService - Financial service
     * @param {number} userId - User ID
     * 
     * @example
     * const module = new CreditExpensesModule(financeService, 12345);
     */
    constructor(financeService, userId) {
        super('creditExpenses', financeService, userId);
        this.setActionKey('credit');
        this.expenses = [];
        this.isProcessing = false;
    }

    /**
     * Renders the credit card expenses form
     * @returns {string} Form HTML
     */
    renderForm() {
        const isEditing = this.isEditing();
        const expense = isEditing ? this.editingExpense : {};
        const buttonText = isEditing ? 'Atualizar Compra' : '+ Adicionar Compra';
        const title = isEditing ? 'Editar Compra Parcelada' : 'Adicionar Gasto no Cartão';

        return `
            <div class="finance-form">
                <h3>${title}</h3>
                <form id="creditExpenseForm">
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="creditName">Nome da Compra</label>
                            <input 
                                type="text" 
                                id="creditName" 
                                placeholder="Ex: Notebook, TV..."
                                value="${expense.name || ''}"
                                required
                            >
                        </div>
                        <div class="form-input-group">
                            <label for="creditValue">Valor Total (R$)</label>
                            <input 
                                type="number" 
                                id="creditValue" 
                                step="0.01"
                                placeholder="0,00"
                                value="${expense.totalValue || ''}"
                                required
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="creditInstallments">Número de Parcelas</label>
                            <input 
                                type="number" 
                                id="creditInstallments" 
                                min="1" 
                                max="48"
                                placeholder="Ex: 12"
                                value="${expense.installments || ''}"
                                required
                            >
                        </div>
                        <div class="form-input-group">
                            <label for="creditDate">Data da Compra</label>
                            <input 
                                type="date" 
                                id="creditDate"
                                value="${expense.purchaseDate || ''}"
                                required
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="creditDueDay">Dia de Vencimento da Fatura</label>
                            <input 
                                type="number" 
                                id="creditDueDay" 
                                min="1" 
                                max="31"
                                placeholder="Ex: 10"
                                value="${expense.dueDay || ''}"
                                required
                            >
                            <small class="form-hint">
                                💡 Dia do mês em que a fatura vence (ex: 10 para dia 10 de cada mês)
                            </small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-input-group">
                            <label for="creditCategory">Categoria</label>
                            <select id="creditCategory" required>
                                <option value="">Selecione...</option>
                                ${this.categories.map(cat =>
            `<option value="${cat}" ${expense.category === cat ? 'selected' : ''}>${cat}</option>`
        ).join('')}
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
     * Renders the credit card expenses list
     * @returns {Promise<string>} List HTML
     */
    async renderList() {
        this.expenses = await this.financeService.getCreditExpenses(this.userId);

        const activeExpenses = this.expenses.filter(exp => new Date(exp.endDate) > new Date());

        if (activeExpenses.length === 0) {
            return this.renderEmptyState('Nenhuma compra parcelada ativa');
        }

        return `
            <div class="expenses-list">
                ${activeExpenses.map(exp => this.renderExpenseCard(exp)).join('')}
            </div>
        `;
    }

    /**
     * Renders a credit card expense card
     * @param {Object} expense - Expense to render
     * @returns {string} Card HTML
     */
    renderExpenseCard(expense) {
        const purchaseDate = new Date(expense.purchaseDate);
        const now = new Date();
        const monthsPaid = this.calculatePaidInstallments(purchaseDate, now, expense.dueDay || 10);
        const remainingInstallments = Math.max(1, expense.installments - monthsPaid);

        return HTMLTemplates.cards.creditExpense({
            expense,
            remainingInstallments,
            handlerPath: 'expensesHandler.modules.credit',
            formatMoney: this.formatMoney.bind(this),
            formatDate: this.formatDate.bind(this)
        });
    }

    /**
     * Extracts data from the form
     * @returns {Object} Form data
     */
    getFormData() {
        return {
            name: document.getElementById('creditName').value.trim(),
            totalValue: parseFloat(document.getElementById('creditValue').value),
            installments: parseInt(document.getElementById('creditInstallments').value, 10),
            purchaseDate: document.getElementById('creditDate').value,
            category: document.getElementById('creditCategory').value,
            dueDay: parseInt(document.getElementById('creditDueDay').value, 10)
        };
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
                message: 'Por favor, informe o nome da compra.'
            };
        }

        if (!data.totalValue || data.totalValue <= 0) {
            return {
                valid: false,
                message: 'Por favor, informe um valor válido.'
            };
        }

        if (!data.installments || data.installments < 1 || data.installments > 48) {
            return {
                valid: false,
                message: 'Por favor, informe um número de parcelas válido (1-48).'
            };
        }

        if (!data.purchaseDate) {
            return {
                valid: false,
                message: 'Por favor, informe a data da compra.'
            };
        }

        if (!data.category) {
            return {
                valid: false,
                message: 'Por favor, selecione uma categoria.'
            };
        }

        if (!data.dueDay || data.dueDay < 1 || data.dueDay > 31) {
            return {
                valid: false,
                message: 'Por favor, informe um dia de vencimento válido (1-31).'
            };
        }

        return { valid: true };
    }

    /**
     * Saves or updates a credit card expense
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
                await this.financeService.updateCreditExpense(this.userId, data);
                this.showCardSuccess(data.id);
                this.showSuccess('Atualizado!', 'Compra parcelada atualizada com sucesso!');
            } else {
                await this.financeService.saveCreditExpense(this.userId, data);
                this.showSuccess('Sucesso!', 'Compra parcelada adicionada com sucesso!');
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
            Logger.error('❌ Erro ao salvar gasto de cartão:', error);
            this.showError('Erro!', 'Não foi possível salvar a compra. Tente novamente.');
            this.hideListProcessing();
            if (this.isEditing()) {
                this.clearCardProcessing(data.id);
            }
            this.isProcessing = false;
        }
    }

    /**
     * Edits a credit card expense
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

                const form = document.getElementById('creditExpenseForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    }

    /**
     * Deletes a credit card expense
     * @param {string} id - Expense ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;

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

        try {
            await this.financeService.deleteCreditExpense(this.userId, id);
            this.showSuccess('Excluído!', 'Compra parcelada removida com sucesso!');
            this.isProcessing = false;

            setTimeout(async () => {
                this._requestModuleReload();
            }, 1200);
        } catch (error) {
            Logger.error('❌ Erro ao excluir gasto de cartão:', error);
            this.showError('Erro!', 'Não foi possível excluir a compra. Tente novamente.');
            this.clearCardProcessing(id);
            this.isProcessing = false;
        }
    }

    /**
     * Deletes all credit card expenses
     * @returns {Promise<void>}
     */
    async deleteAll() {
        if (this.isProcessing) {
            return;
        }

        if (this.expenses.length === 0) {
            this.showInfo('Nenhum registro', 'Não há compras parceladas para excluir.');
            return;
        }

        this.isProcessing = true;

        try {
            const confirmed = await this.showConfirmation(
                'Excluir todas as compras parceladas?',
                `Você está prestes a excluir ${this.expenses.length} registro(s). Esta ação não poderá ser desfeita.`,
                'Sim, excluir todos'
            );

            if (!confirmed) {
                this.isProcessing = false;
                return;
            }

            this.expenses.forEach(exp => this.setCardProcessing(exp.id, 'deleting'));

            const deletePromises = this.expenses.map(exp => 
                this.financeService.deleteCreditExpense(this.userId, exp.id)
            );

            await Promise.all(deletePromises);

            this.showSuccess('Excluídos!', `${this.expenses.length} compra(s) parcelada(s) removida(s) com sucesso!`);

            this.isProcessing = false;

            setTimeout(async () => {
                this._requestModuleReload();
            }, 1200);

        } catch (error) {
            Logger.error('❌ Erro ao excluir gastos de cartão:', error);
            this.showError('Erro!', 'Não foi possível excluir as compras. Tente novamente.');
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
     * Attaches event listeners
     * @returns {void}
     */
    attachEventListeners() {
        const form = document.getElementById('creditExpenseForm');
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
     * Calculates monthly total of credit card expenses
     * @returns {Promise<number>} Monthly total
     */
    async getTotal() {
        return await this.financeService.getTotalCreditExpenses(this.userId);
    }

    /**
     * Marks an expense as paid for the current month
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

            const updatedExpense = {
                ...expense,
                paidThisMonth: true,
                lastPaidDate: new Date().toISOString()
            };

            const result = await this.financeService.updateCreditExpense(this.userId, updatedExpense);

            if (result) {
                this.showSuccess('Sucesso!', 'Parcela marcada como paga!');
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

            const updatedExpense = {
                ...expense,
                paidThisMonth: false,
                lastPaidDate: null
            };

            const result = await this.financeService.updateCreditExpense(this.userId, updatedExpense);

            if (result) {
                this.showSuccess('Sucesso!', 'Pagamento removido!');
                await this._requestModuleReload();
            } else {
                throw new Error('Falha ao atualizar');
            }

        } catch (error) {
            Logger.error('❌ Erro ao desmarcar pagamento:', error);
            this.showError('Erro!', 'Não foi possível desmarcar. Tente novamente.');
        } finally {
            this.clearCardProcessing(id);
            this.isProcessing = false;
        }
    }

    /**
     * Calculates how many installments were paid based on invoice due day
     * @param {Date} purchaseDate - Purchase date
     * @param {Date} currentDate - Current date
     * @param {number} dueDay - Invoice due day (1-31)
     * @returns {number} Number of paid installments
     */
    calculatePaidInstallments(purchaseDate, currentDate, dueDay) {
        const purchase = new Date(purchaseDate);
        const today = new Date(currentDate);

        let firstDueDate = new Date(purchase.getFullYear(), purchase.getMonth(), dueDay);

        if (purchase.getDate() > dueDay) {
            firstDueDate.setMonth(firstDueDate.getMonth() + 1);
        }

        if (today < firstDueDate) {
            return 0;
        }

        let monthsPassed = 0;
        let checkDate = new Date(firstDueDate);

        while (checkDate <= today) {
            monthsPassed++;
            checkDate.setMonth(checkDate.getMonth() + 1);
        }

        return monthsPassed;
    }
}
