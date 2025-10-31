import { useState, useEffect } from 'react';
import { useNewsletter } from '../hooks/useNewsletter';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NewsletterAdmin() {
  const { getSubscribers, updatePreferences, subscribers, loading } = useNewsletter();
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);

  useEffect(() => {
    getSubscribers();
  }, [getSubscribers]);

  const handleUpdatePreferences = async (subscriberId, preferences) => {
    await updatePreferences(subscriberId, preferences);
    getSubscribers(); // Refresh list
  };

  const formatDate = (date) => {
    return new Date(date.seconds * 1000).toLocaleDateString('es-AR');
  };

  if (loading && subscribers.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="newsletter-admin">
      <h2>📧 Administración de Newsletter</h2>

      <div className="newsletter-stats">
        <div className="stat-card">
          <h3>{subscribers.length}</h3>
          <p>Suscriptores Activos</p>
        </div>
        <div className="stat-card">
          <h3>{subscribers.filter(s => s.source === 'authenticated').length}</h3>
          <p>Usuarios Registrados</p>
        </div>
        <div className="stat-card">
          <h3>{subscribers.filter(s => s.source === 'guest').length}</h3>
          <p>Invitados</p>
        </div>
      </div>

      <div className="newsletter-subscribers">
        <h3>Lista de Suscriptores</h3>

        {subscribers.length === 0 ? (
          <p>No hay suscriptores activos.</p>
        ) : (
          <div className="subscribers-table">
            <div className="table-header">
              <div>Email</div>
              <div>Fuente</div>
              <div>Fecha Suscripción</div>
              <div>Intereses</div>
              <div>Acciones</div>
            </div>

            {subscribers.map(subscriber => (
              <div key={subscriber.id} className="table-row">
                <div className="subscriber-email">{subscriber.email}</div>
                <div className="subscriber-source">
                  <span className={`source-badge ${subscriber.source}`}>
                    {subscriber.source === 'authenticated' ? '👤 Usuario' : '👥 Invitado'}
                  </span>
                </div>
                <div className="subscriber-date">
                  {formatDate(subscriber.subscribedAt)}
                </div>
                <div className="subscriber-interests">
                  {subscriber.interests?.length > 0 ? (
                    <div className="interests-tags">
                      {subscriber.interests.slice(0, 2).map(interest => (
                        <span key={interest} className="interest-tag">
                          {interest}
                        </span>
                      ))}
                      {subscriber.interests.length > 2 && (
                        <span className="more-interests">
                          +{subscriber.interests.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="no-interests">Sin especificar</span>
                  )}
                </div>
                <div className="subscriber-actions">
                  <button
                    onClick={() => setSelectedSubscriber(subscriber)}
                    className="btn-edit"
                  >
                    ⚙️ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición de preferencias */}
      {selectedSubscriber && (
        <div className="modal-overlay" onClick={() => setSelectedSubscriber(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Editar Preferencias</h3>
            <p><strong>Email:</strong> {selectedSubscriber.email}</p>

            <div className="preferences-form">
              <h4>Preferencias de Comunicación</h4>

              {Object.entries(selectedSubscriber.preferences || {}).map(([key, value]) => (
                <label key={key} className="preference-item">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => {
                      const newPreferences = {
                        ...selectedSubscriber.preferences,
                        [key]: e.target.checked
                      };
                      handleUpdatePreferences(selectedSubscriber.id, newPreferences);
                      setSelectedSubscriber({
                        ...selectedSubscriber,
                        preferences: newPreferences
                      });
                    }}
                  />
                  <span>
                    {key === 'productUpdates' && 'Actualizaciones de productos'}
                    {key === 'promotions' && 'Promociones y descuentos'}
                    {key === 'newsletter' && 'Newsletter mensual'}
                    {key === 'orderUpdates' && 'Actualizaciones de pedidos'}
                  </span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setSelectedSubscriber(null)}
                className="btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .newsletter-admin {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .newsletter-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          font-size: 2rem;
          color: #3b82f6;
          margin: 0;
        }

        .stat-card p {
          color: #6b7280;
          margin: 0.5rem 0 0 0;
        }

        .newsletter-subscribers h3 {
          margin-bottom: 1rem;
        }

        .subscribers-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          align-items: center;
        }

        .subscriber-email {
          font-weight: 500;
        }

        .source-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .source-badge.authenticated {
          background: #dbeafe;
          color: #1e40af;
        }

        .source-badge.guest {
          background: #fef3c7;
          color: #92400e;
        }

        .interests-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .interest-tag {
          background: #e0e7ff;
          color: #3730a3;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        .more-interests {
          color: #6b7280;
          font-size: 0.75rem;
        }

        .no-interests {
          color: #9ca3af;
          font-style: italic;
        }

        .btn-edit {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-edit:hover {
          background: #2563eb;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .preferences-form {
          margin: 1.5rem 0;
        }

        .preference-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: #4b5563;
        }

        @media (max-width: 768px) {
          .newsletter-stats {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .table-header {
            display: none;
          }

          .table-row > div {
            padding: 0.25rem 0;
          }

          .table-row > div:before {
            content: attr(data-label) ": ";
            font-weight: bold;
            display: inline-block;
            width: 100px;
          }
        }
      `}</style>
    </div>
  );
}
