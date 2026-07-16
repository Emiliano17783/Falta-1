import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { crearOActualizarUsuario, obtenerUsuario } from '../firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(timeout);
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            await crearOActualizarUsuario(firebaseUser);
            const p = await obtenerUsuario(firebaseUser.uid);
            setPerfil(p);
          } catch (e) {
            console.warn('Firestore:', e);
          }
        } else {
          setUser(null);
          setPerfil(null);
        }
        setLoading(false);
      });
    } catch (e) {
      clearTimeout(timeout);
      setLoading(false);
    }

    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  const loginConGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  const registrarConEmail = async (nombre, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: nombre });
    await crearOActualizarUsuario({ ...result.user, displayName: nombre });
    return result.user;
  };

  const loginConEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refrescarPerfil = async () => {
    if (user) {
      const p = await obtenerUsuario(user.uid);
      setPerfil(p);
    }
  };

  // Derivar rol desde el perfil
  const esCancha = perfil?.rol === 'cancha';
  const esAdmin  = perfil?.admin === true || perfil?.rol === 'admin';

  return (
    <AuthContext.Provider value={{
      user, perfil, loading,
      esCancha, esAdmin,
      loginConGoogle, registrarConEmail, loginConEmail,
      logout, refrescarPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
