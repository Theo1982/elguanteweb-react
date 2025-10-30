import { useState, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MiNivel from './MiNivel';
import LoadingSpinner from './LoadingSpinner';
import useWindowSize from '../hooks/useWindowSize';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

const Navbar = memo(function Navbar() {
  const { getCartItemsCount, loading: cartLoading } = useCart();
  const { user, profile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { width } = useWindowSize();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = width <= 768;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = path => {
    return location.pathname === path;
  };

  if (authLoading || (user && !profile)) {
    return (
      <nav className="navbar">
        <LoadingSpinner size="small" message="" />
      </nav>
    );
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Navegación principal">
      {/* Logo/Brand - Como punta del navbar */}
      <div className="navbar-logo">
        <img src={logo} alt="ElGuante - Tienda en línea" />
      </div>

      {/* Desktop Menu */}
      <div className="navbar-menu">
        {/* Links principales */}
        {!isMobile && (
          <nav aria-label="Menú principal">
            <Link
              to="/shop"
              className={`navbar-link ${isActive('/shop') ? 'active' : ''}`}
            >
              <span aria-hidden="true">🛍️</span>
              <span>Tienda</span>
            </Link>
            <Link
              to="/cart"
              className={`navbar-link ${isActive('/cart') ? 'active' : ''}`}
              aria-label={`Carrito de compras${!cartLoading ? `. ${getCartItemsCount()} productos` : ''}`}
            >
              <span aria-hidden="true">🛒</span>
              <span>Carrito {!cartLoading && `(${getCartItemsCount()})`}</span>
            </Link>
            {user && (
              <>
                <Link
                  to="/history"
                  className={`navbar-link ${isActive('/history') ? 'active' : ''}`}
                >
                  <span aria-hidden="true">📜</span>
                  <span>Historial</span>
                </Link>
                <Link
                  to="/favorites"
                  className={`navbar-link ${isActive('/favorites') ? 'active' : ''}`}
                >
                  <span aria-hidden="true">❤️</span>
                  <span>Favoritos</span>
                </Link>
                <Link
                  to="/referrals"
                  className={`navbar-link ${isActive('/referrals') ? 'active' : ''}`}
                >
                  <span aria-hidden="true">🎁</span>
                  <span>Referidos</span>
                </Link>
                <Link
                  to="/coupons"
                  className={`navbar-link ${isActive('/coupons') ? 'active' : ''}`}
                >
                  <span aria-hidden="true">🎫</span>
                  <span>Cupones</span>
                </Link>
              </>
            )}
            {profile?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  <span aria-hidden="true">⚙️</span>
                  <span>Admin</span>
                </Link>
                <Link
                  to="/admin-users"
                  className={`navbar-link ${isActive('/admin-users') ? 'active' : ''}`}
                >
                  <span aria-hidden="true">👥</span>
                  <span>Usuarios</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Usuario y nivel */}
        <div className="navbar-user-section">
          {user && <MiNivel />}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to="/profile"
                className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}
                style={{ marginRight: '10px' }}
                aria-label="Ir a mi perfil"
              >
                <span aria-hidden="true">👤</span>
                <span>Mi Perfil</span>
              </Link>
              {!isMobile && (
                <span
                  className="navbar-user-info"
                  aria-label={`Usuario: ${user.displayName || user.email?.split('@')[0]}`}
                >
                  <span aria-hidden="true">👋</span>
                  <span>{user.displayName || user.email?.split('@')[0]}</span>
                </span>
              )}
              <button
                className="navbar-logout-btn"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="navbar-login-btn"
              aria-label="Iniciar sesión"
            >
              <span aria-hidden="true">🔑</span>
              <span>Ingresar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button
          className="navbar-mobile-toggle"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <nav
          id="mobile-menu"
          className={`navbar-mobile-menu ${isMenuOpen ? 'open' : ''}`}
          aria-label="Menú móvil"
          role="navigation"
        >
          <Link
            to="/shop"
            className={`navbar-link navbar-mobile-link ${isActive('/shop') ? 'active' : ''}`}
          >
            <span aria-hidden="true">🛍️</span>
            <span>Tienda</span>
          </Link>
          <Link
            to="/cart"
            className={`navbar-link navbar-mobile-link ${isActive('/cart') ? 'active' : ''}`}
          >
            <span aria-hidden="true">🛒</span>
            <span>Carrito {!cartLoading && `(${getCartItemsCount()})`}</span>
          </Link>
          {user && (
            <>
              <Link
                to="/history"
                className={`navbar-link navbar-mobile-link ${isActive('/history') ? 'active' : ''}`}
              >
                <span aria-hidden="true">📜</span>
                <span>Historial</span>
              </Link>
              <Link
                to="/favorites"
                className={`navbar-link navbar-mobile-link ${isActive('/favorites') ? 'active' : ''}`}
              >
                <span aria-hidden="true">❤️</span>
                <span>Favoritos</span>
              </Link>
              <Link
                to="/referrals"
                className={`navbar-link navbar-mobile-link ${isActive('/referrals') ? 'active' : ''}`}
              >
                <span aria-hidden="true">🎁</span>
                <span>Referidos</span>
              </Link>
              <Link
                to="/coupons"
                className={`navbar-link navbar-mobile-link ${isActive('/coupons') ? 'active' : ''}`}
              >
                <span aria-hidden="true">🎫</span>
                <span>Cupones</span>
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <>
              <Link
                to="/admin"
                className={`navbar-link navbar-mobile-link ${isActive('/admin') ? 'active' : ''}`}
              >
                <span aria-hidden="true">⚙️</span>
                <span>Admin</span>
              </Link>
              <Link
                to="/admin-users"
                className={`navbar-link navbar-mobile-link ${isActive('/admin-users') ? 'active' : ''}`}
              >
                <span aria-hidden="true">👥</span>
                <span>Usuarios</span>
              </Link>
            </>
          )}
        </nav>
      )}
    </nav>
  );
});

export default Navbar;
