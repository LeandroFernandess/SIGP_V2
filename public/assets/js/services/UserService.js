/**
 * @file UserService.js
 * @description Service layer for user authentication and profile management.
 * 
 * Manages:
 * - User registration (email/password, Google OAuth)
 * - User authentication (login, logout, session)
 * - Password operations (reset, update)
 * - Profile management (update name, email, password)
 * - User data persistence in Firestore
 * 
 * Features:
 * - Firebase Authentication integration
 * - Google Sign-In support
 * - Auto-generated usernames (SIGP000, SIGP001...)
 * - Centralized error handling via AuthErrorMapper
 * 
 * Dependencies: firebaseConfig, AuthErrorMapper, Logger
 * Used by: LoginHandler, RegisterHandler, SettingsModule, SecurityModule
 * 
 * @author Leandro Fialho Fernandes
 */

import {
    db,
    auth,
    doc,
    collection,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    appId,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from '../core/firebaseConfig.js';

/**
 * @class UserService
 * @description Manages user operations and Firebase authentication
 */
export class UserService {

    /**
     * Initializes the user service
     * @constructor
     */
    constructor() {
        this.collectionName = 'users';
        this.useFirebase = db !== null && db !== undefined;

        if (!this.useFirebase) {
            Logger.error('❌ ERRO: Firebase não está configurado!');
            Logger.error('❌ O sistema NÃO funcionará sem Firebase.');
            throw new Error('Firebase não configurado. Verifique firebaseConfig.js');
        }
    }

    /**
     * Gets the users collection path
     * @returns {string} - Collection path
     */
    getCollectionPath() {
        return `artifacts/${appId}/${this.collectionName}`;
    }

    /**
     * Generates the next username in SIGP000, SIGP001 pattern, etc.
     * @returns {Promise<string>} - Next available username
     */
    async generateNextUsername() {
        try {
            const users = await this.getUsers();

            if (users.length === 0) {
                return 'SIGP000';
            }

            const numbers = users
                .filter(u => u.username && u.username.startsWith('SIGP'))
                .map(u => {
                    const match = u.username.match(/^SIGP(\d+)$/);
                    return match ? parseInt(match[1], 10) : -1;
                })
                .filter(num => num >= 0);

            const maxNumber = numbers.length > 0 ? Math.max(...numbers) : -1;

            const nextNumber = maxNumber + 1;
            const username = `SIGP${String(nextNumber).padStart(3, '0')}`;

            return username;

        } catch (error) {
            Logger.error('❌ Error generating username:', error);
            return `SIGP${Date.now().toString().slice(-3)}`;
        }
    }

    /**
     * @description Gets all registered users from Firestore
     * @returns {Promise<Array<Object>>} Array of users. Each user contains:
     *   - id: string - Firebase Authentication UID
     *   - name: string - Full name
     *   - email: string - User email
     *   - username: string - Generated username (SIGP000, SIGP001, etc)
     *   - createdAt: string - Creation date
     *   - providers: Array<string> - Authentication providers (['password'], ['google'], or both)
     * @throws {Error} If unable to get users from Firebase
     * 
     * @example
     * const users = await userService.getUsers();
     * console.log(`Total users: ${users.length}`);
     */
    async getUsers() {
        try {
            const usersCollection = collection(db, this.getCollectionPath());
            const querySnapshot = await getDocs(usersCollection);
            const users = [];

            querySnapshot.forEach((docSnap) => {
                users.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });

            return users;
        } catch (error) {
            Logger.error('❌ Erro ao obter usuários do Firebase:', error);
            throw new Error('Não foi possível obter usuários do Firebase');
        }
    }

    /**
     * @description Creates a new user in Firebase Authentication and Firestore
     * 
     * Process:
     * 1. Validates if email already exists
     * 2. Generates automatic username (SIGP000, SIGP001, ...)
     * 3. Creates account in Firebase Authentication
     * 4. Saves complete profile in Firestore
     * 
     * @param {Object} userData - New user data
     * @param {string} userData.name - Full name
     * @param {string} userData.email - Email (must be unique)
     * @param {string} userData.password - Password (minimum 6 characters)
     * @returns {Promise<Object>} Operation result:
     *   - success: boolean - Whether creation was successful
     *   - message: string - Success/error message
     *   - user: Object - Created user data (if success=true)
     *   - username: string - Generated username (if success=true)
     * 
     * @example
     * const result = await userService.createUser({
     *   name: 'John Doe',
     *   email: 'john@example.com',
     *   password: 'password123'
     * });
     * if (result.success) {
     *   console.log(`Welcome! Your username is: ${result.username}`);
     * }
     */
    async createUser(userData) {
        try {
            const users = await this.getUsers();
            const emailExists = users.find(u => u.email === userData.email);

            if (emailExists) {
                return {
                    success: false,
                    message: 'E-mail já cadastrado'
                };
            }

            const username = await this.generateNextUsername();

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            const firebaseUser = userCredential.user;
            const userId = firebaseUser.uid;
            const newUser = {
                id: userId,
                name: userData.name,
                email: userData.email,
                username: username,
                providers: ['password'],
                createdAt: new Date().toISOString()
            };

            const userDocRef = doc(db, this.getCollectionPath(), userId);
            await setDoc(userDocRef, newUser);

            return {
                success: true,
                message: `Conta criada com sucesso! Seu usuário é: ${username}`,
                user: newUser,
                username: username
            };
        } catch (error) {
            Logger.error('❌ Erro ao criar usuário:', error);

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'register')
            };
        }
    }

    /**
     * @description Authenticates a user using Firebase Authentication
     * 
     * Validates credentials in Firebase Auth and fetches complete profile from Firestore.
     * Detects and blocks password login attempts on Google-created accounts.
     * 
     * @param {string} email - User email
     * @param {string} password - Password
     * @returns {Promise<Object>} Authentication result:
     *   - success: boolean - Whether login was successful
     *   - message: string - Success/error message
     *   - user: Object - User data (if success=true)
     * 
     * @example
     * const result = await userService.authenticate('user@example.com', 'password123');
     * if (result.success) {
     *   sessionStorage.setItem('currentUser', JSON.stringify(result.user));
     *   window.location.href = 'dashboard.html';
     * } else {
     *   alert(result.message);
     * }
     */
    async authenticate(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            const userDocRef = doc(db, this.getCollectionPath(), firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                return {
                    success: false,
                    message: 'Perfil de usuário não encontrado'
                };
            }

            const userData = userDoc.data();

            let providers = [];
            if (userData.provider && !userData.providers) {
                providers = userData.provider === 'google' ? ['google'] : ['password'];
            } else if (userData.providers) {
                providers = userData.providers;
            } else {
                providers = ['password'];
            }

            if (!providers.includes('password')) {
                providers.push('password');
                await updateDoc(userDocRef, { providers, provider: null });
            }

            userData.providers = providers;
            if (userData.provider) {
                delete userData.provider;
            }

            return {
                success: true,
                message: 'Login realizado com sucesso',
                user: userData
            };
        } catch (error) {
            Logger.error('❌ Erro ao autenticar:', error);

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'login')
            };
        }
    }

    /**
     * @description Finds user by email in Firestore
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User object if found, null otherwise
     * 
     * @example
     * const user = await userService.findUser('user@example.com');
     * if (user) console.log(`User found: ${user.name}`);
     */
    async findUser(email) {
        try {
            const users = await this.getUsers();
            return users.find(u => u.email === email);
        } catch (error) {
            Logger.error('Erro ao buscar usuário:', error);
            return null;
        }
    }

    /**
     * @description Finds user by username in Firestore
     * @param {string} username - User's username (format: SIGP000, SIGP001, etc)
     * @returns {Promise<Object|null>} User object if found, null otherwise
     * 
     * @example
     * const user = await userService.findUserByUsername('SIGP000');
     * if (user) console.log(`User: ${user.name}`);
     */
    async findUserByUsername(username) {
        try {
            const users = await this.getUsers();
            return users.find(u => u.username === username);
        } catch (error) {
            Logger.error('Erro ao buscar usuário por username:', error);
            return null;
        }
    }

    /**
     * @description Checks if a username already exists in the system
     * @param {string} username - Username (format: SIGP000, SIGP001, etc)
     * @returns {Promise<boolean>} true if exists, false otherwise
     * 
     * @example
     * const exists = await userService.userExists('SIGP000');
     * if (exists) console.log('Username already in use');
     */
    async userExists(username) {
        try {
            const users = await this.getUsers();
            return users.some(u => u.username === username);
        } catch (error) {
            Logger.error('Erro ao verificar usuário:', error);
            return false;
        }
    }

    /**
     * @description Checks if an email already exists in the system
     * @param {string} email - Email to check
     * @returns {Promise<boolean>} true if exists, false otherwise
     * 
     * @example
     * const exists = await userService.emailExists('user@example.com');
     * if (exists) alert('Email already registered');
     */
    async emailExists(email) {
        try {
            const users = await this.getUsers();
            return users.some(u => u.email === email);
        } catch (error) {
            Logger.error('Erro ao verificar e-mail:', error);
            return false;
        }
    }

    /**
     * @description Sends password recovery email via Firebase Authentication
     * 
     * Firebase automatically sends email with reset link.
     * Works only for accounts created with email/password (not Google).
     * 
     * @param {string} email - User email
     * @returns {Promise<Object>} Result:
     *   - success: boolean - Whether email was sent
     *   - message: string - Confirmation/error message
     * 
     * @example
     * const result = await userService.sendPasswordResetEmail('user@example.com');
     * if (result.success) {
     *   alert('Recovery email sent!');
     * }
     */
    async sendPasswordResetEmail(email) {
        try {

            await sendPasswordResetEmail(auth, email);

            return {
                success: true,
                message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.'
            };
        } catch (error) {
            Logger.error('❌ Erro ao enviar e-mail de recuperação:', error);

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'passwordReset')
            };
        }
    }

    /**
     * @description Automatic login or registration with Google OAuth
     * 
     * If user already exists in Firestore: logs in
     * If new: automatically creates account with Google data
     * 
     * Process:
     * 1. Opens Google authentication popup
     * 2. Checks if user exists in Firestore
     * 3. If new: generates username and creates profile
     * 4. If existing: returns profile data
     * 
     * @returns {Promise<Object>} Result:
     *   - success: boolean - Whether authentication was successful
     *   - message: string - Confirmation/error message
     *   - user: Object - User data (if success=true)
     *   - isNewUser: boolean - true if new account was created
     * 
     * @example
     * const result = await userService.signInWithGoogle();
     * if (result.success) {
     *   if (result.isNewUser) {
     *     console.log(`Welcome! Your username: ${result.user.username}`);
     *   }
     *   sessionStorage.setItem('currentUser', JSON.stringify(result.user));
     *   window.location.href = 'dashboard.html';
     * }
     */
    async signInWithGoogle() {

        try {

            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, provider);

            const firebaseUser = result?.user;


            if (!firebaseUser || !firebaseUser.uid || !firebaseUser.email) {
                Logger.error('❌ Dados inválidos do Firebase User. User completo:', firebaseUser);
                Logger.error('❌ Result completo:', result);
                return {
                    success: false,
                    message: 'Erro ao obter dados da conta Google. Tente novamente.'
                };
            }


            const users = await this.getUsers();
            const existingUserByEmail = users.find(u => u.email === firebaseUser.email);

            if (existingUserByEmail && existingUserByEmail.id !== firebaseUser.uid) {
                const { deleteUser } = await import('../core/firebaseConfig.js');
                try {
                    await deleteUser(firebaseUser);
                } catch (deleteError) {
                    Logger.error('❌ Erro ao deletar duplicada:', deleteError);
                }

                try {
                    await auth.signOut();
                } catch (signOutError) {
                    Logger.error('Erro ao fazer signOut:', signOutError);
                }

                return {
                    success: false,
                    requiresPasswordLogin: true,
                    message: `Este email já possui conta criada com formulário (usuário: ${existingUserByEmail.username}). Para vincular o Google, faça login com seu usuário e senha primeiro, depois vá em Configurações → Segurança → Vincular Conta Google.`,
                    username: existingUserByEmail.username
                };
            }

            const userDocRef = doc(db, this.getCollectionPath(), firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            let userData;
            let isNewUser = false;

            if (userDoc.exists()) {
                userData = userDoc.data();

                let needsUpdate = false;
                const updateData = {};

                if (firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL) {
                    updateData.photoURL = firebaseUser.photoURL;
                    userData.photoURL = firebaseUser.photoURL;
                    needsUpdate = true;
                }

                let providers = userData.providers || ['password'];
                if (!providers.includes('google')) {
                    providers.push('google');
                    updateData.providers = providers;
                    userData.providers = providers;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await updateDoc(userDocRef, updateData);
                }
            } else {
                isNewUser = true;

                const username = await this.generateNextUsername();

                userData = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Usuário Google',
                    email: firebaseUser.email,
                    username: username || `SIGP${Date.now().toString().slice(-3)}`,
                    photoURL: firebaseUser.photoURL || null,
                    providers: ['google'],
                    createdAt: new Date().toISOString()
                };

                await setDoc(userDocRef, userData);

            }

            return {
                success: true,
                message: isNewUser
                    ? `Conta criada com sucesso! Seu usuário é: ${userData.username}`
                    : 'Login realizado com sucesso!',
                user: userData,
                isNewUser: isNewUser
            };

        } catch (error) {
            Logger.error('❌ Erro ao autenticar com Google:', error);
            Logger.error('❌ Error code:', error?.code);
            Logger.error('❌ Error message:', error?.message);
            Logger.error('❌ Error stack:', error?.stack);

            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return {
                    success: false,
                    message: 'Login com Google cancelado.'
                };
            }

            if (error.code === 'auth/account-exists-with-different-credential') {
                return {
                    success: false,
                    message: 'Este email já possui uma conta criada com formulário. As contas não podem ser misturadas.'
                };
            }

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'google') || 'Erro ao autenticar com Google. Tente novamente.'
            };
        }
    }

    /**
     * @description Links Google account to existing email/password account
     * 
     * Allows users who created accounts with email/password to add Google as login method.
     * User must be logged in with email/password first.
     * 
     * @returns {Promise<Object>} Result with success status and message
     * 
     * @example
     * const result = await userService.linkGoogleAccount();
     * if (result.success) alert('Google vinculado!');
     */
    async linkGoogleAccount() {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return {
                    success: false,
                    message: 'Você precisa estar logado para vincular sua conta Google.'
                };
            }

            const userDocRef = doc(db, this.getCollectionPath(), currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                return {
                    success: false,
                    message: 'Perfil de usuário não encontrado.'
                };
            }

            const userData = userDoc.data();
            const providers = userData.providers || ['password'];

            if (providers.includes('google')) {
                return {
                    success: false,
                    message: 'Sua conta já está vinculada ao Google.'
                };
            }

            const { linkWithPopup } = await import('../core/firebaseConfig.js');
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                login_hint: currentUser.email
            });

            const result = await linkWithPopup(currentUser, provider);

            if (result.user.email !== currentUser.email) {
                return {
                    success: false,
                    message: `O email do Google (${result.user.email}) não corresponde ao email da sua conta (${currentUser.email}).`
                };
            }

            providers.push('google');

            const updateData = {
                providers,
                updatedAt: new Date().toISOString()
            };

            const newPhotoURL = result.user.photoURL || userData.photoURL;
            if (newPhotoURL) {
                updateData.photoURL = newPhotoURL;
            }

            await updateDoc(userDocRef, updateData);

            return {
                success: true,
                message: 'Conta Google vinculada com sucesso! Agora você pode fazer login com ambos os métodos.'
            };

        } catch (error) {
            Logger.error('❌ Erro ao vincular conta Google:', error);

            if (error.code === 'auth/provider-already-linked') {
                return {
                    success: false,
                    message: 'Sua conta já está vinculada ao Google.'
                };
            }

            if (error.code === 'auth/credential-already-in-use') {
                return {
                    success: false,
                    message: 'Esta conta Google já está em uso por outro usuário.'
                };
            }

            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return {
                    success: false,
                    message: 'Você fechou a janela de autenticação. Tente novamente.'
                };
            }

            return {
                success: false,
                message: `Erro ao vincular conta Google: ${error.message || 'Tente novamente.'}`
            };
        }
    }

    /**
     * @description Finds user by ID (Firebase UID) in Firestore
     * @param {string} userId - User ID (Firebase UID)
     * @returns {Promise<Object|null>} Complete user data or null if not found
     * 
     * @example
     * const user = await userService.getUserById('abc123xyz');
     * if (user) console.log(user.name);
     */
    async getUserById(userId) {
        try {
            const userDocRef = doc(db, this.getCollectionPath(), userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                return {
                    id: userDoc.id,
                    ...userDoc.data()
                };
            }

            return null;
        } catch (error) {
            Logger.error('❌ Erro ao buscar usuário por ID:', error);
            return null;
        }
    }

    /**
     * @description Updates user profile data in Firestore
     * 
     * Allows partial update - only provided fields are updated.
     * 
     * @param {string} userId - User ID (Firebase UID)
     * @param {Object} profileData - Profile data to update
     * @param {string} [profileData.name] - New full name
     * @param {string} [profileData.birthDate] - New birth date
     * @param {string} [profileData.phone] - New phone number
     * @returns {Promise<Object>} Result:
     *   - success: boolean - Whether update was successful
     *   - message: string - Confirmation/error message
     * 
     * @example
     * const result = await userService.updateUserProfile(userId, {
     *   name: 'John Doe Smith',
     *   phone: '(11) 98765-4321'
     * });
     */
    async updateUserProfile(userId, profileData) {
        try {
            const userDocRef = doc(db, this.getCollectionPath(), userId);

            const updateData = {};
            if (profileData.name !== undefined) updateData.name = profileData.name;
            if (profileData.birthDate !== undefined) updateData.birthDate = profileData.birthDate;
            if (profileData.phone !== undefined) updateData.phone = profileData.phone;

            updateData.updatedAt = new Date().toISOString();

            await setDoc(userDocRef, updateData, { merge: true });

            return {
                success: true,
                message: 'Perfil atualizado com sucesso!'
            };
        } catch (error) {
            Logger.error('❌ Erro ao atualizar perfil:', error);
            return {
                success: false,
                message: 'Erro ao atualizar perfil. Tente novamente.'
            };
        }
    }

    /**
     * @description Updates user email in Firebase Authentication and Firestore
     * 
     * Requires reauthentication for security. Updates both Authentication and
     * Firestore document to maintain consistency.
     * 
     * @param {string} newEmail - Desired new email
     * @param {string} currentPassword - Current password for security reauthentication
     * @returns {Promise<Object>} Result:
     *   - success: boolean - Whether update was successful
     *   - message: string - Confirmation/error message
     * 
     * @example
     * const result = await userService.updateUserEmail(
     *   'newemail@example.com',
     *   'currentPassword123'
     * );
     * if (result.success) alert('Email updated!');
     */
    async updateUserEmail(newEmail, currentPassword) {
        try {
            const user = auth.currentUser;

            if (!user) {
                return {
                    success: false,
                    message: 'Usuário não está autenticado'
                };
            }

            const { EmailAuthProvider, reauthenticateWithCredential, updateEmail } = await import('../firebaseConfig.js');

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updateEmail(user, newEmail);

            const userDocRef = doc(db, this.getCollectionPath(), user.uid);
            await setDoc(userDocRef, {
                email: newEmail,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            return {
                success: true,
                message: 'E-mail atualizado com sucesso!'
            };
        } catch (error) {
            Logger.error('❌ Erro ao atualizar e-mail:', error);

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'updateEmail')
            };
        }
    }

    /**
     * @description Updates user password in Firebase Authentication with reauthentication
     * 
     * Secure method that requires current password for validation before changing.
     * Records update timestamp in Firestore.
     * 
     * @param {string} currentPassword - Current password for validation
     * @param {string} newPassword - New password (minimum 6 characters)
     * @returns {Promise<Object>} Result:
     *   - success: boolean - Whether update was successful
     *   - message: string - Confirmation/error message
     * 
     * @example
     * const result = await userService.updateUserPassword(
     *   'currentPassword123',
     *   'newPassword456'
     * );
     */
    async updateUserPassword(currentPassword, newPassword) {
        try {
            const user = auth.currentUser;

            if (!user) {
                return {
                    success: false,
                    message: 'Usuário não está autenticado'
                };
            }

            const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('../firebaseConfig.js');

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);

            const userDocRef = doc(db, this.getCollectionPath(), user.uid);
            await setDoc(userDocRef, {
                passwordUpdatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            return {
                success: true,
                message: 'Senha atualizada com sucesso!'
            };
        } catch (error) {
            Logger.error('❌ Erro ao atualizar senha:', error);

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'updatePassword')
            };
        }
    }

    /**
     * @description Updates password directly without requiring current password
     * @param {string} newPassword - New password (minimum 6 characters)
     * @returns {Promise<Object>} Result:
     *   - success: boolean - Whether update was successful
     *   - message: string - Confirmation/error message
     * 
     * @example
     * // After email password reset
     * const result = await userService.updateUserPasswordDirect('newPassword789');
     */
    async updateUserPasswordDirect(newPassword) {
        try {
            const user = auth.currentUser;

            if (!user) {
                return {
                    success: false,
                    message: 'Usuário não está autenticado'
                };
            }

            if (!newPassword || newPassword.length < 6) {
                return {
                    success: false,
                    message: 'A senha deve ter no mínimo 6 caracteres'
                };
            }

            const { updatePassword } = await import('../core/firebaseConfig.js');

            await updatePassword(user, newPassword);

            const userDocRef = doc(db, this.getCollectionPath(), user.uid);
            await setDoc(userDocRef, {
                passwordUpdatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            return {
                success: true,
                message: 'Senha atualizada com sucesso!'
            };
        } catch (error) {
            Logger.error('❌ Erro ao atualizar senha:', error);
            Logger.error('❌ Error code:', error.code);
            Logger.error('❌ Error message:', error.message);

            return {
                success: false,
                message: AuthErrorMapper.getMessage(error, 'updatePassword')
            };
        }
    }
}

