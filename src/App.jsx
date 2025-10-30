// src/App.jsx
import { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import useCreateUserDoc from './hooks/useCreateUserDoc';
import { useAnalytics } from './hooks/useAnalytics';

import LoadingSpinner from './components/LoadingSpinner';
import ToastContainer from './components/ToastContainer';
import Chatbot from './components/Chatbot';

// Lazy loading de componentes para mejor rendimiento
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Cart = lazy(() => import('./pages/Cart'));
const History = lazy(() => import('./pages/History'));
const Success = lazy(() => import('./pages/Success'));
const Failure = lazy(() => import('./pages/Failure'));
const Pending = lazy(() => import('./pages/Pending'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Start = lazy(() => import('./pages/Start'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ProductComparison = lazy(() => import('./pages/ProductComparison'));
const Orders = lazy(() => import('./pages/Orders'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const Referrals = lazy(() => import('./pages/Referrals'));

function AppContent() {
  useCreateUserDoc();
  const location = useLocation();
  const analytics = useAnalytics();

  useEffect(() => {
    if (analytics && analytics.trackPageView) {
      analytics.trackPageView(location.pathname);
    }
  }, [location.pathname, analytics]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Chatbot />
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
              <main
                style={{ minHeight: 'calc(100vh - 70px)', paddingTop: '70px' }}
              >
                <ErrorBoundary>
                  <Routes>
                    <Route
                      path="/home"
                      element={<Navigate to="/shop" replace />}
                    />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route
                      path="/compare/:handles"
                      element={<ProductComparison />}
                    />

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
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/referrals"
                      element={
                        <ProtectedRoute>
                          <Referrals />
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
                    <Route
                      path="/admin-orders"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminOrders />
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
                </ErrorBoundary>
              </main>
            </>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <ToastContainer />
            <AppContent />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
