import { VALIDATION } from './constants.js';

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateEmail = email => {
  if (!email) {
    return { isValid: false, message: 'El email es requerido' };
  }

  if (!VALIDATION.email.pattern.test(email)) {
    return { isValid: false, message: VALIDATION.email.message };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validatePassword = password => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es requerida' };
  }

  if (password.length < VALIDATION.password.minLength) {
    return { isValid: false, message: VALIDATION.password.message };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida un nombre
 * @param {string} name - Nombre a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateName = name => {
  if (!name || !name.trim()) {
    return { isValid: false, message: 'El nombre es requerido' };
  }

  const trimmedName = name.trim();

  if (
    trimmedName.length < VALIDATION.name.minLength ||
    trimmedName.length > VALIDATION.name.maxLength
  ) {
    return { isValid: false, message: VALIDATION.name.message };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida un precio
 * @param {number|string} price - Precio a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validatePrice = price => {
  const numPrice = Number(price);

  if (isNaN(numPrice)) {
    return { isValid: false, message: 'El precio debe ser un número válido' };
  }

  if (numPrice < VALIDATION.price.min || numPrice > VALIDATION.price.max) {
    return { isValid: false, message: VALIDATION.price.message };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida stock
 * @param {number|string} stock - Stock a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateStock = stock => {
  const numStock = Number(stock);

  if (isNaN(numStock)) {
    return { isValid: false, message: 'El stock debe ser un número válido' };
  }

  if (numStock < VALIDATION.stock.min || numStock > VALIDATION.stock.max) {
    return { isValid: false, message: VALIDATION.stock.message };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida una URL de imagen
 * @param {string} url - URL a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateImageUrl = url => {
  if (!url) {
    return { isValid: true, message: '' }; // URL de imagen es opcional
  }

  try {
    new URL(url);
    return { isValid: true, message: '' };
  } catch {
    return { isValid: false, message: 'La URL de la imagen no es válida' };
  }
};

/**
 * Valida un producto completo
 * @param {object} product - Producto a validar
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateProduct = product => {
  const errors = {};
  let isValid = true;

  // Validar nombre
  const nameValidation = validateName(product.nombre);
  if (!nameValidation.isValid) {
    errors.nombre = nameValidation.message;
    isValid = false;
  }

  // Validar precio
  const priceValidation = validatePrice(product.precio);
  if (!priceValidation.isValid) {
    errors.precio = priceValidation.message;
    isValid = false;
  }

  // Validar stock (opcional)
  if (product.stock !== undefined && product.stock !== '') {
    const stockValidation = validateStock(product.stock);
    if (!stockValidation.isValid) {
      errors.stock = stockValidation.message;
      isValid = false;
    }
  }

  // Validar imagen (opcional)
  if (product.imagen) {
    const imageValidation = validateImageUrl(product.imagen);
    if (!imageValidation.isValid) {
      errors.imagen = imageValidation.message;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Valida datos de registro de usuario
 * @param {object} userData - Datos del usuario
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateUserRegistration = userData => {
  const errors = {};
  let isValid = true;

  // Validar nombre
  const nameValidation = validateName(userData.displayName);
  if (!nameValidation.isValid) {
    errors.displayName = nameValidation.message;
    isValid = false;
  }

  // Validar email
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
    isValid = false;
  }

  // Validar contraseña
  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
    isValid = false;
  }

  // Validar confirmación de contraseña
  if (userData.confirmPassword !== userData.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Valida datos de login
 * @param {object} loginData - Datos de login
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateLogin = loginData => {
  const errors = {};
  let isValid = true;

  // Validar email
  const emailValidation = validateEmail(loginData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
    isValid = false;
  }

  // Validar contraseña
  const passwordValidation = validatePassword(loginData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Sanitiza una cadena de texto
 * @param {string} text - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
export const sanitizeText = text => {
  if (typeof text !== 'string') return '';

  return text
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres HTML básicos
    .substring(0, 1000); // Limitar longitud
};

/**
 * Valida si un archivo es una imagen válida
 * @param {File} file - Archivo a validar
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateImageFile = file => {
  if (!file) {
    return { isValid: false, message: 'No se ha seleccionado ningún archivo' };
  }

  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message:
        'Tipo de archivo no válido. Solo se permiten JPG, PNG, WebP y GIF',
    };
  }

  // Validar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'El archivo es demasiado grande. Máximo 5MB',
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida un número de teléfono argentino
 * @param {string} phone - Número de teléfono
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validatePhone = phone => {
  if (!phone) {
    return { isValid: true, message: '' }; // Teléfono es opcional
  }

  // Patrón para números argentinos
  const phonePattern = /^(\+54|54)?[\s-]?(\d{2,4})[\s-]?(\d{6,8})$/;

  if (!phonePattern.test(phone)) {
    return {
      isValid: false,
      message: 'Formato de teléfono inválido. Ej: +54 11 1234-5678',
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida una reseña
 * @param {number} rating - Rating de 1 a 5
 * @param {string} comment - Comentario de la reseña
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateReview = (rating, comment) => {
  if (!rating || rating < 1 || rating > 5) {
    return { isValid: false, message: 'El rating debe ser entre 1 y 5' };
  }

  if (!comment || comment.trim().length < 10 || comment.trim().length > 500) {
    return {
      isValid: false,
      message: 'El comentario debe tener entre 10 y 500 caracteres',
    };
  }

  const sanitizedComment = sanitizeText(comment);
  if (sanitizedComment.length !== comment.trim().length) {
    return {
      isValid: false,
      message: 'El comentario contiene caracteres no permitidos',
    };
  }

  return { isValid: true, message: '' };
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validatePrice,
  validateStock,
  validateImageUrl,
  validateProduct,
  validateUserRegistration,
  validateLogin,
  sanitizeText,
  validateImageFile,
  validatePhone,
  validateReview,
};
