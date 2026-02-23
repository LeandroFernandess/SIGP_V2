/**
 * @file PreferencesModule.js
 * @description User preferences and system customization.
 * 
 * Contents:
 * - Dark/Light theme toggle
 * - Theme persistence (localStorage)
 * - Notifications (future implementation)
 * - Event listeners setup
 * 
 * Extends: BaseSettingsModule
 * 
 * Dependencies:
 * - UserService
 * - localStorage (theme persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class PreferencesModule
 * @extends BaseSettingsModule
 * @description Manages system preferences
 */
class PreferencesModule extends BaseSettingsModule {

    /**
     * Initializes the preferences module
     * 
     * @constructor
     * @param {UserService} userService - User service
     * 
     * @example
     * const module = new PreferencesModule(userService);
     */
    constructor(userService) {
        super('preferences', userService);
    }

    /**
     * Renders the preferences module content
     * @returns {string} Preferences HTML
     */
    renderContent() {
        return `
            <div class="settings-card">
                <div class="settings-card-header">
                    <div class="settings-card-icon">🎨</div>
                    <div>
                        <h3 class="settings-card-title">Preferências</h3>
                        <p class="settings-card-description">Personalize sua experiência no sistema</p>
                    </div>
                </div>
                <div class="settings-form">
                    <div class="preference-item">
                        <div class="preference-info">
                            <h4>
                                <span id="themeIcon">🌙</span>
                                <span id="themeLabel">Tema Escuro</span>
                            </h4>
                            <p id="themeDescription">Alterne entre modo claro e escuro</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="darkModeToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                </div>
            </div>

            <!-- ── EMAIL DIGEST ──────────────────────────────────────────── -->
            <div class="settings-card" style="margin-top:1.5rem;">
                <div class="settings-card-header">
                    <div class="settings-card-icon">📧</div>
                    <div>
                        <h3 class="settings-card-title">Resumo por Email (IA)</h3>
                        <p class="settings-card-description">Resumo inteligente gerado pela IA enviado direto para o seu email</p>
                    </div>
                </div>
                <div class="settings-form">

                    <!-- Toggle principal -->
                    <div class="preference-item">
                        <div class="preference-info">
                            <h4>🔔 Ativar resumo por email</h4>
                            <p>O SIGP enviará um resumo gerado por IA diretamente para o seu email</p>
                        </div>
                        <label class="toggle-switch toggle-switch--plain">
                            <input type="checkbox" id="notificationsToggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <!-- Painel de opções -->
                    <div id="notificationOptions" class="notification-options" style="display:none;">

                        <!-- Frequência -->
                        <div class="notif-section">
                            <div class="notif-section-header">📅 Frequência</div>
                            <div class="notif-freq-grid">
                                <label class="notif-freq-card">
                                    <input type="radio" name="digestFrequency" value="daily" checked>
                                    <span class="notif-freq-icon">📆</span>
                                    <span class="notif-freq-title">Diário</span>
                                    <span class="notif-freq-desc">Uma vez por dia</span>
                                </label>
                                <label class="notif-freq-card">
                                    <input type="radio" name="digestFrequency" value="weekly">
                                    <span class="notif-freq-icon">📅</span>
                                    <span class="notif-freq-title">Semanal</span>
                                    <span class="notif-freq-desc">Uma vez por semana</span>
                                </label>
                            </div>
                        </div>

                        <!-- Dia da semana (semanal) -->
                        <div id="weekdayField" class="notif-section" style="display:none;">
                            <div class="notif-section-header">📌 Dia da semana</div>
                            <select id="digestWeekday" class="notification-select">
                                <option value="0">Domingo</option>
                                <option value="1" selected>Segunda-feira</option>
                                <option value="2">Terça-feira</option>
                                <option value="3">Quarta-feira</option>
                                <option value="4">Quinta-feira</option>
                                <option value="5">Sexta-feira</option>
                                <option value="6">Sábado</option>
                            </select>
                        </div>

                        <!-- Horário preferido -->
                        <div class="notif-section">
                            <div class="notif-section-header">⏰ Horário preferido de envio</div>
                            <select id="digestSendHour" class="notification-select">
                                <option value="6">06:00</option>
                                <option value="7">07:00</option>
                                <option value="8" selected>08:00</option>
                                <option value="9">09:00</option>
                                <option value="10">10:00</option>
                                <option value="11">11:00</option>
                                <option value="12">12:00</option>
                                <option value="13">13:00</option>
                                <option value="14">14:00</option>
                                <option value="15">15:00</option>
                                <option value="16">16:00</option>
                                <option value="17">17:00</option>
                                <option value="18">18:00</option>
                                <option value="19">19:00</option>
                                <option value="20">20:00</option>
                                <option value="21">21:00</option>
                                <option value="22">22:00</option>
                            </select>
                            <p class="notif-section-hint">O resumo é enviado na primeira vez que você abre o sistema após esse horário.</p>
                        </div>

                        <!-- Conteúdo incluído -->
                        <div class="notif-section">
                            <div class="notif-section-header">📋 Incluir no resumo</div>
                            <div class="notif-include-grid">
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclFinance" checked>
                                    <span class="notif-include-icon">💰</span>
                                    <span>Finanças</span>
                                </label>
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclTasks" checked>
                                    <span class="notif-include-icon">✅</span>
                                    <span>Tarefas</span>
                                </label>
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclExams" checked>
                                    <span class="notif-include-icon">🩺</span>
                                    <span>Exames</span>
                                </label>
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclShopping" checked>
                                    <span class="notif-include-icon">🛒</span>
                                    <span>Compras</span>
                                </label>
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclTraining" checked>
                                    <span class="notif-include-icon">🏋️</span>
                                    <span>Treinos</span>
                                </label>
                            </div>
                        </div>

                        <!-- Status + Enviar agora -->
                        <div class="notif-status-bar">
                            <div class="notif-status-info">
                                <span class="notif-status-label">Último envio:</span>
                                <span id="lastSentDisplay" class="notif-status-badge">Nunca</span>
                            </div>
                            <button id="btnSendNow" class="btn btn-secondary notif-send-now-btn">📤 Enviar agora</button>
                        </div>

                        <!-- Salvar -->
                        <button id="btnSaveNotifPrefs" class="btn btn-primary notification-save-btn">
                            💾 Salvar Preferências
                        </button>

                    </div>

                </div>
            </div>
        `;
    }

    /**
     * Extracts form data (not applicable for this module)
     * @returns {Object} Empty data
     */
    getFormData() {
        return {};
    }

    /**
     * Validates data (not applicable for this module)
     * @param {Object} data - Data to validate
     * @returns {Object} {valid: boolean}
     */
    validateData(data) {
        return { valid: true };
    }

    /**
     * Handles light/dark theme toggle
     * @param {Event} event - Change event
     * @returns {void}
     */

    handleThemeToggle(event) {
        const isDark = event.target.checked;
        const body = document.body;

        if (isDark) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            this.updateThemeUI(true);
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            this.updateThemeUI(false);
        }

        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const themeName = isDark ? 'Escuro' : 'Claro';
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

        toast.fire({
            icon: 'success',
            title: `Tema ${themeName} ativado`
        });
    }

    /**
     * Updates the theme toggle interface
     * @param {boolean} isDark - If in dark mode
     * @returns {void}
     */
    updateThemeUI(isDark) {
        const themeIcon = document.getElementById('themeIcon');
        const themeLabel = document.getElementById('themeLabel');
        const themeDescription = document.getElementById('themeDescription');

        if (isDark) {
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeLabel) themeLabel.textContent = 'Tema Escuro';
            if (themeDescription) themeDescription.textContent = 'Modo escuro ativado - ideal para ambientes com pouca luz';
        } else {
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeLabel) themeLabel.textContent = 'Tema Claro';
            if (themeDescription) themeDescription.textContent = 'Modo claro ativado - ideal para ambientes bem iluminados';
        }
    }

    /**
     * Loads the saved theme preference
     * @returns {void}
     */
    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const isDark = savedTheme === 'dark';
        const darkModeToggle = document.getElementById('darkModeToggle');

        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
        }

        if (isDark) {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }

        this.updateThemeUI(isDark);
    }

    /**
     * Attaches module event listeners
     * @returns {void}
     */
    attachEventListeners() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', e => this.handleThemeToggle(e));
        }
        this.loadThemePreference();

        const notifToggle = document.getElementById('notificationsToggle');
        if (notifToggle) {
            notifToggle.addEventListener('change', () => this._onNotifToggle());
        }

        document.querySelectorAll('input[name="digestFrequency"]').forEach(radio => {
            radio.addEventListener('change', () => this._onFrequencyChange());
        });

        const saveBtn = document.getElementById('btnSaveNotifPrefs');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this._saveNotifPrefs());
        }

        const sendNowBtn = document.getElementById('btnSendNow');
        if (sendNowBtn) {
            sendNowBtn.addEventListener('click', () => this._sendNow());
        }

        this._loadNotifPrefs();
    }

    // ── Notification Logic ─────────────────────────────────────────────────

    _onNotifToggle() {
        const enabled = document.getElementById('notificationsToggle')?.checked;
        const options = document.getElementById('notificationOptions');
        if (options) options.style.display = enabled ? 'block' : 'none';
    }

    _onFrequencyChange() {
        const freq      = document.querySelector('input[name="digestFrequency"]:checked')?.value;
        const weekField = document.getElementById('weekdayField');
        if (weekField) weekField.style.display = freq === 'weekly' ? 'block' : 'none';
    }

    async _saveNotifPrefs() {
        if (!window.digestService) {
            Swal.fire({ icon: 'error', title: 'Serviço indisponível', text: 'Por favor recarregue a página.' });
            return;
        }

        const userId = window.currentUserId;
        if (!userId) return;

        const enabled   = document.getElementById('notificationsToggle')?.checked ?? false;
        const frequency = document.querySelector('input[name="digestFrequency"]:checked')?.value || 'daily';
        const weekday   = frequency === 'weekly'
            ? parseInt(document.getElementById('digestWeekday')?.value ?? '1', 10)
            : null;
        const sendHour     = parseInt(document.getElementById('digestSendHour')?.value ?? '8', 10);
        const inclFinance  = document.getElementById('inclFinance')?.checked  ?? true;
        const inclTasks    = document.getElementById('inclTasks')?.checked    ?? true;
        const inclExams    = document.getElementById('inclExams')?.checked    ?? true;
        const inclShopping = document.getElementById('inclShopping')?.checked ?? true;
        const inclTraining = document.getElementById('inclTraining')?.checked ?? true;

        const saveBtn = document.getElementById('btnSaveNotifPrefs');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }

        try {
            await window.digestService.savePrefs(userId, {
                enabled, frequency, weekday, sendHour,
                inclFinance, inclTasks, inclExams, inclShopping, inclTraining
            });
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                .fire({ icon: 'success', title: 'Preferências de notificação salvas!' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Erro ao salvar', text: err.message });
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Salvar Preferências'; }
        }
    }

    async _loadNotifPrefs() {
        if (!window.digestService) return;

        const userId = window.currentUserId;
        if (!userId) return;

        try {
            const prefs = await window.digestService.loadPrefs(userId);
            if (!prefs) return;

            const notifToggle = document.getElementById('notificationsToggle');
            if (notifToggle) {
                notifToggle.checked = !!prefs.enabled;
                this._onNotifToggle();
            }

            if (prefs.frequency) {
                const radio = document.querySelector(`input[name="digestFrequency"][value="${prefs.frequency}"]`);
                if (radio) { radio.checked = true; this._onFrequencyChange(); }
            }

            if (prefs.weekday != null) {
                const sel = document.getElementById('digestWeekday');
                if (sel) sel.value = String(prefs.weekday);
            }

            if (prefs.sendHour != null) {
                const hourSel = document.getElementById('digestSendHour');
                if (hourSel) hourSel.value = String(prefs.sendHour);
            }

            const inclMap = { inclFinance: true, inclTasks: true, inclExams: true, inclShopping: true, inclTraining: true };
            for (const [key, def] of Object.entries(inclMap)) {
                const el = document.getElementById(key);
                if (el) el.checked = prefs[key] !== false ? true : false;
            }

            if (prefs.lastSentAt) {
                const d = prefs.lastSentAt.toDate ? prefs.lastSentAt.toDate() : new Date(prefs.lastSentAt);
                const badge = document.getElementById('lastSentDisplay');
                if (badge) badge.textContent = d.toLocaleString('pt-BR');
            }
        } catch (err) {
            Logger.warn('[PreferencesModule] Could not load notif prefs:', err);
        }
    }

    async _sendNow() {
        if (!window.digestService) {
            Swal.fire({ icon: 'error', title: 'Serviço indisponível', text: 'Por favor recarregue a página.' });
            return;
        }

        const userId = window.currentUserId;
        if (!userId) return;

        const currentUser = typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser
            ? FormUtils.getCurrentUser() : null;
        const email = currentUser?.email || '';
        const name  = currentUser?.name  || currentUser?.displayName || 'Usuário';

        if (!email) {
            Swal.fire({ icon: 'warning', title: 'Email não encontrado', text: 'Não foi possível obter o email do usuário logado.' });
            return;
        }

        const btn = document.getElementById('btnSendNow');
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

        try {
            await window.digestService.sendNow(userId, email, name);
            const badge = document.getElementById('lastSentDisplay');
            if (badge) badge.textContent = new Date().toLocaleString('pt-BR');
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Erro ao enviar', text: err.message });
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '📤 Enviar agora'; }
        }
    }
}
