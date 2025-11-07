import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentModal from '../../components/PaymentModal';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Payment Flow Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockCart = [
    {
      id: 'product-1',
      nombre: 'Test Product',
      precio: 100,
      quantity: 2,
      notes: 'Test notes',
    },
  ];

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    cart: mockCart,
    total: 200,
    onPaymentComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('Complete Payment Flow - Transferencia', () => {
    it('should complete full transferencia payment flow', async () => {
      // Mock successful order creation
      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      const mockUpdateDoc = vi.mocked(require('firebase/firestore')).updateDoc;
      mockAddDoc.mockResolvedValue({ id: 'order-123' });

      // Mock successful WhatsApp send
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      renderPaymentModal();

      // Select transferencia method
      const transferenciaOption = screen.getByText('Transferencia Bancaria');
      fireEvent.click(transferenciaOption);

      // Enter phone number
      const phoneInput = screen.getByPlaceholderText('5492211234567');
      fireEvent.change(phoneInput, { target: { value: '5492211234567' } });

      // Click confirm payment
      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Wait for success
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('order-123');
      });

      // Verify order creation
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object), // collection ref
        expect.objectContaining({
          userId: mockUser.uid,
          paymentMethod: 'Transferencia Bancaria',
          status: 'pending',
          phoneNumber: '5492211234567',
          total: 200,
        })
      );

      // Verify WhatsApp message sent
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/send-whatsapp',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Nueva Orden Pendiente'),
        })
      );
    });

    it('should handle inventory validation failure', async () => {
      // Mock inventory validation failure
      const mockInventoryValidator = vi.fn();
      mockInventoryValidator.validateBatchStock = vi.fn().mockResolvedValue({
        valid: [],
        invalid: [{ productId: 'product-1', error: 'Insufficient stock' }],
        warnings: [],
      });

      // Mock the import
      vi.doMock('../../utils/inventoryValidator', () => ({
        createInventoryValidator: () => mockInventoryValidator,
      }));

      renderPaymentModal();

      // Select method and try to pay
      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Should show error toast (mocked)
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).not.toHaveBeenCalled();
      });
    });
  });

  describe('MercadoPago Integration', () => {
    it('should handle successful MercadoPago preference creation', async () => {
      // Mock successful MercadoPago response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'preference-123',
            init_point: 'https://mercadopago.com/pay',
          }),
      });

      // Mock order creation
      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      const mockUpdateDoc = vi.mocked(require('firebase/firestore')).updateDoc;
      mockAddDoc.mockResolvedValue({ id: 'order-456' });

      renderPaymentModal();

      // Select tarjeta method
      const tarjetaOption = screen.getByText('Tarjeta de Crédito/Débito');
      fireEvent.click(tarjetaOption);

      // Click confirm payment
      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Wait for MercadoPago redirect
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/create_preference',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"usuarioId":"test-user-123"'),
          })
        );
      });

      // Verify order created with processing status
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'processing',
          paymentId: 'payment_order-456',
        })
      );
    });

    it('should handle MercadoPago API errors', async () => {
      // Mock MercadoPago error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid access token' }),
      });

      renderPaymentModal();

      // Select tarjeta and try to pay
      const tarjetaOption = screen.getByText('Tarjeta de Crédito/Débito');
      fireEvent.click(tarjetaOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed payments with exponential backoff', async () => {
      // Mock network failure then success
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'order-retry' });

      renderPaymentModal();

      // Select efectivo method
      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      // Click confirm payment
      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Wait for retry and success
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('order-retry');
      });

      // Verify retry happened
      expect(mockAddDoc).toHaveBeenCalledTimes(2); // Initial + retry
    });

    it('should stop retrying after max attempts', async () => {
      // Mock persistent network failures
      global.fetch.mockRejectedValue(new Error('Persistent network error'));

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Should eventually give up
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cart', () => {
      const emptyCartProps = { ...mockProps, cart: [] };

      renderPaymentModal(emptyCartProps);

      // Should still render but payment should fail validation
      expect(screen.getByText('💳 Seleccionar Método de Pago')).toBeInTheDocument();
    });

    it('should validate phone number format for transferencia', async () => {
      renderPaymentModal();

      const transferenciaOption = screen.getByText('Transferencia Bancaria');
      fireEvent.click(transferenciaOption);

      const phoneInput = screen.getByPlaceholderText('5492211234567');
      const confirmButton = screen.getByText('✅ Confirmar Pago');

      // Invalid phone number
      fireEvent.change(phoneInput, { target: { value: '123456' } });
      fireEvent.click(confirmButton);

      // Should not proceed
      expect(mockProps.onPaymentComplete).not.toHaveBeenCalled();
    });

    it('should handle modal close during payment', async () => {
      // Mock slow payment process
      global.fetch.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderPaymentModal();

      const efectivoOption = screen.getByText('Efectivo');
      fireEvent.click(efectivoOption);

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Close modal immediately
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      // Should still complete payment in background (or handle cancellation)
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('WhatsApp Integration', () => {
    it('should send WhatsApp message for transferencia orders', async () => {
      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'whatsapp-order' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      renderPaymentModal();

      const transferenciaOption = screen.getByText('Transferencia Bancaria');
      fireEvent.click(transferenciaOption);

      const phoneInput = screen.getByPlaceholderText('5492211234567');
      fireEvent.change(phoneInput, { target: { value: '5492211234567' } });

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/send-whatsapp',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('5492214760630'), // Admin number
          })
        );
      });
    });

    it('should handle WhatsApp service failure gracefully', async () => {
      const mockAddDoc = vi.mocked(require('firebase/firestore')).addDoc;
      mockAddDoc.mockResolvedValue({ id: 'whatsapp-fail-order' });

      // Mock WhatsApp failure but order creation success
      global.fetch.mockRejectedValue(new Error('WhatsApp service down'));

      renderPaymentModal();

      const transferenciaOption = screen.getByText('Transferencia Bancaria');
      fireEvent.click(transferenciaOption);

      const phoneInput = screen.getByPlaceholderText('5492211234567');
      fireEvent.change(phoneInput, { target: { value: '5492211234567' } });

      const confirmButton = screen.getByText('✅ Confirmar Pago');
      fireEvent.click(confirmButton);

      // Should still complete order despite WhatsApp failure
      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalledWith('whatsapp-fail-order');
      });
    });
  });
});
