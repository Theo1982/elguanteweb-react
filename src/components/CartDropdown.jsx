import PropTypes from 'prop-types';
import { useCart } from '../context/CartContext';

export default function CartDropdown({ onClose }) {
  const { items, remove, dec, add, total, clear } = useCart();

  return (
    <div className="dropdown">
      <h4>Tu carrito</h4>
      {items.length === 0 && (
        <div className="small">No hay productos en el carrito.</div>
      )}
      {items.map(i => (
        <div className="row" key={i.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{i.icon}</span>
            <div>
              <div style={{ fontWeight: 700 }}>{i.title}</div>
              <div className="small">$ {i.price.toLocaleString('es-AR')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn" onClick={() => dec(i.id)}>
              -
            </button>
            <span>{i.qty}</span>
            <button className="btn" onClick={() => add(i)}>
              +
            </button>
            <button className="btn" onClick={() => remove(i.id)}>
              ✖
            </button>
          </div>
        </div>
      ))}
      {items.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
            }}
          >
            <span>Total</span>
            <span>$ {total.toLocaleString('es-AR')}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={clear}>
              Vaciar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                alert('Checkout de ejemplo');
                onClose?.();
              }}
            >
              Ir a pagar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

CartDropdown.propTypes = {
  onClose: PropTypes.func,
};
