import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';
import { validateReview } from '../utils/validators'; // Assume validation utility

export const useReviews = productId => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  // Real-time fetch with onSnapshot
  useEffect(() => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      orderBy('__name__', 'desc') // Add composite index workaround
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(reviewsData);
        setLoading(false);
      },
      err => {
        console.error('Error fetching reviews:', err);
        setError(err.message);
        setLoading(false);
        addToast('Error al cargar reseñas', 'error');
      }
    );

    return () => unsubscribe();
  }, [productId, addToast]);

  const addReview = useCallback(
    async (rating, comment) => {
      if (!user) {
        addToast('Debes estar logueado para agregar reseñas', 'error');
        return false;
      }

      const validation = validateReview(rating, comment);
      if (!validation.isValid) {
        addToast(validation.message, 'error');
        return false;
      }

      try {
        await addDoc(collection(db, 'reviews'), {
          productId,
          userId: user.uid,
          userName: user.displayName || user.email,
          rating,
          comment: comment.trim(),
          adminReview: false, // Flag for moderation
          createdAt: serverTimestamp(),
        });
        addToast('Reseña agregada exitosamente', 'success');
        return true;
      } catch (err) {
        console.error('Error adding review:', err);
        addToast('Error al agregar reseña', 'error');
        return false;
      }
    },
    [productId, user, addToast]
  );

  // Memoized average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
    );
  }, [reviews]);

  return {
    reviews,
    loading,
    error,
    averageRating,
    addReview,
    reviewCount: reviews.length,
  };
};
