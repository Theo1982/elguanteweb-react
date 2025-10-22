import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import useToast from '../hooks/useToast';
import useErrorHandler from '../hooks/useErrorHandler';

export default function Login() {
  const {
    login,
    signup,
    resetPassword,
    user,
    loading: authLoading,
    clearError,
  } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();
  const { handleError } = useErrorHandler();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user && !authLoading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  // Limpiar errores al cambiar de modo
  useEffect(() => {
    clearError();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  }, [isRegister, clearError]);

  const validateForm = () => {
    if (!email || !password) {
      showError('Por favor completa todos los campos');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Por favor ingresa un email válido');
      return false;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (isRegister) {
      if (!displayName.trim()) {
        showError('Por favor ingresa tu nombre');
        return false;
      }

      if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async e => {
    console.log(
      '📝 Form submitted - Mode:',
      isRegister ? 'register' : 'login',
      'Email:',
      email
    );
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isRegister) {
        await signup(email, password, displayName.trim());
        success(
          '¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta.'
        );
      } else {
        await login(email, password);
        success('¡Bienvenido de vuelta!');
      }
    } catch (err) {
      console.error('📝 Submit error:', err);
      const message = handleError(err, isRegister ? 'registro' : 'login');
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async e => {
    e.preventDefault();

    if (!email) {
      showError('Por favor ingresa tu email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      success('Se ha enviado un email para restablecer tu contraseña');
      setShowResetPassword(false);
    } catch (err) {
      const message = handleError(err, 'reset password');
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '1rem',
  };

  const cardStyle = {
    maxWidth: '400px',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    padding: '2rem',
    border: '1px solid #e5e7eb',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#1f2937',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    marginTop: '0.5rem',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#1b72e8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease',
    opacity: loading ? 0.7 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#1b72e8',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  };

  if (authLoading) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner message="Verificando autenticación..." />
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Restablecer Contraseña</h2>

          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}
              >
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="tu@email.com"
              />
            </div>

            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="small" message="" />
                  Enviando...
                </>
              ) : (
                'Enviar Email de Recuperación'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => setShowResetPassword(false)}
              style={linkButtonStyle}
            >
              ← Volver al login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>
          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}
              >
                Nombre completo:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
                style={inputStyle}
                placeholder="Tu nombre completo"
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}
            >
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}
            >
              Contraseña:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {isRegister && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}
              >
                Confirmar contraseña:
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="small" message="" />
                {isRegister ? 'Creando cuenta...' : 'Iniciando sesión...'}
              </>
            ) : isRegister ? (
              'Crear Cuenta'
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ marginBottom: '0.5rem', color: '#6b7280' }}>
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          </p>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={linkButtonStyle}
          >
            {isRegister ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </div>

        {!isRegister && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => setShowResetPassword(true)}
              style={linkButtonStyle}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {/* Demo accounts info */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            Cuentas de prueba:
          </p>
          <p>Admin: admin@demo.com / 123456</p>
          <p>Usuario: user@demo.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
