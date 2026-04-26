/**
 * @file WorkoutModule.js
 * @description Weight training management by divisions (A-E).
 * 
 * Contents:
 * - Exercise CRUD by section
 * - ABC/ABCD/ABCDE split support
 * - Sets/reps/weight configuration
 * - Progress tracking with checkboxes
 * 
 * Extends: BaseTrainingModule
 * 
 * Dependencies:
 * - TrainingService (Firebase persistence)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class WorkoutModule
 * @extends BaseTrainingModule
 * @description Manages weight training workouts with exercises by section
 */
class WorkoutModule extends BaseTrainingModule {

    /**
     * Initializes the weight training module
     * 
     * @constructor
     * @example
     * const module = new WorkoutModule();
     */
    constructor() {
        super('workout');
        this.currentSection = sessionStorage.getItem('trainingWorkoutSection') || 'A';
    }

    /**
     * Renders the main module HTML structure
     */
    render() {
        const sections = ['A', 'B', 'C', 'D', 'E'];
        const sectionButtons = sections.map(section => `
            <button class="section-btn ${this.currentSection === section ? 'active' : ''}" data-section="${section}" onclick="trainingHandler.modules.workout.selectSection('${section}')">
                Treino ${section}
            </button>
        `).join('');

        return `
            <div class="workout-sections">
                ${sectionButtons}
            </div>

            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <button class="btn-primary" style="flex: 1;" id="addBtnWorkout" 
                        onclick="trainingHandler.modules.workout.showForm()">
                    + Adicionar Exercício
                </button>
                <button class="btn-secondary" style="flex: 1;" id="resetAllBtnWorkout" 
                        onclick="trainingHandler.modules.workout.resetAllSetsInSection()" 
                        title="Resetar todas as séries deste treino">
                    Resetar Todas as Séries
                </button>
            </div>

            ${this.renderForm()}

            <div id="workoutList" class="exercises-list"></div>
        `;
    }

    /**
     * Shows the form and hides other elements
     */
    showForm() {
        const workoutList = document.getElementById('workoutList');
        const sectionBtns = document.querySelector('.workout-sections');
        const addBtn = document.getElementById('addBtnWorkout');
        const resetAllBtn = document.getElementById('resetAllBtnWorkout');

        if (workoutList) workoutList.classList.add('hidden-for-edit');
        if (sectionBtns) sectionBtns.classList.add('hidden-for-edit');
        if (addBtn) addBtn.classList.add('hidden-for-edit');
        if (resetAllBtn) resetAllBtn.classList.add('hidden-for-edit');

        super.showForm();

        const sectionSelect = document.getElementById('exerciseSection');
        if (sectionSelect) {
            sectionSelect.value = this.currentSection;
        }
    }

    /**
     * Cancels form and shows hidden elements
     */
    cancelForm() {
        const workoutList = document.getElementById('workoutList');
        const sectionBtns = document.querySelector('.workout-sections');
        const addBtn = document.getElementById('addBtnWorkout');
        const resetAllBtn = document.getElementById('resetAllBtnWorkout');

        if (workoutList) workoutList.classList.remove('hidden-for-edit');
        if (sectionBtns) sectionBtns.classList.remove('hidden-for-edit');
        if (addBtn) addBtn.classList.remove('hidden-for-edit');
        if (resetAllBtn) resetAllBtn.classList.remove('hidden-for-edit');

        super.cancelForm();
    }

    /**
     * Renders the workout exercise form HTML
     */
    renderForm() {
        return `
            <div id="workoutForm" class="training-form" style="display: none;">
                <h4 id="workoutFormTitle">Novo Exercício</h4>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Nome do Exercício *</label>
                        <input type="text" id="exerciseName" placeholder="Ex: Supino Reto">
                    </div>
                    <div class="form-input-group">
                        <label>Seção *</label>
                        <select id="exerciseSection">
                            <option value="A">Treino A</option>
                            <option value="B">Treino B</option>
                            <option value="C">Treino C</option>
                            <option value="D">Treino D</option>
                            <option value="E">Treino E</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-input-group">
                        <label>Séries *</label>
                        <div class="number-input-wrapper">
                            <button type="button" class="number-input-btn" onclick="trainingHandler.modules.workout.decrementNumber('exerciseSets', 1)">−</button>
                            <input type="number" id="exerciseSets" placeholder="Ex: 4" min="1" value="3" inputmode="numeric" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            <button type="button" class="number-input-btn" onclick="trainingHandler.modules.workout.incrementNumber('exerciseSets')">+</button>
                        </div>
                    </div>
                    <div class="form-input-group">
                        <label>Repetições *</label>
                        <input type="text" id="exerciseReps" placeholder="Ex: 12" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>
                    <div class="form-input-group">
                        <label>Carga (kg)</label>
                        <input type="text" id="exerciseWeight" placeholder="Ex: 50" inputmode="decimal" oninput="this.value = this.value.replace(/[^0-9.,]/g, '')">
                    </div>
                    <div class="form-input-group">
                        <label>Descanso</label>
                        <input type="time" id="exerciseRest">
                    </div>
                </div>
                <div class="form-input-group">
                    <label>Observações</label>
                    <textarea id="exerciseNotes" rows="2" placeholder="Observações sobre o exercício..."></textarea>
                </div>
                <div class="form-input-group mt-md">
                    <label>Link do Vídeo (opcional)</label>
                    <input type="url" id="exerciseVideoLink" placeholder="Cole o link do YouTube ou outro vídeo">
                    <small class="form-hint">⚡ Cole aqui o link do vídeo tutorial do exercício</small>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="trainingHandler.modules.workout.cancelForm()">Cancelar</button>
                    <button class="btn-primary" onclick="trainingHandler.modules.workout.save()">Salvar</button>
                </div>
            </div>
        `;
    }

    /**
     * Renders a single exercise card
     */
    renderItem(exercise) {
        const completedCount = exercise.completedSets?.length || 0;
        const totalSets = exercise.sets;
        const isComplete = completedCount === totalSets;
        const completionPercentage = totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0;
        const volumeLabel = `${totalSets}x${exercise.reps}`;

        const detailCards = [
            {
                label: 'Volume Total',
                value: volumeLabel,
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>'
            },
            exercise.weight ? {
                label: 'Carga',
                value: `${exercise.weight} kg`,
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="6" rx="1"/><path d="M6 7V3h3v4"/><path d="M15 7V3h3v4"/></svg>'
            } : null,
            exercise.rest ? {
                label: 'Descanso',
                value: exercise.rest,
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
            } : null
        ].filter(Boolean);

        const detailCardsHtml = detailCards.length ? `
            <div class="exercise-details-grid">
                ${detailCards.map(card => `
                    <div class="exercise-detail-card">
                        <div class="detail-icon">${card.icon}</div>
                        <div class="detail-info">
                            <span class="detail-label">${card.label}</span>
                            <span class="detail-value">${card.value}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        let setsHTML = '';
        for (let i = 1; i <= totalSets; i++) {
            const isChecked = exercise.completedSets?.includes(i);
            setsHTML += `
                <label class="set-checkbox ${isChecked ? 'checked' : ''}">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} 
                           onchange="trainingHandler.modules.workout.toggleSet('${exercise.id}', ${i})">
                    <span class="set-index">${i}</span>
                    <span class="set-indicator"></span>
                </label>
            `;
        }

        return `
            <div class="exercise-card base-card accent-card ${isComplete ? 'completed' : ''}">
                <div class="exercise-header">
                    <div class="exercise-title-group">
                        <h4>${exercise.name}</h4>
                        <div class="exercise-meta">
                            <span class="section-chip">Treino ${exercise.section}</span>
                            <span class="completion-chip ${isComplete ? 'complete' : ''}">${completionPercentage}%</span>
                            <span class="volume-chip">${volumeLabel}</span>
                        </div>
                    </div>
                    <div class="exercise-actions">
                        <button class="btn-reset" onclick="trainingHandler.modules.workout.resetSets('${exercise.id}')" 
                                title="Resetar séries">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                        <button class="btn-edit" onclick="trainingHandler.modules.workout.edit(null, '${exercise.id}')" 
                                title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-delete" onclick="trainingHandler.modules.workout.delete(null, '${exercise.id}')" 
                                title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="exercise-body">
                    ${detailCardsHtml}
                    <div class="exercise-notes-card ${exercise.notes ? '' : 'empty-notes'}" 
                         onclick="trainingHandler.modules.workout.editNotesInline('${exercise.id}')" 
                         style="cursor: pointer;" 
                         title="Clique para ${exercise.notes ? 'editar' : 'adicionar'} observações">
                        <span class="notes-icon">📝</span>
                        <p>${exercise.notes || 'Clique aqui para adicionar observações...'}</p>
                    </div>
                    ${exercise.videoLink ? `
                        <div class="exercise-video-card">
                            <a href="${exercise.videoLink}" target="_blank" rel="noopener noreferrer" class="video-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                <span>Assistir vídeo do exercício</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </a>
                        </div>
                    ` : ''}
                </div>
                <div class="sets-tracker">
                    <div class="sets-progress">
                        <span>Progresso: ${completedCount}/${totalSets} séries</span>
                        <span class="progress-percent">${completionPercentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionPercentage}%"></div>
                    </div>
                    <div class="sets-checkboxes">
                        ${setsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Validates workout exercise form data
     */
    validateForm(data) {
        if (!data.name || data.name.trim() === '') {
            this.showValidation('Por favor, informe o nome do exercício');
            return false;
        }
        if (!data.reps || data.reps.trim() === '') {
            this.showValidation('Por favor, informe as repetições');
            return false;
        }
        return true;
    }

    /**
     * Extracts and returns workout form data
     */
    getFormData() {
        return {
            name: document.getElementById('exerciseName').value.trim(),
            section: document.getElementById('exerciseSection').value,
            sets: parseInt(document.getElementById('exerciseSets').value, 10),
            reps: document.getElementById('exerciseReps').value.trim(),
            weight: document.getElementById('exerciseWeight').value.trim(),
            rest: document.getElementById('exerciseRest').value.trim(),
            notes: document.getElementById('exerciseNotes').value.trim(),
            videoLink: document.getElementById('exerciseVideoLink').value.trim(),
            completedSets: this.editingId ? (this.items.find(e => e.id === this.editingId)?.completedSets || []) : []
        };
    }

    /**
     * Fills form with existing exercise data
     */
    fillForm(exercise) {
        document.getElementById('workoutFormTitle').textContent = 'Editar Exercício';
        document.getElementById('exerciseName').value = exercise.name;
        document.getElementById('exerciseSection').value = exercise.section;
        document.getElementById('exerciseSets').value = exercise.sets;
        document.getElementById('exerciseReps').value = exercise.reps;
        document.getElementById('exerciseWeight').value = exercise.weight || '';
        document.getElementById('exerciseRest').value = exercise.rest || '';
        document.getElementById('exerciseNotes').value = exercise.notes || '';
        document.getElementById('exerciseVideoLink').value = exercise.videoLink || '';
    }

    /**
     * Initializes the workout module
     */
    async initialize(userId) {
        if (!userId) {
            userId = this.getUserId();
        }
        await this.loadAndRender(userId);
    }

    /**
     * Selects a training section (A-E) and renders filtered exercises
     */
    selectSection(section) {
        this.currentSection = section;
        sessionStorage.setItem('trainingWorkoutSection', section);

        document.querySelectorAll('.section-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        this.renderList();
    }

    /**
     * Renders exercises list for current section
     */
    renderList() {
        const container = document.getElementById('workoutList');
        if (!container) return;

        const sectionExercises = this.items
            .filter(e => e.section === this.currentSection)
            .sort((a, b) => {
                let dateA, dateB;

                if (a.createdAt && typeof a.createdAt.toDate === 'function') {
                    dateA = a.createdAt.toDate();
                } else if (a.createdAt) {
                    dateA = new Date(a.createdAt);
                } else {
                    dateA = new Date(0);
                }

                if (b.createdAt && typeof b.createdAt.toDate === 'function') {
                    dateB = b.createdAt.toDate();
                } else if (b.createdAt) {
                    dateB = new Date(b.createdAt);
                } else {
                    dateB = new Date(0);
                }

                return dateA - dateB;
            });

        if (sectionExercises.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>💪 Nenhum exercício no Treino ${this.currentSection}</p>
                    <p class="empty-state-hint">Clique em "Adicionar Exercício" para começar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sectionExercises.map(ex => this.renderItem(ex)).join('');
    }

    toggleSet(exerciseId, setNumber) {
        const userId = this.getUserId();
        const exercise = this.items.find(e => e.id === exerciseId);

        if (exercise) {
            if (!exercise.completedSets) exercise.completedSets = [];

            const index = exercise.completedSets.indexOf(setNumber);
            if (index > -1) {
                exercise.completedSets.splice(index, 1);
            } else {
                exercise.completedSets.push(setNumber);
            }

            this.trainingService.update(userId, this.moduleName, exerciseId, exercise)
                .then(() => {
                    this.renderList();
                })
                .catch(error => {
                    Logger.error('Error updating set:', error);
                    this.showError('Erro ao atualizar série');
                });
        }
    }

    /**
     * Resets all completed sets for an exercise
     */
    resetSets(exerciseId) {
        const userId = this.getUserId();
        const exercise = this.items.find(e => e.id === exerciseId);

        if (exercise) {
            exercise.completedSets = [];

            this.trainingService.update(userId, this.moduleName, exerciseId, exercise)
                .then(() => {
                    this.renderList();
                    this.showSuccess('Séries resetadas!');
                })
                .catch(error => {
                    Logger.error('Error resetting sets:', error);
                    this.showError('Erro ao resetar séries');
                });
        }
    }

    /**
     * Resets all completed sets for all exercises in current section
     */
    async resetAllSetsInSection() {
        const result = await Swal.fire({
            title: 'Resetar todas as séries?',
            text: `Isso vai resetar todas as séries do Treino ${this.currentSection}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, resetar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3b82f6'
        });

        if (result.isConfirmed) {
            const userId = this.getUserId();
            const sectionExercises = this.items.filter(e => e.section === this.currentSection);

            try {
                const updatePromises = sectionExercises.map(exercise => {
                    exercise.completedSets = [];
                    return this.trainingService.update(userId, this.moduleName, exercise.id, exercise);
                });

                await Promise.all(updatePromises);
                this.renderList();
                this.showSuccess(`Todas as séries do Treino ${this.currentSection} foram resetadas!`);
            } catch (error) {
                Logger.error('Error resetting all sets:', error);
                this.showError('Erro ao resetar séries');
            }
        }
    }

    /**
     * Enables inline editing of exercise notes
     */
    editNotesInline(exerciseId) {
        const userId = this.getUserId();
        const exercise = this.items.find(e => e.id === exerciseId);

        if (!exercise) return;

        Swal.fire({
            title: 'Editar Observações',
            input: 'textarea',
            inputValue: exercise.notes || '',
            inputPlaceholder: 'Digite suas observações aqui...',
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3b82f6',
            inputAttributes: {
                'aria-label': 'Observações do exercício'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newNotes = result.value?.trim() || '';
                exercise.notes = newNotes;

                this.trainingService.update(userId, this.moduleName, exerciseId, exercise)
                    .then(() => {
                        this.renderList();
                        if (newNotes === '') {
                            this.showSuccess('Observações removidas!');
                        } else {
                            this.showSuccess('Observações atualizadas!');
                        }
                    })
                    .catch(error => {
                        Logger.error('Error updating notes:', error);
                        this.showError('Erro ao atualizar observações');
                    });
            }
        });
    }

    /**
     * Clears and resets the workout form
     */
    clearForm() {
        super.clearForm();
        document.getElementById('exerciseSets').value = '3';
        document.getElementById('exerciseSection').value = this.currentSection;
        document.getElementById('exerciseVideoLink').value = '';
        document.getElementById('workoutFormTitle').textContent = 'Novo Exercício';
    }

    incrementNumber(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            const currentValue = parseInt(input.value) || 0;
            input.value = currentValue + 1;
            input.dispatchEvent(new Event('change'));
        }
    }

    /**
     * Decrements a number input value
     */
    decrementNumber(inputId, min = 0) {
        const input = document.getElementById(inputId);
        if (input) {
            const currentValue = parseInt(input.value) || 0;
            const minValue = parseInt(input.min) || min;
            if (currentValue > minValue) {
                input.value = currentValue - 1;
                input.dispatchEvent(new Event('change'));
            }
        }
    }
}
