/**
 * @file ThemeManager.js
 * @description Theme manager for light/dark mode with persistence.
 * 
 * Contents:
 * - Theme loading from localStorage
 * - Theme toggling (light/dark)
 * - Automatic theme application on page load
 * - Theme persistence across sessions
 * 
 * Features:
 * - Prevents FOUC (Flash of Unstyled Content)
 * - Automatic initialization
 * 
 * Dependencies: None (standalone utility)
 * Used by: PreferencesModule, all pages
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ThemeManager
 * @description Manages light and dark themes with persistence and UI integration.
 */
class ThemeManager {

    /**
     * Creates a new ThemeManager and wires initial behavior.
     */
    constructor() {
        this.themeToggleBtn = null;
        this.initialize();
    }

    /**
     * Initializes theme loading and event bindings after DOM is ready.
     * Ensures saved theme is applied before other scripts run.
     */
    initialize() {
        this.loadSavedTheme();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    /**
     * Loads previously saved theme preference and applies it to the body.
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';

        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        }

        void document.body.offsetHeight;

        this.updateThemeColor(savedTheme);
    }

    /**
     * Configures UI event listeners for theme toggling.
     */
    setupEventListeners() {
        this.themeToggleBtn = document.getElementById('themeToggle');

        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Toggles between light and dark themes and persists selection.
     */
    toggleTheme() {
        const body = document.body;
        const isLight = body.classList.contains('light-theme');
        const newTheme = isLight ? 'dark' : 'light';

        if (this.themeToggleBtn) {
            this.themeToggleBtn.classList.add('theme-toggling');
        }

        body.classList.add('theme-switching');

        if (isLight) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }

        void body.offsetHeight;

        this.updateThemeColor(newTheme);

        localStorage.setItem('theme', newTheme);

        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));

        setTimeout(() => {
            body.classList.remove('theme-switching');
            if (this.themeToggleBtn) {
                this.themeToggleBtn.classList.remove('theme-toggling');
            }
        }, 500);
    }

    /**
     * Sets a specific theme and saves it.
     * @param {string} theme - Accepts 'light' or 'dark'.
     */
    setTheme(theme) {
        const body = document.body;

        body.classList.add('theme-switching');

        if (theme === 'light') {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        }

        void body.offsetHeight;

        this.updateThemeColor(theme);
        localStorage.setItem('theme', theme);

        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));

        setTimeout(() => {
            body.classList.remove('theme-switching');
        }, 500);
    }

    /**
     * Updates the meta theme-color tag for mobile status bar.
     * @param {string} theme - 'light' or 'dark'
     */
    updateThemeColor(theme) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content',
                theme === 'light' ? '#f5f7fb' : '#0f172a'
            );
        }
    }

    /**
     * Returns the current active theme.
     * @returns {string} 'light' or 'dark'
     */
    getCurrentTheme() {
        return document.body.classList.contains('light-theme') ? 'light' : 'dark';
    }
}

const themeManager = new ThemeManager();

if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    window.themeManager = themeManager;
}
