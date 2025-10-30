import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLazyProducts } from '../hooks/useLazyProducts';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { useAnalytics } from '../hooks/useAnalytics';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductComparison = () => {
  const { productIds } = useParams(); // e.g., /compare/1,2,3
  const ids = useMemo(() => productIds ? productIds.split(',').map(id => id.trim()) : [], [productIds]);

  useEffect(() => {
    if (ids.length === 0 || ids.length > 4) {
      addToast('Selecciona 2-4 productos para comparar', 'error');
      return;
    }

    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProductsByIds(ids);
        setProducts(fetchedProducts);
        fetchedProducts.forEach(product => trackViewItem(product));
      } catch (error) {
        console.error('Error loading products for comparison:', error);
        addToast('Error al cargar productos', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [ids, fetchProductsByIds, addToast, trackViewItem]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // eslint-disable-line no-unused-vars
  const { addToast } = useToast();
  const { trackViewItem } = useAnalytics();

  const { fetchProductsByIds } = useLazyProducts();



  if (loading) {
    return <LoadingSpinner />;
  }

  if (products.length === 0) {
    return (
      <div className="comparison-empty">
        <h2>No hay productos para comparar</h2>
        <p>Selecciona productos desde la página de shop para compararlos.</p>
      </div>
    );
  }

  const getUniqueAttributes = () => {
    const attributes = [
      'nombre',
      'precio',
      'descripcion',
      'categoria',
      'stock',
    ];
    return attributes;
  };

  return (
    <div className="comparison-container">
      <h1>Comparación de Productos</h1>
      <div className="comparison-grid">
        {products.map((product) => (
          <div key={product.id} className="comparison-column">
            <img
              src={product.imagen}
              alt={product.nombre}
              className="comparison-image"
            />
            <h3>{product.nombre}</h3>
            <p className="comparison-price">${product.precio}</p>
            <ul className="comparison-attributes">
              {getUniqueAttributes().map(attr => (
                <li key={attr}>
                  <strong>{attr}:</strong> {product[attr] || 'N/A'}
                </li>
              ))}
            </ul>

          </div>
        ))}
      </div>
      <style>{`
        .comparison-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .comparison-column {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .comparison-image {
          width: 100%;
          height: 150px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        .comparison-price {
          font-size: 1.2em;
          font-weight: bold;
          color: #007bff;
        }
        .comparison-attributes {
          list-style: none;
          padding: 0;
          text-align: left;
        }
        .comparison-attributes li {
          margin: 5px 0;
          padding: 5px;
          border-bottom: 1px solid #f3f4f6;
        }
        .comparison-empty {
          text-align: center;
          padding: 40px;
        }
      `}</style>
    </div>
  );
};

export default ProductComparison;
