/**
 * @file LoadingManager.js
 * @description Loading overlay manager with visual states and animations.
 * 
 * Contents:
 * - show(): Display loading overlay with message
 * - showSuccess(): Display success state with checkmark
 * - hide(): Fade out and hide overlay
 * - Progress bar animation
 * 
 * Visual States:
 * - Loading: Spinner + message + progress bar
 * - Success: Checkmark + success message + 100% progress
 * - Hidden: Fade-out transition
 * 
 * Dependencies: None (standalone)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class LoadingManager
 * @description Manages loading overlay and visual states
 * 
 * @property {HTMLElement} overlay - Main loading container
 * @property {HTMLElement} spinner - Rotating loading icon
 * @property {HTMLElement} checkmark - Success icon
 * @property {HTMLElement} loadingText - Main text
 * @property {HTMLElement} loadingSubtext - Secondary text
 * @property {HTMLElement} progressBar - Progress bar
 * 
 * @example
 * const loadingManager = new LoadingManager();
 * loadingManager.show('Saving data...');
 * // ... async operation ...
 * loadingManager.showSuccess('Data saved!');
 * loadingManager.hide(1000);
 */
class LoadingManager {

    /**
     * @description Initializes the manager and gets DOM element references
     */
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
        this.spinner = document.getElementById('spinner');
        this.checkmark = document.getElementById('checkmark');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');
        this.progressBar = document.getElementById('loadingProgressBar');
    }

    /**
     * Shows the loading overlay
     * @param {string} message - Main message
     * @param {string} subtext - Secondary message
     */
    show(message = 'Carregando...', subtext = 'Por favor, aguarde') {
        this.spinner.style.display = 'block';
        this.checkmark.classList.remove('active');
        this.loadingText.textContent = message;
        this.loadingSubtext.textContent = subtext;
        this.progressBar.style.width = '0';
        this.progressBar.classList.remove('animated');
        this.overlay.classList.add('active');
        this.overlay.classList.remove('fade-out');

        setTimeout(() => {
            this.progressBar.classList.add('animated');
        }, 100);
    }

    /**
     * Shows success state
     * @param {string} message - Success message
     * @param {string} subtext - Secondary message
     */
    showSuccess(message = 'Sucesso!', subtext = 'Redirecionando...') {
        this.spinner.style.display = 'none';
        this.checkmark.classList.add('active');
        this.loadingText.textContent = message;
        this.loadingSubtext.textContent = subtext;
        this.progressBar.style.width = '100%';
    }

    /**
     * Hides the loading overlay
     * @param {number} delay - Delay before hiding (ms)
     */
    hide(delay = 0) {
        setTimeout(() => {
            this.overlay.classList.add('fade-out');
            
            setTimeout(() => {
                this.overlay.classList.remove('active', 'fade-out');
            }, 500);
        }, delay);
    }

    /**
     * Shows loading, then success, then hides
     * @param {Object} options - Configuration options
     */
    async showSequence(options = {}) {
        const {
            loadingMessage = 'Autenticando...',
            loadingSubtext = 'Por favor, aguarde',
            successMessage = 'Login realizado!',
            successSubtext = 'Redirecionando para o dashboard...',
            loadingDuration = 800,
            successDuration = 1200
        } = options;

        this.show(loadingMessage, loadingSubtext);

        await new Promise(resolve => setTimeout(resolve, loadingDuration));

        this.showSuccess(successMessage, successSubtext);

        await new Promise(resolve => setTimeout(resolve, successDuration));

        this.hide();
    }
}
