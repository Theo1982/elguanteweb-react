import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';

export const useChat = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Respuestas automáticas del chatbot
  const botResponses = {
    greeting: [
      "¡Hola! 👋 Soy tu asistente de ElGuante. ¿En qué puedo ayudarte?",
      "¡Hola! Bienvenido a ElGuante. ¿Qué necesitas?",
      "¡Hola! ¿Cómo puedo ayudarte hoy?"
    ],
    products: [
      "Tenemos una amplia variedad de productos de limpieza y hogar. ¿Qué tipo de producto buscas?",
      "Ofrecemos productos de limpieza, higiene personal, y artículos para el hogar. ¿Qué te interesa?",
      "Nuestra tienda tiene productos de limpieza, detergentes, jabones y mucho más. ¿Qué necesitas?"
    ],
    shipping: [
      "Realizamos envíos a todo el país. Los tiempos de entrega varían según tu ubicación.",
      "Enviamos a domicilio en toda Argentina. El costo y tiempo depende de tu código postal.",
      "Ofrecemos delivery gratuito en compras superiores a $5000. Para otras zonas, el costo se calcula automáticamente."
    ],
    payment: [
      "Aceptamos efectivo, tarjeta de crédito/débito, transferencia bancaria y MercadoPago.",
      "Puedes pagar con tarjeta, efectivo, transferencia o link de pago. Todas las opciones son seguras.",
      "Múltiples formas de pago: efectivo, tarjeta, transferencia y MercadoPago con cuotas."
    ],
    support: [
      "Estoy aquí para ayudarte. ¿Qué necesitas saber?",
      "Puedo ayudarte con información sobre productos, envíos, pagos y más. ¿Qué te gustaría saber?",
      "¡Claro! Estoy para ayudarte con cualquier consulta sobre nuestros productos o servicios."
    ],
    default: [
      "Lo siento, no entendí tu pregunta. ¿Puedes reformularla?",
      "Disculpa, no pude entenderte. ¿Puedes ser más específico?",
      "No estoy seguro de entender. ¿Puedes darme más detalles?"
    ]
  };

  // Función para clasificar mensajes y dar respuestas
  const getBotResponse = useCallback((userMessage) => {
    const message = userMessage.toLowerCase();

    // Saludar
    if (message.includes('hola') || message.includes('buenos') || message.includes('buenas')) {
      return botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
    }

    // Productos
    if (message.includes('producto') || message.includes('comprar') || message.includes('venta')) {
      return botResponses.products[Math.floor(Math.random() * botResponses.products.length)];
    }

    // Envíos
    if (message.includes('envio') || message.includes('delivery') || message.includes('entrega')) {
      return botResponses.shipping[Math.floor(Math.random() * botResponses.shipping.length)];
    }

    // Pagos
    if (message.includes('pago') || message.includes('tarjeta') || message.includes('efectivo') || message.includes('mercado')) {
      return botResponses.payment[Math.floor(Math.random() * botResponses.payment.length)];
    }

    // Soporte general
    if (message.includes('ayuda') || message.includes('ayudame') || message.includes('consulta')) {
      return botResponses.support[Math.floor(Math.random() * botResponses.support.length)];
    }

    // Default
    return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
  }, []);

  // Enviar mensaje
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simular tiempo de respuesta
    setTimeout(() => {
      const botResponse = getBotResponse(text);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      // Incrementar contador de no leídos si el chat está cerrado
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 1000 + Math.random() * 2000); // 1-3 segundos de delay

  }, [getBotResponse, isOpen]);

  // Limpiar mensajes no leídos
  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Toggle chat
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      clearUnread();
    }
  }, [isOpen, clearUnread]);

  // Scroll automático al final
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mensaje de bienvenida automático
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        text: "¡Hola! 👋 Soy tu asistente de ElGuante. ¿En qué puedo ayudarte?",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  return {
    messages,
    isTyping,
    isOpen,
    unreadCount,
    messagesEndRef,
    sendMessage,
    toggleChat,
    clearUnread,
  };
};
