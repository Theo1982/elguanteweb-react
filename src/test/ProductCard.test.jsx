import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

// Mock del producto de prueba
const mockProduct = {
  id: '1',
  nombre: 'Producto de prueba',
  precio: 1000,
  imagen: '/test-image.jpg',
  descripcion: 'Descripción de prueba',
  categoria: 'Categoría de prueba',
  stock: 10,
};

// Wrapper con providers necesarios
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('ProductCard', () => {
  it('should render product information correctly', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Producto de prueba')).toBeInTheDocument();
    expect(screen.getByText('$1.000')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
    expect(screen.getByText('Categoría de prueba')).toBeInTheDocument();
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
  });

  it('should show "Sin stock" when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };

    render(
      <TestWrapper>
        <ProductCard product={outOfStockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Sin stock')).toBeInTheDocument();
    expect(screen.getByText('❌ Sin stock')).toBeInTheDocument();
  });

  it('should handle image error gracefully', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const image = screen.getByAltText('Producto de prueba');
    fireEvent.error(image);

    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('should show add to cart button when user is not logged in', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('🛒 Agregar al carrito')).toBeInTheDocument();
  });

  it('should format price correctly', () => {
    const expensiveProduct = { ...mockProduct, precio: 1234567 };

    render(
      <TestWrapper>
        <ProductCard product={expensiveProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('$1.234.567')).toBeInTheDocument();
  });
});
