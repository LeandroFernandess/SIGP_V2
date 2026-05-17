/**
 * @file firebaseGlobals.js
 * @description Global exposure of Firebase for non-module scripts.
 * 
 * Contents:
 * - window.firebaseGlobals object creation
 * - Firebase Storage methods (ref, uploadBytes, getDownloadURL, deleteObject)
 * - Firebase Auth instance
 * - Firestore methods (doc, collection, CRUD operations)
 * - FirebaseDataService class
 * - Legacy compatibility (window.firebase)
 * 
 * Exposed Services:
 * - storage, auth, db (Firebase instances)
 * - All Firestore CRUD methods
 * - Query methods (query, where, orderBy)
 * - FirebaseDataService class
 * 
 * Used By:
 * - DocumentsPageHandler (file uploads)
 * - Any non-module script needing Firebase
 * 
 * Dependencies:
 * - firebaseConfig.js (all Firebase exports)
 * - firebaseDataService.js (FirebaseDataService class)
 * 
 * @author Leandro Fialho Fernandes
 */

import {
    storage,
    auth,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    appId,
    functionsClient,
    httpsCallable
} from './firebaseConfig.js';

import { FirebaseDataService } from './firebaseDataService.js';

const firebaseCompat = {
    firestore: () => db,
    auth: () => auth,
    storage: () => storage
};

window.firebaseGlobals = {
    storage,
    auth,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    FirebaseDataService,
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    appId,
    functionsClient,
    httpsCallable
};

window.firebase = firebaseCompat;
