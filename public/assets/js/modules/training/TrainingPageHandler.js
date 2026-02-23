/**
 * @file TrainingPageHandler.js
 * @description Orchestrator for Training page with modular architecture.
 * 
 * Contents:
 * - Module switching (workout, running)
 * - Mode selector buttons
 * - Module rendering coordination
 * - Global exposure (window.trainingHandler)
 * 
 * Modules: WorkoutModule, RunningModule
 * 
 * Dependencies:
 * - PageManager
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class TrainingPageHandler
 * @description Manages the training page (weight training and running)
 */
class TrainingPageHandler {

    /**
     * Initializes the training page handler
     * Creates instances of the 2 modules (workout and running)
     * 
     * @constructor
     * @param {PageManager} pageManager - PageManager instance
     * 
     * @example
     * const handler = new TrainingPageHandler(pageManager);
     */
    constructor(pageManager) {
        this.pageManager = pageManager;
        this.currentModule = 'workout';
        this.currentPeriod = 'month';
        this.stats = null;

        this.modules = {
            workout: new WorkoutModule(),
            running: new RunningModule()
        };

        this.trainingService = new TrainingService();
    }

    /**
     * Renders the main training page HTML
     */
    render() {
        return `
            <div class="training-container">
                <!-- Hero Section -->
                <div class="training-hero page-hero">
                    <h1>💪 Treinos</h1>
                    <p>Acompanhe seus treinos de musculação e corridas</p>
                </div>

                <!-- Intro Text -->
                <div class="training-intro">
                    <p class="intro-text">Selecione o tipo de treino para começar</p>
                </div>

                <!-- Mode Selector -->
                <div class="training-mode-selector">
                    <button class="mode-btn active" data-mode="workout" 
                            onclick="trainingHandler.switchModule('workout')">
                        🏋️ Musculação
                    </button>
                    <button class="mode-btn" data-mode="running" 
                            onclick="trainingHandler.switchModule('running')">
                        🏃 Corrida
                    </button>
                    <button class="mode-btn" data-mode="tracking" 
                            onclick="trainingHandler.switchModule('tracking')">
                        📊 Rastreamento
                    </button>
                </div>

                <!-- Content Section -->
                <div class="training-content-section">
                    <div id="trainingContent" class="training-content">
                        ${this.renderCurrentModule()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders the current active module content
     */
    renderCurrentModule() {
        if (this.currentModule === 'tracking') {
            return this.renderTrackingSection();
        }

        const module = this.modules[this.currentModule];
        if (!module) {
            this.currentModule = 'workout';
            return this.modules.workout.render();
        }

        return module.render();
    }

    /**
     * Switches between training modules (workout/running/tracking)
     */
    async switchModule(mode) {
        if (mode !== 'workout' && mode !== 'running' && mode !== 'tracking') return;

        this.currentModule = mode;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const contentDiv = document.getElementById('trainingContent');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderCurrentModule();

            if (mode !== 'tracking') {
                await this.modules[mode].initialize();
            } else {
                await this.loadStats();
            }
        }
    }

    /**
     * Resets the handler state to initial values
     * Called when tab is refreshed
     */
    resetState() {
        this.currentModule = 'workout';
        this.currentPeriod = 'month';
        this.stats = null;
    }

    /**
     * Initializes the current module
     */
    async initialize() {
        if (this.currentModule === 'tracking') {
            await this.loadStats();
        } else {
            const currentModule = this.modules[this.currentModule];
            if (currentModule) {
                await currentModule.initialize();
            }
        }
    }

    /**
     * Renders the training tracking section with statistics and calendar
     */
    renderTrackingSection() {
        if (!this.stats) {
            return `
                <div class="training-tracking-section">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Carregando rastreamento...</p>
                    </div>
                </div>
            `;
        }

        const { trainedDays, totalDays, percentage, completeWeeks, longestStreak } = this.stats;

        return `
            <div class="training-tracking-section">
                <!-- Header -->
                <div class="tracking-header">
                    <div>
                        <h2>📊 Rastreamento de Treinos</h2>
                        <p class="tracking-subtitle">Clique em qualquer dia do calendário para marcar como treino</p>
                    </div>
                </div>

                <!-- Period Selector -->
                <div class="tracking-period-selector">
                    <button class="tracking-period-btn ${this.currentPeriod === 'month' ? 'active' : ''}" 
                            onclick="trainingHandler.changePeriod('month')">
                        📅 Mês Atual
                    </button>
                    <button class="tracking-period-btn ${this.currentPeriod === 'year' ? 'active' : ''}" 
                            onclick="trainingHandler.changePeriod('year')">
                        📆 Ano Atual
                    </button>
                </div>

                <!-- Stats Grid -->
                <div class="tracking-stats-grid">
                    <div class="tracking-stat-card">
                        <div class="tracking-stat-icon">🔥</div>
                        <div class="tracking-stat-content">
                            <div class="tracking-stat-value">${trainedDays}</div>
                            <div class="tracking-stat-label">Dias Treinados</div>
                            <div class="tracking-stat-subtitle">de ${totalDays} dias</div>
                        </div>
                    </div>

                    <div class="tracking-stat-card">
                        <div class="tracking-stat-icon">📈</div>
                        <div class="tracking-stat-content">
                            <div class="tracking-stat-value">${percentage}%</div>
                            <div class="tracking-stat-label">Frequência</div>
                            <div class="tracking-stat-subtitle">${this.getFrequencyMessage(percentage)}</div>
                        </div>
                    </div>

                    <div class="tracking-stat-card">
                        <div class="tracking-stat-icon">🏆</div>
                        <div class="tracking-stat-content">
                            <div class="tracking-stat-value">${completeWeeks}</div>
                            <div class="tracking-stat-label">Semanas Completas</div>
                            <div class="tracking-stat-subtitle">${completeWeeks === 1 ? 'semana' : 'semanas'} de 7 dias</div>
                        </div>
                    </div>

                    <div class="tracking-stat-card">
                        <div class="tracking-stat-icon">⚡</div>
                        <div class="tracking-stat-content">
                            <div class="tracking-stat-value">${longestStreak}</div>
                            <div class="tracking-stat-label">Maior Sequência</div>
                            <div class="tracking-stat-subtitle">${longestStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}</div>
                        </div>
                    </div>
                </div>

                <!-- Calendar -->
                ${this.renderCalendar()}
            </div>
        `;
    }

    /**
     * Renders statistics section (legacy, replaced by renderTrackingSection)
     */
    renderStats() {
        if (!this.stats) {
            return `
                <div class="training-stats-section">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Carregando estatísticas...</p>
                    </div>
                </div>
            `;
        }

        const { trainedDays, totalDays, percentage, completeWeeks, longestStreak } = this.stats;

        return `
            <div class="training-stats-section">
                <div class="stats-header">
                    <h3>📊 Minhas Estatísticas</h3>
                    <div class="stats-period-selector">
                        <button class="stats-period-btn ${this.currentPeriod === 'month' ? 'active' : ''}" 
                                onclick="trainingHandler.changePeriod('month')">Mês</button>
                        <button class="stats-period-btn ${this.currentPeriod === 'year' ? 'active' : ''}" 
                                onclick="trainingHandler.changePeriod('year')">Ano</button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-icon">🔥</span>
                        </div>
                        <div class="stat-label">Dias Treinados</div>
                        <div class="stat-value">${trainedDays}</div>
                        <div class="stat-subtitle">de ${totalDays} dias</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-icon">📈</span>
                        </div>
                        <div class="stat-label">Frequência</div>
                        <div class="stat-value">${percentage}%</div>
                        <div class="stat-subtitle">${this.getFrequencyMessage(percentage)}</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-icon">🏆</span>
                        </div>
                        <div class="stat-label">Semanas Completas</div>
                        <div class="stat-value">${completeWeeks}</div>
                        <div class="stat-subtitle">${completeWeeks === 1 ? 'semana' : 'semanas'} de 7 dias</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-icon">⚡</span>
                        </div>
                        <div class="stat-label">Maior Sequência</div>
                        <div class="stat-value">${longestStreak}</div>
                        <div class="stat-subtitle">${longestStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}</div>
                    </div>
                </div>

                ${this.renderCalendar()}
            </div>
        `;
    }

    /**
     * Renders monthly calendar with trained days
     */
    renderCalendar() {
        if (!this.stats || !this.stats.sessions) return '';

        if (this.currentPeriod === 'year') {
            return this.renderYearCalendar();
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const trainedDates = new Set(
            this.stats.sessions
                .filter(s => {
                    let dateStr = s.date;
                    if (typeof dateStr === 'string' && dateStr.includes('T')) {
                        const d = new Date(dateStr);
                        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return m === month + 1 && y === year;
                })
                .map(s => {
                    let dateStr = s.date;
                    if (typeof dateStr === 'string' && dateStr.includes('T')) {
                        const d = new Date(dateStr);
                        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return d;
                })
        );

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        let calendarHTML = weekDays.map(day => `<div class="calendar-day header">${day}</div>`).join('');

        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day"></div>';
        }

        const today = now.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const isTrained = trainedDates.has(day);
            const isToday = day === today;
            const classes = ['calendar-day'];
            if (isTrained) classes.push('trained');
            if (isToday) classes.push('today');

            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const clickHandler = isTrained 
                ? `onclick="trainingHandler.removeTrainingDay('${dateString}')"` 
                : `onclick="trainingHandler.markSpecificDay('${dateString}')"`;
            const title = isTrained ? 'Clique para remover este dia de treino' : 'Clique para marcar este dia como treino';

            calendarHTML += `<div class="${classes.join(' ')}" ${clickHandler} title="${title}" style="cursor: pointer;">${day}</div>`;
        }

        const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        return `
            <div class="tracking-calendar">
                <h3>📅 ${capitalizedMonth}</h3>
                <div class="calendar-grid">
                    ${calendarHTML}
                </div>
                <div class="calendar-legend">
                    <div class="legend-item">
                        <div class="legend-box trained"></div>
                        <span>Dia treinado (clique para remover)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box today"></div>
                        <span>Hoje</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders a small month calendar for year view
     */
    renderSmallMonthCalendar(monthIndex, year) {
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const trainedDates = new Set(
            this.stats.sessions
                .filter(s => {
                    let dateStr = s.date;
                    if (typeof dateStr === 'string' && dateStr.includes('T')) {
                        const d = new Date(dateStr);
                        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return m === monthIndex + 1 && y === year;
                })
                .map(s => {
                    let dateStr = s.date;
                    if (typeof dateStr === 'string' && dateStr.includes('T')) {
                        const d = new Date(dateStr);
                        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return d;
                })
        );

        const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'short' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        let calendarHTML = '';

        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="mini-calendar-day"></div>';
        }

        const now = new Date();
        const isCurrentMonth = now.getMonth() === monthIndex && now.getFullYear() === year;
        const today = isCurrentMonth ? now.getDate() : -1;

        for (let day = 1; day <= daysInMonth; day++) {
            const isTrained = trainedDates.has(day);
            const isToday = day === today;
            const classes = ['mini-calendar-day'];
            if (isTrained) classes.push('trained');
            if (isToday) classes.push('today');

            const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const clickHandler = isTrained 
                ? `onclick="trainingHandler.removeTrainingDay('${dateString}')"` 
                : `onclick="trainingHandler.markSpecificDay('${dateString}')"`;
            const title = isTrained ? 'Clique para remover' : 'Clique para marcar';

            calendarHTML += `<div class="${classes.join(' ')}" ${clickHandler} title="${title}" style="cursor: pointer;">${day}</div>`;
        }

        return `
            <div class="mini-calendar-month">
                <h4>${capitalizedMonth}</h4>
                <div class="mini-calendar-grid">
                    ${calendarHTML}
                </div>
            </div>
        `;
    }

    /**
     * Renders year calendar with all 12 months
     */
    renderYearCalendar() {
        const now = new Date();
        const year = now.getFullYear();

        let monthsHTML = '';
        for (let month = 0; month < 12; month++) {
            monthsHTML += this.renderSmallMonthCalendar(month, year);
        }

        return `
            <div class="tracking-year-calendar">
                <h3>📅 Calendário de ${year}</h3>
                <div class="year-calendar-grid">
                    ${monthsHTML}
                </div>
                <div class="calendar-legend">
                    <div class="legend-item">
                        <div class="legend-box trained"></div>
                        <span>Dia treinado (clique para remover)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box today"></div>
                        <span>Hoje</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Gets motivational message based on training frequency percentage
     */
    getFrequencyMessage(percentage) {
        if (percentage >= 80) return 'Excelente! 🎯';
        if (percentage >= 60) return 'Muito bom! 💪';
        if (percentage >= 40) return 'Bom ritmo! 👍';
        if (percentage >= 20) return 'Continue assim! 🚀';
        return 'Vamos treinar! 💪';
    }

    /**
     * Loads training statistics for current period
     */
    async loadStats() {
        try {
            const userId = this.getUserId();
            if (!userId) return;

            const { startDate, endDate } = this.getPeriodDates();
            this.stats = await this.trainingService.getStats(userId, startDate, endDate);

            if (this.currentModule === 'tracking') {
                const contentDiv = document.getElementById('trainingContent');
                if (contentDiv) {
                    contentDiv.innerHTML = this.renderTrackingSection();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    /**
     * Gets start and end dates for current period (month/year)
     */
    getPeriodDates() {
        const now = new Date();
        let startDate, endDate;

        switch (this.currentPeriod) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;
            default:
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        }

        return { startDate, endDate };
    }

    /**
     * Changes the statistics period and reloads data
     */
    async changePeriod(period) {
        this.currentPeriod = period;
        await this.loadStats();
    }

    /**
     * Gets current user ID from Firebase
     */
    getUserId() {
        const globals = typeof window.firebaseGlobals !== 'undefined' ? window.firebaseGlobals : null;
        if (!globals || !globals.auth || !globals.auth.currentUser) {
            return null;
        }
        return globals.auth.currentUser.uid;
    }

    /**
     * Records a training session
     */
    async recordTraining(type, details = {}) {
        try {
            const userId = this.getUserId();
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            const now = new Date();
            const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dateString = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

            const sessionData = {
                type,
                date: dateString,
                ...details
            };

            await this.trainingService.addSession(userId, sessionData);
            await this.loadStats();

            return true;
        } catch (error) {
            console.error('Erro ao registrar treino:', error);
            return false;
        }
    }

    /**
     * Marks a specific day as training day
     */
    async markSpecificDay(dateString) {
        try {
            const userId = this.getUserId();
            if (!userId) {
                Swal.fire({
                    icon: 'error',
                    title: 'Usuário não autenticado',
                    text: 'Você precisa estar logado para marcar treinos',
                    confirmButtonText: 'Ok'
                });
                return;
            }

            const alreadyMarked = this.stats.sessions.some(s => {
                let sessionDate = s.date;
                
                if (typeof sessionDate === 'string' && sessionDate.includes('T')) {
                    const d = new Date(sessionDate);
                    sessionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else if (typeof sessionDate !== 'string') {
                    const d = new Date(sessionDate);
                    sessionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
                
                return sessionDate === dateString;
            });

            if (alreadyMarked) {
                Swal.fire({
                    icon: 'info',
                    title: 'Dia já marcado',
                    text: 'Este dia já foi registrado como dia de treino!',
                    confirmButtonText: 'Ok'
                });
                return;
            }

            const [year, month, day] = dateString.split('-').map(Number);
            const displayDate = new Date(year, month - 1, day).toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });

            const sessionData = {
                type: 'manual',
                date: dateString,
                source: 'manual-tracking',
                note: `Dia marcado manualmente via calendário: ${displayDate}`
            };

            await this.trainingService.addSession(userId, sessionData);
            await this.loadStats();

            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: `${displayDate} marcado como treino!`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Erro ao marcar dia:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Ocorreu um erro ao marcar o dia como treino',
                confirmButtonText: 'Ok'
            });
        }
    }

    /**
     * Removes a training day from the calendar
     */
    async removeTrainingDay(dateString) {
        try {
            const userId = this.getUserId();
            if (!userId) {
                Swal.fire({
                    icon: 'error',
                    title: 'Usuário não autenticado',
                    text: 'Você precisa estar logado',
                    confirmButtonText: 'Ok'
                });
                return;
            }

            const result = await Swal.fire({
                title: 'Remover dia de treino?',
                text: 'Deseja realmente remover este dia do seu histórico de treinos?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sim, remover',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280'
            });

            if (!result.isConfirmed) return;

            const sessionsToDelete = this.stats.sessions.filter(s => {
                let sessionDate = s.date;
                
                if (typeof sessionDate === 'string' && sessionDate.includes('T')) {
                    const d = new Date(sessionDate);
                    sessionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
                else if (typeof sessionDate !== 'string') {
                    const d = new Date(sessionDate);
                    sessionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
                
                return sessionDate === dateString;
            });

            if (sessionsToDelete.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Nenhum treino encontrado',
                    text: 'Não foi encontrado nenhum treino registrado neste dia',
                    confirmButtonText: 'Ok'
                });
                return;
            }

            for (const session of sessionsToDelete) {
                await this.trainingService.deleteSession(userId, session.id);
            }

            await this.loadStats();

            Swal.fire({
                icon: 'success',
                title: 'Removido!',
                text: 'Dia removido do histórico de treinos',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Erro ao remover dia de treino:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Ocorreu um erro ao remover o dia de treino',
                confirmButtonText: 'Ok'
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.TrainingPageHandler = TrainingPageHandler;
}
