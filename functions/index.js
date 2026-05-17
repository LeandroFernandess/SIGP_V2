/**
 * @file functions/index.js
 * @description SIGP Cloud Functions — backend AI digest delivery.
 *
 * Exports:
 *  - sendDigestOnLogin: HTTPS callable invoked by the dashboard right after a
 *    user logs in. Sends the AI digest if the user opted in (prefs.enabled).
 *  - sendDigestNow:     HTTPS callable used by the "Enviar agora" button.
 *
 * Backend ownership of delivery keeps OpenAI/EmailJS credentials off the
 * client. The digest is sent on each successful login when enabled — there
 * is no scheduler component anymore.
 *
 * Contents:
 *  - Callable exports (sendDigestOnLogin, sendDigestNow)
 *  - Build & send pipeline (buildAndSend)
 *  - Firestore helpers (loadPrefs, updateLastSentAt, collectAllData, fetchCollection)
 *  - Prompt builder (buildPrompt, parseLocalDate, classifyReminders)
 *  - OpenAI integration (callOpenAI)
 *  - EmailJS integration (sendEmail)
 *  - Timezone helpers (getLocalParts)
 *
 * Dependencies:
 *  - firebase-functions/v2/https (onCall, HttpsError)
 *  - firebase-functions/params (defineSecret)
 *  - firebase-functions (logger, config)
 *  - firebase-admin (Firestore)
 *  - Node.js built-in fetch (Node 18+)
 *
 * Required runtime config / secrets:
 *   firebase functions:secrets:set OPENAI_API_KEY
 *   firebase functions:secrets:set EMAILJS_PRIVATE_KEY
 *   firebase functions:config:set emailjs.service_id="service_oyf1zei" \
 *                                 emailjs.template_id="template_lqll858" \
 *                                 emailjs.public_key="5JgttFH7TW0i34yAr"
 *
 * Note: EmailJS REST endpoint requires an "accessToken" (private key) when
 * called from a server. Create it in the EmailJS dashboard → Account → API
 * Keys → Private Key, and store it as the EMAILJS_PRIVATE_KEY secret.
 *
 * @author Leandro Fialho Fernandes
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const EMAILJS_PRIVATE_KEY = defineSecret('EMAILJS_PRIVATE_KEY');

const APP_ID = 'sigp-app';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o';
const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// ─────────────────────────────────────────────────────────────────────────────
// Callable function: send on user login (only if prefs.enabled)
// ─────────────────────────────────────────────────────────────────────────────

exports.sendDigestOnLogin = onCall(
    {
        secrets: [OPENAI_API_KEY, EMAILJS_PRIVATE_KEY],
        timeoutSeconds: 120,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Login required');
        }
        const userId = request.auth.uid;
        const prefs = (await loadPrefs(userId)) || {};
        if (!prefs.enabled) {
            return { ok: true, skipped: true };
        }

        const userEmail = request.auth.token.email;
        const userName = request.auth.token.name || userEmail;
        await buildAndSend(userId, userEmail, userName, prefs);
        return { ok: true };
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// Callable function: send right now on user demand ("Enviar agora")
// ─────────────────────────────────────────────────────────────────────────────

exports.sendDigestNow = onCall(
    {
        secrets: [OPENAI_API_KEY, EMAILJS_PRIVATE_KEY],
        timeoutSeconds: 120,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Login required');
        }
        const userId = request.auth.uid;
        const userEmail = request.auth.token.email;
        const userName = request.auth.token.name || userEmail;

        const prefs = (await loadPrefs(userId)) || {};
        await buildAndSend(userId, userEmail, userName, prefs, { force: true });
        return { ok: true };
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// Build & send pipeline (shared by both callables)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Orchestrates the full digest pipeline for a single user:
 * collect Firestore data → build OpenAI prompt → call OpenAI →
 * send email via EmailJS → update `lastSentAt` timestamp.
 * @param {string}  userId - Firebase Auth uid
 * @param {string}  email  - Recipient email address
 * @param {string}  name   - Display name used in the greeting
 * @param {Object}  prefs  - User notification preferences document
 * @param {Object}  [opts] - Optional flags; `opts.force=true` skips prefs.enabled check
 * @returns {Promise<void>}
 */async function buildAndSend(userId, email, name, prefs, opts = {}) {
    const data = await collectAllData(userId);
    const prompt = buildPrompt(name || 'Usuário', data, prefs);
    const summary = await callOpenAI(prompt);
    await sendEmail(email, name || 'Usuário', summary, data, prefs);
    await updateLastSentAt(userId);
    functions.logger.info(`[digest] sent to ${email} (force=${!!opts.force})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Loads the user’s notification preferences document from Firestore.
 * @param {string} userId - Firebase Auth uid
 * @returns {Promise<Object|null>} Prefs document data, or null if absent
 */async function loadPrefs(userId) {
    const snap = await db
        .doc(`artifacts/${APP_ID}/users/${userId}/notifications/preferences`)
        .get();
    return snap.exists ? snap.data() : null;
}

/**
 * Writes an ISO timestamp to `lastSentAt` in the user’s preferences document
 * using merge so no other fields are overwritten.
 * @param {string} userId - Firebase Auth uid
 * @returns {Promise<void>}
 */
async function updateLastSentAt(userId) {
    await db
        .doc(`artifacts/${APP_ID}/users/${userId}/notifications/preferences`)
        .set({ lastSentAt: new Date().toISOString() }, { merge: true });
}

/**
 * Fetches all 10 personal-data Firestore collections in parallel and
 * returns a keyed object consumed by `buildPrompt` and `sendEmail`.
 * @param {string} userId - Firebase Auth uid
 * @returns {Promise<Object>} Map of collection name → array of documents
 */
async function collectAllData(userId) {
    const base = `artifacts/${APP_ID}/users/${userId}`;
    const cols = ['tasks', 'income', 'fixedExpenses', 'creditExpenses', 'exams', 'shopping', 'wishlist', 'training', 'notes', 'reminders'];
    const results = await Promise.all(cols.map(c => fetchCollection(`${base}/${c}`)));
    return Object.fromEntries(cols.map((c, i) => [c, results[i]]));
}

/**
 * Retrieves all documents from a Firestore collection path.
 * Returns an empty array on any error so a missing collection never
 * blocks the digest.
 * @param {string} path - Absolute Firestore collection path
 * @returns {Promise<Array<Object>>}
 */
async function fetchCollection(path) {
    try {
        const snap = await db.collection(path).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt + OpenAI (mirrors client DigestService logic, with safe date parsing)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Parses a date value without timezone ambiguity.
 * YYYY-MM-DD strings are treated as local midnight to avoid the UTC-offset
 * day-shift that `new Date('YYYY-MM-DD')` produces natively.
 * @param {string|Date} value
 * @returns {Date}
 */function parseLocalDate(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
    }
    return new Date(value);
}

/**
 * Builds the `system` + `user` prompt objects sent to the OpenAI API.
 * Respects the include-flags in `prefs` so sections the user opted out of
 * are omitted from the prompt entirely, keeping token usage minimal.
 * @param {string} userName  - Display name used in the greeting line
 * @param {Object} data      - Keyed collections returned by `collectAllData`
 * @param {Object} [prefs]   - User preferences (inclFinance, inclTasks, etc.)
 * @returns {{ system: string, user: string }}
 */
function buildPrompt(userName, data, prefs = {}) {
    const inc = {
        finance: prefs.inclFinance !== false,
        tasks: prefs.inclTasks !== false,
        exams: prefs.inclExams !== false,
        shopping: prefs.inclShopping !== false,
        training: prefs.inclTraining !== false,
        notes: prefs.inclNotes !== false,
        reminders: prefs.inclReminders !== false,
    };

    const tz = prefs.timezone || DEFAULT_TIMEZONE;
    const now = new Date();
    const today = now.toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
    });
    const todayKey = getLocalParts(now, tz).dayKey;
    const todayStartLocal = new Date(`${todayKey}T00:00:00`);

    const pendingTasks = inc.tasks ? data.tasks.filter(t => !t.completed && !t.done) : [];
    const upcomingExams = inc.exams
        ? data.exams
            .filter(e => e.date && parseLocalDate(e.date) >= todayStartLocal)
            .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
            .slice(0, 5)
        : [];
    const pendingShopping = inc.shopping ? data.shopping.filter(s => !s.purchased && !s.completed) : [];
    const totalIncome = inc.finance ? data.income.reduce((s, r) => s + (Number(r.value) || 0), 0) : 0;
    const totalFixed = inc.finance ? data.fixedExpenses.reduce((s, r) => s + (Number(r.value) || 0), 0) : 0;
    const totalCredit = inc.finance ? data.creditExpenses.reduce((s, r) => s + (Number(r.installmentValue) || 0), 0) : 0;
    const remindersList = inc.reminders ? classifyReminders(data.reminders || [], todayStartLocal) : [];

    const sections = [];
    if (inc.finance) {
        sections.push(`FINANÇAS:\n- Renda total: R$ ${totalIncome.toFixed(2)}\n- Gastos fixos: R$ ${totalFixed.toFixed(2)}\n- Gastos no cartão: R$ ${totalCredit.toFixed(2)}\n- Saldo estimado: R$ ${(totalIncome - totalFixed - totalCredit).toFixed(2)}`);
    }
    if (inc.tasks) {
        sections.push(`TAREFAS PENDENTES (${pendingTasks.length}):\n${pendingTasks.slice(0, 8).map(t => `- [${t.priority || 'média'}] ${t.title || t.name || 'Tarefa'}`).join('\n') || '- Nenhuma'}`);
    }
    if (inc.exams) {
        sections.push(`EXAMES MÉDICOS PRÓXIMOS (${upcomingExams.length}):\n${upcomingExams.map(e => `- ${e.name || e.examName || 'Exame'} em ${parseLocalDate(e.date).toLocaleDateString('pt-BR')}`).join('\n') || '- Nenhum agendado'}`);
    }
    if (inc.shopping) {
        const shopList = pendingShopping.slice(0, 6).map(s => s.item || s.name || 'Item').join(', ') || 'vazia';
        const wishList = data.wishlist.slice(0, 4).map(w => `${w.name || w.item || 'Item'}${w.price ? ' (R$ ' + Number(w.price).toFixed(2) + ')' : ''}`).join(', ') || 'vazia';
        sections.push(`COMPRAS E WISHLIST:\n- Lista de compras (${pendingShopping.length} itens): ${shopList}\n- Wishlist (${data.wishlist.length} itens): ${wishList}`);
    }
    if (inc.training) {
        sections.push(`TREINOS REGISTRADOS: ${data.training.length} registro(s)`);
    }
    if (inc.notes) {
        const notesList = (data.notes || []).slice(0, 6).map(n => {
            const title = n.title || 'Sem título';
            const snippet = (n.content || '').replace(/\s+/g, ' ').trim().slice(0, 80);
            return `- ${title}${snippet ? ': ' + snippet : ''}`;
        }).join('\n') || '- Nenhuma';
        sections.push(`ANOTAÇÕES (${(data.notes || []).length}):\n${notesList}`);
    }
    if (inc.reminders) {
        const top = remindersList.slice(0, 8);
        const lines = top.map(r => `- [${r.statusLabel}] ${r.title} — próximo: ${r.nextDueLabel}`).join('\n') || '- Nenhum';
        sections.push(`LEMBRETES (${remindersList.length}):\n${lines}`);
    }

    const system = `Você é o assistente pessoal do SIGP. Gere um resumo em português (Brasil) usando EXCLUSIVAMENTE os dados reais fornecidos. Nunca invente valores. Máximo 450 palavras. Use texto simples (sem Markdown). Tom direto e motivador.`;
    const user = `Hoje é ${today}. Gere o resumo para: ${userName}.\n\n=== DADOS REAIS ===\n\n${sections.join('\n\n')}`;
    return { system, user };
}

/**
 * Sorts reminders by next due date and labels them with a status hint.
 * @param {Array} reminders
 * @param {Date}  todayStartLocal
 * @returns {Array<{title:string, statusLabel:string, nextDueLabel:string, dueDate:Date}>}
 */
function classifyReminders(reminders, todayStartLocal) {
    const oneDayMs = 86400000;
    return reminders
        .map(r => {
            const due = r.adjustedNextDueDate || r.nextDueDate;
            if (!due) return null;
            const dueDate = parseLocalDate(due);
            const diffDays = Math.round((dueDate - todayStartLocal) / oneDayMs);
            let statusLabel;
            if (diffDays < 0) statusLabel = `Atrasado ${Math.abs(diffDays)}d`;
            else if (diffDays === 0) statusLabel = 'Hoje';
            else statusLabel = `Em ${diffDays}d`;
            return {
                title: r.title || r.name || 'Lembrete',
                statusLabel,
                nextDueLabel: dueDate.toLocaleDateString('pt-BR'),
                dueDate,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.dueDate - b.dueDate);
}

/**
 * Sends the prompt to the OpenAI Chat Completions endpoint and returns
 * the generated digest text. Throws on any HTTP error.
 * @param {{ system: string, user: string }} prompt
 * @returns {Promise<string>} AI-generated digest text (plain text, no Markdown)
 */
async function callOpenAI(prompt) {
    const res = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user },
            ],
            max_tokens: 700,
            temperature: 0.3,
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI ${res.status}: ${errText}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || 'Resumo não disponível.';
}

/**
 * Sends the digest email via the EmailJS REST API.
 * Reads `emailjs.service_id`, `emailjs.template_id`, and `emailjs.public_key`
 * from Firebase Functions runtime config, and the private key from the
 * `EMAILJS_PRIVATE_KEY` secret. Throws on missing config or HTTP errors.
 * @param {string}  email     - Recipient email address
 * @param {string}  name      - Recipient display name
 * @param {string}  aiSummary - AI-generated digest text
 * @param {Object}  data      - Keyed collections returned by `collectAllData`
 * @param {Object}  [prefs]   - User preferences used to compute the stats block
 * @returns {Promise<void>}
 */
async function sendEmail(email, name, aiSummary, data, prefs = {}) {
    const tz = prefs.timezone || DEFAULT_TIMEZONE;
    const now = new Date();
    const today = now.toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz,
    });
    const subject = `📊 Seu resumo SIGP — ${now.toLocaleDateString('pt-BR', { timeZone: tz })}`;

    const inc = {
        finance: prefs.inclFinance !== false,
        tasks: prefs.inclTasks !== false,
        exams: prefs.inclExams !== false,
        shopping: prefs.inclShopping !== false,
    };
    const todayKey = getLocalParts(now, tz).dayKey;
    const todayStartLocal = new Date(`${todayKey}T00:00:00`);

    const pendingTasks = inc.tasks ? data.tasks.filter(t => !t.completed && !t.done).length : '—';
    const upcomingExams = inc.exams
        ? data.exams.filter(e => e.date && parseLocalDate(e.date) >= todayStartLocal).length
        : '—';
    const pendingShopping = inc.shopping ? data.shopping.filter(s => !s.purchased && !s.completed).length : '—';
    const totalIncome = inc.finance ? data.income.reduce((s, r) => s + (Number(r.value) || 0), 0) : 0;
    const totalExpenses = inc.finance
        ? data.fixedExpenses.reduce((s, r) => s + (Number(r.value) || 0), 0)
        + data.creditExpenses.reduce((s, r) => s + (Number(r.installmentValue) || 0), 0)
        : 0;

    const cfg = functions.config().emailjs || {};
    const serviceId = cfg.service_id;
    const templateId = cfg.template_id;
    const publicKey = cfg.public_key;

    if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS config missing — set emailjs.service_id/template_id/public_key.');
    }

    const params = {
        to_email: email,
        to_name: name,
        subject,
        date_today: today,
        ai_summary: aiSummary,
        tasks_pending: pendingTasks,
        exams_upcoming: upcomingExams,
        shopping_items: pendingShopping,
        income_total: 'R$ ' + totalIncome.toFixed(2),
        expenses_total: 'R$ ' + totalExpenses.toFixed(2),
        balance: 'R$ ' + (totalIncome - totalExpenses).toFixed(2),
    };

    const res = await fetch(EMAILJS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            accessToken: EMAILJS_PRIVATE_KEY.value(),
            template_params: params,
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`EmailJS ${res.status}: ${errText}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timezone helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns { dayKey: 'YYYY-MM-DD', hour: 0..23, weekday: 0..6 (Sun=0) } for the
 * given Date as observed in the requested IANA timezone.
 */
function getLocalParts(date, timeZone) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', hour12: false, weekday: 'short',
    });

    const parts = fmt.formatToParts(date).reduce((acc, p) => {
        acc[p.type] = p.value;
        return acc;
    }, {});

    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    return {
        dayKey: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour),
        weekday: weekdayMap[parts.weekday] ?? new Date(date).getDay(),
    };
}
