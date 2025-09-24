import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos desde la colección "favoritos"
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "favoritos"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const favs = querySnapshot.docs.map(doc => ({
          id: doc.data().productId,
          ...doc.data().productData
        }));
        setFavorites(favs);
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const addToFavorites = async (product) => {
    if (!user || !product || !product.id) {
      console.error('Invalid user or product:', user, product);
      return;
    }

    // Check if already favorite
    if (favorites.some(item => item.id === product.id)) {
      return; // Already favorite
    }

    try {
      // Add to Firestore first
      await addDoc(collection(db, "favoritos"), {
        userId: user.uid,
        productId: product.id,
        productData: {
          nombre: product.nombre || 'Producto sin nombre',
          precio: Number(product.precio) || 0,
          imagen: product.imagen || '/img/placeholder.jpg',
          descripcion: product.descripcion || '',
          categoria: product.categoria || '',
          stock: product.stock || 0,
        },
        createdAt: serverTimestamp()
      });

      // Update local state after success
      const newItem = {
        id: product.id,
        nombre: product.nombre || 'Producto sin nombre',
        precio: Number(product.precio) || 0,
        imagen: product.imagen || '/img/placeholder.jpg',
        descripcion: product.descripcion || '',
        categoria: product.categoria || '',
        stock: product.stock || 0,
      };
      setFavorites(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (productId) => {
    if (!user) return;

    try {
      // Find and delete from Firestore
      const q = query(collection(db, "favoritos"), where("userId", "==", user.uid), where("productId", "==", productId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Update local state
      setFavorites(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(item => item.id === productId);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        getFavoritesCount
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
