// src/hooks/useSmartCache.js
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from './useToast';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 100; // Máximo productos en cache

export const useSmartCache = () => {
  const [cache, setCache] = useState(new Map());
  const [lastFetch, setLastFetch] = useState(new Map());
  const { showToast } = useToast();

  // Función para verificar si el cache es válido
  const isCacheValid = useCallback(
    key => {
      const lastFetchTime = lastFetch.get(key);
      if (!lastFetchTime) return false;

      const now = Date.now();
      return now - lastFetchTime < CACHE_DURATION;
    },
    [lastFetch]
  );

  // Función para limpiar cache antiguo
  const cleanOldCache = useCallback(() => {
    const now = Date.now();
    const keysToDelete = [];

    lastFetch.forEach((timestamp, key) => {
      if (now - timestamp > CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });

    if (keysToDelete.length > 0) {
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        keysToDelete.forEach(key => newCache.delete(key));
        return newCache;
      });

      setLastFetch(prevLastFetch => {
        const newLastFetch = new Map(prevLastFetch);
        keysToDelete.forEach(key => newLastFetch.delete(key));
        return newLastFetch;
      });

      console.log(
        `🧹 Cache limpiado: ${keysToDelete.length} entradas eliminadas`
      );
    }
  }, [lastFetch]);

  // Función para obtener productos del cache
  const getCachedProducts = useCallback(
    key => {
      if (isCacheValid(key)) {
        return cache.get(key);
      }
      return null;
    },
    [cache, isCacheValid]
  );

  // Función para guardar productos en cache
  const setCachedProducts = useCallback(
    (key, products) => {
      setCache(prevCache => {
        const newCache = new Map(prevCache);

        // Si el cache está lleno, eliminar el más antiguo
        if (newCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = Array.from(lastFetch.entries()).sort(
            (a, b) => a[1] - b[1]
          )[0]?.[0];

          if (oldestKey) {
            newCache.delete(oldestKey);
          }
        }

        newCache.set(key, products);
        return newCache;
      });

      setLastFetch(prevLastFetch => {
        const newLastFetch = new Map(prevLastFetch);
        newLastFetch.set(key, Date.now());
        return newLastFetch;
      });
    },
    [lastFetch]
  );

  // Función para generar clave de cache
  const generateCacheKey = useCallback((filters, pagination) => {
    const { category, search, sortBy, sortOrder } = filters;
    const { page, limit: pageLimit } = pagination;

    return `products_${category || 'all'}_${search || ''}_${sortBy || 'nombre'}_${sortOrder || 'asc'}_${page}_${pageLimit}`;
  }, []);

  // Función para buscar productos con cache inteligente
  const fetchProductsWithCache = useCallback(
    async (filters = {}, pagination = {}) => {
      const cacheKey = generateCacheKey(filters, pagination);

      // Intentar obtener del cache primero
      const cachedProducts = getCachedProducts(cacheKey);
      if (cachedProducts) {
        console.log('📦 Productos obtenidos del cache:', cacheKey);
        return cachedProducts;
      }

      try {
        // Construir consulta de Firestore
        let firestoreQuery = collection(db, 'productos');
        let queryConstraints = [];

        // Filtros
        if (filters.category && filters.category !== 'all') {
          queryConstraints.push(where('categoria', '==', filters.category));
        }

        if (filters.search) {
          // Búsqueda por nombre (case insensitive)
          queryConstraints.push(where('nombre', '>=', filters.search));
          queryConstraints.push(
            where('nombre', '<=', filters.search + '\uf8ff')
          );
        }

        // Ordenamiento
        const sortField = filters.sortBy || 'nombre';
        const sortDirection = filters.sortOrder === 'desc' ? 'desc' : 'asc';
        queryConstraints.push(orderBy(sortField, sortDirection));

        // Paginación
        const pageLimit = pagination.limit || 12;
        queryConstraints.push(limit(pageLimit));

        if (pagination.startAfter) {
          queryConstraints.push(startAfter(pagination.startAfter));
        }

        // Ejecutar consulta
        const q = query(firestoreQuery, ...queryConstraints);
        const querySnapshot = await getDocs(q);

        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Guardar en cache
        setCachedProducts(cacheKey, products);

        console.log('🔥 Productos obtenidos de Firestore:', products.length);
        return products;
      } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        showToast('Error al cargar productos', 'error');
        return [];
      }
    },
    [generateCacheKey, getCachedProducts, setCachedProducts, showToast]
  );

  // Función para invalidar cache específico
  const invalidateCache = useCallback(pattern => {
    setCache(prevCache => {
      const newCache = new Map();

      prevCache.forEach((value, key) => {
        if (!key.includes(pattern)) {
          newCache.set(key, value);
        }
      });

      return newCache;
    });

    setLastFetch(prevLastFetch => {
      const newLastFetch = new Map();

      prevLastFetch.forEach((value, key) => {
        if (!key.includes(pattern)) {
          newLastFetch.set(key, value);
        }
      });

      return newLastFetch;
    });

    console.log(`🚫 Cache invalidado para patrón: ${pattern}`);
  }, []);

  // Función para obtener estadísticas del cache
  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      maxSize: MAX_CACHE_SIZE,
      cacheDuration: CACHE_DURATION,
      lastFetchTimes: Object.fromEntries(lastFetch),
    };
  }, [cache.size, lastFetch]);

  // Limpiar cache periódicamente
  useEffect(() => {
    const interval = setInterval(cleanOldCache, CACHE_DURATION / 4);
    return () => clearInterval(interval);
  }, [cleanOldCache]);

  return {
    fetchProductsWithCache,
    invalidateCache,
    getCacheStats,
    cleanOldCache,
  };
};
