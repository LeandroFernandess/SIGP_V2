/**
 * @file HTMLTemplates.js
 * @description Centralized HTML template system for reusable UI components.
 * 
 * Contents:
 * - SVG icons (edit, delete, check, plus, close)
 * - Card templates (expense cards, item cards)
 * - Form components (wrappers, input groups, buttons)
 * - State templates (empty states, loading states)
 * 
 * Features:
 * - Single source of truth for UI components
 * - Parameterized templates
 * - Reduces code duplication
 * 
 * Dependencies: None (standalone utility)
 * Used by: All modules for consistent UI rendering
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @description HTMLTemplates utility object with reusable HTML snippets 
 */
const HTMLTemplates = {

    icons: {
        /**
         * Edit/pencil icon
         * @param {number} [size=18] - Icon size
         * @returns {string} SVG HTML
         */
        edit: (size = 18) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `,

        /**
         * Delete/trash icon
         * @param {number} [size=18] - Icon size
         * @returns {string} SVG HTML
         */
        delete: (size = 18) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `,

        /**
         * Check/checkmark icon
         * @param {number} [size=16] - Icon size
         * @returns {string} SVG HTML
         */
        check: (size = 16) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `,

        /**
         * Plus/add icon
         * @param {number} [size=16] - Icon size
         * @returns {string} SVG HTML
         */
        plus: (size = 16) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `,

        /**
         * Close/X icon
         * @param {number} [size=16] - Icon size
         * @returns {string} SVG HTML
         */
        close: (size = 16) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `,

        /**
         * Calendar icon
         * @param {number} [size=16] - Icon size
         * @returns {string} SVG HTML
         */
        calendar: (size = 16) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        `,

        /**
         * Loading spinner icon
         * @param {number} [size=24] - Icon size
         * @returns {string} SVG HTML
         */
        spinner: (size = 24) => `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
        `
    },

    buttons: {
        /**
         * Edit button with icon
         * @param {string} onClick - Click handler
         * @param {string} [title='Editar'] - Button title
         * @returns {string} Button HTML
         */
        edit: (onClick, title = 'Editar') => `
            <button class="btn-edit" onclick="${onClick}" title="${title}">
                ${HTMLTemplates.icons.edit()}
            </button>
        `,

        /**
         * Delete button with icon
         * @param {string} onClick - Click handler
         * @param {string} [title='Excluir'] - Button title
         * @returns {string} Button HTML
         */
        delete: (onClick, title = 'Excluir') => `
            <button class="btn-delete" onclick="${onClick}" title="${title}">
                ${HTMLTemplates.icons.delete()}
            </button>
        `,

        /**
         * Small edit button (for lists)
         * @param {string} onClick - Click handler
         * @param {string} [title='Editar'] - Button title
         * @returns {string} Button HTML
         */
        editSmall: (onClick, title = 'Editar') => `
            <button class="btn-edit-small" onclick="${onClick}" title="${title}">
                ${HTMLTemplates.icons.edit()}
            </button>
        `,

        /**
         * Small delete button (for lists)
         * @param {string} onClick - Click handler
         * @param {string} [title='Excluir'] - Button title
         * @returns {string} Button HTML
         */
        deleteSmall: (onClick, title = 'Excluir') => `
            <button class="btn-delete-small" onclick="${onClick}" title="${title}">
                ${HTMLTemplates.icons.delete()}
            </button>
        `,

        /**
         * Mark as paid button with icon
         * @param {string} onClick - Click handler
         * @param {string} [title='Marcar como pago'] - Button title
         * @returns {string} Button HTML
         */
        markPaid: (onClick, title = 'Marcar como pago') => `
            <button class="btn-mark-paid" onclick="${onClick}" title="${title}">
                ${HTMLTemplates.icons.check()}
            </button>
        `,

        /**
         * Unmark as paid button with icon
         * @param {string} onClick - Click handler
         * @param {string} [title='Desmarcar pagamento'] - Button title
         * @returns {string} Button HTML
         */
        unmarkPaid: (onClick, title = 'Desmarcar pagamento') => `
            <button class="btn-unmark-paid" onclick="${onClick}" title="${title}">
                ${HTMLTemplates.icons.close()}
            </button>
        `,

        /**
         * Action buttons group (edit + delete)
         * @param {Object} actions - { onEdit, onDelete }
         * @param {boolean} [small=false] - Use small buttons
         * @returns {string} Buttons HTML
         */
        actionGroup: (actions, small = false) => {
            const editFn = small ? HTMLTemplates.buttons.editSmall : HTMLTemplates.buttons.edit;
            const deleteFn = small ? HTMLTemplates.buttons.deleteSmall : HTMLTemplates.buttons.delete;

            return `
                <div class="${small ? 'item-actions' : 'expense-actions'}">
                    ${actions.onMarkPaid ? HTMLTemplates.buttons.markPaid(actions.onMarkPaid) : ''}
                    ${actions.onUnmarkPaid ? HTMLTemplates.buttons.unmarkPaid(actions.onUnmarkPaid) : ''}
                    ${editFn(actions.onEdit)}
                    ${deleteFn(actions.onDelete)}
                </div>
            `;
        }
    },

    cards: {
        /**
         * Generic expense card
         * @param {Object} config - Card configuration
         * @param {string} config.title - Card title
         * @param {string} config.category - Category label
         * @param {string} config.value - Formatted value
         * @param {string} config.valueLabel - Value description (e.g., "por mês")
         * @param {string} [config.details] - Additional details HTML
         * @param {Object} config.actions - { onEdit, onDelete }
         * @param {string} [config.extraClass=''] - Additional CSS classes
         * @returns {string} Card HTML
         */
        expense: ({ title, category, value, valueLabel, details = '', actions, extraClass = '' }) => `
            <div class="expense-card base-card accent-card ${extraClass}">
                <div class="expense-info">
                    <h4>${title}</h4>
                    <span class="expense-category">${category}</span>
                    ${details}
                </div>
                <div class="expense-amount">
                    <span class="amount-value">R$ ${value}</span>
                    <span class="amount-label">${valueLabel}</span>
                </div>
                ${HTMLTemplates.buttons.actionGroup(actions)}
            </div>
        `,

        /**
         * Fixed expense card (with due day/month)
         * @param {Object} expense - Expense data
         * @param {string} handlerPath - Path to handler methods (e.g., "expensesHandler.modules.fixed")
         * @param {Function} formatMoney - Money formatter function
         * @returns {string} Card HTML
         */
        fixedExpense: (expense, handlerPath, formatMoney) => {
            const isYearly = expense.recurrenceType === 'yearly';
            const isPaid = isYearly ? expense.paidThisYear : expense.paidThisMonth;
            const paidDate = expense.lastPaidDate ? new Date(expense.lastPaidDate).toLocaleDateString('pt-BR') : null;
            const extraClass = isPaid ? 'paid-expense' : '';
            
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            
            let dueInfo = '';
            let valueLabel = '';
            let recurrenceIcon = '';
            
            if (isYearly) {
                dueInfo = `🗓️ Vencimento em ${monthNames[expense.dueMonth - 1]}`;
                valueLabel = 'anual';
                recurrenceIcon = 'yearly-expense';
            } else {
                dueInfo = `📅 Vencimento todo dia ${expense.dueDay}`;
                valueLabel = 'por mês';
                recurrenceIcon = 'monthly-expense';
            }

            return HTMLTemplates.cards.expense({
                title: expense.name,
                category: expense.category,
                value: formatMoney(expense.value),
                valueLabel: valueLabel,
                details: `
                    <p class="expense-due">${dueInfo}</p>
                    ${isPaid ? `<p class="expense-paid-status">✅ Marcado como pago em ${paidDate}</p>` : ''}
                `,
                actions: {
                    onMarkPaid: !isPaid ? `${handlerPath}.markAsPaid('${expense.id}')` : null,
                    onUnmarkPaid: isPaid ? `${handlerPath}.unmarkAsPaid('${expense.id}')` : null,
                    onEdit: `${handlerPath}.edit('${expense.id}')`,
                    onDelete: `${handlerPath}.delete('${expense.id}')`
                },
                extraClass: `fixed-expense ${recurrenceIcon} ${extraClass}`
            });
        },

        /**
         * Credit expense card (with installments)
         * @param {Object} config - Configuration
         * @param {Object} config.expense - Expense data
         * @param {number} config.remainingInstallments - Remaining installments
         * @param {string} config.handlerPath - Path to handler methods
         * @param {Function} config.formatMoney - Money formatter
         * @param {Function} config.formatDate - Date formatter
         * @returns {string} Card HTML
         */
        creditExpense: ({ expense, remainingInstallments, handlerPath, formatMoney, formatDate }) => {
            const isPaid = expense.paidThisMonth;
            const paidDate = expense.lastPaidDate ? new Date(expense.lastPaidDate).toLocaleDateString('pt-BR') : null;
            const extraClass = isPaid ? 'paid-expense' : '';

            return HTMLTemplates.cards.expense({
                title: expense.name,
                category: expense.category,
                value: formatMoney(expense.installmentValue),
                valueLabel: 'por mês',
                details: `
                    <p class="expense-installments">
                        <span class="installment-badge">
                            💳 ${remainingInstallments} de ${expense.installments} parcelas restantes
                        </span>
                    </p>
                    <p class="expense-due">📅 Término previsto: ${formatDate(expense.endDate)}</p>
                    <p class="expense-due">🗓️ Vencimento da fatura: Todo dia ${expense.dueDay || 10}</p>
                    ${isPaid ? `<p class="expense-paid-status">✅ Marcado como pago em ${paidDate}</p>` : ''}
                `,
                actions: {
                    onMarkPaid: !isPaid ? `${handlerPath}.markAsPaid('${expense.id}')` : null,
                    onUnmarkPaid: isPaid ? `${handlerPath}.unmarkAsPaid('${expense.id}')` : null,
                    onEdit: `${handlerPath}.edit('${expense.id}')`,
                    onDelete: `${handlerPath}.delete('${expense.id}')`
                },
                extraClass: `credit-expense ${extraClass}`
            });
        }
    },

    forms: {
        /**
         * Form wrapper with title
         * @param {Object} config - Form configuration
         * @param {string} config.id - Form ID
         * @param {string} config.title - Form title
         * @param {string} config.content - Form content HTML
         * @param {string} config.submitText - Submit button text
         * @param {string} [config.cancelText] - Cancel button text (optional)
         * @param {string} [config.onCancel] - Cancel handler (optional)
         * @param {string} [config.className='finance-form'] - CSS class
         * @returns {string} Form HTML
         */
        wrapper: ({ id, title, content, submitText, cancelText, onCancel, className = 'finance-form' }) => `
            <div class="${className}">
                <h3>${title}</h3>
                <form id="${id}">
                    ${content}
                    <div class="form-actions">
                        ${cancelText && onCancel ? `<button type="button" class="btn-secondary" onclick="${onCancel}">${cancelText}</button>` : ''}
                        <button type="submit" class="btn-primary">${submitText}</button>
                    </div>
                </form>
            </div>
        `,

        /**
         * Form row (horizontal group)
         * @param {string} content - Row content HTML
         * @returns {string} Row HTML
         */
        row: (content) => `<div class="form-row">${content}</div>`,

        /**
         * Input group with label
         * @param {Object} config - Input configuration
         * @param {string} config.id - Input ID
         * @param {string} config.label - Label text
         * @param {string} config.type - Input type
         * @param {string} [config.placeholder] - Placeholder text
         * @param {string} [config.value=''] - Default value
         * @param {boolean} [config.required=false] - Is required
         * @param {string} [config.hint] - Help text below input
         * @param {Object} [config.attrs={}] - Additional attributes
         * @returns {string} Input group HTML
         */
        inputGroup: ({ id, label, type, placeholder = '', value = '', required = false, hint, attrs = {} }) => {
            const attrsStr = Object.entries(attrs)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ');

            return `
                <div class="form-input-group">
                    <label for="${id}">${label}</label>
                    <input 
                        type="${type}" 
                        id="${id}" 
                        placeholder="${placeholder}"
                        value="${value}"
                        ${required ? 'required' : ''}
                        ${attrsStr}
                    >
                    ${hint ? `<small class="form-hint">${hint}</small>` : ''}
                </div>
            `;
        },

        /**
         * Select group with label
         * @param {Object} config - Select configuration
         * @param {string} config.id - Select ID
         * @param {string} config.label - Label text
         * @param {Array<{value: string, label: string}>} config.options - Options array
         * @param {string} [config.selected=''] - Selected value
         * @param {boolean} [config.required=false] - Is required
         * @param {string} [config.placeholder='Selecione...'] - Placeholder option
         * @returns {string} Select group HTML
         */
        selectGroup: ({ id, label, options, selected = '', required = false, placeholder = 'Selecione...' }) => `
            <div class="form-input-group">
                <label for="${id}">${label}</label>
                <select id="${id}" ${required ? 'required' : ''}>
                    <option value="">${placeholder}</option>
                    ${options.map(opt =>
            `<option value="${opt.value}" ${selected === opt.value ? 'selected' : ''}>${opt.label}</option>`
        ).join('')}
                </select>
            </div>
        `
    },

    states: {
        /**
         * Empty state message
         * @param {string} message - Message to display
         * @param {string} [icon='📭'] - Icon/emoji
         * @returns {string} Empty state HTML
         */
        empty: (message, icon = '📭') => `
            <div class="empty-state">
                <span class="empty-icon">${icon}</span>
                <p>${message}</p>
            </div>
        `,

        /**
         * Loading state
         * @param {string} [message='Carregando...'] - Loading message
         * @returns {string} Loading HTML
         */
        loading: (message = 'Carregando...') => `
            <div class="loading-state">
                ${HTMLTemplates.icons.spinner()}
                <p>${message}</p>
            </div>
        `,

        /**
         * Error state
         * @param {string} message - Error message
         * @param {string} [retryAction] - Retry button onclick
         * @returns {string} Error HTML
         */
        error: (message, retryAction) => `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <p>${message}</p>
                ${retryAction ? `<button class="btn-secondary" onclick="${retryAction}">Tentar novamente</button>` : ''}
            </div>
        `
    },

    lists: {
        /**
         * Generic list wrapper
         * @param {string} content - List items HTML
         * @param {string} [className='expenses-list'] - CSS class
         * @returns {string} List HTML
         */
        wrapper: (content, className = 'expenses-list') => `
            <div class="${className}">
                ${content}
            </div>
        `,

        /**
         * Render array of items using a template function
         * @param {Array} items - Array of items
         * @param {Function} renderFn - Function to render each item
         * @param {string} [emptyMessage='Nenhum item encontrado'] - Empty state message
         * @returns {string} Rendered list HTML
         */
        render: (items, renderFn, emptyMessage = 'Nenhum item encontrado') => {
            if (!items || items.length === 0) {
                return HTMLTemplates.states.empty(emptyMessage);
            }
            return HTMLTemplates.lists.wrapper(items.map(renderFn).join(''));
        }
    },

    utils: {
        /**
         * Escape HTML to prevent XSS
         * @param {string} str - String to escape
         * @returns {string} Escaped string
         */
        escapeHtml: (str) => {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Conditionally render content
         * @param {boolean} condition - Condition to check
         * @param {string|Function} content - Content to render (or function returning content)
         * @param {string} [fallback=''] - Fallback if condition is false
         * @returns {string} Rendered content or fallback
         */
        when: (condition, content, fallback = '') => {
            if (!condition) return fallback;
            return typeof content === 'function' ? content() : content;
        }
    }
};

if (typeof window !== 'undefined') {
    window.HTMLTemplates = HTMLTemplates;
}
