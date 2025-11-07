// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Limpiar errores
  const clearError = () => setError(null);

  // Registrar usuario (email/password)
  const signup = async (email, password, displayName = '') => {
    try {
      setError(null);
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      // Crear documento en Firestore (usuarios) con role por defecto
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        nombre: displayName || '',
        email,
        role: 'usuario',
        creado: serverTimestamp(),
        ultimoAcceso: serverTimestamp(),
        emailVerificado: false,
        activo: true,
      });

      // Enviar email de verificación
      if (cred.user) {
        await sendEmailVerification(cred.user);
      }

      return cred;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    console.log('🔐 Login attempted with email:', email);
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful for user:', result.user.uid);

      // Actualizar último acceso
      if (result.user) {
        await updateLastAccess(result.user.uid);
      }

      return result;
    } catch (error) {
      console.error('❌ Login error:', error.code, error.message);
      setError(error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  // Recuperar contraseña
  const resetPassword = async email => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  // Actualizar último acceso
  const updateLastAccess = async uid => {
    try {
      const userRef = doc(db, 'usuarios', uid);
      await updateDoc(userRef, {
        ultimoAcceso: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last access:', error);
    }
  };

  // Cargar profile extra desde Firestore
  const loadProfile = useCallback(async uid => {
    try {
      const docRef = doc(db, 'usuarios', uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const profileData = { id: snap.id, ...snap.data() };
        setProfile(profileData);

        // Actualizar último acceso
        await updateLastAccess(uid);
      } else {
        // Si no existe, crear con role 'usuario' por defecto
        const newProfileData = {
          role: 'usuario',
          creado: serverTimestamp(),
          ultimoAcceso: serverTimestamp(),
          email: auth.currentUser?.email || '',
          nombre: auth.currentUser?.displayName || '',
          emailVerificado: auth.currentUser?.emailVerified || false,
          activo: true,
        };

        await setDoc(docRef, newProfileData, { merge: true });

        const newSnap = await getDoc(docRef);
        setProfile({ id: newSnap.id, ...newSnap.data() });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error);
    }
  }, []);

  // Actualizar perfil
  const updateUserProfile = async updates => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');

      const userRef = doc(db, 'usuarios', user.uid);
      await updateDoc(userRef, {
        ...updates,
        ultimaActualizacion: serverTimestamp(),
      });

      // Recargar perfil
      await loadProfile(user.uid);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  // Verificar si el usuario es admin
  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return !!user;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        await loadProfile(u.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadProfile]);

  const value = {
    user,
    profile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    loadProfile,
    updateUserProfile,
    isAdmin,
    isAuthenticated,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
