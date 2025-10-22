import React, { useEffect, useState } from 'react';
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
        background: 'linear-gradient(to right, #e3f2fd, #bbdefb)',
        border: '1px solid #1b72e8',
        borderRadius: '10px',
        cursor: 'pointer',
        boxShadow: isHovered
          ? '0 6px 12px rgba(27, 114, 232, 0.3)'
          : '0 4px 8px rgba(27, 114, 232, 0.2)',
        fontSize: '14px',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
      <p style={{ margin: 0, fontWeight: 'bold', color: '#1b72e8' }}>
        🏆 Nivel: {nivel} ({puntos} pts)
      </p>
      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#555' }}>
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
