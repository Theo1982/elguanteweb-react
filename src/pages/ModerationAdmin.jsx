import { useState, useEffect } from 'react';
import { useModeration } from '../hooks/useModeration';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ModerationAdmin() {
  const {
    getPendingReports,
    resolveReport,
    getModerationStats,
    banUser,
    loading
  } = useModeration();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [moderatorNotes, setModeratorNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [reportsData, statsData] = await Promise.all([
      getPendingReports(),
      getModerationStats()
    ]);

    setReports(reportsData);
    setStats(statsData);
  };

  const handleResolveReport = async (reportId, action) => {
    const success = await resolveReport(reportId, action, moderatorNotes);
    if (success) {
      setSelectedReport(null);
      setModeratorNotes('');
      loadData(); // Refresh data
    }
  };

  const handleBanUser = async (userId, reason) => {
    const success = await banUser(userId, reason);
    if (success) {
      // Optionally resolve related reports
      if (selectedReport) {
        await resolveReport(selectedReport.id, 'removed', `Usuario baneado: ${reason}`);
        setSelectedReport(null);
        setModeratorNotes('');
        loadData();
      }
    }
  };

  const getReasonText = (reason) => {
    const reasons = {
      spam: 'Spam/Publicidad no deseada',
      inappropriate: 'Contenido inapropiado',
      offensive: 'Contenido ofensivo',
      hate_speech: 'Discurso de odio',
      fake: 'Información falsa',
      harassment: 'Acoso',
      auto_detected: 'Detectado automáticamente'
    };
    return reasons[reason] || reason;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  if (loading && reports.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="moderation-admin">
      <h2>🛡️ Panel de Moderación</h2>

      {/* Statistics */}
      {stats && (
        <div className="moderation-stats">
          <div className="stat-card">
            <h3>{stats.totalReports}</h3>
            <p>Reportes Totales</p>
          </div>
          <div className="stat-card">
            <h3 style={{ color: '#dc2626' }}>{stats.pendingReports}</h3>
            <p>Reportes Pendientes</p>
          </div>
          <div className="stat-card">
            <h3 style={{ color: '#059669' }}>{stats.monthlyResolved}</h3>
            <p>Resueltos (Mes)</p>
          </div>
          <div className="stat-card">
            <h3>{stats.resolutionRate}%</h3>
            <p>Tasa de Resolución</p>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="reports-section">
        <h3>Reportes Pendientes</h3>

        {reports.length === 0 ? (
          <p className="no-reports">🎉 No hay reportes pendientes. ¡Todo está en orden!</p>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div key={report.id} className="report-item">
                <div className="report-header">
                  <div className="report-info">
                    <span className="content-type">{report.contentType}</span>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(report.priority) }}
                    >
                      {report.priority === 'high' ? '🔴' : report.priority === 'medium' ? '🟡' : '🟢'}
                      {report.priority}
                    </span>
                  </div>
                  <div className="report-meta">
                    <span className="reporter">Por: {report.reporterName}</span>
                    <span className="date">
                      {new Date(report.reportedAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="report-content">
                  <p><strong>Motivo:</strong> {getReasonText(report.reason)}</p>
                  {report.description && (
                    <p><strong>Descripción:</strong> {report.description}</p>
                  )}
                </div>

                <div className="report-actions">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="btn-review"
                  >
                    Revisar
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'approved')}
                    className="btn-approve"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'rejected')}
                    className="btn-reject"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Revisar Reporte</h3>

            <div className="report-details">
              <div className="detail-row">
                <strong>Tipo de contenido:</strong> {selectedReport.contentType}
              </div>
              <div className="detail-row">
                <strong>ID del contenido:</strong> {selectedReport.contentId}
              </div>
              <div className="detail-row">
                <strong>Reportado por:</strong> {selectedReport.reporterName}
              </div>
              <div className="detail-row">
                <strong>Fecha:</strong> {new Date(selectedReport.reportedAt.seconds * 1000).toLocaleString()}
              </div>
              <div className="detail-row">
                <strong>Motivo:</strong> {getReasonText(selectedReport.reason)}
              </div>
              {selectedReport.description && (
                <div className="detail-row">
                  <strong>Descripción:</strong> {selectedReport.description}
                </div>
              )}
            </div>

            <div className="moderation-actions">
              <h4>Acciones de Moderación</h4>

              <textarea
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                placeholder="Notas del moderador (opcional)"
                rows={3}
                className="moderator-notes"
              />

              <div className="action-buttons">
                <button
                  onClick={() => handleResolveReport(selectedReport.id, 'approved')}
                  className="btn-approve"
                >
                  ✅ Aprobar Reporte
                </button>
                <button
                  onClick={() => handleResolveReport(selectedReport.id, 'rejected')}
                  className="btn-reject"
                >
                  ❌ Rechazar Reporte
                </button>
                <button
                  onClick={() => handleResolveReport(selectedReport.id, 'removed')}
                  className="btn-remove"
                >
                  🚫 Remover Contenido
                </button>
                <button
                  onClick={() => handleBanUser(selectedReport.reportedBy, 'Contenido inapropiado')}
                  className="btn-ban"
                >
                  🔨 Banear Usuario
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setSelectedReport(null)}
                className="btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .moderation-admin {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .moderation-stats {
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

        .reports-section h3 {
          margin-bottom: 1rem;
        }

        .no-reports {
          text-align: center;
          color: #059669;
          font-size: 1.1em;
          padding: 2rem;
        }

        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .report-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .report-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .content-type {
          background: #e0e7ff;
          color: #3730a3;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .priority-badge {
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .report-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .report-content {
          margin: 0.5rem 0;
        }

        .report-content p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        .report-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .btn-review,
        .btn-approve,
        .btn-reject {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn-review {
          background: #3b82f6;
          color: white;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }

        .btn-reject {
          background: #6b7280;
          color: white;
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
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .report-details {
          margin: 1.5rem 0;
        }

        .detail-row {
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
        }

        .moderation-actions {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #fef3c7;
          border-radius: 4px;
        }

        .moderator-notes {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          margin: 0.5rem 0;
          resize: vertical;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .btn-remove,
        .btn-ban {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn-remove {
          background: #dc2626;
          color: white;
        }

        .btn-ban {
          background: #7c2d12;
          color: white;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
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

        @media (max-width: 768px) {
          .moderation-stats {
            grid-template-columns: 1fr;
          }

          .report-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .report-meta {
            align-items: flex-start;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
