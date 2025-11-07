import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import SkeletonLoader from './SkeletonLoader';
import '../styles/SkeletonLoader.css';

const RecommendedProducts = ({
  recommendations,
  loading,
  error,
  title = "Productos Recomendados",
  showReason = true,
  maxItems = 6,
  className = ""
}) => {
  const [imageErrors, setImageErrors] = useState(new Set());

  const handleImageError = (productId) => {
    setImageErrors(prev => new Set([...prev, productId]));
  };

  if (error) {
    return (
      <div className={`recommended-products error ${className}`}>
        <h2>{title}</h2>
        <p className="error-message">
          No se pudieron cargar las recomendaciones en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className={`recommended-products ${className}`}>
      <div className="recommended-header">
        <h2>{title}</h2>
        <Link to="/shop" className="view-all-link">
          Ver todos →
        </Link>
      </div>

      <div className="recommended-grid">
        {loading ? (
          // Mostrar skeletons mientras carga
          Array.from({ length: maxItems }, (_, index) => (
            <div key={`skeleton-${index}`} className="recommended-skeleton">
              <SkeletonLoader type="card" />
            </div>
          ))
        ) : (
          recommendations.slice(0, maxItems).map((product) => (
            <div key={product.id} className="recommended-item">
              <ProductCard
                product={product}
                showReason={showReason}
                reason={product.reason}
                compact={true}
              />
              {showReason && product.reason && (
                <div className="recommendation-reason">
                  <span className="reason-badge">{product.reason}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && recommendations.length === 0 && (
        <div className="no-recommendations">
          <p>No hay recomendaciones disponibles en este momento.</p>
          <Link to="/shop" className="shop-link">
            Explorar productos
          </Link>
        </div>
      )}

      <style>{`
        .recommended-products {
          margin: 40px 0;
          padding: 0 20px;
        }

        .recommended-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }

        .recommended-header h2 {
          margin: 0;
          font-size: 1.8rem;
          color: #1f2937;
          font-weight: 600;
        }

        .view-all-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .view-all-link:hover {
          color: #1d4ed8;
        }

        .recommended-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .recommended-item {
          position: relative;
        }

        .recommendation-reason {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
        }

        .reason-badge {
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
        }

        .recommended-skeleton {
          height: 350px;
        }

        .error-message {
          color: #dc2626;
          text-align: center;
          padding: 20px;
          background: #fef2f2;
          border-radius: 8px;
          margin: 20px 0;
        }

        .no-recommendations {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .shop-link {
          display: inline-block;
          margin-top: 10px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .shop-link:hover {
          background: #3b82f6;
          color: white;
        }

        @media (max-width: 768px) {
          .recommended-products {
            padding: 0 10px;
          }

          .recommended-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .recommended-header h2 {
            font-size: 1.5rem;
          }

          .recommended-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }

          .recommended-skeleton {
            height: 300px;
          }
        }

        @media (max-width: 480px) {
          .recommended-grid {
            grid-template-columns: 1fr;
          }

          .recommended-skeleton {
            height: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default RecommendedProducts;
