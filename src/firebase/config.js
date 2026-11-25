import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Configuración Firebase — reemplazá con los valores de tu proyecto en Firebase Console
// Ver README.md para instrucciones paso a paso
const firebaseConfig = {
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
 appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

if (import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
 prompt: 'select_account',
 locale: 'es',
});

export default app;
