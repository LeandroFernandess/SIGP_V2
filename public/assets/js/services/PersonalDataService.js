/**
 * @file PersonalDataService.js
 * @description Service layer for personal data modules with Firebase.
 *
 * Manages:
 * - Notes (rich-text personal notes)
 * - Tasks (to-do items with priority and completion)
 * - Links (bookmarked URLs with categories)
 * - Passwords (encrypted credentials storage)
 * - Shopping (shopping list with categories)
 * - Wishlist (desired items with priority)
 * - Reminders (recurring reminders with due dates)
 *
 * Features:
 * - Unified interface (getAll, add, update, delete)
 * - Local caching per module
 * - Automatic cache invalidation
 *
 * Dependencies: FirebaseDataService, FormUtils
 * Used by: PersonalPageHandler and all Personal sub-modules
 *
 * @author Leandro Fialho Fernandes
 */

import { FirebaseDataService } from '../core/firebaseDataService.js';

/**
 * @class PersonalDataService
 * @description Service for managing personal data modules with Firebase
 */
class PersonalDataService {

    /**
     * @constructor
     * @description Initializes the service with collections and caching system
     */
    constructor() {
        this.collections = {
            tasks: 'tasks',
            links: 'links',
            passwords: 'passwords',
            shopping: 'shopping',
            wishlist: 'wishlist',
            notes: 'notes',
            reminders: 'reminders'
        };

        this.cache = {
            tasks: [],
            links: [],
            passwords: [],
            shopping: [],
            wishlist: [],
            notes: [],
            reminders: []
        };

        this.loaded = {
            tasks: false,
            links: false,
            passwords: false,
            shopping: false,
            wishlist: false,
            notes: false,
            reminders: false
        };
    }

    /**
     * @description Gets current user from session (centralized helper)
     * @returns {Object|null} Current user data
     * @private
     */
    _getCurrentUser() {
        return typeof FormUtils !== 'undefined' && FormUtils.getCurrentUser
            ? FormUtils.getCurrentUser()
            : null;
    }

    /**
     * @description Gets all items from a specific module
     * @param {string} moduleName - Module name ('notes', 'tasks', 'links', 'passwords', 'shopping', 'wishlist', 'reminders')
     * @returns {Promise<Array<Object>>} Array of module items
     * @throws {Error} If the module is unknown
     */
    async getAll(moduleName) {
        const currentUser = this._getCurrentUser();
        const userId = currentUser.id;

        switch (moduleName) {
            case 'tasks':
                return await this.getTasks(userId);
            case 'links':
                return await this.getLinks(userId);
            case 'passwords':
                return await this.getPasswords(userId);
            case 'shopping':
                return await this.getShoppingItems(userId);
            case 'wishlist':
                return await this.getWishlistItems(userId);
            case 'notes':
                return await this.getNotes(userId);
            case 'reminders':
                return await this.getReminders(userId);
            default:
                Logger.error(`Módulo desconhecido: ${moduleName}`);
                return [];
        }
    }

    /**
     * @description Adds a new item to a specific module
     * @param {string} moduleName - Module name ('notes', 'tasks', 'links', 'passwords', 'shopping', 'wishlist', 'reminders')
     * @param {Object} itemData - Item data to be created
     * @returns {Promise<string>} Document ID created in Firestore
     * @throws {Error} If the module is unknown
     * 
     * @example
     * const taskId = await service.add('tasks', {
     *   title: 'Study React',
     *   priority: 'high',
     *   completed: false
     * });
     */
    async add(moduleName, itemData) {
        const currentUser = this._getCurrentUser();
        const userId = currentUser.id;

        switch (moduleName) {
            case 'tasks':
                return await this.saveTask(userId, itemData);
            case 'links':
                return await this.saveLink(userId, itemData);
            case 'passwords':
                return await this.savePassword(userId, itemData);
            case 'shopping':
                return await this.saveShoppingItem(userId, itemData);
            case 'wishlist':
                return await this.saveWishlistItem(userId, itemData);
            case 'notes':
                return await this.saveNote(userId, itemData);
            case 'reminders':
                return await this.saveReminder(userId, itemData);
            default:
                throw new Error(`Módulo desconhecido: ${moduleName}`);
        }
    }

    /**
     * @description Updates an existing item in a module
     * @param {string} moduleName - Module name ('notes', 'tasks', 'links', 'passwords', 'shopping', 'wishlist', 'reminders')
     * @param {string} itemId - Document ID in Firestore
     * @param {Object} itemData - Updated data (partial or complete)
     * @returns {Promise<void>}
     * @throws {Error} If the module is unknown
     * 
     * @example
     * await service.update('tasks', taskId, { completed: true });
     */
    async update(moduleName, itemId, itemData) {
        const currentUser = this._getCurrentUser();
        const userId = currentUser.id;

        switch (moduleName) {
            case 'tasks':
                return await this.saveTask(userId, { ...itemData, id: itemId });
            case 'links':
                return await this.saveLink(userId, { ...itemData, id: itemId });
            case 'passwords':
                return await this.savePassword(userId, { ...itemData, id: itemId });
            case 'shopping':
                return await this.saveShoppingItem(userId, { ...itemData, id: itemId });
            case 'wishlist':
                return await this.saveWishlistItem(userId, { ...itemData, id: itemId });
            case 'notes':
                return await this.saveNote(userId, { ...itemData, id: itemId });
            case 'reminders':
                return await this.saveReminder(userId, { ...itemData, id: itemId });
            default:
                throw new Error(`Módulo desconhecido: ${moduleName}`);
        }
    }

    /**
     * @description Deletes an item from a specific module
     * @param {string} moduleName - Module name ('notes', 'tasks', 'links', 'passwords', 'shopping', 'wishlist', 'reminders')
     * @param {string} itemId - Document ID in Firestore to be deleted
     * @returns {Promise<void>}
     * @throws {Error} If the module is unknown
     * 
     * @example
     * await service.delete('tasks', taskId);
     */
    async delete(moduleName, itemId) {
        const currentUser = this._getCurrentUser();
        const userId = currentUser.id;

        switch (moduleName) {
            case 'tasks':
                return await this.deleteTask(userId, itemId);
            case 'links':
                return await this.deleteLink(userId, itemId);
            case 'passwords':
                return await this.deletePassword(userId, itemId);
            case 'shopping':
                return await this.deleteShoppingItem(userId, itemId);
            case 'wishlist':
                return await this.deleteWishlistItem(userId, itemId);
            case 'notes':
                return await this.deleteNote(userId, itemId);
            case 'reminders':
                return await this.deleteReminder(userId, itemId);
            default:
                throw new Error(`Módulo desconhecido: ${moduleName}`);
        }
    }

    /**
     * @description Saves or updates a task in Firestore
     * @param {string} userId - Authenticated user ID
     * @param {Object} taskData - Task data to be saved
     * @param {string} [taskData.id] - Task ID (auto-generated if not provided)
     * @param {string} taskData.title - Task title
     * @param {string} taskData.priority - Priority (high, medium, low)
     * @param {string} [taskData.dueDate] - Due date (ISO 8601)
     * @param {boolean} [taskData.completed=false] - Completion status
     * @param {Array<Object>} [taskData.topics] - Topics with checkboxes
     * @param {string} [taskData.createdAt] - Creation date (auto-generated)
     * @returns {Promise<string>} Created/updated task ID
     * @throws {Error} If there's an error in Firestore operation
     * 
     * @example
     * const taskId = await service.saveTask(userId, {
     *   title: 'Study React',
     *   priority: 'high',
     *   topics: [{ text: 'Hooks', checked: false }]
     * });
     */
    async saveTask(userId, taskData) {
        try {
            const taskId = taskData.id || Date.now().toString();
            const taskToSave = {
                ...taskData,
                id: taskId,
                userId,
                createdAt: taskData.createdAt || new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.tasks,
                taskToSave,
                taskId
            );

            const index = this.cache.tasks.findIndex(t => t.id === taskId);
            if (index >= 0) {
                this.cache.tasks[index] = taskToSave;
            } else {
                this.cache.tasks.push(taskToSave);
            }

            return taskId;
        } catch (error) {
            Logger.error('Erro ao salvar tarefa:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user tasks with caching system
     * @param {string} userId - Authenticated user ID
     * @returns {Promise<Array<Object>>} Array of sorted tasks. Each task contains:
     *   - id: string - Unique task ID
     *   - title: string - Task title
     *   - priority: string - Priority (high, medium, low)
     *   - dueDate: string - Due date
     *   - completed: boolean - Completion status
     *   - topics: Array - Task topics
     *   - createdAt: string - Creation date
     * 
     * @example
     * const tasks = await service.getTasks(userId);
     * console.log(tasks); // [{ id: '123', title: 'Task 1', ... }]
     */
    async getTasks(userId) {
        try {
            if (this.loaded.tasks) {
                return this.cache.tasks;
            }

            const tasks = await FirebaseDataService.getCollectionDocuments(
                this.collections.tasks
            );

            this.cache.tasks = tasks || [];
            this.loaded.tasks = true;

            return this.cache.tasks;
        } catch (error) {
            Logger.error('Erro ao buscar tarefas:', error);
            this.loaded.tasks = false;
            return [];
        }
    }

    /**
     * @description Removes a task from Firestore and updates cache
     * @param {string} userId - Authenticated user ID
     * @param {string} taskId - Task ID to be deleted
     * @returns {Promise<void>}
     * @throws {Error} If there's an error in delete operation
     * 
     * @example
     * await service.deleteTask(userId, '1234567890');
     */
    async deleteTask(userId, taskId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.tasks, taskId);
            this.cache.tasks = this.cache.tasks.filter(t => String(t.id) !== String(taskId));
        } catch (error) {
            Logger.error('Erro ao deletar tarefa:', error);
            throw error;
        }
    }

    /**
     * @description Saves or updates a favorite link in Firestore
     * @param {string} userId - Authenticated user ID
     * @param {Object} linkData - Link data to be saved
     * @param {string} [linkData.id] - Link ID (auto-generated if not provided)
     * @param {string} linkData.title - Link title
     * @param {string} linkData.url - Complete link URL
     * @param {string} [linkData.description] - Link description
     * @param {string} [linkData.category] - Link category
     * @param {string} [linkData.createdAt] - Creation date (auto-generated)
     * @returns {Promise<string>} Created/updated link ID
     * @throws {Error} If there's an error in Firestore operation
     * 
     * @example
     * const linkId = await service.saveLink(userId, {
     *   title: 'GitHub',
     *   url: 'https://github.com',
     *   category: 'dev'
     * });
     */
    async saveLink(userId, linkData) {
        try {
            const linkId = linkData.id || Date.now().toString();
            const linkToSave = {
                ...linkData,
                id: linkId,
                userId,
                createdAt: linkData.createdAt || new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.links,
                linkToSave,
                linkId
            );

            const index = this.cache.links.findIndex(l => l.id === linkId);
            if (index >= 0) {
                this.cache.links[index] = linkToSave;
            } else {
                this.cache.links.push(linkToSave);
            }

            return linkId;
        } catch (error) {
            Logger.error('Erro ao salvar link:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user favorite links with caching system
     * @param {string} userId - Authenticated user ID
     * @returns {Promise<Array<Object>>} Array of links. Each link contains:
     *   - id: string - Unique link ID
     *   - title: string - Link title
     *   - url: string - Complete URL
     *   - description: string - Description
     *   - category: string - Category
     *   - createdAt: string - Creation date
     * 
     * @example
     * const links = await service.getLinks(userId);
     */
    async getLinks(userId) {
        try {
            if (this.loaded.links) {
                return this.cache.links;
            }

            const links = await FirebaseDataService.getCollectionDocuments(
                this.collections.links
            );

            this.cache.links = links || [];
            this.loaded.links = true;

            return this.cache.links;
        } catch (error) {
            Logger.error('Erro ao buscar links:', error);
            this.loaded.links = false;
            return [];
        }
    }

    /**
     * @description Removes a link from Firestore and updates cache
     * @param {string} userId - Authenticated user ID
     * @param {string} linkId - Link ID to be deleted
     * @returns {Promise<void>}
     * @throws {Error} If there's an error in delete operation
     * 
     * @example
     * await service.deleteLink(userId, '1234567890');
     */
    async deleteLink(userId, linkId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.links, linkId);
            this.cache.links = this.cache.links.filter(l => String(l.id) !== String(linkId));
        } catch (error) {
            Logger.error('Erro ao deletar link:', error);
            throw error;
        }
    }

    /**
     * @description Saves or updates a password in Firestore
     * @param {string} userId - Authenticated user ID
     * @param {Object} passwordData - Password data to be saved
     * @param {string} [passwordData.id] - Password ID (auto-generated if not provided)
     * @param {string} passwordData.service - Service/website name
     * @param {string} passwordData.username - Username or email
     * @param {string} passwordData.password - Password (should be encrypted before saving)
     * @param {string} [passwordData.category] - Password category
     * @param {string} [passwordData.notes] - Additional notes
     * @param {string} [passwordData.createdAt] - Creation date (auto-generated)
     * @returns {Promise<string>} Created/updated password ID
     * @throws {Error} If there's an error in Firestore operation
     * 
     * @example
     * const pwdId = await service.savePassword(userId, {
     *   service: 'Gmail',
     *   username: 'user@gmail.com',
     *   password: 'encrypted_password',
     *   category: 'email'
     * });
     */
    async savePassword(userId, passwordData) {
        try {
            const passwordId = passwordData.id || Date.now().toString();
            const passwordToSave = {
                ...passwordData,
                id: passwordId,
                userId,
                createdAt: passwordData.createdAt || new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.passwords,
                passwordToSave,
                passwordId
            );

            const index = this.cache.passwords.findIndex(p => p.id === passwordId);
            if (index >= 0) {
                this.cache.passwords[index] = passwordToSave;
            } else {
                this.cache.passwords.push(passwordToSave);
            }

            return passwordId;
        } catch (error) {
            Logger.error('Erro ao salvar senha:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user passwords with caching system
     * @param {string} userId - Authenticated user ID
     * @returns {Promise<Array<Object>>} Array of passwords. Each password contains:
     *   - id: string - Unique password ID
     *   - service: string - Service name
     *   - username: string - User/email
     *   - password: string - Encrypted password
     *   - category: string - Category
     *   - notes: string - Additional notes
     *   - createdAt: string - Creation date
     * 
     * @example
     * const passwords = await service.getPasswords(userId);
     */
    async getPasswords(userId) {
        try {
            if (this.loaded.passwords) {
                return this.cache.passwords;
            }

            const passwords = await FirebaseDataService.getCollectionDocuments(
                this.collections.passwords
            );

            this.cache.passwords = passwords || [];
            this.loaded.passwords = true;

            return this.cache.passwords;
        } catch (error) {
            Logger.error('Erro ao buscar senhas:', error);
            this.loaded.passwords = false;
            return [];
        }
    }

    /**
     * @description Removes a password from Firestore and updates cache
     * @param {string} userId - Authenticated user ID
     * @param {string} passwordId - Password ID to be deleted
     * @returns {Promise<void>}
     * @throws {Error} If there's an error in delete operation
     * 
     * @example
     * await service.deletePassword(userId, '1234567890');
     */
    async deletePassword(userId, passwordId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.passwords, passwordId);
            this.cache.passwords = this.cache.passwords.filter(p => String(p.id) !== String(passwordId));
        } catch (error) {
            Logger.error('Erro ao deletar senha:', error);
            throw error;
        }
    }

    /**
     * @description Saves or updates a shopping item in Firestore
     * @param {string} userId - Authenticated user ID
     * @param {Object} itemData - Item data to be saved
     * @param {string} [itemData.id] - Item ID (auto-generated if not provided)
     * @param {string} itemData.name - Item name
     * @param {number} [itemData.quantity=1] - Quantity
     * @param {string} [itemData.category] - Item category
     * @param {boolean} [itemData.purchased=false] - Purchase status
     * @param {string} [itemData.createdAt] - Creation date (auto-generated)
     * @returns {Promise<string>} Created/updated item ID
     * @throws {Error} If there's an error in Firestore operation
     * 
     * @example
     * const itemId = await service.saveShoppingItem(userId, {
     *   name: 'Rice',
     *   quantity: 2,
     *   category: 'food'
     * });
     */
    async saveShoppingItem(userId, itemData) {
        try {
            const itemId = itemData.id || Date.now().toString();
            const itemToSave = {
                ...itemData,
                id: itemId,
                userId,
                createdAt: itemData.createdAt || new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.shopping,
                itemToSave,
                itemId
            );

            const index = this.cache.shopping.findIndex(i => i.id === itemId);
            if (index >= 0) {
                this.cache.shopping[index] = itemToSave;
            } else {
                this.cache.shopping.push(itemToSave);
            }

            return itemId;
        } catch (error) {
            Logger.error('Erro ao salvar item de compra:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user shopping items with caching system
     * @param {string} userId - Authenticated user ID
     * @returns {Promise<Array<Object>>} Array of shopping items. Each item contains:
     *   - id: string - Unique item ID
     *   - name: string - Item name
     *   - quantity: number - Quantity
     *   - category: string - Category
     *   - purchased: boolean - Purchase status
     *   - createdAt: string - Creation date
     * 
     * @example
     * const items = await service.getShoppingItems(userId);
     */
    async getShoppingItems(userId) {
        try {
            if (this.loaded.shopping) {
                return this.cache.shopping;
            }

            const items = await FirebaseDataService.getCollectionDocuments(
                this.collections.shopping
            );

            this.cache.shopping = items || [];
            this.loaded.shopping = true;

            return this.cache.shopping;
        } catch (error) {
            Logger.error('Erro ao buscar itens de compra:', error);
            this.loaded.shopping = false;
            return [];
        }
    }

    /**
     * @description Removes a shopping item from Firestore and updates cache
     * @param {string} userId - Authenticated user ID
     * @param {string} itemId - Item ID to be deleted
     * @returns {Promise<void>}
     * @throws {Error} If there's an error in delete operation
     * 
     * @example
     * await service.deleteShoppingItem(userId, '1234567890');
     */
    async deleteShoppingItem(userId, itemId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.shopping, itemId);
            this.cache.shopping = this.cache.shopping.filter(i => String(i.id) !== String(itemId));
        } catch (error) {
            Logger.error('Erro ao deletar item de compra:', error);
            throw error;
        }
    }

    /**
     * @description Saves or updates a wishlist item in Firestore
     * @param {string} userId - Authenticated user ID
     * @param {Object} itemData - Item data to be saved
     * @param {string} [itemData.id] - Item ID (auto-generated if not provided)
     * @param {string} itemData.name - Desired item name
     * @param {string} [itemData.description] - Item description
     * @param {number} [itemData.price] - Estimated price
     * @param {string} [itemData.priority] - Priority (high, medium, low)
     * @param {boolean} [itemData.purchased=false] - Acquisition status
     * @param {string} [itemData.createdAt] - Creation date (auto-generated)
     * @returns {Promise<string>} Created/updated item ID
     * @throws {Error} If there's an error in Firestore operation
     * 
     * @example
     * const itemId = await service.saveWishlistItem(userId, {
     *   name: 'Notebook',
     *   price: 3500,
     *   priority: 'high'
     * });
     */
    async saveWishlistItem(userId, itemData) {
        try {
            const itemId = itemData.id || Date.now().toString();
            const itemToSave = {
                ...itemData,
                id: itemId,
                userId,
                createdAt: itemData.createdAt || new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.wishlist,
                itemToSave,
                itemId
            );

            const index = this.cache.wishlist.findIndex(i => i.id === itemId);
            if (index >= 0) {
                this.cache.wishlist[index] = itemToSave;
            } else {
                this.cache.wishlist.push(itemToSave);
            }

            return itemId;
        } catch (error) {
            Logger.error('Erro ao salvar item da wishlist:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user wishlist items with caching system
     * @param {string} userId - Authenticated user ID
     * @returns {Promise<Array<Object>>} Array of wishlist items. Each item contains:
     *   - id: string - Unique item ID
     *   - name: string - Item name
     *   - description: string - Description
     *   - price: number - Estimated price
     *   - priority: string - Priority
     *   - purchased: boolean - Acquisition status
     *   - createdAt: string - Creation date
     * 
     * @example
     * const wishlist = await service.getWishlistItems(userId);
     */
    async getWishlistItems(userId) {
        try {
            if (this.loaded.wishlist) {
                return this.cache.wishlist;
            }

            const items = await FirebaseDataService.getCollectionDocuments(
                this.collections.wishlist
            );

            this.cache.wishlist = items || [];
            this.loaded.wishlist = true;

            return this.cache.wishlist;
        } catch (error) {
            Logger.error('Erro ao buscar itens da wishlist:', error);
            this.loaded.wishlist = false;
            return [];
        }
    }

    /**
     * @description Removes a wishlist item from Firestore and updates cache
     * @param {string} userId - Authenticated user ID
     * @param {string} itemId - Item ID to be deleted
     * @returns {Promise<void>}
     * @throws {Error} If there's an error in delete operation
     * 
     * @example
     * await service.deleteWishlistItem(userId, '1234567890');
     */
    async deleteWishlistItem(userId, itemId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.wishlist, itemId);
            this.cache.wishlist = this.cache.wishlist.filter(i => String(i.id) !== String(itemId));
        } catch (error) {
            Logger.error('Erro ao deletar item da wishlist:', error);
            throw error;
        }
    }

    /**
     * @description Saves or updates a note in Firestore
     */
    async saveNote(userId, noteData) {
        try {
            const noteId = noteData.id || Date.now().toString();
            const noteToSave = {
                ...noteData,
                id: noteId,
                userId,
                createdAt: noteData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.notes,
                noteToSave,
                noteId
            );

            const index = this.cache.notes.findIndex(n => n.id === noteId);
            if (index >= 0) {
                this.cache.notes[index] = noteToSave;
            } else {
                this.cache.notes.push(noteToSave);
            }

            return noteId;
        } catch (error) {
            Logger.error('Erro ao salvar anotação:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user notes with caching system
     */
    async getNotes(userId) {
        try {
            if (this.loaded.notes) {
                return this.cache.notes;
            }

            const notes = await FirebaseDataService.getCollectionDocuments(
                this.collections.notes
            );

            this.cache.notes = notes || [];
            this.loaded.notes = true;

            return this.cache.notes;
        } catch (error) {
            Logger.error('Erro ao buscar anotações:', error);
            this.loaded.notes = false;
            return [];
        }
    }

    /**
     * @description Removes a note from Firestore and updates cache
     */
    async deleteNote(userId, noteId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.notes, noteId);
            this.cache.notes = this.cache.notes.filter(n => String(n.id) !== String(noteId));
        } catch (error) {
            Logger.error('Erro ao deletar anotação:', error);
            throw error;
        }
    }

    /**
     * @description Saves or updates a reminder in Firestore
     */
    async saveReminder(userId, reminderData) {
        try {
            const reminderId = reminderData.id || Date.now().toString();
            const reminderToSave = {
                ...reminderData,
                id: reminderId,
                userId,
                createdAt: reminderData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await FirebaseDataService.saveDocument(
                this.collections.reminders,
                reminderToSave,
                reminderId
            );

            const index = this.cache.reminders.findIndex(r => r.id === reminderId);
            if (index >= 0) {
                this.cache.reminders[index] = reminderToSave;
            } else {
                this.cache.reminders.push(reminderToSave);
            }

            return reminderId;
        } catch (error) {
            Logger.error('Erro ao salvar lembrete:', error);
            throw error;
        }
    }

    /**
     * @description Gets all user reminders with caching system
     */
    async getReminders(userId) {
        try {
            if (this.loaded.reminders) {
                return this.cache.reminders;
            }

            const reminders = await FirebaseDataService.getCollectionDocuments(
                this.collections.reminders
            );

            this.cache.reminders = reminders || [];
            this.loaded.reminders = true;

            return this.cache.reminders;
        } catch (error) {
            Logger.error('Erro ao buscar lembretes:', error);
            this.loaded.reminders = false;
            return [];
        }
    }

    /**
     * @description Removes a reminder from Firestore and updates cache
     */
    async deleteReminder(userId, reminderId) {
        try {
            await FirebaseDataService.deleteDocument(this.collections.reminders, reminderId);
            this.cache.reminders = this.cache.reminders.filter(r => String(r.id) !== String(reminderId));
        } catch (error) {
            Logger.error('Erro ao deletar lembrete:', error);
            throw error;
        }
    }

    /**
     * @description Clears all in-memory cache and resets loading flags
     * 
     * Useful when logging out or switching users to prevent data leakage
     * between sessions. Forces reload of all data on next operation.
     * 
     * @returns {void}
     * 
     * @example
     * // On logout
     * service.clearCache();
     * sessionStorage.clear();
     */
    clearCache() {
        this.cache = {
            tasks: [],
            links: [],
            passwords: [],
            shopping: [],
            wishlist: [],
            notes: [],
            reminders: []
        };

        this.loaded = {
            tasks: false,
            links: false,
            passwords: false,
            shopping: false,
            wishlist: false,
            notes: false,
            reminders: false
        };
    }
}

export { PersonalDataService };
