/**
 * @file firebaseDataService.js
 * @description Generic service for CRUD operations in Firestore with user isolation.
 * 
 * Contents:
 * - getCollectionPath(): Builds user-specific collection path
 * - saveDocument(): Creates or updates documents
 * - listenToCollection(): Real-time data listener
 * - getCollectionDocuments(): Fetch all documents
 * - deleteDocument(): Remove document
 * - removeUndefinedFields(): Data cleanup utility
 * 
 * Data Structure:
 * /artifacts/{appId}/users/{userId}/{collection}/{docId}
 * 
 * Used By:
 * - PersonalDataService (tasks, links, passwords, shopping, wishlist)
 * - FinanceService (income, fixed expenses, credit expenses)
 * - TrainingService (workout, running)
 * - UserService (user profiles)
 * 
 * Dependencies:
 * - firebaseConfig.js (db, auth, Firestore methods)
 * 
 * @author Leandro Fialho Fernandes
 */

import { db, auth, doc, collection, setDoc, query, onSnapshot, appId, deleteDoc, getDocs } from './firebaseConfig.js';

/**
 * Generic service to manage CRUD operations in Firestore for user private data.
 * This service ensures all data is stored isolated per user.
 */
export class FirebaseDataService {

    /**
     * Builds the complete path for a user's collection.
     * @param {string} collectionName - The collection name (e.g., 'expenses', 'income').
     * @returns {string} The base path for the user's subcollection.
     */
    static getCollectionPath(collectionName) {
        const userId = auth.currentUser?.uid || 'anonymous';
        return `artifacts/${appId}/users/${userId}/${collectionName}`;
    }

    /**
     * Removes fields with undefined values from an object (recursively for nested objects)
     * @param {Object} obj - Object to be cleaned
     * @returns {Object} Object without undefined fields
     */
    static removeUndefinedFields(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        const cleaned = {};
        for (const key in obj) {
            if (obj[key] !== undefined) {
                if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
                    cleaned[key] = this.removeUndefinedFields(obj[key]);
                } else {
                    cleaned[key] = obj[key];
                }
            }
        }
        return cleaned;
    }

    /**
     * Saves or updates a document in Firestore.
     * If document ID is provided, it is updated. Otherwise, a new document is created.
     * @param {string} collectionName - Collection name (e.g., 'finance').
     * @param {Object} data - Data to be saved (must include ID if updating).
     * @param {string} docId - Optional. Document ID for update.
     * @returns {Promise<string>} The ID of the saved document.
     */
    static async saveDocument(collectionName, data, docId = null) {
        try {
            if (!auth.currentUser) {
                throw new Error("Usuário não autenticado. Não é possível salvar dados.");
            }

            const collectionPath = this.getCollectionPath(collectionName);
            let docRef;

            if (docId) {
                docRef = doc(db, collectionPath, docId);
            } else {
                docRef = doc(collection(db, collectionPath));
            }

            const cleanData = this.removeUndefinedFields({
                ...data,
                id: docId || docRef.id
            });

            await setDoc(docRef, cleanData);

            return docRef.id;

        } catch (error) {
            console.error("Erro ao salvar documento no Firestore:", error);
            throw new Error("Falha ao salvar dados. Verifique a conexão ou permissões.");
        }
    }

    /**
     * Subscribes to a collection and returns real-time data.
     * Replaces the localStorage 'load' method.
     * @param {string} collectionName - Collection name (e.g., 'expenses').
     * @param {Function} callback - Function called whenever data changes.
     * @returns {Function} An unsubscribe function for the listener.
     */
    static listenToCollection(collectionName, callback) {
        if (!auth.currentUser) {
            callback([]);
            return () => { };
        }

        const collectionPath = this.getCollectionPath(collectionName);

        const q = query(collection(db, collectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const dataList = [];
            querySnapshot.forEach((doc) => {
                dataList.push({ id: doc.id, ...doc.data() });
            });

            callback(dataList);
        }, (error) => {
            console.error(`❌ Erro na escuta do Firestore (${collectionName}):`, error);
            callback([]);
        });

        return unsubscribe;
    }

    /**
     * Fetches all documents from a collection synchronously.
     * RECOMMENDED for initial data loading.
     * @param {string} collectionName - Collection name
     * @returns {Promise<Array>} Array of documents
     */
    static async getCollectionDocuments(collectionName) {
        try {
            if (!auth.currentUser) {
                return [];
            }

            const collectionPath = this.getCollectionPath(collectionName);
            const q = query(collection(db, collectionPath));
            const querySnapshot = await getDocs(q);

            const dataList = [];
            querySnapshot.forEach((doc) => {
                dataList.push({ id: doc.id, ...doc.data() });
            });

            return dataList;
        } catch (error) {
            console.error(`❌ Erro ao buscar documentos de ${collectionName}:`, error);
            return [];
        }
    }

    /**
     * Removes a document from Firestore.
     * @param {string} collectionName - Collection name.
     * @param {string|number} docId - ID of the document to be removed.
     * @returns {Promise<void>}
     */
    static async deleteDocument(collectionName, docId) {
        try {
            if (!auth.currentUser) {
                throw new Error("Usuário não autenticado. Não é possível remover dados.");
            }

            const docIdString = String(docId);

            const collectionPath = this.getCollectionPath(collectionName);
            const docRef = doc(db, collectionPath, docIdString);

            await deleteDoc(docRef);
        } catch (error) {
            console.error("Erro ao remover documento do Firestore:", error);
            throw new Error("Falha ao remover dados. Verifique a conexão ou permissões.");
        }
    }
}
