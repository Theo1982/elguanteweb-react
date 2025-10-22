import { useCallback } from 'react';

const useErrorHandler = () => {
  const handleError = useCallback((error, context = '') => {
    console.error(`Error ${context}:`, error);

    // Aquí podrías integrar con un servicio de logging como Sentry
    // Sentry.captureException(error, { extra: { context } });

    let userMessage = 'Ha ocurrido un error inesperado';

    // Personalizar mensajes según el tipo de error
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          userMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          userMessage = 'Contraseña incorrecta';
          break;
        case 'auth/email-already-in-use':
          userMessage = 'El email ya está en uso';
          break;
        case 'auth/weak-password':
          userMessage = 'La contraseña es muy débil';
          break;
        case 'auth/invalid-email':
          userMessage = 'Email inválido';
          break;
        case 'permission-denied':
          userMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 'unavailable':
          userMessage = 'Servicio no disponible. Intenta más tarde';
          break;
        default:
          userMessage = error.message || userMessage;
      }
    } else if (error.message) {
      userMessage = error.message;
    }

    return userMessage;
  }, []);

  const handleAsyncError = useCallback(
    async (asyncFn, context = '') => {
      try {
        return await asyncFn();
      } catch (error) {
        const message = handleError(error, context);
        throw new Error(message);
      }
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
  };
};

export default useErrorHandler;
