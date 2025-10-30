import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';

export const useCoupons = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Obtener cupones disponibles (para admin)
  const fetchCoupons = useCallback(async () => {
    if (!user) return;

    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, orderBy('createdAt', 'desc'));
      const querySnap = await getDocs(q);

      const couponsData = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt,
      }));

      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      addToast('Error al cargar cupones', 'error');
    }
  }, [user, addToast]);

  // Obtener cupones del usuario
  const fetchUserCoupons = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userCouponsRef = collection(db, 'userCoupons');
      const q = query(
        userCouponsRef,
        where('userId', '==', user.uid),
        where('used', '==', false),
        orderBy('expiresAt', 'asc')
      );
      const querySnap = await getDocs(q);

      const userCouponsData = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt,
      }));

      setUserCoupons(userCouponsData);
    } catch (error) {
      console.error('Error fetching user coupons:', error);
    }
  }, [user]);

  // Crear nuevo cupón (solo admin)
  const createCoupon = useCallback(async (couponData) => {
    try {
      const couponsRef = collection(db, 'coupons');
      const newCoupon = {
        ...couponData,
        code: couponData.code.toUpperCase(),
        createdAt: new Date(),
        usedCount: 0,
        active: true,
      };

      await addDoc(couponsRef, newCoupon);
      addToast('Cupón creado exitosamente', 'success');
      fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error creating coupon:', error);
      addToast('Error al crear cupón', 'error');
      return false;
    }
  }, [addToast, fetchCoupons]);

  // Aplicar cupón al carrito
  const applyCoupon = useCallback(async (code, cartTotal) => {
    if (!user?.uid || !code) return null;

    setApplyingCoupon(true);
    try {
      const couponCode = code.toUpperCase();

      // Buscar cupón activo
      const couponsRef = collection(db, 'coupons');
      const q = query(
        couponsRef,
        where('code', '==', couponCode),
        where('active', '==', true)
      );
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        addToast('Cupón no encontrado o expirado', 'error');
        return null;
      }

      const couponDoc = querySnap.docs[0];
      const coupon = {
        id: couponDoc.id,
        ...couponDoc.data(),
        expiresAt: couponDoc.data().expiresAt?.toDate?.() || couponDoc.data().expiresAt,
      };

      // Verificar expiración
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        addToast('Este cupón ha expirado', 'error');
        return null;
      }

      // Verificar límite de uso
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        addToast('Este cupón ya no está disponible', 'error');
        return null;
      }

      // Verificar si el usuario ya usó este cupón
      if (coupon.onePerUser) {
        const userCouponsRef = collection(db, 'userCoupons');
        const userQ = query(
          userCouponsRef,
          where('userId', '==', user.uid),
          where('couponId', '==', coupon.id),
          where('used', '==', true)
        );
        const userSnap = await getDocs(userQ);

        if (!userSnap.empty) {
          addToast('Ya has usado este cupón', 'error');
          return null;
        }
      }

      // Verificar monto mínimo
      if (coupon.minAmount && cartTotal < coupon.minAmount) {
        addToast(`Este cupón requiere un mínimo de $${coupon.minAmount}`, 'error');
        return null;
      }

      // Calcular descuento
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = Math.min(coupon.discountValue, cartTotal);
      }

      addToast(`Cupón aplicado: -$${discount.toFixed(2)}`, 'success');
      return {
        ...coupon,
        calculatedDiscount: discount,
      };

    } catch (error) {
      console.error('Error applying coupon:', error);
      addToast('Error al aplicar cupón', 'error');
      return null;
    } finally {
      setApplyingCoupon(false);
    }
  }, [user, addToast]);

  // Registrar uso de cupón
  const useCoupon = useCallback(async (couponId, discount) => {
    if (!user?.uid) return;

    try {
      // Actualizar contador de uso del cupón
      const couponRef = doc(db, 'coupons', couponId);
      const couponSnap = await getDoc(couponRef);

      if (couponSnap.exists()) {
        const currentCount = couponSnap.data().usedCount || 0;
        await updateDoc(couponRef, {
          usedCount: currentCount + 1,
        });
      }

      // Registrar uso para el usuario
      const userCouponsRef = collection(db, 'userCoupons');
      await addDoc(userCouponsRef, {
        userId: user.uid,
        couponId,
        discount,
        used: true,
        usedAt: new Date(),
      });

    } catch (error) {
      console.error('Error registering coupon usage:', error);
    }
  }, [user]);

  // Asignar cupón a usuario específico
  const assignCouponToUser = useCallback(async (userId, couponId) => {
    try {
      const userCouponsRef = collection(db, 'userCoupons');
      await addDoc(userCouponsRef, {
        userId,
        couponId,
        assignedAt: new Date(),
        used: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      });

      addToast('Cupón asignado al usuario', 'success');
      return true;
    } catch (error) {
      console.error('Error assigning coupon:', error);
      addToast('Error al asignar cupón', 'error');
      return false;
    }
  }, [addToast]);

  // Desactivar cupón
  const deactivateCoupon = useCallback(async (couponId) => {
    try {
      const couponRef = doc(db, 'coupons', couponId);
      await updateDoc(couponRef, {
        active: false,
      });

      addToast('Cupón desactivado', 'success');
      fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      addToast('Error al desactivar cupón', 'error');
      return false;
    }
  }, [addToast, fetchCoupons]);

  // Generar código único
  const generateCouponCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  useEffect(() => {
    if (user) {
      fetchCoupons();
      fetchUserCoupons();
    }
    setLoading(false);
  }, [user, fetchCoupons, fetchUserCoupons]);

  return {
    coupons,
    userCoupons,
    loading,
    applyingCoupon,
    createCoupon,
    applyCoupon,
    useCoupon,
    assignCouponToUser,
    deactivateCoupon,
    generateCouponCode,
    refreshCoupons: fetchCoupons,
    refreshUserCoupons: fetchUserCoupons,
  };
};
