import React from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Shop.css";

export default function Favorites() {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return <LoadingSpinner message="Cargando favoritos..." />;
  }

  return (
    <div className="container">
      <h1>❤️ Mis Favoritos</h1>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No tienes productos favoritos aún.</p>
          <p>Ve a la tienda y agrega algunos productos a tus favoritos.</p>
          <button
            onClick={() => navigate('/shop')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1b72e8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Ir a la Tienda
          </button>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: '1rem' }}>
            Tienes {favorites.length} producto{favorites.length !== 1 ? 's' : ''} en favoritos.
          </p>
          <div className="grid">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
