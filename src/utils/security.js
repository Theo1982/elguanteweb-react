/**
 * Security utilities for ElGuanteWeb
 * Includes input sanitization, validation, and basic security checks
 */

// Import necessary dependencies
import DOMPurify from 'dompurify'; // Note: Add to package.json if not present: npm install dompurify
import { inventoryValidator } from './inventoryValidator';
import { validators } from './validators';

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = input => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input);
};

/**
 * Validate user input against common attacks (SQL injection, XSS patterns)
 * @param {string} input - Input to validate
 * @returns {boolean} True if safe, false if malicious
 */
export const isSafeInput = input => {
  if (typeof input !== 'string') return false;

  // Common malicious patterns
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /on\w+\s*=/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /SELECT|INSERT|UPDATE|DELETE/gi, // Basic SQL injection
    /UNION\s+SELECT/gi,
    /--|\/\*|\*\/|@@|CHAR/gi,
  ];

  return !maliciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate product data for admin CRUD
 * @param {Object} productData - Product object
 * @returns {Object} { isValid: boolean, errors: array }
 */
export const validateProductData = productData => {
  const errors = [];

  // Required fields
  if (!productData.nombre || !isSafeInput(productData.nombre)) {
    errors.push('Nombre del producto es requerido y debe ser seguro');
  }

  if (
    !productData.precio ||
    isNaN(productData.precio) ||
    productData.precio <= 0
  ) {
    errors.push('Precio debe ser un número positivo');
  }

  if (
    productData.stock !== undefined &&
    (isNaN(productData.stock) || productData.stock < 0)
  ) {
    errors.push('Stock debe ser un número no negativo');
  }

  // Sanitize optional fields
  if (productData.descripcion) {
    productData.descripcion = sanitizeInput(productData.descripcion);
  }

  if (productData.categoria) {
    productData.categoria = sanitizeInput(productData.categoria);
  }

  // Inventory validation
  const inventoryErrors = inventoryValidator(productData);
  errors.push(...inventoryErrors);

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: productData,
  };
};

/**
 * Validate user input for forms (login, register, etc.)
 * @param {Object} formData - Form data object
 * @param {string} formType - Type of form ('login', 'register', 'contact')
 * @returns {Object} { isValid: boolean, errors: array }
 */
export const validateFormData = (formData, formType) => {
  const errors = [];

  switch (formType) {
    case 'login':
      if (!formData.email || !validators.email(formData.email)) {
        errors.push('Email inválido');
      }
      if (!formData.password || formData.password.length < 6) {
        errors.push('Contraseña debe tener al menos 6 caracteres');
      }
      break;

    case 'register':
      if (!formData.email || !validators.email(formData.email)) {
        errors.push('Email inválido');
      }
      if (!formData.password || formData.password.length < 8) {
        errors.push('Contraseña debe tener al menos 8 caracteres');
      }
      if (formData.password !== formData.confirmPassword) {
        errors.push('Las contraseñas no coinciden');
      }
      break;

    case 'contact':
      if (!formData.message || !isSafeInput(formData.message)) {
        errors.push('Mensaje requerido y debe ser seguro');
      }
      if (formData.email && !validators.email(formData.email)) {
        errors.push('Email inválido');
      }
      break;

    default:
      errors.push('Tipo de formulario no reconocido');
  }

  // Sanitize all string fields
  Object.keys(formData).forEach(key => {
    if (typeof formData[key] === 'string') {
      formData[key] = sanitizeInput(formData[key]);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: formData,
  };
};

/**
 * Rate limiting helper for client-side (basic implementation)
 * @param {string} action - Action key (e.g., 'login', 'addToCart')
 * @param {number} limit - Max attempts
 * @param {number} windowMs - Time window in ms
 * @returns {boolean} True if allowed
 */
export const clientRateLimit = (action, limit = 5, windowMs = 60000) => {
  const key = `rate_limit_${action}`;
  const now = Date.now();
  const timestamps = JSON.parse(localStorage.getItem(key) || '[]');

  // Remove old timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  localStorage.setItem(key, JSON.stringify(validTimestamps));
  return true;
};

/**
 * Check if user has required role
 * @param {string} requiredRole - Required role ('admin', 'user')
 * @param {Object} userProfile - User profile from AuthContext
 * @returns {boolean} True if authorized
 */
export const hasRole = (requiredRole, userProfile) => {
  if (!userProfile || !userProfile.role) return false;
  return userProfile.role === requiredRole || userProfile.role === 'admin'; // Admin can do everything
};

/**
 * Generate CSRF token (basic client-side)
 * @returns {string} CSRF token
 */
export const generateCSRFToken = () => {
  return btoa(Date.now() + Math.random().toString(36)).substring(0, 32);
};

// Export for use in other modules
export default {
  sanitizeInput,
  isSafeInput,
  validateProductData,
  validateFormData,
  clientRateLimit,
  hasRole,
  generateCSRFToken,
};
