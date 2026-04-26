/**
 * @file DashboardManager.js
 * @description Main dashboard controller for authentication and sidebar.
 * 
 * Contents:
 * - Authentication verification (sessionStorage)
 * - Sidebar toggle and navigation
 * - User info display
 * - Logout functionality
 * - Folder toggles for navigation menu
 * 
 * Dependencies:
 * - FormUtils (getCurrentUser)
 * - sessionStorage (user session)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class DashboardManager
 * @description Manages the main dashboard and authentication
 */
class DashboardManager {
    
    /**
     * @description Initializes the dashboard and verifies authentication
     * 
     * Flow:
     * 1. Checks if there's an authenticated user in sessionStorage
     * 2. If not authenticated: redirects to login
     * 3. If authenticated: initializes elements, listeners, and loads data
     */
    constructor() {
        this.currentUser = this.getCurrentUser();
        
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }

        this.initializeElements();
        this.setupEventListeners();
        this.loadUserInfo();
    }

    /**
     * Gets the logged-in user from session
     * @returns {Object|null} Current user data or null
     */
    getCurrentUser() {
        return typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser 
            ? FormUtils.getCurrentUser() 
            : null;
    }

    /**
     * Redirects to the login page
     */
    redirectToLogin() {
        window.location.href = 'index.html';
    }

    /**
     * Initializes DOM elements
     */
    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.btnToggleSidebar = document.getElementById('btnToggleSidebar');
        this.btnCloseSidebar = document.getElementById('btnCloseSidebar');
        this.btnLogout = document.getElementById('btnLogout');
        this.btnHome = document.getElementById('btnHome');
        this.folderToggles = document.querySelectorAll('.nav-folder-toggle');
        this.navItems = document.querySelectorAll('.nav-item');
    }

    /**
     * Sets up event listeners
     */
    setupEventListeners() {
        this.btnToggleSidebar?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        this.sidebarOverlay?.addEventListener('click', () => {
            this.closeSidebar();
        });

        this.btnCloseSidebar?.addEventListener('click', () => {
            this.closeSidebar();
        });

        this.btnLogout?.addEventListener('click', () => {
            this.logout();
        });

        this.btnHome?.addEventListener('click', () => {
            const homeNavItem = document.querySelector('[data-page="home"]');
            if (homeNavItem) {
                this.navigateToPage('home', homeNavItem);
            }
        });

        this.folderToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.toggleFolder(e.currentTarget);
            });
        });

        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigateToPage(page, item);
                }
            });
        });

        if (window.innerWidth <= 768) {
            this.navItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.sidebar.classList.remove('open');
                });
            });
        }
    }

    /**
     * Loads user information
     */
    loadUserInfo() {
        const userId = document.getElementById('userId');
        const userName = document.getElementById('userName');
        const userInitials = document.getElementById('userInitials');

        if (userId && this.currentUser.username) {
            userId.textContent = this.currentUser.username;
        }

        if (userName && this.currentUser.name) {
            userName.textContent = this.currentUser.name;
        }

        if (userInitials && this.currentUser.name) {
            const initials = this.currentUser.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            userInitials.textContent = initials;
        }
    }

    /**
     * Toggles folder open/close state
     */
    toggleFolder(toggle) {
        const folderName = toggle.dataset.folder;
        const content = document.querySelector(`[data-folder-content="${folderName}"]`);

        toggle.classList.toggle('open');
        content.classList.toggle('open');
    }

    /**
     * Toggles sidebar (mobile)
     */
    toggleSidebar() {
        this.sidebar?.classList.toggle('open');
        this.sidebarOverlay?.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }

    /**
     * Closes sidebar (mobile)
     */
    closeSidebar() {
        this.sidebar?.classList.remove('open');
        this.sidebarOverlay?.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    /**
     * Navigates to a page
     */
    navigateToPage(pageName, navItem) {
        this.closeSidebar();

        this.navItems.forEach(item => item.classList.remove('active'));
        
        navItem.classList.add('active');

        if (window.tabManager) {
            window.tabManager.openPage(pageName);
        } else {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = navItem.querySelector('.nav-text').textContent;
            }
            window.pageManager?.loadPage(pageName);
        }
    }

    /**
     * Logs out the user
     */
    logout() {
        Swal.fire({
            icon: 'question',
            title: 'Sair do sistema?',
            text: 'Você será desconectado da sua conta.',
            showCancelButton: true,
            confirmButtonText: 'Sim, sair',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Até logo!',
                    text: 'Você foi desconectado com sucesso.',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                }).then(() => {
                    sessionStorage.removeItem('currentUser');
                    this.redirectToLogin();
            });
        }
    });
    }
}