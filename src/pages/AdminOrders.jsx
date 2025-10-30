import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';

export default function AdminOrders() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, confirmed, all

  useEffect(() => {
    if (!user) return;

    let q;
    if (filter === 'all') {
      q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    } else {
      q = query(
        collection(db, 'orders'),
        where('status', '==', filter),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, snapshot => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, filter]);

  const confirmPayment = async orderId => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: user.uid,
      });

      // Enviar WhatsApp de confirmación si tiene teléfono
      const order = orders.find(o => o.id === orderId);
      if (order.phoneNumber) {
        await fetch('http://localhost:3001/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: order.phoneNumber,
            message: `✅ *Pago Confirmado*

¡Hola ${order.userName}! Tu pago por $${order.total} ha sido confirmado exitosamente.

📦 Tu orden está siendo preparada y será enviada pronto.

¡Gracias por tu compra! 🛒`,
          }),
        });
      }

      addToast('Pago confirmado exitosamente', 'success');
    } catch (error) {
      console.error('Error confirmando pago:', error);
      addToast('Error confirmando pago', 'error');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return '#ffa500';
      case 'confirmed':
        return '#28a745';
      case 'completed':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Cargando órdenes...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>📋 Gestión de Órdenes</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Filtrar por estado:
        </label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="all">Todas</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <p>No hay órdenes {filter !== 'all' ? filter + 's' : ''}.</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {orders.map(order => (
            <div
              key={order.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <h3>Orden #{order.id.slice(-8)}</h3>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    color: 'white',
                    backgroundColor: getStatusColor(order.status),
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <p>
                  <strong>Cliente:</strong> {order.userName} ({order.userEmail})
                </p>
                <p>
                  <strong>Método de pago:</strong> {order.paymentMethod}
                </p>
                <p>
                  <strong>Total:</strong> ${order.total}
                </p>
                <p>
                  <strong>Fecha:</strong>{' '}
                  {order.timestamp?.toDate().toLocaleString()}
                </p>
                {order.phoneNumber && (
                  <p>
                    <strong>Teléfono:</strong> {order.phoneNumber}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <h4>Productos:</h4>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.nombre} x{item.quantity} = $
                      {item.precio * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {order.status === 'pending' && (
                <button
                  onClick={() => confirmPayment(order.id)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ✅ Confirmar Pago
                </button>
              )}

              {order.confirmedAt && (
                <p
                  style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}
                >
                  Confirmado el: {order.confirmedAt.toDate().toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
