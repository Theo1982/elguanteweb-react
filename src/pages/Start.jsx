// src/pages/Start.jsx
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Start() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/shop');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#87CEEB',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <img
          src={logo}
          alt="El Guante Web Logo"
          onClick={handleClick}
          style={{
            width: '250px',
            height: '250px',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            animation: 'fadeInUp 1s ease-out 0.5s both, pulse 2s infinite',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
          }}
        />
        <p style={{ color: '#fff', marginTop: '20px', fontSize: '16px' }}>
          Haz clic en el logo para comenzar
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
