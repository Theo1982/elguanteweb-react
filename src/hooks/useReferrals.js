import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';

export const useReferrals = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  // Generar código de referido único
  const generateReferralCode = useCallback(() => {
    if (!user?.uid) return '';
    const baseCode = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User';
    const randomNum = Math.floor(Math.random() * 1000);
    return `${baseCode}${randomNum}`.toUpperCase();
  }, [user]);

  // Inicializar sistema de referidos para el usuario
  const initializeReferrals = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Crear documento de usuario si no existe
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          referralCode: generateReferralCode(),
          referralStats: {
            totalReferrals: 0,
            pendingReferrals: 0,
            completedReferrals: 0,
            totalEarnings: 0,
          },
          createdAt: new Date(),
        });
      } else {
        // Actualizar código si no tiene uno
        const userData = userSnap.data();
        if (!userData.referralCode) {
          await updateDoc(userRef, {
            referralCode: generateReferralCode(),
          });
        }
      }
    } catch (error) {
      console.error('Error initializing referrals:', error);
      addToast('Error al inicializar sistema de referidos', 'error');
    }
  }, [user, generateReferralCode, addToast]);

  // Obtener código de referido del usuario
  const fetchReferralCode = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setReferralCode(userData.referralCode || '');
        setStats(userData.referralStats || stats);
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  }, [user, stats]);

  // Obtener lista de referidos
  const fetchReferrals = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referrerId', '==', user.uid));
      const querySnap = await getDocs(q);

      const referralsData = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReferrals(referralsData);

      // Actualizar estadísticas
      const completed = referralsData.filter(r => r.status === 'completed').length;
      const pending = referralsData.filter(r => r.status === 'pending').length;
      const totalEarnings = referralsData
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.reward || 0), 0);

      setStats({
        totalReferrals: referralsData.length,
        pendingReferrals: pending,
        completedReferrals: completed,
        totalEarnings,
      });

    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  }, [user]);

  // Registrar nuevo referido
  const registerReferral = useCallback(async (referralCode) => {
    if (!user?.uid) return false;

    try {
      // Buscar usuario que tiene este código
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('referralCode', '==', referralCode));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        addToast('Código de referido inválido', 'error');
        return false;
      }

      const referrerDoc = querySnap.docs[0];
      const referrerId = referrerDoc.id;

      // Verificar que no se esté refiriendo a sí mismo
      if (referrerId === user.uid) {
        addToast('No puedes usar tu propio código de referido', 'error');
        return false;
      }

      // Verificar que no haya sido referido antes
      const existingRef = query(
        collection(db, 'referrals'),
        where('referredId', '==', user.uid)
      );
      const existingSnap = await getDocs(existingRef);

      if (!existingSnap.empty) {
        addToast('Ya has sido referido por alguien', 'warning');
        return false;
      }

      // Crear registro de referido
      await addDoc(collection(db, 'referrals'), {
        referrerId,
        referredId: user.uid,
        referredEmail: user.email,
        status: 'pending', // pendiente hasta primera compra
        reward: 50, // puntos de recompensa
        createdAt: new Date(),
      });

      addToast('¡Código de referido aplicado exitosamente!', 'success');
      return true;

    } catch (error) {
      console.error('Error registering referral:', error);
      addToast('Error al aplicar código de referido', 'error');
      return false;
    }
  }, [user, addToast]);

  // Compartir código de referido
  const shareReferralCode = useCallback(async () => {
    if (!referralCode) return;

    const shareUrl = `${window.location.origin}?ref=${referralCode}`;
    const shareText = `¡Únete a ElGuante y obtén descuentos exclusivos! Usa mi código: ${referralCode}\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a ElGuante',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare(shareText);
      }
    } else {
      fallbackShare(shareText);
    }
  }, [referralCode]);

  const fallbackShare = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('Código copiado al portapapeles', 'success');
    }).catch(() => {
      addToast('Comparte este enlace: ' + text, 'info');
    });
  };

  // Procesar referido completado (llamar desde backend después de compra)
  const completeReferral = useCallback(async (referredId) => {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(
        referralsRef,
        where('referredId', '==', referredId),
        where('status', '==', 'pending')
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const referralDoc = querySnap.docs[0];
        await updateDoc(doc(db, 'referrals', referralDoc.id), {
          status: 'completed',
          completedAt: new Date(),
        });

        // Actualizar estadísticas del referrer
        const referrerRef = doc(db, 'usuarios', referralDoc.data().referrerId);
        const referrerSnap = await getDoc(referrerRef);

        if (referrerSnap.exists()) {
          const currentStats = referrerSnap.data().referralStats || stats;
          await updateDoc(referrerRef, {
            referralStats: {
              ...currentStats,
              completedReferrals: currentStats.completedReferrals + 1,
              totalEarnings: currentStats.totalEarnings + 50,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error completing referral:', error);
    }
  }, [stats]);

  useEffect(() => {
    if (user?.uid) {
      initializeReferrals();
      fetchReferralCode();
      fetchReferrals();
    }
    setLoading(false);
  }, [user, initializeReferrals, fetchReferralCode, fetchReferrals]);

  return {
    referralCode,
    referrals,
    stats,
    loading,
    registerReferral,
    shareReferralCode,
    completeReferral,
    refreshReferrals: fetchReferrals,
  };
};
