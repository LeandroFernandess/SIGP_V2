/**
 * @file SettingsPageHandler.js
 * @description Orchestrator for Settings page with modular architecture.
 * 
 * Contents:
 * - Module switching (profile, security, preferences, account)
 * - Horizontal tab navigation with icons
 * - Module rendering and event listeners
 * - Global exposure (window.settingsHandler)
 * 
 * Modules: ProfileModule, SecurityModule, PreferencesModule, AccountInfoModule
 * 
 * Dependencies:
 * - PageManager
 * - UserService
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class SettingsPageHandler
 * @description Manages the settings page and its modules
 */
class SettingsPageHandler {

    /**
     * Initializes the settings page handler
     * Creates instances of the 4 modules
     * 
     * @constructor
     * @param {PageManager} pageManager - PageManager instance
     * @param {UserService} userService - User management service
     * 
     * @example
     * const handler = new SettingsPageHandler(pageManager, userService);
     */
    constructor(pageManager, userService) {
        this.pageManager = pageManager;
        this.userService = userService;
        this.currentModule = 'profile';
        
        this.modules = {
            profile: new ProfileModule(userService),
            security: new SecurityModule(userService),
            preferences: new PreferencesModule(userService),
            account: new AccountInfoModule(userService)
        };
    }

    /**
     * Renders the complete settings page structure
     * @returns {Promise<string>} Page HTML
     */
    async render() {
        return `
            <div class="settings-page-container">
                <div class="settings-hero page-hero">
                    <h1>⚙️ Configurações</h1>
                    <p>Gerencie suas preferências e configurações do sistema</p>
                </div>

                <div class="settings-intro">
                    <p class="intro-text">Personalize sua experiência e mantenha seus dados atualizados</p>
                </div>

                <!-- Tabs de Navegação -->
                <div id="settingsTabsNav" class="settings-tabs">
                    <button class="settings-tab active" data-tab="profile" data-context="settings"
                            onclick="settingsHandler.switchModule('profile')">
                        <span class="tab-icon">👤</span>
                        <span class="tab-label">Perfil</span>
                    </button>
                    <button class="settings-tab" data-tab="security" data-context="settings"
                            onclick="settingsHandler.switchModule('security')">
                        <span class="tab-icon">🔒</span>
                        <span class="tab-label">Segurança</span>
                    </button>
                    <button class="settings-tab" data-tab="preferences" data-context="settings"
                            onclick="settingsHandler.switchModule('preferences')">
                        <span class="tab-icon">🎨</span>
                        <span class="tab-label">Preferências</span>
                    </button>
                    <button class="settings-tab" data-tab="account" data-context="settings"
                            onclick="settingsHandler.switchModule('account')">
                        <span class="tab-icon">ℹ️</span>
                        <span class="tab-label">Conta</span>
                    </button>
                </div>

                <div id="settingsContainerMain" class="settings-container">
                    <div id="settingsContent" class="settings-tab-content active">
                        ${this.renderCurrentModule()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders the current active module
     * @returns {string} Active module HTML
     */
    renderCurrentModule() {
        const module = this.modules[this.currentModule];
        return module ? module.renderContent() : '';
    }

    /**
     * Switches between settings modules
     * @param {string} moduleName - Module name ('profile', 'security', 'preferences', 'account')
     * @returns {void}
     */
    switchModule(moduleName) {
        if (!this.modules[moduleName]) return;
        
        this.currentModule = moduleName;

        const settingsTabsNav = document.getElementById('settingsTabsNav');
        if (settingsTabsNav) {
            const tabs = settingsTabsNav.querySelectorAll('.settings-tab[data-context="settings"]');
            tabs.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === moduleName);
            });
        }

        const contentDiv = document.getElementById('settingsContent');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderCurrentModule();
            
            setTimeout(() => {
                this.modules[moduleName].attachEventListeners();
            }, 100);
        }
    }

    /**
     * Resets the handler state to initial values
     * Called when tab is refreshed
     * @returns {void}
     */
    resetState() {
        this.currentModule = 'profile';
    }

    /**
     * Initializes the handler and loads current module data
     * @returns {void}
     */
    initialize() {
        const currentModule = this.modules[this.currentModule];
        if (currentModule) {
            currentModule.attachEventListeners();
        }
    }
}
