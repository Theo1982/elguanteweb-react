import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import StarRating from './StarRating';
import { useReviews } from '../hooks/useReviews';
import { useOrders } from '../hooks/useOrders';

const Reviews = ({ productId }) => {
  const [showFullReviews, setShowFullReviews] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [displayedReviews, setDisplayedReviews] = useState(10);
  const { user } = useAuth();
  const { addToast } = useToast();
  const { reviews, loading, averageRating, addReview, reviewCount } =
    useReviews(productId);
  const { hasPurchasedProduct } = useOrders(user?.uid);
  const hasReviewed = reviews.some(r => r.userId === user?.uid);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user || rating === 0 || comment.trim() === '') {
      addToast(
        'Debes estar logueado y proporcionar rating y comentario',
        'error'
      );
      return;
    }

    const success = await addReview(rating, comment);
    if (success) {
      setRating(0);
      setComment('');
    }
  };

  const loadMoreReviews = () => {
    setDisplayedReviews(prev => prev + 10);
  };

  // Simplified display: only one star with average rating
  const renderSimpleRating = () => (
    <div className="reviews-section">
      <div className="simple-rating">
        <span className="star-icon">⭐</span>
        <span className="rating-text">{averageRating.toFixed(1)}/5</span>
        <span className="review-count">({reviewCount})</span>
      </div>
      <button
        onClick={() => setShowFullReviews(true)}
        className="reseñas-button"
      >
        Reseñas
      </button>
    </div>
  );

  // Full reviews section (toggled)
  const renderFullReviews = () => (
    <div className="reviews-section">
      <h3>
        Reseñas ({reviewCount}) - Promedio: {averageRating.toFixed(1)}/5
      </h3>

      {/* Toggle form - only if purchased and not reviewed */}
      {user && hasPurchasedProduct(productId) && !hasReviewed && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="toggle-review-form"
        >
          {showForm ? 'Ocultar Formulario' : 'Agregar Reseña'}
        </button>
      )}
      {user && !hasPurchasedProduct(productId) && (
        <p className="purchase-required">
          Debes comprar el producto para reseñarlo.
        </p>
      )}
      {user && hasReviewed && (
        <p className="already-reviewed">Ya has reseñado este producto.</p>
      )}

      {/* Form to add review */}
      {user && showForm && hasPurchasedProduct(productId) && !hasReviewed && (
        <form onSubmit={handleSubmit} className="review-form">
          <StarRating rating={rating} onRatingChange={setRating} />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Escribe tu reseña..."
            rows={3}
            maxLength={500}
            required
          />
          <button
            type="submit"
            disabled={rating === 0 || comment.trim() === ''}
          >
            Enviar Reseña
          </button>
        </form>
      )}

      {/* Existing reviews */}
      {loading ? (
        <p>Cargando reseñas...</p>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.slice(0, displayedReviews).map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <StarRating rating={review.rating} readonly />
                  <span className="review-author">{review.userName}</span>
                  {review.adminReview === false && (
                    <span className="moderation-badge">
                      Pendiente Moderación
                    </span>
                  )}
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
          {reviewCount > displayedReviews && (
            <button onClick={loadMoreReviews} className="load-more-btn">
              Cargar Más Reseñas
            </button>
          )}
        </>
      )}

      <button
        onClick={() => setShowFullReviews(false)}
        className="close-reviews-button"
      >
        Cerrar Reseñas
      </button>

      <style>{`
        .reviews-section {
          margin-top: 20px;
          padding: 15px;
          border-top: 1px solid #e5e7eb;
        }
        .simple-rating {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 10px;
        }
        .star-icon {
          font-size: 1.2em;
          color: #fbbf24;
        }
        .rating-text {
          font-weight: bold;
          color: #374151;
        }
        .review-count {
          color: #6b7280;
          font-size: 0.9em;
        }
        .reseñas-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 10px;
        }
        .toggle-review-form {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 10px;
        }
        .purchase-required,
        .already-reviewed {
          color: #6b7280;
          font-style: italic;
          margin: 10px 0;
        }
        .review-form {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .review-form textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 8px;
          margin: 10px 0;
        }
        .review-form button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .review-form button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .review-item {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .review-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 5px;
        }
        .review-author {
          font-weight: bold;
          color: #374151;
        }
        .moderation-badge {
          background: #ffc107;
          color: #000;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8rem;
        }
        .review-comment {
          margin: 0;
          color: #6b7280;
        }
        .load-more-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
          width: 100%;
        }
        .close-reviews-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
          width: 100%;
        }
      `}</style>
    </div>
  );

  if (!showFullReviews) {
    return renderSimpleRating();
  }

  return renderFullReviews();
};

export default Reviews;
