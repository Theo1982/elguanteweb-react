// src/pages/Success.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import StarRating from '../components/StarRating';

export default function Success() {
  const params = new URLSearchParams(useLocation().search);
  const puntos = params.get('points') || 0;
  const nivel = params.get('level') || 'Sin nivel';
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Capture purchased items and clear cart on success
    if (cart.length > 0) {
      setPurchasedItems([...cart]);
      clearCart();
      addToast('Carrito limpiado después del pago exitoso', 'success');
    }
  }, [cart, clearCart, addToast]);

  // ✅ FIXED: Remove duplicate order saving - orders are now created in PaymentModal
  // The webhook will handle status updates and inventory reduction
  // Payment verification is handled by webhooks automatically

  const handleReviewSubmit = async productId => {
    if (!user) {
      addToast('Debes estar logueado para reseñar', 'error');
      return;
    }

    const rating = reviews[productId]?.rating || 0;
    const comment = reviews[productId]?.comment || '';

    if (rating === 0 || !comment.trim()) {
      addToast(
        'Por favor, selecciona una calificación y escribe un comentario',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.uid,
        rating,
        comment,
        timestamp: serverTimestamp(),
      });
      addToast('¡Reseña enviada exitosamente!', 'success');
      // Clear this review
      setReviews(prev => ({
        ...prev,
        [productId]: { rating: 0, comment: '' },
      }));
    } catch (error) {
      console.error('Error adding review:', error);
      addToast('Error al enviar la reseña', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ color: '#2ea44f' }}>🎉 ¡Pago Exitoso!</h1>
      <p>
        Tu compra fue procesada correctamente. Muchas gracias por confiar en
        nosotros.
      </p>

      <p style={{ marginTop: '20px', fontSize: '18px' }}>
        🔥 Has ganado <b>{puntos}</b> puntos. Actualmente estás en el nivel{' '}
        <b>{nivel}</b>.
      </p>

      <div style={styles.infoBox}>
        <h3>ℹ️ Sistema de Niveles:</h3>
        <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: '400px' }}>
          <li>✅ Cada $1000 gastados = 1 punto</li>
          <li>🥉 25 puntos → Bronce (5% descuento)</li>
          <li>🥈 50 puntos → Plata (10% descuento)</li>
          <li>🥇 100 puntos → Oro (15% descuento)</li>
          <li>⚠️ Los puntos expiran a los 60 días</li>
        </ul>
      </div>

      {/* Review Section for Purchased Items */}
      {purchasedItems.length > 0 && user && (
        <div style={styles.reviewSection}>
          <h2>📝 ¡Califica tus productos comprados!</h2>
          <p>
            Tu opinión nos ayuda a mejorar. Deja una reseña para cada producto.
          </p>
          {purchasedItems.map(item => (
            <div key={item.id} style={styles.reviewItem}>
              <h3>{item.nombre}</h3>
              <StarRating
                rating={reviews[item.id]?.rating || 0}
                onRatingChange={rating =>
                  setReviews(prev => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], rating },
                  }))
                }
              />
              <textarea
                placeholder="Escribe tu reseña..."
                value={reviews[item.id]?.comment || ''}
                onChange={e =>
                  setReviews(prev => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], comment: e.target.value },
                  }))
                }
                style={styles.textarea}
                rows={3}
              />
              <button
                onClick={() => handleReviewSubmit(item.id)}
                disabled={submitting}
                style={styles.submitButton}
              >
                {submitting ? 'Enviando...' : 'Enviar Reseña'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Link to="/shop" style={styles.button}>
        🏠 Volver a la Tienda
      </Link>
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'center',
    padding: '40px',
  },
  button: {
    display: 'inline-block',
    marginTop: '20px',
    backgroundColor: '#2ea44f',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '6px',
    textDecoration: 'none',
  },
  infoBox: {
    marginTop: '30px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  reviewSection: {
    marginTop: '40px',
    textAlign: 'left',
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  reviewItem: {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '6px',
    backgroundColor: '#fff',
  },
  textarea: {
    width: '100%',
    marginTop: '10px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    resize: 'vertical',
  },
  submitButton: {
    marginTop: '10px',
    backgroundColor: '#2ea44f',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
