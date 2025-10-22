// src/utils/imageOptimizer.js
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { app } from '../firebase';

const storage = getStorage(app);

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  // Calidades para diferentes formatos
  webp: {
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 800,
  },
  jpeg: {
    quality: 0.85,
    maxWidth: 800,
    maxHeight: 800,
  },
  png: {
    quality: 0.9,
    maxWidth: 800,
    maxHeight: 800,
  },

  // Tamaños para diferentes usos
  sizes: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  },
};

// Función para comprimir imagen usando Canvas API
export const compressImage = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      const { maxWidth = 800, maxHeight = 800, quality = 0.8 } = options;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar y comprimir
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          resolve(blob);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Error cargando imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Función para convertir imagen a WebP
export const convertToWebP = async file => {
  try {
    const compressedBlob = await compressImage(file, OPTIMIZATION_CONFIG.webp);
    return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
      type: 'image/webp',
    });
  } catch (error) {
    console.error('Error convirtiendo a WebP:', error);
    return file; // Retornar archivo original si falla
  }
};

// Función para generar múltiples tamaños de imagen
export const generateImageSizes = async file => {
  const sizes = {};

  for (const [sizeName, dimensions] of Object.entries(
    OPTIMIZATION_CONFIG.sizes
  )) {
    try {
      const compressedBlob = await compressImage(file, {
        ...dimensions,
        quality: OPTIMIZATION_CONFIG.webp.quality,
      });

      sizes[sizeName] = new File(
        [compressedBlob],
        `${file.name.replace(/\.[^/.]+$/, '')}_${sizeName}.webp`,
        { type: 'image/webp' }
      );
    } catch (error) {
      console.error(`Error generando tamaño ${sizeName}:`, error);
    }
  }

  return sizes;
};

// Función para subir imagen optimizada a Firebase Storage
export const uploadOptimizedImage = async (file, path = 'products/') => {
  try {
    // Convertir a WebP
    const optimizedFile = await convertToWebP(file);

    // Generar nombre único
    const timestamp = Date.now();
    const fileName = `${timestamp}_${optimizedFile.name}`;
    const fullPath = `${path}${fileName}`;

    // Subir a Firebase Storage
    const storageRef = ref(storage, fullPath);
    const snapshot = await uploadBytes(storageRef, optimizedFile);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      originalName: file.name,
      optimizedName: fileName,
      path: fullPath,
      url: downloadURL,
      size: optimizedFile.size,
      type: optimizedFile.type,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error subiendo imagen optimizada:', error);
    throw error;
  }
};

// Función para subir múltiples tamaños de imagen
export const uploadImageSizes = async (file, path = 'products/') => {
  try {
    const sizes = await generateImageSizes(file);
    const uploadedSizes = {};

    for (const [sizeName, sizeFile] of Object.entries(sizes)) {
      const uploadResult = await uploadOptimizedImage(
        sizeFile,
        `${path}sizes/`
      );
      uploadedSizes[sizeName] = uploadResult;
    }

    return uploadedSizes;
  } catch (error) {
    console.error('Error subiendo tamaños de imagen:', error);
    throw error;
  }
};

// Función para eliminar imagen de Firebase Storage
export const deleteImage = async path => {
  try {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    return false;
  }
};

// Función para obtener información de imagen
export const getImageInfo = file => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  };
};

// Función para validar imagen
export const validateImage = file => {
  const errors = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    errors.push('Tipo de archivo no permitido. Use JPEG, PNG o WebP.');
  }

  if (file.size > maxSize) {
    errors.push('Archivo demasiado grande. Máximo 5MB.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Función principal para optimizar y subir imagen
export const optimizeAndUploadImage = async (file, options = {}) => {
  const { path = 'products/', generateSizes = false, onProgress } = options;

  try {
    // Validar imagen
    const validation = validateImage(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    onProgress && onProgress({ status: 'validating', progress: 10 });

    // Optimizar imagen
    onProgress && onProgress({ status: 'optimizing', progress: 30 });
    const optimizedFile = await convertToWebP(file);

    onProgress && onProgress({ status: 'uploading', progress: 60 });

    // Subir imagen principal
    const uploadResult = await uploadOptimizedImage(optimizedFile, path);

    onProgress && onProgress({ status: 'processing', progress: 80 });

    let sizesResult = null;
    if (generateSizes) {
      sizesResult = await uploadImageSizes(file, path);
    }

    onProgress && onProgress({ status: 'completed', progress: 100 });

    return {
      main: uploadResult,
      sizes: sizesResult,
      originalInfo: getImageInfo(file),
      optimizedInfo: getImageInfo(optimizedFile),
    };
  } catch (error) {
    onProgress && onProgress({ status: 'error', error: error.message });
    throw error;
  }
};

export { OPTIMIZATION_CONFIG };
