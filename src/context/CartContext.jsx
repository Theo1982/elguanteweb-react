// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CartContext = createContext();

export function CartProvider({ children }) {
  CartProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('elguante_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('elguante_cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, loading]);

  const addToCart = product => {
    if (!product || !product.id) {
      console.error('Invalid product:', product);
      return;
    }

    const variant = product.variant || '';

    setCart(prevCart => {
      const existing = prevCart.find(
        item => item.id === product.id && item.variant === variant
      );

      if (existing) {
        return prevCart.map(item =>
          item.id === product.id && item.variant === variant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Validar campos requeridos
        const newItem = {
          id: product.id,
          variant,
          nombre: product.nombre + (variant ? ` (${variant})` : ''),
          precio: Number(product.precio) || 0,
          imagen: product.imagen || '/img/placeholder.jpg',
          descripcion: product.descripcion || '',
          quantity: 1,
          notes: '',
        };

        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (id, variant) => {
    setCart(prevCart =>
      prevCart.filter(item => !(item.id === id && item.variant === variant))
    );
  };

  const updateQuantity = (id, variant, quantity) => {
    const newQuantity = Math.max(1, Math.min(99, Number(quantity) || 1));
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id && item.variant === variant
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const updateNotes = (id, variant, notes) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id && item.variant === variant ? { ...item, notes } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.precio * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = productId => {
    return cart.some(item => item.id === productId);
  };

  const getItemQuantity = productId => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNotes,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
