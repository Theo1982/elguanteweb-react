import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const useRecommendations = (productId, options = {}) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    limit: recLimit = 6,
    includePurchased = false,
    strategy = 'hybrid', // 'category', 'popular', 'user-based', 'hybrid'
  } = options;

  // Cache para evitar recalculos innecesarios
  const cacheKey = useMemo(() => {
    return `${productId}-${strategy}-${recLimit}-${currentUser?.uid || 'anonymous'}`;
  }, [productId, strategy, recLimit, currentUser?.uid]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        // Obtener el producto actual para conocer su categoría
        const productRef = doc(db, 'productos', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          setError('Producto no encontrado');
          return;
        }

        const currentProduct = { id: productSnap.id, ...productSnap.data() };
        let recommendedProducts = [];

        // Estrategia híbrida: combinar múltiples enfoques
        if (strategy === 'hybrid' || strategy === 'category') {
          // 1. Productos de la misma categoría
          const categoryQuery = query(
            collection(db, 'productos'),
            where('categoria', '==', currentProduct.categoria),
            where('id', '!=', productId),
            where('stock', '>', 0),
            limit(Math.ceil(recLimit * 0.4)) // 40% de recomendaciones
          );

          const categorySnap = await getDocs(categoryQuery);
          const categoryProducts = categorySnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            reason: 'Misma categoría',
          }));

          recommendedProducts.push(...categoryProducts);
        }

        if (strategy === 'hybrid' || strategy === 'popular') {
          // 2. Productos populares (más vendidos)
          const popularQuery = query(
            collection(db, 'productos'),
            where('stock', '>', 0),
            orderBy('ventas', 'desc'),
            limit(Math.ceil(recLimit * 0.3)) // 30% de recomendaciones
          );

          const popularSnap = await getDocs(popularQuery);
          const popularProducts = popularSnap.docs
            .filter(doc => doc.id !== productId)
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              reason: 'Más vendido',
            }));

          recommendedProducts.push(...popularProducts);
        }

        if ((strategy === 'hybrid' || strategy === 'user-based') && currentUser) {
          // 3. Basado en historial del usuario
          try {
            const userOrdersQuery = query(
              collection(db, 'ordenes'),
              where('userId', '==', currentUser.uid),
              orderBy('createdAt', 'desc'),
              limit(10)
            );

            const ordersSnap = await getDocs(userOrdersQuery);
            const userProductIds = new Set();

            ordersSnap.docs.forEach(orderDoc => {
              const order = orderDoc.data();
              order.items?.forEach(item => {
                if (item.id !== productId) {
                  userProductIds.add(item.id);
                }
              });
            });

            if (userProductIds.size > 0) {
              // Buscar productos similares a los comprados por el usuario
              const userProductsQuery = query(
                collection(db, 'productos'),
                where('__name__', 'in', Array.from(userProductIds).slice(0, 10)),
                where('stock', '>', 0)
              );

              const userProductsSnap = await getDocs(userProductsQuery);
              const userCategories = new Set();

              userProductsSnap.docs.forEach(doc => {
                const product = doc.data();
                if (product.categoria) {
                  userCategories.add(product.categoria);
                }
              });

              // Recomendar productos de categorías que el usuario ha comprado
              if (userCategories.size > 0) {
                const userCategoryQuery = query(
                  collection(db, 'productos'),
                  where('categoria', 'in', Array.from(userCategories)),
                  where('id', '!=', productId),
                  where('stock', '>', 0),
                  limit(Math.ceil(recLimit * 0.3)) // 30% de recomendaciones
                );

                const userCategorySnap = await getDocs(userCategoryQuery);
                const userBasedProducts = userCategorySnap.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  reason: 'Te puede interesar',
                }));

                recommendedProducts.push(...userBasedProducts);
              }
            }
          } catch (userError) {
            console.warn('Error fetching user-based recommendations:', userError);
          }
        }

        // Eliminar duplicados y limitar resultados
        const uniqueProducts = recommendedProducts
          .filter((product, index, self) =>
            index === self.findIndex(p => p.id === product.id)
          )
          .slice(0, recLimit);

        // Si no hay suficientes recomendaciones, agregar productos aleatorios populares
        if (uniqueProducts.length < recLimit) {
          const remaining = recLimit - uniqueProducts.length;
          const fallbackQuery = query(
            collection(db, 'productos'),
            where('stock', '>', 0),
            orderBy('ventas', 'desc'),
            limit(remaining + 10) // Extra para filtrar
          );

          const fallbackSnap = await getDocs(fallbackQuery);
          const fallbackProducts = fallbackSnap.docs
            .filter(doc => {
              const product = doc.data();
              return (
                doc.id !== productId &&
                !uniqueProducts.some(rec => rec.id === doc.id)
              );
            })
            .slice(0, remaining)
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              reason: 'Popular',
            }));

          uniqueProducts.push(...fallbackProducts);
        }

        setRecommendations(uniqueProducts);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Error al cargar recomendaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, currentUser, strategy, recLimit, cacheKey]);

  return {
    recommendations,
    loading,
    error,
    refetch: () => {
      // Implementar refetch si es necesario
    },
  };
};

export default useRecommendations;
