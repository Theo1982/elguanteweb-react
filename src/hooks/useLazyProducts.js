import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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
      console.log('Fetching products from Firestore...');
      const snapshot = await getDocs(collection(db, 'productos'));
      console.log('Snapshot size:', snapshot.size);

      if (snapshot.empty) {
        console.log('Firestore collection is empty, using local fallback');
        // Fallback to local JSON
        const localData = await import('../data/productos.json');
        const rawProducts = localData.default;

        // Normalize field names to match Firestore structure
        const productsData = rawProducts.map(product => ({
          id:
            product.Handle ||
            product.REF ||
            Math.random().toString(36).substr(2, 9),
          nombre: product.Nombre || product.nombre,
          categoria: product.Categoria || product.categoria,
          precio: parseFloat(
            (product['Precio [El Guante]'] || product.precio || '0').replace(
              /[^\d.]/g,
              ''
            )
          ),
          descripcion: product.Descripción || product.descripcion || '',
          imagen: product.imagen || '',
          stock: product['En inventario [El Guante]']
            ? parseFloat(product['En inventario [El Guante]'])
            : undefined,
          handle: product.Handle || product.handle,
          variantes: product.Variantes || product.variantes || [],
        }));

        // Deduplicate by nombre (keep first occurrence)
        const uniqueProducts = productsData.filter(
          (p, index, arr) => arr.findIndex(q => q.nombre === p.nombre) === index
        );

        // Sort alphabetically by nombre (safe for null/undefined)
        const sortedProducts = uniqueProducts.sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '')
        );

        setProducts(sortedProducts);
        setTotalLoaded(sortedProducts.length);
        return;
      }

      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Deduplicate by nombre (keep first occurrence)
      const uniqueProducts = productsData.filter(
        (p, index, arr) => arr.findIndex(q => q.nombre === p.nombre) === index
      );

      // Sort alphabetically by nombre (safe for null/undefined)
      const sortedProducts = uniqueProducts.sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '')
      );

      setProducts(sortedProducts);
      setTotalLoaded(sortedProducts.length);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar productos: ' + err.message);
      // Fallback to local JSON on error
      console.log('Using local fallback due to error');
      try {
        const localData = await import('../data/productos.json');
        const rawProducts = localData.default;

        // Normalize field names to match Firestore structure
        const productsData = rawProducts.map(product => ({
          id:
            product.Handle ||
            product.REF ||
            Math.random().toString(36).substr(2, 9),
          nombre: product.Nombre || product.nombre,
          categoria: product.Categoria || product.categoria,
          precio: parseFloat(
            (product['Precio [El Guante]'] || product.precio || '0').replace(
              /[^\d.]/g,
              ''
            )
          ),
          descripcion: product.Descripción || product.descripcion || '',
          imagen: product.imagen || '',
          stock: product['En inventario [El Guante]']
            ? parseFloat(product['En inventario [El Guante]'])
            : undefined,
          handle: product.Handle || product.handle,
          variantes: product.Variantes || product.variantes || [],
        }));

        // Deduplicate by nombre (keep first occurrence)
        const uniqueProducts = productsData.filter(
          (p, index, arr) => arr.findIndex(q => q.nombre === p.nombre) === index
        );

        // Sort alphabetically by nombre (safe for null/undefined)
        const sortedProducts = uniqueProducts.sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '')
        );

        setProducts(sortedProducts);
        setTotalLoaded(sortedProducts.length);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Error al cargar productos locales');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para filtrar productos localmente (para búsqueda)
  const filterProducts = useCallback(
    searchTerm => {
      if (!searchTerm.trim()) {
        return products;
      }

      const term = searchTerm.toLowerCase();
      return products.filter(
        product =>
          product.nombre?.toLowerCase().includes(term) ||
          product.categoria?.toLowerCase().includes(term) ||
          product.descripcion?.toLowerCase().includes(term)
      );
    },
    [products]
  );

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
    refreshProducts,
  };
};
