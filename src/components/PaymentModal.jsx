import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

const PaymentModal = ({ isOpen, onClose, cart, total, onPaymentComplete }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    {
      id: 'efectivo',
      name: 'Efectivo',
      description: 'Pago en efectivo al momento de la entrega',
      icon: '💵',
      fields: [],
    },
    {
      id: 'tarjeta',
      name: 'Tarjeta de Crédito/Débito',
      description: 'Pago seguro con MercadoPago',
      icon: '💳',
      fields: [],
    },
    {
      id: 'transferencia',
      name: 'Transferencia Bancaria',
      description: 'Transferí desde tu banco',
      icon: '🏦',
      fields: [
        {
          name: 'phoneNumber',
          label: 'Número de celular (obligatorio)',
          type: 'tel',
          placeholder: '5492211234567',
          required: true,
          pattern: '^549[0-9]{10}$',
          help: 'Necesitamos tu celular para confirmar el pago',
        },
      ],
    },
    {
      id: 'link',
      name: 'Link de Pago',
      description: 'Recibí un link para pagar después',
      icon: '🔗',
      fields: [],
    },
  ];

  const handleMethodSelect = methodId => {
    setSelectedMethod(methodId);
    setPhoneNumber('');
  };

  const validateForm = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return false;

    if (method.id === 'transferencia') {
      const phonePattern = /^549[0-9]{10}$/;
      if (!phoneNumber || !phonePattern.test(phoneNumber)) {
        addToast(
          'Ingresa un número de celular válido (549XXXXXXXXXX)',
          'error'
        );
        return false;
      }
    }

    return true;
  };

  const sendWhatsAppMessage = async orderData => {
    try {
      const message = `🛒 *Nueva Orden Pendiente*

👤 *Cliente:* ${user.displayName || user.email}
📱 *Celular:* ${phoneNumber}
💰 *Total:* $${orderData.total}

📦 *Productos:*
${orderData.items
  .map(
    item =>
      `• ${item.nombre} x${item.quantity} = $${item.precio * item.quantity}`
  )
  .join('\n')}

💳 *Método:* Transferencia
🏦 *Alias:* elguante.mp

✅ *Confirmar recepción del pago:*
${window.location.origin}/admin/confirm-payment/${orderData.id}

⚠️ Una vez confirmado, la orden se marcará como pagada.`;

      const response = await fetch('http://localhost:3001/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '5492214760630', // Número del admin
          message,
        }),
      });

      if (!response.ok) {
        console.error('Error sending WhatsApp message');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const method = paymentMethods.find(m => m.id === selectedMethod);

      // Crear orden en Firestore
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        items: cart,
        productIds: cart.map(item => item.id),
        total: total,
        paymentMethod: method.name,
        status:
          method.id === 'transferencia' || method.id === 'efectivo'
            ? 'pending'
            : 'processing',
        timestamp: serverTimestamp(),
        pointsEarned: Math.floor(total / 1000),
        ...(phoneNumber && { phoneNumber }),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // ✅ FIXED: Add paymentId to order for webhook matching
      const paymentId =
        method.id === 'tarjeta' || method.id === 'link'
          ? `payment_${orderRef.id}`
          : null;
      if (paymentId) {
        await updateDoc(orderRef, { paymentId });
        orderData.paymentId = paymentId;
      }

      // Para transferencia, enviar WhatsApp al admin
      if (method.id === 'transferencia') {
        await sendWhatsAppMessage({ ...orderData, id: orderRef.id });
        addToast(
          'Orden creada. Te contactaremos cuando confirmemos el pago.',
          'info'
        );
      }

      // Para efectivo, solo notificar
      if (method.id === 'efectivo') {
        addToast(
          'Orden creada. El pago se realizará al momento de la entrega.',
          'info'
        );
      }

      // Para tarjeta/link, proceder con MercadoPago
      if (method.id === 'tarjeta' || method.id === 'link') {
        const response = await fetch(
          'http://localhost:3001/create_preference',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: cart.map(item => ({
                title: item.nombre,
                unit_price: Number(item.precio),
                quantity: item.quantity,
                currency_id: 'ARS',
                description: item.notes || '',
              })),
              usuarioId: user.uid,
              metadata: { total, orderId: orderRef.id },
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Error creando preferencia de pago');
        }

        const data = await response.json();
        if (data.init_point) {
          window.location.href = data.init_point;
          return;
        }
      }

      // Para métodos que no requieren redirección, cerrar modal y notificar
      onPaymentComplete(orderRef.id);
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      addToast('Error procesando el pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>💳 Seleccionar Método de Pago</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.methods}>
          {paymentMethods.map(method => (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              style={{
                ...styles.methodCard,
                ...(selectedMethod === method.id ? styles.selectedMethod : {}),
              }}
            >
              <div style={styles.methodHeader}>
                <span style={styles.methodIcon}>{method.icon}</span>
                <div>
                  <h3 style={styles.methodName}>{method.name}</h3>
                  <p style={styles.methodDescription}>{method.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedMethodData && selectedMethodData.fields.length > 0 && (
          <div style={styles.fields}>
            {selectedMethodData.fields.map(field => (
              <div key={field.name} style={styles.field}>
                <label style={styles.label}>
                  {field.label}
                  {field.required && <span style={styles.required}>*</span>}
                </label>
                <input
                  type={field.type}
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder={field.placeholder}
                  pattern={field.pattern}
                  required={field.required}
                  style={styles.input}
                />
                {field.help && <small style={styles.help}>{field.help}</small>}
              </div>
            ))}
          </div>
        )}

        {selectedMethod === 'transferencia' && (
          <div style={styles.transferInfo}>
            <h4>🏦 Datos para la Transferencia</h4>
            <p>
              <strong>Alias:</strong> elguante.mp
            </p>
            <p>
              <strong>Titular:</strong> El Guante S.A.
            </p>
            <p>
              <strong>CBU:</strong> 0000000000000000000000
            </p>
            <small style={styles.note}>
              Una vez realizada la transferencia, recibirás confirmación por
              WhatsApp.
            </small>
          </div>
        )}

        <div style={styles.actions}>
          <button
            onClick={onClose}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            style={styles.confirmButton}
            disabled={loading || !selectedMethod}
          >
            {loading ? '⏳ Procesando...' : '✅ Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      precio: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      notes: PropTypes.string,
    })
  ).isRequired,
  total: PropTypes.number.isRequired,
  onPaymentComplete: PropTypes.func.isRequired,
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  methods: {
    display: 'grid',
    gap: '12px',
    marginBottom: '24px',
  },
  methodCard: {
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  selectedMethod: {
    borderColor: '#2ea44f',
    backgroundColor: '#f0f9f0',
  },
  methodHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  methodIcon: {
    fontSize: '24px',
  },
  methodName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  methodDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  fields: {
    marginBottom: '24px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 'bold',
  },
  required: {
    color: '#d73a49',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
  },
  help: {
    display: 'block',
    marginTop: '4px',
    color: '#666',
    fontSize: '12px',
  },
  transferInfo: {
    backgroundColor: '#f6f8fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  note: {
    display: 'block',
    marginTop: '8px',
    color: '#586069',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2ea44f',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default PaymentModal;
