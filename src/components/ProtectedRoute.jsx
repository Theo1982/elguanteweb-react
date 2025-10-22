import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({
  children,
  requiredRole = null,
  redirectTo = '/login',
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <div>Cargando...</div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login, except for cart and success for testing
  if (
    !user &&
    !location.pathname.startsWith('/cart') &&
    !location.pathname.startsWith('/success')
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si se requiere un rol específico, verificarlo
  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          margin: '2rem',
        }}
      >
        <h2>❌ Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta página.</p>
        <p>
          Rol requerido: <strong>{requiredRole}</strong>
        </p>
        <p>
          Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong>
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
