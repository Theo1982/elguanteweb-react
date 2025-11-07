import { memo } from 'react';
import PropTypes from 'prop-types';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = memo(({ size = 'medium', message = 'Cargando...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}></div>
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
});

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
