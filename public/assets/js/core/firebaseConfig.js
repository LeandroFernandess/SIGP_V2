/**
 * @file firebaseConfig.js
 * @description Central Firebase configuration and initialization.
 * 
 * Contents:
 * - Firebase App initialization
 * - Firestore, Auth, Storage services setup
 * - Authentication function (custom token or anonymous)
 * - All Firebase methods re-exported
 * 
 * Services Configured:
 * - Firebase Auth (user authentication)
 * - Firestore (NoSQL database)
 * - Storage (file storage)
 * 
 * Main Exports:
 * - db: Firestore instance
 * - auth: Firebase Auth instance
 * - storage: Storage instance
 * - initializeAuth(): Authentication initializer
 * - All Firestore/Auth/Storage methods
 * 
 * Dependencies:
 * - firebase.env.js (credentials)
 * - Firebase SDK v11.6.1 (CDN)
 * 
 * @author Leandro Fialho Fernandes
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    signInWithCustomToken,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    linkWithPopup,
    deleteUser
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setDoc, getDoc, getDocs, deleteDoc, doc, collection, query, onSnapshot, where, orderBy, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { firebaseConfig as envConfig } from './firebase.env.js';

const USE_FIREBASE = true;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'sigp-app';

let firebaseConfig;
if (typeof __firebase_config !== 'undefined' && __firebase_config !== '{}') {
    firebaseConfig = JSON.parse(__firebase_config);
} else {
    firebaseConfig = envConfig;
}

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, db, auth, storage;

if (!USE_FIREBASE) {
    db = null;
    auth = null;
    storage = null;
} else {
    try {
        app = initializeApp(firebaseConfig);

        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);

    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        db = null;
        auth = null;
        storage = null;
    }
}

export async function initializeAuth() {
    if (!USE_FIREBASE || !auth) {
        return;
    }

    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("❌ Erro na autenticação Firebase:", error);
    }
}

export {
    db,
    auth,
    storage,
    doc,
    collection,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    addDoc,
    updateDoc,
    query,
    onSnapshot,
    where,
    orderBy,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    appId,
    USE_FIREBASE,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    linkWithPopup,
    deleteUser
};
