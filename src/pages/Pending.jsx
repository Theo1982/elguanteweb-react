// src/pages/Pending.jsx
import { Link } from 'react-router-dom';

export default function Pending() {
  return (
    <div style={styles.container}>
      <h1 style={{ color: '#ffc107' }}>⏳ Pago Pendiente</h1>
      <p>Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
      <Link to="/" style={styles.button}>
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
    backgroundColor: '#ffc107',
    color: '#000',
    padding: '10px 15px',
    borderRadius: '6px',
    textDecoration: 'none',
  },
};
