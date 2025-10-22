import React, { memo } from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = memo(({ size = 'medium', message = 'Cargando...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}></div>
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
