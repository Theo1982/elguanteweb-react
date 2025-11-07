/**
 * Formatea un precio en pesos argentinos
 * @param {number} price - Precio a formatear
 * @param {string} currency - Moneda (default: ARS)
 * @returns {string} - Precio formateado
 */
export const formatPrice = (price, currency = 'ARS') => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Formatea un número con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = number => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('es-AR').format(number);
};

/**
 * Formatea una fecha
 * @param {Date|string} date - Fecha a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat('es-AR', defaultOptions).format(dateObj);
};

/**
 * Formatea una fecha y hora
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateada
 */
export const formatDateTime = date => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea una fecha relativa (hace X tiempo)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha relativa
 */
export const formatRelativeDate = date => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace unos segundos';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `Hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
};

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a agregar (default: '...')
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalizeWords = text => {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Capitaliza solo la primera letra
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalizeFirst = text => {
  if (!text || typeof text !== 'string') return '';

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formatea un email ocultando parte del dominio
 * @param {string} email - Email a formatear
 * @returns {string} - Email formateado
 */
export const formatEmail = email => {
  if (!email || typeof email !== 'string') return '';

  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const maskedLocal =
    localPart.length > 2
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;

  return `${maskedLocal}@${domain}`;
};

/**
 * Formatea un número de teléfono
 * @param {string} phone - Teléfono a formatear
 * @returns {string} - Teléfono formateado
 */
export const formatPhone = phone => {
  if (!phone || typeof phone !== 'string') return '';

  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Formatear según la longitud
  if (cleaned.length === 10) {
    // Formato: (011) 1234-5678
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('54')) {
    // Formato: +54 (011) 1234-5678
    return `+54 (${cleaned.substring(2, 5)}) ${cleaned.substring(5, 9)}-${cleaned.substring(9)}`;
  }

  return phone; // Devolver original si no coincide con patrones conocidos
};

/**
 * Formatea el tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @param {number} decimals - Número de decimales
 * @returns {string} - Tamaño formateado
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear (0-1 o 0-100)
 * @param {boolean} isDecimal - Si el valor está en formato decimal (0-1)
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (value, isDecimal = false) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';

  const percentage = isDecimal ? value * 100 : value;
  return `${Math.round(percentage)}%`;
};

/**
 * Formatea una URL para mostrar
 * @param {string} url - URL a formatear
 * @returns {string} - URL formateada
 */
export const formatUrl = url => {
  if (!url || typeof url !== 'string') return '';

  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
};

/**
 * Formatea el estado de un pedido
 * @param {string} status - Estado del pedido
 * @returns {object} - { text: string, color: string, icon: string }
 */
export const formatOrderStatus = status => {
  const statusMap = {
    pending: {
      text: 'Pendiente',
      color: '#f59e0b',
      icon: '⏳',
    },
    approved: {
      text: 'Aprobado',
      color: '#10b981',
      icon: '✅',
    },
    rejected: {
      text: 'Rechazado',
      color: '#ef4444',
      icon: '❌',
    },
    cancelled: {
      text: 'Cancelado',
      color: '#6b7280',
      icon: '🚫',
    },
    refunded: {
      text: 'Reembolsado',
      color: '#8b5cf6',
      icon: '💰',
    },
  };

  return (
    statusMap[status] || {
      text: capitalizeFirst(status),
      color: '#6b7280',
      icon: '❓',
    }
  );
};

/**
 * Formatea el nivel de usuario
 * @param {number} points - Puntos del usuario
 * @returns {object} - { level: string, color: string, icon: string, discount: number }
 */
export const formatUserLevel = points => {
  if (points >= 100) {
    return {
      level: 'Oro',
      color: '#ffd700',
      icon: '🥇',
      discount: 15,
    };
  } else if (points >= 50) {
    return {
      level: 'Plata',
      color: '#c0c0c0',
      icon: '🥈',
      discount: 10,
    };
  } else if (points >= 25) {
    return {
      level: 'Bronce',
      color: '#cd7f32',
      icon: '🥉',
      discount: 5,
    };
  } else {
    return {
      level: 'Sin nivel',
      color: '#6b7280',
      icon: '⭐',
      discount: 0,
    };
  }
};

export default {
  formatPrice,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  truncateText,
  capitalizeWords,
  capitalizeFirst,
  formatEmail,
  formatPhone,
  formatFileSize,
  formatPercentage,
  formatUrl,
  formatOrderStatus,
  formatUserLevel,
};
