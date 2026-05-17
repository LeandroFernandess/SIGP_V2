/**
 * @file RemindersModule.js
 * @description Periodic reminders (dentist, car inspection, recurring maintenance).
 * The user records the last execution date and an interval expressed as a
 * number plus unit (days/weeks/months/years). The module computes the next
 * due date and, when it lands on a weekend or Brazilian national holiday,
 * pushes the date forward to the next business day.
 *
 * Extends: BasePersonalModule
 *
 * @author Leandro Fialho Fernandes
 */

class RemindersModule extends BasePersonalModule {

    constructor(personalDataService) {
        super(personalDataService, 'reminders');
        this._holidayCache = new Map();
    }

    /* ============================================================================
       RENDER
       ============================================================================ */

    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnReminders" onclick="personalHandler.modules.reminders.showForm()">
                        + Novo Lembrete
                    </button>
                </div>

                ${this.renderForm()}

                <div id="remindersList" class="reminders-grid"></div>
            </div>
        `;
    }

    renderForm() {
        return `
            <div id="remindersForm" class="personal-form">
                <h4 id="remindersFormTitle">Novo Lembrete</h4>

                <div class="form-row">
                    <div class="form-input-group">
                        <label>Nome do serviço *</label>
                        <input type="text" id="reminderTitle"
                               placeholder="Ex: Dentista, Revisão do carro" maxlength="120">
                    </div>
                    <div class="form-input-group">
                        <label>Categoria</label>
                        <select id="reminderCategory">
                            <option value="Saúde">Saúde</option>
                            <option value="Veículo">Veículo</option>
                            <option value="Casa">Casa</option>
                            <option value="Documentos">Documentos</option>
                            <option value="Pessoal">Pessoal</option>
                            <option value="Outros" selected>Outros</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-input-group">
                        <label>Data em que foi feito *</label>
                        <input type="date" id="reminderLastDoneDate">
                    </div>
                    <div class="form-input-group">
                        <label>Intervalo *</label>
                        <div class="reminder-interval-row">
                            <input type="number" id="reminderIntervalValue"
                                   placeholder="Ex: 6" inputmode="numeric" min="1" step="1">
                            <select id="reminderIntervalUnit">
                                <option value="days">dias</option>
                                <option value="weeks">semanas</option>
                                <option value="months" selected>meses</option>
                                <option value="years">anos</option>
                            </select>
                        </div>
                        <small class="form-hint">
                            A próxima data sempre cai em dia útil (pula fins de semana e feriados nacionais).
                        </small>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-input-group">
                        <label>Observações</label>
                        <textarea id="reminderNotes" rows="3"
                                  placeholder="Notas adicionais sobre este lembrete..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.reminders.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.reminders.save()">Salvar Lembrete</button>
                </div>
            </div>
        `;
    }

    /* ============================================================================
       FORM PIPELINE
       ============================================================================ */

    getFormData() {
        const intervalValueRaw = (document.getElementById('reminderIntervalValue')?.value || '').replace(/\D/g, '');
        const intervalValue = parseInt(intervalValueRaw, 10);

        const lastDoneDate = (document.getElementById('reminderLastDoneDate')?.value || '').trim();
        const intervalUnit = document.getElementById('reminderIntervalUnit')?.value || 'months';

        const data = {
            title: (document.getElementById('reminderTitle')?.value || '').trim(),
            category: document.getElementById('reminderCategory')?.value || 'Outros',
            lastDoneDate,
            intervalValue: Number.isFinite(intervalValue) && intervalValue > 0 ? intervalValue : 0,
            intervalUnit,
            notes: (document.getElementById('reminderNotes')?.value || '').trim()
        };

        if (data.lastDoneDate && data.intervalValue > 0) {
            const computed = this._calculateNextDate(data.lastDoneDate, data.intervalValue, data.intervalUnit);
            data.nextDueDate = computed.rawDate;
            data.adjustedNextDueDate = computed.adjustedDate;
        } else {
            data.nextDueDate = '';
            data.adjustedNextDueDate = '';
        }

        return data;
    }

    validateForm(data) {
        if (!data.title) {
            this.showValidation('Informe o nome do serviço');
            return false;
        }
        if (!data.lastDoneDate) {
            this.showValidation('Informe a data em que o serviço foi feito');
            return false;
        }
        if (!data.intervalValue || data.intervalValue < 1) {
            this.showValidation('Informe um intervalo válido (mínimo 1)');
            return false;
        }
        if (!['days', 'weeks', 'months', 'years'].includes(data.intervalUnit)) {
            this.showValidation('Selecione uma unidade de intervalo válida');
            return false;
        }
        return true;
    }

    fillForm(item) {
        const titleEl = document.getElementById('reminderTitle');
        const categoryEl = document.getElementById('reminderCategory');
        const lastDoneEl = document.getElementById('reminderLastDoneDate');
        const intervalValueEl = document.getElementById('reminderIntervalValue');
        const intervalUnitEl = document.getElementById('reminderIntervalUnit');
        const notesEl = document.getElementById('reminderNotes');
        const formTitle = document.getElementById('remindersFormTitle');

        if (titleEl) titleEl.value = item.title || '';
        if (categoryEl) categoryEl.value = item.category || 'Outros';
        if (lastDoneEl) lastDoneEl.value = item.lastDoneDate || '';
        if (intervalValueEl) intervalValueEl.value = item.intervalValue || '';
        if (intervalUnitEl) intervalUnitEl.value = item.intervalUnit || 'months';
        if (notesEl) notesEl.value = item.notes || '';
        if (formTitle) formTitle.textContent = 'Editar Lembrete';
    }

    clearForm() {
        super.clearForm();
        const intervalUnit = document.getElementById('reminderIntervalUnit');
        if (intervalUnit) intervalUnit.value = 'months';
        const categoryEl = document.getElementById('reminderCategory');
        if (categoryEl) categoryEl.value = 'Outros';
        const formTitle = document.getElementById('remindersFormTitle');
        if (formTitle) formTitle.textContent = 'Novo Lembrete';
    }

    /* ============================================================================
       LIST RENDERING
       ============================================================================ */

    renderList() {
        const container = document.getElementById('remindersList');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const ordered = [...this.items].sort((a, b) => {
            const da = a.adjustedNextDueDate || a.nextDueDate || '';
            const db = b.adjustedNextDueDate || b.nextDueDate || '';
            return da.localeCompare(db);
        });

        container.innerHTML = ordered.map(item => this.renderItem(item)).join('');
    }

    renderItem(item) {
        const title = DataGuard.escapeHtml(item.title || '');
        const category = DataGuard.escapeHtml(item.category || 'Outros');
        const notes = DataGuard.escapeHtml(item.notes || '');
        const lastDone = this._formatDate(item.lastDoneDate);
        const nextDue = this._formatDate(item.adjustedNextDueDate || item.nextDueDate);
        const interval = this._formatInterval(item.intervalValue, item.intervalUnit);
        const status = this._getStatus(item);

        const wasAdjusted = item.nextDueDate
            && item.adjustedNextDueDate
            && item.nextDueDate !== item.adjustedNextDueDate;

        const adjustmentBadge = wasAdjusted
            ? `<span class="reminder-adjusted" title="Data original (${this._formatDate(item.nextDueDate)}) caiu em fim de semana ou feriado">Ajustado</span>`
            : '';

        return `
            <div class="item-card reminder-card reminder-${status.key}" data-id="${item.id}">
                <div class="reminder-card-header">
                    <div class="reminder-card-title">
                        <h4>${title}</h4>
                        <span class="reminder-category">${category}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-mark-paid" title="Marcar como feito hoje"
                                onclick="personalHandler.modules.reminders.markDoneToday('${item.id}')">
                            ${HTMLTemplates.icons.check(16)}
                        </button>
                        ${HTMLTemplates.buttons.editSmall(`personalHandler.modules.reminders.edit('${item.id}')`)}
                        ${HTMLTemplates.buttons.deleteSmall(`personalHandler.modules.reminders.delete('${item.id}')`)}
                    </div>
                </div>

                <div class="reminder-dates">
                    <div class="reminder-date-row">
                        <span class="reminder-date-label">Última realização</span>
                        <span class="reminder-date-value">${lastDone}</span>
                    </div>
                    <div class="reminder-date-row">
                        <span class="reminder-date-label">Intervalo</span>
                        <span class="reminder-date-value">${interval}</span>
                    </div>
                    <div class="reminder-date-row reminder-date-next">
                        <span class="reminder-date-label">Próxima data</span>
                        <span class="reminder-date-value">${nextDue} ${adjustmentBadge}</span>
                    </div>
                </div>

                <div class="reminder-status-row">
                    <span class="reminder-status reminder-status-${status.key}">${status.label}</span>
                </div>

                ${notes ? `<div class="reminder-notes">${notes.replace(/\n/g, '<br>')}</div>` : ''}
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon" aria-hidden="true">
                    ${HTMLTemplates.icons.calendar(40)}
                </span>
                <p>Nenhum lembrete cadastrado</p>
                <small>Clique em "Novo Lembrete" para começar</small>
            </div>
        `;
    }

    /* ============================================================================
       ACTIONS
       ============================================================================ */

    /**
     * Updates lastDoneDate to today, recomputes the next due date and
     * persists the change. Used by the "Marcar como feito hoje" button.
     * @param {string} itemId
     */
    async markDoneToday(itemId) {
        try {
            const item = this.items.find(i => i.id === itemId);
            if (!item) {
                this.showError('Lembrete não encontrado');
                return;
            }

            const today = this._toIsoDate(new Date());
            const computed = this._calculateNextDate(today, item.intervalValue, item.intervalUnit);

            const updated = {
                ...item,
                lastDoneDate: today,
                nextDueDate: computed.rawDate,
                adjustedNextDueDate: computed.adjustedDate,
                updatedAt: new Date().toISOString()
            };

            await this.personalDataService.update(this.moduleName, itemId, updated);
            this.showSuccess('Marcado como feito hoje');
            await this.loadAndRender();
        } catch (error) {
            Logger.error('Erro ao marcar lembrete como feito:', error);
            this.showError('Erro ao atualizar lembrete');
        }
    }

    /* ============================================================================
       DATE HELPERS
       ============================================================================ */

    /**
     * Calculates the raw next due date and the business-day-adjusted version.
     * @param {string} lastDoneDateIso - YYYY-MM-DD
     * @param {number} intervalValue
     * @param {string} intervalUnit - 'days' | 'weeks' | 'months' | 'years'
     * @returns {{rawDate: string, adjustedDate: string}}
     */
    _calculateNextDate(lastDoneDateIso, intervalValue, intervalUnit) {
        const base = this._parseIsoDate(lastDoneDateIso);
        if (!base) return { rawDate: '', adjustedDate: '' };

        const rawDate = this._addInterval(base, intervalValue, intervalUnit);
        const adjustedDate = this._adjustToBusinessDay(rawDate);

        return {
            rawDate: this._toIsoDate(rawDate),
            adjustedDate: this._toIsoDate(adjustedDate)
        };
    }

    /**
     * Adds an interval to a date and returns a new Date instance.
     * @param {Date} date
     * @param {number} value
     * @param {string} unit
     * @returns {Date}
     */
    _addInterval(date, value, unit) {
        const result = new Date(date.getTime());
        switch (unit) {
            case 'days':
                result.setDate(result.getDate() + value);
                break;
            case 'weeks':
                result.setDate(result.getDate() + value * 7);
                break;
            case 'months':
                result.setMonth(result.getMonth() + value);
                break;
            case 'years':
                result.setFullYear(result.getFullYear() + value);
                break;
            default:
                result.setMonth(result.getMonth() + value);
        }
        return result;
    }

    /**
     * Pushes the date forward to the next business day if it falls on a
     * weekend or Brazilian national holiday.
     * @param {Date} date
     * @returns {Date}
     */
    _adjustToBusinessDay(date) {
        const result = new Date(date.getTime());
        for (let i = 0; i < 30; i++) {
            if (!this._isWeekend(result) && !this._isBrazilNationalHoliday(result)) {
                return result;
            }
            result.setDate(result.getDate() + 1);
        }
        return result;
    }

    _isWeekend(date) {
        const dow = date.getDay();
        return dow === 0 || dow === 6;
    }

    _isBrazilNationalHoliday(date) {
        const year = date.getFullYear();
        const holidays = this._getBrazilNationalHolidays(year);
        const iso = this._toIsoDate(date);
        return holidays.has(iso);
    }

    /**
     * Returns the set of Brazilian national holidays for a given year, as
     * YYYY-MM-DD strings. Covers fixed dates plus Carnival, Good Friday,
     * Easter and Corpus Christi (all based on Easter Sunday).
     * @param {number} year
     * @returns {Set<string>}
     */
    _getBrazilNationalHolidays(year) {
        if (this._holidayCache.has(year)) {
            return this._holidayCache.get(year);
        }

        const holidays = new Set();

        holidays.add(`${year}-01-01`); // Confraternização Universal
        holidays.add(`${year}-04-21`); // Tiradentes
        holidays.add(`${year}-05-01`); // Dia do Trabalho
        holidays.add(`${year}-09-07`); // Independência
        holidays.add(`${year}-10-12`); // N. Sra. Aparecida
        holidays.add(`${year}-11-02`); // Finados
        holidays.add(`${year}-11-15`); // Proclamação da República
        holidays.add(`${year}-11-20`); // Consciência Negra (nacional desde 2024)
        holidays.add(`${year}-12-25`); // Natal

        const easter = this._calculateEasterDate(year);
        const addDays = (base, offset) => {
            const d = new Date(base.getTime());
            d.setDate(d.getDate() + offset);
            return d;
        };

        holidays.add(this._toIsoDate(addDays(easter, -48))); // Carnaval segunda
        holidays.add(this._toIsoDate(addDays(easter, -47))); // Carnaval terça
        holidays.add(this._toIsoDate(addDays(easter, -2)));  // Sexta-feira Santa
        holidays.add(this._toIsoDate(easter));               // Páscoa
        holidays.add(this._toIsoDate(addDays(easter, 60)));  // Corpus Christi

        this._holidayCache.set(year, holidays);
        return holidays;
    }

    /**
     * Computus algorithm (Meeus/Jones/Butcher) for Gregorian Easter Sunday.
     * @param {number} year
     * @returns {Date} Easter Sunday at local midnight
     */
    _calculateEasterDate(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    /**
     * Computes status for a reminder based on its adjusted next due date.
     * @param {Object} item
     * @returns {{key: string, label: string}}
     */
    _getStatus(item) {
        const nextIso = item.adjustedNextDueDate || item.nextDueDate;
        if (!nextIso) return { key: 'unknown', label: 'Sem data' };

        const today = this._toIsoDate(new Date());
        const next = this._parseIsoDate(nextIso);
        const todayDate = this._parseIsoDate(today);
        if (!next || !todayDate) return { key: 'unknown', label: 'Sem data' };

        const diffDays = Math.round((next.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { key: 'overdue', label: `Vencido há ${Math.abs(diffDays)} dia(s)` };
        if (diffDays === 0) return { key: 'today', label: 'Vence hoje' };
        if (diffDays <= 7) return { key: 'soon', label: `Em ${diffDays} dia(s)` };
        if (diffDays <= 30) return { key: 'upcoming', label: `Em ${diffDays} dia(s)` };
        return { key: 'ok', label: `Em ${diffDays} dia(s)` };
    }

    _formatInterval(value, unit) {
        if (!value) return '—';
        const labels = {
            days: value === 1 ? 'dia' : 'dias',
            weeks: value === 1 ? 'semana' : 'semanas',
            months: value === 1 ? 'mês' : 'meses',
            years: value === 1 ? 'ano' : 'anos'
        };
        return `${value} ${labels[unit] || unit}`;
    }

    /**
     * Formats an ISO date (YYYY-MM-DD) for display in pt-BR (DD/MM/YYYY).
     * @param {string} iso
     * @returns {string}
     */
    _formatDate(iso) {
        if (!iso) return '—';
        const date = this._parseIsoDate(iso);
        if (!date) return '—';
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    /**
     * Parses a YYYY-MM-DD string into a local-midnight Date. Returns null
     * for invalid input. Avoids the Date(iso) UTC shift that breaks display
     * timezones west of GMT.
     * @param {string} iso
     * @returns {Date|null}
     */
    _parseIsoDate(iso) {
        if (!iso || typeof iso !== 'string') return null;
        const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return null;
        const [, y, m, d] = match;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    _toIsoDate(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
