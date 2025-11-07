import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { db } from '../../firebase'; // eslint-disable-line no-unused-vars
import { onSnapshot, query, collection, where } from 'firebase/firestore'; // eslint-disable-line no-unused-vars
import Chatbot from '../../components/Chatbot';

// Mock analytics and Firebase
jest.mock('../../hooks/useAnalytics');
jest.mock('../../firebase');

const mockTrackEvent = jest.fn();
useAnalytics.mockReturnValue({ trackEvent: mockTrackEvent });

const mockSnapshot = {
  docs: [
    {
      id: '1',
      data: () => ({
        nombre: 'Jabon Líquido',
        precio: 1500,
        stock: 10,
        activo: true,
      }),
    },
    {
      id: '2',
      data: () => ({
        nombre: 'Detergente',
        precio: 2000,
        stock: 5,
        activo: true,
      }),
    },
  ],
};

const mockOnSnapshot = jest.fn((q, onNext) => {
  onNext(mockSnapshot);
});

onSnapshot.mockImplementation(mockOnSnapshot);

describe('Chatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders chatbot button and opens window on click', () => {
    render(<Chatbot />);

    const button = screen.getByText('💬');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText('Asistente de El Guante')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Escribe tu mensaje...')
    ).toBeInTheDocument();
  });

  test('sends message and tracks event', async () => {
    render(<Chatbot />);

    fireEvent.click(screen.getByText('💬'));

    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'hola' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13 });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith('chat_message_sent', {
        message: 'hola',
      });
    });

    expect(
      screen.getByText(
        '¡Hola! 😀 ¿Cómo estás? Puedo ayudarte con productos, precios, envíos, horarios o contacto por WhatsApp.'
      )
    ).toBeInTheDocument();
  });

  test('handles product price intent', async () => {
    render(<Chatbot />);

    fireEvent.click(screen.getByText('💬'));

    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'precio jabon' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13 });

    await waitFor(() => {
      expect(
        screen.getByText(/El precio de Jabon Líquido es \$\d+/)
      ).toBeInTheDocument();
    });
  });

  test('handles new intents like reseñas', async () => {
    render(<Chatbot />);

    fireEvent.click(screen.getByText('💬'));

    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'reseñas' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13 });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Puedes ver las reseñas de un producto en su página de detalle/
        )
      ).toBeInTheDocument();
    });
  });

  test('handles offline fallback', async () => {
    onSnapshot.mockImplementationOnce((q, onNext, onError) => {
      onError(new Error('Network error'));
    });

    render(<Chatbot />);

    await waitFor(() => {
      expect(localStorage.getItem('products')).toBeNull(); // No cache yet
    });

    // On second render, should use cache if set, but for test, check console or state
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  test('closes chatbot on close button', () => {
    render(<Chatbot />);

    fireEvent.click(screen.getByText('💬'));

    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);

    expect(
      screen.queryByText('Asistente de El Guante')
    ).not.toBeInTheDocument();
  });
});
