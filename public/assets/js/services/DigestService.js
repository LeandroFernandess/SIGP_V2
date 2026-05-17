/**
 * @file DigestService.js
 * @description Thin client for the SIGP AI email digest.
 *
 * Responsibilities:
 * - Load / save notification preferences in Firestore
 * - Invoke the `sendDigestOnLogin` HTTPS callable right after login
 * - Invoke the `sendDigestNow` HTTPS callable from the "Enviar agora" button
 * - Surface success/failure to the user
 *
 * Why so small:
 * - All OpenAI prompt construction and EmailJS delivery live in the
 *   Cloud Functions (see `/functions/index.js`) so secrets never reach the
 *   browser. If a callable fails we surface the error instead of trying to
 *   call OpenAI/EmailJS from the client.
 *
 * Firestore Prefs Path:
 *   /artifacts/{appId}/users/{uid}/notifications/preferences
 *
 * @author Leandro Fialho Fernandes
 */

import {
    db, doc, setDoc, getDoc, appId,
    functionsClient, httpsCallable
} from '../core/firebaseConfig.js';

/**
 * @class DigestService
 * @description Orchestrates the AI digest delivery via Cloud Functions.
 */
export class DigestService {

    // ─────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Called by the dashboard right after a successful login. If the user
     * has the digest enabled, invokes `sendDigestOnLogin`. Never throws —
     * a failing digest must not block the dashboard from initialising.
     *
     * @param {string} userId    - Firebase Auth uid
     * @param {string} _email    - kept for backwards compatibility (unused)
     * @param {string} _name     - kept for backwards compatibility (unused)
     * @returns {Promise<void>}
     */
    async checkAndSend(userId, _email, _name) {
        try {
            const prefs = await this.loadPrefs(userId);
            if (!prefs || !prefs.enabled) return;

            if (!functionsClient || typeof httpsCallable !== 'function') {
                Logger.warn('[DigestService] Cloud Functions client not available; digest skipped.');
                return;
            }

            const callable = httpsCallable(functionsClient, 'sendDigestOnLogin');
            await callable({});
            Logger.info('[DigestService] Login digest dispatched via backend.');
        } catch (err) {
            Logger.error('[DigestService] Error during login digest:', err);
        }
    }

    /**
     * Sends the digest immediately, used by the "Enviar agora" button.
     * Throws on failure so the UI can surface the error.
     *
     * @param {string} _userId - kept for backwards compatibility (unused)
     * @param {string} _email  - kept for backwards compatibility (unused)
     * @param {string} _name   - kept for backwards compatibility (unused)
     * @returns {Promise<void>}
     */
    async sendNow(_userId, _email, _name) {
        if (!functionsClient || typeof httpsCallable !== 'function') {
            throw new Error('Cloud Functions client indisponível. Tente novamente em alguns instantes.');
        }

        const callable = httpsCallable(functionsClient, 'sendDigestNow');
        await callable({});
        this._showToast();
    }

    /**
     * Loads notification preferences from Firestore.
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    async loadPrefs(userId) {
        try {
            const path = `artifacts/${appId}/users/${userId}/notifications`;
            const prefsDoc = doc(db, path, 'preferences');
            const snap = await getDoc(prefsDoc);
            return snap.exists() ? snap.data() : null;
        } catch (err) {
            Logger.error('[DigestService] Failed to load prefs:', err);
            return null;
        }
    }

    /**
     * Saves notification preferences to Firestore.
     *
     * Uses `{ merge: true }` so the backend's `lastSentAt` write does not
     * overwrite the full preferences document and vice-versa. The UI is
     * responsible for always sending the complete set of toggles when the
     * user clicks "Salvar Preferências".
     *
     * @param {string} userId
     * @param {Object} prefs
     * @returns {Promise<void>}
     */
    async savePrefs(userId, prefs) {
        const path = `artifacts/${appId}/users/${userId}/notifications`;
        const prefsDoc = doc(db, path, 'preferences');
        await setDoc(prefsDoc, prefs, { merge: true });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Shows a brief success toast after a digest is dispatched.
     * Only fires when SweetAlert2 is available on the page.
     * @returns {void}
     * @private
     */
    _showToast() {
        if (typeof Swal === 'undefined') return;
        Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        }).fire({
            icon: 'info',
            title: '📧 Resumo enviado para o seu email!'
        });
    }
}
