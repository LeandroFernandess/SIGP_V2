/**
 * @file RunningModule.js
 * @description Running training management with intensity zones.
 * 
 * Contents:
 * - Running workout CRUD
 * - Organization by weekday
 * - Zone system (duration + pace)
 * - Day navigation tabs
 * 
 * Extends: BaseTrainingModule
 * 
 * Dependencies:
 * - TrainingService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class RunningModule
 * @extends BaseTrainingModule
 * @description Manages running workouts with zones by weekday
 */
class RunningModule extends BaseTrainingModule {

    /**
     * Initializes the running module
     * 
     * @constructor
     * @example
     * const module = new RunningModule();
     */
    constructor() {
        super('running');
        this.currentWeekday = sessionStorage.getItem('trainingRunningWeekday') || 'monday';
    }

    /**
     * Renders the main module HTML structure
     */
    render() {
        const weekdays = [
            { key: 'monday', label: 'SEG' },
            { key: 'tuesday', label: 'TER' },
            { key: 'wednesday', label: 'QUA' },
            { key: 'thursday', label: 'QUI' },
            { key: 'friday', label: 'SEX' },
            { key: 'saturday', label: 'SÁB' },
            { key: 'sunday', label: 'DOM' }
        ];

        const weekdayButtons = weekdays.map(day => {
            const hasRun = this.items.some(run => run.weekday === day.key);
            return `
            <button class="weekday-btn ${this.currentWeekday === day.key ? 'active' : ''} ${hasRun ? 'has-run' : ''}" data-day="${day.key}" onclick="trainingHandler.modules.running.selectWeekday('${day.key}')">
                ${day.label}
            </button>
        `}).join('');

        return `
            <div class="weekdays-nav">
                ${weekdayButtons}
            </div>

            <button class="btn-primary" style="margin-bottom: 1.5rem;" id="addBtnCorrida" 
                    onclick="trainingHandler.modules.running.showForm()">
                + Novo Treino de Corrida
            </button>

            ${this.renderForm()}

            <div id="runsList" class="runs-list">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>🔄 Carregando treinos...</p>
                    <p class="loading-hint">Aguarde alguns instantes</p>
                </div>
            </div>
        `;
    }

    /**
     * Shows the form and hides other elements
     */
    showForm() {
        const runsList = document.getElementById('runsList');
        const weekdayNav = document.querySelector('.weekdays-nav');
        const addBtn = document.getElementById('addBtnCorrida');

        if (runsList) runsList.classList.add('hidden-for-edit');
        if (weekdayNav) weekdayNav.classList.add('hidden-for-edit');
        if (addBtn) addBtn.classList.add('hidden-for-edit');

        super.showForm();
    }

    /**
     * Cancels form and shows hidden elements
     */
    cancelForm() {
        const runsList = document.getElementById('runsList');
        const weekdayNav = document.querySelector('.weekdays-nav');
        const addBtn = document.getElementById('addBtnCorrida');

        if (runsList) runsList.classList.remove('hidden-for-edit');
        if (weekdayNav) weekdayNav.classList.remove('hidden-for-edit');
        if (addBtn) {
            addBtn.classList.remove('hidden-for-edit');
            addBtn.style.display = 'block';
        }

        super.cancelForm();
    }

    /**
     * Renders the running workout form HTML
     */
    renderForm() {
        return `
            <div id="runningForm" class="training-form" style="display: none;">
                <h4 id="runningFormTitle">Novo Treino de Corrida</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Dia da Semana *</label>
                        <select id="runWeekday">
                            <option value="monday">Segunda-feira</option>
                            <option value="tuesday">Terça-feira</option>
                            <option value="wednesday">Quarta-feira</option>
                            <option value="thursday">Quinta-feira</option>
                            <option value="friday">Sexta-feira</option>
                            <option value="saturday">Sábado</option>
                            <option value="sunday">Domingo</option>
                        </select>
                    </div>
                    <div class="form-input-group">
                        <label>Tipo de Treino</label>
                        <input type="text" id="runType" placeholder="Ex: Treino Intervalado">
                    </div>
                </div>

                <div class="zones-section">
                    <div class="zones-header">
                        <label>Zonas de Treino *</label>
                        <button type="button" class="btn-add-zone" onclick="trainingHandler.modules.running.addZone()">
                            + Adicionar Zona
                        </button>
                    </div>
                    <div id="zonesWrapper" class="zones-wrapper"></div>
                </div>

                <div class="form-input-group">
                    <label>Observações</label>
                    <textarea id="runNotes" rows="2" placeholder="Observações sobre o treino..."></textarea>
                </div>

                <div class="form-actions">
                    <button class="btn-secondary" onclick="trainingHandler.modules.running.cancelForm()">Cancelar</button>
                    <button class="btn-primary" id="btnSaveRun" onclick="trainingHandler.modules.running.save()">Salvar</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders a single running workout card
     */
    renderItem(run) {
        const weekdayNames = {
            'monday': 'Segunda-feira',
            'tuesday': 'Terça-feira',
            'wednesday': 'Quarta-feira',
            'thursday': 'Quinta-feira',
            'friday': 'Sexta-feira',
            'saturday': 'Sábado',
            'sunday': 'Domingo'
        };

        const zonesHtml = run.zones.map(zone => {
            const zoneClass = zone.type.toLowerCase().replace(/[^a-z0-9]/g, '');
            return `
            <div class="zone-display-card">
                <div class="zone-type-header">
                    <span class="zone-badge ${zoneClass}">${zone.type}</span>
                </div>
                <div class="zone-details">
                    <div class="zone-detail-item">
                        <span class="zone-detail-icon">🔁</span>
                        <div class="zone-detail-content">
                            <span class="zone-detail-label">Repetições</span>
                            <span class="zone-detail-value">${zone.reps}x</span>
                        </div>
                    </div>
                    <div class="zone-detail-item">
                        <span class="zone-detail-icon">⏱️</span>
                        <div class="zone-detail-content">
                            <span class="zone-detail-label">Duração</span>
                            <span class="zone-detail-value">${zone.duration}</span>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');

        return `
            <div class="run-card">
                <div class="run-main">
                    <div class="run-title-section">
                        <h3 class="run-name">🏃 ${run.type || 'Treino de Corrida'}</h3>
                        <span class="weekday-badge">${weekdayNames[run.weekday]}</span>
                    </div>

                    <div class="zones-grid">
                        ${zonesHtml}
                    </div>
                    
                    ${run.notes ? `
                        <div class="run-notes">
                            <span class="notes-icon">📝</span>
                            <p>${run.notes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="run-actions">
                    <button class="btn-action btn-edit" onclick="trainingHandler.modules.running.editRun('${run.id}')" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-action btn-delete" onclick="trainingHandler.modules.running.deleteRun('${run.id}')" title="Excluir">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Validates running workout form data
     */
    validateForm(data) {
        if (!data.weekday) {
            this.showValidation('Por favor, selecione o dia da semana');
            return false;
        }

        if (!data.zones || data.zones.length === 0) {
            this.showValidation('Por favor, adicione pelo menos uma zona de treino');
            return false;
        }

        return true;
    }

    /**
     * Extracts and returns running form data
     */
    getFormData() {
        const zones = [];
        document.querySelectorAll('.zone-item').forEach(zoneItem => {
            const zoneType = zoneItem.querySelector('.zone-type').value;
            const reps = parseInt(zoneItem.querySelector('.zone-reps').value, 10);
            const duration = zoneItem.querySelector('.zone-duration').value.trim();

            if (zoneType && reps && duration) {
                zones.push({ type: zoneType, reps, duration });
            }
        });

        return {
            weekday: document.getElementById('runWeekday').value,
            type: document.getElementById('runType').value.trim(),
            zones: zones,
            notes: document.getElementById('runNotes').value.trim()
        };
    }

    /**
     * Fills form with existing running workout data
     */
    fillForm(run) {
        document.getElementById('runningFormTitle').textContent = 'Editar Treino';
        document.getElementById('btnSaveRun').textContent = 'Atualizar';
        document.getElementById('runWeekday').value = run.weekday;
        document.getElementById('runType').value = run.type || '';
        document.getElementById('runNotes').value = run.notes || '';

        document.getElementById('zonesWrapper').innerHTML = '';
        if (run.zones && run.zones.length > 0) {
            run.zones.forEach(zone => {
                this.addZone();
                const zoneItems = document.querySelectorAll('.zone-item');
                const lastZone = zoneItems[zoneItems.length - 1];
                lastZone.querySelector('.zone-type').value = zone.type;
                lastZone.querySelector('.zone-reps').value = zone.reps;
                lastZone.querySelector('.zone-duration').value = zone.duration;
            });
        } else {
            this.addZone();
        }
    }

    /**
     * Initializes the running module
     */
    async initialize(userId) {
        if (!userId) {
            userId = this.getUserId();
        }
        await this.loadAndRender(userId);
    }

    /**
     * Selects a weekday and renders filtered workouts
     */
    selectWeekday(day) {
        this.currentWeekday = day;
        sessionStorage.setItem('trainingRunningWeekday', day);

        document.querySelectorAll('.weekday-btn').forEach(btn => {
            const btnDay = btn.dataset.day;
            btn.classList.toggle('active', btnDay === day);

            const hasRun = this.items.some(run => run.weekday === btnDay);
            btn.classList.toggle('has-run', hasRun);
        });

        this.renderList();
    }

    /**
     * Renders workouts list for current weekday
     */
    renderList() {
        const container = document.getElementById('runsList');
        if (!container) {
            return;
        }

        const dayRuns = this.items
            .filter(r => r.weekday === this.currentWeekday)
            .sort((a, b) => {
                let dateA, dateB;

                if (a.createdAt && typeof a.createdAt.toDate === 'function') {
                    dateA = a.createdAt.toDate();
                } else if (a.createdAt) {
                    dateA = new Date(a.createdAt);
                } else {
                    dateA = new Date(0);
                }

                if (b.createdAt && typeof b.createdAt.toDate === 'function') {
                    dateB = b.createdAt.toDate();
                } else if (b.createdAt) {
                    dateB = new Date(b.createdAt);
                } else {
                    dateB = new Date(0);
                }

                return dateA - dateB;
            });

        if (dayRuns.length === 0) {
            const weekdayNames = {
                'monday': 'segunda-feira',
                'tuesday': 'terça-feira',
                'wednesday': 'quarta-feira',
                'thursday': 'quinta-feira',
                'friday': 'sexta-feira',
                'saturday': 'sábado',
                'sunday': 'domingo'
            };
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🏃</span>
                    <p>Nenhum treino de corrida para ${weekdayNames[this.currentWeekday]}</p>
                    <small>Clique em "Novo Treino de Corrida" para começar</small>
                </div>
            `;
        } else {
            container.innerHTML = dayRuns.map(run => this.renderItem(run)).join('');
        }

        this.updateDayIndicators();
    }

    /**
     * Adds a new training zone to the form
     */
    addZone() {
        const zonesWrapper = document.getElementById('zonesWrapper');
        const zoneIndex = zonesWrapper.children.length;

        const zoneHtml = `
            <div class="zone-item" data-zone-index="${zoneIndex}">
                <div class="zone-header">
                    <span class="zone-title">Seção ${zoneIndex + 1}</span>
                    <button type="button" class="btn-remove-zone" onclick="trainingHandler.modules.running.removeZone(${zoneIndex})">
                        ✕
                    </button>
                </div>
                <div class="zone-fields">
                    <div class="zone-field">
                        <label>Zona</label>
                        <select class="zone-type">
                            <option value="Z1">Z1 - Zona de Recuperação - Muito leve</option>
                            <option value="Z2">Z2 - Zona Aeróbia - Leve</option>
                            <option value="Z3">Z3 - Zona Limiar - Moderado</option>
                            <option value="Z4">Z4 - Zona Anaeróbia - Pesado</option>
                            <option value="Z5">Z5 - Zona Máxima - Severo</option>
                        </select>
                    </div>
                    <div class="zone-field">
                        <label>Repetições</label>
                        <div class="number-input-wrapper">
                            <button type="button" class="number-input-btn" onclick="event.target.closest('.zone-item').querySelector('.zone-reps').stepDown(); event.target.closest('.zone-item').querySelector('.zone-reps').dispatchEvent(new Event('change'))">−</button>
                            <input type="number" class="zone-reps" min="1" value="1" placeholder="Ex: 7" inputmode="numeric" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            <button type="button" class="number-input-btn" onclick="event.target.closest('.zone-item').querySelector('.zone-reps').stepUp(); event.target.closest('.zone-item').querySelector('.zone-reps').dispatchEvent(new Event('change'))">+</button>
                        </div>
                    </div>
                    <div class="zone-field">
                        <label>Tempo</label>
                        <input type="time" class="zone-duration">
                    </div>
                </div>
            </div>
        `;

        zonesWrapper.insertAdjacentHTML('beforeend', zoneHtml);
    }

    /**
     * Removes a training zone from the form
     */
    removeZone(index) {
        const zoneItem = document.querySelector(`[data-zone-index="${index}"]`);
        if (zoneItem) {
            zoneItem.remove();
            document.querySelectorAll('.zone-item').forEach((item, idx) => {
                item.dataset.zoneIndex = idx;
                item.querySelector('.zone-title').textContent = `Zona ${idx + 1}`;
                item.querySelector('.btn-remove-zone').setAttribute('onclick', `trainingHandler.modules.running.removeZone(${idx})`);
            });
        }
    }

    showForm() {
        const runsList = document.getElementById('runsList');
        const weekdaysNav = document.querySelector('.weekdays-nav');
        const addBtn = document.getElementById('addBtnCorrida');

        if (runsList) runsList.classList.add('hidden-for-edit');
        if (weekdaysNav) weekdaysNav.classList.add('hidden-for-edit');
        if (addBtn) addBtn.classList.add('hidden-for-edit');

        const form = document.getElementById(`${this.moduleName}Form`);
        if (form) form.style.display = 'block';
        if (addBtn) addBtn.style.display = 'none';

        const weekdaySelect = document.getElementById('runWeekday');
        if (weekdaySelect) {
            weekdaySelect.value = this.currentWeekday;
        }

        const zonesWrapper = document.getElementById('zonesWrapper');
        if (zonesWrapper && zonesWrapper.children.length === 0) {
            this.addZone();
        }
    }

    /**
     * Clears and resets the running form
     */
    clearForm() {
        super.clearForm();

        const runsList = document.getElementById('runsList');
        const weekdaysNav = document.querySelector('.weekdays-nav');
        const addBtn = document.getElementById('addBtnCorrida');

        if (runsList) runsList.classList.remove('hidden-for-edit');
        if (weekdaysNav) weekdaysNav.classList.remove('hidden-for-edit');
        if (addBtn) {
            addBtn.classList.remove('hidden-for-edit');
            addBtn.style.display = 'block';
        }

        const weekdaySelect = document.getElementById('runWeekday');
        if (weekdaySelect) {
            weekdaySelect.value = this.currentWeekday;
        }
        document.getElementById('runType').value = '';
        const zonesWrapper = document.getElementById('zonesWrapper');
        if (zonesWrapper) {
            zonesWrapper.innerHTML = '';
        }
        document.getElementById('runningFormTitle').textContent = 'Novo Treino de Corrida';
        document.getElementById('btnSaveRun').textContent = 'Salvar';
    }

    /**
     * Edits a running workout
     */
    editRun(runId) {
        const userId = this.getUserId();
        this.edit(userId, runId);
    }

    /**
     * Deletes a running workout
     */
    deleteRun(runId) {
        const userId = this.getUserId();
        this.delete(userId, runId);
    }

    /**
     * Updates day indicators after save/delete
     */
    updateDayIndicators() {
        document.querySelectorAll('.weekday-btn').forEach(btn => {
            const btnDay = btn.dataset.day;
            const hasRun = this.items.some(run => run.weekday === btnDay);
            btn.classList.toggle('has-run', hasRun);
        });
    }
}
