// src/hooks/useCreateUserDoc.js
import { useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function useCreateUserDoc() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ensureUserDoc = async () => {
      try {
        const ref = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // Crear documento por primera vez
          await setDoc(ref, {
            nombre: user.displayName || 'Usuario',
            email: user.email,
            role: 'usuario',
            creado: new Date(),
          });
          console.log("✅ Documento creado en 'usuarios'");
        }
      } catch (error) {
        console.error('❌ Error creando usuario en Firestore:', error);
      }
    };

    ensureUserDoc();
  }, [user]);
}
