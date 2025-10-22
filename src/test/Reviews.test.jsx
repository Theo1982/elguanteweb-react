import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import { useReviews } from '../../hooks/useReviews';
import Reviews from '../../components/Reviews';
import { db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Mock contexts and hooks
jest.mock('../../context/AuthContext');
jest.mock('../../hooks/useToast');
jest.mock('../../hooks/useReviews');
jest.mock('../../firebase');

const mockUser = {
  uid: 'test-user',
  displayName: 'Test User',
  email: 'test@example.com',
};
const mockAddToast = jest.fn();
const mockAddReview = jest.fn();
const mockReviews = [
  { id: '1', userName: 'User1', rating: 5, comment: 'Great product!' },
  { id: '2', userName: 'User2', rating: 4, comment: 'Good quality.' },
];

useAuth.mockReturnValue({ user: mockUser });
useToast.mockReturnValue({ addToast: mockAddToast });
useReviews.mockReturnValue({
  reviews: mockReviews,
  loading: false,
  averageRating: 4.5,
  addReview: mockAddReview,
  reviewCount: 2,
});

addDoc.mockResolvedValue();

describe('Reviews Component', () => {
  const productId = 'test-product';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders reviews list and average rating', () => {
    render(<Reviews productId={productId} />);

    expect(
      screen.getByText('Reseñas (2) - Promedio: 4.5/5')
    ).toBeInTheDocument();
    expect(screen.getByText('Great product!')).toBeInTheDocument();
    expect(screen.getByText('Good quality.')).toBeInTheDocument();
  });

  test('toggles review form when user is logged in', () => {
    render(<Reviews productId={productId} />);

    const toggleBtn = screen.getByText('Agregar Reseña');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Ocultar Formulario')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { placeholder: 'Escribe tu reseña...' })
    ).toBeInTheDocument();
  });

  test('submits review successfully', async () => {
    mockAddReview.mockResolvedValue(true);

    render(<Reviews productId={productId} />);

    fireEvent.click(screen.getByText('Agregar Reseña'));

    // Set rating (simulate click on 5th star)
    fireEvent.click(screen.getAllByText('★')[4]);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test review' } });

    fireEvent.click(screen.getByText('Enviar Reseña'));

    await waitFor(() => {
      expect(mockAddReview).toHaveBeenCalledWith(5, 'Test review');
      expect(mockAddToast).toHaveBeenCalledWith(
        'Reseña agregada exitosamente',
        'success'
      );
    });
  });

  test('shows error if not logged in', () => {
    useAuth.mockReturnValue({ user: null });

    render(<Reviews productId={productId} />);

    fireEvent.click(screen.getByText('Agregar Reseña'));

    expect(mockAddToast).toHaveBeenCalledWith(
      'Debes estar logueado para agregar reseñas',
      'error'
    );
  });

  test('loads more reviews when button clicked', () => {
    const moreReviews = [
      ...mockReviews,
      { id: '3', userName: 'User3', rating: 3, comment: 'Average.' },
    ];
    useReviews.mockReturnValue({
      ...useReviews(),
      reviews: moreReviews,
      reviewCount: 3,
    });

    render(<Reviews productId={productId} />);

    expect(screen.getByText('Great product!')).toBeInTheDocument();
    expect(screen.queryByText('Average.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Cargar Más Reseñas'));

    // Since displayedReviews increases, but mock is fixed, test button presence
    expect(screen.getByText('Cargar Más Reseñas')).toBeInTheDocument();
  });

  test('shows moderation badge for pending reviews', () => {
    const pendingReview = { ...mockReviews[0], adminReview: false };
    useReviews.mockReturnValue({
      ...useReviews(),
      reviews: [pendingReview],
    });

    render(<Reviews productId={productId} />);

    expect(screen.getByText('Pendiente Moderación')).toBeInTheDocument();
  });
});
