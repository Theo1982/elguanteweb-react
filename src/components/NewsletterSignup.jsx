import { useState } from 'react';
import { useNewsletter } from '../hooks/useNewsletter';
import LoadingSpinner from './LoadingSpinner';

export default function NewsletterSignup({ compact = false, showInterests = true }) {
  const { subscribe, loading } = useNewsletter();
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState([]);

  const interestOptions = [
    { id: 'productos', label: 'Nuevos productos', value: 'productos' },
    { id: 'promociones', label: 'Promociones y descuentos', value: 'promociones' },
    { id: 'consejos', label: 'Consejos de limpieza', value: 'consejos' },
    { id: 'noticias', label: 'Noticias de la tienda', value: 'noticias' }
  ];

  const handleInterestChange = (interestValue) => {
    setInterests(prev =>
      prev.includes(interestValue)
        ? prev.filter(i => i !== interestValue)
        : [...prev, interestValue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await subscribe(email, interests);
    if (success) {
      setEmail('');
      setInterests([]);
    }
  };

  if (compact) {
    return (
      <div className="newsletter-compact">
        <form onSubmit={handleSubmit} className="newsletter-form-compact">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu email..."
            required
            className="newsletter-input-compact"
          />
          <button
            type="submit"
            disabled={loading}
            className="newsletter-btn-compact"
          >
            {loading ? <LoadingSpinner size="small" /> : 'Suscribirse'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="newsletter-signup">
      <div className="newsletter-content">
        <h3>📧 Suscríbete a nuestro Newsletter</h3>
        <p>Recibe ofertas exclusivas, nuevos productos y consejos de limpieza</p>

        <form onSubmit={handleSubmit} className="newsletter-form">
          <div className="newsletter-input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
              className="newsletter-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="newsletter-btn"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Suscribirse'}
            </button>
          </div>

          {showInterests && (
            <div className="newsletter-interests">
              <p>¿Qué te interesa? (opcional)</p>
              <div className="interests-grid">
                {interestOptions.map(option => (
                  <label key={option.id} className="interest-checkbox">
                    <input
                      type="checkbox"
                      checked={interests.includes(option.value)}
                      onChange={() => handleInterestChange(option.value)}
                    />
                    <span className="checkmark"></span>
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>

        <p className="newsletter-disclaimer">
          Respetamos tu privacidad. Puedes darte de baja en cualquier momento.
        </p>
      </div>
    </div>
  );
}
