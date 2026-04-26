/**
 * @file FormStateManager.js
 * @description Form state persistence manager for tab switching.
 * 
 * Contents:
 * - saveFormState(): Extract and cache form data
 * - restoreFormState(): Repopulate form fields
 * - Module state management (Personal, Training modes)
 * - Async restoration with timing coordination
 * 
 * Design Principles:
 * - No direct DOM manipulation (elements passed as params)
 * - No window.* dependencies (handlers via callbacks)
 * - Single responsibility per method
 * 
 * Dependencies:
 * - Handler accessors (personal, training) via setHandlerAccessors()
 * 
 * @author Leandro Fialho Fernandes
 */

/** 
 * Timing constants for module switching and form restoration 
 */
const TIMING = {
    MODULE_SWITCH_DELAY: 150,
    FORM_RESTORE_DELAY: 300
};

/**
 * Form selector patterns for different module types
 */
const FORM_SELECTORS = '.personal-form, .training-form, .finance-form, form[id]';

/**
 * @class FormStateManager
 * @description Handles form state persistence and restoration
 */
class FormStateManager {

    /**
     * Creates a new FormStateManager instance
     * @constructor
     */
    constructor() {
        this.handlerAccessors = {
            personal: null,
            training: null
        };
    }

    /**
     * Registers handler accessors to avoid window.* coupling
     * @param {Object} accessors - Object with handler accessor functions
     * @param {Function} [accessors.personal] - Returns personalHandler or null
     * @param {Function} [accessors.training] - Returns trainingHandler or null
     */
    setHandlerAccessors(accessors) {
        if (accessors.personal) this.handlerAccessors.personal = accessors.personal;
        if (accessors.training) this.handlerAccessors.training = accessors.training;
    }

    /**
     * Saves complete form state from a content element
     * @param {HTMLElement} contentElement - Tab content container
     * @param {Object} cachedState - State object to populate
     */
    saveFormState(contentElement, cachedState) {
        if (!contentElement || !cachedState) return;

        this.initializeFormDataCache(cachedState);
        this.saveActiveModuleState(contentElement, cachedState);
        this.saveTrainingState(contentElement, cachedState);
        this.saveAllFormsData(contentElement, cachedState);
    }

    /**
     * Ensures formData object exists in cached state
     * @param {Object} cachedState - State object
     * @private
     */
    initializeFormDataCache(cachedState) {
        if (!cachedState.formData) {
            cachedState.formData = {};
        }
    }

    /**
     * Saves which Personal module is currently active
     * @param {HTMLElement} contentElement - Content container
     * @param {Object} cachedState - State object
     * @private
     */
    saveActiveModuleState(contentElement, cachedState) {
        const activeModuleCard = contentElement.querySelector('.module-card.active');
        if (activeModuleCard) {
            cachedState.activeModule = activeModuleCard.dataset.module;
        }
    }

    /**
     * Saves Training module state (mode, section, weekday)
     * @param {HTMLElement} contentElement - Content container
     * @param {Object} cachedState - State object
     * @private
     */
    saveTrainingState(contentElement, cachedState) {
        const activeModeBtn = contentElement.querySelector('.mode-btn.active');
        if (activeModeBtn) {
            cachedState.trainingModule = activeModeBtn.dataset.mode;
        }

        const activeSectionBtn = contentElement.querySelector('.section-btn.active');
        if (activeSectionBtn) {
            cachedState.activeSection = activeSectionBtn.dataset.section;
        }

        const activeWeekdayBtn = contentElement.querySelector('.weekday-btn.active');
        if (activeWeekdayBtn) {
            cachedState.activeWeekday = activeWeekdayBtn.dataset.day;
        }
    }

    /**
     * Iterates all forms and saves their data
     * @param {HTMLElement} contentElement - Content container
     * @param {Object} cachedState - State object
     * @private
     */
    saveAllFormsData(contentElement, cachedState) {
        const allForms = contentElement.querySelectorAll(FORM_SELECTORS);

        allForms.forEach(form => {
            const formId = this.getFormId(form);
            if (!formId) return;

            const formData = this.extractFormData(form);
            const hasValue = this.formHasValue(formData);

            if (this.isFormVisible(form)) {
                formData._formVisible = true;
            }

            this.addEditingState(formData);

            if (hasValue || formData._formVisible || formData._editingId) {
                cachedState.formData[formId] = formData;
            }
        });
    }

    /**
     * Gets form ID from element or parent
     * @param {HTMLElement} form - Form element
     * @returns {string|null} Form ID
     * @private
     */
    getFormId(form) {
        return form.id || form.closest('[id]')?.id || null;
    }

    /**
     * Extracts all field values from a form
     * @param {HTMLElement} form - Form element
     * @returns {Object} Field values keyed by field ID/name
     * @private
     */
    extractFormData(form) {
        const formData = {};
        const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="button"]), textarea, select');

        inputs.forEach(input => {
            const fieldKey = input.id || input.name;
            if (!fieldKey) return;

            formData[fieldKey] = this.getInputValue(input);
        });

        return formData;
    }

    /**
     * Gets value from an input element based on its type
     * @param {HTMLElement} input - Input element
     * @returns {*} Input value
     * @private
     */
    getInputValue(input) {
        if (input.type === 'checkbox') {
            return input.checked;
        }
        if (input.type === 'radio') {
            return input.checked ? input.value : undefined;
        }
        return input.value || '';
    }

    /**
     * Checks if form has any meaningful values
     * @param {Object} formData - Extracted form data
     * @returns {boolean} True if form has values
     * @private
     */
    formHasValue(formData) {
        return Object.entries(formData).some(([key, value]) => {
            if (key.startsWith('_')) return false;
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') return value.trim() !== '';
            return value !== undefined && value !== null;
        });
    }

    /**
     * Checks if a form is currently visible
     * @param {HTMLElement} form - Form element
     * @returns {boolean} True if visible
     * @private
     */
    isFormVisible(form) {
        const computedStyle = window.getComputedStyle(form);
        return computedStyle.display !== 'none' && form.offsetParent !== null;
    }

    /**
     * Adds editing ID from active handlers
     * @param {Object} formData - Form data object to augment
     * @private
     */
    addEditingState(formData) {
        const personalHandler = this.handlerAccessors.personal?.();
        if (personalHandler) {
            const activeModule = personalHandler.modules?.[personalHandler.currentModule];
            if (activeModule?.editingId) {
                formData._editingId = activeModule.editingId;
            }
        }

        const trainingHandler = this.handlerAccessors.training?.();
        if (trainingHandler) {
            const activeModule = trainingHandler.modules?.[trainingHandler.currentModule];
            if (activeModule?.editingId) {
                formData._editingId = activeModule.editingId;
            }
        }
    }

    /**
     * Restores form state to a content element
     * Handles module switching with appropriate timing
     * @param {HTMLElement} contentElement - Tab content container
     * @param {Object} cachedState - Previously saved state
     */
    restoreFormState(contentElement, cachedState) {
        if (!contentElement || !cachedState) return;

        if (this.tryRestorePersonalModule(contentElement, cachedState)) return;
        if (this.tryRestoreTrainingModule(contentElement, cachedState)) return;

        this.restoreAllForms(contentElement, cachedState.formData || {});
    }

    /**
     * Attempts to restore Personal module state
     * @param {HTMLElement} contentElement - Content container
     * @param {Object} cachedState - Saved state
     * @returns {boolean} True if restoration was initiated
     * @private
     */
    tryRestorePersonalModule(contentElement, cachedState) {
        if (!cachedState.activeModule) return false;

        const moduleCard = contentElement.querySelector(`.module-card[data-module="${cachedState.activeModule}"]`);
        const personalHandler = this.handlerAccessors.personal?.();

        if (!moduleCard || !personalHandler) return false;

        this.scheduleModuleRestore(() => {
            personalHandler.switchModule(cachedState.activeModule);
        }, () => {
            this.restoreAllForms(contentElement, cachedState.formData || {});
        });

        return true;
    }

    /**
     * Attempts to restore Training module state
     * @param {HTMLElement} contentElement - Content container
     * @param {Object} cachedState - Saved state
     * @returns {boolean} True if restoration was initiated
     * @private
     */
    tryRestoreTrainingModule(contentElement, cachedState) {
        if (!cachedState.trainingModule) return false;

        const modeBtn = contentElement.querySelector(`.mode-btn[data-mode="${cachedState.trainingModule}"]`);
        const trainingHandler = this.handlerAccessors.training?.();

        if (!modeBtn || !trainingHandler) return false;

        this.scheduleModuleRestore(() => {
            trainingHandler.switchModule(cachedState.trainingModule);
        }, () => {
            this.restoreAllForms(contentElement, cachedState.formData || {});
        });

        return true;
    }

    /**
     * Schedules module switch followed by form restoration
     * Encapsulates timing logic in one place
     * @param {Function} switchFn - Function to switch module/mode
     * @param {Function} restoreFn - Function to restore forms
     * @private
     */
    scheduleModuleRestore(switchFn, restoreFn) {
        setTimeout(() => {
            switchFn();
            setTimeout(restoreFn, TIMING.FORM_RESTORE_DELAY);
        }, TIMING.MODULE_SWITCH_DELAY);
    }

    /**
     * Restores all forms from cached data
     * @param {HTMLElement} contentElement - Content container
     * @param {Object} formDataCache - Cached form data
     */
    restoreAllForms(contentElement, formDataCache) {
        if (!formDataCache || Object.keys(formDataCache).length === 0) return;

        Object.entries(formDataCache).forEach(([formId, formData]) => {
            this.restoreSingleForm(contentElement, formId, formData);
        });
    }

    /**
     * Restores a single form's data and state
     * @param {HTMLElement} contentElement - Content container
     * @param {string} formId - Form element ID
     * @param {Object} formData - Form field values
     */
    restoreSingleForm(contentElement, formId, formData) {
        const form = this.findForm(contentElement, formId);
        if (!form) return;

        this.restoreFieldValues(form, formData);
        this.restoreFormVisibility(contentElement, form, formId, formData);
        this.restoreEditingState(formData);
    }

    /**
     * Finds a form by ID within content element
     * @param {HTMLElement} contentElement - Content container
     * @param {string} formId - Form ID
     * @returns {HTMLElement|null} Form element
     * @private
     */
    findForm(contentElement, formId) {
        return contentElement.querySelector(`#${formId}`) ||
            contentElement.querySelector(`[id="${formId}"]`);
    }

    /**
     * Restores all field values in a form
     * @param {HTMLElement} form - Form element
     * @param {Object} formData - Field values
     * @private
     */
    restoreFieldValues(form, formData) {
        Object.entries(formData).forEach(([fieldId, value]) => {
            if (fieldId.startsWith('_')) return;

            const input = form.querySelector(`#${fieldId}`) ||
                form.querySelector(`[name="${fieldId}"]`);

            if (input) {
                this.setInputValue(input, value);
                this.dispatchInputEvents(input);
            }
        });
    }

    /**
     * Sets value on an input based on its type
     * @param {HTMLElement} input - Input element
     * @param {*} value - Value to set
     * @private
     */
    setInputValue(input, value) {
        if (input.type === 'checkbox') {
            input.checked = value;
        } else if (input.type === 'radio') {
            input.checked = (input.value === value);
        } else {
            input.value = value || '';
        }
    }

    /**
     * Dispatches input/change events for validation triggers
     * @param {HTMLElement} input - Input element
     * @private
     */
    dispatchInputEvents(input) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Restores form visibility and hides add button if needed
     * @param {HTMLElement} contentElement - Content container
     * @param {HTMLElement} form - Form element
     * @param {string} formId - Form ID
     * @param {Object} formData - Form data with visibility flag
     * @private
     */
    restoreFormVisibility(contentElement, form, formId, formData) {
        if (!formData._formVisible || form.style.display !== 'none') return;

        form.style.display = 'block';

        const addBtnId = this.getAddButtonId(formId);
        if (addBtnId) {
            const addBtn = contentElement.querySelector(`#${addBtnId}`);
            if (addBtn) {
                addBtn.style.display = 'none';
            }
        }
    }

    /**
     * Derives add button ID from form ID
     * @param {string} formId - Form ID (e.g., "tasksForm")
     * @returns {string|null} Add button ID
     * @private
     */
    getAddButtonId(formId) {
        const moduleMatch = formId.match(/^(\w+)Form$/);
        if (!moduleMatch) return null;

        const moduleName = moduleMatch[1];
        const capitalizedModule = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

        const specialCases = {
            'corrida': 'addBtnCorrida',
            'workout': 'addBtnWorkout'
        };

        return specialCases[moduleName.toLowerCase()] || `addBtn${capitalizedModule}`;
    }

    /**
     * Restores editing state to active handlers
     * @param {Object} formData - Form data with editing ID
     * @private
     */
    restoreEditingState(formData) {
        if (!formData._editingId) return;

        const personalHandler = this.handlerAccessors.personal?.();
        if (personalHandler) {
            const activeModule = personalHandler.modules?.[personalHandler.currentModule];
            if (activeModule) {
                activeModule.editingId = formData._editingId;
            }
        }

        const trainingHandler = this.handlerAccessors.training?.();
        if (trainingHandler) {
            const activeModule = trainingHandler.modules?.[trainingHandler.currentModule];
            if (activeModule) {
                activeModule.editingId = formData._editingId;
            }
        }
    }
}
