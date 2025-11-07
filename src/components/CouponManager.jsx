import { useState } from 'react';
import { useCoupons } from '../hooks/useCoupons';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import LoadingSpinner from './LoadingSpinner';

export default function CouponManager() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const {
    coupons,
    userCoupons,
    loading,
    createCoupon,
    deactivateCoupon,
    assignCouponToUser,
    generateCouponCode,
  } = useCoupons();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minAmount: 0,
    maxDiscount: 0,
    usageLimit: 0,
    onePerUser: true,
    expiresAt: '',
  });
  const [assignUserId, setAssignUserId] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState('');

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    if (!newCoupon.code || !newCoupon.description) {
      addToast('Completa todos los campos requeridos', 'warning');
      return;
    }

    const couponData = {
      ...newCoupon,
      code: newCoupon.code.toUpperCase(),
      expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt) : null,
    };

    const success = await createCoupon(couponData);
    if (success) {
      setNewCoupon({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minAmount: 0,
        maxDiscount: 0,
        usageLimit: 0,
        onePerUser: true,
        expiresAt: '',
      });
      setShowCreateForm(false);
    }
  };

  const handleAssignCoupon = async () => {
    if (!assignUserId || !selectedCouponId) {
      addToast('Selecciona usuario y cupón', 'warning');
      return;
    }

    const success = await assignCouponToUser(assignUserId, selectedCouponId);
    if (success) {
      setAssignUserId('');
      setSelectedCouponId('');
    }
  };

  const generateCode = () => {
    setNewCoupon(prev => ({ ...prev, code: generateCouponCode() }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Solo admin puede ver el manager completo
  if (profile?.role !== 'admin') {
    return (
      <div className="coupon-user-view">
        <h2>Mis Cupones</h2>
        {userCoupons.length === 0 ? (
          <p>No tienes cupones disponibles</p>
        ) : (
          <div className="user-coupons-grid">
            {userCoupons.map(coupon => (
              <div key={coupon.id} className="user-coupon-card">
                <div className="coupon-code">{coupon.code}</div>
                <div className="coupon-discount">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% OFF`
                    : `$${coupon.discountValue} OFF`
                  }
                </div>
                {coupon.expiresAt && (
                  <div className="coupon-expiry">
                    Expira: {coupon.expiresAt.toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="coupon-manager">
      <div className="coupon-header">
        <h2>🎫 Gestión de Cupones</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-coupon-btn"
        >
          {showCreateForm ? 'Cancelar' : 'Crear Cupón'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <form onSubmit={handleCreateCoupon} className="coupon-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Código del Cupón</label>
              <div className="code-input-group">
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="EJEMPLO10"
                  required
                />
                <button type="button" onClick={generateCode} className="generate-btn">
                  Generar
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input
                type="text"
                value={newCoupon.description}
                onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del descuento"
                required
              />
            </div>

            <div className="form-group">
              <label>Tipo de Descuento</label>
              <select
                value={newCoupon.discountType}
                onChange={(e) => setNewCoupon(prev => ({ ...prev, discountType: e.target.value }))}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Valor del Descuento</label>
              <input
                type="number"
                value={newCoupon.discountValue}
                onChange={(e) => setNewCoupon(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                min="0"
                step={newCoupon.discountType === 'percentage' ? '1' : '0.01'}
                required
              />
            </div>

            <div className="form-group">
              <label>Monto Mínimo de Compra</label>
              <input
                type="number"
                value={newCoupon.minAmount}
                onChange={(e) => setNewCoupon(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>

            {newCoupon.discountType === 'percentage' && (
              <div className="form-group">
                <label>Descuento Máximo</label>
                <input
                  type="number"
                  value={newCoupon.maxDiscount}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, maxDiscount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                />
              </div>
            )}

            <div className="form-group">
              <label>Límite de Uso</label>
              <input
                type="number"
                value={newCoupon.usageLimit}
                onChange={(e) => setNewCoupon(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 0 }))}
                min="0"
                placeholder="0 = ilimitado"
              />
            </div>

            <div className="form-group">
              <label>Fecha de Expiración</label>
              <input
                type="datetime-local"
                value={newCoupon.expiresAt}
                onChange={(e) => setNewCoupon(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={newCoupon.onePerUser}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, onePerUser: e.target.checked }))}
                />
                Un uso por usuario
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">Crear Cupón</button>
          </div>
        </form>
      )}

      {/* Asignar cupón a usuario */}
      <div className="assign-coupon-section">
        <h3>Asignar Cupón a Usuario</h3>
        <div className="assign-form">
          <select
            value={selectedCouponId}
            onChange={(e) => setSelectedCouponId(e.target.value)}
          >
            <option value="">Seleccionar Cupón</option>
            {coupons.filter(c => c.active).map(coupon => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.code} - {coupon.description}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="ID del Usuario"
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
          />
          <button onClick={handleAssignCoupon} className="assign-btn">
            Asignar Cupón
          </button>
        </div>
      </div>

      {/* Lista de cupones */}
      <div className="coupons-list">
        <h3>Cupones Activos</h3>
        <div className="coupons-grid">
          {coupons.map(coupon => (
            <div key={coupon.id} className={`coupon-card ${coupon.active ? 'active' : 'inactive'}`}>
              <div className="coupon-header">
                <div className="coupon-code">{coupon.code}</div>
                <div className="coupon-status">
                  {coupon.active ? '✅ Activo' : '❌ Inactivo'}
                </div>
              </div>

              <div className="coupon-details">
                <div className="coupon-description">{coupon.description}</div>
                <div className="coupon-discount">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% OFF`
                    : `$${coupon.discountValue} OFF`
                  }
                </div>

                {coupon.minAmount > 0 && (
                  <div className="coupon-min-amount">
                    Mínimo: ${coupon.minAmount}
                  </div>
                )}

                {coupon.usageLimit > 0 && (
                  <div className="coupon-usage">
                    Usos: {coupon.usedCount || 0} / {coupon.usageLimit}
                  </div>
                )}

                {coupon.expiresAt && (
                  <div className="coupon-expiry">
                    Expira: {coupon.expiresAt.toLocaleDateString()}
                  </div>
                )}

                <div className="coupon-actions">
                  {coupon.active && (
                    <button
                      onClick={() => deactivateCoupon(coupon.id)}
                      className="deactivate-btn"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .coupon-manager {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .coupon-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .create-coupon-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .coupon-form {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group select {
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .code-input-group {
          display: flex;
          gap: 10px;
        }

        .generate-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
        }

        .checkbox-group {
          grid-column: span 2;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .form-actions {
          text-align: center;
        }

        .submit-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
        }

        .assign-coupon-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        .assign-form {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .assign-form select,
        .assign-form input {
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          flex: 1;
        }

        .assign-btn {
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .coupons-list h3 {
          margin-bottom: 20px;
        }

        .coupons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .coupon-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 2px solid #e5e7eb;
        }

        .coupon-card.active {
          border-color: #10b981;
        }

        .coupon-card.inactive {
          border-color: #ef4444;
          opacity: 0.7;
        }

        .coupon-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .coupon-code {
          font-size: 18px;
          font-weight: bold;
          font-family: monospace;
          color: #1f2937;
        }

        .coupon-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          background: #dcfce7;
          color: #166534;
        }

        .coupon-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .coupon-description {
          font-weight: 600;
          color: #374151;
        }

        .coupon-discount {
          font-size: 16px;
          color: #059669;
          font-weight: bold;
        }

        .coupon-min-amount,
        .coupon-usage,
        .coupon-expiry {
          font-size: 14px;
          color: #6b7280;
        }

        .coupon-actions {
          margin-top: 15px;
        }

        .deactivate-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .coupon-user-view {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .user-coupons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .user-coupon-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          border: 2px dashed #3b82f6;
        }

        .user-coupon-card .coupon-code {
          font-size: 20px;
          margin-bottom: 10px;
        }

        .user-coupon-card .coupon-discount {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .user-coupon-card .coupon-expiry {
          color: #ef4444;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .checkbox-group {
            grid-column: span 1;
          }

          .assign-form {
            flex-direction: column;
          }

          .coupons-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
