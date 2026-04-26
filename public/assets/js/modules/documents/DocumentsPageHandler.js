/**
 * @file DocumentsPageHandler.js
 * @description Digital documents manager with Firebase Storage integration.
 * 
 * Contents:
 * - File upload (drag & drop, file input)
 * - Firebase Storage integration
 * - Firestore metadata management
 * - Category filtering (Personal, Work, Financial, Health, etc.)
 * - Document viewing and download
 * 
 * Dependencies:
 * - Firebase Storage (file storage)
 * - Firestore (metadata)
 * - PersonalDataService
 * 
 * @author Leandro Fialho Fernandes
 */


/**
 * @class DocumentsPageHandler
 * @description Manages upload, storage and viewing of documents in Firebase
 */
class DocumentsPageHandler {

    /**
     * Initializes the documents handler
     * 
     * @constructor
     * @param {PageManager} pageManager - PageManager instance for integration
     * 
     * @example
     * const handler = new DocumentsPageHandler(pageManager);
     */
    constructor(pageManager) {
        this.pageManager = pageManager;
        this.currentFilter = 'all';
        this.documents = [];
        this.unsubscribe = null;
        this.maxFileSize = 100 * 1024 * 1024;
        this.categoryIcons = this._initCategoryIcons();
        this.draggedItem = null;
        this.documentOrder = [];
        this.droppedFile = null;
        this._desktopDragCounter = 0;
    }

    /**
     * Initializes category icons map
     * @private
     * @returns {Object} Category → emoji map
     */
    _initCategoryIcons() {
        return {
            'Pessoal': '👤',
            'Trabalho': '💼',
            'Financeiro': '💰',
            'Saúde': '💊',
            'Educação': '📚',
            'Imóveis': '🏠',
            'Veículos': '🚗',
            'Outros': '📁'
        };
    }

    /**
     * Resets the handler state to initial values
     * Called when tab is refreshed
     * @public
     */
    resetState() {
        this.currentFilter = 'all';
    }

    /**
     * Initializes the page (called by PageManager)
     * @public
     * @returns {Promise<void>}
     */
    async init() {
        this._loadDocumentOrder();
        await this.loadDocuments();
    }

    /**
     * Initializes the handler (alias for init)
     * @public
     */
    async initialize() {
        await this.init();
        this._setupDragAndDrop();
        this._setupDesktopDropZone();
    }

    /**
     * Cleans up resources when leaving the page
     * @public
     */
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /**
     * Renders complete page structure
     * @public
     * @returns {string} Documents page HTML
     */
    render() {
        return `
            <div class="documents-container">
                <!-- Desktop Drop Zone Overlay -->
                <div id="desktopDropZone" class="desktop-drop-zone">
                    <div class="desktop-drop-zone-inner">
                        <div class="desktop-drop-zone-icon">📄</div>
                        <h3>Solte o arquivo aqui</h3>
                        <p>O arquivo será adicionado aos seus documentos</p>
                    </div>
                </div>

                <!-- Hero Section -->
                <div class="documents-hero page-hero">
                    <h1>📄 Gerenciamento de Documentos</h1>
                    <p>Armazene e organize seus documentos importantes com segurança</p>
                </div>

                <!-- Intro Text -->
                <div class="documents-intro">
                    <p class="intro-text">Tenha seus documentos sempre à mão, organizados por categoria</p>
                </div>

                <!-- Action Button -->
                <div class="documents-actions">
                    <button class="btn-primary btn-add-document" onclick="documentsHandler.showAddDocumentForm()">
                        + Novo Documento
                    </button>
                </div>

                <!-- Content Section -->
                <div class="documents-content-section">
                    <div class="content-header">
                        <h2>📁 Seus Documentos</h2>
                        <p>Visualize, baixe e gerencie seus arquivos</p>
                    </div>
                    
                    ${this._renderDocumentForm()}
                    ${this._renderFilters()}
                    ${this._renderDocumentsList()}
                </div>
            </div>
        `;
    }

    /**
     * Renders upload form
     * @private
     * @returns {string} Form HTML
     */
    _renderDocumentForm() {
        return `
            <div id="documentForm" class="personal-form" style="display: none;">
                <h4>Adicionar Novo Documento</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Nome do Documento *</label>
                        <input type="text" id="documentName" placeholder="Ex: RG, CNH, Contrato">
                    </div>
                    <div class="form-input-group">
                        <label>Categoria</label>
                        <select id="documentCategory">
                            ${this._renderCategoryOptions()}
                        </select>
                    </div>
                </div>
                <div class="form-input-group">
                    <label>Descrição (opcional)</label>
                    <textarea id="documentDescription" rows="2" 
                              placeholder="Informações adicionais sobre o documento..."></textarea>
                </div>
                <div class="form-input-group">
                    <label>Arquivo *</label>
                    <div class="file-upload-area">
                        <input type="file" id="documentFile" 
                               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xlsx,.xls" 
                               style="display: none;" 
                               onchange="documentsHandler.handleFileSelect(event)">
                        <div class="file-upload-placeholder" 
                             onclick="document.getElementById('documentFile').click()">
                            <span class="upload-icon">📎</span>
                            <p>Clique para selecionar um arquivo</p>
                            <small>Formatos: PDF, DOC, DOCX, JPG, PNG, GIF, TXT, XLSX, XLS (máx. 100MB)</small>
                        </div>
                        <div id="filePreview" class="file-preview" style="display: none;">
                            <div class="file-preview-content">
                                <div class="file-preview-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                        <polyline points="13 2 13 9 20 9"></polyline>
                                    </svg>
                                </div>
                                <div class="file-preview-info">
                                    <p class="file-preview-name" id="fileName"></p>
                                    <small class="file-preview-status">✓ Arquivo selecionado</small>
                                </div>
                            </div>
                            <button type="button" class="btn-remove-file" 
                                    onclick="documentsHandler.removeFileSelection()" 
                                    title="Remover arquivo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" 
                            onclick="documentsHandler.cancelDocumentForm()">Cancelar</button>
                    <button type="button" class="btn-primary" 
                            onclick="documentsHandler.saveDocument()">Salvar Documento</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders category select options
     * @private
     * @returns {string} Options HTML
     */
    _renderCategoryOptions() {
        return Object.entries(this.categoryIcons)
            .map(([category, icon]) => `<option value="${category}">${icon} ${category}</option>`)
            .join('');
    }

    /**
     * Renders filters container
     * @private
     * @returns {string} Filters HTML
     */
    _renderFilters() {
        return `
            <div class="filters-container" id="filtersContainer">
                <button class="filter-btn active" data-category="all" 
                        onclick="documentsHandler.filterDocuments('all')">
                    📂 Todos (<span id="countAllDocs">0</span>)
                </button>
            </div>
        `;
    }

    /**
     * Renders documents list container
     * @private
     * @returns {string} List HTML
     */
    _renderDocumentsList() {
        return `
            <div class="documents-grid" id="documentsList">
                <div class="empty-state">
                    <span class="empty-icon">📄</span>
                    <p>Carregando documentos...</p>
                </div>
            </div>
        `;
    }

    /**
     * Renders a document card with drag handle
     * @private
     * @param {Object} doc - Document data
     * @returns {string} Card HTML
     */
    _renderDocumentCard(doc) {
        const icon = this.categoryIcons[doc.category] || '📄';
        const fileIcon = this._getFileIcon(doc.fileType);
        const fileSize = this._formatFileSize(doc.fileSize);
        const date = new Date(doc.createdAt).toLocaleDateString('pt-BR');
        const isImage = this._isImageFile(doc.fileType);

        return `
            <div class="document-card base-card accent-card" data-doc-id="${doc.id}" draggable="true">
                <div class="document-drag-handle" title="Arraste para reordenar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                    </svg>
                </div>
                ${isImage ? `
                    <div class="document-image-preview">
                        <img src="${doc.downloadURL}" alt="${doc.name}" loading="lazy">
                    </div>
                ` : ''}
                <div class="document-header">
                    <div class="document-icon-wrapper">
                        <span class="document-category-icon">${icon}</span>
                    </div>
                    <div class="document-header-info">
                        <h4 class="document-name">${doc.name}</h4>
                        <span class="document-category-badge">
                            <span class="category-text">${doc.category}</span>
                        </span>
                    </div>
                </div>
                <div class="document-body">
                    <div class="document-filename-wrapper">
                        <svg class="file-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <p class="document-filename">${doc.fileName}</p>
                    </div>
                    ${doc.description ? `<p class="document-description">${doc.description}</p>` : ''}
                    <div class="document-meta">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3h18v18H3z"></path>
                                <path d="M9 9h6v6H9z"></path>
                            </svg>
                            <span>${fileSize}</span>
                        </div>
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>${date}</span>
                        </div>
                    </div>
                </div>
                <div class="document-actions">
                    <button class="btn-action btn-view" 
                            onclick="documentsHandler.viewDocument('${doc.id}')" 
                            title="Visualizar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-action btn-print" 
                            onclick="documentsHandler.printDocument('${doc.id}')" 
                            title="Imprimir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                    </button>
                    <button class="btn-action btn-delete" 
                            onclick="documentsHandler.deleteDocument('${doc.id}')" 
                            title="Excluir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Shows add document form
     * @public
     */
    showAddDocumentForm() {
        this._clearForm();
        const form = document.getElementById('documentForm');
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });

        document.getElementById('documentsList').classList.add('hidden-for-edit');
        document.getElementById('filtersContainer').classList.add('hidden-for-edit');
    }

    /**
     * Cancels and hides form
     * @public
     */
    cancelDocumentForm() {
        this._clearForm();
        document.getElementById('documentForm').style.display = 'none';

        document.getElementById('documentsList').classList.remove('hidden-for-edit');
        document.getElementById('filtersContainer').classList.remove('hidden-for-edit');
    }

    /**
     * Clears all form fields
     * @private
     */
    _clearForm() {
        document.getElementById('documentName').value = '';
        document.getElementById('documentCategory').value = 'Pessoal';
        document.getElementById('documentDescription').value = '';
        this.removeFileSelection();
        this.droppedFile = null;
    }

    /**
     * Handles user file selection
     * @public
     * @param {Event} event - File input change event
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this._validateFileSize(file)) {
            event.target.value = '';
            return;
        }

        this._showFilePreview(file);
    }

    /**
     * Validates file size
     * @private
     * @param {File} file - File to validate
     * @returns {boolean} True if valid
     */
    _validateFileSize(file) {
        if (file.size > this.maxFileSize) {
            Swal.fire({
                icon: 'error',
                title: 'Arquivo muito grande',
                text: `O arquivo deve ter no máximo ${this._formatFileSize(this.maxFileSize)}`
            });
            return false;
        }
        return true;
    }

    /**
     * Shows selected file preview
     * @private
     * @param {File} file - Selected file
     */
    _showFilePreview(file) {
        document.querySelector('.file-upload-placeholder').style.display = 'none';
        document.getElementById('filePreview').style.display = 'flex';
        document.getElementById('fileName').textContent = file.name;
    }

    /**
     * Removes file selection
     * @public
     */
    removeFileSelection() {
        document.getElementById('documentFile').value = '';
        document.getElementById('filePreview').style.display = 'none';
        document.querySelector('.file-upload-placeholder').style.display = 'flex';
        this.droppedFile = null;
    }

    /**
     * Saves new document to Firebase (Storage + Firestore)
     * @public
     * @returns {Promise<void>}
     */
    async saveDocument() {
        const formData = this._getFormData();

        if (!this._validateFormData(formData)) {
            return;
        }

        this._showLoadingAlert('Enviando arquivo...');

        try {
            const uploadResult = await this._uploadToFirebaseStorage(formData.file);
            const docData = this._prepareDocumentData(formData, uploadResult);
            await this._saveToFirestore(docData);

            this.cancelDocumentForm();
            this._showSuccessAlert('Documento enviado com sucesso');

        } catch (error) {
            Logger.error('Error saving document:', error);
            this._showUploadError(error);
        }
    }

    /**
     * Gets form data
     * @private
     * @returns {Object} Form data
     */
    _getFormData() {
        return {
            name: document.getElementById('documentName').value.trim(),
            category: document.getElementById('documentCategory').value,
            description: document.getElementById('documentDescription').value.trim(),
            file: this.droppedFile || document.getElementById('documentFile').files[0]
        };
    }

    /**
     * Validates form data
     * @private
     * @param {Object} data - Data to validate
     * @returns {boolean} True if valid
     */
    _validateFormData(data) {
        if (!data.name) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Por favor, preencha o nome do documento'
            });
            return false;
        }

        if (!data.file) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Por favor, selecione um arquivo'
            });
            return false;
        }

        return true;
    }

    /**
     * Uploads file to Firebase Storage
     * @private
     * @param {File} file - File to upload
     * @returns {Promise<Object>} Result with storagePath, downloadURL and timestamp
     */
    async _uploadToFirebaseStorage(file) {
        const { storage, auth, ref, uploadBytes, getDownloadURL } = window.firebaseGlobals;

        const userId = auth.currentUser.uid;
        const timestamp = Date.now();
        const sanitizedFileName = this._sanitizeFileName(file.name, timestamp);

        const storageRef = ref(storage, `documents/${userId}/${sanitizedFileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            storagePath: snapshot.ref.fullPath,
            downloadURL,
            timestamp
        };
    }

    /**
     * Sanitizes filename removing special characters
     * @private
     * @param {string} fileName - Original name
     * @param {number} timestamp - Timestamp for unique prefix
     * @returns {string} Sanitized name
     */
    _sanitizeFileName(fileName, timestamp) {
        return `${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    }

    /**
     * Prepares complete document data for saving
     * @private
     * @param {Object} formData - Form data
     * @param {Object} uploadResult - Storage upload result
     * @returns {Object} Complete document data
     */
    _prepareDocumentData(formData, uploadResult) {
        return {
            id: uploadResult.timestamp.toString(),
            name: formData.name,
            category: formData.category,
            description: formData.description,
            fileName: formData.file.name,
            fileType: formData.file.type,
            fileSize: formData.file.size,
            storagePath: uploadResult.storagePath,
            downloadURL: uploadResult.downloadURL,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Saves document metadata to Firestore
     * @private
     * @param {Object} docData - Document data
     * @returns {Promise<void>}
     */
    async _saveToFirestore(docData) {
        const { FirebaseDataService } = window.firebaseGlobals;
        await FirebaseDataService.saveDocument('documents', docData, docData.id);
    }

    /**
     * Loads documents from Firestore with real-time listener
     * @public
     */
    loadDocuments() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        const { FirebaseDataService } = window.firebaseGlobals;

        this.unsubscribe = FirebaseDataService.listenToCollection('documents', (documents) => {
            this.documents = documents;
            this._updateFilters(documents);
            this._renderFilteredDocuments();
        });
    }

    /**
     * Deletes document from Firebase (Storage + Firestore)
     * @public
     * @param {string} docId - Document ID
     * @returns {Promise<void>}
     */
    async deleteDocument(docId) {
        const confirmed = await this._confirmDeletion();
        if (!confirmed) return;

        try {
            const doc = this.documents.find(d => d.id === docId);
            if (!doc) return;

            this._showLoadingAlert('Excluindo...');

            await this._deleteFromStorage(doc.storagePath);
            await this._deleteFromFirestore(docId);

            this._showSuccessAlert('Documento excluído com sucesso');

        } catch (error) {
            Logger.error('Error deleting document:', error);
            await this._handleDeletionError(error, docId);
        }
    }

    /**
     * Confirms deletion with user
     * @private
     * @returns {Promise<boolean>} True if confirmed
     */
    async _confirmDeletion() {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não poderá ser desfeita',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        return result.isConfirmed;
    }

    /**
     * Deletes file from Firebase Storage
     * @private
     * @param {string} storagePath - Storage path
     * @returns {Promise<void>}
     */
    async _deleteFromStorage(storagePath) {
        const { storage, ref, deleteObject } = window.firebaseGlobals;
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
    }

    /**
     * Deletes metadata from Firestore
     * @private
     * @param {string} docId - Document ID
     * @returns {Promise<void>}
     */
    async _deleteFromFirestore(docId) {
        const { FirebaseDataService } = window.firebaseGlobals;
        await FirebaseDataService.deleteDocument('documents', docId);
    }

    /**
     * Handles deletion errors
     * @private
     * @param {Error} error - Occurred error
     * @param {string} docId - Document ID
     * @returns {Promise<void>}
     */
    async _handleDeletionError(error, docId) {
        if (error.code === 'storage/object-not-found') {
            try {
                await this._deleteFromFirestore(docId);
                this._showSuccessAlert('Metadados excluídos (arquivo já havia sido removido)');
                return;
            } catch (e) {
                Logger.error('Error deleting metadata:', e);
            }
        }

        Swal.fire({
            icon: 'error',
            title: 'Erro ao excluir!',
            text: 'Ocorreu um erro ao excluir o documento.',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Updates filters based on available documents
     * @private
     * @param {Array} documents - Documents list
     */
    _updateFilters(documents) {
        const categoryCounts = this._calculateCategoryCounts(documents);
        this._renderFilterButtons(categoryCounts, documents.length);
    }

    /**
     * Calculates document count per category
     * @private
     * @param {Array} documents - Documents list
     * @returns {Object} Category → count map
     */
    _calculateCategoryCounts(documents) {
        return documents.reduce((counts, doc) => {
            counts[doc.category] = (counts[doc.category] || 0) + 1;
            return counts;
        }, {});
    }

    /**
     * Renders dynamic filter buttons
     * @private
     * @param {Object} categoryCounts - Counters per category
     * @param {number} totalCount - Total documents
     */
    _renderFilterButtons(categoryCounts, totalCount) {
        const container = document.getElementById('filtersContainer');
        if (!container) return;

        const allButtonClass = this.currentFilter === 'all' ? 'active' : '';

        let html = `
            <button class="filter-btn ${allButtonClass}" data-category="all" 
                    onclick="documentsHandler.filterDocuments('all')">
                📂 Todos (<span id="countAllDocs">${totalCount}</span>)
            </button>
        `;

        Object.entries(categoryCounts).forEach(([category, count]) => {
            const icon = this.categoryIcons[category] || '📁';
            const activeClass = this.currentFilter === category ? 'active' : '';

            html += `
                <button class="filter-btn ${activeClass}" data-category="${category}" 
                        onclick="documentsHandler.filterDocuments('${category}')">
                    ${icon} ${category} (${count})
                </button>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Filters documents by category
     * @public
     * @param {string} category - Category to filter ('all' for all)
     */
    filterDocuments(category) {
        this.currentFilter = category;
        this._updateFilterButtonsState();
        this._renderFilteredDocuments();
    }

    /**
     * Updates filter buttons visual state
     * @private
     */
    _updateFilterButtonsState() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === this.currentFilter);
        });
    }

    /**
     * Renders documents according to current filter
     * @private
     */
    _renderFilteredDocuments() {
        const filteredDocs = this._getFilteredDocuments();
        const docsList = document.getElementById('documentsList');

        if (!docsList) return;

        if (filteredDocs.length === 0) {
            docsList.innerHTML = this._renderEmptyState();
            return;
        }

        docsList.innerHTML = filteredDocs.map(doc => this._renderDocumentCard(doc)).join('');

        this._setupDragAndDrop();
    }

    /**
     * Gets filtered documents sorted by saved order
     * @private
     * @returns {Array} Filtered and sorted documents list
     */
    _getFilteredDocuments() {
        let docs;
        if (this.currentFilter === 'all') {
            docs = [...this.documents];
        } else {
            docs = this.documents.filter(d => d.category === this.currentFilter);
        }

        if (this.documentOrder.length > 0) {
            docs.sort((a, b) => {
                const indexA = this.documentOrder.indexOf(a.id);
                const indexB = this.documentOrder.indexOf(b.id);
                const posA = indexA === -1 ? 9999 : indexA;
                const posB = indexB === -1 ? 9999 : indexB;
                return posA - posB;
            });
        }

        return docs;
    }

    /**
     * Renders empty state
     * @private
     * @returns {string} Empty state HTML
     */
    _renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">📄</span>
                <p>Nenhum documento encontrado</p>
            </div>
        `;
    }

    /**
     * Opens document in new tab
     * @public
     * @param {string} docId - Document ID
     */
    viewDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (doc) {
            window.open(doc.downloadURL, '_blank');
        }
    }

    /**
     * Downloads document
     * @public
     * @param {string} docId - Document ID
     */
    downloadDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        const link = document.createElement('a');
        link.href = doc.downloadURL;
        link.download = doc.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Prints document
     * @public
     * @param {string} docId - Document ID
     */
    printDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(this._generatePrintHTML(doc));
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    /**
     * Generates formatted HTML for printing
     * @private
     * @param {Object} doc - Document
     * @returns {string} Complete HTML for printing
     */
    _generatePrintHTML(doc) {
        const contentHTML = doc.fileType.startsWith('image/')
            ? `<img src="${doc.downloadURL}" alt="${doc.name}">`
            : `<iframe src="${doc.downloadURL}"></iframe>`;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${doc.name}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 0; }
                        .print-content img { 
                            max-width: 100%; 
                            max-height: 25cm; 
                            object-fit: contain; 
                            page-break-after: auto;
                        }
                        iframe { display: none; }
                        h1, h2, h3 { page-break-after: avoid; }
                    }
                    @media screen {
                        body { padding: 20px; background: #f5f5f5; }
                        .print-container { 
                            max-width: 210mm; 
                            margin: 0 auto; 
                            background: white; 
                            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
                            padding: 20px; 
                        }
                    }
                    .print-header { 
                        margin-bottom: 20px; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 10px; 
                    }
                    .print-header h1 { margin: 0 0 10px 0; }
                    .print-header p { margin: 0; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="print-header">
                        <h1>${doc.name}</h1>
                        <p>Arquivo: ${doc.fileName} | Categoria: ${doc.category} | Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="print-content">${contentHTML}</div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Sets up drag and drop event listeners on the documents grid
     * @private
     */
    _setupDragAndDrop() {
        const container = document.getElementById('documentsList');
        if (!container) return;

        container.addEventListener('dragstart', this._handleDragStart.bind(this));
        container.addEventListener('dragend', this._handleDragEnd.bind(this));
        container.addEventListener('dragover', this._handleDragOver.bind(this));
        container.addEventListener('dragenter', this._handleDragEnter.bind(this));
        container.addEventListener('dragleave', this._handleDragLeave.bind(this));
        container.addEventListener('drop', this._handleDrop.bind(this));
    }

    /**
     * Handles drag start
     * @private
     * @param {DragEvent} e
     */
    _handleDragStart(e) {
        const card = e.target.closest('.document-card');
        if (!card) return;

        this.draggedItem = card;
        card.classList.add('dragging');

        e.dataTransfer.setData('text/plain', card.dataset.docId);
        e.dataTransfer.effectAllowed = 'move';

        setTimeout(() => {
            card.style.opacity = '0.4';
        }, 0);
    }

    /**
     * Handles drag end
     * @private
     * @param {DragEvent} e
     */
    _handleDragEnd(e) {
        const card = e.target.closest('.document-card');
        if (card) {
            card.classList.remove('dragging');
            card.style.opacity = '';
        }

        document.querySelectorAll('.document-card.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        this.draggedItem = null;
    }

    /**
     * Handles drag over (allows drop)
     * @private
     * @param {DragEvent} e
     */
    _handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Handles drag enter (visual feedback)
     * @private
     * @param {DragEvent} e
     */
    _handleDragEnter(e) {
        const card = e.target.closest('.document-card');
        if (card && card !== this.draggedItem) {
            card.classList.add('drag-over');
        }
    }

    /**
     * Handles drag leave (remove visual feedback)
     * @private
     * @param {DragEvent} e
     */
    _handleDragLeave(e) {
        const card = e.target.closest('.document-card');
        if (card) {
            card.classList.remove('drag-over');
        }
    }

    /**
     * Handles drop (reorder documents)
     * @private
     * @param {DragEvent} e
     */
    _handleDrop(e) {
        e.preventDefault();

        const targetCard = e.target.closest('.document-card');
        if (!targetCard || targetCard === this.draggedItem || !this.draggedItem) return;

        targetCard.classList.remove('drag-over');

        const container = document.getElementById('documentsList');
        const cards = [...container.querySelectorAll('.document-card')];

        const draggedIndex = cards.indexOf(this.draggedItem);
        const targetIndex = cards.indexOf(targetCard);

        if (draggedIndex < targetIndex) {
            targetCard.parentNode.insertBefore(this.draggedItem, targetCard.nextSibling);
        } else {
            targetCard.parentNode.insertBefore(this.draggedItem, targetCard);
        }

        this._saveDocumentOrder();
        this._showDragToast('Ordem dos documentos atualizada!');
    }

    /**
     * Saves current document order to localStorage
     * @private
     */
    _saveDocumentOrder() {
        const container = document.getElementById('documentsList');
        if (!container) return;

        const cards = [...container.querySelectorAll('.document-card[data-doc-id]')];
        this.documentOrder = cards.map(card => card.dataset.docId);

        localStorage.setItem('sigp_documents_order', JSON.stringify(this.documentOrder));
        console.log('📦 Nova ordem dos documentos salva:', this.documentOrder.length, 'itens');
    }

    /**
     * Loads saved document order from localStorage
     * @private
     */
    _loadDocumentOrder() {
        try {
            const saved = localStorage.getItem('sigp_documents_order');
            this.documentOrder = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('⚠️ Erro ao carregar ordem dos documentos:', error);
            this.documentOrder = [];
        }
    }

    /**
     * Shows a brief toast notification for drag actions
     * @private
     * @param {string} msg - Message to show
     */
    _showDragToast(msg) {
        document.querySelectorAll('.drag-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'drag-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // =========================================================
    // DESKTOP DROP ZONE — arrastar arquivos do sistema de arquivos
    // =========================================================

    /**
     * Registers drop zone events on the documents container
     * Distinguishes OS file drags from card reorder drags via dataTransfer.types
     * @private
     */
    _setupDesktopDropZone() {
        const container = document.querySelector('.documents-container');
        if (!container) return;

        this._desktopDragCounter = 0;

        container.addEventListener('dragenter', (e) => {
            if (!this._isFileDrag(e)) return;
            e.preventDefault();
            this._desktopDragCounter++;
            document.getElementById('desktopDropZone')?.classList.add('active');
        });

        container.addEventListener('dragleave', (e) => {
            if (!this._isFileDrag(e)) return;
            this._desktopDragCounter--;
            if (this._desktopDragCounter <= 0) {
                this._desktopDragCounter = 0;
                document.getElementById('desktopDropZone')?.classList.remove('active');
            }
        });

        container.addEventListener('dragover', (e) => {
            if (!this._isFileDrag(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        container.addEventListener('drop', (e) => {
            if (!this._isFileDrag(e)) return;
            e.preventDefault();
            this._desktopDragCounter = 0;
            document.getElementById('desktopDropZone')?.classList.remove('active');
            const file = e.dataTransfer.files[0];
            if (file) this._handleDesktopFileDrop(file);
        });
    }

    /**
     * Returns true when the drag event carries OS files (not card reorder)
     * @private
     */
    _isFileDrag(e) {
        return e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files');
    }

    /**
     * Handles a file dropped from the OS file system
     * Validates, stores the file reference and pre-populates the upload form
     * @private
     * @param {File} file - Dropped file
     */
    _handleDesktopFileDrop(file) {
        if (!this._validateFileSize(file)) return;

        this.droppedFile = file;

        const form = document.getElementById('documentForm');
        if (form && form.style.display === 'none') {
            this.showAddDocumentForm();
        }

        const nameInput = document.getElementById('documentName');
        if (nameInput && !nameInput.value.trim()) {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            nameInput.value = nameWithoutExt.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
        }

        this._showFilePreview(file);

        form?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Gets emoji icon based on MIME type
     * @private
     * @param {string} fileType - File MIME type
     * @returns {string} Representative emoji
     */
    _getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.includes('pdf')) return '📕';
        if (fileType.includes('word')) return '📘';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('text')) return '📝';
        return '📄';
    }

    /**
     * Checks if file is an image
     * @private
     * @param {string} fileType - MIME type
     * @returns {boolean} True if image
     */
    _isImageFile(fileType) {
        return fileType && fileType.startsWith('image/');
    }

    /**
     * Formats file size in readable format
     * @private
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size (e.g., "2.5 MB")
     */
    _formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * Shows loading alert
     * @private
     * @param {string} message - Message to display
     */
    _showLoadingAlert(message) {
        Swal.fire({
            title: message,
            text: 'Por favor, aguarde',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    /**
     * Shows success alert
     * @private
     * @param {string} message - Message to display
     */
    _showSuccessAlert(message) {
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: message,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
    }

    /**
     * Shows upload specific error
     * @private
     * @param {Error} error - Occurred error
     */
    _showUploadError(error) {
        const messages = {
            'storage/unauthorized': 'Você não tem permissão para enviar arquivos.',
            'storage/canceled': 'O upload foi cancelado.',
            'storage/quota-exceeded': 'Limite de armazenamento excedido.'
        };

        Swal.fire({
            icon: 'error',
            title: 'Erro ao enviar!',
            text: messages[error.code] || 'Ocorreu um erro ao enviar o documento.',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
}