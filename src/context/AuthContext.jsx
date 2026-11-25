import { createContext, useContext, useEffect, useState } from 'react';
import {
 onAuthStateChanged, signInWithPopup, signOut,
 createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
 sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { crearOActualizarUsuario, suscribirUsuario } from '../firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [perfil, setPerfil] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const timeout = setTimeout(() => setLoading(false), 5000);

 let unsubPerfil = () => {};
 let unsub = () => {};

 try {
 unsub = onAuthStateChanged(auth, async (firebaseUser) => {
 clearTimeout(timeout);
 // Limpiar listener anterior del perfil
 unsubPerfil();
 unsubPerfil = () => {};

 if (firebaseUser) {
 setUser(firebaseUser);
 try {
 await crearOActualizarUsuario(firebaseUser);
 // Listener en tiempo real sobre el documento del usuario en Firestore
 unsubPerfil = suscribirUsuario(firebaseUser.uid, (perfilData) => {
 setPerfil(perfilData);
 setLoading(false);
 });
 } catch (e) {
 console.warn('Firestore:', e);
 setLoading(false);
 }
 } else {
 setUser(null);
 setPerfil(null);
 setLoading(false);
 }
 });
 } catch (e) {
 clearTimeout(timeout);
 setLoading(false);
 }

 return () => { clearTimeout(timeout); unsub(); unsubPerfil(); };
 }, []);

 const loginConGoogle = async () => {
 const result = await signInWithPopup(auth, googleProvider);
 return result.user;
 };

 const registrarConEmail = async (nombre, email, password, extras = {}) => {
 const result = await createUserWithEmailAndPassword(auth, email, password);
 await updateProfile(result.user, { displayName: nombre });
 await crearOActualizarUsuario({ ...result.user, displayName: nombre }, extras);
 return result.user;
 };

 const loginConEmail = async (email, password) => {
 const result = await signInWithEmailAndPassword(auth, email, password);
 return result.user;
 };

 const logout = async () => {
 await signOut(auth);
 };

 const resetearPassword = async (email) => {
 auth.languageCode = 'es';
 await sendPasswordResetEmail(auth, email);
 };

 // Actualización local inmediata de perfil (antes de que llegue el snapshot de Firestore)
 const actualizarPerfilLocal = (campos) => {
 setPerfil(prev => prev ? { ...prev, ...campos } : campos);
 };

 // Mantenido por compatibilidad
 const refrescarPerfil = async () => {};

 // Derivar rol desde el perfil
 const esCancha = perfil?.rol === 'cancha';
 const esAdmin = perfil?.admin === true || perfil?.rol === 'admin';

 return (
 <AuthContext.Provider value={{
 user, perfil, loading,
 esCancha, esAdmin,
 loginConGoogle, registrarConEmail, loginConEmail,
 logout, refrescarPerfil, actualizarPerfilLocal, resetearPassword,
 }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 return useContext(AuthContext);
}
