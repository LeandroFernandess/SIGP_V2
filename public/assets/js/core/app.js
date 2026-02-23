/**
 * @file app.js
 * @description Main entry point for the SIGP application.
 * Orchestrates system initialization, Firebase validation and UI managers.
 * 
 * Contents:
 * - DOMContentLoaded event listener
 * - Service instantiation (UserService)
 * - Manager instantiation (FormManager, LoadingManager)
 * - Handler instantiation (Login, Register, ForgotPassword)
 * - Error handling for Firebase configuration issues
 * 
 * Page Flow:
 * - index.html: Login/Register forms (managed by this file)
 * - dashboard.html: Main page after login (managed by dashboard.js)
 * 
 * Dependencies:
 * - UserService (Firebase Auth operations)
 * - LoginHandler, RegisterHandler, ForgotPasswordHandler
 * - FormManager, LoadingManager, UIManager (global)
 * - Validator (global)
 * 
 * @author Leandro Fialho Fernandes
 */

import { UserService } from '../services/UserService.js';
import { LoginHandler } from '../auth/LoginHandler.js';
import { RegisterHandler } from '../auth/RegisterHandler.js';
import { ForgotPasswordHandler } from '../auth/ForgotPasswordHandler.js';

/**
 * Application initialization
 * Waits for full DOM load before executing
 * 
 * @listens DOMContentLoaded
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If Firebase is not configured correctly
 */
document.addEventListener('DOMContentLoaded', async () => {

    try {
        const userService = new UserService();

        window.UserService = userService;

        const formManager = new FormManager();
        const loadingManager = new LoadingManager();
        
        window.loadingManager = loadingManager;

        new LoginHandler(userService, UIManager, loadingManager);
        new RegisterHandler(userService, UIManager, Validator, formManager);
        new ForgotPasswordHandler(userService, UIManager, formManager);

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao inicializar aplicação:', error);
        console.error('❌ Verifique se Firebase está configurado em firebaseConfig.js');
        console.error('📚 Consulte: CONFIGURACAO_RAPIDA.md');

        alert('❌ Erro ao inicializar aplicação!\n\nO Firebase não está configurado corretamente.\n\nConsulte CONFIGURACAO_RAPIDA.md para configurar.');
    }
});
