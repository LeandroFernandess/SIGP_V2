/**
 * @file PreferencesModule.js
 * @description User preferences and system customization.
 *
 * Contents:
 * - Dark/Light theme toggle (with localStorage persistence)
 * - AI email digest preferences (enable/disable + section toggles)
 * - Auto-saves `enabled:false` the instant the master toggle is turned off
 *   (the Save button lives inside the panel that gets hidden)
 * - "Enviar agora" button that invokes the `sendDigestNow` Cloud Function
 *
 * Extends: BaseSettingsModule
 *
 * Dependencies:
 * - DigestService (window.digestService) — wraps the digest callables
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
    /**
     * @type {boolean}
     * @description Guard flag used by `_onNotifToggle()` to skip the automatic
     * Firestore write when the toggle state is being set programmatically
     * (e.g. while applying loaded preferences from Firestore). Set to `true`
     * before any programmatic `toggle.checked` assignment and reset to `false`
     * immediately after so that real user interactions are still persisted.
     * @private
     */
    _suppressAutoToggleSave = false;

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
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclNotes" checked>
                                    <span class="notif-include-icon">📝</span>
                                    <span>Anotações</span>
                                </label>
                                <label class="notif-include-item">
                                    <input type="checkbox" id="inclReminders" checked>
                                    <span class="notif-include-icon">⏰</span>
                                    <span>Lembretes</span>
                                </label>
                            </div>
                            <p class="notif-section-hint">O resumo é enviado automaticamente quando você entra no sistema, se a opção estiver ativa. Use o botão "Enviar agora" para um envio imediato.</p>
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

    /**
     * Reacts to the master "enable digest" toggle.
     *
     * - Shows/hides the options panel.
     * - When the user turns the toggle OFF we persist `enabled:false`
     *   immediately, otherwise the save button (inside the panel) would
     *   disappear before the change reaches Firestore and the next reload
     *   would re-enable the digest from the stale stored value.
     * - When the user turns it ON we only reveal the panel; the user is
     *   expected to press "Salvar Preferências" after picking the sections.
     */
    _onNotifToggle() {
        const toggle = document.getElementById('notificationsToggle');
        const enabled = !!toggle?.checked;
        const options = document.getElementById('notificationOptions');
        if (options) options.style.display = enabled ? 'block' : 'none';

        if (!enabled && !this._suppressAutoToggleSave) {
            this._persistDisabledState(toggle);
        }
    }

    /**
     * Writes `enabled:false` to Firestore as soon as the user turns the
     * digest off. Reverts the UI on failure so the user is never lied to
     * about the persisted state.
     * @param {HTMLInputElement|null} toggle
     * @returns {Promise<void>}
     * @private
     */
    async _persistDisabledState(toggle) {
        if (!window.digestService || !window.currentUserId) return;

        try {
            await window.digestService.savePrefs(window.currentUserId, { enabled: false });
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true })
                .fire({ icon: 'info', title: 'Resumo por email desativado' });
        } catch (err) {
            Logger.error('[PreferencesModule] Failed to persist disabled state:', err);
            if (toggle) {
                this._suppressAutoToggleSave = true;
                toggle.checked = true;
                this._onNotifToggle();
                this._suppressAutoToggleSave = false;
            }
            Swal.fire({ icon: 'error', title: 'Não foi possível salvar', text: 'A preferência não pôde ser desativada. Tente novamente.' });
        }
    }

    /**
     * Reads all digest-preference checkboxes from the DOM and persists the
     * complete set to Firestore via `DigestService.savePrefs()`. Uses
     * `{ merge: true }` internally so that the backend's `lastSentAt` writes
     * never overwrite the full document and vice-versa.
     *
     * Disables the save button while the write is in flight and restores it
     * afterwards, regardless of success or failure.
     *
     * @returns {Promise<void>}
     * @private
     */
    async _saveNotifPrefs() {
        if (!window.digestService) {
            Swal.fire({ icon: 'error', title: 'Serviço indisponível', text: 'Por favor recarregue a página.' });
            return;
        }

        const userId = window.currentUserId;
        if (!userId) return;

        const enabled = document.getElementById('notificationsToggle')?.checked ?? false;
        const inclFinance = document.getElementById('inclFinance')?.checked ?? true;
        const inclTasks = document.getElementById('inclTasks')?.checked ?? true;
        const inclExams = document.getElementById('inclExams')?.checked ?? true;
        const inclShopping = document.getElementById('inclShopping')?.checked ?? true;
        const inclTraining = document.getElementById('inclTraining')?.checked ?? true;
        const inclNotes = document.getElementById('inclNotes')?.checked ?? true;
        const inclReminders = document.getElementById('inclReminders')?.checked ?? true;

        const saveBtn = document.getElementById('btnSaveNotifPrefs');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }

        try {
            await window.digestService.savePrefs(userId, {
                enabled,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                inclFinance, inclTasks, inclExams, inclShopping, inclTraining,
                inclNotes, inclReminders
            });
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                .fire({ icon: 'success', title: 'Preferências de notificação salvas!' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Erro ao salvar', text: err.message });
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Salvar Preferências'; }
        }
    }

    /**
     * Loads digest preferences from Firestore and applies them to the UI.
     *
     * Sets `_suppressAutoToggleSave = true` before programmatically updating
     * `notificationsToggle.checked` so that `_onNotifToggle()` does **not**
     * trigger an unwanted Firestore write while the state is being restored.
     * Also populates section-include checkboxes and the `lastSentDisplay` badge
     * when a `lastSentAt` timestamp is present in the prefs document.
     *
     * @returns {Promise<void>}
     * @private
     */
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
                this._suppressAutoToggleSave = true;
                this._onNotifToggle();
                this._suppressAutoToggleSave = false;
            }

            const inclMap = {
                inclFinance: true, inclTasks: true, inclExams: true,
                inclShopping: true, inclTraining: true,
                inclNotes: true, inclReminders: true
            };
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

    /**
     * Triggers an on-demand digest by calling `DigestService.sendNow()`, which
     * in turn invokes the `sendDigestNow` HTTPS Cloud Function callable. The
     * function handles OpenAI prompt generation and EmailJS delivery server-side;
     * no credentials are read or sent by this method.
     *
     * Updates the `#lastSentDisplay` badge on success and shows a SweetAlert2
     * error dialog on failure. Disables the button during the request.
     *
     * @returns {Promise<void>}
     * @private
     */
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
        const name = currentUser?.name || currentUser?.displayName || 'Usuário';

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
