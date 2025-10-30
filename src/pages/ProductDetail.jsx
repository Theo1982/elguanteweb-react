import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import Reviews from '../components/Reviews';
import LazyImage from '../components/LazyImage';
import LoadingSpinner from '../components/LoadingSpinner';
import useToast from '../hooks/useToast';
import { formatPrice } from '../utils/formatters'; // Assume formatter exists

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageZoom, setImageZoom] = useState(false);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const productRef = doc(db, 'productos', id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() });

          // Fetch related products
          if (productSnap.data().categoria) {
            const relatedQuery = query(
              collection(db, 'productos'),
              where('categoria', '==', productSnap.data().categoria),
              where('id', '!=', id),
              limit(4)
            );
            const relatedSnap = await getDocs(relatedQuery);
            const relatedData = relatedSnap.docs.map(d => ({
              id: d.id,
              ...d.data(),
            }));
            setRelatedProducts(relatedData);
          }
        } else {
          addToast('Producto no encontrado', 'error');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        addToast('Error al cargar el producto', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, addToast]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      addToast('Producto sin stock', 'error');
      return;
    }
    addToCart(product);
    addToast(`${product.nombre} agregado al carrito`, 'success');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Producto no encontrado</h2>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-main">
        <div
          className="product-image-container"
          onMouseEnter={() => setImageZoom(true)}
          onMouseLeave={() => setImageZoom(false)}
        >
          <LazyImage
            src={product.imagen}
            alt={product.nombre}
            className={`product-detail-image ${imageZoom ? 'zoomed' : ''}`}
            style={{
              transform: imageZoom ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}
          />
        </div>
        <div className="product-detail-info">
          <h1>{product.nombre}</h1>
          <p className="product-price">{formatPrice(product.precio)}</p>
          <p className="product-stock">
            Stock:{' '}
            {product.stock > 0 ? `${product.stock} unidades` : 'Sin stock'}
          </p>
          {product.fragancias && (
            <div className="product-variants">
              <h3>Fragancias disponibles:</h3>
              <ul>
                {product.fragancias.map((frag, index) => (
                  <li key={index}>{frag}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="product-description">{product.descripcion}</p>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="add-to-cart-btn"
          >
            {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
          </button>
        </div>
      </div>

      <Reviews productId={id} />

      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>Productos Relacionados</h2>
          <div className="related-grid">
            {relatedProducts.map(rel => (
              <div key={rel.id} className="related-card">
                <LazyImage
                  src={rel.imagen}
                  alt={rel.nombre}
                  className="related-image"
                />
                <h3>{rel.nombre}</h3>
                <p>{formatPrice(rel.precio)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .product-detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .product-detail-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .product-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }
        .product-detail-image {
          width: 100%;
          height: auto;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }
        .product-detail-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20px;
        }
        .product-price {
          font-size: 2rem;
          color: #28a745;
          font-weight: bold;
          margin: 10px 0;
        }
        .product-stock {
          color: #6c757d;
          margin: 10px 0;
        }
        .product-variants {
          margin: 20px 0;
        }
        .product-variants ul {
          list-style: none;
          padding: 0;
        }
        .product-description {
          line-height: 1.6;
          color: #333;
          margin: 20px 0;
        }
        .add-to-cart-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 5px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background 0.3s;
          align-self: flex-start;
        }
        .add-to-cart-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        .add-to-cart-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .related-products {
          margin-top: 60px;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .related-card {
          text-align: center;
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .related-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 4px;
        }
        @media (max-width: 768px) {
          .product-detail-main {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .product-detail-info {
            padding: 10px;
          }
          .related-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;
