import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import LoadingSpinner from './LoadingSpinner';

export default function ChatWidget() {
  const {
    messages,
    isTyping,
    isOpen,
    unreadCount,
    messagesEndRef,
    sendMessage,
    toggleChat,
    clearUnread,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Focus en input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className="chat-toggle-btn"
        aria-label={`Abrir chat${unreadCount > 0 ? `. ${unreadCount} mensajes nuevos` : ''}`}
      >
        {isOpen ? (
          <span className="close-icon">✕</span>
        ) : (
          <>
            <span className="chat-icon">💬</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="bot-avatar">🤖</div>
              <div className="bot-info">
                <div className="bot-name">Asistente ElGuante</div>
                <div className="bot-status">En línea</div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="close-chat-btn"
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  {message.text}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message bot-message typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="chat-input"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="send-btn"
              aria-label="Enviar mensaje"
            >
              📤
            </button>
          </form>
        </div>
      )}

      <style>{`
        .chat-toggle-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .chat-toggle-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }

        .chat-icon {
          font-size: 24px;
          color: white;
        }

        .close-icon {
          font-size: 20px;
          color: white;
        }

        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid white;
        }

        .chat-widget {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 12px 12px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bot-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .bot-info {
          display: flex;
          flex-direction: column;
        }

        .bot-name {
          font-weight: 600;
          font-size: 14px;
        }

        .bot-status {
          font-size: 12px;
          opacity: 0.8;
        }

        .close-chat-btn {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .close-chat-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }

        .user-message {
          align-self: flex-end;
          align-items: flex-end;
        }

        .bot-message {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          font-size: 14px;
          line-height: 1.4;
        }

        .user-message .message-content {
          background: #3b82f6;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .bot-message .message-content {
          background: #f3f4f6;
          color: #1f2937;
          border-bottom-left-radius: 4px;
        }

        .message-time {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          padding: 0 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ca3af;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }

        .chat-input-form {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
          resize: none;
        }

        .chat-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .chat-widget {
            width: calc(100vw - 40px);
            height: calc(100vh - 140px);
            bottom: 80px;
            right: 10px;
          }

          .chat-toggle-btn {
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>
    </>
  );
}
