/**
 * @file FormManager.js
 * @description Navigation manager for authentication forms transitions.
 * 
 * Contents:
 * - Form references (login, register, forgotPassword)
 * - Navigation event listeners
 * - switchForm(): Animated form transitions
 * - resetForm(): Clear form fields
 * 
 * Managed Forms:
 * - login: Authentication form
 * - register: Registration form  
 * - forgotPassword: Password recovery form
 * 
 * Dependencies: None (standalone)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class FormManager
 * @description Manages transitions and navigation between forms
 * 
 * @property {Object} forms - DOM forms mapping
 * @property {HTMLElement} forms.login - Login form
 * @property {HTMLElement} forms.register - Register form
 * @property {HTMLElement} forms.forgotPassword - Recovery form
 * 
 * @example
 * const formManager = new FormManager();
 * formManager.switchForm('login', 'register');
 */
class FormManager {

    /**
     * @description Initializes the manager and configures navigation listeners
     */
    constructor() {
        this.forms = {
            login: document.getElementById('loginForm'),
            register: document.getElementById('registerForm'),
            forgotPassword: document.getElementById('forgotPasswordForm')
        };

        this.initializeNavigation();
    }

    /**
     * Initializes navigation event listeners
     */
    initializeNavigation() {
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login', 'register');
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('register', 'login');
        });

        document.getElementById('showForgotPassword')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login', 'forgotPassword');
        });

        document.getElementById('backToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('forgotPassword', 'login');
        });
    }

    /**
     * Switches between forms with animation
     * @param {string} hideFormKey - Key of the form to hide
     * @param {string} showFormKey - Key of the form to show
     */
    switchForm(hideFormKey, showFormKey) {
        const hideForm = this.forms[hideFormKey];
        const showForm = this.forms[showFormKey];

        if (!hideForm || !showForm) {
            Logger.error('Formulário não encontrado');
            return;
        }

        hideForm.classList.remove('active');

        setTimeout(() => {
            showForm.classList.add('active');
        }, 300);
    }

    /**
     * Resets a specific form
     * @param {string} formKey - Form key
     */
    resetForm(formKey) {
        const form = this.forms[formKey];
        if (form) {
            form.reset();
            
            if (formKey === 'register') {
                const methodSelection = document.getElementById('methodSelection');
                const formMethodContent = document.getElementById('formMethodContent');
                if (methodSelection && formMethodContent) {
                    methodSelection.style.display = 'block';
                    formMethodContent.style.display = 'none';
                }
            }
        }
    }
}
