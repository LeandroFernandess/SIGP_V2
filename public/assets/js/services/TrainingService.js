/**
 * @file TrainingService.js
 * @description Service layer for training modules with Firebase integration.
 * 
 * Manages:
 * - Workout sessions (strength training logs)
 * - Running sessions (cardio training logs)
 * 
 * Features:
 * - Lazy Firebase initialization with retry
 * - Firebase readiness check (isFirebaseReady)
 * - CRUD operations for training data
 * 
 * Dependencies: window.firebaseGlobals, Logger
 * Used by: TrainingPageHandler, WorkoutModule, RunningModule
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class TrainingService
 * @description Service for managing training modules with Firebase
 */
class TrainingService {

    /**
     * @constructor
     * @description Initializes the training service
     */
    constructor() {
        this.collectionName = 'training';
        this._db = null;
        this._initializationAttempts = 0;
        this._maxAttempts = 3;
        this.appId = null;
    }

    /**
     * @description Gets Firebase globals with safety check
     * @returns {Object|null} Firebase globals object or null
     * @private
     */
    _getFirebaseGlobals() {
        return typeof window.firebaseGlobals !== 'undefined' ? window.firebaseGlobals : null;
    }

    /**
     * @description Gets the Firestore instance with lazy loading and retry
     * @throws {Error} If Firebase is not initialized
     * @returns {firebase.firestore.Firestore} Firestore instance
     */
    get db() {
        if (!this._db) {
            const globals = this._getFirebaseGlobals();
            
            if (!globals || !globals.db) {
                this._initializationAttempts++;
                throw new Error('Firebase não está inicializado. Aguarde o carregamento do Firebase.');
            }

            try {
                this._db = globals.db;
                this.appId = globals.appId || 'sigp-app';
                this._initializationAttempts = 0;
            } catch (error) {
                Logger.error('❌ Erro ao conectar ao Firestore:', error);
                throw error;
            }
        }
        return this._db;
    }

    /**
     * Checks if Firebase is ready
     * @returns {boolean}
     */
    isFirebaseReady() {
        const globals = this._getFirebaseGlobals();
        return globals !== null &&
            globals.db !== undefined &&
            globals.collection !== undefined;
    }

    /**
     * Gets all items from a training module
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name (workout, running)
     * @returns {Promise<Array>} Array with items
     */
    async getAll(userId, moduleName) {
        try {
            const globals = this._getFirebaseGlobals();
            const { collection, query, orderBy, getDocs, auth } = globals;

            const currentUser = auth.currentUser;
            if (!currentUser) {
                Logger.error('❌ Usuário não autenticado!');
                return [];
            }

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;

            const colRef = collection(this.db, collectionPath);
            const q = query(colRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const items = [];
            snapshot.forEach(doc => {
                items.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return items;
        } catch (error) {
            Logger.error(`❌ Erro ao buscar ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Gets a specific item
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @param {string} itemId - Item ID
     * @returns {Promise<Object|null>} Found item or null
     */
    async getById(userId, moduleName, itemId) {
        try {
            const globals = this._getFirebaseGlobals();
            const { doc, getDoc } = globals;

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;
            const docRef = doc(this.db, collectionPath, itemId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            }

            return null;
        } catch (error) {
            Logger.error(`Erro ao buscar item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Adds a new item
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @param {Object} data - Item data
     * @returns {Promise<string>} Created item ID
     */
    async add(userId, moduleName, data) {
        try {
            const globals = this._getFirebaseGlobals();
            const { collection, addDoc, serverTimestamp } = globals;

            const itemData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;
            const colRef = collection(this.db, collectionPath);
            const docRef = await addDoc(colRef, itemData);

            return docRef.id;
        } catch (error) {
            Logger.error(`Erro ao adicionar ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Updates an existing item
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @param {string} itemId - Item ID
     * @param {Object} data - Updated data
     * @returns {Promise<void>}
     */
    async update(userId, moduleName, itemId, data) {
        try {
            const globals = this._getFirebaseGlobals();
            const { doc, updateDoc, serverTimestamp } = globals;

            const updateData = {
                ...data,
                updatedAt: serverTimestamp()
            };

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;
            const docRef = doc(this.db, collectionPath, itemId);
            await updateDoc(docRef, updateData);

        } catch (error) {
            Logger.error(`Erro ao atualizar ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Removes an item
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @param {string} itemId - Item ID
     * @returns {Promise<void>}
     */
    async delete(userId, moduleName, itemId) {
        try {
            const globals = this._getFirebaseGlobals();
            const { doc, deleteDoc } = globals;

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;
            const docRef = doc(this.db, collectionPath, itemId);
            await deleteDoc(docRef);

        } catch (error) {
            Logger.error(`Erro ao deletar ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Checks if an item exists
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @param {string} itemId - Item ID
     * @returns {Promise<boolean>}
     */
    async exists(userId, moduleName, itemId) {
        try {
            const globals = this._getFirebaseGlobals();
            const { doc, getDoc } = globals;

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;
            const docRef = doc(this.db, collectionPath, itemId);
            const docSnap = await getDoc(docRef);

            return docSnap.exists();
        } catch (error) {
            Logger.error(`Erro ao verificar existência:`, error);
            return false;
        }
    }

    /**
     * Counts the number of items in a module
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @returns {Promise<number>}
     */
    async count(userId, moduleName) {
        try {
            const globals = this._getFirebaseGlobals();
            const { collection, getDocs } = globals;

            const collectionName = `${this.collectionName}-${moduleName}`;
            const collectionPath = `artifacts/${this.appId}/users/${userId}/${collectionName}`;
            const colRef = collection(this.db, collectionPath);
            const snapshot = await getDocs(colRef);

            return snapshot.size;
        } catch (error) {
            Logger.error(`Erro ao contar itens:`, error);
            return 0;
        }
    }

    /**
     * Removes all items from a module (use with caution!)
     * @param {string} userId - User ID
     * @param {string} moduleName - Module name
     * @returns {Promise<void>}
     */
    async deleteAll(userId, moduleName) {
        try {
            const snapshot = await this.db
                .collection(this.collectionName)
                .doc(userId)
                .collection(moduleName)
                .get();

            const batch = this.db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            if (typeof Logger !== 'undefined' && Logger.DEBUG) {
                Logger.error(`Erro ao deletar todos os itens:`, error);
            }
            throw error;
        }
    }

    /**
     * Registers a completed training session
     * @param {string} userId - User ID
     * @param {Object} sessionData - Session data
     * @param {string} sessionData.type - Type: 'workout' or 'running'
     * @param {string} sessionData.date - ISO date string
     * @param {string} sessionData.workoutId - ID of the workout performed (optional)
     * @param {Object} sessionData.details - Additional details (optional)
     * @returns {Promise<string>} Session ID
     */
    async addSession(userId, sessionData) {
        try {
            if (!this.isFirebaseReady()) {
                throw new Error('Firebase não está pronto');
            }

            const globals = this._getFirebaseGlobals();
            const { collection, addDoc, serverTimestamp } = globals;

            const collectionPath = `artifacts/${this.appId}/users/${userId}/training-sessions`;
            const colRef = collection(this.db, collectionPath);

            const session = {
                ...sessionData,
                createdAt: serverTimestamp(),
                timestamp: new Date().getTime()
            };

            const docRef = await addDoc(colRef, session);
            Logger.info('✅ Sessão de treino registrada:', docRef.id);
            return docRef.id;
        } catch (error) {
            Logger.error('❌ Erro ao registrar sessão:', error);
            throw error;
        }
    }

    /**
     * Gets all training sessions within a date range
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} Array of sessions
     */
    async getSessions(userId, startDate = null, endDate = null) {
        
        try {
            if (!this.isFirebaseReady()) {
                console.error('   ❌ Firebase não está pronto');
                throw new Error('Firebase não está pronto');
            }

            const db = this.db;

            const globals = this._getFirebaseGlobals();
            const { collection, getDocs, query, where, orderBy } = globals;

            const collectionPath = `artifacts/${this.appId}/users/${userId}/training-sessions`;
            const colRef = collection(this.db, collectionPath);

            const constraints = [];
            
            if (startDate) {
                const startTimestamp = startDate.getTime();
                constraints.push(where('timestamp', '>=', startTimestamp));
            }
            if (endDate) {
                const endTimestamp = endDate.getTime();
                constraints.push(where('timestamp', '<=', endTimestamp));
            }
            
            constraints.push(orderBy('timestamp', 'desc'));

            const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

            const snapshot = await getDocs(q);
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            if (sessions.length > 0) {
            }
            return sessions;
        } catch (error) {
            Logger.error('❌ Erro ao buscar sessões:', error);
            console.error('   Stack trace:', error.stack);
            return [];
        }
    }

    /**
     * Gets training statistics for a period
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Object>} Statistics object
     */
    async getStats(userId, startDate, endDate) {
        try {
            const sessions = await this.getSessions(userId, startDate, endDate);
            
            const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
            const totalDays = daysDiff + 1;
            const trainedDays = new Set(sessions.map(s => new Date(s.date).toDateString())).size;
            const percentage = totalDays > 0 ? (trainedDays / totalDays * 100).toFixed(1) : 0;

            const dayMap = new Map();
            sessions.forEach(s => {
                const date = new Date(s.date);
                dayMap.set(date.toDateString(), true);
            });

            let completeWeeks = 0;
            let currentStreak = 0;
            let longestStreak = 0;

            const sortedDates = Array.from(dayMap.keys()).sort((a, b) => new Date(a) - new Date(b));
            
            for (let i = 0; i < sortedDates.length; i++) {
                const date = new Date(sortedDates[i]);
                currentStreak++;
                
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
                
                if (currentStreak >= 7) {
                    completeWeeks = Math.floor(currentStreak / 7);
                }
                
                if (i < sortedDates.length - 1) {
                    const nextDate = new Date(sortedDates[i + 1]);
                    const diff = (nextDate - date) / (1000 * 60 * 60 * 24);
                    if (diff > 1) {
                        currentStreak = 0;
                    }
                }
            }

            return {
                totalDays,
                trainedDays,
                percentage: parseFloat(percentage),
                completeWeeks,
                longestStreak,
                totalSessions: sessions.length,
                sessions
            };
        } catch (error) {
            Logger.error('❌ Erro ao calcular estatísticas:', error);
            return {
                totalDays: 0,
                trainedDays: 0,
                percentage: 0,
                completeWeeks: 0,
                longestStreak: 0,
                totalSessions: 0,
                sessions: []
            };
        }
    }

    /**
     * Deletes a training session
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID
     * @returns {Promise<void>}
     */
    async deleteSession(userId, sessionId) {
        try {
            if (!this.isFirebaseReady()) {
                throw new Error('Firebase não está pronto');
            }

            const globals = this._getFirebaseGlobals();
            const { doc, deleteDoc } = globals;

            const docPath = `artifacts/${this.appId}/users/${userId}/training-sessions/${sessionId}`;
            const docRef = doc(this.db, docPath);

            await deleteDoc(docRef);
            Logger.info('✅ Sessão deletada');
        } catch (error) {
            Logger.error('❌ Erro ao deletar sessão:', error);
            throw error;
        }
    }
}

if (typeof window !== 'undefined') {
    window.TrainingService = TrainingService;
}

export { TrainingService };