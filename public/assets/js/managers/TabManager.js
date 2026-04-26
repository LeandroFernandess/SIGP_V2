/**
 * @file TabManager.js
 * @description Multi-tab management system for dashboard navigation.
 * 
 * Contents:
 * - Tab creation, closing, and switching
 * - Independent navigation history per tab
 * - State and content persistence
 * - Keyboard shortcuts (Ctrl+T, Ctrl+W)
 * - Form state preservation (via FormStateManager)
 * 
 * Architecture:
 * - Tab bar: Clickable tabs UI
 * - Content container: Page rendering area
 * - FormStateManager: Extracted form state logic
 * 
 * Dependencies:
 * - PageManager (page rendering)
 * - FormStateManager (form persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class Tabmanager
 * @description Manages multiple tabs within the dashboard
 * 
 * @property {PageManager} pageManager - Page manager instance
 */
class TabManager {

    /**
     * Initializes the tab manager
     * Sets up UI, listeners and creates initial tab (Home)
     * 
     * @constructor
     * @param {PageManager} pageManager - Page manager instance
     * 
     * @example
     * const pageManager = new PageManager(userId);
     * const tabManager = new TabManager(pageManager);
     */
    constructor(pageManager) {
        this.pageManager = pageManager;
        this.tabs = [];
        this.activeTabId = null;
        this.tabIdCounter = 0;
        this.formStateManager = new FormStateManager();
        this.formStateManager.setHandlerAccessors({
            personal: () => window.personalHandler,
            training: () => window.trainingHandler
        });
        this.initializeUI();
        this.createTab('home', 'Home', true);
    }

    /**
     * Initializes the user interface for the tab system
     * Creates tab bar and configures keyboard shortcuts
     * @returns {void}
     */
    initializeUI() {
        const header = document.querySelector('.dashboard-header');

        const tabBar = document.createElement('div');
        tabBar.className = 'tab-bar';
        tabBar.id = 'tabBar';

        const newTabBtn = document.createElement('button');
        newTabBtn.className = 'btn-new-tab';
        newTabBtn.innerHTML = '+ Nova aba';
        newTabBtn.title = 'Abrir nova aba (Ctrl+T)';
        newTabBtn.onclick = () => {
            this.createTab('home', 'Início');
        };

        this.closeAllBtn = document.createElement('button');
        this.closeAllBtn.className = 'btn-close-all-tabs';
        this.closeAllBtn.innerHTML = '✕ Fechar abas';
        this.closeAllBtn.title = 'Fechar todas as abas';
        this.closeAllBtn.disabled = true;
        this.closeAllBtn.onclick = () => {
            this.closeAllTabs();
        };

        tabBar.appendChild(newTabBtn);
        tabBar.appendChild(this.closeAllBtn);

        header.insertAdjacentElement('afterend', tabBar);

        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '';
        contentArea.id = 'tabsContainer';
        contentArea.className = 'tabs-container';

        this.setupKeyboardShortcuts();
    }

    /**
     * Creates a new tab with a specific page
     * @param {string} pageName - Name of the page to load
     * @param {string} pageTitle - Tab title
     * @param {boolean} [isInitial=false] - Whether this is the initial system tab
     * @returns {void}
     */
    createTab(pageName, pageTitle, isInitial = false) {
        const existingTab = this.tabs.find(tab => tab.pageName === pageName);
        if (existingTab && !isInitial) {
            this.switchTab(existingTab.id);
            return existingTab.id;
        }

        const tabId = `tab_${this.tabIdCounter++}`;

        const tab = {
            id: tabId,
            pageName: pageName,
            title: pageTitle,
            element: null,
            contentElement: null,
            cachedState: {}
        };

        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.id = tabId;
        tabElement.innerHTML = `
            <span class="tab-icon">${this.getPageIcon(pageName)}</span>
            <span class="tab-title">${pageTitle}</span>
            <button class="btn-refresh-tab" title="Recarregar aba">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
            </button>
            <button class="btn-close-tab" title="Fechar aba">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-refresh-tab') && !e.target.closest('.btn-close-tab')) {
                this.switchTab(tabId);
            }
        });

        tabElement.querySelector('.btn-refresh-tab').onclick = (e) => {
            e.stopPropagation();
            this.refreshTab(tabId);
        };
        tabElement.querySelector('.btn-close-tab').onclick = (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
        };

        const contentElement = document.createElement('div');
        contentElement.className = 'tab-content';
        contentElement.id = `${tabId}_content`;

        tab.element = tabElement;
        tab.contentElement = contentElement;

        const tabBar = document.getElementById('tabBar');
        const newTabBtn = tabBar.querySelector('.btn-new-tab');
        tabBar.insertBefore(tabElement, newTabBtn);

        const tabsContainer = document.getElementById('tabsContainer');

        const emptyState = tabsContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        tabsContainer.appendChild(contentElement);

        this.tabs.push(tab);

        if (this.closeAllBtn) {
            this.closeAllBtn.disabled = false;
        }

        this.loadPageInTab(tabId, pageName);

        this.switchTab(tabId);

        return tabId;
    }

    /**
     * Switches to a specific tab
     */
    switchTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        if (this.activeTabId) {
            this.saveTabState(this.activeTabId);
        }

        this.tabs.forEach(t => {
            t.element.classList.remove('active');
            t.contentElement.classList.remove('active');
        });

        tab.element.classList.add('active');
        tab.contentElement.classList.add('active');
        this.activeTabId = tabId;

        this.pageManager.contentArea = tab.contentElement;

        document.getElementById('pageTitle').textContent = tab.title;

        this.updateSidebarActive(tab.pageName);

        setTimeout(() => {
            this.restoreTabState(tabId);
        }, 100);
    }

    /**
     * Saves the current state of a tab (active sub-tabs, scroll position, etc)
     */
    saveTabState(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        if (!tab.cachedState) {
            tab.cachedState = {};
        }

        const contentElement = tab.contentElement;

        const activeSettingsTab = contentElement.querySelector('.settings-tab.active');
        if (activeSettingsTab) {
            tab.cachedState.activeSubTab = activeSettingsTab.dataset.tab;
        }

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            tab.cachedState.scrollPosition = mainContent.scrollTop;
        }

        this.formStateManager.saveFormState(contentElement, tab.cachedState);
    }

    /**
     * Restores the saved state of a tab
     */
    restoreTabState(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab || !tab.cachedState) return;

        const contentElement = tab.contentElement;

        if (tab.cachedState.activeSubTab) {
            const subTabButton = contentElement.querySelector(`.settings-tab[data-tab="${tab.cachedState.activeSubTab}"]`);
            const subTabContent = contentElement.querySelector(`.settings-tab-content[data-content="${tab.cachedState.activeSubTab}"]`);

            if (subTabButton && subTabContent) {
                contentElement.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                contentElement.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));

                subTabButton.classList.add('active');
                subTabContent.classList.add('active');
            }
        }

        if (tab.cachedState) {
            this.formStateManager.restoreFormState(contentElement, tab.cachedState);
        }

        if (tab.cachedState.scrollPosition !== undefined) {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = tab.cachedState.scrollPosition;
            }
        }
    }

    /**
     * Closes a tab
     */
    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];
        const wasActive = tab.id === this.activeTabId;

        tab.element.remove();
        tab.contentElement.remove();

        this.tabs.splice(tabIndex, 1);

        if (this.tabs.length === 0 && this.closeAllBtn) {
            this.closeAllBtn.disabled = true;
        }

        if (this.tabs.length === 0) {
            this.activeTabId = null;
            document.getElementById('pageTitle').textContent = 'SIGP';
            this.showEmptyState();
            return;
        }

        if (wasActive) {
            const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
            this.switchTab(this.tabs[newActiveIndex].id);
        }
    }

    /**
     * Closes all open tabs
     */
    async closeAllTabs() {
        if (this.tabs.length === 0) {
            return;
        }

        const result = await Swal.fire({
            title: 'Fechar todas as abas?',
            text: `Você tem ${this.tabs.length} aba(s) aberta. Você realmente quer fechar todas elas?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sim, fechar todas',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        this.tabs.forEach(tab => {
            tab.element.remove();
            tab.contentElement.remove();
        });

        this.tabs = [];
        this.activeTabId = null;

        if (this.closeAllBtn) {
            this.closeAllBtn.disabled = true;
        }

        document.getElementById('pageTitle').textContent = 'SIGP';
        this.showEmptyState();
    }

    /**
     * Loads a page into a tab
     */
    loadPageInTab(tabId, pageName) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;


        tab.pageName = pageName;
        tab.title = this.getPageTitle(pageName);

        tab.element.querySelector('.tab-title').textContent = tab.title;
        tab.element.querySelector('.tab-icon').textContent = this.getPageIcon(pageName);

        tab.contentElement.innerHTML = '';

        const tempContent = document.createElement('div');
        tempContent.id = `temp-content-${tabId}`;
        tempContent.className = 'tab-content active';

        this.pageManager.contentArea = tempContent;

        const isActiveTab = this.activeTabId === tabId;
        this.pageManager.loadPage(pageName, { updateTitle: isActiveTab });
        tab.contentElement.innerHTML = tempContent.innerHTML;
        this.pageManager.contentArea = tab.contentElement;
        this.pageManager.initializePageListeners(pageName);

        if (this.activeTabId === tabId) {
            document.getElementById('pageTitle').textContent = tab.title;
        }

    }

    /**
     * Opens a page in a new tab or switches to existing tab
     */
    openPage(pageName) {
        const existingTab = this.tabs.find(t => t.pageName === pageName);

        if (existingTab) {
            this.switchTab(existingTab.id);
        } else {
            const pageTitle = this.getPageTitle(pageName);
            this.createTab(pageName, pageTitle);
        }
    }

    /**
     * Opens page from quick access buttons
     * If current tab is "Home", transforms it into the desired page
     * Otherwise, opens new tab
     */
    openPageFromQuickAccess(pageName) {
        const existingTab = this.tabs.find(t => t.pageName === pageName);

        if (existingTab) {
            this.switchTab(existingTab.id);
            return;
        }

        const activeTab = this.tabs.find(t => t.id === this.activeTabId);

        if (!activeTab) {
            this.openPage(pageName);
            return;
        }

        if (activeTab.pageName === 'home') {
            this.loadPageInTab(this.activeTabId, pageName);
        } else {
            this.openPage(pageName);
        }
    }

    /**
     * Gets the title of a page
     */
    getPageTitle(pageName) {
        const titles = {
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
            'gestao-pessoal': 'Gestão Pessoal',
            'suporte': 'Suporte e Ajuda'
        };
        return titles[pageName] || 'Page';
    }

    /**
     * Gets the icon of a page
     */
    getPageIcon(pageName) {
        const icons = {
            'home': '🏠',
            'resumo-financeiro': '📊',
            'renda-mensal': '💵',
            'gastos': '💳',
            'relatorio-financeiro': '📊',
            'anotacoes': '📝',
            'exames-medicos': '🏥',
            'documentos': '📄',
            'treinos': '💪',
            'configuracoes': '⚙️',
            'gestao-pessoal': '📋',
            'suporte': '❓'
        };
        return icons[pageName] || '📄';
    }

    /**
     * Updates the active item in the sidebar
     */
    updateSidebarActive(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`[data-page="${pageName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Sets up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.createTab('home', 'Início');
            }

            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.activeTabId) {
                    this.closeTab(this.activeTabId);
                }
            }

            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
                const nextIndex = (currentIndex + 1) % this.tabs.length;
                this.switchTab(this.tabs[nextIndex].id);
            }

            if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
                const prevIndex = currentIndex === 0 ? this.tabs.length - 1 : currentIndex - 1;
                this.switchTab(this.tabs[prevIndex].id);
            }

            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key, 10) - 1;
                if (this.tabs[tabIndex]) {
                    this.switchTab(this.tabs[tabIndex].id);
                }
            }
        });
    }

    /**
     * Gets the active tab
     */
    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    /**
     * Reloads the content of a tab
     */
    refreshTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        this.resetHandlerState(tab.pageName);

        tab.cachedState = {};

        this.loadPageInTab(tabId, tab.pageName);

        const refreshBtn = tab.element.querySelector('.btn-refresh-tab');
        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
            setTimeout(() => {
                refreshBtn.classList.remove('spinning');
            }, 500);
        }
    }

    /**
     * Resets the state of page handlers to their initial values
     * @param {string} pageName - Name of the page
     */
    resetHandlerState(pageName) {
        const handlerMap = {
            'treinos': () => window.trainingHandler,
            'gestao-pessoal': () => window.personalHandler,
            'anotacoes': () => window.personalHandler,
            'exames-medicos': () => window.examsHandler,
            'documentos': () => window.documentsHandler,
            'configuracoes': () => window.settingsHandler,
            'suporte': () => window.supportHandler
        };

        const getHandler = handlerMap[pageName];
        if (getHandler) {
            const handler = getHandler();
            if (handler && typeof handler.resetState === 'function') {
                handler.resetState();
            }
        }
    }

    /**
     * Shows empty state when no tabs are open
     */
    showEmptyState() {
        const tabsContainer = document.getElementById('tabsContainer');
        tabsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📑</div>
                <h2>Sem abas abertas</h2>
                <p>Click "+ Nova aba" ou selecione a página pela barra lateral para começar</p>
                <button class="btn-primary" onclick="window.tabManager.createTab('home', 'Home')">
                    🏠 Abrir Página inicial
            </button>
        </div>
    `;
    }
}
