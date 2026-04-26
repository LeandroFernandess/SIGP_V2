/**
 * @file BaseTrainingModule.js
 * @description Abstract base class for training modules.
 * 
 * Contents:
 * - Template Method Pattern for CRUD
 * - TrainingService integration
 * - Form management (add/edit modes)
 * - Abstract methods for subclasses
 * 
 * Subclasses:
 * - WorkoutModule (weight training)
 * - RunningModule (running plans)
 * 
 * Dependencies:
 * - TrainingService (Firebase persistence)
 * 
 * @abstract
 * @author Leandro Fialho Fernandes
 */

/**
 * @class BaseTrainingModule
 * @abstract
 * @description Base class for training modules. Cannot be instantiated directly.
 * 
 * @property {string} moduleName - Module name (workout or running)
 * @property {string|null} editingId - ID of the item currently being edited
 * @property {Array<Object>} items - List of items loaded from Firebase
 * @property {TrainingService} trainingService - Firebase integration service
 * 
 * @example
 * class WorkoutModule extends BaseTrainingModule {
 *   constructor() {
 *     super('workout');
 *   }
 * }
 */
class BaseTrainingModule {

    /**
     * @constructor
     * @param {string} moduleName - Module name ('workout' or 'running')
     * @throws {TypeError} If trying to instantiate BaseTrainingModule directly
     */
    constructor(moduleName) {
        if (new.target === BaseTrainingModule) {
            throw new TypeError('Cannot instantiate abstract class BaseTrainingModule');
        }

        this.moduleName = moduleName;
        this.editingId = null;
        this.items = [];
        this.trainingService = new TrainingService();
    }

    /**
     * @abstract
     * @description Renders the complete module interface
     * @throws {Error} If not implemented by subclass
     */
    render() {
        throw new Error('Method render() must be implemented by subclass');
    }

    /**
     * @abstract
     * @description Renders an individual item in the list
     * @param {Object} item - Item to be rendered
     * @throws {Error} If not implemented by subclass
     */
    renderItem(item) {
        throw new Error('Method renderItem() must be implemented by subclass');
    }

    /**
     * @abstract
     * @description Validates form data
     * @param {Object} data - Data to be validated
     * @returns {boolean} True if valid
     * @throws {Error} If not implemented by subclass
     */
    validateForm(data) {
        throw new Error('Method validateForm() must be implemented by subclass');
    }

    /**
     * @abstract
     * @description Extracts data from the form
     * @returns {Object} Form data
     * @throws {Error} If not implemented by subclass
     */
    getFormData() {
        throw new Error('Method getFormData() must be implemented by subclass');
    }

    /**
     * @abstract
     * @description Fills the form with item data
     * @param {Object} item - Item with data to fill
     * @throws {Error} If not implemented by subclass
     */
    fillForm(item) {
        throw new Error('Method fillForm() must be implemented by subclass');
    }

    /**
     * @description Initializes the module, loading data from Firebase
     * @param {string} [userId] - User ID (optional, auto-detects)
     * @returns {Promise<void>}
     */
    async initialize(userId) {
        if (!userId) {
            userId = this.getUserId();
        }
        await this.loadAndRender(userId);
    }

    /**
     * @description Cleans up module resources
     * @remarks Subclasses can override for specific cleanup
     */
    cleanup() {
    }

    /**
     * @description Loads items from Firebase with automatic retry
     * @details Implements retry logic of 3 attempts with progressive delays
     * to handle Firebase synchronization delays
     * @param {string} userId - User ID
     * @returns {Promise<Array<Object>>} List of loaded items
     */
    async loadItems(userId) {
        try {
            if (!this.trainingService.isFirebaseReady()) {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (!this.trainingService.isFirebaseReady()) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            this.items = await this.trainingService.getAll(userId, this.moduleName);
            
            if (this.items.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 800));
                
                this.items = await this.trainingService.getAll(userId, this.moduleName);
                
                if (this.items.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1200));
                    this.items = await this.trainingService.getAll(userId, this.moduleName);
                }
            }
            
            return this.items;
        } catch (error) {
            Logger.error(`Erro ao carregar ${this.moduleName}:`, error);
            
            if (error.message.includes('Firebase não está inicializado')) {
                return [];
            }
            
            this.showError('Erro ao carregar dados');
            return [];
        }
    }

    /**
     * Saves or updates an item
     */
    async save(userId) {
        try {
            if (!userId) {
                userId = this.getUserId();
            }

            const formData = this.getFormData();

            if (!this.validateForm(formData)) {
                return false;
            }

            if (this.editingId) {
                await this.trainingService.update(userId, this.moduleName, this.editingId, formData);
                this.showSuccess('Item atualizado com sucesso!');
            } else {
                await this.trainingService.add(userId, this.moduleName, formData);
                this.showSuccess('Item adicionado com sucesso!');
            }

            this.clearForm();
            this.cancelForm();
            await this.loadAndRender(userId);
            return true;

        } catch (error) {
            Logger.error(`Erro ao salvar ${this.moduleName}:`, error);
            this.showError('Erro ao salvar item');
            return false;
        }
    }

    /**
     * Edits an existing item
     */
    async edit(userId, itemId) {
        if (!userId) {
            userId = this.getUserId();
        }

        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            this.showError('Item não encontrado');
            return;
        }

        this.editingId = itemId;
        this.showForm();
        this.fillForm(item);
    }

    /**
     * Deletes an item with confirmation
     */
    async delete(userId, itemId) {
        if (!userId) {
            userId = this.getUserId();
        }

        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não pode ser desfeita!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                await this.trainingService.delete(userId, this.moduleName, itemId);
                await this.loadAndRender(userId);
                this.showSuccess('Item deletado com sucesso!');
            } catch (error) {
                Logger.error(`Erro ao deletar ${this.moduleName}:`, error);
                this.showError('Erro ao deletar item');
            }
        }
    }

    /**
     * Shows the form
     */
    showForm() {
        const form = document.getElementById(`${this.moduleName}Form`);
        const addBtn = document.getElementById(`addBtn${this.capitalize(this.moduleName)}`);
        
        if (form) form.style.display = 'block';
        if (addBtn) addBtn.style.display = 'none';
    }

    /**
     * Cancels form editing and hides the form
     */
    cancelForm() {
        this.clearForm();
        this.editingId = null;
        
        const form = document.getElementById(`${this.moduleName}Form`);
        const addBtn = document.getElementById(`addBtn${this.capitalize(this.moduleName)}`);
        
        if (form) form.style.display = 'none';
        if (addBtn) addBtn.style.display = 'block';
    }

    /**
     * Clears all form fields
     */
    clearForm() {
        const form = document.getElementById(`${this.moduleName}Form`);
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    }

    /**
     * Loads data and renders the list
     */
    async loadAndRender(userId) {
        if (!userId) {
            userId = this.getUserId();
        }
        
        const container = document.getElementById(`${this.moduleName}List`);
        if (container) {
            container.innerHTML = this.renderLoadingState();
        }
        
        await this.loadItems(userId);
        this.renderList();
    }

    /**
     * Renders the items list
     */
    renderList() {
        const container = document.getElementById(`${this.moduleName}List`);
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = this.items.map(item => this.renderItem(item)).join('');
    }

    /**
     * Renders loading state
     */
    renderLoadingState() {
        return `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>🔄 Carregando dados...</p>
                <p class="loading-hint">Aguarde alguns instantes</p>
            </div>
        `;
    }

    /**
     * Renders empty state when no items exist
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <p>📭 Nenhum item encontrado</p>
                <p class="empty-state-hint">Clique em "Adicionar" para criar o primeiro item</p>
            </div>
        `;
    }

    /**
     * Gets current user ID from session or Firebase
     */
    getUserId() {
        try {
            const stored = sessionStorage.getItem('currentUser');
            if (stored) {
                const user = JSON.parse(stored);
                if (user?.id || user?.uid) {
                    return user.id || user.uid;
                }
            }
        } catch (error) {
            Logger.error('Erro ao ler usuário da sessão:', error);
        }

        const authUser = window.firebaseGlobals?.auth?.currentUser;
        if (authUser?.uid) {
            return authUser.uid;
        }

        return null;
    }

    /**
     * Capitalizes first letter of string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Shows success message
     */
    showSuccess(message) {
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
     * Shows error message
     */
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    /**
     * Shows validation warning message
     */
    showValidation(message) {
        Swal.fire({
            icon: 'warning',
            title: 'Atenção!',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
}
