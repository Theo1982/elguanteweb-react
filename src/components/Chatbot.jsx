import React, { useState } from 'react';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: '¡Hola! Soy el asistente de El Guante. ¿En qué puedo ayudarte?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);

    const botResponse = getBotResponse(input.toLowerCase());
    setTimeout(() => {
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    }, 500);

    setInput('');
  };

  const getBotResponse = (message) => {
    if (message.includes('hola') || message.includes('buenos') || message.includes('saludos')) {
      return '¡Hola! ¿Cómo estás? Estoy aquí para ayudarte con nuestros productos de limpieza.';
    } else if (message.includes('productos') || message.includes('comprar') || message.includes('tienda')) {
      return 'Puedes ver nuestros productos en la sección de Tienda. Ofrecemos detergentes, jabones y más.';
    } else if (message.includes('carrito') || message.includes('compra')) {
      return 'Para agregar productos al carrito, ve a la página de un producto y haz clic en "Agregar al carrito".';
    } else if (message.includes('ayuda') || message.includes('problema')) {
      return 'Estoy aquí para ayudarte. ¿Qué necesitas saber sobre nuestros productos o el sitio?';
    } else if (message.includes('contacto') || message.includes('telefono') || message.includes('email')) {
      return 'Puedes contactarnos a través de nuestro formulario en la página de inicio o por email.';
    } else if (message.includes('envio') || message.includes('entrega')) {
      return 'Ofrecemos envío a domicilio en toda la ciudad. Los tiempos de entrega son de 1-3 días hábiles.';
    } else if (message.includes('pago') || message.includes('formas')) {
      return 'Aceptamos pagos con tarjeta de crédito, débito y efectivo contra entrega.';
    } else {
      return 'Lo siento, no entendí tu pregunta. ¿Puedes reformularla o preguntarme sobre productos, carrito, envíos o pagos?';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
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
            <button className="chatbot-close" onClick={toggleChat}>×</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="chatbot-input"
            />
            <button onClick={handleSend} className="chatbot-send">Enviar</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
