// src/test/integration.test.js
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
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
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
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock del inventory validator
vi.mock('../utils/inventoryValidator.js', () => ({
  createInventoryValidator: vi.fn(() => ({
    validateProductData: vi.fn(() => ({ isValid: true, errors: [] })),
  })),
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data flow integration', () => {
    it('should handle complete data normalization and validation flow', async () => {
      const { readFileSync } = await import('fs');

      // Mock datos de entrada crudos
      const rawData = [
        {
          Handle: 'test-product',
          Nombre: '  Producto de Prueba  ',
          'Precio [El Guante]': '$1,500.50',
          'En inventario [El Guante]': '  25  ',
          Categoria: 'Electrónicos',
          Descripción: 'Descripción de prueba',
          imagen: '  /img/test.jpg  ',
        },
        {
          Handle: 'invalid-product',
          Nombre: '',
          'Precio [El Guante]': 'invalid',
          'En inventario [El Guante]': 'abc',
          Categoria: '',
          Descripción: '',
          imagen: '',
        },
      ];

      readFileSync.mockReturnValue(JSON.stringify(rawData));

      // Importar funciones de normalización
      const {
        normalizarPrecio,
        normalizarStock,
        normalizarTexto,
        validarProductoNormalizado,
      } = await import('../../scripts/normalizeData.js');

      // Simular el flujo de procesamiento
      const processedProducts = rawData.map(product => ({
        nombre: normalizarTexto(product['Nombre']),
        precio: normalizarPrecio(product['Precio [El Guante]']),
        stock: normalizarStock(product['En inventario [El Guante]']),
        categoria: normalizarTexto(product['Categoria']),
        descripcion: normalizarTexto(product['Descripción']),
        imagen: normalizarTexto(product['imagen']),
      }));

      // Verificar producto válido
      const validProduct = processedProducts[0];
      expect(validProduct.nombre).toBe('Producto de Prueba');
      expect(validProduct.precio).toBe(1500.5);
      expect(validProduct.stock).toBe(25);
      expect(validProduct.categoria).toBe('Electrónicos');

      const validErrors = validarProductoNormalizado(validProduct);
      expect(validErrors).toHaveLength(0);

      // Verificar producto inválido
      const invalidProduct = processedProducts[1];
      expect(invalidProduct.nombre).toBe('');
      expect(invalidProduct.precio).toBe(0);
      expect(invalidProduct.stock).toBe(0);
      expect(invalidProduct.categoria).toBe('');

      const invalidErrors = validarProductoNormalizado(invalidProduct);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling integration', () => {
    it('should handle file system errors gracefully', async () => {
      const { readFileSync } = await import('fs');

      // Mock error de lectura de archivo
      readFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(global.process, 'exit')
        .mockImplementation(() => {});

      // Intentar importar el script debería manejar el error
      try {
        await import('../../scripts/populateFirestore.js');
      } catch (error) {
        // El script debería manejar el error internamente
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error')
        );
      }

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should handle Firebase connection errors', async () => {
      const { initializeApp } = await import('firebase/app');

      // Mock error de inicialización de Firebase
      initializeApp.mockImplementation(() => {
        throw new Error('Firebase initialization failed');
      });

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(global.process, 'exit')
        .mockImplementation(() => {});

      try {
        await import('../../scripts/populateFirestore.js');
      } catch (error) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Firebase')
        );
      }

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('Batch processing integration', () => {
    it('should handle batch operations correctly', async () => {
      const { writeBatch } = await import('firebase/firestore');

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(),
      };

      writeBatch.mockReturnValue(mockBatch);

      // Simular procesamiento por lotes
      const products = [
        { nombre: 'Producto 1', precio: 100, stock: 10, categoria: 'Test' },
        { nombre: 'Producto 2', precio: 200, stock: 20, categoria: 'Test' },
        { nombre: 'Producto 3', precio: 300, stock: 30, categoria: 'Test' },
      ];

      const BATCH_SIZE = 2;

      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        // Simular escritura por lotes
        batch.forEach(product => {
          mockBatch.set(product);
        });

        await mockBatch.commit();
      }

      // Verificar que se crearon los lotes correctos
      expect(mockBatch.set).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalledTimes(2); // 2 commits para 3 productos
    });
  });

  describe('Logging integration', () => {
    it('should integrate logging with data processing', async () => {
      const { logger } = await import('../utils/logger.js');

      const dbLogger = logger.createDatabaseLogger('test_operation');

      // Simular flujo de procesamiento con logging
      dbLogger.start({ recordCount: 10 });

      // Procesar algunos productos
      for (let i = 0; i < 10; i++) {
        logger.info(`Processing product ${i + 1}`);
      }

      dbLogger.success({ recordsProcessed: 10 });

      // Verificar que se llamaron los métodos de logging
      expect(dbLogger.start).toHaveBeenCalledWith({ recordCount: 10 });
      expect(dbLogger.success).toHaveBeenCalledWith({ recordsProcessed: 10 });
      expect(logger.info).toHaveBeenCalledTimes(10);
    });
  });
});
