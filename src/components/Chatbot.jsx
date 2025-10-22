import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAnalytics } from '../hooks/useAnalytics';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: '¡Hola! Soy el asistente de El Guante 👋 ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [productos, setProductos] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const q = query(collection(db, 'productos'), where('activo', '==', true));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProductos(productsData);
        setLoadingProducts(false);
        // Cache for offline
        localStorage.setItem('products', JSON.stringify(productsData));
      },
      error => {
        console.error('Error fetching products:', error);
        setLoadingProducts(false);
        // Offline fallback
        const cached = localStorage.getItem('products');
        if (cached) {
          setProductos(JSON.parse(cached));
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    trackEvent('chat_message_sent', { message: input });

    const botResponse = getBotResponse(input.toLowerCase());
    setTimeout(() => {
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    }, 500);

    setInput('');
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const intents = [
    {
      keywords: ['hola', 'buenos', 'saludos'],
      response:
        '¡Hola! 😀 ¿Cómo estás? Puedo ayudarte con productos, precios, envíos, horarios o contacto por WhatsApp.',
    },
    {
      keywords: ['productos', 'catalogo', 'tienda'],
      response: () => {
        const lista = productos
          .map(p => `- ${p.nombre} ($${p.precio})`)
          .join('\n');
        return `Estos son algunos de nuestros productos:\n${lista}\n\nPuedes pedirme el precio de un producto específico 😉`;
      },
    },
    {
      keywords: ['precio', 'cuanto cuesta', 'costo'],
      response:
        'Por favor dime el nombre del producto y te diré el precio exacto.',
    },
    {
      keywords: ['reseñas', 'opiniones', 'reviews'],
      response:
        '⭐ Puedes ver las reseñas de un producto en su página de detalle. Visita /product/[id] para ver opiniones de otros clientes.',
    },
    {
      keywords: ['comparar', 'comparacion'],
      response:
        '🔄 Para comparar productos, usa la página de comparación: /compare/handle1/handle2. Dime dos nombres de productos para ayudarte.',
    },
    {
      keywords: ['nivel', 'puntos', 'descuento'],
      response:
        '📈 Tu nivel de usuario determina descuentos. Revisa tu perfil en /profile para ver tu nivel actual y puntos acumulados.',
    },
    {
      keywords: ['envio', 'entrega', 'costo envio'],
      response:
        '🚚 Ofrecemos envío a domicilio en toda la ciudad. Envío GRATIS en compras mayores a $10.000. Envío estándar: $2.000. Entrega: 1-3 días hábiles.',
    },
    {
      keywords: ['horario', 'atencion'],
      response:
        '🕒 Nuestro horario de atención es:\nLunes a Viernes: 9:00 a 16:00\nSábados y feriados: 10:00 a 13:00.',
    },
    {
      keywords: ['pago', 'formas', 'metodo'],
      response:
        '💳 Aceptamos pagos por transferencia, tarjeta de débito, crédito o efectivo.',
    },
    {
      keywords: ['devolucion', 'cambio'],
      response:
        '♻️ Aceptamos devoluciones dentro de 7 días con comprobante de compra.',
    },
    {
      keywords: ['contacto', 'telefono', 'email'],
      response:
        '📩 Puedes contactarnos desde el formulario en nuestra web o pedirme que te derive a WhatsApp.',
    },
    {
      keywords: ['whatsapp', 'humano', 'asesor', 'hablar'],
      response:
        '📲 Claro, puedes contactarnos directamente en WhatsApp: https://wa.me/5492214760630',
    },
    {
      keywords: ['ayuda', 'problema', 'soporte'],
      response:
        'Estoy aquí para ayudarte 🙌. Puedes preguntarme sobre productos, precios, envíos, pagos u horarios.',
    },
  ];

  const getBotResponse = message => {
    if (loadingProducts) {
      return '🔄 Cargando productos...';
    }

    const priceKeywords = ['precio', 'cuanto', 'costo', 'cuesta'];

    // Solo buscar producto si la consulta incluye palabras relacionadas con precio
    if (priceKeywords.some(kw => message.includes(kw))) {
      // Buscar producto específico con scoring para mejor coincidencia, priorizando nombre
      const words = message.split(/\s+/).filter(word => word.length > 2); // Palabras de más de 2 letras
      let bestProduct = null;
      let bestScore = 0;

      productos.forEach(p => {
        const nombreLower = p.nombre.toLowerCase();
        let score = 0;

        words.forEach(word => {
          const wordLower = word.toLowerCase();
          if (nombreLower.includes(wordLower)) score += 2; // Solo match en nombre
        });

        // Bonus por coincidencia exacta o cercana en nombre
        if (message.includes(nombreLower)) score += 3;

        if (score > bestScore) {
          bestScore = score;
          bestProduct = p;
        }
      });

      if (bestProduct && bestScore >= 2) {
        // Mínimo score para evitar falsos positivos
        const stockInfo =
          bestProduct.stock > 0
            ? `Stock disponible: ${bestProduct.stock}`
            : 'Sin stock disponible';
        return `💡 El precio de *${bestProduct.nombre}* es **$${bestProduct.precio}**.\n${stockInfo}`;
      }
    }

    // Buscar intent por palabras clave
    for (let intent of intents) {
      if (intent.keywords.some(kw => message.includes(kw))) {
        return typeof intent.response === 'function'
          ? intent.response()
          : intent.response;
      }
    }

    // Fallback
    return '🤔 No entendí tu consulta. Puedo ayudarte con:\n- Productos y precios\n- Envíos\n- Horarios\n- Pagos\n- Contacto en WhatsApp\n\n¿Qué te interesa?';
  };

  const renderMessageLine = line => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return line.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="chatbot-link"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <div className="chatbot-button" onClick={toggleChat}>
        💬
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Asistente de El Guante</span>
            <button className="chatbot-close" onClick={toggleChat}>
              ×
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text.split('\n').map((line, i) => (
                  <div key={i} className="message-line">
                    {renderMessageLine(line)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="chatbot-input"
            />
            <button onClick={handleSend} className="chatbot-send">
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
