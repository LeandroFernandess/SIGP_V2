/**
 * @file PageManager.js
 * @description Central routing and page rendering manager for dashboard.
 * 
 * Contents:
 * - Page route mapping (home, expenses, income, reports, etc.)
 * - Handler instance management
 * - loadPage(): Dynamic page loading
 * - Service initialization (Finance, Personal)
 * 
 * Managed Pages:
 * - home, resumo-financeiro, renda-mensal, gastos
 * - relatorio-financeiro, anotacoes, exames-medicos
 * - documentos, treinos, configuracoes, suporte
 * 
 * Dependencies:
 * - FinanceService, PersonalDataService (ES6 modules)
 * - Page handlers (created on demand)
 * 
 * @author Leandro Fialho Fernandes
 */

import { FinanceService } from '../services/FinanceService.js';
import { PersonalDataService } from '../services/PersonalDataService.js';

/**
 * @class PageManager
 * @description Central pages and dashboard navigation manager
 */
class PageManager {

    /**
     * @description Initializes the page manager and services
     * 
     * Configures:
     * - Reference to contentArea DOM element
     * - User data from session
     * - Service instances (Finance and Personal)
     * - Route mapping
     * - Handler state variables
     */
    constructor() {
        this.contentArea = document.getElementById('contentArea');
        this.currentUser = this.getCurrentUser();
        this.financeService = new FinanceService();
        this.personalDataService = new PersonalDataService();
        this.incomeHandler = null;
        this.expensesHandler = null;
        this.reportHandler = null;
        this.personalHandler = null;
        this.documentsHandler = null;
        this.examsHandler = null;
        this.trainingHandler = null;
        this.settingsHandler = null;
        this.supportHandler = null;
        this.pages = {
            'home': () => this.getHomePage(),
            'resumo-financeiro': () => this.getRelatorioFinanceiroPage(),
            'renda-mensal': () => this.getRendaMensalPage(),
            'gastos': () => this.getGastosPage(),
            'relatorio-financeiro': () => this.getRelatorioFinanceiroPage(),
            'anotacoes': () => this.getAnotacoesPage(),
            'exames-medicos': () => this.getExamesMedicosPage(),
            'documentos': () => this.getDocumentosPage(),
            'treinos': () => this.getTreinosPage(),
            'configuracoes': () => this.getConfiguracoesPage(),
            'gestao-pessoal': () => this.getAnotacoesPage(),
            'suporte': () => this.getSuportePage()
        };

        if (!window.tabManager) {
            this.loadPage('home');
        }
    }

    /**
     * Loads a specific page
     */
    async loadPage(pageName, options = {}) {
        const pageFunction = this.pages[pageName];

        if (pageFunction) {
            if (pageName === 'gastos') {
                if (this.expensesHandler && !options.keepEditingState) {
                    this.expensesHandler.resetEditingState();
                }
                if (options.forceRecreate) {
                    this.expensesHandler = null;
                }
            }

            const pageContent = await pageFunction();
            this.contentArea.innerHTML = pageContent;

            if (options.updateTitle !== false) {
                this.updatePageTitle(pageName);
            }

            this.initializePageListeners(pageName);
        } else {
            this.contentArea.innerHTML = `
                <div class="error-page">
                    <h2>Page not found</h2>
                    <p>The page "${pageName}" does not exist.</p>
                </div>
            `;
        }
    }

    /**
     * Updates the page title in the header
     */
    updatePageTitle(pageName) {
        const pageTitle = document.getElementById('pageTitle');
        if (!pageTitle) return;

        const pageTitles = {
            'home': 'Página Inicial',
            'resumo-financeiro': 'Resumo Financeiro',
            'renda-mensal': 'Renda Mensal',
            'gastos': 'Gastos',
            'relatorio-financeiro': 'Relatório Financeiro',
            'anotacoes': 'Anotações',
            'exames-medicos': 'Exames Médicos',
            'documentos': 'Documentos',
            'treinos': 'Treinos',
            'configuracoes': 'Configurações',
            'suporte': 'Suporte e Ajuda'
        };

        pageTitle.textContent = pageTitles[pageName] || 'Dashboard';
    }

    /**
     * Waits for Firebase to be ready and initializes the module
     * @param {string} moduleType - Module type ('training' or 'personal')
     */
    waitForFirebaseAndInitialize(moduleType) {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            let attempts = 0;

            const checkFirebase = () => {
                attempts++;

                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    if (moduleType === 'training' && this.trainingHandler) {
                        this.trainingHandler.initialize();
                    } else if (moduleType === 'personal' && this.personalHandler) {
                        this.personalHandler.initialize();
                    }
                    resolve();
                } else if (attempts < maxAttempts) {
                    setTimeout(checkFirebase, 100);
                } else {
                    const error = `Firebase não carregou após ${maxAttempts * 100}ms`;
                    reject(new Error(error));
                }
            };

            checkFirebase();
        });
    }

    /**
     * Initializes page-specific listeners
     */
    initializePageListeners(pageName) {
        const userId = this.currentUser.id;

        switch (pageName) {
            case 'renda-mensal':
                if (!this.incomeHandler) {
                    this.incomeHandler = new IncomePageHandler(this.financeService, userId);
                }
                this.incomeHandler.initializeListeners();
                break;
            case 'gastos':
                if (!this.expensesHandler) {
                    this.expensesHandler = new ExpensesPageHandler(this.financeService, userId);
                }
                this.expensesHandler.initializeListeners();
                break;
            case 'relatorio-financeiro':
                if (!this.reportHandler) {
                    this.reportHandler = new ReportPageHandler(this.financeService, userId);
                }
                this.reportHandler.initializeListeners();
                break;
            case 'anotacoes':
                if (!this.personalHandler) {
                    this.personalHandler = new PersonalPageHandler(this, this.personalDataService);
                }
                window.personalHandler = this.personalHandler;
                break;
            case 'treinos':
                if (!this.trainingHandler) {
                    this.trainingHandler = new TrainingPageHandler(this);
                    window.trainingHandler = this.trainingHandler;
                }
                this.waitForFirebaseAndInitialize('training');
                break;
            case 'configuracoes':
                const profileForm = document.getElementById('profileForm');
                if (profileForm) {
                    const phoneInput = document.getElementById('profilePhone');
                    if (phoneInput && typeof FormUtils !== 'undefined') {
                        FormUtils.applyPhoneMask(phoneInput);
                    }
                    profileForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const name = document.getElementById('profileName').value.trim();
                        const birth = document.getElementById('profileBirth').value;
                        const phone = document.getElementById('profilePhone').value.trim();
                        let user = this.getCurrentUser();
                        user.name = name;
                        user.birth = birth;
                        user.phone = phone;
                        if (typeof FormUtils !== 'undefined') {
                            FormUtils.setCurrentUser(user);
                        } else {
                            sessionStorage.setItem('currentUser', JSON.stringify(user));
                        }
                        Swal.fire({
                            icon: 'success',
                            title: 'Perfil atualizado!',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    });
                }
                const securityForm = document.getElementById('securityForm');
                if (securityForm) {
                    securityForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const email = document.getElementById('securityEmail').value.trim();
                        const currentPassword = document.getElementById('currentPassword').value;
                        const newPassword = document.getElementById('newPassword').value;
                        const confirmPassword = document.getElementById('confirmPassword').value;

                        if (newPassword || confirmPassword) {
                            if (!currentPassword) {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Senha atual obrigatória',
                                    text: 'Digite a senha atual para fazer alterações',
                                    showConfirmButton: false,
                                    timer: 3000,
                                    timerProgressBar: true
                                });
                                return;
                            }
                            if (newPassword !== confirmPassword) {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'As senhas não coincidem',
                                    showConfirmButton: false,
                                    timer: 3000,
                                    timerProgressBar: true
                                });
                                return;
                            }

                            if (window.userService) {
                                try {
                                    await window.userService.updatePassword(currentPassword, newPassword);
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Senha atualizada!',
                                        showConfirmButton: false,
                                        timer: 3000,
                                        timerProgressBar: true
                                    });
                                } catch (error) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Erro ao atualizar senha',
                                        text: error.message,
                                        showConfirmButton: false,
                                        timer: 3000,
                                        timerProgressBar: true
                                    });
                                }
                            }
                        }

                        const user = this.getCurrentUser();
                        if (email !== user.email) {
                            user.email = email;
                            if (typeof FormUtils !== 'undefined' && FormUtils.setCurrentUser) {
                                FormUtils.setCurrentUser(user);
                            } else {
                                sessionStorage.setItem('currentUser', JSON.stringify(user));
                            }
                        }

                        securityForm.reset();
                        document.getElementById('securityEmail').value = user.email;
                    });
                }
                break;
        }
    }

    /**
     * Home page
     */
    getHomePage() {
        const userName = this.currentUser?.name?.split(' ')[0] || 'User';
        return `
            <div class="home-container">
                <div class="welcome-hero">
                    <h1>Olá, ${userName}! 👋</h1>
                    <p>Bem-vindo ao seu Sistema Inteligente de Gestão Pessoal</p>
                </div>

                ${this.renderQuickAccessSections()}
            </div>
        `;
    }

    /**
     * Renders quick access sections
     */
    renderQuickAccessSections() {
        return `
            <div class="home-intro">
                <p class="intro-text">Escolha uma das áreas abaixo para começar a gerenciar seus dados de forma rápida e eficiente:</p>
            </div>

            <div class="home-sections-grid">
                <!-- FINANCIAL -->
                <div class="home-section">
                    <div class="section-header">
                        <div class="section-icon">💰</div>
                        <div class="section-info">
                            <h3>Financeiro</h3>
                            <p>Controle sua vida financeira</p>
                        </div>
                    </div>
                    <div class="section-actions">
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('renda-mensal'); return false;">
                            <span class="btn-icon">💵</span>
                            <span class="btn-label">Configurar Renda</span>
                        </button>
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('gastos'); return false;">
                            <span class="btn-icon">💳</span>
                            <span class="btn-label">Adicionar Gasto</span>
                        </button>
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('relatorio-financeiro'); return false;">
                            <span class="btn-icon">📊</span>
                            <span class="btn-label">Ver Relatório</span>
                        </button>
                    </div>
                </div>

                <!-- PERSONAL -->
                <div class="home-section">
                    <div class="section-header">
                        <div class="section-icon">👤</div>
                        <div class="section-info">
                            <h3>Gestão Pessoal</h3>
                            <p>Organize suas informações pessoais</p>
                        </div>
                    </div>
                    <div class="section-actions">
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('anotacoes'); return false;">
                            <span class="btn-icon">📝</span>
                            <span class="btn-label">Anotações</span>
                        </button>
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('exames-medicos'); return false;">
                            <span class="btn-icon">🏥</span>
                            <span class="btn-label">Exames Médicos</span>
                        </button>
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('documentos'); return false;">
                            <span class="btn-icon">📄</span>
                            <span class="btn-label">Documentos</span>
                        </button>
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('treinos'); return false;">
                            <span class="btn-icon">💪</span>
                            <span class="btn-label">Treinos</span>
                        </button>
                    </div>
                </div>

                <!-- SYSTEM -->
                <div class="home-section">
                    <div class="section-header">
                        <div class="section-icon">⚙️</div>
                        <div class="section-info">
                            <h3>Sistema</h3>
                            <p>Configurações e suporte</p>
                        </div>
                    </div>
                    <div class="section-actions">
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('configuracoes'); return false;">
                            <span class="btn-icon">⚙️</span>
                            <span class="btn-label">Configurações</span>
                        </button>
                        <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('suporte'); return false;">
                            <span class="btn-icon">💬</span>
                            <span class="btn-label">Suporte</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Monthly Income Page
     */
    async getRendaMensalPage() {
        const userId = this.currentUser.id;
        if (!this.incomeHandler) {
            this.incomeHandler = new IncomePageHandler(this.financeService, userId);
        }
        return await this.incomeHandler.render();
    }

    /**
     * Expenses Page
     */
    async getGastosPage() {
        const userId = this.currentUser.id;
        if (!this.expensesHandler) {
            this.expensesHandler = new ExpensesPageHandler(this.financeService, userId);
            window.expensesHandler = this.expensesHandler;
        }
        const content = await this.expensesHandler.render();
        setTimeout(() => this.expensesHandler.initialize(), 100);
        return content;
    }

    /**
     * Financial Report Page
     */
    async getRelatorioFinanceiroPage() {
        const userId = this.currentUser.id;
        const handler = new ReportPageHandler(this.financeService, userId, this.personalDataService);
        return await handler.render();
    }

    /**
     * Personal Notes Page
     */
    async getAnotacoesPage() {
        if (!this.personalHandler) {
            this.personalHandler = new PersonalPageHandler(this, this.personalDataService);
            window.personalHandler = this.personalHandler;
        }

        const content = await this.personalHandler.render();

        setTimeout(async () => {
            await this.personalHandler.initialize();
        }, 0);

        return content;
    }

    /**
     * Medical Exams Page
     */
    getExamesMedicosPage() {
        if (!this.examsHandler) {
            this.examsHandler = new ExamsPageHandler(this);
            window.examsHandler = this.examsHandler;
        }

        setTimeout(() => {
            this.examsHandler.initialize();
        }, 0);

        return this.examsHandler.render();
    }

    /**
     * Documents Page
     */
    getDocumentosPage() {
        if (!this.documentsHandler) {
            this.documentsHandler = new DocumentsPageHandler(this);
            window.documentsHandler = this.documentsHandler;
        }
        const html = this.documentsHandler.render();

        setTimeout(() => {
            this.documentsHandler.initialize();
        }, 0);

        return html;
    }

    /**
     * Workouts Page
     */
    getTreinosPage() {
        if (!this.trainingHandler) {
            this.trainingHandler = new TrainingPageHandler(this);
            window.trainingHandler = this.trainingHandler;
        }
        const content = this.trainingHandler.render();

        setTimeout(() => {
            if (this.trainingHandler) {
                this.trainingHandler.initialize();
            }
        }, 0);

        return content;
    }

    /**
     * Settings Page
     */
    getConfiguracoesPage() {
        if (!this.settingsHandler) {
            this.settingsHandler = new SettingsPageHandler(this, window.userService);
            window.settingsHandler = this.settingsHandler;
        }

        const content = this.settingsHandler.render();

        setTimeout(() => {
            this.settingsHandler.initialize();
        }, 100);

        return content;
    }

    /**
     * Support Page
     */
    getSuportePage() {
        if (!this.supportHandler) {
            this.supportHandler = new SupportPageHandler(this);
            window.supportHandler = this.supportHandler;
        }
        return this.supportHandler.render();
    }

    /**
     * Formats monetary value
     */
    formatMoney(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Helper to initialize handler after render
     * @param {Function} callback - Initialization callback
     * @param {number} delay - Delay in ms (default: 0)
     */
    initializeAfterRender(callback, delay = 0) {
        setTimeout(() => {
            if (typeof callback === 'function') {
                callback();
            }
        }, delay);
    }

    /**
     * Gets current user with helper
     * @returns {Object|null} Current user data or null
     */
    getCurrentUser() {
        return typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser
            ? FormUtils.getCurrentUser()
            : null;
    }
}

export { PageManager };