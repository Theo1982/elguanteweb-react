// src/pages/Failure.jsx
import { Link } from 'react-router-dom';

export default function Failure() {
  return (
    <div style={styles.container}>
      <h1 style={{ color: '#dc3545' }}>❌ Pago Fallido</h1>
      <p>Hubo un problema al procesar tu compra. Inténtalo nuevamente.</p>
      <Link to="/cart" style={styles.button}>
        🔄 Volver al Carrito
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
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '6px',
    textDecoration: 'none',
  },
};
