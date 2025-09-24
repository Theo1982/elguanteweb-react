// src/components/ProductCard.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LazyImage from "./LazyImage";
import "../styles/ProductCard.css";

const ProductCard = ({ product }) => {
  // Define fragrances for specific products
  const getFragrances = (product) => {
    const handle = product.handle || "";

    if (handle === "jabon-liquido-ropa") {
      return ["verde", "azul", "violeta"];
    } else if (handle === "detergente-oxigel") {
      return ["naranja", "limón", "marino"];
    } else if (handle === "desodorante-piso") {
      return ["marino", "lavanda", "limón", "citronela", "chicle", "espadol", "pino", "fresias", "manzana/canela"];
    } else if (handle === "suavizante-original") {
      return ["brisa", "flowers", "coniglio"];
    }
    return null;
  };

  const fragrances = getFragrances(product);

  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedFragrance, setSelectedFragrance] = useState(fragrances ? fragrances[0] : "");

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      await addToCart({ ...product, variant: fragrances ? selectedFragrance : '' });
      // Aquí podrías agregar una notificación toast
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite(product.id)) {
        await removeFromFavorites(product.id);
      } else {
        await addToFavorites(product);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getStockBadgeClass = () => {
    if (product.stock === undefined) return "product-card-stock-badge";
    if (product.stock <= 0) return "product-card-stock-badge out";
    if (product.stock <= 10) return "product-card-stock-badge low";
    return "product-card-stock-badge";
  };

  const getButtonClass = () => {
    let baseClass = "product-card-button";
    if (isLoading) baseClass += " loading";
    else if (product.stock !== undefined && product.stock <= 0) baseClass += " out-of-stock";
    else if (isInCart(product.id)) baseClass += " in-cart";
    return baseClass;
  };

  return (
    <div className="product-card">
      {/* Stock Badge */}
      {product.stock !== undefined && (
        <div className={getStockBadgeClass()}>
          {product.stock > 0 ? `Stock: ${product.stock}` : "Sin stock"}
        </div>
      )}

      {/* Image */}
      <div className="product-card-image-container">
        {imageError ? (
          <div className="product-card-placeholder">
            🖼️
          </div>
        ) : (
          <LazyImage
            src={product.imagen}
            alt={product.nombre}
            className="product-card-image"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Product Info */}
      <h3 className="product-card-title">{product.nombre}</h3>

      <p className="product-card-price">
        ${Number(product.precio).toLocaleString('es-AR')}
      </p>

      {product.descripcion && (
        <p className="product-card-description">
          {product.descripcion}
        </p>
      )}

      {/* Category */}
      {product.categoria && (
        <span className="product-card-category">
          {product.categoria}
        </span>
      )}

      {/* Fragrance Selector */}
      {fragrances && (
        <div className="product-card-fragrance">
          <label htmlFor={`fragrance-${product.id}`}>Fragancia:</label>
          <select
            id={`fragrance-${product.id}`}
            value={selectedFragrance}
            onChange={(e) => setSelectedFragrance(e.target.value)}
            className="product-card-fragrance-select"
          >
            {fragrances.map((frag) => (
              <option key={frag} value={frag}>{frag}</option>
            ))}
          </select>
        </div>
      )}

      {/* Favorite Button */}
      <button
        className={`product-card-favorite ${isFavorite(product.id) ? 'active' : ''}`}
        onClick={handleToggleFavorite}
        title={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {isFavorite(product.id) ? '❤️' : '🤍'}
      </button>

      {/* Add to Cart Button */}
      <button
        className={getButtonClass()}
        onClick={handleAddToCart}
        disabled={isLoading || (product.stock !== undefined && product.stock <= 0)}
      >
        {isLoading ? (
          <>
            <div className="product-card-spinner"></div>
            Agregando...
          </>
        ) : product.stock !== undefined && product.stock <= 0 ? (
          <>
            ❌ Sin stock
          </>
        ) : isInCart(product.id) ? (
          <>
            ✅ En carrito ({getItemQuantity(product.id)})
          </>
        ) : (
          <>
            🛒 Agregar al carrito
          </>
        )}
      </button>
    </div>
  );
};

ProductCard.displayName = 'ProductCard';

export default ProductCard;
