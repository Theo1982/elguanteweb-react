// src/pages/History.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function History() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(collection(db, 'ordenes'), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    };
    fetchOrders();
  }, []);

  if (orders.length === 0) {
    return <p style={{ padding: '20px' }}>📭 No hay órdenes todavía.</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>📜 Historial de Compras</h1>
      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px',
          }}
        >
          <p>
            <strong>ID:</strong> {order.id}
          </p>
          <p>
            <strong>Estado:</strong> {order.estado}
          </p>
          <p>
            <strong>Total:</strong> ${order.total}
          </p>
          <p>
            <strong>Fecha:</strong> {order.fecha?.toDate().toLocaleString()}
          </p>
          <div>
            <strong>Productos:</strong>
            <ul>
              {order.productos.map((p, i) => (
                <li key={i}>
                  {p.nombre} x {p.quantity} (${p.precio} c/u)
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
