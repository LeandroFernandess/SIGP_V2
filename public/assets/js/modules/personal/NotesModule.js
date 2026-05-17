/**
 * @file NotesModule.js
 * @description Personal notes management with optional address that opens
 * directly in Google Maps when clicked.
 *
 * Contents:
 * - Notes CRUD (title, content, optional address)
 * - Address-to-Google-Maps deep link
 * - Safe HTML rendering via DataGuard.escapeHtml
 *
 * Extends: BasePersonalModule
 *
 * @author Leandro Fialho Fernandes
 */

class NotesModule extends BasePersonalModule {

    constructor(personalDataService) {
        super(personalDataService, 'notes');
    }

    /**
     * Main module HTML structure
     */
    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnNotes" onclick="personalHandler.modules.notes.showForm()">
                        + Nova Anotação
                    </button>
                </div>

                ${this.renderForm()}

                <div id="notesList" class="notes-grid"></div>
            </div>
        `;
    }

    /**
     * Note form HTML
     */
    renderForm() {
        return `
            <div id="notesForm" class="personal-form">
                <h4 id="notesFormTitle">Nova Anotação</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Título *</label>
                        <input type="text" id="noteTitle" placeholder="Ex: Reunião com cliente" maxlength="120">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Conteúdo *</label>
                        <textarea id="noteContent" rows="6" placeholder="Escreva sua anotação aqui..."></textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Endereço (opcional)</label>
                        <input type="text" id="noteAddress"
                               placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP">
                        <small class="form-hint">Se preenchido, aparece um link que abre direto no Google Maps.</small>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.notes.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.notes.save()">Salvar Anotação</button>
                </div>
            </div>
        `;
    }

    /**
     * Gets data from the form
     */
    getFormData() {
        return {
            title: (document.getElementById('noteTitle')?.value || '').trim(),
            content: (document.getElementById('noteContent')?.value || '').trim(),
            address: (document.getElementById('noteAddress')?.value || '').trim()
        };
    }

    /**
     * Validates required fields
     */
    validateForm(data) {
        if (!data.title) {
            this.showValidation('Informe o título da anotação');
            return false;
        }
        if (!data.content) {
            this.showValidation('Escreva o conteúdo da anotação');
            return false;
        }
        return true;
    }

    /**
     * Fills the form when editing
     */
    fillForm(item) {
        const titleEl = document.getElementById('noteTitle');
        const contentEl = document.getElementById('noteContent');
        const addressEl = document.getElementById('noteAddress');
        const formTitle = document.getElementById('notesFormTitle');

        if (titleEl) titleEl.value = item.title || '';
        if (contentEl) contentEl.value = item.content || '';
        if (addressEl) addressEl.value = item.address || '';
        if (formTitle) formTitle.textContent = 'Editar Anotação';
    }

    /**
     * Resets the form
     */
    clearForm() {
        super.clearForm();
        const formTitle = document.getElementById('notesFormTitle');
        if (formTitle) formTitle.textContent = 'Nova Anotação';
    }

    /**
     * Renders a single note card
     */
    renderItem(item) {
        const title = DataGuard.escapeHtml(item.title || '');
        const content = DataGuard.escapeHtml(item.content || '');
        const address = (item.address || '').trim();
        const updated = this.formatDate(item.updatedAt || item.createdAt);

        const addressBlock = address
            ? `
                <div class="note-address">
                    <a href="${this._generateMapsUrl(address)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="maps-link"
                       title="Abrir no Google Maps">
                        ${this._mapPinIcon(14)}
                        <span>${DataGuard.escapeHtml(address)}</span>
                    </a>
                </div>
            `
            : '';

        return `
            <div class="item-card note-card" data-id="${item.id}">
                <div class="note-card-header">
                    <h4 class="note-title">${title}</h4>
                    <div class="item-actions">
                        ${HTMLTemplates.buttons.editSmall(`personalHandler.modules.notes.edit('${item.id}')`)}
                        ${HTMLTemplates.buttons.deleteSmall(`personalHandler.modules.notes.delete('${item.id}')`)}
                    </div>
                </div>
                <div class="note-content">${content.replace(/\n/g, '<br>')}</div>
                ${addressBlock}
                <div class="note-meta">
                    <small>Atualizado em ${updated}</small>
                </div>
            </div>
        `;
    }

    /**
     * Inline SVG map-pin used inside note cards next to the address link.
     * Mirrors the lightweight icon pattern used by HTMLTemplates.icons.*.
     * @param {number} [size=14]
     * @returns {string}
     */
    _mapPinIcon(size = 14) {
        return `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        `;
    }

    /**
     * Builds a Google Maps deep link for an address.
     * Mirrors the pattern used in ExamsPageHandler._generateMapsUrl.
     * @param {string} address - Free-form address string
     * @returns {string} Google Maps search URL
     */
    _generateMapsUrl(address) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }

    /**
     * Empty state HTML
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon" aria-hidden="true">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="8" y1="13" x2="16" y2="13"></line>
                        <line x1="8" y1="17" x2="14" y2="17"></line>
                    </svg>
                </span>
                <p>Nenhuma anotação ainda</p>
                <small>Clique em "Nova Anotação" para começar</small>
            </div>
        `;
    }
}
