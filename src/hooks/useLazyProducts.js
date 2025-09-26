// src/hooks/useLazyProducts.js
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const useLazyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalLoaded, setTotalLoaded] = useState(0);

  // Función para cargar todos los productos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(collection(db, 'productos'));

      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter unique products by handle or name to avoid duplicates
      const uniqueProducts = productsData.filter((p, index, arr) =>
        arr.findIndex(q => q.handle && p.handle ? q.handle === p.handle : q.nombre === p.nombre) === index
      );

      // Sort alphabetically by nombre
      uniqueProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));

      setProducts(uniqueProducts);
      setTotalLoaded(uniqueProducts.length);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para filtrar productos localmente (para búsqueda)
  const filterProducts = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      return products;
    }

    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.nombre?.toLowerCase().includes(term) ||
      product.categoria?.toLowerCase().includes(term) ||
      product.descripcion?.toLowerCase().includes(term)
    );
  }, [products]);

  // Función para refrescar productos (útil después de cambios)
  const refreshProducts = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    totalLoaded,
    filterProducts,
    refreshProducts
  };
};
