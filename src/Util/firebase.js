// d:\Udemy Java script\MyWhatsApp\src\Util\firebase.js

// Importações para Firebase SDK v8 (namespaced)
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';


// Sua configuração do Firebase
const firebaseConfig = {
 
 apiKey: process.env.API_KEY,
 authDomain: process.env.AUTO_DOMAIN,
 projectId: process.env.PROJECT_ID,
 storageBucket: process.env.STORAGE_BUCKET,
 messagingSenderId: process.env.MESSAGING_SENDER_ID,
 appId: process.env.APP_ID,
 measurementId: process.env.MEASUREMENT_ID
};

console.log('[Firebase.js] Raw process.env.API_KEY:', process.env.API_KEY);
console.log('[Firebase.js] Raw process.env.AUTO_DOMAIN:', process.env.AUTO_DOMAIN);
console.log('[Firebase.js] Firebase Config Object:', firebaseConfig);

export class Firebase {
    constructor() {
        // Verifique se o app já foi inicializado para evitar erros
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this._auth = firebase.auth();
        this._db = firebase.firestore();
        this._storage = firebase.storage();
        console.log('[Firebase.js] Instância Firebase criada, auth inicializado.');
    }

    /**
     * initAuth DEVE APENAS verificar o estado de autenticação atual.
     * NÃO DEVE tentar iniciar o login (popup/redirect) por si só.
     */
    initAuth() {
        return new Promise((resolve, reject) => {
            console.log('[Firebase.js] initAuth: Configurando onAuthStateChanged...');
            const unsubscribe = this._auth.onAuthStateChanged(user => {
                unsubscribe(); // Desinscreve para evitar múltiplas chamadas se initAuth for chamado novamente.
                if (user) {
                    console.log('[Firebase.js] initAuth: Usuário ENCONTRADO via onAuthStateChanged:', user.uid);
                    user.getIdToken().then(token => {
                        resolve({ user, token });
                    }).catch(error => {
                        console.error("[Firebase.js] initAuth: Erro ao obter token ID:", error);
                        resolve({ user, token: null }); // Ou reject
                    });
                } else {
                    console.log('[Firebase.js] initAuth: Nenhum usuário logado via onAuthStateChanged.');
                    reject(new Error("Usuário não autenticado.")); // Importante para o .catch no WhatsAppController
                }
            }, error => {
                console.error("[Firebase.js] initAuth: Erro no listener onAuthStateChanged:", error);
                reject(error);
            });
        });
    }

    /**
     * signInWithGoogle DEVE ser o método que ATIVAMENTE inicia o processo de login.
     */
    signInWithGoogle() {
        console.log('[Firebase.js] signInWithGoogle: Iniciando signInWithPopup...');
        const provider = new firebase.auth.GoogleAuthProvider(); // Sintaxe v8
        // Adicione escopos se necessário:
        // provider.addScope('profile');
        // provider.addScope('email');

        return this._auth.signInWithPopup(provider) // Sintaxe v8
            .then(result => {
                const user = result.user;
                console.log('[Firebase.js] signInWithGoogle: Login com Popup BEM-SUCEDIDO:', user.uid);
                return user.getIdToken().then(token => {
                    return { user, token };
                });
            })
            .catch(error => {
                console.error("[Firebase.js] signInWithGoogle: Erro no login com Popup.");
                console.error("[Firebase.js] signInWithGoogle: Código do Erro:", error.code);
                console.error("[Firebase.js] signInWithGoogle: Mensagem do Erro:", error.message);
                console.error("[Firebase.js] signInWithGoogle: Objeto de Erro Completo:", error);
                // Erros comuns aqui incluem:
                // error.code === 'auth/popup-closed-by-user'
                // error.code === 'auth/cancelled-popup-request'
                // error.code === 'auth/popup-blocked'
                // error.code === 'auth/operation-not-allowed' (verifique se Google Sign-In está habilitado no Firebase Console e se localhost está nos domínios autorizados)
                // O erro de COOP pode mascarar ou causar outros erros aqui.
                throw error;
            });
    }

    // Exemplo de método de logout
    // signOutUser() {
    //     console.log('[Firebase.js] signOutUser: Deslogando usuário.');
    //     return this._auth.signOut(); // Sintaxe v8
    // }



    getDb(){
        return this._db;
    }

    getStorage(){
        return this._storage;
    }
}
