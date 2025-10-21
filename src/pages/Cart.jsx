// src/pages/Cart.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useToast } from "../hooks/useToast";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { getUserLevel } from "../utils/getUserLevel";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, updateNotes, clearCart } = useCart();
  const { user } = useAuth();
  const [nivel, setNivel] = useState(null);
  const [loading, setLoading] = useState(false);

  const total = cart.reduce(
    (acc, product) => acc + Number(product.precio) * product.quantity,
    0
  );

  const totalConDescuento = nivel
    ? Math.round(total * (1 - nivel.descuento / 100))
    : total;

  useEffect(() => {
    const fetchNivel = async () => {
      if (user) {
        const data = await getUserLevel(user.uid);
        setNivel(data);
      }
    };
    fetchNivel();
  }, [user]);

  const handleCheckout = async () => {
    if (!user) {
      addToast("Debes estar logueado para pagar", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/create_preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            title: item.nombre,
            unit_price: Number(item.precio),
            quantity: item.quantity,
            currency_id: "ARS",
            description: item.notes || ''
          })),
          usuarioId: user.uid,
          metadata: { total: totalConDescuento }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        addToast(errorData.details || "Error al crear pago", "error");
        return;
      }

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        addToast("Error: No se pudo generar el pago", "error");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      addToast("Error de conexión al procesar pago", "error");
    } finally {
      setLoading(false);
    }
  };

  // Remove simulated order saving - handle in Success or webhook

  if (cart.length === 0) {
    return <p style={{ padding: "20px" }}>🛒 Tu carrito está vacío.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛒 Carrito</h1>

      {nivel && (
        <p style={{ marginBottom: "15px" }}>
          🎖️ Nivel:{" "}
          <span
            style={{
              fontWeight: "bold",
              textDecoration: "underline",
              cursor: "help",
              position: "relative",
            }}
            title="Sistema de puntos: 
Cada $1000 = 1 punto. 
25 puntos = Bronce (5% desc).
50 puntos = Plata (10% desc).
100 puntos = Oro (15% desc).
Los puntos expiran a los 60 días."
          >
            {nivel.nivel}
          </span>{" "}
          | Puntos: <b>{nivel.puntos}</b> | Descuento:{" "}
          <b>{nivel.descuento}%</b>
        </p>
      )}

      {cart.map((product) => (
        <div
          key={`${product.id}-${product.variant || ''}`}
          style={{
            borderBottom: "1px solid #ddd",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <img
            src={product.imagen}
            alt={product.nombre}
            style={{ width: "80px", height: "80px", objectFit: "contain" }}
          />
          <div style={{ flex: 1 }}>
            <h3>{product.nombre}</h3>
            <p>Precio unitario: ${product.precio}</p>
            <p>Subtotal: ${Number(product.precio) * product.quantity}</p>
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Detalles del producto</label>
              <textarea
                value={product.notes || ''}
                onChange={(e) => updateNotes(product.id, product.variant || '', e.target.value)}
                placeholder="Aclaraciones específicas sobre este producto..."
                rows="3"
                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
          </div>
          <div>
            <input
              type="number"
              value={product.quantity}
              min="1"
              style={{ width: "60px" }}
              onChange={(e) =>
                updateQuantity(product.id, product.variant || '', Number(e.target.value))
              }
            />
          </div>
          <button
            style={{
              marginLeft: "10px",
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onClick={() => removeFromCart(product.id, product.variant || '')}
          >
            ❌ Eliminar
          </button>
        </div>
      ))}

      <h2 style={{ marginTop: "20px" }}>💵 Total: ${total}</h2>
      {nivel && nivel.descuento > 0 && (
        <h3 style={{ color: "green" }}>
          🎁 Con descuento {nivel.descuento}% → Total final: ${totalConDescuento}
        </h3>
      )}

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          style={{
            backgroundColor: "#2ea44f",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "⏳ Procesando..." : "✅ Proceder al Pago"}
        </button>
      </div>
    </div>
  );
}
