import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';

export const usePriceHistory = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);

  // Registrar cambio de precio (solo admin)
  const recordPriceChange = useCallback(async (productId, oldPrice, newPrice, reason = '') => {
    if (!user || user.role !== 'admin') {
      addToast('No tienes permisos para esta acción', 'error');
      return false;
    }

    setLoading(true);
    try {
      const priceChangeData = {
        productId,
        oldPrice: parseFloat(oldPrice),
        newPrice: parseFloat(newPrice),
        changeDate: new Date(),
        changedBy: user.uid,
        reason: reason || 'Actualización de precio',
        changeType: newPrice > oldPrice ? 'increase' : 'decrease',
        percentageChange: ((newPrice - oldPrice) / oldPrice * 100).toFixed(2)
      };

      await addDoc(collection(db, 'price_history'), priceChangeData);
      addToast('Cambio de precio registrado', 'success');
      return true;

    } catch (error) {
      console.error('Error recording price change:', error);
      addToast('Error al registrar cambio de precio', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  // Obtener historial de precios de un producto
  const getPriceHistory = useCallback(async (productId) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'price_history'),
        where('productId', '==', productId),
        orderBy('changeDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPriceHistory(history);
      return history;

    } catch (error) {
      console.error('Error getting price history:', error);
      addToast('Error al obtener historial de precios', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Obtener precio más bajo histórico
  const getLowestPrice = useCallback((history) => {
    if (!history || history.length === 0) return null;
    return Math.min(...history.map(h => h.newPrice));
  }, []);

  // Calcular si el precio actual es el más bajo
  const isLowestPrice = useCallback((currentPrice, history) => {
    const lowest = getLowestPrice(history);
    return lowest !== null && currentPrice <= lowest;
  }, [getLowestPrice]);

  // Obtener productos con alertas de precio bajo
  const getPriceAlerts = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const alertsRef = collection(db, 'price_alerts');
      const q = query(alertsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return alerts;

    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Crear alerta de precio
  const createPriceAlert = useCallback(async (productId, targetPrice) => {
    if (!user) {
      addToast('Debes iniciar sesión para crear alertas', 'error');
      return false;
    }

    setLoading(true);
    try {
      // Verificar si ya existe una alerta para este producto
      const alertsRef = collection(db, 'price_alerts');
      const q = query(
        alertsRef,
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );
      const existingAlerts = await getDocs(q);

      if (!existingAlerts.empty) {
        addToast('Ya tienes una alerta para este producto', 'info');
        return false;
      }

      const alertData = {
        userId: user.uid,
        productId,
        targetPrice: parseFloat(targetPrice),
        createdAt: new Date(),
        isActive: true,
        notified: false
      };

      await addDoc(alertsRef, alertData);
      addToast('Alerta de precio creada exitosamente', 'success');
      return true;

    } catch (error) {
      console.error('Error creating price alert:', error);
      addToast('Error al crear alerta de precio', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  // Eliminar alerta de precio
  const removePriceAlert = useCallback(async (alertId) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'price_alerts', alertId), {
        isActive: false,
        deletedAt: new Date()
      });

      addToast('Alerta eliminada', 'success');
      return true;

    } catch (error) {
      console.error('Error removing price alert:', error);
      addToast('Error al eliminar alerta', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Verificar y enviar alertas (función para cron job)
  const checkAndSendAlerts = useCallback(async (currentPrice, productId) => {
    try {
      const alertsRef = collection(db, 'price_alerts');
      const q = query(
        alertsRef,
        where('productId', '==', productId),
        where('isActive', '==', true),
        where('notified', '==', false)
      );

      const querySnapshot = await getDocs(q);

      const triggeredAlerts = [];
      querySnapshot.forEach(async (document) => {
        const alert = document.data();
        if (currentPrice <= alert.targetPrice) {
          triggeredAlerts.push({
            id: document.id,
            ...alert
          });

          // Marcar como notificada
          await updateDoc(doc(db, 'price_alerts', document.id), {
            notified: true,
            notifiedAt: new Date(),
            triggeredPrice: currentPrice
          });
        }
      });

      return triggeredAlerts;

    } catch (error) {
      console.error('Error checking price alerts:', error);
      return [];
    }
  }, []);

  return {
    recordPriceChange,
    getPriceHistory,
    getLowestPrice,
    isLowestPrice,
    getPriceAlerts,
    createPriceAlert,
    removePriceAlert,
    checkAndSendAlerts,
    priceHistory,
    loading
  };
};
