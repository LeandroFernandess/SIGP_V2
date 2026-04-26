/**
 * @file VersionManager.js
 * @description System version management with automated tracking and changelog display.
 * 
 * Contents:
 * - Version loading from version.json
 * - Version badge rendering in sidebar footer
 * - Changelog modal with SweetAlert2
 * - Semantic versioning comparison
 * - Update detection for PWA/cache invalidation
 * 
 * Features:
 * - Centralized version control
 * - Automatic build date tracking
 * - Interactive changelog modal
 * - Semantic Versioning 2.0.0 compliance
 * 
 * Dependencies: Logger.js, SweetAlert2
 * Used by: dashboard.js (initialization)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class VersionManager
 * @description Manages system version display and changelog functionality
 */
class VersionManager {
    /**
     * Creates a VersionManager instance
     */
    constructor() {
        this.versionData = null;
        this.versionPath = 'version.json';
    }

    /**
     * Loads version data from version.json file
     * @returns {Promise<Object>} Version data object
     */
    async loadVersion() {
        try {
            const response = await fetch(this.versionPath);

            if (!response.ok) {
                throw new Error(`Failed to load version: ${response.status}`);
            }

            this.versionData = await response.json();
            Logger.info('📦 System version loaded:', this.versionData.version);

            return this.versionData;
        } catch (error) {
            Logger.error('❌ Error loading version file:', error);

            this.versionData = {
                version: '2.0.0',
                buildDate: new Date().toISOString(),
                changelog: []
            };

            return this.versionData;
        }
    }

    /**
     * Returns current system version
     * @returns {string} Version in MAJOR.MINOR.PATCH format
     */
    getVersion() {
        return this.versionData?.version || '2.0.0';
    }

    /**
     * Returns formatted build date
     * @param {string} locale - Locale for date formatting (default: 'pt-BR')
     * @returns {string} Formatted date string
     */
    getBuildDate(locale = 'pt-BR') {
        if (!this.versionData?.buildDate) {
            return new Date().toLocaleDateString(locale);
        }

        const date = new Date(this.versionData.buildDate);
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Returns complete changelog history
     * @returns {Array<Object>} Array of version entries with changes
     */
    getChangelog() {
        return this.versionData?.changelog || [];
    }

    /**
     * Returns changes for current version
     * @returns {Array<string>} Array of change descriptions
     */
    getCurrentChanges() {
        const changelog = this.getChangelog();
        const currentVersion = this.getVersion();

        const current = changelog.find(entry => entry.version === currentVersion);
        return current?.changes || [];
    }

    /**
     * Renders version badge component in dashboard footer
     * @param {string} containerId - Container element ID (default: 'versionBadge')
     */
    renderVersionBadge(containerId = 'versionBadge') {
        const container = document.getElementById(containerId);

        if (!container) {
            Logger.warn('⚠️ Contêiner de versão não encontrado:', containerId);
            return;
        }

        const version = this.getVersion();
        const buildDate = this.getBuildDate();

        container.innerHTML = `
            <div class="version-badge">
                <div class="version-info">
                    <span class="version-number" title="Versão atual do sistema">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        v${version}
                    </span>
                    <span class="version-separator">•</span>
                    <span class="build-date" title="Data do ultimo deploy">
                        ${buildDate}
                    </span>
                </div>
                <button class="btn-changelog" onclick="versionManager.showChangelog()" title="Ver changelog">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Displays changelog modal with version history
     */
    async showChangelog() {
        const changelog = this.getChangelog();

        if (!changelog || changelog.length === 0) {
            Swal.fire({
                title: 'Histórico de Versões',
                text: 'Nenhum changelog disponível.',
                icon: 'info',
                confirmButtonText: 'Fechar'
            });
            return;
        }

        const changelogHTML = changelog.map(entry => `
            <div class="changelog-entry">
                <div class="changelog-header">
                    <h3 class="changelog-version">v${entry.version}</h3>
                    <span class="changelog-date">${new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <ul class="changelog-changes">
                    ${entry.changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        await Swal.fire({
            title: '📝 Histórico de Versões',
            html: `
                <div class="changelog-container">
                    ${changelogHTML}
                </div>
            `,
            width: '700px',
            showCloseButton: false,
            allowOutsideClick: false,
            showConfirmButton: true,
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'changelog-modal',
                htmlContainer: 'changelog-content'
            }
        });
    }

    /**
     * Checks if a new version is available (useful for PWA/cache)
     * @param {string} currentVersion - Current version stored locally
     * @returns {Promise<boolean>} True if new version available
     */
    async checkForUpdates(currentVersion) {
        await this.loadVersion();
        const latestVersion = this.getVersion();

        if (this.compareVersions(latestVersion, currentVersion) > 0) {
            Logger.info('🆕 New version available:', latestVersion);
            return true;
        }

        return false;
    }

    /**
     * Compares two semantic versions
     * @param {string} v1 - First version
     * @param {string} v2 - Second version
     * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }

        return 0;
    }

    /**
     * Initializes VersionManager
     * Loads version data and renders badge
     */
    async init() {
        try {
            await this.loadVersion();
            this.renderVersionBadge();

            Logger.info('🚀 VersionManager initialized successfully');
        } catch (error) {
            Logger.error('❌ Error initializing VersionManager:', error);
        }
    }
}

const versionManager = new VersionManager();
