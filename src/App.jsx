// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import useCreateUserDoc from "./hooks/useCreateUserDoc";
import LoadingSpinner from "./components/LoadingSpinner";
import ToastContainer from "./components/ToastContainer";
import Chatbot from "./components/Chatbot";


// Lazy loading de componentes para mejor rendimiento
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Cart = lazy(() => import("./pages/Cart"));
const History = lazy(() => import("./pages/History"));
const Success = lazy(() => import("./pages/Success"));
const Failure = lazy(() => import("./pages/Failure"));
const Pending = lazy(() => import("./pages/Pending"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Start = lazy(() => import("./pages/Start"));
const Shop = lazy(() => import("./pages/Shop"));

// Componente interno que usa los hooks
function AppContent() {
  useCreateUserDoc();

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/start" element={<Start />} />
          <Route path="/login" element={<Login />} />

          {/* Resto de la app con Navbar */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main style={{ minHeight: 'calc(100vh - 70px)', paddingTop: '70px' }}>
                  <Routes>
                        <Route path="/home" element={<Navigate to="/shop" replace />} />
                    <Route path="/shop" element={<Shop />} />
                    
                    {/* Rutas que requieren autenticación */}
                    <Route 
                      path="/cart" 
                      element={
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/history" 
                      element={
                        <ProtectedRoute>
                          <History />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />

                    {/* Rutas de pago */}
                    <Route path="/success" element={<Success />} />
                    <Route path="/failure" element={<Failure />} />
                    <Route path="/pending" element={<Pending />} />
                    
                    {/* Rutas de administrador */}
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Admin />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin-users" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminUsers />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Ruta 404 */}
                    <Route 
                      path="*" 
                      element={
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                          <h2>404 - Página no encontrada</h2>
                          <p>La página que buscas no existe.</p>
                        </div>
                      } 
                    />
                  </Routes>
                  <Chatbot />
                </main>
              </>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <ToastContainer />
          <AppContent />
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}
