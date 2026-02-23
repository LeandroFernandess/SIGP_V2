/**
 * @file PersonalPageHandler.js
 * @description Orchestrator for Personal Management page.
 * 
 * Contents:
 * - Module switching (tasks, links, passwords, shopping, wishlist)
 * - Hero section and navigation tabs
 * - Module rendering and initialization
 * 
 * Modules: TasksModule, LinksModule, PasswordsModule, ShoppingModule, WishlistModule
 * 
 * Dependencies:
 * - PageManager
 * - PersonalDataService
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class PersonalPageHandler
 * @description Manages the personal management page
 */
class PersonalPageHandler {

    /**
     * Initializes the personal page handler
     * Creates instances of all 5 modules
     * 
     * @constructor
     * @param {PageManager} pageManager - PageManager instance
     * @param {PersonalDataService} personalDataService - Personal data service
     * 
     * @example
     * const handler = new PersonalPageHandler(pageManager, personalDataService);
     */
    constructor(pageManager, personalDataService) {
        this.pageManager = pageManager;
        this.personalDataService = personalDataService;
        this.currentModule = 'tasks';
        
        this.modules = {
            tasks: new TasksModule(personalDataService),
            links: new LinksModule(personalDataService),
            passwords: new PasswordsModule(personalDataService),
            shopping: new ShoppingModule(personalDataService),
            wishlist: new WishlistModule(personalDataService)
        };
    }

    /**
     * Renders the complete structure of the personal page
     * @returns {Promise<string>} Page HTML
     */
    async render() {
        return `
            <div class="personal-container">
                <!-- Hero Section -->
                <div class="personal-hero page-hero">
                    <h1>📋 Gestão Pessoal</h1>
                    <p>Organize sua vida com tarefas, links, senhas e listas personalizadas</p>
                </div>

                <!-- Intro Text -->
                <div class="personal-intro">
                    <p class="intro-text">Selecione uma categoria abaixo para começar</p>
                </div>

                <!-- Módulos de Navegação -->
                <div class="personal-modules">
                    ${this.renderModuleCards()}
                </div>

                <!-- Conteúdo dos Módulos -->
                <div class="personal-content-section">
                    <div class="content-header">
                        <h2 id="moduleTitle">✅ Tarefas</h2>
                        <p id="moduleSubtitle">Gerencie suas tarefas diárias</p>
                    </div>
                    <div id="personalModuleContent" class="personal-module-content">
                        ${this.modules[this.currentModule].render()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders module selection cards
     * @returns {string} Cards HTML
     */
    renderModuleCards() {
        const moduleConfigs = [
            { id: 'tasks', icon: '✅', title: 'Tarefas', description: 'Gerenciar tarefas diárias' },
            { id: 'links', icon: '🔗', title: 'Links Úteis', description: 'Links favoritos e importantes' },
            { id: 'passwords', icon: '🔐', title: 'Senhas', description: 'Gerenciar credenciais' },
            { id: 'shopping', icon: '🛒', title: 'Compras', description: 'Lista de compras' },
            { id: 'wishlist', icon: '⭐', title: 'Desejos', description: 'Objetivos e sonhos' }
        ];

        return moduleConfigs.map(module => `
            <button class="personal-module-card ${module.id === this.currentModule ? 'active' : ''}" 
                    data-module="${module.id}" 
                    onclick="personalHandler.switchModule('${module.id}')">
                <span class="module-icon">${module.icon}</span>
                <div class="module-info">
                    <h3>${module.title}</h3>
                    <p>${module.description}</p>
                </div>
            </button>
        `).join('');
    }

    /**
     * Switches to a specific module
     * @param {string} moduleName - Module name (tasks, links, passwords, shopping, wishlist)
     */
    async switchModule(moduleName) {
        if (!this.modules[moduleName]) {
            Logger.error(`Módulo ${moduleName} não encontrado`);
            return;
        }

        this.currentModule = moduleName;

        document.querySelectorAll('.personal-module-card').forEach(card => {
            card.classList.toggle('active', card.dataset.module === moduleName);
        });

        const titles = {
            tasks: { icon: '✅', title: 'Tarefas', subtitle: 'Gerencie suas tarefas diárias' },
            links: { icon: '🔗', title: 'Links Úteis', subtitle: 'Seus links favoritos e importantes' },
            passwords: { icon: '🔐', title: 'Senhas', subtitle: 'Gerencie suas credenciais com segurança' },
            shopping: { icon: '🛒', title: 'Lista de Compras', subtitle: 'Organize suas compras' },
            wishlist: { icon: '⭐', title: 'Lista de Desejos', subtitle: 'Seus objetivos e sonhos' }
        };
        
        const moduleTitle = document.getElementById('moduleTitle');
        const moduleSubtitle = document.getElementById('moduleSubtitle');
        if (moduleTitle && titles[moduleName]) {
            moduleTitle.textContent = `${titles[moduleName].icon} ${titles[moduleName].title}`;
            moduleSubtitle.textContent = titles[moduleName].subtitle;
        }

        const content = document.getElementById('personalModuleContent');
        if (content) {
            content.innerHTML = this.modules[moduleName].render();
            
            await this.modules[moduleName].loadAndRender();
        }
    }

    /**
     * Resets the handler state to initial values
     * Called when tab is refreshed
     */
    resetState() {
        this.currentModule = 'tasks';
    }

    /**
     * Initializes the page and loads default module data
     */
    async initialize() {
        if (this.modules[this.currentModule]) {
            await this.modules[this.currentModule].loadAndRender();
        }
    }
}
