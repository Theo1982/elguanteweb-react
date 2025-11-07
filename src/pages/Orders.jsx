import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Orders = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      addToast('Debes estar logueado para ver órdenes', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      err => {
        console.error('Error fetching orders:', err);
        setError(err.message);
        setLoading(false);
        addToast('Error al cargar órdenes', 'error');
      }
    );

    return () => unsubscribe();
  }, [user, addToast]);

  if (loading) return <LoadingSpinner />;
  if (error) return <p>Error: {error}</p>;

  if (orders.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Tus Órdenes</h2>
        <p>
          No tienes órdenes aún. <Link to="/shop">Ir a la tienda</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Tus Órdenes</h2>
      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            marginBottom: '20px',
            padding: '15px',
            borderRadius: '8px',
          }}
        >
          <h3>Orden #{order.id.slice(-6)}</h3>
          <p>
            Fecha:{' '}
            {order.timestamp?.toDate
              ? order.timestamp.toDate().toLocaleDateString()
              : 'Reciente'}
          </p>
          <p>
            Estado:{' '}
            <span
              style={{
                color: order.status === 'completed' ? 'green' : 'orange',
              }}
            >
              {order.status}
            </span>
          </p>
          <p>Total: ${order.total}</p>
          <p>Puntos Ganados: {order.pointsEarned}</p>
          <h4>Productos:</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.nombre} x{item.quantity} - ${item.precio}
                {order.productIds && (
                  <Link to={`/product/${order.productIds[index]}`}>
                    {' '}
                    Ver Producto
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Orders;
