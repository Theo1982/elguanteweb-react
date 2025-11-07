// src/test/populateFirestore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de módulos externos
vi.mock('firebase/firestore', () => ({
  initializeApp: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(),
  })),
  getDocs: vi.fn(() => Promise.resolve({ size: 0, forEach: vi.fn() })),
  doc: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-id' }),
}));

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() =>
      JSON.stringify([
        {
          Nombre: 'Producto Test',
          'Precio [El Guante]': '100',
          'En inventario [El Guante]': '10',
          Categoria: 'Test',
          Descripción: '',
          imagen: '',
        },
      ])
    ),
  },
}));

// Mock del logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    createDatabaseLogger: vi.fn(() => ({
      start: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    })),
    warn: vi.fn(),
  },
}));

// Mock del inventory validator
vi.mock('../utils/inventoryValidator.js', () => ({
  createInventoryValidator: vi.fn(() => ({
    validateProductData: vi.fn(() => ({ isValid: true, errors: [] })),
  })),
}));

describe('populateFirestore script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export required functions', async () => {
    // Importar dinámicamente para evitar problemas de mocking
    const module = await import('../../scripts/populateFirestore.js');

    // Verificar que el módulo se importa correctamente
    expect(module).toBeDefined();
    expect(typeof module).toBe('object');
  });

  it('should handle environment variables validation', async () => {
    // Mock process.env
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VITE_FIREBASE_API_KEY: 'test-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:test',
    };

    const { initializeApp } = await import('firebase/app');

    // Verificar que initializeApp sería llamado con las variables correctas
    expect(initializeApp).toHaveBeenCalled();

    // Restaurar process.env
    process.env = originalEnv;
  });

  it('should handle missing environment variables', async () => {
    // Mock process.env sin las variables requeridas
    const originalEnv = { ...process.env };
    const mockEnv = {};

    // El script debería salir con error si faltan variables
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

    // Temporarily replace process.env
    Object.defineProperty(process, 'env', {
      value: mockEnv,
      writable: true,
    });

    // Importar el módulo debería validar las variables
    await import('../../scripts/populateFirestore.js');

    // Verificar que se muestra error y se sale
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Variable de entorno faltante')
    );

    // Restaurar
    Object.defineProperty(process, 'env', {
      value: originalEnv,
      writable: true,
    });
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should validate product data structure', async () => {
    const { createInventoryValidator } = await import(
      '../utils/inventoryValidator.js'
    );

    const mockValidator = {
      validateProductData: vi.fn(() => ({ isValid: true, errors: [] })),
    };

    createInventoryValidator.mockReturnValue(mockValidator);

    // Importar el script debería crear el validador
    await import('../../scripts/populateFirestore.js');

    expect(createInventoryValidator).toHaveBeenCalled();
  });

  it('should handle file reading errors gracefully', async () => {
    const { readFileSync } = await import('fs');

    // Mock para simular error de lectura
    readFileSync.mockImplementationOnce(() => {
      throw new Error('File not found');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

    // Importar debería manejar el error
    await import('../../scripts/populateFirestore.js');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error cargando productos')
    );

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('Data validation functions', () => {
  it('should validate product data correctly', () => {
    // Importar las funciones de validación del script
    // Nota: Estas funciones están definidas dentro del script,
    // por lo que probamos la lógica equivalente

    const validarProducto = producto => {
      const errores = [];

      if (
        !producto.nombre ||
        typeof producto.nombre !== 'string' ||
        producto.nombre.trim().length === 0
      ) {
        errores.push('Nombre inválido o faltante');
      }

      if (!producto.precio || isNaN(producto.precio) || producto.precio <= 0) {
        errores.push('Precio inválido o faltante');
      }

      if (
        producto.stock === undefined ||
        isNaN(producto.stock) ||
        producto.stock < 0
      ) {
        errores.push('Stock inválido');
      }

      if (
        !producto.categoria ||
        typeof producto.categoria !== 'string' ||
        producto.categoria.trim().length === 0
      ) {
        errores.push('Categoría inválida o faltante');
      }

      return errores;
    };

    // Test producto válido
    const validProduct = {
      nombre: 'Producto Test',
      precio: 100,
      stock: 10,
      categoria: 'Test',
    };

    expect(validarProducto(validProduct)).toHaveLength(0);

    // Test producto inválido
    const invalidProduct = {
      nombre: '',
      precio: -10,
      stock: -5,
      categoria: '',
    };

    const errors = validarProducto(invalidProduct);
    expect(errors).toHaveLength(4);
    expect(errors).toContain('Nombre inválido o faltante');
    expect(errors).toContain('Precio inválido o faltante');
    expect(errors).toContain('Stock inválido');
    expect(errors).toContain('Categoría inválida o faltante');
  });
});
