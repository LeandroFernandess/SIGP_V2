/**
 * @file DigestService.js
 * @description AI-powered email digest service using OpenAI + EmailJS.
 *
 * Contents:
 * - checkAndSend(): Main entry — checks if digest should be sent and sends it
 * - loadPrefs(): Load notification preferences from Firestore
 * - savePrefs(): Save notification preferences to Firestore
 * - _shouldSend(): Frequency/timing logic (daily / weekly)
 * - _collectAllData(): Gathers all user data from Firestore
 * - _buildPrompt(): Constructs OpenAI prompt with user data
 * - _callOpenAI(): Calls OpenAI Chat Completions API (gpt-4o)
 * - _sendEmail(): Sends digest via EmailJS
 * - _updateLastSentAt(): Updates lastSentAt timestamp in Firestore
 *
 * Frequency Logic:
 * - daily:  send if lastSentAt is null OR > 23 hours ago
 * - weekly: send if lastSentAt is null OR (> 6 days ago AND today == weekday pref)
 *
 * Firestore Prefs Path:
 * /artifacts/{appId}/users/{uid}/notifications/preferences
 *
 * Dependencies:
 * - firebaseConfig.js (db, auth, appId, Firestore methods)
 * - firebase.env.js (openaiApiKey)
 * - EmailJS (loaded via CDN, window.emailjs)
 *
 * @author Leandro Fialho Fernandes
 */

import {
    db, auth, doc, collection, setDoc, getDoc, getDocs, appId
} from '../core/firebaseConfig.js';
import { openaiApiKey } from '../core/firebase.env.js';

/**
 * @class DigestService
 * @description Manages AI digest generation and email delivery
 */
export class DigestService {

    constructor() {
        this.emailjsServiceId = 'service_oyf1zei';
        this.emailjsTemplateId = 'template_lqll858';
        this.openaiModel = 'gpt-4o';
        this.openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Checks if a digest should be sent and sends it if so.
     * Call this once on dashboard initialisation.
     *
     * @param {string} userId    - Firebase Auth uid
     * @param {string} userEmail - User's email address
     * @param {string} userName  - User's display name
     * @returns {Promise<void>}
     */
    async checkAndSend(userId, userEmail, userName) {
        try {
            if (!openaiApiKey || openaiApiKey.startsWith('YOUR_')) {
                Logger.warn('[DigestService] OpenAI key not configured — digest skipped.');
                return;
            }

            const prefs = await this.loadPrefs(userId);
            if (!prefs || !prefs.enabled) return;

            if (!this._shouldSend(prefs)) return;

            Logger.info('[DigestService] Preparing digest for ' + (userName || userEmail));

            const data = await this._collectAllData(userId);
            const prompt = this._buildPrompt(userName || 'Usuário', data, prefs);
            const summary = await this._callOpenAI(prompt);

            await this._sendEmail(userEmail, userName || 'Usuário', summary, data, prefs);
            await this._updateLastSentAt(userId);

            this._showToast();
        } catch (err) {
            Logger.error('[DigestService] Error during digest:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro ao enviar resumo',
                    text: err.message,
                    footer: 'Verifique o console para mais detalhes.'
                });
            }
        }
    }

    /**
     * Sends the digest immediately, bypassing the timing/frequency check.
     * Used by the "Enviar agora" button in Preferences settings.
     * @param {string} userId
     * @param {string} email
     * @param {string} name
     * @returns {Promise<void>}
     */
    async sendNow(userId, email, name) {
        const prefs = await this.loadPrefs(userId) || {};
        const data = await this._collectAllData(userId);
        const prompt = this._buildPrompt(name || 'Usuário', data, prefs);
        const summary = await this._callOpenAI(prompt);
        await this._sendEmail(email, name || 'Usuário', summary, data, prefs);
        await this._updateLastSentAt(userId);
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
     * @param {string} userId
     * @param {Object} prefs - { enabled, frequency, weekday, lastSentAt }
     * @returns {Promise<void>}
     */
    async savePrefs(userId, prefs) {
        const path = `artifacts/${appId}/users/${userId}/notifications`;
        const prefsDoc = doc(db, path, 'preferences');
        await setDoc(prefsDoc, prefs, { merge: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — Timing Logic
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns true if the digest should be sent now based on prefs.
     * @param {Object} prefs
     * @returns {boolean}
     */
    _shouldSend(prefs) {
        const { frequency, weekday, lastSentAt, sendHour = 8 } = prefs;

        const now = new Date();
        if (now.getHours() < sendHour) return false;

        if (!lastSentAt) return true;

        const last = lastSentAt.toDate ? lastSentAt.toDate() : new Date(lastSentAt);
        const diffMs = now - last;
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (frequency === 'daily') {
            return diffHrs >= 23;
        }

        if (frequency === 'weekly') {
            const diffDays = diffHrs / 24;
            const todayDay = now.getDay(); // 0=Sun, 6=Sat
            return diffDays >= 6 && todayDay === (weekday ?? 1);
        }

        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — Data Collection
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Collects all relevant user data from Firestore.
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async _collectAllData(userId) {
        const base = `artifacts/${appId}/users/${userId}`;

        const [tasks, income, fixedExpenses, creditExpenses, exams, shopping, wishlist, training] =
            await Promise.all([
                this._fetchCollection(`${base}/tasks`),
                this._fetchCollection(`${base}/income`),
                this._fetchCollection(`${base}/fixedExpenses`),
                this._fetchCollection(`${base}/creditExpenses`),
                this._fetchCollection(`${base}/exams`),
                this._fetchCollection(`${base}/shopping`),
                this._fetchCollection(`${base}/wishlist`),
                this._fetchCollection(`${base}/training`),
            ]);

        return { tasks, income, fixedExpenses, creditExpenses, exams, shopping, wishlist, training };
    }

    /**
     * Fetches all documents from a Firestore collection path.
     * @param {string} path
     * @returns {Promise<Array>}
     */
    async _fetchCollection(path) {
        try {
            const snap = await getDocs(collection(db, path));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch {
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — OpenAI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds the prompt sent to OpenAI, filtered by user include prefs.
     * @param {string} userName
     * @param {Object} data
     * @param {Object} prefs
     * @returns {{ system: string, user: string }}
     */
    _buildPrompt(userName, data, prefs = {}) {
        const inc = {
            finance: prefs.inclFinance !== false,
            tasks: prefs.inclTasks !== false,
            exams: prefs.inclExams !== false,
            shopping: prefs.inclShopping !== false,
            training: prefs.inclTraining !== false,
        };

        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const pendingTasks = inc.tasks ? data.tasks.filter(t => !t.completed && !t.done) : [];
        const upcomingExams = inc.exams ? data.exams.filter(e => e.date && new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5) : [];
        const pendingShopping = inc.shopping ? data.shopping.filter(s => !s.purchased && !s.completed) : [];
        const totalIncome = inc.finance ? data.income.reduce((sum, r) => sum + (Number(r.value) || 0), 0) : 0;
        const totalFixed = inc.finance ? data.fixedExpenses.reduce((sum, r) => sum + (Number(r.value) || 0), 0) : 0;
        const totalCredit = inc.finance ? data.creditExpenses.reduce((sum, r) => sum + (Number(r.installmentValue) || 0), 0) : 0;

        const sections = [];
        if (inc.finance) {
            sections.push(`FINANÇAS:\n- Renda total: R$ ${totalIncome.toFixed(2)}\n- Gastos fixos mensais: R$ ${totalFixed.toFixed(2)}\n- Gastos no cartão: R$ ${totalCredit.toFixed(2)}\n- Saldo estimado: R$ ${(totalIncome - totalFixed - totalCredit).toFixed(2)}`);
        }
        if (inc.tasks) {
            sections.push(`TAREFAS PENDENTES (${pendingTasks.length}):\n${pendingTasks.slice(0, 8).map(t => `- [${t.priority || 'média'}] ${t.title || t.name || 'Tarefa'}`).join('\n') || '- Nenhuma'}`);
        }
        if (inc.exams) {
            sections.push(`EXAMES MÉDICOS PRÓXIMOS (${upcomingExams.length}):\n${upcomingExams.map(e => `- ${e.name || e.examName || 'Exame'} em ${new Date(e.date).toLocaleDateString('pt-BR')}`).join('\n') || '- Nenhum agendado'}`);
        }
        if (inc.shopping) {
            const shopList = pendingShopping.slice(0, 6).map(s => s.item || s.name || 'Item').join(', ') || 'vazia';
            const wishList = data.wishlist.slice(0, 4).map(w => `${w.name || w.item || 'Item'}${w.price ? ' (R$ ' + Number(w.price).toFixed(2) + ')' : ''}`).join(', ') || 'vazia';
            sections.push(`COMPRAS E WISHLIST:\n- Lista de compras (${pendingShopping.length} itens): ${shopList}\n- Wishlist (${data.wishlist.length} itens): ${wishList}`);
        }
        if (inc.training) {
            sections.push(`TREINOS REGISTRADOS: ${data.training.length} registro(s)`);
        }

        const structureItems = ['1. Saudação com nome e data de hoje'];
        let idx = 2;
        if (inc.finance) structureItems.push(`${idx++}. Situação financeira com dica se saldo for negativo`);
        if (inc.tasks) structureItems.push(`${idx++}. Tarefas prioritárias que merecem atenção`);
        if (inc.exams) structureItems.push(`${idx++}. Exames próximos com data exata (se houver)`);
        if (inc.shopping) structureItems.push(`${idx++}. Lista de compras e wishlist resumidos`);
        if (inc.training) structureItems.push(`${idx++}. Situação dos treinos (se houver)`);
        structureItems.push(`${idx}. Mensagem de encerramento motivadora (1-2 frases)`);

        const systemPrompt = `Você é o assistente pessoal do SIGP (Sistema Inteligente de Gestão Pessoal).
                            Sua única tarefa é gerar um resumo em português (Brasil) baseado EXCLUSIVAMENTE nos dados reais fornecidos.
                            obrigatórias:
                            - NUNCA invente dados, valores ou informações ausentes nos dados fornecidos.
                            - Se um campo estiver vazio ou zerado, mencione brevemente e continue.
                            - Use APENAS texto simples. Proibido Markdown, links ou emojis em excesso.
                            - Limite estrito: máximo 450 palavras.
                            - Tom: pessoal, direto, positivo e motivador.
                            - Idioma: português do Brasil, sem erros gramaticais.`;

        const userPrompt = `Hoje é ${today}. Gere o resumo para: ${userName}.

                        === DADOS REAIS ===

                        ${sections.join('\n\n')}

                        === ESTRUTURA (siga nessa ordem) ===
                        ${structureItems.join('\n')}`;

        return { system: systemPrompt, user: userPrompt };
    }

    /**
     * Calls OpenAI Chat Completions and returns the assistant text.
     * @param {{ system: string, user: string }} prompt
     * @returns {Promise<string>}
     */
    async _callOpenAI(prompt) {
        const res = await fetch(this.openaiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: this.openaiModel,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                max_tokens: 700,
                temperature: 0.3
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI error ${res.status}: ${err}`);
        }

        const json = await res.json();
        return json.choices?.[0]?.message?.content?.trim() || 'Resumo não disponível.';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — Email Sending
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sends the digest email via EmailJS.
     * @param {string} email
     * @param {string} name
     * @param {string} aiSummary
     * @param {Object} data
     * @returns {Promise<void>}
     */
    async _sendEmail(email, name, aiSummary, data, prefs = {}) {
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS not loaded');
        }

        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const subject = `📊 Seu resumo SIGP — ${new Date().toLocaleDateString('pt-BR')}`;

        const inc = {
            finance: prefs.inclFinance !== false,
            tasks: prefs.inclTasks !== false,
            exams: prefs.inclExams !== false,
            shopping: prefs.inclShopping !== false,
        };
        const pendingTasks = inc.tasks ? data.tasks.filter(t => !t.completed && !t.done).length : '—';
        const upcomingExams = inc.exams ? data.exams.filter(e => e.date && new Date(e.date) >= new Date()).length : '—';
        const pendingShopping = inc.shopping ? data.shopping.filter(s => !s.purchased && !s.completed).length : '—';
        const totalIncome = inc.finance ? data.income.reduce((sum, r) => sum + (Number(r.value) || 0), 0) : 0;
        const totalExpenses = inc.finance
            ? data.fixedExpenses.reduce((sum, r) => sum + (Number(r.value) || 0), 0)
            + data.creditExpenses.reduce((sum, r) => sum + (Number(r.installmentValue) || 0), 0)
            : 0;

        const params = {
            to_email: email,
            to_name: name,
            subject: subject,
            date_today: today,
            ai_summary: aiSummary,
            tasks_pending: pendingTasks,
            exams_upcoming: upcomingExams,
            shopping_items: pendingShopping,
            income_total: 'R$ ' + totalIncome.toFixed(2),
            expenses_total: 'R$ ' + totalExpenses.toFixed(2),
            balance: 'R$ ' + (totalIncome - totalExpenses).toFixed(2)
        };

        Logger.info('[DigestService] Sending email via EmailJS:', {
            serviceId: this.emailjsServiceId,
            templateId: this.emailjsTemplateId,
            to: email
        });

        try {
            await emailjs.send(this.emailjsServiceId, this.emailjsTemplateId, params);
        } catch (ejsErr) {
            const reason = ejsErr?.text || ejsErr?.message || JSON.stringify(ejsErr);
            throw new Error(`EmailJS ${ejsErr?.status ?? 'error'}: ${reason}`);
        }
    }

    /**
     * Updates the lastSentAt field in the prefs document.
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async _updateLastSentAt(userId) {
        await this.savePrefs(userId, { lastSentAt: new Date().toISOString() });
    }

    /**
     * Shows a brief success toast after sending.
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
