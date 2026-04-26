/**
 * @file TasksModule.js
 * @description Task management with topics and filters.
 * 
 * Contents:
 * - Task CRUD with checkbox topics
 * - Status filters (all, pending, completed)
 * - Priority levels (low, medium, high)
 * - Progress indicator per task
 * 
 * Extends: BasePersonalModule
 * 
 * Dependencies:
 * - PersonalDataService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class TasksModule
 * @extends BasePersonalModule
 * @description Manages tasks with checkable topics and filter system
 * 
 * @property {string} currentFilter - Current filter ('all', 'pending', 'completed')
 * @property {PersonalDataService} dataService - Inherited data service
 * @property {string} moduleName - Module name ('tasks')
 * 
 * @example
 * const tasks = new TasksModule(personalDataService);
 * tasks.initialize(userId);
 */
class TasksModule extends BasePersonalModule {
    
    /**
     * @constructor
     * @param {PersonalDataService} personalDataService - Serviço de dados do Firebase
     */
    constructor(personalDataService) {
        super(personalDataService, 'tasks');
        this.currentFilter = 'all';
        this.tempTopics = [];
    }

    /**
     * @description Renders the complete tasks module interface
     * @returns {string} Module HTML
     */
    render() {
        return `
            <div class="module-section">
                <div class="module-header">
                    <button class="btn-primary" id="addBtnTasks" onclick="personalHandler.modules.tasks.showForm()">
                        + Nova Tarefa
                    </button>
                </div>

                ${this.renderForm()}
                ${this.renderFilters()}

                <div id="tasksList" class="items-list"></div>
            </div>
        `;
    }

    /**
     * Renders the task form
     */
    renderForm() {
        return `
            <div id="tasksForm" class="personal-form">
                <h4 id="tasksFormTitle">Adicionar Nova Tarefa</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Título da Tarefa *</label>
                        <input type="text" id="taskTitle" placeholder="Ex: Finalizar relatório">
                    </div>
                    <div class="form-input-group">
                        <label>Prioridade</label>
                        <select id="taskPriority">
                            <option value="low">🟢 Baixa</option>
                            <option value="medium" selected>🟡 Média</option>
                            <option value="high">🔴 Alta</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Categoria</label>
                        <select id="taskCategory">
                            <option value="Trabalho">💼 Trabalho</option>
                            <option value="Pessoal">🏠 Pessoal</option>
                            <option value="Estudos">📚 Estudos</option>
                            <option value="Saúde">💊 Saúde</option>
                            <option value="Finanças">💰 Finanças</option>
                            <option value="Compras">🛒 Compras</option>
                            <option value="Projetos">🎯 Projetos</option>
                            <option value="Outros">📁 Outros</option>
                        </select>
                    </div>
                </div>
                <div class="form-input-group">
                    <label>Descrição (opcional)</label>
                    <textarea id="taskDescription" rows="3" placeholder="Digite uma descrição geral da tarefa..."></textarea>
                </div>
                <div class="form-input-group" style="margin-top: 1.5rem;">
                    <label>Tópicos / Subtarefas (opcional)</label>
                    <div class="topics-input-container">
                        <div class="topics-add-row">
                            <input type="text" id="taskTopicInput" placeholder="Digite um tópico e pressione Enter ou clique em Adicionar" maxlength="500">
                            <button type="button" class="btn-add-topic" onclick="personalHandler.modules.tasks.addTopicToList()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Adicionar
                            </button>
                        </div>
                        <div id="topicsList" class="topics-list"></div>
                    </div>
                    <small class="form-hint">
                        💡 Adicione tópicos que podem ser marcados como concluídos individualmente
                    </small>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="personalHandler.modules.tasks.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="personalHandler.modules.tasks.save()">Salvar Tarefa</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders the task filters
     */
    renderFilters() {
        return `
            <div class="task-filters">
                <button class="filter-btn active" data-filter="all" onclick="personalHandler.modules.tasks.filterItems('all')">
                    Todas (<span id="countAll">0</span>)
                </button>
                <button class="filter-btn" data-filter="pending" onclick="personalHandler.modules.tasks.filterItems('pending')">
                    Pendentes (<span id="countPending">0</span>)
                </button>
                <button class="filter-btn" data-filter="completed" onclick="personalHandler.modules.tasks.filterItems('completed')">
                    Concluídas (<span id="countCompleted">0</span>)
                </button>
            </div>
        `;
    }

    /**
     * Renders a task item
     */
    renderItem(task) {
        const priorityConfig = {
            low: { color: '#10b981', label: '🟢 Baixa' },
            medium: { color: '#f59e0b', label: '🟡 Média' },
            high: { color: '#ef4444', label: '🔴 Alta' }
        };

        const categoryIcons = {
            'Trabalho': '💼', 'Pessoal': '🏠', 'Estudos': '📚',
            'Saúde': '💊', 'Finanças': '💰', 'Compras': '🛒',
            'Projetos': '🎯', 'Outros': '📁'
        };

        const descriptionHTML = this.renderDescription(task);
        const priority = priorityConfig[task.priority];

        return `
            <div class="item-card ${task.completed ? 'completed' : ''}">
                <div class="item-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="personalHandler.modules.tasks.toggleTask('${task.id}')">
                </div>
                <div class="item-content">
                    <h4>${task.title}</h4>
                    <div class="item-meta">
                        <span class="item-badge" style="background: ${priority.color}20; color: ${priority.color}">
                            ${priority.label}
                        </span>
                        <span class="item-badge">${categoryIcons[task.category] || '📁'} ${task.category}</span>
                    </div>
                    ${descriptionHTML}
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="personalHandler.modules.tasks.edit('${task.id}')" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete" onclick="personalHandler.modules.tasks.delete('${task.id}')" title="Excluir">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Validates form data
     */
    validateForm(data) {
        if (!data.title || data.title.trim() === '') {
            this.showValidation('Por favor, preencha o título da tarefa');
            return false;
        }
        return true;
    }

    /**
     * Gets form data
     */
    getFormData() {
        const topics = {};
        
        this.tempTopics.forEach(topic => {
            topics[topic.id] = topic.checked;
        });
        
        if (this.editingId) {
            const existingTask = this.items.find(t => t.id === this.editingId);
            if (existingTask?.topics) {
                this.tempTopics.forEach(topic => {
                    const existingTopic = Object.entries(existingTask.topics).find(([id, checked]) => {
                        const existingTopicData = this.getTopicDataFromTask(existingTask, id);
                        return existingTopicData && existingTopicData.text === topic.text;
                    });
                    
                    if (existingTopic) {
                        topics[topic.id] = existingTopic[1];
                    }
                });
            }
            
            const existingCompleted = existingTask?.completed || false;
            return {
                title: document.getElementById('taskTitle').value.trim(),
                priority: document.getElementById('taskPriority').value,
                category: document.getElementById('taskCategory').value,
                description: document.getElementById('taskDescription').value.trim(),
                topics: topics,
                topicsData: this.tempTopics.map(t => ({ id: t.id, text: t.text })),
                completed: existingCompleted
            };
        }
        
        return {
            title: document.getElementById('taskTitle').value.trim(),
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            description: document.getElementById('taskDescription').value.trim(),
            topics: topics,
            topicsData: this.tempTopics.map(t => ({ id: t.id, text: t.text })),
            completed: false
        };
    }

    /**
     * Fills the form with task data
     */
    fillForm(task) {
        document.getElementById('tasksFormTitle').textContent = 'Editar Tarefa';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDescription').value = task.description || '';
        
        this.tempTopics = [];
        
        if (task.topicsData && Array.isArray(task.topicsData)) {
            this.tempTopics = task.topicsData.map(topicData => ({
                id: topicData.id,
                text: topicData.text,
                checked: task.topics?.[topicData.id] || false
            }));
        } 
        else if (task.description) {
            const lines = task.description.split('\n');
            lines.forEach((line, index) => {
                if (line.trim().startsWith('-')) {
                    const topicId = `topic_${index}`;
                    this.tempTopics.push({
                        id: topicId,
                        text: line.trim().substring(1).trim(),
                        checked: task.topics?.[topicId] || false
                    });
                }
            });
        }
        
        this.renderTopicsList();
        this.setupTopicInputListener();
    }

    /**
     * Helper to extract topic data from task description
     */
    getTopicDataFromTask(task, topicId) {
        if (!task.description) return null;
        
        const match = topicId.match(/topic_(\d+)/);
        if (!match) return null;
        
        const index = parseInt(match[1]);
        const lines = task.description.split('\n');
        
        const line = lines[index];
        if (line && line.trim().startsWith('-')) {
            return {
                text: line.trim().substring(1).trim()
            };
        }
        
        return null;
    }

    renderDescription(task) {
        let html = '';
        
        if (task.description && task.description.trim()) {
            html += `<p class="item-description">${task.description}</p>`;
        }

        if (task.topicsData && Array.isArray(task.topicsData) && task.topicsData.length > 0) {
            const hasCompletedTopics = task.topicsData.some(topicData => task.topics?.[topicData.id] || false);
            
            html += `<div class="task-topics">`;
            
            if (hasCompletedTopics) {
                html += `
                    <div class="task-topics-header">
                        <button class="btn-delete-completed-topics" 
                                onclick="personalHandler.modules.tasks.deleteCompletedTopics('${task.id}')" 
                                title="Excluir tópicos concluídos">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            Excluir Concluídos
                        </button>
                    </div>
                `;
            }
            
            task.topicsData.forEach(topicData => {
                const checked = task.topics?.[topicData.id] || false;
                html += `
                    <div class="topic-item ${checked ? 'completed' : ''}">
                        <input type="checkbox" 
                               ${checked ? 'checked' : ''} 
                               onchange="personalHandler.modules.tasks.toggleTopic('${task.id}', '${topicData.id}')"
                               class="topic-checkbox">
                        <span class="topic-text editable-topic" 
                              onclick="personalHandler.modules.tasks.editTopicInline('${task.id}', '${topicData.id}')" 
                              style="cursor: pointer;" 
                              title="Clique para editar">${topicData.text}</span>
                    </div>
                `;
            });
            html += `</div>`;
            return html;
        }

        if (task.description) {
            const lines = task.description.split('\n');
            const topics = [];

            lines.forEach((line, index) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('-')) {
                    const topicText = trimmed.substring(1).trim();
                    if (topicText) {
                        const topicId = `topic_${index}`;
                        topics.push({
                            id: topicId,
                            text: topicText,
                            checked: task.topics?.[topicId] || false
                        });
                    }
                }
            });

            if (topics.length > 0) {
                html += `<div class="task-topics">`;
                topics.forEach(topic => {
                    html += `
                        <div class="topic-item ${topic.checked ? 'completed' : ''}">
                            <input type="checkbox" 
                                   ${topic.checked ? 'checked' : ''} 
                                   onchange="personalHandler.modules.tasks.toggleTopic('${task.id}', '${topic.id}')"
                                   class="topic-checkbox">
                            <span class="topic-text editable-topic" 
                                  onclick="personalHandler.modules.tasks.editTopicInline('${task.id}', '${topic.id}')" 
                                  style="cursor: pointer;" 
                                  title="Clique para editar">${topic.text}</span>
                        </div>
                    `;
                });
                html += `</div>`;
            }
        }

        return html;
    }

    /**
     * Toggles the task completion state
     */
    async toggleTask(taskId) {
        const task = this.items.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;

        if (task.completed && task.description) {
            this.checkAllTopics(task);
        } else if (!task.completed && task.topics) {
            this.uncheckAllTopics(task);
        }

        await this.personalDataService.update(this.moduleName, taskId, task);
        await this.loadAndRender();
    }

    /**
     * Toggles a topic's state
     */
    async toggleTopic(taskId, topicId) {
        const task = this.items.find(t => t.id === taskId);
        if (!task) return;

        if (!task.topics) task.topics = {};
        task.topics[topicId] = !task.topics[topicId];

        if (this.allTopicsChecked(task)) {
            task.completed = true;
        } else if (task.completed) {
            task.completed = false;
        }

        await this.personalDataService.update(this.moduleName, taskId, task);
        await this.loadAndRender();
    }

    /**
     * Marks all topics as completed
     */
    checkAllTopics(task) {
        if (!task.description) return;

        const lines = task.description.split('\n');
        if (!task.topics) task.topics = {};

        lines.forEach((line, index) => {
            if (line.trim().startsWith('-')) {
                task.topics[`topic_${index}`] = true;
            }
        });
    }

    /**
     * Unchecks all topics
     */
    uncheckAllTopics(task) {
        if (!task.description || !task.topics) return;

        const lines = task.description.split('\n');
        lines.forEach((line, index) => {
            if (line.trim().startsWith('-')) {
                task.topics[`topic_${index}`] = false;
            }
        });
    }

    /**
     * Checks if all topics are marked
     */
    allTopicsChecked(task) {
        if (!task.description) return false;

        const lines = task.description.split('\n');
        const topicLines = lines.filter(line => line.trim().startsWith('-'));

        if (topicLines.length === 0) return false;

        return lines.every((line, index) => {
            if (!line.trim().startsWith('-')) return true;
            return task.topics?.[`topic_${index}`] || false;
        });
    }

    /**
     * Filters tasks by status
     */
    async filterItems(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

        await this.loadAndRender();
    }

    /**
     * Overrides list rendering method to apply filters
     */
    renderList() {
        let filteredItems = this.items;
        if (this.currentFilter === 'pending') {
            filteredItems = this.items.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredItems = this.items.filter(t => t.completed);
        }

        const priorityOrder = { high: 1, medium: 2, low: 3 };
        filteredItems = filteredItems.sort((a, b) => {
            const priorityA = priorityOrder[a.priority || 'medium'];
            const priorityB = priorityOrder[b.priority || 'medium'];
            return priorityA - priorityB;
        });

        document.getElementById('countAll').textContent = this.items.length;
        document.getElementById('countPending').textContent = this.items.filter(t => !t.completed).length;
        document.getElementById('countCompleted').textContent = this.items.filter(t => t.completed).length;

        const container = document.getElementById('tasksList');
        if (!container) return;

        if (filteredItems.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = filteredItems.map(item => this.renderItem(item)).join('');
    }

    /**
     * Custom empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>Nenhuma tarefa encontrada</p>
                <small>Clique em "Nova Tarefa" para começar</small>
            </div>
        `;
    }

    /**
     * Overrides clearForm for default values
     */
    clearForm() {
        super.clearForm();
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskCategory').value = 'Trabalho';
        document.getElementById('tasksFormTitle').textContent = 'Adicionar Nova Tarefa';
        this.tempTopics = [];
        this.renderTopicsList();
    }

    /**
     * Override showForm to setup topic input listener and hide filters
     */
    showForm() {
        super.showForm();
        
        const filters = document.querySelector('.task-filters');
        if (filters) filters.classList.add('hidden');
        
        setTimeout(() => {
            this.setupTopicInputListener();
        }, 100);
    }

    /**
     * Override cancelForm to show filters again
     */
    cancelForm() {
        super.cancelForm();
        
        const filters = document.querySelector('.task-filters');
        if (filters) filters.classList.remove('hidden');
    }

    /**
     * Override edit to setup topic input listener and hide filters
     */
    async edit(itemId) {
        await super.edit(itemId);
        
        const filters = document.querySelector('.task-filters');
        if (filters) filters.classList.add('hidden');
        
        setTimeout(() => {
            this.setupTopicInputListener();
        }, 100);
    }

    /**
     * Adds a topic to the temporary list
     */
    addTopicToList() {
        const input = document.getElementById('taskTopicInput');
        const topicText = input.value.trim();

        if (!topicText) {
            return;
        }

        if (this.tempTopics.some(t => t.text.toLowerCase() === topicText.toLowerCase())) {
            this.showValidation('Este tópico já foi adicionado');
            return;
        }

        this.tempTopics.push({
            id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: topicText,
            checked: false
        });

        input.value = '';
        this.renderTopicsList();
    }

    /**
     * Removes a topic from the temporary list
     */
    removeTopicFromList(topicId) {
        this.tempTopics = this.tempTopics.filter(t => t.id !== topicId);
        this.renderTopicsList();
    }

    /**
     * Renders the topics list in the form
     */
    renderTopicsList() {
        const container = document.getElementById('topicsList');
        if (!container) return;

        if (this.tempTopics.length === 0) {
            container.innerHTML = '<p class="topics-empty-hint">Nenhum tópico adicionado ainda</p>';
            return;
        }

        container.innerHTML = this.tempTopics.map(topic => `
            <div class="topic-tag ${topic.checked ? 'completed' : ''}">
                ${topic.checked ? '<span class="topic-tag-status">✓</span>' : ''}
                <span class="topic-tag-text">${topic.text}</span>
                <button type="button" class="topic-tag-remove" onclick="personalHandler.modules.tasks.removeTopicFromList('${topic.id}')" title="Remover tópico">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    /**
     * Setup event listener for Enter key on topic input
     */
    setupTopicInputListener() {
        const input = document.getElementById('taskTopicInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTopicToList();
                }
            });
        }
    }

    /**
     * Deletes all completed topics from a task
     */
    async deleteCompletedTopics(taskId) {
        const task = this.items.find(t => t.id === taskId);
        if (!task || !task.topicsData) return;

        const completedCount = task.topicsData.filter(topicData => task.topics?.[topicData.id]).length;
        
        if (completedCount === 0) return;

        const result = await Swal.fire({
            title: 'Confirmar Exclusão',
            text: `Deseja excluir ${completedCount} tópico(s) concluído(s)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280'
        });

        if (!result.isConfirmed) return;

        task.topicsData = task.topicsData.filter(topicData => {
            const isCompleted = task.topics?.[topicData.id] || false;
            if (isCompleted) {
                delete task.topics[topicData.id];
            }
            return !isCompleted;
        });

        await this.personalDataService.update(this.moduleName, taskId, task);
        await this.loadAndRender();

        Swal.fire({
            title: 'Sucesso!',
            text: `${completedCount} tópico(s) excluído(s) com sucesso`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }

    /**
     * Enables inline editing of topic text
     */
    async editTopicInline(taskId, topicId) {
        const task = this.items.find(t => t.id === taskId);
        if (!task || !task.topicsData) return;

        const topicData = task.topicsData.find(t => t.id === topicId);
        if (!topicData) return;

        const result = await Swal.fire({
            title: 'Editar Tópico',
            input: 'text',
            inputValue: topicData.text,
            inputPlaceholder: 'Digite o texto do tópico...',
            showCancelButton: false,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#3b82f6',
            inputAttributes: {
                'aria-label': 'Texto do tópico',
                'maxlength': '500'
            },
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'O tópico não pode estar vazio!';
                }
            }
        });

        if (result.isConfirmed) {
            const newText = result.value.trim();
            
            if (newText === '') {
                task.topicsData = task.topicsData.filter(t => t.id !== topicId);
                if (task.topics && task.topics[topicId] !== undefined) {
                    delete task.topics[topicId];
                }
                await this.personalDataService.update(this.moduleName, taskId, task);
                await this.loadAndRender();
                this.showSuccess('Tópico removido!');
            } else {
                topicData.text = newText;
                await this.personalDataService.update(this.moduleName, taskId, task);
                await this.loadAndRender();
                this.showSuccess('Tópico atualizado!');
            }
        }
    }
}
