import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';
import { useLazyProducts } from '../hooks/useLazyProducts';
import '../styles/Shop.css';
import '../styles/SkeletonLoader.css';

export default function Shop() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [displayedProducts, setDisplayedProducts] = useState([]);

  const {
    products,
    loading,
    error,
    hasMore,
    totalLoaded,
    loadMoreProducts,
    refreshProducts,
  } = useLazyProducts();

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Actualizar productos mostrados cuando cambian los productos o el término de búsqueda debounced
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setDisplayedProducts(products);
    } else {
      const term = debouncedSearchTerm.toLowerCase();
      const filtered = products.filter(
        product =>
          product.nombre?.toLowerCase().includes(term) ||
          product.categoria?.toLowerCase().includes(term) ||
          product.descripcion?.toLowerCase().includes(term)
      );
      setDisplayedProducts(filtered);
    }
  }, [products, debouncedSearchTerm]);

  // Función para manejar scroll infinito
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 && // Cargar 1000px antes del final
      hasMore &&
      !loading
    ) {
      loadMoreProducts();
    }
  }, [hasMore, loading, loadMoreProducts]);

  // Agregar listener de scroll
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Función para manejar cambios en la búsqueda
  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container">
      {/* Barra de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar productos por nombre o categoría..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Información de productos cargados */}
      <div className="product-count">
        {totalLoaded > 0 && (
          <span>
            Mostrando {displayedProducts.length} de {totalLoaded} productos
            cargados
            {hasMore && ' (desplázate para cargar más)'}
          </span>
        )}
      </div>

      {/* Manejo de errores */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={refreshProducts} className="retry-button">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de productos */}
      <div className="grid">
        {displayedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Estado de carga */}
      {loading && displayedProducts.length === 0 && (
        <SkeletonLoader type="card" count={8} />
      )}

      {loading && displayedProducts.length > 0 && (
        <div className="loading-container">
          <LoadingSpinner />
          <p className="loading-text">Cargando más productos...</p>
        </div>
      )}

      {/* Mensajes informativos */}
      {displayedProducts.length === 0 && !loading && !error && (
        <div className="no-results">
          {debouncedSearchTerm ? (
            <p>
              No se encontraron productos que coincidan con "
              {debouncedSearchTerm}".
            </p>
          ) : (
            <p>No hay productos disponibles en este momento.</p>
          )}
        </div>
      )}

      {/* Indicador de fin de lista */}
      {!hasMore && totalLoaded > 0 && !debouncedSearchTerm && (
        <div className="end-message">
          <p>Has visto todos los productos disponibles.</p>
          <p className="total">Total de productos: {totalLoaded}</p>
        </div>
      )}
    </div>
  );
}
