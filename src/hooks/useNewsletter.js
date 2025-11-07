import { useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';

export const useNewsletter = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState([]);

  // Suscribirse al newsletter
  const subscribe = useCallback(async (email, interests = []) => {
    if (!email) {
      addToast('Por favor ingresa un email válido', 'error');
      return false;
    }

    setLoading(true);
    try {
      // Verificar si ya está suscrito
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = query(subscribersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        addToast('Ya estás suscrito a nuestro newsletter', 'info');
        return false;
      }

      // Crear nueva suscripción
      const subscriberData = {
        email,
        interests,
        subscribedAt: new Date(),
        isActive: true,
        source: user ? 'authenticated' : 'guest',
        userId: user?.uid || null,
        preferences: {
          productUpdates: true,
          promotions: true,
          newsletter: true,
          orderUpdates: !!user
        }
      };

      await addDoc(subscribersRef, subscriberData);
      addToast('¡Te has suscrito exitosamente a nuestro newsletter!', 'success');
      return true;

    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      addToast('Error al suscribirte. Inténtalo de nuevo.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  // Desuscribirse
  const unsubscribe = useCallback(async (email) => {
    setLoading(true);
    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = query(subscribersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        addToast('Email no encontrado en nuestra lista', 'error');
        return false;
      }

      const subscriberDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'newsletter_subscribers', subscriberDoc.id), {
        isActive: false,
        unsubscribedAt: new Date()
      });

      addToast('Te has desuscrito exitosamente', 'success');
      return true;

    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      addToast('Error al desuscribirte. Inténtalo de nuevo.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Obtener suscriptores (solo admin)
  const getSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = query(subscribersRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      const subscribersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSubscribers(subscribersData);
      return subscribersData;

    } catch (error) {
      console.error('Error getting subscribers:', error);
      addToast('Error al obtener suscriptores', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Actualizar preferencias
  const updatePreferences = useCallback(async (subscriberId, preferences) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'newsletter_subscribers', subscriberId), {
        preferences,
        updatedAt: new Date()
      });

      addToast('Preferencias actualizadas', 'success');
      return true;

    } catch (error) {
      console.error('Error updating preferences:', error);
      addToast('Error al actualizar preferencias', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  return {
    subscribe,
    unsubscribe,
    getSubscribers,
    updatePreferences,
    subscribers,
    loading
  };
};
