/**
 * @file FinanceService.js
 * @description Service layer for financial data operations with Firebase.
 * 
 * Manages:
 * - Monthly income (single document per user)
 * - Fixed expenses (recurring monthly expenses)
 * - Credit card expenses (installment purchases)
 * 
 * Features:
 * - Local caching to minimize Firebase reads
 * - CRUD operations for all financial entities
 * - Automatic cache invalidation on writes
 * 
 * Dependencies: FirebaseDataService
 * Used by: ExpensesPageHandler, IncomePageHandler, ReportPageHandler
 * 
 * @author Leandro Fialho Fernandes
 */

import { FirebaseDataService } from '../core/firebaseDataService.js';

/**
 * @class FinanceService
 * @description Service for managing financial data with Firebase
 */
export class FinanceService {

    constructor() {
        this.collections = {
            income: 'income',
            fixedExpenses: 'fixedExpenses',
            creditExpenses: 'creditExpenses'
        };

        this.cache = {
            income: null,
            fixedExpenses: [],
            creditExpenses: []
        };

        this.loaded = {
            income: false,
            fixedExpenses: false,
            creditExpenses: false
        };
    }

    /**
     * @description Saves monthly income to Firestore (single document per user)
     * @param {string} userId - User ID (kept for compatibility, Firebase uses auth.currentUser)
     * @param {Object} incomeData - Income data
     * @param {number} incomeData.value - Monthly income value in BRL
     * @param {string} [incomeData.updatedAt] - Update date (generated automatically)
     * @returns {Promise<string>} Saved document ID (always 'userIncome')
     * @throws {Error} If there's an error saving to Firestore
     * 
     * @example
     * const docId = await service.saveIncome(userId, { value: 5000 });
     */
    async saveIncome(userId, incomeData) {
        try {
            const docId = await FirebaseDataService.saveDocument(
                this.collections.income,
                incomeData,
                'userIncome'
            );

            this.cache.income = { ...incomeData, id: docId };
            this.loaded.income = true;

            return docId;
        } catch (error) {
            Logger.error('❌ Erro ao salvar renda:', error);
            throw error;
        }
    }

    /**
     * @description Gets monthly income from Firestore with caching system
     * @param {string} userId - User ID (kept for compatibility)
     * @returns {Promise<Object|null>} Income object with:
     *   - id: string - Always 'userIncome'
     *   - value: number - Monthly income value
     *   - updatedAt: string - Last update date
     * Returns null if no income is registered
     * 
     * @example
     * const income = await service.getIncome(userId);
     * if (income) console.log(`Income: R$ ${income.value}`);
     */
    async getIncome(userId) {
        try {
            if (this.loaded.income) {
                return this.cache.income;
            }

            const incomes = await FirebaseDataService.getCollectionDocuments(
                this.collections.income
            );

            this.cache.income = incomes.find(i => i.id === 'userIncome') || null;
            this.loaded.income = true;

            return this.cache.income;
        } catch (error) {
            Logger.error('❌ Erro ao buscar renda:', error);
            this.loaded.income = false;
            return null;
        }
    }

    /**
     * @description Saves a new fixed expense to Firestore
     * @param {string} userId - User ID
     * @param {Object} expense - Fixed expense data
     * @param {string} expense.name - Expense name (e.g., 'Rent', 'Electricity')
     * @param {number} expense.value - Monthly expense value
     * @param {string} expense.category - Expense category
     * @param {string} [expense.dueDay] - Due day (1-31)
     * @param {string} [expense.description] - Additional description
     * @returns {Promise<Object>} Saved expense with generated ID. Contains:
     *   - id: string - Firestore document ID
     *   - name: string - Expense name
     *   - value: number - Monthly value
     *   - category: string - Category
     *   - createdAt: string - Creation date
     * @throws {Error} If there's an error saving to Firestore
     * 
     * @example
     * const expense = await service.saveFixedExpense(userId, {
     *   name: 'Rent',
     *   value: 1200,
     *   category: 'housing'
     * });
     */
    async saveFixedExpense(userId, expense) {
        try {
            const expenseData = {
                ...expense,
                createdAt: new Date().toISOString()
            };

            const docId = await FirebaseDataService.saveDocument(
                this.collections.fixedExpenses,
                expenseData
            );

            const savedExpense = { ...expenseData, id: docId };

            this.cache.fixedExpenses.push(savedExpense);

            return savedExpense;
        } catch (error) {
            Logger.error('❌ Erro ao salvar gasto fixo:', error);
            throw error;
        }
    }

    /**
     * @description Gets all fixed expenses for the user with caching system
     * @param {string} userId - User ID
     * @returns {Promise<Array<Object>>} Array of fixed expenses. Each expense contains:
     *   - id: string - Document ID
     *   - name: string - Expense name
     *   - value: number - Monthly value
     *   - category: string - Category
     *   - dueDay: string - Due day
     *   - createdAt: string - Creation date
     * 
     * @example
     * const expenses = await service.getFixedExpenses(userId);
     * const total = expenses.reduce((sum, e) => sum + e.value, 0);
     */
    async getFixedExpenses(userId) {
        try {
            if (this.loaded.fixedExpenses) {               
                await this.checkAndResetMonthlyPayments(userId);
                return this.cache.fixedExpenses;
            }

            const expenses = await FirebaseDataService.getCollectionDocuments(
                this.collections.fixedExpenses
            );

            this.cache.fixedExpenses = expenses || [];
            this.loaded.fixedExpenses = true;

            await this.checkAndResetMonthlyPayments(userId);

            return this.cache.fixedExpenses;
        } catch (error) {
            Logger.error('❌ Erro ao buscar gastos fixos:', error);
            this.loaded.fixedExpenses = false;
            return [];
        }
    }

    /**
     * @description Removes a fixed expense from Firestore and updates cache
     * @param {string} userId - User ID
     * @param {string} expenseId - ID of the expense to remove
     * @returns {Promise<void>}
     * @throws {Error} If there's an error deleting from Firestore
     * 
     * @example
     * await service.deleteFixedExpense(userId, 'expense123');
     */
    async deleteFixedExpense(userId, expenseId) {
        try {
            await FirebaseDataService.deleteDocument(
                this.collections.fixedExpenses,
                expenseId
            );

            this.cache.fixedExpenses = this.cache.fixedExpenses.filter(
                e => e.id !== expenseId
            );
        } catch (error) {
            Logger.error('❌ Erro ao remover gasto fixo:', error);
            throw error;
        }
    }

    /**
     * @description Updates an existing fixed expense in Firestore
     * @param {string} userId - User ID
     * @param {Object} updatedExpense - Updated expense data
     * @param {string} updatedExpense.id - ID of the expense to update (required)
     * @param {string} [updatedExpense.name] - New name
     * @param {number} [updatedExpense.value] - New value
     * @param {string} [updatedExpense.category] - New category
     * @returns {Promise<Object|null>} Updated expense with timestamp or null if failed
     * 
     * @example
     * const updated = await service.updateFixedExpense(userId, {
     *   id: 'expense123',
     *   value: 1300 // Rent increased
     * });
     */
    async updateFixedExpense(userId, updatedExpense) {
        try {
            const expenseData = {
                ...updatedExpense,
                updatedAt: new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.fixedExpenses,
                expenseData,
                updatedExpense.id
            );

            const index = this.cache.fixedExpenses.findIndex(
                e => e.id === updatedExpense.id
            );
            if (index !== -1) {
                this.cache.fixedExpenses[index] = expenseData;
            }

            return expenseData;
        } catch (error) {
            Logger.error('❌ Erro ao atualizar gasto fixo:', error);
            return null;
        }
    }

    /**
     * @description Saves a credit card expense with automatic installment calculation
     * @param {string} userId - User ID
     * @param {Object} expense - Credit card expense data
     * @param {string} expense.name - Purchase name
     * @param {number} expense.totalValue - Total purchase value
     * @param {number} expense.installments - Number of installments
     * @param {string} expense.purchaseDate - Purchase date (ISO 8601)
     * @param {string} expense.category - Expense category
     * @param {string} [expense.description] - Additional description
     * @returns {Promise<Object>} Saved expense with automatic calculations:
     *   - id: string - Document ID
     *   - installmentValue: number - Calculated installment value
     *   - endDate: string - Calculated installment end date
     *   - createdAt: string - Creation date
     * @throws {Error} If there's an error saving to Firestore
     * 
     * @example
     * const expense = await service.saveCreditExpense(userId, {
     *   name: 'Notebook',
     *   totalValue: 3000,
     *   installments: 10,
     *   purchaseDate: '2025-01-15',
     *   category: 'eletrônicos'
     * });
     * // Retorna: { ...expense, installmentValue: 300, endDate: '2025-11-15' }
     */
    async saveCreditExpense(userId, expense) {
        try {
            const installmentValue = expense.totalValue / expense.installments;

            const startDate = new Date(expense.purchaseDate);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + expense.installments);

            const expenseData = {
                ...expense,
                installmentValue,
                endDate: endDate.toISOString(),
                createdAt: new Date().toISOString()
            };

            const docId = await FirebaseDataService.saveDocument(
                this.collections.creditExpenses,
                expenseData
            );

            const savedExpense = { ...expenseData, id: docId };

            this.cache.creditExpenses.push(savedExpense);

            return savedExpense;
        } catch (error) {
            Logger.error('❌ Erro ao salvar gasto de cartão:', error);
            throw error;
        }
    }

    /**
     * @description Gets all credit card expenses with caching system
     * @param {string} userId - User ID
     * @returns {Promise<Array<Object>>} Array of credit card expenses. Each expense contains:
     *   - id: string - Document ID
     *   - name: string - Purchase name
     *   - totalValue: number - Total value
     *   - installments: number - Number of installments
     *   - installmentValue: number - Installment value
     *   - purchaseDate: string - Purchase date
     *   - endDate: string - End date
     *   - category: string - Category
     * 
     * @example
     * const creditExpenses = await service.getCreditExpenses(userId);
     */
    async getCreditExpenses(userId) {
        try {
            if (this.loaded.creditExpenses) {
                return this.cache.creditExpenses;
            }

            const expenses = await FirebaseDataService.getCollectionDocuments(
                this.collections.creditExpenses
            );

            this.cache.creditExpenses = expenses || [];
            this.loaded.creditExpenses = true;
            // Verificar e resetar pagamentos se mudou o mês
            await this.checkAndResetMonthlyPayments(userId);
            return this.cache.creditExpenses;
        } catch (error) {
            Logger.error('❌ Erro ao buscar gastos de cartão:', error);
            this.loaded.creditExpenses = false;
            return [];
        }
    }

    /**
     * @description Removes a credit card expense from Firestore and updates cache
     * @param {string} userId - User ID
     * @param {string} expenseId - ID of the expense to remove
     * @returns {Promise<void>}
     * @throws {Error} If there's an error deleting from Firestore
     * 
     * @example
     * await service.deleteCreditExpense(userId, 'credit123');
     */
    async deleteCreditExpense(userId, expenseId) {
        try {
            await FirebaseDataService.deleteDocument(
                this.collections.creditExpenses,
                expenseId
            );

            this.cache.creditExpenses = this.cache.creditExpenses.filter(
                e => e.id !== expenseId
            );
        } catch (error) {
            Logger.error('❌ Erro ao remover gasto de cartão:', error);
            throw error;
        }
    }

    /**
     * @description Updates an existing credit card expense with automatic recalculation
     * @param {string} userId - User ID
     * @param {Object} updatedExpense - Updated expense data
     * @param {string} updatedExpense.id - ID of the expense to update (required)
     * @param {number} [updatedExpense.totalValue] - New total value
     * @param {number} [updatedExpense.installments] - New number of installments
     * @param {string} [updatedExpense.purchaseDate] - New purchase date
     * @returns {Promise<Object|null>} Updated expense with recalculations or null if failed
     * 
     * @example
     * const updated = await service.updateCreditExpense(userId, {
     *   id: 'credit123',
     *   totalValue: 3500, // Adjusted value
     *   installments: 12  // More installments
     * });
     * // Automatically recalculates installmentValue and endDate
     */
    async updateCreditExpense(userId, updatedExpense) {
        try {
            const installmentValue = updatedExpense.totalValue / updatedExpense.installments;

            const startDate = new Date(updatedExpense.purchaseDate);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + updatedExpense.installments);

            const expenseData = {
                ...updatedExpense,
                installmentValue,
                endDate: endDate.toISOString(),
                updatedAt: new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.creditExpenses,
                expenseData,
                updatedExpense.id
            );

            const index = this.cache.creditExpenses.findIndex(
                e => e.id === updatedExpense.id
            );
            if (index !== -1) {
                this.cache.creditExpenses[index] = expenseData;
            }

            return expenseData;
        } catch (error) {
            Logger.error('❌ Erro ao atualizar gasto de cartão:', error);
            return null;
        }
    }

    /**
     * @description Calculates the monthly total of all fixed expenses
     * @param {string} userId - User ID
     * @returns {Promise<number>} Total sum of fixed expenses in BRL
     * 
     * @example
     * const total = await service.getTotalFixedExpenses(userId);
     * console.log(`Fixed total: R$ ${total.toFixed(2)}`);
     */
    async getTotalFixedExpenses(userId) {
        const expenses = await this.getFixedExpenses(userId);
        return expenses.reduce((sum, exp) => sum + parseFloat(exp.value), 0);
    }

    /**
     * @description Calculates total monthly fixed expenses only
     * @param {string} userId - User ID
     * @returns {Promise<number>} Sum of monthly fixed expenses in BRL
     */
    async getTotalMonthlyFixedExpenses(userId) {
        const expenses = await this.getFixedExpenses(userId);
        return expenses
            .filter(exp => exp.recurrenceType === 'monthly')
            .reduce((sum, exp) => sum + parseFloat(exp.value), 0);
    }

    /**
     * @description Calculates total yearly fixed expenses only
     * @param {string} userId - User ID
     * @returns {Promise<number>} Sum of yearly fixed expenses in BRL
     */
    async getTotalYearlyFixedExpenses(userId) {
        const expenses = await this.getFixedExpenses(userId);
        return expenses
            .filter(exp => exp.recurrenceType === 'yearly')
            .reduce((sum, exp) => sum + parseFloat(exp.value), 0);
    }

    /**
     * @description Calculates monthly total of active credit card installments
     * 
     * Only considers expenses whose endDate is after current date,
     * summing only the monthly installment value (not the total value).
     * 
     * @param {string} userId - User ID
     * @returns {Promise<number>} Sum of active monthly installments in BRL
     * 
     * @example
     * const monthlyCredit = await service.getTotalCreditExpenses(userId);
     * console.log(`Monthly installments: R$ ${monthlyCredit.toFixed(2)}`);
     */
    async getTotalCreditExpenses(userId) {
        const expenses = await this.getCreditExpenses(userId);
        const now = new Date();

        return expenses
            .filter(exp => new Date(exp.endDate) > now)
            .reduce((sum, exp) => sum + parseFloat(exp.installmentValue), 0);
    }

    /**
     * @description Aggregates monthly expenses by category (fixed + active credit)
     * 
     * Combines fixed expenses and active credit card installments, grouping by category.
     * Useful for chart visualizations and expense distribution analysis.
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Object with categories as keys and totals as values
     * 
     * @example
     * const byCategory = await service.getExpensesByCategory(userId);
     * // Returns: { housing: 1200, transport: 450, food: 800, ... }
     * 
     * // Usage in chart
     * const labels = Object.keys(byCategory);
     * const values = Object.values(byCategory);
     */
    async getExpensesByCategory(userId) {
        const fixed = await this.getFixedExpenses(userId);
        const credit = await this.getCreditExpenses(userId);
        const now = new Date();

        const categories = {};

        fixed.forEach(exp => {
            if (!categories[exp.category]) {
                categories[exp.category] = 0;
            }
            categories[exp.category] += parseFloat(exp.value);
        });

        credit
            .filter(exp => new Date(exp.endDate) > now)
            .forEach(exp => {
                if (!categories[exp.category]) {
                    categories[exp.category] = 0;
                }
                categories[exp.category] += parseFloat(exp.installmentValue);
            });

        return categories;
    }

    /**
     * @description Generates complete and consolidated financial report
     * 
     * Combines income, all expense types, calculates balance and percentages.
     * Main method for financial dashboard and visualizations.
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Complete report containing:
     *   - income: number - Monthly income
     *   - totalFixed: number - Total fixed expenses
     *   - totalCredit: number - Total active installments
     *   - totalExpenses: number - Sum of all expenses
     *   - balance: number - Balance (income - expenses)
     *   - expensesByCategory: Object - Expenses aggregated by category
     *   - expensePercentage: string - Expense percentage over income
     * 
     * @example
     * const report = await service.getFinancialReport(userId);
     * console.log(`Income: R$ ${report.income}`);
     * console.log(`Expenses: R$ ${report.totalExpenses} (${report.expensePercentage}%)`);
     * console.log(`Balance: R$ ${report.balance}`);
     * 
     * // By category
     * Object.entries(report.expensesByCategory).forEach(([cat, val]) => {
     *   console.log(`${cat}: R$ ${val.toFixed(2)}`);
     * });
     */
    async getFinancialReport(userId) {
        const income = await this.getIncome(userId);
        const totalFixed = await this.getTotalFixedExpenses(userId);
        const totalCredit = await this.getTotalCreditExpenses(userId);
        const totalExpenses = totalFixed + totalCredit;
        const balance = income ? income.value - totalExpenses : 0;
        const expensesByCategory = await this.getExpensesByCategory(userId);

        return {
            income: income ? income.value : 0,
            totalFixed,
            totalCredit,
            totalExpenses,
            balance,
            expensesByCategory,
            expensePercentage: income && income.value > 0
                ? (totalExpenses / income.value * 100).toFixed(2)
                : 0
        };
    }

    /**
     * @description Clears all in-memory cache and resets loading flags
     * 
     * Useful when logging out or switching users to prevent data leakage
     * between sessions. Forces reload of all financial data on next operation.
     * 
     * @returns {void}
     * 
     * @example
     * // On logout
     * financeService.clearCache();
     * sessionStorage.clear();
     */
    clearCache() {
        this.cache = {
            income: null,
            fixedExpenses: [],
            creditExpenses: []
        };
        this.loaded = {
            income: false,
            fixedExpenses: false,
            creditExpenses: false
        };
    }

    /**
     * @description Checks whether the month has changed and automatically resets payment statuses
     * 
     * Stores the last checked month in localStorage. When the current month is different,
     * it automatically resets all monthly expenses (paidThisMonth = false) and yearly
     * expenses when the year changes (paidThisYear = false).
     * 
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     * 
     * @example
     * // Automatically called when loading expenses
     * await this.checkAndResetMonthlyPayments(userId);
     */
    async checkAndResetMonthlyPayments(userId) {
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

            const lastCheckedMonth = localStorage.getItem('sigp_lastCheckedMonth');

            if (!lastCheckedMonth || lastCheckedMonth !== currentMonthKey) {
                Logger.info(`🔄 Detectada mudança de mês: ${lastCheckedMonth} → ${currentMonthKey}`);

                const fixedExpensesSnapshot = await FirebaseDataService.getCollectionDocuments(
                    this.collections.fixedExpenses
                );

                const fixedExpensesToUpdate = (fixedExpensesSnapshot || []).filter(expense => {
                    const isMonthly = expense.recurrenceType === 'monthly';
                    const isPaid = expense.paidThisMonth === true;
                    
                    if (isPaid && expense.lastPaidDate) {
                        const paidDate = new Date(expense.lastPaidDate);
                        const paidMonth = paidDate.getMonth() + 1;
                        const paidYear = paidDate.getFullYear();
                        
                        return isMonthly && (paidMonth !== currentMonth || paidYear !== currentYear);
                    }
                    
                    return isMonthly && isPaid;
                });

                const yearlyExpensesToUpdate = (fixedExpensesSnapshot || []).filter(expense => {
                    const isYearly = expense.recurrenceType === 'yearly';
                    const isPaidYear = expense.paidThisYear === true;

                    if (isPaidYear && expense.lastPaidDate) {
                        const paidDate = new Date(expense.lastPaidDate);
                        return isYearly && paidDate.getFullYear() !== currentYear;
                    }

                    return false;
                });

                const creditExpensesSnapshot = await FirebaseDataService.getCollectionDocuments(
                    this.collections.creditExpenses
                );

                const creditExpensesToUpdate = (creditExpensesSnapshot || []).filter(expense => {
                    const isPaid = expense.paidThisMonth === true;
                    
                    if (isPaid && expense.lastPaidDate) {
                        const paidDate = new Date(expense.lastPaidDate);
                        const paidMonth = paidDate.getMonth() + 1;
                        const paidYear = paidDate.getFullYear();
                        
                        return paidMonth !== currentMonth || paidYear !== currentYear;
                    }
                    
                    return isPaid;
                });

                Logger.info(`📋 Resetando ${fixedExpensesToUpdate.length} gastos fixos mensais, ${yearlyExpensesToUpdate.length} anuais e ${creditExpensesToUpdate.length} gastos de crédito`);

                for (const expense of fixedExpensesToUpdate) {
                    const updatedExpense = {
                        ...expense,
                        paidThisMonth: false,
                        lastPaidDate: null
                    };

                    await FirebaseDataService.saveDocument(
                        this.collections.fixedExpenses,
                        updatedExpense,
                        expense.id
                    );

                    const index = this.cache.fixedExpenses.findIndex(e => e.id === expense.id);
                    if (index !== -1) {
                        this.cache.fixedExpenses[index] = updatedExpense;
                    }
                }

                for (const expense of yearlyExpensesToUpdate) {
                    const updatedExpense = {
                        ...expense,
                        paidThisYear: false,
                        lastPaidDate: null
                    };

                    await FirebaseDataService.saveDocument(
                        this.collections.fixedExpenses,
                        updatedExpense,
                        expense.id
                    );

                    const index = this.cache.fixedExpenses.findIndex(e => e.id === expense.id);
                    if (index !== -1) {
                        this.cache.fixedExpenses[index] = updatedExpense;
                    }
                }

                for (const expense of creditExpensesToUpdate) {
                    const updatedExpense = {
                        ...expense,
                        paidThisMonth: false,
                        lastPaidDate: null
                    };

                    await FirebaseDataService.saveDocument(
                        this.collections.creditExpenses,
                        updatedExpense,
                        expense.id
                    );

                    const index = this.cache.creditExpenses.findIndex(e => e.id === expense.id);
                    if (index !== -1) {
                        this.cache.creditExpenses[index] = updatedExpense;
                    }
                }

                localStorage.setItem('sigp_lastCheckedMonth', currentMonthKey);

                const totalReset = fixedExpensesToUpdate.length + yearlyExpensesToUpdate.length + creditExpensesToUpdate.length;
                Logger.info(`✅ Reset de pagamentos concluído para ${currentMonthKey} (${totalReset} contas resetadas)`);
            }

        } catch (error) {
            Logger.error('❌ Erro ao verificar/resetar pagamentos mensais:', error);
        }
    }
}