import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import useRecommendations from '../hooks/useRecommendations';
import RecommendedProducts from '../components/RecommendedProducts';

export default function Home() {
  // Obtener recomendaciones populares para la página principal
  const { recommendations, loading, error } = useRecommendations(null, {
    limit: 8,
    strategy: 'popular'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Hero Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '0 0 20px 20px',
          marginBottom: '2rem',
        }}
      >
        <Link to="/shop">
          <img
            src={logo}
            alt="ElGuante"
            style={{
              width: '250px',
              height: 'auto',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
            onMouseOver={e => (e.target.style.transform = 'scale(1.05)')}
            onMouseOut={e => (e.target.style.transform = 'scale(1)')}
          />
        </Link>
      </div>

      {/* Sección de productos destacados */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <RecommendedProducts
          recommendations={recommendations}
          loading={loading}
          error={error}
          title="Productos Más Populares"
          showReason={false}
          maxItems={8}
          className="home-featured"
        />

        {/* Call to action */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>
            ¡Descubre Nuestra Tienda!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Productos de calidad con los mejores precios del mercado
          </p>
          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'background 0.3s',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
            }}
            onMouseOver={e => e.target.style.background = '#2563eb'}
            onMouseOut={e => e.target.style.background = '#3b82f6'}
          >
            Explorar Productos →
          </Link>
        </div>
      </div>
    </div>
  );
}
