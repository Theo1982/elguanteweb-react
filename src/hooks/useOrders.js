import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from './useToast';

export const useOrders = (userId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      orderBy('__name__', 'desc') // Add composite index workaround
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError(err.message);
        setLoading(false);
        addToast('Error al cargar órdenes', 'error');
      }
    );

    return () => unsubscribe();
  }, [userId, addToast]);

  const hasPurchasedProduct = useCallback((productId) => {
    return orders.some(order => order.productIds && order.productIds.includes(productId));
  }, [orders]);

  return {
    orders,
    loading,
    error,
    hasPurchasedProduct
  };
};
