import { useState } from 'react';
import { useReferrals } from '../hooks/useReferrals';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import LoadingSpinner from './LoadingSpinner';

export default function ReferralSystem() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const {
    referralCode,
    referrals,
    stats,
    loading,
    registerReferral,
    shareReferralCode,
  } = useReferrals();

  const [inputCode, setInputCode] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);

  const handleApplyCode = async () => {
    if (!inputCode.trim()) {
      addToast('Ingresa un código de referido', 'warning');
      return;
    }

    setApplyingCode(true);
    const success = await registerReferral(inputCode.trim().toUpperCase());
    if (success) {
      setInputCode('');
    }
    setApplyingCode(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Copiado al portapapeles', 'success');
    } catch (error) {
      addToast('Error al copiar', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="referral-system">
      <div className="referral-header">
        <h2>🎁 Programa de Referidos</h2>
        <p>Gana puntos invitando a tus amigos</p>
      </div>

      {/* Estadísticas */}
      <div className="referral-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalReferrals}</div>
          <div className="stat-label">Referidos Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.completedReferrals}</div>
          <div className="stat-label">Referidos Completados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalEarnings}</div>
          <div className="stat-label">Puntos Ganados</div>
        </div>
      </div>

      {/* Código de referido */}
      <div className="referral-code-section">
        <h3>Tu Código de Referido</h3>
        <div className="code-display">
          <span className="code">{referralCode || 'Generando...'}</span>
          <button
            onClick={() => copyToClipboard(referralCode)}
            className="copy-btn"
            disabled={!referralCode}
          >
            📋 Copiar
          </button>
        </div>
        <button onClick={shareReferralCode} className="share-btn">
          📤 Compartir Código
        </button>
      </div>

      {/* Aplicar código de referido */}
      <div className="apply-code-section">
        <h3>¿Tienes un código de referido?</h3>
        <div className="apply-code-form">
          <input
            type="text"
            placeholder="Ingresa código de referido"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="code-input"
          />
          <button
            onClick={handleApplyCode}
            disabled={applyingCode}
            className="apply-btn"
          >
            {applyingCode ? 'Aplicando...' : 'Aplicar Código'}
          </button>
        </div>
        <p className="help-text">
          Los códigos de referido dan puntos extra en tu primera compra
        </p>
      </div>

      {/* Lista de referidos */}
      {referrals.length > 0 && (
        <div className="referrals-list">
          <h3>Tus Referidos</h3>
          <div className="referrals-grid">
            {referrals.map((referral) => (
              <div key={referral.id} className={`referral-card ${referral.status}`}>
                <div className="referral-info">
                  <div className="email">{referral.referredEmail}</div>
                  <div className="status">
                    Estado: <span className={`status-badge ${referral.status}`}>
                      {referral.status === 'completed' ? '✅ Completado' :
                       referral.status === 'pending' ? '⏳ Pendiente' : '❓ Procesando'}
                    </span>
                  </div>
                  <div className="reward">
                    Recompensa: {referral.reward} puntos
                  </div>
                  <div className="date">
                    {new Date(referral.createdAt?.toDate?.() || referral.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .referral-system {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .referral-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .referral-header h2 {
          color: #1f2937;
          margin-bottom: 10px;
        }

        .referral-header p {
          color: #6b7280;
        }

        .referral-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .referral-code-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .referral-code-section h3 {
          margin-bottom: 15px;
          color: #1f2937;
        }

        .code-display {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .code {
          flex: 1;
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 2px dashed #3b82f6;
          font-family: monospace;
          font-size: 1.1rem;
          font-weight: bold;
          text-align: center;
          color: #3b82f6;
        }

        .copy-btn, .share-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.3s;
        }

        .copy-btn:hover, .share-btn:hover {
          background: #2563eb;
        }

        .copy-btn:disabled, .share-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .apply-code-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .apply-code-section h3 {
          margin-bottom: 15px;
          color: #1f2937;
        }

        .apply-code-form {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .code-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }

        .apply-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.3s;
        }

        .apply-btn:hover {
          background: #059669;
        }

        .apply-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .help-text {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .referrals-list {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .referrals-list h3 {
          margin-bottom: 20px;
          color: #1f2937;
        }

        .referrals-grid {
          display: grid;
          gap: 15px;
        }

        .referral-card {
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .referral-card.completed {
          background: #f0fdf4;
          border-color: #10b981;
        }

        .referral-card.pending {
          background: #fefce8;
          border-color: #f59e0b;
        }

        .referral-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .email {
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-badge.completed {
          background: #10b981;
          color: white;
        }

        .status-badge.pending {
          background: #f59e0b;
          color: white;
        }

        .reward {
          color: #059669;
          font-weight: 600;
        }

        .date {
          color: #6b7280;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .referral-stats {
            grid-template-columns: 1fr;
          }

          .code-display {
            flex-direction: column;
          }

          .apply-code-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
