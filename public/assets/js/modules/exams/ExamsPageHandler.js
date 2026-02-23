/**
 * @file ExamsPageHandler.js
 * @description Medical exams and appointments management.
 * 
 * Contents:
 * - Exam CRUD operations
 * - Specialty categorization with icons
 * - Status tracking (scheduled, done, cancelled)
 * - Calendar view and filtering
 * - Firestore persistence
 * 
 * Dependencies:
 * - PageManager
 * - PersonalDataService (Firebase)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ExamsPageHandler
 * @description Manages scheduling and control of medical exams
 */
class ExamsPageHandler {

    /**
     * Initializes the exams handler
     * 
     * @constructor
     * @param {PageManager} pageManager - PageManager instance for integration
     * 
     * @example
     * const handler = new ExamsPageHandler(pageManager);
     */
    constructor(pageManager) {
        this.pageManager = pageManager;
        this.editingExamId = null;
        this.currentFilter = 'all';
        this.specialtyIcons = this._initSpecialtyIcons();
        this.exams = [];
        this.unsubscribe = null;
    }

    /**
     * Initializes specialty icons map
     * @private
     * @returns {Object} Specialty → emoji map
     */
    _initSpecialtyIcons() {
        return {
            'Cardiologia': '❤️',
            'Dermatologia': '🔬',
            'Endocrinologia': '🩺',
            'Gastroenterologia': '🫁',
            'Ginecologia': '👩‍⚕️',
            'Neurologia': '🧠',
            'Oftalmologia': '👁️',
            'Ortopedia': '🦴',
            'Pediatria': '👶',
            'Psiquiatria': '🧘',
            'Urologia': '💧',
            'Exame de Sangue': '💉',
            'Raio-X': '📷',
            'Ressonância': '🔍',
            'Tomografia': '🖼️',
            'Ultrassom': '📡',
            'Outros': '📋'
        };
    }

    /**
     * Resets the handler state to initial values
     * Called when tab is refreshed
     * @public
     */
    resetState() {
        this.editingExamId = null;
        this.currentFilter = 'all';
    }

    /**
     * Initializes the page (called by PageManager)
     * @public
     */
    initialize() {
        this.currentFilter = 'all';
        this._startListening();
    }

    /**
     * Cleans up resources when leaving the page
     * @public
     */
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.editingExamId = null;
        this.currentFilter = 'all';
        this.exams = [];
    }

    /**
     * Renders complete page structure
     * @public
     * @returns {string} Exams page HTML
     */
    render() {
        return `
            <div class="exams-container">
                <!-- Hero Section -->
                <div class="exams-hero page-hero">
                    <h1>🏥 Exames Médicos</h1>
                    <p>Agende e acompanhe seus exames e consultas médicas</p>
                </div>

                <!-- Intro Text -->
                <div class="exams-intro">
                    <p class="intro-text">Mantenha seu histórico médico organizado e nunca perca um compromisso</p>
                </div>

                <!-- Action Button -->
                <div class="exams-actions">
                    <button class="btn-primary btn-add-exam" onclick="examsHandler.showAddExamForm()">
                        + Novo Exame
                    </button>
                </div>

                <!-- Content Section -->
                <div class="exams-content-section">
                    <div class="content-header">
                        <h2>📋 Seus Exames</h2>
                        <p>Visualize e gerencie seus agendamentos</p>
                    </div>
                    
                    ${this._renderExamForm()}
                    ${this._renderFilters()}
                    ${this._renderExamsList()}
                </div>
            </div>
        `;
    }

    /**
     * Renders exam form
     * @private
     * @returns {string} Form HTML
     */
    _renderExamForm() {
        return `
            <div id="examForm" class="personal-form" style="display: none;">
                <h4 id="examFormTitle">Agendar Novo Exame</h4>
                ${this._renderFormFields()}
                ${this._renderFormActions()}
            </div>
        `;
    }

    /**
     * Renders form fields
     * @private
     * @returns {string} Fields HTML
     */
    _renderFormFields() {
        return `
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Especialidade *</label>
                        <select id="examSpecialty">
                            <option value="">Selecione...</option>
                            ${this._renderSpecialtyOptions()}
                        </select>
                    </div>
                    <div class="form-input-group">
                        <label>Tipo de Exame</label>
                        <input type="text" id="examType" placeholder="Ex: Ecocardiograma, Hemograma">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Data do Exame *</label>
                        <input type="date" id="examDate">
                    </div>
                    <div class="form-input-group">
                        <label>Horário *</label>
                        <input type="time" id="examTime">
                    </div>
                </div>
                <div class="form-input-group">
                    <label>Local do Exame *</label>
                    <input type="text" id="examLocation" placeholder="Ex: Laboratório São Lucas - Rua A, 123">
                    <small class="form-hint">
                        💡 Digite o endereço para visualizar no Google Maps
                    </small>
                </div>
                <div class="form-input-group">
                    <label>Médico Responsável</label>
                    <input type="text" id="examDoctor" placeholder="Ex: Dr. João Silva">
                </div>
                <div class="form-input-group">
                    <label>Preparação / Observações</label>
                    <textarea id="examNotes" rows="3" 
                              placeholder="Ex: Jejum de 12h, Levar exames anteriores, Tomar medicação..."></textarea>
                </div>
        `;
    }

    /**
     * Renders specialty options
     * @private
     * @returns {string} Options HTML
     */
    _renderSpecialtyOptions() {
        return Object.entries(this.specialtyIcons)
            .map(([specialty, icon]) => `<option value="${specialty}">${icon} ${specialty}</option>`)
            .join('');
    }

    /**
     * Renders form actions
     * @private
     * @returns {string} Actions HTML
     */
    _renderFormActions() {
        return `
                <div class="form-actions">
                    <button class="btn-secondary" onclick="examsHandler.cancelExamForm()">Cancelar</button>
                    <button class="btn-primary" id="btnSaveExam" onclick="examsHandler.saveExam()">Salvar Exame</button>
                </div>
        `;
    }

    /**
     * Renders filters container
     * @private
     * @returns {string} Filters HTML
     */
    _renderFilters() {
        return `
            <div class="exam-filters" id="examFilters">
                <button class="filter-btn active" data-filter="all">
                    Todos (0)
                </button>
            </div>
        `;
    }

    /**
     * Renders exams list container
     * @private
     * @returns {string} List HTML
     */
    _renderExamsList() {
        return `
            <div id="examsList" class="exams-list">
                <div class="empty-state">
                    <span class="empty-icon">🏥</span>
                    <p>Nenhum exame cadastrado</p>
                    <small>Clique em "Novo Exame" para agendar</small>
                </div>
            </div>
        `;
    }

    /**
     * Shows form for new exam
     * @public
     */
    showAddExamForm() {
        this.editingExamId = null;
        this._clearExamForm();
        this._setFormMode('add');
        this._setMinDate();
        document.getElementById('examForm').style.display = 'block';
        document.getElementById('examSpecialty').focus();
        document.getElementById('examsList').classList.add('hidden-for-edit');
        document.getElementById('examFilters').classList.add('hidden-for-edit');
    }

    /**
     * Cancels exam edit/creation
     * @public
     */
    cancelExamForm() {
        document.getElementById('examForm').style.display = 'none';
        this.editingExamId = null;
        this._clearExamForm();
        
        document.getElementById('examsList').classList.remove('hidden-for-edit');
        document.getElementById('examFilters').classList.remove('hidden-for-edit');
    }

    /**
     * Clears form fields
     * @private
     */
    _clearExamForm() {
        const fields = ['examSpecialty', 'examType', 'examDate', 'examTime', 
                       'examLocation', 'examDoctor', 'examNotes'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = '';
        });
    }

    /**
     * Sets form mode (add or edit)
     * @private
     * @param {string} mode - 'add' or 'edit'
     */
    _setFormMode(mode) {
        const title = mode === 'add' ? 'Agendar Novo Exame' : 'Editar Exame';
        const buttonText = mode === 'add' ? 'Salvar Exame' : 'Atualizar Exame';
        
        document.getElementById('examFormTitle').textContent = title;
        document.getElementById('btnSaveExam').textContent = buttonText;
    }

    /**
     * Sets minimum date as today
     * @private
     */
    _setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('examDate').setAttribute('min', today);
    }

    /**
     * Saves exam (new or update) with userId validation
     * @public
     */
    async saveExam() {
        const formData = this._getFormData();

        if (!this._validateExamData(formData)) {
            return;
        }

        const btnSave = document.getElementById('btnSaveExam');
        if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Salvando...'; }

        try {
            const { FirebaseDataService } = window.firebaseGlobals;

            if (this.editingExamId) {
                const existing = this.exams.find(e => e.id === this.editingExamId) || {};
                const updatedExam = { ...existing, ...formData, updatedAt: new Date().toISOString() };
                await FirebaseDataService.saveDocument('exams', updatedExam, this.editingExamId);
            } else {
                const newExam = {
                    ...formData,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                await FirebaseDataService.saveDocument('exams', newExam);
            }

            this._refreshAfterSave();
            this._showSaveSuccess();
        } catch (error) {
            console.error('❌ Erro ao salvar exame:', error);
            this._showValidationError('Erro ao salvar exame. Tente novamente.');
        } finally {
            if (btnSave) { btnSave.disabled = false; btnSave.textContent = this.editingExamId ? 'Atualizar Exame' : 'Salvar Exame'; }
        }
    }

    /**
     * Gets form data
     * @private
     * @returns {Object} Form data
     */
    _getFormData() {
        return {
            specialty: document.getElementById('examSpecialty').value,
            type: document.getElementById('examType').value.trim(),
            date: document.getElementById('examDate').value,
            time: document.getElementById('examTime').value,
            location: document.getElementById('examLocation').value.trim(),
            doctor: document.getElementById('examDoctor').value.trim(),
            notes: document.getElementById('examNotes').value.trim()
        };
    }

    /**
     * Validates exam data
     * @private
     * @param {Object} data - Data to validate
     * @returns {boolean} True if valid
     */
    _validateExamData(data) {
        const validations = [
            { field: data.specialty, message: 'Por favor, selecione a especialidade' },
            { field: data.date, message: 'Por favor, informe a data do exame' },
            { field: data.time, message: 'Por favor, informe o horário do exame' },
            { field: data.location, message: 'Por favor, informe o local do exame' }
        ];

        for (const validation of validations) {
            if (!validation.field) {
                this._showValidationError(validation.message);
                return false;
            }
        }

        return true;
    }

    /**
     * Refreshes interface after save
     * @private
     */
    _refreshAfterSave() {
        this.cancelExamForm();
        this._renderMonthFilters();
        this.loadExams();
    }

    /**
     * Loads exam for editing
     * @public
     * @param {number} examId - Exam ID
     */
    editExam(examId) {
        const exam = this.exams.find(e => String(e.id) === String(examId));

        if (!exam) return;

        this.editingExamId = examId;
        this._setFormMode('edit');
        this._fillForm(exam);
        
        document.getElementById('examForm').style.display = 'block';
        document.getElementById('examSpecialty').focus();
        document.getElementById('examsList').classList.add('hidden-for-edit');
        document.getElementById('examFilters').classList.add('hidden-for-edit');
    }

    /**
     * Fills form with exam data
     * @private
     * @param {Object} exam - Exam data
     */
    _fillForm(exam) {
        document.getElementById('examSpecialty').value = exam.specialty;
        document.getElementById('examType').value = exam.type || '';
        document.getElementById('examDate').value = exam.date;
        document.getElementById('examTime').value = exam.time;
        document.getElementById('examLocation').value = exam.location;
        document.getElementById('examDoctor').value = exam.doctor || '';
        document.getElementById('examNotes').value = exam.notes || '';
    }

    /**
     * Starts real-time listener on the 'exams' Firestore collection.
     * Updates this.exams and re-renders whenever data changes.
     * @private
     */
    _startListening() {
        if (this.unsubscribe) this.unsubscribe();

        const { FirebaseDataService } = window.firebaseGlobals;
        this.unsubscribe = FirebaseDataService.listenToCollection('exams', (exams) => {
            this.exams = exams || [];
            this._renderMonthFilters();
            this.loadExams();
        });
    }

    /**
     * Renders the current cached exams (this.exams) applying active filters.
     * Data is kept up-to-date by the Firestore listener started in _startListening().
     * @public
     */
    loadExams() {
        const filteredExams = this._filterExamsByMonth(this.exams);
        const sortedExams = this._sortExamsByDate([...filteredExams]);
        this._renderExamsToDOM(sortedExams);
    }

    /**
     * Filters exams by month
     * @private
     * @param {Array} exams - Exams list
     * @returns {Array} Filtered exams
     */
    _filterExamsByMonth(exams) {
        if (this.currentFilter === 'all') {
            return exams;
        }

        return exams.filter(exam => {
            const examDate = new Date(exam.date + 'T00:00:00');
            const monthKey = `${examDate.getFullYear()}-${String(examDate.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === this.currentFilter;
        });
    }

    /**
     * Sorts exams by date/time
     * @private
     * @param {Array} exams - Exams list
     * @returns {Array} Sorted exams
     */
    _sortExamsByDate(exams) {
        return exams.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateA - dateB;
        });
    }

    /**
     * Renders exams to DOM
     * @private
     * @param {Array} exams - Exams list
     */
    _renderExamsToDOM(exams) {
        const examsList = document.getElementById('examsList');

        if (exams.length === 0) {
            examsList.innerHTML = this._renderEmptyState();
            return;
        }

        examsList.innerHTML = exams.map(exam => this._renderExamCard(exam)).join('');
    }

    /**
     * Toggles exam completion status
     * @public
     * @param {number} examId - Exam ID
     */
    async toggleComplete(examId) {
        const exam = this.exams.find(e => String(e.id) === String(examId));
        if (!exam) return;

        try {
            const { FirebaseDataService } = window.firebaseGlobals;
            const updated = {
                ...exam,
                completed: !exam.completed,
                completedAt: !exam.completed ? new Date().toISOString() : null
            };
            await FirebaseDataService.saveDocument('exams', updated, String(exam.id));
            this._showToggleSuccess(updated.completed);
        } catch (error) {
            console.error('❌ Erro ao atualizar exame:', error);
        }
    }

    /**
     * Deletes exam after confirmation
     * @public
     * @param {number} examId - Exam ID
     */
    async deleteExam(examId) {
        const confirmed = await this._confirmDeletion();
        if (!confirmed) return;

        try {
            const { FirebaseDataService } = window.firebaseGlobals;
            await FirebaseDataService.deleteDocument('exams', String(examId));
            this._showDeleteSuccess();
        } catch (error) {
            console.error('❌ Erro ao excluir exame:', error);
        }
    }

    /**
     * Renders exam card
     * @private
     * @param {Object} exam - Exam data
     * @returns {string} Card HTML
     */
    _renderExamCard(exam) {
        const examDate = new Date(exam.date + ' ' + exam.time);
        const now = new Date();
        const isPast = examDate < now && !exam.completed;
        const formattedDate = this._formatExamDate(exam.date);
        const mapsUrl = this._generateMapsUrl(exam.location);
        const statusBadge = this._getStatusBadge(exam, isPast);
        const cardClass = this._getCardClass(exam, isPast);

        return `
            <div class="exam-card data-card interactive-card ${cardClass}">
                <div class="exam-header">
                    <div class="exam-specialty">
                        <h3>${exam.specialty}</h3>
                        ${exam.type ? `<span class="exam-type">${exam.type}</span>` : ''}
                    </div>
                    <div class="exam-status">${statusBadge}</div>
                </div>
                
                <div class="exam-details">
                    ${this._renderExamInfoRow('📅', 'Data e Horário', `${formattedDate} às ${exam.time}`)}
                    ${this._renderExamInfoRow('📍', 'Local', exam.location, mapsUrl)}
                    ${exam.doctor ? this._renderExamInfoRow('👨‍⚕️', 'Médico', exam.doctor) : ''}
                    ${exam.notes ? this._renderExamInfoRow('📝', 'Preparação / Observações', exam.notes) : ''}
                </div>
                
                ${this._renderExamActions(exam)}
            </div>
        `;
    }

    /**
     * Renders exam info row
     * @private
     * @param {string} icon - Icon emoji
     * @param {string} label - Info label
     * @param {string} value - Info value
     * @param {string} [linkUrl] - Optional URL for link
     * @returns {string} Row HTML
     */
    _renderExamInfoRow(icon, label, value, linkUrl = null) {
        return `
            <div class="exam-info-row">
                <span class="info-icon">${icon}</span>
                <div class="info-content">
                    <strong>${label}</strong>
                    <p>${value}</p>
                    ${linkUrl ? `<a href="${linkUrl}" target="_blank" class="maps-link">🗺️ Ver no Google Maps</a>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renders exam actions
     * @private
     * @param {Object} exam - Exam data
     * @returns {string} Actions HTML
     */
    _renderExamActions(exam) {
        const completeButton = exam.completed 
            ? this._renderActionButton('btn-uncomplete', exam.id, 'Desmarcar conclusão', this._getUncompleteIcon())
            : this._renderActionButton('btn-complete', exam.id, 'Marcar como concluído', this._getCompleteIcon());

        return `
            <div class="exam-actions">
                ${completeButton}
                ${this._renderActionButton('btn-edit', exam.id, 'Editar', this._getEditIcon(), 'editExam')}
                ${this._renderActionButton('btn-delete', exam.id, 'Excluir', this._getDeleteIcon(), 'deleteExam')}
            </div>
        `;
    }

    /**
     * Renders action button
     * @private
     * @param {string} btnClass - CSS button class
     * @param {number} examId - Exam ID
     * @param {string} title - Tooltip
     * @param {string} iconSvg - Icon SVG
     * @param {string} [action] - Method name (default: toggleComplete)
     * @returns {string} Button HTML
     */
    _renderActionButton(btnClass, examId, title, iconSvg, action = 'toggleComplete') {
        return `
            <button class="btn-action ${btnClass}" 
                    onclick="examsHandler.${action}('${examId}')" 
                    title="${title}">
                ${iconSvg}
            </button>
        `;
    }

    /**
     * Renders month filters dynamically
     * @private
     */
    _renderMonthFilters() {
        const monthsData = this._groupExamsByMonth(this.exams);
        const sortedMonths = this._sortMonthsData(monthsData);
        this._renderFilterButtons(sortedMonths, this.exams.length);
    }

    /**
     * Groups exams by month/year
     * @private
     * @param {Array} exams - Exams list
     * @returns {Map} Map of months with aggregated data
     */
    _groupExamsByMonth(exams) {
        const monthsMap = new Map();

        exams.forEach(exam => {
            const examDate = new Date(exam.date + 'T00:00:00');
            const monthKey = `${examDate.getFullYear()}-${String(examDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = examDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

            if (!monthsMap.has(monthKey)) {
                monthsMap.set(monthKey, {
                    key: monthKey,
                    label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                    date: examDate,
                    total: 0,
                    completed: 0,
                    pending: 0
                });
            }

            const monthData = monthsMap.get(monthKey);
            monthData.total++;
            if (exam.completed) {
                monthData.completed++;
            } else {
                monthData.pending++;
            }
        });

        return monthsMap;
    }

    /**
     * Sorts months data by date
     * @private
     * @param {Map} monthsMap - Months map
     * @returns {Array} Sorted array of months
     */
    _sortMonthsData(monthsMap) {
        return Array.from(monthsMap.values()).sort((a, b) => a.date - b.date);
    }

    /**
     * Renders filter buttons
     * @private
     * @param {Array} sortedMonths - Sorted months
     * @param {number} totalExams - Total exams
     */
    _renderFilterButtons(sortedMonths, totalExams) {
        const container = document.getElementById('examFilters');

        if (sortedMonths.length === 0) {
            container.innerHTML = this._renderDefaultFilterButton(0);
            return;
        }

        let filtersHTML = this._renderDefaultFilterButton(totalExams);
        filtersHTML += sortedMonths.map(month => this._renderMonthFilterButton(month)).join('');

        container.innerHTML = filtersHTML;
    }

    /**
     * Renders "All" filter button
     * @private
     * @param {number} count - Total count
     * @returns {string} Button HTML
     */
    _renderDefaultFilterButton(count) {
        const activeClass = this.currentFilter === 'all' ? 'active' : '';
        return `
            <button class="filter-btn ${activeClass}" 
                    data-filter="all" 
                    onclick="examsHandler.filterExams('all')">
                Todos (${count})
            </button>
        `;
    }

    /**
     * Renders month filter button
     * @private
     * @param {Object} month - Month data
     * @returns {string} Button HTML
     */
    _renderMonthFilterButton(month) {
        const activeClass = this.currentFilter === month.key ? 'active' : '';
        const statusText = this._getMonthStatusText(month);

        return `
            <button class="filter-btn ${activeClass}" 
                    data-filter="${month.key}" 
                    onclick="examsHandler.filterExams('${month.key}')">
                ${month.label} 
                <span style="font-size: 0.85em; opacity: 0.9;">
                    (${statusText})
                </span>
            </button>
        `;
    }

    /**
     * Gets month status text
     * @private
     * @param {Object} month - Month data
     * @returns {string} Formatted text
     */
    _getMonthStatusText(month) {
        const parts = [];
        if (month.pending > 0) {
            parts.push(`${month.pending} pendente${month.pending > 1 ? 's' : ''}`);
        }
        if (month.completed > 0) {
            parts.push(`${month.completed} concluído${month.completed > 1 ? 's' : ''}`);
        }
        return parts.join(', ');
    }

    /**
     * Applies selected filter and updates view
     * @public
     * @param {string} filter - Filter identifier (month-year or 'all')
     */
    filterExams(filter) {
        this.currentFilter = filter;
        this._updateFilterButtonsState();
        this.loadExams();
    }

    /**
     * Updates filter buttons visual state
     * @private
     */
    _updateFilterButtonsState() {
        document.querySelectorAll('.exam-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    /**
     * Gets current user ID (kept for backwards compatibility / emergency use)
     * @private
     * @returns {string|null} User ID
     */
    _getCurrentUserId() {
        if (this.pageManager?.currentUser?.id) return this.pageManager.currentUser.id;
        if (typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser) {
            const u = FormUtils.getCurrentUser();
            if (u?.id) return u.id;
            if (u?.uid) return u.uid;
        }
        return window.firebaseGlobals?.auth?.currentUser?.uid || null;
    }

    /**
     * Generates Google Maps URL
     * @private
     * @param {string} location - Address
     * @returns {string} Formatted URL
     */
    _generateMapsUrl(location) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    }

    /**
     * Formats exam date
     * @private
     * @param {string} date - Date in ISO formatS
     * @returns {string} Formatted date
     */
    _formatExamDate(date) {
        return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Gets card CSS classes
     * @private
     * @param {Object} exam - Exam data
     * @param {boolean} isPast - If overdue
     * @returns {string} CSS classes
     */
    _getCardClass(exam, isPast) {
        const classes = [];
        if (exam.completed) classes.push('completed');
        if (isPast) classes.push('overdue');
        return classes.join(' ');
    }

    /**
     * Gets status badge
     * @private
     * @param {Object} exam - Exam data
     * @param {boolean} isPast - If overdue
     * @returns {string} Badge HTML
     */
    _getStatusBadge(exam, isPast) {
        if (exam.completed) {
            return '<span class="status-badge completed">✓ Concluído</span>';
        }
        if (isPast) {
            return '<span class="status-badge overdue">⚠️ Atrasado</span>';
        }
        return '<span class="status-badge upcoming">📅 Agendado</span>';
    }

    /**
     * Renders empty state
     * @private
     * @returns {string} Empty state HTML
     */
    _renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">🏥</span>
                <p>Nenhum exame encontrado</p>
            </div>
        `;
    }

    /**
     * Complete icon
     * @private
     * @returns {string} SVG
     */
    _getCompleteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>`;
    }

    /**
     * Uncomplete icon
     * @private
     * @returns {string} SVG
     */
    _getUncompleteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6"/>
            <path d="M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>`;
    }

    /**
     * Edit icon
     * @private
     * @returns {string} SVG
     */
    _getEditIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;
    }

    /**
     * Delete icon
     * @private
     * @returns {string} SVG
     */
    _getDeleteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>`;
    }

    /**
     * Shows validation alert
     * @private
     * @param {string} message - Error message
     */
    _showValidationError(message) {
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
     * Shows save success alert
     * @private
     */
    _showSaveSuccess() {
        const wasEditing = this.editingExamId !== null;
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: wasEditing ? 'Exame atualizado com sucesso' : 'Exame agendado com sucesso',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Shows toggle completion alert
     * @private
     * @param {boolean} isCompleted - If completed
     */
    _showToggleSuccess(isCompleted) {
        Swal.fire({
            icon: 'success',
            title: isCompleted ? 'Exame concluído!' : 'Exame reagendado!',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Shows successful deletion alert
     * @private
     */
    _showDeleteSuccess() {
        Swal.fire({
            icon: 'success',
            title: 'Excluído!',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Confirms deletion with user
     * @private
     * @returns {Promise<boolean>} True if confirmed
     */
    async _confirmDeletion() {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não poderá ser desfeita',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        return result.isConfirmed;
    }
}