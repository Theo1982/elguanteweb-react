// src/components/LazyImage.jsx
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const LazyImage = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwSDEwMFYxMDBIMTAwWk0xMDAgMTAwSDEwMFYxMDBIMTAwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPgo8L3N2Zz4K',
  className = '',
  style = {},
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      onLoad && onLoad();
    };

    img.onerror = () => {
      setHasError(true);
      setImageSrc(placeholder);
      onError && onError();
    };

    // Cargar la imagen inmediatamente
    img.src = src;
  }, [src, placeholder, onLoad, onError]);

  const imageStyle = {
    ...style,
    opacity: isLoaded ? 1 : 0.7,
    transition: 'opacity 0.3s ease-in-out',
    filter: hasError ? 'grayscale(100%)' : 'none',
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      style={imageStyle}
      {...props}
    />
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default LazyImage;
