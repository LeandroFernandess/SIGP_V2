/**
 * @file SupportPageHandler.js
 * @description Support and contact page management.
 * 
 * Contents:
 * - Contact information display
 * - FAQ accordion component
 * - Feedback form
 * - Module switching (contact, faq, feedback)
 * 
 * Dependencies:
 * - PageManager
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class SupportPageHandler
 * @description Manages the support and contact page
 */
class SupportPageHandler {

    /**
     * Initializes the support handler
     * 
     * @constructor
     * @param {PageManager} pageManager - PageManager instance
     * 
     * @example
     * const handler = new SupportPageHandler(pageManager);
     */
    constructor(pageManager) {
        this.pageManager = pageManager;
        this.currentModule = 'contact';
    }

    /**
     * Resets the handler state to initial values
     * Called when tab is refreshed
     * @public
     */
    resetState() {
        this.currentModule = 'contact';
    }

    /**
     * Initializes the support page
     * @public
     */
    initialize() {
        this.currentModule = 'contact';
    }

    /**
     * Cleans up resources when leaving the page
     * @public
     */
    cleanup() {
        this.currentModule = null;
    }

    /**
     * Renders the complete support page structure
     * @public
     * @returns {string} Support page HTML
     */
    render() {
        return `
            <div class="support-page-container">
                ${this._renderPageHeader()}
                ${this._renderIntro()}
                ${this._renderTabs()}
                ${this._renderTabsContainer()}
            </div>
        `;
    }

    /**
     * Renders the page header with hero section
     * @private
     * @returns {string} Header HTML
     */
    _renderPageHeader() {
        return `
            <div class="support-hero page-hero">
                <h1>🆘 Suporte e Ajuda</h1>
                <p>Central de ajuda, FAQ e informações do sistema</p>
            </div>
        `;
    }

    /**
     * Renders the intro section
     * @private
     * @returns {string} Intro HTML
     */
    _renderIntro() {
        return `
            <div class="support-intro">
                <p class="intro-text">
                    Encontre respostas para suas dúvidas, entre em contato conosco ou envie seu feedback 
                    para nos ajudar a melhorar o sistema.
                </p>
            </div>
        `;
    }

    /**
     * Renders the navigation tabs
     * @private
     * @returns {string} Tabs HTML
     */
    _renderTabs() {
        const tabs = [
            { id: 'contact', icon: '📧', label: 'Contato' },
            { id: 'faq', icon: '💡', label: 'FAQ' },
            { id: 'about', icon: 'ℹ️', label: 'Sobre' },
            { id: 'feedback', icon: '📩', label: 'Feedback' }
        ];

        return `
            <div id="supportTabsNav" class="settings-tabs">
                ${tabs.map((tab, index) => this._renderTabButton(tab, index === 0)).join('')}
            </div>
        `;
    }

    /**
     * Renders a tab button
     * @private
     * @param {Object} tab - Tab data
     * @param {boolean} isActive - If the tab is active
     * @returns {string} Button HTML
     */
    _renderTabButton(tab, isActive) {
        return `
            <button class="settings-tab ${isActive ? 'active' : ''}" 
                    data-tab="${tab.id}"
                    data-context="support"
                    onclick="supportHandler.switchModule('${tab.id}')">
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-label">${tab.label}</span>
            </button>
        `;
    }

    /**
     * Renders the container with all content tabs
     * @private
     * @returns {string} Container HTML
     */
    _renderTabsContainer() {
        return `
            <div id="supportContainerMain" class="settings-container">
                ${this._renderContactTab()}
                ${this._renderFaqTab()}
                ${this._renderAboutTab()}
                ${this._renderFeedbackTab()}
            </div>
        `;
    }

    /**
     * Renders the contact tab
     * @private
     * @returns {string} Contact tab HTML
     */
    _renderContactTab() {
        const contacts = [
            { icon: '✉️', label: 'Email', type: 'link', href: 'mailto:leandrofernandes1600@gmail.com', text: 'leandrofernandes1600@gmail.com' },
            { icon: '💼', label: 'LinkedIn', type: 'link', href: 'https://www.linkedin.com/in/leandro-fernandes-951ab3189/', text: 'Leandro Fernandes' },
            { icon: '🐙', label: 'GitHub', type: 'link', href: 'https://github.com/LeandroFernandess', text: 'github.com/LeandroFernandess' }
        ];

        return `
            <div class="settings-tab-content active" data-content="contact" data-context="support">
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-card-icon">📧</div>
                        <div>
                            <h3 class="settings-card-title">Entre em Contato</h3>
                            <p class="settings-card-description">Precisa de ajuda? Entre em contato!</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="contact-info">
                            ${contacts.map(contact => this._renderContactItem(contact)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders a contact item
     * @private
     * @param {Object} contact - Contact data
     * @returns {string} Item HTML
     */
    _renderContactItem(contact) {
        return `
            <div class="contact-item">
                <span class="contact-icon">${contact.icon}</span>
                <div class="contact-details">
                    <strong>${contact.label}:</strong>
                    <a href="${contact.href}" ${contact.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${contact.text}</a>
                </div>
            </div>
        `;
    }

    /**
     * Renders the FAQ tab
     * @private
     * @returns {string} FAQ tab HTML
     */
    _renderFaqTab() {
        const faqs = [
            {
                question: 'Como cadastrar minha renda mensal?',
                answer: 'Acesse o menu <strong>Financeiro > Renda Mensal</strong> e preencha o formulário com o valor da sua renda. Este valor será usado como base para todos os cálculos e relatórios do sistema.'
            },
            {
                question: 'Como adicionar gastos?',
                answer: 'Vá em <strong>Financeiro > Gastos</strong> e escolha entre Gastos Fixos (recorrentes) ou Gastos de Crédito (parcelados). Preencha os dados e salve. Você pode editar ou excluir gastos a qualquer momento.'
            },
            {
                question: 'Os meus dados estão seguros?',
                answer: 'Sim! Todos os dados são armazenados no banco de dados Firebasem, da Google. Nenhum dado é passível de vazamento ou compartilhamento e cada usuário tem acesso a suas próprias informações, sem possibilidade de consultar ou visualizar dados de terceiros.'
            },
            {
                question: 'Como alterar o tema para modo claro?',
                answer: 'Acesse <strong>Configurações > Aparência</strong> e selecione o tema desejado. O sistema possui dois temas: Escuro (padrão) e Claro. A alteração é aplicada imediatamente.'
            },
            {
                question: 'Como funciona o sistema de abas?',
                answer: 'O SIGP possui um sistema de múltiplas abas similar a navegadores modernos. Você pode abrir várias páginas simultaneamente, alternar entre elas e fechá-las quando não precisar mais. Use o botão "+ Nova aba".'
            },
            {
                question: 'Posso usar o SIGP no celular?',
                answer: 'Sim! O SIGP é totalmente responsivo e se adapta a diferentes tamanhos de tela. Você pode acessá-lo de smartphones, tablets e computadores sem perder funcionalidades.'
            }
        ];

        return `
            <div class="settings-tab-content" data-content="faq" data-context="support">
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-card-icon">💡</div>
                        <div>
                            <h3 class="settings-card-title">Perguntas</h3>
                            <p class="settings-card-description">Encontre respostas para as dúvidas mais comuns</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="faq-list">
                            ${faqs.map(faq => this._renderFaqItem(faq)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders a FAQ item
     * @private
     * @param {Object} faq - Question/answer data
     * @returns {string} Item HTML
     */
    _renderFaqItem(faq) {
        return `
            <div class="faq-item">
                <div class="faq-question" onclick="supportHandler.toggleFaq(this)">
                    <span class="faq-icon">▶</span>
                    <strong>${faq.question}</strong>
                </div>
                <div class="faq-answer">
                    <p>${faq.answer}</p>
                </div>
            </div>
        `;
    }

    /**
     * Renders the About tab
     * @private
     * @returns {string} About tab HTML
     */
    _renderAboutTab() {
        const features = [
            { icon: '💰', title: 'Gestão Financeira', description: 'Controle completo de receitas e gastos' },
            { icon: '📊', title: 'Relatórios Detalhados', description: 'Visualize com gráficos e análises' },
            { icon: '📝', title: 'Anotações Pessoais', description: 'Organize tarefas e informações' },
            { icon: '💪', title: 'Treinos e Saúde', description: 'Registre treinos e exames' }
        ];

        return `
            <div class="settings-tab-content" data-content="about" data-context="support">
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-card-icon">ℹ️</div>
                        <div>
                            <h3 class="settings-card-title">Sobre o SIGP</h3>
                            <p class="settings-card-description">Conheça mais sobre o sistema</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="about-content">
                            <p><strong>SIGP - Sistema Inteligente de Gestão Pessoal</strong></p>
                            <p style="margin-bottom: 1.5rem;">Uma solução completa para gerenciamento financeiro e pessoal, desenvolvida para ajudá-lo a organizar sua vida de forma simples e eficiente.</p>
                            
                            <div class="features-grid-compact">
                                ${features.map(feature => this._renderFeatureItem(feature)).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders a feature item
     * @private
     * @param {Object} feature - Feature data
     * @returns {string} Item HTML
     */
    _renderFeatureItem(feature) {
        return `
            <div class="feature-item-compact">
                <span class="feature-icon">${feature.icon}</span>
                <div>
                    <strong>${feature.title}</strong>
                    <p>${feature.description}</p>
                </div>
            </div>
        `;
    }

    /**
     * Renders the Feedback tab
     * @private
     * @returns {string} Feedback tab HTML
     */
    _renderFeedbackTab() {
        return `
            <div class="settings-tab-content" data-content="feedback" data-context="support">
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-card-icon">💬</div>
                        <div>
                            <h3 class="settings-card-title">Envie seu Feedback</h3>
                            <p class="settings-card-description">Sua opinião é importante!</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <p style="margin-bottom: 1.5rem;">Tem sugestões, encontrou algum bug ou quer compartilhar sua experiência? Clique no botão abaixo para enviar seu feedback.</p>
                        <button class="btn-primary" onclick="supportHandler.openFeedbackForm()">
                            📨 Enviar Feedback
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Switches between support page modules
     * @public
     * @param {string} moduleName - Module name to switch to
     */
    switchModule(moduleName) {
        this._removeActiveClasses();
        this._activateTab(moduleName);
        this.currentModule = moduleName;
    }

    /**
     * Removes active classes from all tabs and contents
     * @private
     */
    _removeActiveClasses() {
        const supportTabsNav = document.getElementById('supportTabsNav');
        if (supportTabsNav) {
            supportTabsNav.querySelectorAll('.settings-tab[data-context="support"]').forEach(tab => {
                tab.classList.remove('active');
            });
        }

        const supportContainer = document.getElementById('supportContainerMain');
        if (supportContainer) {
            supportContainer.querySelectorAll('.settings-tab-content[data-context="support"]').forEach(content => {
                content.classList.remove('active');
            });
        }
    }

    /**
     * Activates a specific tab
     * @private
     * @param {string} tabName - Tab name
     */
    _activateTab(tabName) {
        const supportTabsNav = document.getElementById('supportTabsNav');
        if (supportTabsNav) {
            const activeTab = supportTabsNav.querySelector(`[data-tab="${tabName}"][data-context="support"]`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        }

        const supportContainer = document.getElementById('supportContainerMain');
        if (supportContainer) {
            const activeContent = supportContainer.querySelector(`[data-content="${tabName}"][data-context="support"]`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        }
    }

    /**
     * Toggles FAQ answer display
     * @public
     * @param {HTMLElement} element - Clicked question element
     */
    toggleFaq(element) {
        const faqItem = element.parentElement;
        const isActive = faqItem.classList.contains('active');

        this._closeAllFaqs();

        if (!isActive) {
            this._openFaq(faqItem);
        }
    }

    /**
     * Closes all FAQs
     * @private
     */
    _closeAllFaqs() {
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            const icon = item.querySelector('.faq-icon');
            const answer = item.querySelector('.faq-answer');
            if (icon) icon.textContent = '▶';
            if (answer) answer.style.maxHeight = '0';
        });
    }

    /**
     * Opens a specific FAQ
     * @private
     * @param {HTMLElement} faqItem - FAQ element
     */
    _openFaq(faqItem) {
        faqItem.classList.add('active');
        const icon = faqItem.querySelector('.faq-icon');
        const answer = faqItem.querySelector('.faq-answer');

        if (icon) icon.textContent = '▼';
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    /**
     * Opens feedback form
     * @public
     */
    openFeedbackForm() {
        const userEmail = this._getCurrentUserEmail();

        Swal.fire({
            title: this._renderFeedbackTitle(),
            html: this._renderFeedbackFormHtml(userEmail),
            showCancelButton: true,
            confirmButtonText: 'Enviar Feedback',
            cancelButtonText: 'Cancelar',
            width: '480px',
            customClass: this._getFeedbackModalClasses(),
            buttonsStyling: false,
            showCloseButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            focusConfirm: false,
            preConfirm: () => this._validateFeedbackForm(),
            didOpen: () => this._initFeedbackFormEvents(),
            willClose: () => {
                const container = document.querySelector('.swal2-container');
                if (container) {
                    container.style.opacity = '0';
                    container.style.pointerEvents = 'none';
                }
            },
            didClose: () => {
                document.querySelectorAll('.swal2-container').forEach(el => el.remove());
                document.body.classList.remove('swal2-shown', 'swal2-height-auto');
                document.body.style.overflow = '';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this._processFeedback(result.value);
            }
        });
    }

    /**
     * Gets current user email
     * @private
     * @returns {string} User email
     */
    _getCurrentUserEmail() {
        const currentUser = typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser
            ? FormUtils.getCurrentUser()
            : null;
        return currentUser?.email || '';
    }

    /**
     * Renders feedback form title
     * @private
     * @returns {string} Title HTML
     */
    _renderFeedbackTitle() {
        return `
            <div class="feedback-header">
                <div class="feedback-header-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <line x1="9" y1="10" x2="15" y2="10"></line>
                        <line x1="12" y1="7" x2="12" y2="13"></line>
                    </svg>
                </div>
                <div class="feedback-header-text">
                    <h2 class="feedback-title">Central de Feedback</h2>
                    <p class="feedback-subtitle">Sua opinião é muito importante!</p>
                </div>
            </div>
        `;
    }

    /**
     * Renders feedback form HTML
     * @private
     * @param {string} userEmail - User email
     * @returns {string} Form HTML
     */
    _renderFeedbackFormHtml(userEmail) {
        return `
            <div class="feedback-form">
                <!-- Tipo de Feedback -->
                <div class="feedback-field">
                    <label class="feedback-label">Tipo de Feedback</label>
                    ${this._renderFeedbackTypeField()}
                </div>
                
                <!-- Email -->
                <div class="feedback-field">
                    <label class="feedback-label">
                        Email para resposta
                        <span class="feedback-optional">opcional</span>
                    </label>
                    ${this._renderFeedbackEmailField(userEmail)}
                </div>
                
                <!-- Mensagem -->
                <div class="feedback-field">
                    <label class="feedback-label">Sua Mensagem</label>
                    ${this._renderFeedbackMessageField()}
                </div>
            </div>
        `;
    }

    /**
     * Renders feedback type field
     * @private
     * @returns {string} Field HTML
     */
    _renderFeedbackTypeField() {
        const options = [
            { value: 'sugestao', icon: '💡', label: 'Sugestão', className: 'type-suggestion' },
            { value: 'bug', icon: '🐛', label: 'Bug/Erro', className: 'type-bug' },
            { value: 'elogio', icon: '⭐', label: 'Elogio', className: 'type-praise' },
            { value: 'duvida', icon: '❓', label: 'Dúvida', className: 'type-question' },
            { value: 'outro', icon: '📝', label: 'Outro', className: 'type-other' }
        ];

        return `
            <div class="feedback-chips" id="feedbackTypeSelector">
                ${options.map((opt, index) => `
                    <button type="button" 
                            class="feedback-chip ${opt.className} ${index === 0 ? 'active' : ''}" 
                            data-value="${opt.value}"
                            onclick="supportHandler.selectFeedbackType('${opt.value}')">
                        <span class="chip-icon">${opt.icon}</span>
                        <span class="chip-label">${opt.label}</span>
                    </button>
                `).join('')}
            </div>
            <input type="hidden" id="feedbackType" value="sugestao">
        `;
    }

    /**
     * Selects feedback type
     * @public
     * @param {string} type - Selected type
     */
    selectFeedbackType(type) {
        const buttons = document.querySelectorAll('.feedback-chip');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === type) {
                btn.classList.add('active');
            }
        });
        document.getElementById('feedbackType').value = type;
    }

    /**
     * Renders message field
     * @private
     * @returns {string} Field HTML
     */
    _renderFeedbackMessageField() {
        return `
            <div class="feedback-textarea-container">
                <textarea 
                    id="feedbackMessage" 
                    class="feedback-textarea" 
                    placeholder="Descreva sua sugestão, problema ou comentário de forma detalhada..."
                    maxlength="1000"
                    rows="4"></textarea>
                <span class="feedback-counter" id="feedbackCharCounter">0 / 1000</span>
            </div>
        `;
    }

    /**
     * Renders email field
     * @private
     * @param {string} userEmail - Default email
     * @returns {string} Field HTML
     */
    _renderFeedbackEmailField(userEmail) {
        return `
            <input 
                type="email" 
                id="feedbackEmail" 
                class="feedback-input" 
                placeholder="seu@email.com" 
                value="${userEmail}">
        `;
    }

    /**
     * Initializes feedback form events
     * @private
     */
    _initFeedbackFormEvents() {
        const textarea = document.getElementById('feedbackMessage');
        const charCounter = document.getElementById('feedbackCharCounter');

        if (textarea && charCounter) {
            textarea.addEventListener('input', () => {
                const length = textarea.value.length;
                charCounter.textContent = `${length} / 1000`;

                charCounter.classList.remove('warning', 'danger');
                if (length > 900) {
                    charCounter.classList.add('danger');
                } else if (length > 700) {
                    charCounter.classList.add('warning');
                }
            });

            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
            });
        }
    }

    /**
     * Validates feedback form data
     * @private
     * @returns {Object|boolean} Validated data or false if invalid
     */
    _validateFeedbackForm() {
        const type = document.getElementById('feedbackType').value;
        const messageEl = document.getElementById('feedbackMessage');
        const message = messageEl.value;
        const email = document.getElementById('feedbackEmail').value;

        messageEl.classList.remove('feedback-input-error');

        if (!message || message.trim().length < 10) {
            messageEl.classList.add('feedback-input-error');
            messageEl.focus();

            Swal.showValidationMessage('Por favor, escreva uma mensagem com pelo menos 10 caracteres');

            const removeError = () => {
                messageEl.classList.remove('feedback-input-error');
                messageEl.removeEventListener('input', removeError);
            };
            messageEl.addEventListener('input', removeError);

            return false;
        }

        if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            const emailEl = document.getElementById('feedbackEmail');
            emailEl.classList.add('feedback-input-error');
            emailEl.focus();

            Swal.showValidationMessage('Por favor, insira um email válido');

            const removeError = () => {
                emailEl.classList.remove('feedback-input-error');
                emailEl.removeEventListener('input', removeError);
            };
            emailEl.addEventListener('input', removeError);

            return false;
        }

        return { type, message, email };
    }

    /**
     * Processes and sends feedback
     * @private
     * @param {Object} feedbackData - Feedback data
     */
    _processFeedback(feedbackData) {
        this._showLoadingModal();
        this._saveFeedbackLocally(feedbackData);
        this._sendFeedbackEmail(feedbackData);
    }

    /**
     * Shows loading modal
     * @private
     */
    _showLoadingModal() {
        Swal.fire({
            title: 'Enviando feedback...',
            html: '<p style="margin: 0;">Por favor, aguarde um momento.</p>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    /**
     * Saves feedback to localStorage
     * @private
     * @param {Object} feedbackData - Feedback data
     */
    _saveFeedbackLocally(feedbackData) {
        const feedbacks = JSON.parse(localStorage.getItem('sigp_feedbacks') || '[]');
        const currentUser = typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser
            ? FormUtils.getCurrentUser()
            : null;

        const feedback = {
            ...feedbackData,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name || currentUser.username || 'Usuário',
            userEmail: currentUser.email || 'não informado'
        };

        feedbacks.push(feedback);
        localStorage.setItem('sigp_feedbacks', JSON.stringify(feedbacks));
    }

    /**
     * Sends feedback by email via EmailJS
     * @private
     * @param {Object} feedbackData - Feedback data
     */
    _sendFeedbackEmail(feedbackData) {
        const currentUser = typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser
            ? FormUtils.getCurrentUser()
            : null;
        const tipoFeedbackMap = {
            'sugestao': '💡 Sugestão de Melhoria',
            'bug': '🐛 Reportar Bug/Erro',
            'elogio': '⭐ Elogio',
            'duvida': '❓ Dúvida',
            'outro': '📝 Outro'
        };

        emailjs.send('service_oyf1zei', 'template_4hizx1e', {
            from_name: currentUser.name || currentUser.username || 'Usuário',
            from_email: feedbackData.email || currentUser.email || 'não informado',
            user_id: currentUser.username || currentUser.id,
            feedback_type: tipoFeedbackMap[feedbackData.type] || feedbackData.type,
            message: feedbackData.message,
            timestamp: new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }).then(
            () => this._showFeedbackSuccess(),
            (error) => {
                console.error('EmailJS Error:', error);
                this._showFeedbackError();
            }
        );
    }

    /**
     * Shows success when sending feedback
     * @private
     */
    _showFeedbackSuccess() {
        Swal.fire({
            icon: 'success',
            title: 'Feedback Enviado!',
            text: 'Obrigado pelo seu feedback. Recebi seu email e entrarei em contato em breve!',
            timer: 3500,
            timerProgressBar: true,
            showConfirmButton: false
        });
    }

    /**
     * Shows error when sending feedback
     * @private
     */
    _showFeedbackError() {
        Swal.fire({
            icon: 'warning',
            title: 'Feedback Salvo',
            text: 'Seu feedback foi salvo localmente, mas não foi possível enviar o email. Tente novamente mais tarde.',
            timer: 3500,
            timerProgressBar: true,
            showConfirmButton: false
        });
    }

    /**
     * Gets feedback modal CSS classes
     * @private
     * @returns {Object} Custom classes
     */
    _getFeedbackModalClasses() {
        return {
            popup: 'feedback-modal',
            title: 'feedback-modal-title',
            htmlContainer: 'feedback-html-container',
            actions: 'feedback-actions',
            confirmButton: 'feedback-confirm-btn',
            cancelButton: 'feedback-cancel-btn'
        };
    }
}