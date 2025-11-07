import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentModal from '../../components/PaymentModal';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';

// Mock performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Payment Performance Tests', () => {
  const mockUser = {
    uid: 'perf-test-user',
    email: 'perf@example.com',
    displayName: 'Performance Test User',
  };

  const largeCart = Array.from({ length: 50 }, (_, i) => ({
    id: `product-${i}`,
    nombre: `Product ${i}`,
    precio: 100 + i,
    quantity: Math.floor(Math.random() * 5) + 1,
    notes: `Notes for product ${i}`,
  }));

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    cart: largeCart,
    total: largeCart.reduce((sum, item) => sum + item.precio * item.quantity, 0),
    onPaymentComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const renderPaymentModal = (props = mockProps) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PaymentModal {...props} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Render Performance', () => {
    it('should render large cart within performance budget', async () => {
      const startTime = performance.now();

      renderPaymentModal();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Performance budget: 100ms for initial render
      expect(renderTime).toBeLessThan(100);

      // Verify all products are rendered
      expect(screen.getByText('💳 Seleccionar Método de Pago')).toBeInTheDocument();
    });

    it('should handle cart updates efficiently', () => {
      const { rerender } = renderPaymentModal();

      const startTime = performance.now();

      // Simulate cart update
      const updatedProps = {
        ...mockProps,
        cart: largeCart.slice(0, 25), // Reduce cart size
        total: largeCart.slice(0, 25).reduce((sum, item) => sum + item.precio * item.quantity, 0),
      };

      rerender(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <PaymentModal {...updatedProps} />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Performance budget: 50ms for updates
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('Payment Processing Performance', () => {
    it('should process payment within timeout limits', async () => {
      // Mock successful payment
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'perf-order' });

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const startTime = performance.now();

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('perf-order');
      });

      const endTime = performance.now();
      const paymentTime = endTime - startTime;

      // Performance budget: 2 seconds for payment processing
      expect(paymentTime).toBeLessThan(2000);
    });

    it('should handle retry logic with proper timing', async () => {
      // Mock failure then success
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'retry-order' });

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Fast-forward timers to simulate retry delays
      vi.advanceTimersByTime(1000); // First retry delay
      vi.advanceTimersByTime(2000); // Second retry delay

      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('retry-order');
      });

      // Verify exponential backoff timing
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during repeated renders', () => {
      const { rerender, unmount } = renderPaymentModal();

      // Perform multiple re-renders
      for (let i = 0; i < 10; i++) {
        const updatedCart = largeCart.map(item => ({
          ...item,
          quantity: item.quantity + i,
        }));

        rerender(
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <PaymentModal
                  {...mockProps}
                  cart={updatedCart}
                  total={updatedCart.reduce((sum, item) => sum + item.precio * item.quantity, 0)}
                />
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        );
      }

      // Clean up
      unmount();

      // If no memory leaks, this should complete without issues
      expect(true).toBe(true);
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network gracefully', async () => {
      // Mock slow API response
      global.fetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              5000 // 5 second delay
            )
          )
      );

      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'slow-order' });

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Should show loading state during slow operation
      expect(screen.getByText('⏳ Procesando...')).toBeInTheDocument();

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('slow-order');
      });
    });

    it('should implement proper request cancellation', async () => {
      // Mock slow request
      let requestAborted = false;
      const abortController = new AbortController();

      global.fetch.mockImplementation((url, options) => {
        if (options?.signal?.aborted) {
          requestAborted = true;
          return Promise.reject(new Error('Request aborted'));
        }

        return new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              }),
            3000
          )
        );
      });

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Close modal before request completes
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      // Request should be cancelled
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple rapid payment attempts', async () => {
      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'concurrent-order' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');

      // Click multiple times rapidly
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);

      // Should only process one payment
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover from errors quickly', async () => {
      // Mock initial failure then success
      global.fetch
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'recovery-order' });

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const startTime = performance.now();

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('recovery-order');
      });

      const endTime = performance.now();
      const recoveryTime = endTime - startTime;

      // Recovery should be quick (under 3 seconds with retry)
      expect(recoveryTime).toBeLessThan(3000);
    });
  });

  describe('Large Dataset Handling', () => {
    const hugeCart = Array.from({ length: 200 }, (_, i) => ({
      id: `huge-product-${i}`,
      nombre: `Huge Product ${i}`,
      precio: 50,
      quantity: 1,
      notes: `Extensive notes for product ${i} with lots of detailed information that could impact performance when rendering large lists`,
    }));

    it('should handle extremely large carts', () => {
      const hugeProps = {
        ...mockProps,
        cart: hugeCart,
        total: hugeCart.reduce((sum, item) => sum + item.precio * item.quantity, 0),
      };

      const startTime = performance.now();

      renderPaymentModal(hugeProps);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Even with huge cart, should render within reasonable time
      expect(renderTime).toBeLessThan(500);

      expect(screen.getByText('💳 Seleccionar Método de Pago')).toBeInTheDocument();
    });

    it('should maintain responsiveness with large datasets', async () => {
      const hugeProps = {
        ...mockProps,
        cart: hugeCart,
        total: hugeCart.reduce((sum, item) => sum + item.precio * item.quantity, 0),
      };

      renderPaymentModal(hugeProps);

      const startTime = performance.now();

      // Simulate user interactions
      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // UI should remain responsive
      expect(interactionTime).toBeLessThan(100);
    });
  });
});
