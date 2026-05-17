/**
 * @file dashboard.js
 * @description Dashboard entry point and initialization orchestrator.
 * 
 * Contents:
 * - Theme loading from localStorage
 * - Firebase Auth state listener
 * - DashboardManager initialization
 * - PageManager and TabManager creation
 * - Global manager exposure (window.pageManager, window.tabManager)
 * 
 * Initialization Order:
 * 1. Load saved theme (before DOM ready)
 * 2. DOMContentLoaded: Initialize UserService
 * 3. onAuthStateChanged: Wait for Firebase Auth
 * 4. Create managers in sequence: Dashboard → Page → Tab
 * 
 * Dependencies:
 * - PageManager (ES6 module)
 * - UserService (ES6 module)
 * - Firebase Auth (onAuthStateChanged)
 * - DashboardManager, TabManager (global scripts)
 * 
 * @author Leandro Fialho Fernandes
 */

import { PageManager } from './PageManager.js';
import { UserService } from '../services/UserService.js';
import { DigestService } from '../services/DigestService.js';
import { auth } from '../core/firebaseConfig.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

/**
 * Dashboard initialization with authentication check
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
}

loadSavedTheme();

document.addEventListener('DOMContentLoaded', () => {
    window.userService = new UserService();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const dashboardManager = new DashboardManager();
            window.pageManager = new PageManager();
            window.tabManager = new TabManager(window.pageManager);

            versionManager.init();

            window.currentUserId = user.uid;
            window.digestService = new DigestService();
            window.digestService.checkAndSend(
                user.uid,
                user.email,
                user.displayName || user.email
            );
        } else {
            window.location.href = 'index.html';
        }
    });
});
