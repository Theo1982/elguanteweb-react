import { useEffect, useState } from 'react';
import { getUserLevel } from '../utils/getUserLevel';
import { useAuth } from '../context/AuthContext';

export default function MiNivel() {
  const { user } = useAuth();
  const [nivel, setNivel] = useState(null);
  const [puntos, setPuntos] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user) {
      (async () => {
        const { puntos, nivel, descuento } = await getUserLevel(user.uid);
        setNivel(nivel);
        setPuntos(puntos);
        setDescuento(descuento);
      })();
    }
  }, [user]);

  if (!user) {
    return (
      <p style={{ padding: '10px' }}>🔑 Inicia sesión para ver tu nivel</p>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: '140px',
        padding: '10px 15px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: '2px solid #5a67d8',
        borderRadius: '15px',
        cursor: 'pointer',
        boxShadow: isHovered
          ? '0 8px 16px rgba(102, 126, 234, 0.4)'
          : '0 6px 12px rgba(102, 126, 234, 0.3)',
        fontSize: '14px',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setIsHovered(false);
      }}
    >
      <p style={{ margin: 0, fontWeight: 'bold', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        🏆 Nivel: {nivel} ({puntos} pts)
      </p>
      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        🎁 Descuento: {descuento}%
      </p>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '10px',
            padding: '10px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            width: '250px',
            fontSize: '14px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 100,
          }}
        >
          <strong>📊 Sistema de Niveles</strong>
          <ul style={{ margin: '10px 0', paddingLeft: '18px' }}>
            <li>🥉 Bronze: 25 pts → 5% descuento</li>
            <li>🥈 Plata: 50 pts → 10% descuento</li>
            <li>🥇 Oro: 100 pts → 15% descuento</li>
          </ul>
          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
            Los puntos expiran a los 60 días.
          </p>
        </div>
      )}
    </div>
  );
}
