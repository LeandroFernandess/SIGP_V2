/**
 * @file emailjsInit.js
 * @description EmailJS client initialization for contact forms.
 * 
 * Contents:
 * - IIFE initialization function
 * - EmailJS client configuration
 * - Public key setup
 * 
 * Dependencies:
 * - EmailJS library (loaded via CDN in HTML)
 * 
 * @author Leandro Fialho Fernandes
 */

(function initEmailJS() {
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS não foi carregado antes da inicialização.');
        return;
    }

    emailjs.init({
        publicKey: '5JgttFH7TW0i34yAr'
    });
})();
