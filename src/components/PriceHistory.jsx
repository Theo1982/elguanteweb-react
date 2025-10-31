import { useState, useEffect } from 'react';
import { usePriceHistory } from '../hooks/usePriceHistory';
import LoadingSpinner from './LoadingSpinner';

export default function PriceHistory({ productId, currentPrice }) {
  const {
    getPriceHistory,
    getLowestPrice,
    isLowestPrice,
    createPriceAlert,
    priceHistory,
    loading
  } = usePriceHistory();

  const [showHistory, setShowHistory] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [showAlertForm, setShowAlertForm] = useState(false);

  useEffect(() => {
    if (showHistory && priceHistory.length === 0) {
      getPriceHistory(productId);
    }
  }, [showHistory, productId, getPriceHistory, priceHistory.length]);

  const lowestPrice = getLowestPrice(priceHistory);
  const isCurrentLowest = isLowestPrice(currentPrice, priceHistory);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    const success = await createPriceAlert(productId, alertPrice);
    if (success) {
      setAlertPrice('');
      setShowAlertForm(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date.seconds * 1000).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  return (
    <div className="price-history">
      {/* Price indicator */}
      <div className="price-indicator">
        {isCurrentLowest && priceHistory.length > 0 && (
          <div className="lowest-price-badge">
            💰 ¡Precio más bajo histórico!
          </div>
        )}

        {lowestPrice && lowestPrice < currentPrice && (
          <div className="price-savings">
            <span className="savings-text">
              Ahorra {formatPrice(lowestPrice - currentPrice)} vs precio más bajo
            </span>
          </div>
        )}

        <div className="price-actions">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="history-toggle-btn"
          >
            📊 Historial de Precios
          </button>

          <button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className="alert-toggle-btn"
          >
            🔔 Crear Alerta
          </button>
        </div>
      </div>

      {/* Alert form */}
      {showAlertForm && (
        <div className="alert-form-container">
          <form onSubmit={handleCreateAlert} className="alert-form">
            <h4>Crear Alerta de Precio</h4>
            <p>Te notificaremos cuando el precio baje de:</p>
            <div className="alert-input-group">
              <input
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder={`Ej: ${Math.floor(currentPrice * 0.9)}`}
                min="1"
                step="0.01"
                required
                className="alert-price-input"
              />
              <button type="submit" className="alert-submit-btn">
                Crear Alerta
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAlertForm(false)}
              className="alert-cancel-btn"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Price history */}
      {showHistory && (
        <div className="price-history-container">
          <h4>Historial de Precios</h4>

          {loading ? (
            <LoadingSpinner />
          ) : priceHistory.length === 0 ? (
            <p>No hay historial de precios disponible.</p>
          ) : (
            <div className="price-history-list">
              <div className="history-header">
                <span>Fecha</span>
                <span>Precio Anterior</span>
                <span>Nuevo Precio</span>
                <span>Cambio</span>
              </div>

              {priceHistory.map((change, index) => (
                <div key={change.id} className="history-item">
                  <span className="change-date">
                    {formatDate(change.changeDate)}
                  </span>
                  <span className="old-price">
                    {formatPrice(change.oldPrice)}
                  </span>
                  <span className="new-price">
                    {formatPrice(change.newPrice)}
                  </span>
                  <span className={`change-indicator ${change.changeType}`}>
                    {change.changeType === 'increase' ? '↗️' : '↘️'}
                    {Math.abs(parseFloat(change.percentageChange))}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {lowestPrice && (
            <div className="lowest-price-info">
              <strong>Precio más bajo histórico:</strong> {formatPrice(lowestPrice)}
            </div>
          )}

          <button
            onClick={() => setShowHistory(false)}
            className="close-history-btn"
          >
            Cerrar Historial
          </button>
        </div>
      )}

      <style>{`
        .price-history {
          margin-top: 15px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .price-indicator {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lowest-price-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          text-align: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .price-savings {
          text-align: center;
        }

        .savings-text {
          color: #dc2626;
          font-weight: bold;
          font-size: 0.9em;
        }

        .price-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .history-toggle-btn,
        .alert-toggle-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9em;
          transition: background 0.2s;
        }

        .history-toggle-btn:hover,
        .alert-toggle-btn:hover {
          background: #2563eb;
        }

        .alert-form-container {
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }

        .alert-form h4 {
          margin: 0 0 10px 0;
          color: #374151;
        }

        .alert-form p {
          margin: 0 0 15px 0;
          color: #6b7280;
          font-size: 0.9em;
        }

        .alert-input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .alert-price-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 1em;
        }

        .alert-submit-btn,
        .alert-cancel-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }

        .alert-submit-btn {
          background: #10b981;
          color: white;
        }

        .alert-submit-btn:hover {
          background: #059669;
        }

        .alert-cancel-btn {
          background: #6b7280;
          color: white;
        }

        .alert-cancel-btn:hover {
          background: #4b5563;
        }

        .price-history-container {
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }

        .price-history-container h4 {
          margin: 0 0 15px 0;
          color: #374151;
        }

        .price-history-list {
          margin-bottom: 15px;
        }

        .history-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 0.5fr;
          gap: 10px;
          padding: 10px;
          background: #f3f4f6;
          font-weight: bold;
          font-size: 0.9em;
          color: #374151;
          border-radius: 4px;
        }

        .history-item {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 0.5fr;
          gap: 10px;
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          align-items: center;
        }

        .change-date {
          font-size: 0.9em;
          color: #6b7280;
        }

        .old-price,
        .new-price {
          font-weight: 500;
          color: #374151;
        }

        .change-indicator {
          font-weight: bold;
          text-align: center;
        }

        .change-indicator.increase {
          color: #dc2626;
        }

        .change-indicator.decrease {
          color: #10b981;
        }

        .lowest-price-info {
          padding: 10px;
          background: #ecfdf5;
          border: 1px solid #d1fae5;
          border-radius: 4px;
          color: #065f46;
          font-size: 0.9em;
          margin-bottom: 10px;
        }

        .close-history-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
        }

        .close-history-btn:hover {
          background: #4b5563;
        }

        @media (max-width: 768px) {
          .price-actions {
            flex-direction: column;
          }

          .history-header,
          .history-item {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .history-header {
            display: none;
          }

          .history-item > span:before {
            content: attr(data-label) ": ";
            font-weight: bold;
            display: inline-block;
            width: 100px;
          }

          .alert-input-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
